# Fase 5 — Iteración 7: diagnóstico de configuración PostgreSQL del backend

## Identificación

- Proyecto: CleanQuote Pro — Expo Clean Ecuador 2026.
- Fase: 5.
- Iteración: 7.
- Fecha: 2026-10-16.
- Snapshot anterior: `md/fase-5-6.md`.
- Este archivo es nuevo; no se sobrescribió ningún snapshot anterior.
- Objetivo de esta iteración: distinguir una configuración local ausente de un fallo genérico de PostgreSQL y exponer el estado de forma segura.
- Fase 2: no iniciada.

## Resumen ejecutivo técnico

La causa comprobada del mensaje de indisponibilidad fue local y determinista:

1. No existe `.env` en la raíz del proyecto.
2. `DB_PASSWORD` no está presente en el entorno del proceso Node.
3. `SESSION_SECRET` tampoco está presente en el entorno del proceso Node.
4. `server/db.js` cargaba `.env` desde la raíz correcta, pero construía el `pg.Pool` con `password: undefined` y dejaba que la conexión fallara con el error genérico `DATABASE_UNAVAILABLE`.

No se inventó una contraseña, no se imprimieron valores sensibles y no se modificó PostgreSQL, Tailscale, firewall, `pg_hba.conf` ni el frontend.

La corrección consiste en que `query()` y `withTransaction()` llamen a `assertDatabasePasswordConfigured()` antes de intentar abrir una conexión. Si `DB_PASSWORD` falta o está vacío, el backend responde HTTP 503 con:

```json
{
  "error": {
    "code": "DB_PASSWORD_NOT_CONFIGURED",
    "message": "DB_PASSWORD_NOT_CONFIGURED"
  }
}
```

El mensaje no contiene contraseña, `connectionString`, `SESSION_SECRET`, stack trace ni variables completas del entorno. `GET /api/health/db` continúa ejecutando la consulta real cuando existe configuración, y valida que la identidad sea `al_bd`/`al_app`.

## Estado general de implementación

| Capacidad | Estado | Qué existe hoy | Qué todavía no existe o no fue verificado |
|---|---|---|---|
| Servidor Node/Express | IMPLEMENTADO Y FUNCIONAL | `npm start` ejecuta `node server/server.js`; escucha en `127.0.0.1:8000` | Despliegue productivo |
| Carga de configuración | IMPLEMENTADO Y FUNCIONAL | `dotenv.config({ path: <raíz>/.env })` en `server/db.js` | `.env` local real no existe en esta máquina |
| Guardia de `DB_PASSWORD` | IMPLEMENTADO Y FUNCIONAL | `DatabasePasswordNotConfigured` y `assertDatabasePasswordConfigured()` | Ninguno dentro del caso de contraseña ausente |
| Pool `pg` | IMPLEMENTADO PARCIALMENTE | `new Pool(DB_CONFIG)`, timeout de 1500 ms y sanitización | Conexión exitosa contra PostgreSQL no ejecutable sin contraseña |
| `GET /api/health` | IMPLEMENTADO Y FUNCIONAL | Ruta independiente de PostgreSQL que responde `{status:"ok"}` | — |
| `GET /api/health/db` | IMPLEMENTADO PARCIALMENTE | Consulta de identidad y respuesta 503 sanitizada cuando falta contraseña | Respuesta 200 con `al_bd`/`al_app` no verificada |
| Login contra PostgreSQL | IMPLEMENTADO PARCIALMENTE | `POST /api/login`, `authenticate()`, JOIN `users`/`roles`, `active`, `bcrypt.compare()` | Login válido con una cuenta real no verificado |
| Sesión | IMPLEMENTADO PARCIALMENTE | `express-session`, cookie `HttpOnly`, `SameSite=Lax`, `userId` en sesión | `MemoryStore` no persistente; `SESSION_SECRET` faltante genera secreto efímero por proceso |
| Respuesta segura de usuario | IMPLEMENTADO Y FUNCIONAL | `safeUser()` excluye `password_hash`; el navegador recibe rol y permisos serializados | — |
| Seed de usuarios | IMPLEMENTADO Y FUNCIONAL | No existe `server/seed-users.js` ni `seed:users` | Ninguna creación automática, por diseño |
| Fallback `mockDB` | IMPLEMENTADO Y FUNCIONAL | `mockDB`, `hydrateStateFromMockDB()` y renderers locales permanecen en `index.html` | Persistencia local entre reinicios |
| RBAC de servidor | NO IMPLEMENTADO | `requireAuth()` valida solo sesión | `requirePermission()` y respuestas 403 por permiso |
| RBAC de cliente | IMPLEMENTADO PARCIALMENTE | `rolePermissions`, `hasPermission()` y guards de vistas/acciones | No es una autoridad de seguridad frente a un cliente manipulado |
| Workflow local | IMPLEMENTADO PARCIALMENTE | Estados, transiciones, decisiones y cambios de estado en `index.html` | Enforcement server-side y persistencia remota completa |
| Auditoría local | IMPLEMENTADO PARCIALMENTE | `auditLog`, `logAuditEvent()` y renderer de auditoría | Audit trail remoto e inmutable |

## Cómo funciona actualmente

`package.json` define `npm start` como `node server/server.js`. `server/server.js` sirve `index.html` en `/` y registra la API en el mismo origen; el navegador no abre conexiones PostgreSQL.

Al importar `server/db.js`, `dotenv` busca exactamente `<raíz del proyecto>/.env`. `DB_CONFIG` toma `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` desde `process.env`; los cuatro primeros conservan los valores por defecto del proyecto (`desktop-o7rhpvg.taila61603.ts.net`, `5432`, `al_bd`, `al_app`) y `DB_PASSWORD` no tiene contraseña alternativa.

`GET /api/health/db` llama a `databaseIdentity()`. Esta función usa `query()` para ejecutar:

```sql
SELECT current_database() AS database_name,
       current_user AS user_name
```

Después, `server/server.js` exige `database === "al_bd"` y `user === "al_app"`. Una identidad distinta produce `DATABASE_IDENTITY_MISMATCH` con HTTP 503. Un error de `pg` que no sea un `ApiError` se convierte en `DATABASE_UNAVAILABLE` y no expone detalles de conexión.

En esta iteración, la ausencia de contraseña se detecta antes de `pool.query()` o `pool.connect()`, por lo que el navegador recibe el código técnico específico `DB_PASSWORD_NOT_CONFIGURED` en lugar del error genérico.

El login real mantiene este recorrido: `login-form` → `apiClient.login()` → `POST /api/login` → `authenticate()` → consulta parametrizada de `users` con JOIN a `roles` → validación de `active` → `bcrypt.compare()` → regeneración de sesión → `apiClient.getMe()` → `findUserById()` → `safeUser()`.

## Arquitectura global

```text
index.html
    │ fetch() same-origin /api
    ▼
Node.js + Express en 127.0.0.1:8000
    │ express-session + bcrypt
    ▼
pg Pool
    │ DB_PASSWORD solo en el proceso Node
    ▼
desktop-o7rhpvg.taila61603.ts.net:5432 por Tailscale Serve
    ▼
PostgreSQL local de la torre: al_bd / al_app
```

La topología no fue cambiada. No se usa `0.0.0.0`, LAN, port forwarding, IP pública, Tailscale Funnel, Python, Flask, Vite ni un segundo backend.

## Estructura física del proyecto

- `index.html`: SPA Vanilla JS; contiene login, `mockDB`, `appState`, catálogo, presupuesto, workflow local, escenarios locales, documentos estructurales, auditoría local, event delegation y Chart.js CDN.
- `server/server.js`: Express, sesión, entrega de la SPA, health, autenticación, logout y rutas protegidas.
- `server/db.js`: carga de dotenv, `DB_CONFIG`, `Pool`, `assertDatabasePasswordConfigured()`, `query()`, `withTransaction()`, `databaseIdentity()` y validaciones SQL auxiliares.
- `server/errors.js`: `ApiError`, `DatabaseUnavailable`, `DatabasePasswordNotConfigured`, `ResourceNotFound` y errores de esquema.
- `server/auth.js`: `USER_SELECT`, `findUserByEmail()`, `findUserById()`, `authenticate()`, `safeUser()` y `safeUserRow()`.
- `server/repositories/core-repository.js`: lecturas de roles, usuarios, clientes y proyectos.
- `server/repositories/apu-repository.js`: lecturas de APUs y desglose.
- `server/repositories/budget-repository.js`: lectura y mutaciones de presupuesto mediante transacciones.
- `server/migrations/001_add_password_hash.sql`: migración versionada de `users.password_hash`; no se ejecuta automáticamente.
- `.env.example`: nombres de configuración esperados, sin secretos reales.
- `.gitignore`: ignora `.env` y archivos de runtime.
- `tests/server-contract.test.js`: contratos HTTP, seguridad del frontend y ausencia del seed.
- `md/fase-5-7.md`: este snapshot.

`src/` y `dist/` siguen presentes como código/salida paralelos, pero `npm start` no los monta. El runtime vigente es `index.html` servido directamente por Express.

## Datos y modelos actuales

### Configuración Node

`DB_CONFIG` contiene `host`, `port`, `database`, `user`, `password` y `connectionTimeoutMillis`. Los valores observados sin `.env` fueron:

| Variable | Estado observado | Tratamiento actual |
|---|---|---|
| `DB_HOST` | FALTA | Se usa el host por defecto conocido del proyecto |
| `DB_PORT` | FALTA | Se usa `5432` |
| `DB_NAME` | FALTA | Se usa `al_bd` |
| `DB_USER` | FALTA | Se usa `al_app` |
| `DB_PASSWORD` | FALTA | `DB_PASSWORD_NOT_CONFIGURED`; no hay fallback |
| `SESSION_SECRET` | FALTA | `server.js` genera un secreto aleatorio por proceso |

No existe `.env` local. `.env.example` se mantiene como plantilla y no contiene valores reales.

### Identidad y autenticación

La consulta `USER_SELECT` obtiene `u.id`, `u.name`, `u.email`, `u.active`, `u.password_hash` y columnas de `roles`. `password_hash` se utiliza únicamente dentro de `authenticate()` y no se copia a `safeUser()`.

El backend no crea usuarios, no resetea contraseñas y no ejecuta `INSERT INTO users` ni `UPDATE users`. La ausencia de `server/seed-users.js` y de `seed:users` se conserva deliberadamente.

### Estado de la SPA

`mockDB` contiene usuarios, roles, clientes, proyectos, APUs, presupuestos, documentos, comentarios, approvals, firmas, `auditLog` y referencias de precios. `appState.data` es la colección normalizada que consumen los renderers. `Object.defineProperties()` mantiene aliases como `activeView`, `apuCatalog`, `auditLog`, `documents`, `comments`, `signatures` y `roles`.

Las estructuras `approvals`, `comments`, `documents`, `scenarios` y `auditLog` son datos/lógica local. Su existencia no implica que exista persistencia, revisión remota, documento legal real o aprobación segura en el servidor.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| Configuración dotenv | IMPLEMENTADO Y FUNCIONAL | `dotenv.config({path: path.join(PROJECT_ROOT, ".env")})` | No visible | Carga al importar `db.js` | Inspección y arranque | Actual |
| Configuración de contraseña obligatoria | IMPLEMENTADO Y FUNCIONAL | `DatabasePasswordNotConfigured`, `assertDatabasePasswordConfigured()` | Error API sanitizado | `health/db` responde 503 específico | Test y HTTP ejecutado | Actual |
| Pool PostgreSQL | IMPLEMENTADO PARCIALMENTE | `new Pool(DB_CONFIG)` y timeout 1500 ms | No visible | Se usa desde `query()`/`withTransaction()` | Inspección; conexión real no ejecutada | Actual |
| Identidad PostgreSQL | IMPLEMENTADO PARCIALMENTE | `databaseIdentity()` con `current_database()`/`current_user` | No hay pantalla propia | `GET /api/health/db` valida identidad | Inspección; camino sin password ejecutado | Actual |
| Health independiente | IMPLEMENTADO Y FUNCIONAL | `app.get("/api/health")` | No requiere login | Responde 200 sin DB | HTTP ejecutado | Actual |
| Login | IMPLEMENTADO PARCIALMENTE | `authenticate()`, JOIN y bcrypt | `login-form` | Login inválido responde 400/401; login válido requiere DB | Inspección y contrato inválido | Actual |
| Sesión | IMPLEMENTADO PARCIALMENTE | `regenerateSession()`, `saveSession()`, `destroySession()` | Login/logout | Guarda `userId` y limpia cookie | HTTP de sesión no autenticada y logout inválido | Actual |
| Respuesta segura | IMPLEMENTADO Y FUNCIONAL | `safeUser()` y `safeUserRow()` | Header y estado de sesión | No devuelve hash | Inspección y tests de ausencia | Actual |
| Seed | IMPLEMENTADO Y FUNCIONAL | Archivo y script ausentes | No existe UI | No crea ni modifica usuarios | Filesystem y test | Actual |
| mockDB/appState | IMPLEMENTADO Y FUNCIONAL | `hydrateStateFromMockDB()` y estado central | Dashboard, catálogo y presupuesto | Demo local opera en memoria | Inspección del runtime frontend | Fase 1 |
| Catálogo/APUs | IMPLEMENTADO Y FUNCIONAL | Dataset y `renderApuCatalog()` | Búsqueda, filtros y detalle | Interacción local | Inspección del código frontend | Fase 1 |
| Cálculo de presupuesto | IMPLEMENTADO Y FUNCIONAL | `calculateTotalsFromItems()`, `calculateBudgetTotals()` | Tabla, resumen y settings | Cantidad/precios/porcentajes recalculan | Inspección y parseo; navegador no automatizado | Fase 1 |
| Permisos de cliente | IMPLEMENTADO PARCIALMENTE | `rolePermissions`, `hasPermission()` | Guards de vistas/acciones | Bloquea acciones locales por rol | Inspección; no es seguridad server-side | Fase 2 transversal |
| RBAC de servidor | NO IMPLEMENTADO | Solo `requireAuth()` | No hay UI adicional | No existen 403 por permiso | Inspección | Fase 2 |
| Workflow local | IMPLEMENTADO PARCIALMENTE | `workflowTransitions`, `changeWorkflowStage()` | Vista Workflow | Cambia estado local y genera auditoría | Inspección | Fases 2–5 |
| Aprobaciones | IMPLEMENTADO PARCIALMENTE | `createApprovalRecord()` | Acciones locales de revisión | Añade records en memoria | Inspección; no persistencia segura | Fases 2–5 |
| Documentos/portal/legal | PLACEHOLDER ESTRUCTURAL | Arrays, renderers y vistas locales | Secciones demo | No genera/almacena documentos reales | Inspección | Fase 4 |
| Dashboard/audit trail | IMPLEMENTADO PARCIALMENTE | KPIs, Chart.js, `logAuditEvent()` | Dashboard y auditoría local | Calcula y renderiza memoria | Inspección; no audit trail remoto | Fase 5 |

## Roles y estado RBAC

El backend obtiene el rol desde PostgreSQL mediante `users.role_id` y el JOIN de `USER_SELECT`. No acepta el rol desde el navegador. La SPA además contiene `rolePermissions` y `hasPermission()`, pero esos guards viven en `index.html` y no pueden proteger una API frente a un cliente manipulado.

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí, en `mockDB.roles` y en `roles` remoto esperado | Parcial: `hasPermission()` local; `requireAuth()` remoto no evalúa permisos | Catálogo, presupuesto, settings y vistas internas | Puede editar el demo local cuando el guard local lo permite | IMPLEMENTADO PARCIALMENTE |
| Revisor Técnico | Sí | Parcial: permisos de revisión en `rolePermissions`; sin 403 server-side | Workflow y revisión local | Puede ejecutar decisión local si el guard lo permite | IMPLEMENTADO PARCIALMENTE |
| Director Financiero | Sí | Parcial: permisos financieros locales; sin evaluación remota | Workflow, escenarios, riesgo y dashboard | Puede ejecutar acciones locales del demo | IMPLEMENTADO PARCIALMENTE |
| Gerente General | Sí | Parcial: permisos gerenciales locales; sin evaluación remota | Workflow, dashboard y firma demo | Puede ejecutar acciones locales del demo | IMPLEMENTADO PARCIALMENTE |
| Cliente | Sí | Parcial: permisos de portal locales; sin autorización server-side específica | Portal cliente y propuesta demo | Puede interactuar con estructuras locales si el guard lo permite | IMPLEMENTADO PARCIALMENTE |
| Oficial Legal | Sí | Parcial: permisos legales locales; sin autorización server-side específica | Documentos y legal demo | Puede interactuar con estructuras locales si el guard lo permite | IMPLEMENTADO PARCIALMENTE |

No existe hoy `requirePermission()` en Express, ni una prueba negativa por rol contra endpoints protegidos. La Fase 2 debe añadir esa autoridad en backend; esta iteración no la implementa.

## Componentes principales

### Backend

| Componente | Archivo | Responsabilidad | Entradas/salidas |
|---|---|---|---|
| Aplicación Express | `server/server.js` | Sirve SPA, registra rutas, crea sesión y serializa errores | HTTP; JSON seguro |
| Configuración DB | `server/db.js` | Carga entorno, crea Pool, valida contraseña, consulta identidad | SQL parametrizado; filas o `ApiError` |
| Autenticación | `server/auth.js` | Busca usuario, comprueba `active`, compara hash y serializa rol | email/password; usuario seguro |
| Repositorio core | `server/repositories/core-repository.js` | Lista recursos de tablas base | sesión; colecciones JSON |
| Repositorio APU | `server/repositories/apu-repository.js` | Lista y obtiene APUs | sesión; APU/array |
| Repositorio presupuesto | `server/repositories/budget-repository.js` | Lee y muta presupuestos/items dentro de transacción | payload validado; JSON de presupuesto |

### Frontend runtime

| Componente | Archivo | Estado interno relevante | Render/DOM |
|---|---|---|---|
| Login | `index.html` | sesión visual y error de formulario | `#login-form`, `#login-error`, `#login-screen` |
| API client | `index.html` | `API_CONFIG`, `apiConnectionState` | `fetch()` relativo a `/api` |
| Estado de aplicación | `index.html` | `appState.data`, `appState.session`, `appState.workflow`, `appState.filters` | Fuente de todos los renderers |
| Catálogo | `index.html` | filtros de APU y catálogo normalizado | `#apuCatalogBody`, `#apuSearch`, `#categoryFilter`, `#unitFilter` |
| Presupuesto | `index.html` | `appState.budget.items`, `settings`, `totals` | `#budgetItemsBody`, `#budgetFooter`, `#budget-summary-container` |
| Workflow | `index.html` | etapa, estado, approvals y comments | `#workflow-view-container`, badges de header/sidebar |
| Dashboard | `index.html` | KPIs y registros de Chart.js | `#dashboard-view-container` y canvas dinámicos |
| Auditoría | `index.html` | `appState.data.auditLog` | `#audit-view-container`, `#auditEventCount` |

No existe una jerarquía React montada por este runtime. `src/` no es consumidor de `npm start`.

## Funciones y utilidades principales

| Función | Archivo | Responsabilidad real | Consume/modifica | Estado |
|---|---|---|---|---|
| `assertDatabasePasswordConfigured()` | `server/db.js` | Rechaza una contraseña ausente o vacía antes de conectar | Lee `DB_CONFIG.password`; no modifica estado | IMPLEMENTADO Y FUNCIONAL |
| `query(text, values)` | `server/db.js` | Ejecuta SQL mediante Pool después de la guardia y sanitiza errores | Lee Pool; devuelve `pg.Result` | IMPLEMENTADO PARCIALMENTE |
| `withTransaction(work)` | `server/db.js` | Abre cliente, ejecuta BEGIN/COMMIT o ROLLBACK y libera | Pool; transacción | IMPLEMENTADO PARCIALMENTE |
| `databaseIdentity()` | `server/db.js` | Lee `current_database()` y `current_user` | Query; devuelve `{database,user}` | IMPLEMENTADO PARCIALMENTE |
| `authenticate(email,password)` | `server/auth.js` | Consulta usuario activo y ejecuta `bcrypt.compare()` | Lee PostgreSQL; no modifica usuarios | IMPLEMENTADO PARCIALMENTE |
| `safeUser(row)` | `server/auth.js` | Produce identidad pública con rol/permisos y omite hash | Lee una fila; no modifica DB | IMPLEMENTADO Y FUNCIONAL |
| `requireAuth()` | `server/server.js` | Resuelve sesión y exige usuario activo | Lee sesión y PostgreSQL | IMPLEMENTADO PARCIALMENTE |
| `regenerateSession()` / `saveSession()` | `server/server.js` | Regenera y guarda sesión tras login | Modifica sesión HTTP | IMPLEMENTADO Y FUNCIONAL |
| `destroySession()` | `server/server.js` | Destruye sesión al salir | Modifica sesión HTTP | IMPLEMENTADO Y FUNCIONAL |
| `hydrateStateFromMockDB()` | `index.html` | Clona datos de demo en `appState.data` | Modifica estado frontend | IMPLEMENTADO Y FUNCIONAL |
| `hasPermission(permission)` | `index.html` | Comprueba el permiso del rol en el cliente | Lee sesión y `rolePermissions` | IMPLEMENTADO PARCIALMENTE |
| `changeWorkflowStage()` | `index.html` | Valida transición local, cambia estado y genera auditoría | Modifica `appState.workflow` y presupuesto | IMPLEMENTADO PARCIALMENTE |
| `logAuditEvent()` | `index.html` | Añade evento a `appState.data.auditLog` y `mockDB.auditLog` | Modifica memoria local | IMPLEMENTADO PARCIALMENTE |

## Relación Estado → Función → Renderer → DOM

| Estado fuente | Función/evento | Renderer | DOM observable |
|---|---|---|---|
| `appState.ui.activeView` | `navigateTo(viewName)` y `handleAppClick()` | `renderCurrentView()`, `updateNavigation()` | `[data-ui-view]`, botones `[data-view]` |
| `appState.session` | `applyAuthenticatedUser()`, `getCurrentRole()` | `renderHeader()`, `renderSidebar()` | `#headerUserName`, `#headerUserRole`, sidebar |
| `appState.data.apus` y `appState.filters` | `handleAppInput()`, `handleAppChange()` | `renderFilters()`, `renderApuCatalog()` | `#apuSearch`, `#categoryFilter`, `#unitFilter`, `#apuCatalogBody` |
| `appState.budget.items` | `addApuToBudget()`, `updateBudgetItemQuantity()` | `renderBudgetItems()`, `renderBudgetSummary()` | `#budgetItemsBody`, `#budgetFooter`, resumen |
| `appState.settings` | `updateEconomicSetting()` | `renderSettings()`, `calculateBudgetTotals()` | `#economic-settings-container`, totales |
| `appState.workflow` | `changeWorkflowStage()`, decisiones | `renderWorkflowView()`, `renderHeader()`, `renderSidebar()` | `#workflow-view-container`, badges de estado |
| `appState.data.approvals/comments` | `createApprovalRecord()`, `addWorkflowComment()` | `renderWorkflowView()` y portal/legal | contenedores de workflow/portal/legal |
| `appState.data.auditLog` | `logAuditEvent()` | `renderAuditView()` | `#audit-view-container`, `#auditEventCount` |
| `appState.data.*` y `appState.budget` | `renderDashboardView()` y gráficos | `renderDashboardCharts()` | `#dashboard-view-container`, canvas Chart.js |

`bindStaticEvents()` concentra la delegación de `click`, `input` y `change`. El login tiene un listener propio en el `ui-layer`; no existe selector artificial de rol en la UI.

## Flujos funcionales end-to-end

### Arranque y health sin PostgreSQL

1. `npm start` ejecuta `node server/server.js`.
2. Express escucha en `127.0.0.1:8000`.
3. `GET /` entrega `index.html`.
4. `GET /api/health` responde `{ "status": "ok" }` sin consultar PostgreSQL.
5. `GET /api/health/db` llama a `databaseIdentity()`.
6. Como `DB_PASSWORD` falta, `assertDatabasePasswordConfigured()` lanza `DatabasePasswordNotConfigured` antes de `pg`.
7. El middleware de error devuelve HTTP 503 con el código técnico, sin secretos.

Este flujo fue `VERIFICADO POR EJECUCIÓN` en la instancia local reiniciada después del cambio.

### Conexión real prevista cuando exista configuración

1. `DB_PASSWORD` debe existir en `.env` o en el entorno del proceso.
2. `query()` permite la llamada al Pool.
3. `databaseIdentity()` ejecuta el `SELECT` de identidad.
4. `/api/health/db` solo responde 200 si la fila devuelve `al_bd` y `al_app`.

Este flujo es `VERIFICADO POR INSPECCIÓN`; no fue ejecutado porque no existe la contraseña local.

### Login real

1. El usuario envía `#login-form`.
2. `apiClient.login()` hace `POST /api/login` con email y contraseña.
3. `server.js` valida el objeto JSON.
4. `authenticate()` ejecuta `findUserByEmail()`, JOIN `users`/`roles`, valida `active` y usa `bcrypt.compare()`.
5. Una coincidencia regenera la sesión, guarda `request.session.userId` y responde `safeUser()`.
6. El frontend ejecuta `apiClient.getMe()` y actualiza `appState.session`.

El caso de cuerpo inválido fue `VERIFICADO POR EJECUCIÓN`. El caso de credencial correcta contra PostgreSQL es `NO VERIFICADO` por falta de `DB_PASSWORD`.

### Fallback local

1. El arranque del frontend conserva `mockDB`.
2. `hydrateStateFromMockDB()` clona las colecciones en `appState.data`.
3. `renderApp()` muestra las vistas locales.
4. Los eventos delegados actualizan estado, recalculan y vuelven a renderizar.

Este flujo fue `VERIFICADO POR INSPECCIÓN` del runtime frontend; no se ejecutó un navegador automatizado en esta iteración.

### Eliminación del seed

1. `package.json` no contiene `seed:users`.
2. `server/seed-users.js` no existe.
3. `npm start` no importa ni ejecuta scripts de seed.
4. Login y `/api/me` solo leen PostgreSQL.

La ausencia fue `VERIFICADA POR EJECUCIÓN` mediante filesystem y tests.

## Estado y gestión de datos

La fuente remota de identidad es PostgreSQL. La fuente local de demo es `mockDB`, clonada a `appState.data`. En modo API, `hydrateStateFromApi()` reemplaza colecciones y presupuesto con respuestas de Express cuando todas las lecturas necesarias responden correctamente; si la API no está disponible, el frontend conserva el fallback local y marca el estado de conexión degradado.

El backend no sincroniza automáticamente `mockDB` con PostgreSQL. Las mutaciones API de presupuesto pasan por `budget-repository.js`; el frontend decide llamar `persistBudgetSnapshot()`, `persistBudgetItemAdd()`, `persistBudgetItemUpdate()` o `persistBudgetItemDelete()` cuando `apiConnectionState === "postgres"`.

## Workflow y aprobaciones

`index.html` define `WORKFLOW_STATUS`, `WORKFLOW_STAGE`, `workflowTransitions`, `getWorkflowTransitionPermission()`, `canTransitionTo()` y `changeWorkflowStage()`. También existen `createApprovalRecord()` y acciones locales de revisión técnica, financiera y gerencial.

Lo que funciona hoy es la mutación local: se valida el permiso del cliente, se cambia `appState.workflow`, se actualiza el presupuesto local, se sincroniza `mockDB` y se registra un evento local. Lo que no existe es validación equivalente en Express, persistencia remota de cada aprobación, identidad server-side por permiso, rechazo HTTP 403 o evidencia de aprobación legal/cliente real.

Estado: `IMPLEMENTADO PARCIALMENTE`.

## Auditoría

`mockDB.auditLog` y `appState.data.auditLog` son arrays de memoria. `logAuditEvent()` crea registros con actor, acción, entidad, descripción, metadata y timestamp; `renderAuditView()` los muestra. El backend no recibe ni persiste estos eventos como audit trail inmutable.

Estado: `IMPLEMENTADO PARCIALMENTE`.

## Dependencias internas

- `express`: servidor HTTP.
- `express-session`: sesión en memoria del proceso.
- `pg`: Pool y consultas PostgreSQL.
- `bcrypt`: comparación de `password_hash`.
- `dotenv`: carga de `.env` de la raíz.
- `Chart.js` por CDN: gráficos del frontend; no fue modificado.
- Node.js con soporte ESM y `fetch` para tests.

No se agregó ninguna dependencia en esta iteración.

## Verificación contra código

Archivos principales revisados:

- `AGENTS.md`, `md/AGENTS.md`, `tests/AGENTS.md` y `md/fase-5-6.md`.
- `package.json`, `.env.example`, `.gitignore` y `index.html`.
- `server/server.js`, `server/db.js`, `server/errors.js`, `server/auth.js`, `server/serializers.js`.
- `server/repositories/core-repository.js`, `apu-repository.js` y `budget-repository.js`.
- `server/migrations/001_add_password_hash.sql`.
- `tests/server-contract.test.js`.

Conexiones encontradas:

- `server.js` importa `databaseIdentity()` y registra `/api/health/db`.
- `databaseIdentity()` consume `query()`.
- `query()` y `withTransaction()` consumen la nueva guardia de contraseña.
- `auth.js` consume `query()` y `bcrypt.compare()`.
- Las rutas de presupuesto consumen `withTransaction()`.
- `index.html` consume las rutas mediante `apiClient` relativo y mantiene `mockDB` como fallback.

Inconsistencias encontradas y corregidas:

1. La ausencia de `DB_PASSWORD` terminaba clasificada como `DATABASE_UNAVAILABLE`, aunque el problema real era configuración faltante. Se añadió `DatabasePasswordNotConfigured` y la guardia previa al Pool.
2. La suite no comprobaba el contrato de `/api/health/db` cuando faltaba la contraseña. Se añadió una prueba que exige HTTP 503 y la respuesta exacta sanitizada.
3. Una instancia previa de `npm start` en el mismo workspace seguía cargando el código anterior durante la primera consulta manual. Se detuvo únicamente esa instancia identificada, se arrancó la versión actual y se verificó el endpoint; no fue un cambio de código ni de infraestructura.

No se encontraron imports rotos ni referencias a `server/seed-users.js` o `seed:users` en el runtime actual. Las menciones históricas en snapshots anteriores se conservaron porque son documentación versionada y no se sobrescriben.

## Verificación funcional

### VERIFICADO POR EJECUCIÓN

- `npm test`: 8 tests passed, 0 failed.
- `node --check` en `server/server.js`, `db.js`, `errors.js`, `auth.js`, `serializers.js` y repositorios: correcto.
- Parseo de los 4 scripts inline de `index.html`: correcto.
- `npm start`: ejecutó `node server/server.js` y escuchó en `127.0.0.1:8000`.
- `GET /api/health`: HTTP 200, `{ "status": "ok" }`.
- `GET /api/health/db` sin `DB_PASSWORD`: HTTP 503, `DB_PASSWORD_NOT_CONFIGURED`, sin secretos.
- `GET /api/me` sin sesión: HTTP 401, `AUTH_REQUIRED`.
- `POST /api/login` con cuerpo vacío: HTTP 400, `INVALID_CREDENTIALS`.
- El listener temporal fue detenido y el puerto 8000 quedó sin listener al terminar.
- `.env` está ignorado por Git.
- El escaneo del frontend y código no encontró credenciales demo ni valores hardcodeados de `DB_PASSWORD`.
- No existe `server/seed-users.js` y no existe el script npm `seed:users`.

### VERIFICADO POR INSPECCIÓN

- `dotenv` se carga desde la raíz del proyecto usando una ruta absoluta derivada de `server/db.js`.
- `DB_PASSWORD` no tiene fallback y la consulta real de identidad usa `current_database()` y `current_user`.
- El login conserva JOIN `users`/`roles`, `active`, `bcrypt.compare()` y serialización segura.
- El código no inserta ni actualiza `users` durante login, `/api/me` o logout.
- La arquitectura mantiene Node en la laptop y PostgreSQL en la torre mediante el hostname Tailscale indicado.

### NO VERIFICADO

- TCP/DNS autenticado hasta el hostname Tailscale.
- Consulta exitosa a PostgreSQL con `current_database() = al_bd` y `current_user = al_app`.
- Login válido con una cuenta existente.
- Lecturas y escrituras reales de APUs/presupuesto contra el esquema remoto.
- Render visual en navegador y ausencia de errores de consola en una sesión autenticada.

### NO APLICA

- Seed de usuarios: fue eliminado por alcance explícito.
- Fase 2 y funcionalidades posteriores: no se implementaron en esta iteración.

## Limitaciones actuales

1. Falta crear el `.env` local y configurar `DB_PASSWORD`; por ello la conexión real no puede probarse.
2. `SESSION_SECRET` también falta. El código actual genera un secreto aleatorio por proceso para permitir el arranque de demo; las sesiones no son estables entre reinicios. No hay un valor hardcodeado.
3. `express-session` usa `MemoryStore`; no es almacenamiento de sesión productivo.
4. El login está conectado al código PostgreSQL, pero su camino exitoso sigue sin evidencia de ejecución real.
5. `requireAuth()` autentica la sesión, pero no aplica permisos de negocio en el servidor.
6. El workflow, aprobaciones, comentarios, documentos, portal, legal, escenarios y audit trail remoto permanecen locales, parciales o estructurales según la matriz; no fueron ampliados.
7. Los snapshots históricos `fase-5-2.md` a `fase-5-5.md` conservan referencias de iteraciones anteriores, incluido el antiguo seed. No se alteraron para preservar la trazabilidad; el runtime actual no contiene ese seed.

## Cambios de esta iteración

1. Se añadió `DatabasePasswordNotConfigured` en `server/errors.js` con HTTP 503 y código/mensaje `DB_PASSWORD_NOT_CONFIGURED`.
2. Se añadió `assertDatabasePasswordConfigured()` en `server/db.js`.
3. `query()` y `withTransaction()` ahora ejecutan la guardia antes de abrir o usar el Pool.
4. Se añadió a `tests/server-contract.test.js` el caso de `/api/health/db` sin contraseña.
5. Se creó este snapshot nuevo en `md/fase-5-7.md` sin modificar `md/fase-5-6.md`.

No se modificaron `index.html`, `server/server.js`, la arquitectura, PostgreSQL, Tailscale, el seed eliminado ni funcionalidades de Fase 2.

## Impacto técnico de esta iteración

### Archivos modificados

- `server/errors.js`.
- `server/db.js`.
- `tests/server-contract.test.js`.

### Archivo creado

- `md/fase-5-7.md`.

### Contratos cambiados

- Cuando falta `DB_PASSWORD`, las operaciones que requieren PostgreSQL responden `503 DB_PASSWORD_NOT_CONFIGURED` en vez de esperar a un error genérico de `pg`.
- Cuando `DB_PASSWORD` existe, el camino de conexión y el contrato de identidad no cambian.

### Comportamiento conservado

- `npm start` y el bind `127.0.0.1:8000`.
- `GET /api/health` independiente de PostgreSQL.
- Login con bcrypt, sesión y JOIN de roles.
- Fallback `mockDB` y UI existente.
- Ausencia de seed y ausencia de mutaciones de usuarios.

### Riesgos de regresión

- Cualquier despliegue sin `DB_PASSWORD` fallará de forma más temprana y explícita, que es el contrato esperado.
- No se modificó el cálculo o render frontend.
- Con una contraseña configurada, todavía debe verificarse el schema remoto y la identidad correcta.

## Compatibilidad

Los nombres públicos existentes de `databaseIdentity()`, `query()`, `withTransaction()`, `/api/health/db`, `/api/login`, `/api/me` y `/api/logout` se conservan. La nueva clase de error solo agrega una clasificación específica para configuración ausente.

El frontend continúa usando rutas relativas, no conoce credenciales y mantiene su fallback local. No se introdujo CORS ni una segunda URL de backend.

## Preparación para siguientes fases

La integración siguiente debe reutilizar el `user` seguro producido por `safeUser()`, la sesión `request.session.userId`, `role.permissions`, los repositorios y los objetos locales de `appState`. Antes de cualquier Fase 2 debe existir una comprobación real de `health/db` con identidad `al_bd`/`al_app`.

La Fase 2, cuando sea autorizada, debe añadir en backend evaluación de permisos por rol, 403 por acción, transiciones persistidas y pruebas negativas por cada rol. No se implementó ninguna de esas piezas aquí.

## Próxima fase

No se inicia Fase 2 en esta iteración. La próxima acción operativa necesaria es configurar localmente `DB_PASSWORD` y `SESSION_SECRET` en `.env`, arrancar el servidor y repetir:

1. `GET /api/health/db` esperando HTTP 200 con `database: "al_bd"` y `user: "al_app"`.
2. Login válido con una cuenta ya existente.
3. `GET /api/me` con la cookie de sesión.
4. Lectura controlada de recursos protegidos.

Solo después de esas verificaciones podrá evaluarse una nueva fase, sin crear usuarios ni resetear contraseñas desde este proyecto.

## Arquitectura Producción / Homelab

La arquitectura documentada para esta demo mantiene Node/Express en la laptop y PostgreSQL autohospedado en la torre. Tailscale Serve publica únicamente el acceso necesario al servicio PostgreSQL; no se añadieron firewall, port forwarding, Funnel, Nginx, Docker, MinIO, SFTP, S3, Redis ni almacenamiento documental.

Los equivalentes objetivo de producción —PostgreSQL autohospedado, MinIO para objetos, DocuSeal para firma, Cal.com, n8n y Keycloak— no fueron instalados ni configurados por esta iteración.

## Contrato para la siguiente iteración

- No introducir contraseñas, hashes ni secretos en `index.html`, JavaScript del navegador, Markdown o logs.
- Mantener `DB_PASSWORD` y `SESSION_SECRET` únicamente en `.env` local o variables del proceso.
- Mantener `GET /api/health/db` como prueba real de identidad, no como un valor simulado.
- No recrear `server/seed-users.js` ni `seed:users`.
- No modificar `users` desde login, `/api/me` o logout.
- No declarar login, PostgreSQL, RBAC o workflow como funcional sin evidencia de ejecución.
- No iniciar Fase 2 hasta que la conexión real y el login válido estén verificados.
