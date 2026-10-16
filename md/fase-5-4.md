# Fase 5 — Iteración 4: autenticación Flask + PostgreSQL

## Identificación

- Fecha de auditoría e implementación: 2026-10-16.
- Iteración anterior: `md/fase-5-3.md`.
- Alcance: integración transversal de autenticación real para la SPA existente.
- No se inició una nueva revisión técnica, revisión financiera, aprobación gerencial, portal cliente, sistema legal ni documentos reales.
- Fuente de verdad: `index.html`, `backend/`, `tests/`, `vite.config.js` y el esquema SQL solicitado. La documentación previa se utilizó únicamente para localizar contratos que debían comprobarse.

## Resumen ejecutivo técnico

La SPA se sirve desde Flask en `127.0.0.1:8000/` y usa `fetch()` hacia `/api`. Flask crea una sesión firmada y consulta PostgreSQL mediante `psycopg`; el navegador nunca recibe `DB_PASSWORD` ni abre una conexión PostgreSQL.

El login visual anterior fue sustituido por un formulario que llama a `POST /api/login`, confirma la sesión con `GET /api/me` y cierra sesión con `POST /api/logout`. Se eliminó la contraseña demo embebida, el listado de cuentas demo y el selector artificial de rol. `mockDB`, `appState`, el catálogo de APUs, el motor financiero, el workflow local y el event delegation de Fase 1 permanecen en `index.html`.

La autenticación está implementada en código real y está cubierta por pruebas con un usuario de autenticación simulado. La conexión contra el PostgreSQL Tailscale, la migración y el seed no se ejecutaron en esta máquina porque no existe `backend/.env` con `DB_PASSWORD`; por ello la integración completa con datos reales se clasifica como `IMPLEMENTADO PARCIALMENTE`.

## Estado general de implementación

| Capacidad | Estado | Qué existe hoy | Qué no hace todavía | Fase |
|---|---|---|---|---|
| Login real SPA → Flask | `IMPLEMENTADO Y FUNCIONAL` | `ui-layer` llama `apiClient.login()`, luego `apiClient.getMe()`; muestra error y bloquea el botón durante la petición | No se verificó contra un PostgreSQL real | Fase transversal actual |
| Sesión segura | `IMPLEMENTADO Y FUNCIONAL` | Flask usa `session`, `SESSION_SECRET`, cookie `HttpOnly`, `SameSite=Lax` y duración de 8 horas | No hay almacenamiento externo de sesiones | Fase transversal actual |
| Usuario y rol desde PostgreSQL | `IMPLEMENTADO PARCIALMENTE` | `backend/auth.py` hace `JOIN users/roles`; `/api/login` y `/api/me` devuelven el rol unido desde la base | La autorización de permisos de negocio todavía se aplica principalmente en la SPA; las rutas de datos Flask solo exigen sesión | Fase 2 para RBAC servidor |
| Migración `password_hash` | `IMPLEMENTADO PARCIALMENTE` | Existe `backend/migrations/001_add_password_hash.sql` con `ALTER TABLE ... IF NOT EXISTS` | No se ejecutó contra `al_bd` | Integración actual |
| Seed de seis usuarios | `IMPLEMENTADO PARCIALMENTE` | `backend/seed_users.py` usa `generate_password_hash()` y actualiza/inserta por email | No se ejecutó contra la base real; Flask no lo ejecuta automáticamente | Integración actual |
| API de datos protegida | `IMPLEMENTADO PARCIALMENTE` | `/api/roles`, `/api/users`, `/api/clients`, `/api/projects`, `/api/apus` y presupuestos usan `require_auth` | No hay evaluación servidor de cada permiso de rol | Fase 2 |
| Fallback `mockDB` | `IMPLEMENTADO Y FUNCIONAL` | `hydrateStateFromMockDB()` llena `appState.data`; la UI conserva el estado en memoria | No permite saltar el login real cuando la API de autenticación no responde | Fase 1 |
| Catálogo y presupuesto local | `IMPLEMENTADO Y FUNCIONAL` | `renderApuCatalog`, `renderBudgetItems`, cantidades, filtros, subtotales y totales siguen conectados | La persistencia remota depende del esquema real y de la sesión | Fase 1 |
| Workflow y aprobaciones locales | `IMPLEMENTADO PARCIALMENTE` | Existen `changeWorkflowStage`, `completeWorkflowDecision`, `createApprovalRecord` y renderers | Siguen siendo estructuras/mutaciones de la SPA; no son un workflow transaccional de PostgreSQL | Fases posteriores |
| AuditLog | `IMPLEMENTADO PARCIALMENTE` | `logAuditEvent()` agrega eventos a `appState.data.auditLog` y `renderAuditView()` los filtra | No se persiste en backend y login/logout no generan un audit trail servidor | Fase 5 |
| Chart.js de `fase-5-3` | `NO IMPLEMENTADO` | El `index.html` entregado como reemplazo no contiene CDN, `chartRegistry` ni renderers Chart.js | La sustitución solicitada se aplicó sin reconstruir ese bloque fuera del alcance de autenticación | Revisión posterior explícita |

## Cómo funciona actualmente

1. `backend/db.py` carga opcionalmente `backend/.env`, pero solo lee la contraseña desde `DB_PASSWORD`. Sus valores por defecto son host Tailscale `desktop-o7rhpvg.taila61603.ts.net`, puerto `5432`, base `al_bd` y usuario `al_app`.
2. `backend/app.py` crea Flask sin una carpeta estática genérica y sirve únicamente `index.html` en `/`. `get_backend_settings()` fija `127.0.0.1:8000`.
3. Al cargar el HTML, `initializeApp()` ejecuta `hydrateStateFromMockDB()`, prepara las estructuras locales, renderiza la SPA y conecta `bindStaticEvents()`. El elemento `#app` permanece oculto mientras se valida la sesión.
4. El segundo script, `#ui-layer`, ejecuta `restoreSession()`. Si `GET /api/me` devuelve 401, muestra `#login-screen`; no crea una sesión demo ni cambia el rol local.
5. Al enviar `#login-form`, el listener usa `apiClient.login(email, password)`. Flask busca el email con `find_user_by_email()`, exige `active`, usa `check_password_hash()` y une el rol desde `roles`.
6. Tras un login exitoso, el navegador llama explícitamente a `apiClient.getMe()`. `applyAuthenticatedUser()` copia únicamente `id`, `name`, `email`, `role.name` y `role.permissions` a `appState.session`; no recibe un rol desde un selector del navegador.
7. `hydrateStateFromApi()` solicita catálogos y presupuesto con la cookie de sesión. Si la API de datos falla, conserva el estado mock y marca `apiConnectionState` como `mock`; ese fallback no autentica al usuario por sí mismo.
8. `renderApp()` vuelve a ejecutar los renderers, `navigateTo()` aplica la vista permitida y `decorate()` actualiza nombre, rol, avatar, badges y visibilidad de la vista.
9. El botón `[data-ui-logout]` llama `POST /api/logout`, limpia la sesión Flask y luego limpia `appState.session`, oculta `#app` y vuelve a mostrar el formulario.

## Arquitectura global

```text
Browser / index.html
        │ fetch HTTP JSON + cookie Flask
        ▼
Flask backend/app.py
        │ backend/auth.py + repositories + psycopg
        ▼
PostgreSQL al_bd por Tailscale
```

La SPA no contiene host, usuario ni contraseña PostgreSQL. `DB_PASSWORD` se queda en el entorno del proceso Flask. El backend tampoco devuelve `password_hash`: `_safe_user()` construye la respuesta pública y `safe_user_row()` elimina `passwordHash`, `password` y `password_hash` de la colección heredada de usuarios.

## Estructura física del proyecto

| Ruta | Responsabilidad actual |
|---|---|
| `index.html` | SPA, `mockDB`, `appState`, permisos locales, API client, renderers, eventos y UI de login/logout |
| `backend/app.py` | Flask, rutas HTTP, sesión, respuesta sanitizada y servidor local |
| `backend/auth.py` | Consulta de usuario/rol, comprobación de hash y serialización segura |
| `backend/db.py` | Configuración PostgreSQL, conexión, transacciones, sanitización de errores y binding fijo `127.0.0.1:8000` |
| `backend/migrations/001_add_password_hash.sql` | Migración explícita de columna de hash |
| `backend/seed_users.py` | Seed manual de los seis usuarios demo |
| `backend/requirements.txt` | Flask, psycopg[binary], python-dotenv |
| `backend/.env.example` | Plantilla de configuración sin contraseña |
| `backend/repositories/` | Consultas de roles, usuarios, catálogos y presupuesto heredadas |
| `tests/test_backend_contract.py` | Contratos de salud, auth, rutas protegidas y ausencia del selector demo |
| `vite.config.js` | Proxy `/api` del servidor Vite hacia `127.0.0.1:8000` |

No se modificaron `src/` ni se añadieron conexiones de base de datos al frontend.

## Datos y modelos actuales

### Estado local

- `mockDB.users`, `mockDB.roles`, `mockDB.clients`, `mockDB.projects`, `mockDB.apus`, `mockDB.budgets`, `documents`, `comments`, `approvals`, `signatures` y `auditLog` siguen declarados en `index.html`.
- `appState.data` es el estado normalizado que consumen los renderers. Los aliases `currentUser`, `activeView`, `apuCatalog`, `budget`, `auditLog`, `documents`, `comments`, `signatures` y `roles` siguen apuntando a ese estado.
- `appState.session` ahora contiene `currentUserId`, `currentRole`, `permissions` e `isAuthenticated`. El rol inicial mock sirve para construir la UI oculta y no se usa para saltar el login.
- `hydrateStateFromApi()` reemplaza catálogos y presupuesto cuando la sesión ya está autenticada; `getCurrentUser()` compara IDs como string para evitar la inconsistencia entre IDs numéricos de PostgreSQL y IDs textuales del estado del navegador.

### Modelo de autenticación

`backend/auth.py` ejecuta una consulta que selecciona `users.id`, `name`, `email`, `active`, `password_hash` y las columnas del rol unido. `authenticate()` verifica `active` y `check_password_hash()`. `find_user_by_id()` vuelve a comprobar `active` durante `/api/me`, por lo que una cuenta desactivada no conserva acceso por una cookie antigua.

El objeto público es:

```json
{
  "id": 7,
  "name": "Ana Presupuesto",
  "email": "presupuestista@buildcost.local",
  "role": {
    "id": 1,
    "name": "Presupuestista",
    "permissions": {}
  }
}
```

El `permissions` real se conserva como objeto o lista JSON. `normalizePermissions()` acepta ambos formatos en la SPA; para objetos solo considera permisos con valor booleano `true`.

### Usuarios demo del seed

`backend/seed_users.py` define los seis registros solicitados: Presupuestista, Revisor Técnico, Director Financiero, Gerente General, Cliente y Oficial Legal. El script guarda únicamente `generate_password_hash(password)`, actualiza el rol y activa la cuenta. Solo se ejecuta por `python -m backend.seed_users`; no se importa desde `backend/app.py`.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| Inicio de sesión | `IMPLEMENTADO Y FUNCIONAL` | `index.html`: `apiClient.login`, listener del `#login-form`; `backend/app.py`: `login()` | `#login-email`, `#login-password`, `#login-error`, `#login-submit` | POST JSON, error visible, botón deshabilitado mientras espera | Test de contrato con respuesta de auth simulada + sintaxis JS | Actual |
| Restauración de sesión | `IMPLEMENTADO Y FUNCIONAL` | `restoreSession()`, `apiClient.getMe()`, `me()` | Oculta/muestra `#app` y `#login-screen` | Se ejecuta al cargar el documento | Test de `/api/me` protegido e inspección | Actual |
| Cierre de sesión | `IMPLEMENTADO Y FUNCIONAL` | `logout()` Flask y listener `[data-ui-logout]` | Botón `#logout-button` | POST, limpieza local y regreso al login | Inspección directa + ruta registrada | Actual |
| Hash de contraseña | `IMPLEMENTADO PARCIALMENTE` | Migración, `check_password_hash`, `generate_password_hash` | No visible | Depende de ejecutar SQL/seed | `py_compile` y revisión del código; DB no verificada | Actual |
| Health API | `IMPLEMENTADO Y FUNCIONAL` | `/api/health`, `/api/health/db` | No tiene pantalla dedicada | Health simple no requiere DB; health DB consulta identidad | Unittest ejecutado sin credenciales | Actual |
| Protección de rutas | `IMPLEMENTADO PARCIALMENTE` | `require_auth` aplicado a rutas de datos | La UI solo se abre después de `/api/me` | 401 sin cookie | Unittest ejecutado | Actual / Fase 2 |
| RBAC de UI | `IMPLEMENTADO PARCIALMENTE` | `rolePermissions`, `normalizePermissions`, `getPermissionsForRole`, `hasPermission` | Sidebar, botones y vistas se ocultan según permiso | Después de auth usa `role.permissions`; sin auth solo existe fallback mock en estado oculto | Inspección estática; no se verificaron los seis usuarios reales | Fase 2 para servidor |
| Catálogo APU | `IMPLEMENTADO Y FUNCIONAL` | `mockDB.apus`, `renderApuCatalog`, filtros y detalle | `#apuCatalogBody`, `#apuSearch`, `#categoryFilter`, `#unitFilter` | Event delegation en input/change/click | Inspección del flujo heredado | Fase 1 |
| Presupuesto y cálculos | `IMPLEMENTADO Y FUNCIONAL` | `calculateBudgetTotals`, `updateBudgetItemQuantity`, `renderBudgetItems`, `renderBudgetSummary` | `#budgetItemsBody`, `#budgetFooter`, `#summaryMetrics` | Cantidades, subtotales y settings recalculan la UI | Build Vite + inspección del código | Fase 1 |
| Persistencia de partidas | `IMPLEMENTADO PARCIALMENTE` | `persistBudgetSnapshot`, `persistBudgetItemAdd/Update/Delete` | No muestra una cola de sincronización | Envía PATCH/POST/DELETE solo con `apiConnectionState === "postgres"` | Inspección; no DB real | Integración actual |
| Workflow local | `IMPLEMENTADO PARCIALMENTE` | `changeWorkflowStage`, `completeWorkflowDecision`, `createApprovalRecord` | `#workflow-view-container` y botones `data-action` | Cambia estado local, crea approval y renderiza | Inspección; no transacción remota | Fases posteriores |
| Documents/comments/approvals | `PLACEHOLDER ESTRUCTURAL` para persistencia remota | Arrays y mutaciones en `appState.data`/`mockDB` | Hay vistas y formularios demo | No hay API PostgreSQL para esos registros | Código real de estructuras, sin repositorio equivalente | Fases posteriores |
| AuditLog | `IMPLEMENTADO PARCIALMENTE` | `logAuditEvent`, `buildAuditTimeline`, `renderAuditView` | `#audit-view-container` y filtros | Registra/filtra en memoria | Inspección; no servidor | Fase 5 |
| Gráficos Chart.js del snapshot anterior | `NO IMPLEMENTADO` | No hay `chart.js`, `chartRegistry` ni `render*Chart` en el `index.html` actual | No hay canvas de gráficos | No se ejecuta visualización Chart.js | Búsqueda estática negativa | Revisión posterior |

## Roles y estado RBAC

`mockDB.roles` declara los seis nombres y `rolePermissions` contiene listas de permisos de UI. Después de una sesión real, `appState.session.permissions` se obtiene de `roles.permissions` mediante `/api/me`; `getPermissionsForRole()` deja de usar la lista estática para ese rol autenticado. No existe `switchRole()` ni `#roleSwitcher` en el HTML actual.

La siguiente matriz distingue la UI local de la autorización servidor:

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí, en `mockDB.roles`, `rolePermissions` y seed | UI: `budget:write`, `budget:quantity`, `workflow:submit-technical`, etc.; sesión real usa `roles.permissions` | Catálogo, presupuesto, resumen, workflow interno, escenarios y dashboard interno si los permisos existen | Puede editar cantidades, añadir/eliminar partidas y enviar revisión desde la SPA cuando el permiso está presente; Flask no valida esos permisos por ruta | `IMPLEMENTADO PARCIALMENTE` |
| Revisor Técnico | Sí | UI: revisión técnica, aprobación/rechazo y comentarios; sesión real usa permisos DB | Workflow interno y dashboard autorizado | Puede ejecutar la transición local si el permiso DB llega al navegador; no existe enforcement equivalente en Flask | `IMPLEMENTADO PARCIALMENTE` |
| Director Financiero | Sí | UI: revisión financiera, métricas y propuestas según permiso | Workflow, dashboard financiero y escenarios | Puede ejecutar acciones locales autorizadas por `hasPermission()`; la API solo conoce sesión | `IMPLEMENTADO PARCIALMENTE` |
| Gerente General | Sí | UI: revisión gerencial, firma y dashboard ejecutivo | Workflow, documentos y firma demo | Puede ejecutar las funciones locales correspondientes si el permiso existe; no hay autorización servidor por acción | `IMPLEMENTADO PARCIALMENTE` |
| Cliente | Sí | UI: `proposal:view`, `proposal:approve`, `proposal:request-changes`, `contract:sign` | Portal cliente y vista comercial | Puede aprobar/solicitar cambios o firmar en la simulación local si el permiso DB se entrega; la ruta Flask no aplica una política por rol | `IMPLEMENTADO PARCIALMENTE` |
| Oficial Legal | Sí | UI: `legal:read`, `legal:approve`, `contract:create`, `contract:approve-signature`, etc. | Legal, documentos y firmas demo | Puede actuar en la simulación local si el permiso DB se entrega; no existe RBAC servidor completo | `IMPLEMENTADO PARCIALMENTE` |

El navegador no puede cambiar el rol mediante un selector. Esto evita el bypass visual anterior, pero no sustituye el RBAC servidor que deberá implementarse en la siguiente fase indicada.

## Componentes principales

El runtime actual no usa componentes React para esta SPA; utiliza un documento HTML con dos scripts.

| Componente lógico | Archivo | Responsabilidad | Elementos funcionales |
|---|---|---|---|
| API client | `index.html` | Único punto `fetch()`, serializa JSON y lanza error para respuestas no 2xx | `/api/login`, `/api/me`, `/api/logout`, health, catálogos y presupuesto |
| UI de autenticación | `index.html`, `#ui-layer` | Restaurar sesión, enviar credenciales, aplicar identidad y cerrar sesión | `#login-form`, `#login-error`, `#headerUserName`, `#headerUserRole`, `#ui-avatar` |
| Estado local | `index.html` | Mantener `mockDB` y `appState` en memoria | aliases de compatibilidad y estado de sesión |
| APU/budget renderers | `index.html` | Renderizar catálogo, detalle, partidas, settings y resumen | `#apuCatalogBody`, `#budgetItemsBody`, `#budgetFooter` |
| Workflow/documentos | `index.html` | Renderizar estructuras y mutaciones demo existentes | `#workflow-view-container`, `#documents-view-container`, `#legal-view-container` |
| Audit renderer | `index.html` | Filtrar eventos de `appState.data.auditLog` | `#audit-view-container` |
| Flask HTTP layer | `backend/app.py` | Exponer rutas, validar sesión y servir index | respuestas JSON sanitizadas |

## Funciones y utilidades principales

| Función | Entradas | Lee/modifica | Consumidores y resultado |
|---|---|---|---|
| `apiClient.request(path, options)` | path, método, body | Lee `API_CONFIG`; no toca DB | Todos los métodos de API; devuelve JSON o lanza error |
| `authenticate(email, password)` | email, contraseña | Consulta `users` + `roles`; no persiste | `POST /api/login`; devuelve usuario seguro o `None` |
| `find_user_by_id(user_id)` | id de sesión | Consulta y verifica `active` | `current_user()` para `/api/me` y rutas protegidas |
| `require_auth(view)` | request Flask | Lee cookie/session | Rechaza con 401 antes del repositorio |
| `hydrateStateFromMockDB()` | ninguno | Copia mock a `appState.data` | `initializeApp()`; fallback local |
| `hydrateStateFromApi()` | ninguno | Reemplaza catálogos/presupuesto si API responde | `enter()` después de login |
| `applyAuthenticatedUser(user)` | objeto seguro de `/api/me` | Actualiza `appState.session` y usuario local | `enter()`; activa permisos del rol recibido |
| `normalizePermissions(value)` | objeto, lista o JSON | No muta fuente | `getPermissionsForRole()` |
| `hasPermission(permission)` | clave de permiso | Lee sesión autenticada o catálogo mock | guards de vistas, botones y mutaciones |
| `renderApp()` | ninguno | Lee `appState`; escribe DOM | renderers de toda la SPA |
| `handleAppClick/Input/Change` | evento DOM delegado | Modifica filtros, cantidades, settings y acciones | listeners agregados por `bindStaticEvents()` |
| `logAuditEvent(...)` | acción, entidad, descripción, metadata | Agrega a `appState.data.auditLog` y sincroniza mock | workflow, budget y `renderAuditView()` |

## Relación Estado → Función → Renderer → DOM

| Estado | Función que lo cambia/transforma | Renderer | DOM observable |
|---|---|---|---|
| `appState.session` | `applyAuthenticatedUser`, `showLogin` | `renderHeader`, `renderSidebar`, `applyIdentity` | `#headerUserName`, `#headerUserRole`, `#ui-avatar`, menú |
| `appState.data.apus` + `appState.filters` | `renderFilters`, `handleAppInput`, `handleAppChange` | `renderApuCatalog` | `#apuSearch`, `#categoryFilter`, `#unitFilter`, `#apuCatalogBody` |
| `budget.items[].quantity` | `updateBudgetItemQuantity` desde `handleAppInput/Change` | `renderBudgetItems`, `renderBudgetSummary` | `#budgetItemsBody`, `data-subtotal`, `#budgetFooter`, `#summaryMetrics` |
| `appState.settings` | `updateEconomicSetting` | `renderSettings`, `renderBudgetSummary` | `#economic-settings-container`, `#budgetFooter` |
| `appState.workflow` + `approvals[]` | `changeWorkflowStage`, `completeWorkflowDecision` | `renderWorkflowView`, `renderHeader` | `#workflow-view-container`, `#headerWorkflowStatus`, `#sidebarWorkflowStatus` |
| `appState.data.documents/comments/signatures` | funciones de documentos y workflow | `renderDocumentsView`, `renderLegalView`, `renderClientPortalView` | containers de documentos, legal y portal |
| `appState.data.auditLog` | `logAuditEvent` | `renderAuditView` | `#audit-view-container` |
| sesión Flask | `login`, `me`, `logout` | `ui-layer` | visibilidad de `#login-screen` y `#app` |

## Flujos funcionales end-to-end

### Carga sin sesión

1. El navegador solicita `/` a Flask.
2. Flask devuelve `index.html` sin exponer una carpeta de proyecto.
3. `initializeApp()` carga el mock y conecta listeners.
4. `restoreSession()` llama `GET /api/me`.
5. Flask responde 401 si no existe una cookie válida.
6. `showLogin()` limpia la sesión local y deja visible `#login-screen`.

Estado: `VERIFICADO POR EJECUCIÓN` para la respuesta 401 en el test del backend; flujo visual completo: `VERIFICADO POR INSPECCIÓN`.

### Login correcto

1. El usuario escribe email/contraseña y dispara `submit` en `#login-form`.
2. El listener llama `apiClient.login()` con JSON.
3. `login()` valida la forma, llama `authenticate()` y crea una sesión permanente con `session["user_id"]`.
4. El listener llama `apiClient.getMe()` y recibe el usuario/rol seguro.
5. `enter()` ejecuta `applyAuthenticatedUser()`, marca `isAuthenticated`, hidrata datos, renderiza y navega a la vista por rol.
6. `applyIdentity()` actualiza nombre, rol y avatar.

La ruta fue ejecutada con un usuario simulado mediante `unittest.mock`; la conexión real y la experiencia browser contra PostgreSQL están `NO VERIFICADO`.

### Credenciales incorrectas o cuenta inactiva

`authenticate()` devuelve `None` si no encuentra el email, `active` es falso, falta el hash o `check_password_hash()` falla. Flask responde 401 sanitizado; el listener muestra el mensaje en `#login-error` y conserva el formulario. No existe fallback de contraseña demo.

Estado: `VERIFICADO POR INSPECCIÓN`; no se ejecutó una consulta real sin base configurada.

### Logout

El click delegado en `[data-ui-logout]` llama `POST /api/logout`, limpia la sesión Flask, limpia `appState.session`, oculta `#app`, muestra `#login-screen` y vuelve a enfocar el email.

Estado: ruta registrada y listener `VERIFICADO POR INSPECCIÓN`; no se ejecutó browser E2E.

### Catálogo y presupuesto de Fase 1

El usuario filtra APUs en `#apuSearch`, `#categoryFilter` o `#unitFilter`; el event delegation actualiza `appState.filters` y `renderApuCatalog()`. Un click en una fila abre el detalle APU. Una cantidad modifica `budget.items`, calcula subtotal y vuelve a renderizar resumen/footer. La persistencia remota solo se intenta cuando la hidratación autenticada logró `apiConnectionState === "postgres"`.

Estado: heredado y `VERIFICADO POR INSPECCIÓN`; no se cambió su cálculo en esta iteración.

## Estado y gestión de datos

`appState.data` es la fuente normalizada de la UI. `mockDB` solo alimenta la semilla local y se sincroniza en las mutaciones heredadas mediante funciones como `syncCurrentBudgetToMockDB()`. Los aliases se mantienen para compatibilidad y no crean un segundo estado independiente.

La autenticación no usa `mockDB.users`: el usuario autenticado se obtiene del backend. La inserción temporal de ese usuario en `appState.data.users` solo permite que la UI renderice antes de que termine la hidratación remota; después `hydrateStateFromApi()` reemplaza la colección con el resultado de PostgreSQL.

## Workflow y aprobaciones

El código actual contiene `WORKFLOW_STATUS`, `WORKFLOW_STAGE`, `workflowTransitions`, `changeWorkflowStage()`, `submitForTechnicalReview()`, `completeWorkflowDecision()` y `createApprovalRecord()`. Estas funciones cambian `appState.workflow`, el presupuesto local y `appState.data.approvals`, y los renderers actualizan la UI.

Eso es una implementación local/parcial, no una autorización ni una transacción de workflow en PostgreSQL. En esta iteración no se implementaron revisiones técnicas, financieras o gerenciales nuevas.

## Auditoría

`logAuditEvent()` existe en `index.html` y agrega objetos a `appState.data.auditLog`; `renderAuditView()` filtra por rol, acción, entidad, categoría, etapa y texto. Se mantiene como audit trail en memoria. El backend no tiene endpoint ni tabla de auditoría conectada para login/logout o mutaciones; por eso no se declara como audit trail persistente.

## Dependencias internas

- Frontend: navegador, Tailwind CDN y JavaScript vanilla incluido en `index.html`.
- Backend: Flask, `psycopg[binary]`, `python-dotenv`, `werkzeug.security`.
- Desarrollo: Vite mantiene proxy `/api` hacia `http://127.0.0.1:8000`.
- No se añadió un proveedor externo de identidad, CORS abierto ni conexión directa desde el navegador.

## Verificación contra código

Archivos revisados directamente:

- `AGENTS.md`, `md/AGENTS.md` y `tests/AGENTS.md`.
- `index.html`: formulario, scripts, `mockDB`, `appState`, permisos, API client, renderers y event delegation.
- `backend/app.py`: rutas, sesión, servidor y sanitización.
- `backend/auth.py`: join de usuario/rol, hash y serialización segura.
- `backend/db.py`: configuración, conexión, errores y binding local.
- `backend/migrations/001_add_password_hash.sql`, `backend/seed_users.py`, `backend/.env.example`, `backend/requirements.txt` y `backend/README.md`.
- `tests/test_backend_contract.py` y `vite.config.js`.

Inconsistencias encontradas:

1. El HTML adjunto todavía contenía `PASSWORD = "demo2026"`, seis cuentas demo y `switchRole()`; se eliminaron y se conectó el formulario a Flask.
2. El HTML adjunto todavía contenía el selector `#roleSwitcher`; se eliminó el markup y su handler.
3. `initializeApp()` llamaba a `hydrateStateFromApi()` antes de autenticar; se quitó esa llamada y ahora la hidratación remota ocurre dentro de `enter()` después de `GET /api/me`.
4. El estado comparaba IDs con igualdad estricta; `getCurrentUser()` ahora compara representaciones string para evitar el choque entre IDs PostgreSQL y IDs mock.
5. `/api/me` debía invalidar usuarios desactivados; `find_user_by_id()` ahora exige `active`.
6. El servidor podía sobreescribir el host/puerto mediante variables; `get_backend_settings()` quedó fijo en `127.0.0.1:8000`, como exige la arquitectura.
7. `md/fase-5-3.md` describe una capa Chart.js que no está en el `index.html` adjunto actual. No se reconstruyó en esta iteración de autenticación; la discrepancia queda documentada como `NO IMPLEMENTADO` y requiere una decisión explícita antes de restaurarla.

## Verificación funcional

### `VERIFICADO POR EJECUCIÓN`

- `python -m py_compile backend/auth.py backend/app.py backend/seed_users.py backend/db.py`: correcto.
- Parser `new Function()` aplicado a los tres bloques inline de `index.html`: correcto.
- `python -m unittest discover -s tests -v`: 8 pruebas correctas.
- `npm run build`: Vite generó `dist/index.html` correctamente.
- `GET /api/health`: devuelve 200 sin PostgreSQL.
- `GET /api/health/db` sin credenciales: devuelve 503 sanitizado.
- `GET /api/me` sin sesión: devuelve 401 `AUTH_REQUIRED`.
- Login y `/api/me` con usuario de auth simulado: devuelve solo datos seguros y mantiene cookie de sesión.
- Rutas de datos sin sesión: devuelven 401.

### `VERIFICADO POR INSPECCIÓN`

- La SPA no tiene `DB_PASSWORD`, `postgresql://`, `PASSWORD = "demo2026"`, `data-ui-account`, `#roleSwitcher` ni `function switchRole`.
- `seed_users.py` usa `generate_password_hash()` y no se importa al arrancar Flask.
- El backend no selecciona `password_hash` en ninguna respuesta pública.
- Flask sirve `index.html` en el mismo origen y Vite proxifica `/api` solo en desarrollo.
- La hidratación remota ocurre después del login y usa la cookie de sesión.

### `NO VERIFICADO`

- Conexión a `desktop-o7rhpvg.taila61603.ts.net:5432`.
- Ejecución de la migración y seed contra `al_bd`.
- Login con las seis cuentas demo reales.
- Render browser completo y errores de consola con Flask + PostgreSQL activos.
- Permisos reales almacenados en `roles.permissions` y enforcement servidor por permiso.

## Limitaciones actuales

1. Sin `backend/.env` y `DB_PASSWORD`, no puede verificarse la cadena completa hasta PostgreSQL. El login real no tiene una contraseña local de respaldo.
2. Las rutas de datos exigen sesión, pero todavía no verifican permisos de negocio por rol en Flask. Un usuario autenticado podría llamar una ruta protegida directamente aunque la UI oculte la acción; esto debe resolverse en Fase 2.
3. `roles.permissions` debe contener claves compatibles con `rolePermissions` (`budget:read`, `workflow:technical-review`, etc.). La aplicación no migra ni normaliza permisos en la base.
4. `mockDB`, workflow, documentos, comments, approvals, signatures y AuditLog siguen siendo estado de demo en memoria, salvo las llamadas remotas heredadas de presupuesto/APUs.
5. El `index.html` actual no contiene Chart.js ni sus canvas/renderers, aunque `fase-5-3.md` los documentaba; es una discrepancia pendiente de decisión y no se debe confundir con una integración existente.
6. No se implementaron documentos reales, firma real, portal comercial persistente, revisiones nuevas ni cierre legal.

## Cambios de esta iteración

1. Se reemplazó el contenido de `index.html` por el archivo adjunto como base visual y se conservaron sus engines locales.
2. Se eliminó el login local con contraseña `demo2026`, las cuentas demo visibles y el selector artificial de rol.
3. Se añadieron `login`, `getMe` y `logout` al único `apiClient`.
4. Se cambió `initializeApp()` para que no hidrate PostgreSQL antes de autenticarse.
5. Se añadió `applyAuthenticatedUser()`, normalización de permisos desde `roles.permissions` y estado `isAuthenticated`.
6. Se ajustó `getCurrentUser()` para IDs numéricos/textuales y se hizo que `resetDemo()` preserve la sesión autenticada.
7. Se creó `backend/auth.py` y se integraron las rutas `POST /api/login`, `GET /api/me` y `POST /api/logout`.
8. Se protegieron las rutas de datos con `require_auth` y se sanitizó la colección de usuarios.
9. Se creó la migración `backend/migrations/001_add_password_hash.sql`.
10. Se creó el seed manual `backend/seed_users.py` para los seis usuarios solicitados.
11. Se fijó el listener de Flask a `127.0.0.1:8000` y se documentaron `SESSION_SECRET` y `SESSION_COOKIE_SECURE` en `.env.example`.
12. Se actualizaron `tests/test_backend_contract.py` para cubrir auth, sesión protegida y ausencia del selector demo.

## Impacto técnico de esta iteración

- Archivos creados: `backend/auth.py`, `backend/migrations/001_add_password_hash.sql`, `backend/seed_users.py`, `md/fase-5-4.md`.
- Archivos modificados: `index.html`, `backend/app.py`, `backend/db.py`, `backend/.env.example`, `backend/README.md`, `tests/test_backend_contract.py`.
- Contrato añadido: usuario público `{id,name,email,role:{id,name,permissions}}` y cookie Flask firmada con `user_id`.
- Contrato conservado: `mockDB`, `appState`, aliases, funciones de presupuesto, renderers y event delegation.
- Dependencias nuevas declaradas: Flask, psycopg[binary], python-dotenv; `werkzeug.security` es dependencia de Flask/Werkzeug.
- Riesgo: si `roles.permissions` usa un formato distinto a lista o mapa booleano, la UI negará permisos; debe validarse con el esquema real.
- Riesgo conocido: el reemplazo exacto del HTML adjunto no incluye Chart.js que figuraba en la documentación anterior; quedó visible como discrepancia, no oculto con un stub.

## Compatibilidad

- Flask sirve la SPA en el mismo origen; no se requiere CORS.
- Vite conserva el proxy `/api` para desarrollo.
- El estado mock sigue disponible para cálculo/render y no contiene credenciales de PostgreSQL.
- El login ya no acepta ni expone un rol desde el navegador.
- Se mantienen los aliases de compatibilidad de `appState` y las firmas de los handlers de Fase 1.

## Preparación para siguientes fases

La siguiente implementación debe reutilizar `backend/auth.py`, `current_user()`, `require_auth`, `role.permissions`, `appState.session` y `hasPermission()`. Debe añadir autorización de servidor por permiso para cada operación sensible, comprobar usuario/rol desde PostgreSQL en cada request y cubrir casos negativos por cada rol. No debe volver a introducir un selector de rol en el cliente.

No se inicia Fase 2 en esta iteración.

## Próxima fase

Fase 2 deberá convertir el control local en RBAC servidor verificable: catálogo de permisos persistente, evaluación backend por ruta/acción, respuestas 403, matrices de permisos por los seis roles y pruebas negativas. También deberá conectar las transiciones técnicas, financieras y gerenciales a autorización server-side antes de declarar revisiones o aprobaciones como funcionales.

## Arquitectura Producción / Homelab

- PostgreSQL autohospedado por Tailscale es la base configurada para este entorno.
- `DB_PASSWORD` y `SESSION_SECRET` permanecen en el entorno local del backend.
- Keycloak, MinIO, DocuSeal, Cal.com y n8n siguen siendo equivalencias arquitectónicas; no están conectados por este cambio.
- La sesión Flask actual es suficiente para el hackathon local, no una plataforma SSO distribuida.

## Contrato para la siguiente iteración

1. No devolver `password_hash` bajo ninguna ruta.
2. No aceptar `role`, `permissions` ni `user_id` de la petición para decidir autorización.
3. Mantener `GET /api/me` como fuente de identidad de la SPA.
4. Mantener `mockDB` únicamente como fallback de datos, nunca como bypass de autenticación.
5. Añadir pruebas ejecutables para 401, 403, usuario inactivo, permiso correcto, permiso incorrecto y sesión expirada.
6. Resolver explícitamente la discrepancia Chart.js antes de afirmar que el snapshot anterior sigue completo.
