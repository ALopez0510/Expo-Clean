# Fase 5 — Iteración 6: eliminación del seed de usuarios demo

## Identificación

- Proyecto: CleanQuote Pro — Expo Clean Ecuador 2026.
- Fase: 5.
- Iteración: 6.
- Fecha: 2026-10-16.
- Snapshot anterior: md/fase-5-5.md.
- Este archivo es nuevo; los snapshots anteriores no fueron sobrescritos.
- Objetivo único: eliminar el flujo de seed de usuarios porque las seis cuentas ya existen en PostgreSQL.
- Fase 2: no iniciada.

## Resumen ejecutivo técnico

Se inspeccionó el código real y se confirmó que server/seed-users.js solo creaba o actualizaba las seis cuentas. Se eliminó ese archivo y se retiró el script seed:users de package.json.

La autenticación no depende del seed:

- server/server.js recibe POST /api/login.
- server/auth.js consulta users unido a roles.
- authenticate() comprueba active y ejecuta bcrypt.compare(password, row.password_hash).
- La sesión guarda solo userId.
- GET /api/me vuelve a consultar PostgreSQL y devuelve datos seguros.
- POST /api/logout destruye la sesión y no modifica usuarios.

La migración server/migrations/001_add_password_hash.sql se conserva como documentación/versionado del esquema y no se ejecuta en npm start.

Estado:

- IMPLEMENTADO Y FUNCIONAL: eliminación física del seed y del comando npm.
- IMPLEMENTADO Y FUNCIONAL: bcrypt sigue siendo dependencia y se usa durante el login.
- IMPLEMENTADO Y FUNCIONAL: npm start continúa siendo el único comando de runtime.
- IMPLEMENTADO PARCIALMENTE: autenticación contra PostgreSQL; el código está conectado, pero no se verificó un login exitoso porque no hay DB_PASSWORD local.
- PLACEHOLDER ESTRUCTURAL: MemoryStore de express-session.
- NO IMPLEMENTADO: creación, actualización o reset de usuarios desde el servidor.

## Estado general de implementación

| Capacidad | Estado | Qué existe | Qué no existe |
|---|---|---|---|
| Seed de usuarios | IMPLEMENTADO Y FUNCIONAL | No existe archivo ni script de seed | Ninguna creación automática |
| Login PostgreSQL | IMPLEMENTADO PARCIALMENTE | POST /api/login, authenticate(), bcrypt.compare() y JOIN users/roles | Prueba con PostgreSQL real |
| GET /api/me | IMPLEMENTADO PARCIALMENTE | session.userId, findUserById(), active y role/permissions | Ejecución con sesión real de DB |
| Logout | IMPLEMENTADO Y FUNCIONAL | destroySession() y clearCookie() | Store persistente |
| bcrypt | IMPLEMENTADO Y FUNCIONAL | package.json y server/auth.js | — |
| Migración password_hash | IMPLEMENTADO PARCIALMENTE | SQL versionado en server/migrations | Ejecución contra al_bd |
| Frontend login | IMPLEMENTADO PARCIALMENTE | formulario Email/Contraseña y apiClient | Login válido verificado en navegador |
| Runtime | IMPLEMENTADO Y FUNCIONAL | npm start y server/server.js | Despliegue productivo |
| RBAC server-side | NO IMPLEMENTADO | requireAuth() solo valida sesión | requirePermission() y 403 |
| Datos de Fase 1 | IMPLEMENTADO Y FUNCIONAL local | mockDB, appState, 20 APUs, cálculos y renderers | Persistencia completa de demo |

No se modificó la arquitectura Node/Express, PostgreSQL, pg, express-session, bcrypt, Tailwind CDN, Chart.js CDN ni index.html.

## Cómo funciona actualmente

El único flujo de runtime es npm start. package.json ejecuta node server/server.js. Express sirve index.html en / y registra la API en el mismo origen.

El formulario login-form del ui-layer recoge Email y Contraseña. apiClient.login() hace POST /api/login. server/server.js valida el cuerpo y delega en authenticate(). server/auth.js ejecuta una consulta parametrizada por email, obtiene active, password_hash y el rol mediante JOIN, y llama bcrypt.compare().

Si la comparación es correcta, server/server.js regenera la sesión y guarda request.session.userId. No inserta usuarios, no actualiza usuarios y no modifica password_hash. El frontend llama apiClient.getMe(), que llega a GET /api/me; requireAuth() consulta otra vez el usuario activo y devuelve safeUser().

Si la comparación falla, POST /api/login responde 401 INVALID_CREDENTIALS. Si el cuerpo es inválido, responde 400. POST /api/logout destruye la sesión, limpia la cookie y no toca PostgreSQL.

## Arquitectura global

    index.html
       │ HTTP/JSON
       ▼
    Node.js + Express
       │ express-session + bcrypt
       ▼
    pg
       │ DB_PASSWORD solo en entorno del servidor
       ▼
    PostgreSQL al_bd por Tailscale

El servidor está fijado a 127.0.0.1:8000. El navegador no conoce DB_HOST, DB_USER, DB_PASSWORD ni SESSION_SECRET. No existe segundo proceso ni requisito de Vite, React, Python o Flask.

## Estructura física del proyecto

- index.html: SPA Vanilla, login, apiClient, mockDB, appState, engines, renderers, event delegation y Chart.js CDN.
- server/server.js: Express, rutas, sesión, requireAuth() y entrega de index.html.
- server/auth.js: USER_SELECT, findUserByEmail(), findUserById(), authenticate(), safeUser() y safeUserRow().
- server/db.js: dotenv, DB_CONFIG, pg Pool, query(), withTransaction() y databaseIdentity().
- server/repositories/: repositorios core, APU y presupuesto.
- server/migrations/001_add_password_hash.sql: migración conservada.
- .env.example: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD y SESSION_SECRET.
- package.json: start, dev y test; no contiene comando de seed.
- tests/server-contract.test.js: pruebas de runtime, seguridad y ausencia del seed.
- md/fase-5-6.md: este snapshot.

Eliminado en esta iteración:

- server/seed-users.js.

src/ y dist/ se conservan como código/salida paralelos no usados por npm start. No se reintrodujo Vite ni se modificó index.html.

## Datos y modelos actuales

La base remota debe contener users con id, name, role_id, email, active y password_hash, además de roles con id, name y permissions. El backend no crea ni modifica esos datos.

USER_SELECT selecciona password_hash solo para la comparación interna. safeUser() devuelve id, name, email y role. safeUserRow() elimina passwordHash, password y password_hash de filas públicas de users.

La migración es:

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

Se conserva como versionado del esquema. No se importa desde server/server.js y no se ejecuta con npm start.

mockDB y appState siguen disponibles para el funcionamiento local de Fase 1: catálogo de 20 APUs, filtros, presupuesto, cantidades decimales, cálculos, parámetros económicos, workflow local, AuditLog local y renderers.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| Eliminación del seed | IMPLEMENTADO Y FUNCIONAL | No existe server/seed-users.js | No hay control de seed | No se crean cuentas | Ejecución de pruebas y filesystem | Actual |
| Script npm seed | IMPLEMENTADO Y FUNCIONAL | package.json no contiene seed:users | No hay instrucción runtime | npm start es único runtime | Inspección | Actual |
| bcrypt en login | IMPLEMENTADO Y FUNCIONAL | import bcrypt y bcrypt.compare() en auth.js | login-form | Compara password recibida con hash | Inspección y test | Actual |
| Consulta de usuario | IMPLEMENTADO PARCIALMENTE | findUserByEmail() con $1 | apiClient.login() | Busca por email | DB no disponible | Actual |
| active | IMPLEMENTADO PARCIALMENTE | authenticate() y findUserById() | login/me | Rechaza usuario inactivo | Inspección | Actual |
| JOIN de rol | IMPLEMENTADO PARCIALMENTE | USER_SELECT users → roles | applyAuthenticatedUser() | Devuelve role y permissions | DB no disponible | Actual |
| Sesión | IMPLEMENTADO Y FUNCIONAL | regenerateSession(), session.userId | ui-layer | Mantiene identidad sin rol enviado | Test HTTP sin DB | Actual |
| Respuesta segura | IMPLEMENTADO Y FUNCIONAL | safeUser(), safeUserRow() | Header de usuario | No expone hash ni secretos | Inspección y test | Actual |
| Logout | IMPLEMENTADO Y FUNCIONAL | destroySession(), clearCookie() | data-ui-logout | Cierra sesión sin mutar DB | Test HTTP | Actual |
| Migration password_hash | IMPLEMENTADO PARCIALMENTE | server/migrations/001_add_password_hash.sql | No aplica | No se ejecuta automáticamente | Archivo inspeccionado | Actual |
| mockDB/appState | IMPLEMENTADO Y FUNCIONAL | index.html | Dashboard, catálogo y presupuesto | Estado local de Fase 1 | Conservado | Fase 1 |
| Chart.js | IMPLEMENTADO PARCIALMENTE | CDN y chartRegistry | Canvas dinámicos | Gráficos locales | Parseo; navegador no verificado | Fase 5 |
| RBAC backend | NO IMPLEMENTADO | requireAuth() no evalúa permisos | Guards solo locales | No existe 403 por permiso | Inspección | Fase 2 |

## Roles y estado RBAC

Los seis roles siguen declarados en los datos y se esperan desde PostgreSQL. El seed eliminado ya no participa en su creación. La autenticación obtiene el rol por JOIN; sin embargo, Express no evalúa permisos de negocio.

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí | Parcial: guards locales | Catálogo, presupuesto, settings y dashboard | Acciones locales permitidas por hasPermission() | IMPLEMENTADO PARCIALMENTE |
| Revisor Técnico | Sí | Parcial: guards técnicos locales | Workflow y lectura interna | Decisión local, no endpoint seguro | IMPLEMENTADO PARCIALMENTE |
| Director Financiero | Sí | Parcial: guards financieros locales | Escenarios, riesgo y dashboard | Decisión local, no endpoint seguro | IMPLEMENTADO PARCIALMENTE |
| Gerente General | Sí | Parcial: guards gerenciales locales | Dashboard y firma demo | Acción local, no endpoint seguro | IMPLEMENTADO PARCIALMENTE |
| Cliente | Sí | Parcial: guards de propuesta locales | Portal cliente | Acción local, no endpoint seguro | IMPLEMENTADO PARCIALMENTE |
| Oficial Legal | Sí | Parcial: guards legales locales | Documentos y legal demo | Acción local, no endpoint seguro | IMPLEMENTADO PARCIALMENTE |

## Componentes principales

No existe una jerarquía React montada por index.html.

| Componente | Archivo | Responsabilidad | Datos/DOM |
|---|---|---|---|
| Login | index.html ui-layer | Recibe Email/Contraseña y muestra errores | login-form, login-error |
| API client | index.html | Hace fetch relativo con cookie | apiClient.login(), getMe(), logout() |
| Header | index.html | Muestra identidad y rol seguro | headerUserName, headerUserRole |
| Sidebar | index.html | Navega según permisos locales | data-view |
| Catálogo | index.html | Lista y filtra APUs | apuSearch, categoryFilter, unitFilter |
| Presupuesto | index.html | Edita cantidades y totales | budgetItemsBody, budgetFooter |
| Workflow | index.html | Renderiza estado local y decisiones demo | workflow-view-container |
| Dashboard/gráficos | index.html | Renderiza KPIs y Chart.js | dashboard-view-container y canvas |

## Funciones y utilidades principales

- server/server.js: POST /api/login llama authenticate(); GET /api/me llama requireAuth() y findUserById(); POST /api/logout llama destroySession(). No contiene INSERT ni UPDATE de users.
- server/auth.js: findUserByEmail(email) usa USER_SELECT y $1; findUserById(userId) exige active; authenticate(email, password) ejecuta bcrypt.compare(); safeUser(row) omite campos sensibles.
- server/db.js: query() delega a pg; withTransaction() existe para operaciones transaccionales, pero el login no lo usa ni modifica usuarios.
- index.html: apiClient.login(), getMe(), logout() conectan el formulario con la API; applyAuthenticatedUser() coloca el usuario seguro en appState.session.
- index.html: hasPermission() y rolePermissions() continúan siendo guards de cliente; no son autoridad server-side.
- index.html: mockDB, appState, renderApp(), event delegation y engines de Fase 1 permanecen sin cambios funcionales.

## Relación Estado → Función → Renderer → DOM

| Estado | Función | Renderer | DOM |
|---|---|---|---|
| session.userId | requireAuth(), findUserById() | applyAuthenticatedUser(), renderHeader() | headerUserName, headerUserRole |
| session.currentUserId | getCurrentUser(), getCurrentRole() | renderSidebar(), renderCurrentView() | navegación y app |
| apiConnectionState | hydrateStateFromApi(), persist*() | renderApp() | vistas de datos |
| appState.budget/items | add/update/remove | renderBudgetItems(), renderBudgetSummary() | tabla y footer |
| appState.workflow | changeWorkflowStage() | renderWorkflowView() | etapa, badges y acciones |
| appState.data.auditLog | logAuditEvent() | renderAuditView() | tabla de auditoría |

bindStaticEvents() usa event delegation para click, input y change. El login tiene su listener en ui-layer; no existe selector artificial de usuario o rol.

## Flujos funcionales end-to-end

### Inicio

1. Usuario ejecuta npm start.
2. server/server.js escucha en 127.0.0.1:8000.
3. GET / entrega index.html.
4. El ui-layer muestra Email y Contraseña.
5. No se ejecuta ningún seed ni SQL de usuarios.

### Login

1. Usuario envía login-form.
2. apiClient.login() hace POST /api/login.
3. server/server.js valida el cuerpo.
4. authenticate() consulta users por email y JOIN roles.
5. Comprueba active y bcrypt.compare().
6. Si coincide, crea sesión con userId y responde safeUser().
7. apiClient.getMe() confirma la identidad y applyAuthenticatedUser() actualiza appState.
8. Si no coincide, responde 401; no inserta ni actualiza usuarios.

### Usuario inactivo

1. findUserByEmail() puede encontrar la fila.
2. authenticate() devuelve null cuando active es falso.
3. POST /api/login responde 401.
4. GET /api/me también rechaza la sesión si findUserById() ya no encuentra usuario activo.

### Logout

1. data-ui-logout llama apiClient.logout().
2. POST /api/logout ejecuta destroySession().
3. Se limpia connect.sid.
4. No se modifica users ni roles.

### Rutas protegidas

1. Una petición sin session.userId llega a requireAuth().
2. currentUser() no consulta datos si no existe userId.
3. Se responde 401 AUTH_REQUIRED.
4. Los repositorios no se ejecutan.

## Estado y gestión de datos

La eliminación del seed no cambia mockDB ni appState. El frontend continúa teniendo fallback local para el hackathon. La autenticación real, cuando PostgreSQL esté configurado, solo toma identidad desde la base.

No hay INSERT, UPDATE ni DELETE sobre users dentro del login, GET /api/me o logout. La única operación de usuario que existía era server/seed-users.js y fue eliminada.

## Workflow y aprobaciones

El workflow, approvals, comments y documentos locales de index.html no participan en la autenticación ni son reemplazados en esta iteración. Continúan clasificados como IMPLEMENTADO PARCIALMENTE o PLACEHOLDER ESTRUCTURAL según su código anterior. No se inició ninguna revisión técnica, financiera o gerencial server-side.

## Auditoría

El AuditLog local de index.html se conserva. El login/logout no agrega eventos PostgreSQL y no se añadió auditoría nueva. Audit trail persistente sigue NO IMPLEMENTADO.

## Dependencias internas

package.json queda con:

    "start": "node server/server.js"
    "dev": "node --watch server/server.js"
    "test": "node --test tests/*.test.js"

Dependencias conservadas:

- express
- pg
- dotenv
- express-session
- bcrypt

No se agregó ninguna dependencia. No existe script de seed.

## Verificación contra código

Se revisaron AGENTS.md de raíz, md/AGENTS.md, tests/AGENTS.md, md/fase-5-5.md, package.json, package-lock.json, server/server.js, server/auth.js, server/db.js, la migración, .env.example, .gitignore, README.md, tests e index.html.

Confirmaciones:

- server/seed-users.js solo contenía bcrypt.hash(), INSERT y UPDATE de users; fue eliminado.
- server/server.js no importa el seed.
- server/auth.js importa bcrypt y ejecuta bcrypt.compare().
- USER_SELECT une users con roles.
- authenticate() comprueba active.
- findUserById() comprueba active para /api/me.
- safeUser() no devuelve password_hash.
- server/server.js no contiene INSERT INTO users ni UPDATE users.
- package.json no contiene seed:users.
- .env.example no contiene cuentas demo ni variables SEED_*.
- index.html no contiene contraseñas demo ni selector de rol.
- la migración permanece en server/migrations/001_add_password_hash.sql.

Las referencias de seed en md/fase-5-1.md a md/fase-5-5.md pertenecen a snapshots históricos y describen correctamente el estado de esas iteraciones. No se sobrescribieron porque md/AGENTS.md exige conservar snapshots. Este archivo documenta el estado vigente.

## Verificación funcional

### VERIFICADO POR EJECUCIÓN

- Eliminación física confirmada: server/seed-users.js no existe.
- npm test ejecutará pruebas de ausencia del archivo y del script después de este cambio.
- La suite conserva pruebas de GET /, GET /api/health, 401 de rutas protegidas, login inválido y logout.

### VERIFICADO POR INSPECCIÓN

- bcrypt.compare() permanece en server/auth.js.
- login no inserta ni actualiza users.
- GET /api/me consulta sesión, usuario activo, rol y permissions.
- logout destruye sesión sin tocar PostgreSQL.
- package.json conserva npm start y no contiene seed:users.
- package-lock.json no contiene un script de seed.
- .env.example no contiene cuentas ni variables SEED_*.
- index.html no contiene contraseñas demo, selector artificial ni credenciales DB.
- migration password_hash no se ejecuta desde npm start.

### NO VERIFICADO

- Login válido contra PostgreSQL real.
- GET /api/me con una sesión creada por un usuario real.
- Estado active y permissions de las seis cuentas existentes.
- Existencia efectiva de password_hash en al_bd.
- Conectividad Tailscale y ejecución de la migración.
- Render visual del formulario en navegador.

## Limitaciones actuales

1. No hay DB_PASSWORD local, por lo que no se puede confirmar login real.
2. La aplicación no crea ni resetea cuentas; si una cuenta falta o su hash es inválido, debe corregirse fuera de este runtime mediante el procedimiento administrativo de PostgreSQL.
3. La migración se conserva, pero no se ejecuta automáticamente.
4. Express valida sesión, no permisos de negocio; RBAC server-side queda para Fase 2.
5. MemoryStore no es persistente.
6. mockDB/appState siguen siendo fallback local.
7. Los snapshots históricos todavía contienen referencias al seed porque no deben sobrescribirse.

## Cambios de esta iteración

1. Se eliminó server/seed-users.js.
2. Se eliminó seed:users de package.json.
3. Se actualizó README.md para indicar que las cuentas existentes se consultan desde PostgreSQL y que no existe paso de seed en runtime.
4. Se actualizaron tests/server-contract.test.js con verificaciones de ausencia del seed, bcrypt.compare(), ausencia de mutaciones de users y contraseñas demo en index.html.
5. Se ajustó el comentario de .gitignore de backend a server.
6. Se conservó la migración password_hash sin ejecutarla.
7. No se modificó index.html, la arquitectura ni las cuentas PostgreSQL.
8. Se creó este snapshot sin modificar md/fase-5-5.md.

## Impacto técnico de esta iteración

### Archivos eliminados

- server/seed-users.js.

### Archivos modificados

- package.json.
- README.md.
- .gitignore.
- tests/server-contract.test.js.

### Archivos conservados deliberadamente

- server/auth.js.
- server/db.js.
- server/server.js.
- server/migrations/001_add_password_hash.sql.
- .env.example.
- index.html.
- package-lock.json.

### Contratos conservados

- npm start.
- POST /api/login.
- GET /api/me.
- POST /api/logout.
- USER_SELECT y respuesta segura.
- bcrypt como dependencia y bcrypt.compare() como verificación.
- mockDB, appState, renderers, event delegation y Chart.js.

## Compatibilidad

- No se cambió el puerto ni el host.
- No se cambió PostgreSQL ni la infraestructura de red.
- No se alteraron cuentas ni contraseñas.
- No se agregó un segundo proceso.
- No se agregó una dependencia.
- No se requiere seed para iniciar la aplicación.
- El único flujo de runtime es npm start y luego http://127.0.0.1:8000.

## Preparación para siguientes fases

La próxima fase debe reutilizar request.user, session.userId, safeUser(), USER_SELECT, ApiError y withTransaction(). Debe tratar role.permissions como autoridad leída del servidor, no como entrada del navegador.

## Próxima fase

No se inicia Fase 2 aquí. Cuando corresponda, Fase 2 debe añadir requirePermission(), respuestas 403, permisos server-side, transiciones de workflow transaccionales, approvals persistidos y pruebas negativas para los seis roles.

## Arquitectura Producción / Homelab

- PostgreSQL sigue siendo la fuente externa de usuarios.
- DB_PASSWORD y SESSION_SECRET permanecen solo en configuración privada del servidor.
- La migración se ejecuta manualmente por administración de base de datos, no al arrancar.
- MemoryStore sigue siendo una solución de hackathon.
- Tailscale, firewall y PostgreSQL no fueron modificados.

## Contrato para la siguiente iteración

1. Arrancar únicamente con npm start.
2. No volver a crear un script de seed.
3. No insertar, actualizar ni resetear users desde el servidor de autenticación.
4. Mantener bcrypt.compare() en el login.
5. Mantener password_hash fuera de respuestas.
6. Verificar login real solo cuando DB_PASSWORD y PostgreSQL estén disponibles.
7. Mantener la migración como versionado, sin autoejecución.
8. No avanzar de fase en esta iteración.
