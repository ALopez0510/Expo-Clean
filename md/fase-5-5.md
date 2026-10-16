# Fase 5 — Iteración 5: migración de Flask a Node/Express y cierre del runtime local

## Identificación

- Proyecto: CleanQuote Pro — Expo Clean Ecuador 2026.
- Fase: 5.
- Iteración: 5.
- Fecha: 2026-10-16.
- Fuente de verdad: código actual del repositorio.
- Referencia histórica: md/fase-5-4.md.
- Este archivo es nuevo; md/fase-5-4.md no fue sobrescrito.
- Runtime: index.html servido por Node/Express en 127.0.0.1:8000.
- Base configurada: PostgreSQL al_bd mediante Tailscale.
- Fase 2 no se inicia en esta iteración.

## Resumen ejecutivo técnico

La arquitectura anterior tenía una SPA Vanilla JavaScript en index.html y un backend Flask/psycopg. El objetivo de esta iteración era sustituir exclusivamente el backend por Node.js, Express, pg, dotenv, express-session y bcrypt, conservando el contrato HTTP y el runtime inline de la SPA.

Estado comprobado:

- IMPLEMENTADO Y FUNCIONAL: npm start ejecuta server/server.js, escucha únicamente en 127.0.0.1:8000 y entrega index.html por GET /.
- IMPLEMENTADO Y FUNCIONAL: GET /api/health funciona sin PostgreSQL.
- IMPLEMENTADO Y FUNCIONAL: POST /api/login, GET /api/me y POST /api/logout existen; la sesión guarda solo userId y las respuestas públicas no contienen password_hash.
- IMPLEMENTADO Y FUNCIONAL: las rutas de datos devuelven 401 antes de los repositorios cuando no hay sesión.
- IMPLEMENTADO PARCIALMENTE: login real. El código consulta PostgreSQL y usa bcrypt, pero no se pudo autenticar contra al_bd sin DB_PASSWORD, migración y seed ejecutados.
- IMPLEMENTADO PARCIALMENTE: repositorios de roles, usuarios, clientes, proyectos, APUs y presupuesto. Existen consultas y transacciones, pero el esquema remoto no fue verificado.
- IMPLEMENTADO Y FUNCIONAL: se conservan mockDB, appState, el catálogo de 20 APUs, cálculos, filtros, navegación, workflow local, auditoría local y engines existentes.
- IMPLEMENTADO PARCIALMENTE: Chart.js. Se restauró el CDN y el motor previo, conectado al estado actual, pero no se ejecutó una sesión de navegador con la CDN cargada.
- PLACEHOLDER ESTRUCTURAL: express-session usa MemoryStore; no existe almacenamiento persistente de sesiones.
- PLACEHOLDER ESTRUCTURAL: documents, comments, approvals, signatures, escenarios y AuditLog tienen estructuras y lógica local de demo, no persistencia Node.
- NO IMPLEMENTADO: RBAC server-side por permiso, revisiones reales, portal persistente, documentos reales, firma real, sistema legal persistente, escenarios persistidos y audit trail persistente.

No se implementó ninguna funcionalidad nueva de Fase 2.

## Estado general de implementación

| Capacidad | Estado | Código real | Falta |
|---|---|---|---|
| SPA servida por Express | IMPLEMENTADO Y FUNCIONAL | app.get("/") y sendFile(index.html) | Prueba visual completa en navegador |
| Arranque único | IMPLEMENTADO Y FUNCIONAL | package.json y startServer() | Supervisor de procesos |
| Configuración PostgreSQL | IMPLEMENTADO PARCIALMENTE | server/db.js y .env.example | Conexión confirmada a al_bd |
| Salud sin DB | IMPLEMENTADO Y FUNCIONAL | GET /api/health | Nada para el alcance actual |
| Salud de DB | IMPLEMENTADO PARCIALMENTE | databaseIdentity() y GET /api/health/db | Respuesta 200 con credenciales reales |
| Login | IMPLEMENTADO PARCIALMENTE | authenticate(), bcrypt.compare() y POST /api/login | Prueba con usuario real |
| Sesión | IMPLEMENTADO Y FUNCIONAL | express-session, regenerateSession(), destroySession() | Store persistente |
| Core API | IMPLEMENTADO PARCIALMENTE | core-repository.js y rutas protegidas | Validación del esquema remoto |
| APU API | IMPLEMENTADO PARCIALMENTE | apu-repository.js | Validación del catálogo remoto |
| Presupuesto API | IMPLEMENTADO PARCIALMENTE | budget-repository.js | Escritura contra PostgreSQL real |
| mockDB/appState | IMPLEMENTADO Y FUNCIONAL | objetos y funciones de index.html | Persistencia completa |
| Catálogo de 20 APUs | IMPLEMENTADO Y FUNCIONAL | mockDB.apus y appState.apuCatalog | Persistencia remota |
| Búsqueda/filtros | IMPLEMENTADO Y FUNCIONAL | filterApus(), handlers y renderers | — |
| Presupuesto local | IMPLEMENTADO Y FUNCIONAL | addApuToBudget(), updateBudgetItemQuantity(), removeBudgetItem() | Persistencia completa |
| Cálculos financieros | IMPLEMENTADO Y FUNCIONAL | calculateTotalsFromItems(), calculateBudgetTotals() | — |
| Workflow local | IMPLEMENTADO PARCIALMENTE | changeWorkflowStage(), decideWorkflow() | API, transacción y permisos server-side |
| rolePermissions/hasPermission | IMPLEMENTADO PARCIALMENTE | guards dentro de index.html | Middleware Express y 403 |
| AuditLog | IMPLEMENTADO PARCIALMENTE | logAuditEvent() y renderAuditView() | Persistencia e inmutabilidad |
| Chart.js | IMPLEMENTADO PARCIALMENTE | CDN, chartRegistry y renderizadores | Verificación visual con navegador |
| Revisiones reales | NO IMPLEMENTADO | No existen endpoints Node de decisión | Fase 2 |
| Documentos/firma reales | NO IMPLEMENTADO | No existen MinIO, DocuSeal ni almacenamiento | Fases 4–5 |

## Cómo funciona actualmente

El navegador solicita index.html a Express. El HTML contiene el engine de dominio, el chart engine y el ui-layer. Tailwind CSS y Chart.js se solicitan desde CDN. La SPA nunca abre PostgreSQL; apiClient usa rutas relativas /api.

Sin sesión, el ui-layer muestra login-screen y oculta app. El envío de login-form llama apiClient.login(), que hace POST /api/login. Express consulta users unido a roles, exige active = true, compara password_hash con bcrypt.compare(), regenera la sesión y guarda únicamente request.session.userId. safeUser() devuelve id, name, email y role con id, name y permissions.

Después el ui-layer llama apiClient.getMe(), aplica applyAuthenticatedUser() y renderiza la SPA. El rol no se toma de un selector local: proviene de la respuesta del servidor.

La SPA conserva el estado local. hydrateStateFromApi() puede hidratar datos cuando existe sesión y apiConnectionState es postgres. Las mutaciones persistBudgetSnapshot(), persistBudgetItemAdd(), persistBudgetItemUpdate() y persistBudgetItemDelete() llaman la API en ese estado; mockDB continúa siendo fallback de demo.

Express no sirve una carpeta estática completa. Solo sirve index.html y las rutas /api, evitando publicar .env u otros archivos del proyecto.

## Arquitectura global

    Navegador
       │ HTTP/JSON + cookie connect.sid
       ▼
    server/server.js
       │ Express + express-session
       ├── server/auth.js
       ├── server/repositories/*.js
       └── server/db.js + pg
              │
              ▼
    desktop-o7rhpvg.taila61603.ts.net:5432 / al_bd

DB_PASSWORD no está en index.html ni en el JavaScript del navegador. server/db.js solo lee process.env.DB_PASSWORD desde el entorno del servidor.

El proceso usa HOST = 127.0.0.1 y PORT = 8000. No se añadió CORS porque SPA y API comparten origen.

## Estructura física del proyecto

Archivos principales:

- index.html: SPA Vanilla, CSS inline, CDN de Tailwind y Chart.js, mockDB, appState, engines, renderers, event delegation, apiClient y autenticación.
- server/server.js: Express, sesión, entrega de index.html, rutas, autenticación y errores.
- server/db.js: dotenv, Pool de pg, query, withTransaction, timeout e introspección de esquema.
- server/auth.js: consulta users/roles, bcrypt y respuestas seguras.
- server/serializers.js y server/errors.js: serialización y errores API.
- server/repositories/core-repository.js: roles, users, clients y projects.
- server/repositories/apu-repository.js: catálogo y detalle APU.
- server/repositories/budget-repository.js: presupuesto, partidas, incrementos, actualización, borrado y snapshots.
- server/migrations/001_add_password_hash.sql: migración de users.
- server/seed-users.js: seed manual con bcrypt.
- tests/server-contract.test.js: contrato Node.
- .env.example: configuración raíz sin secreto real.
- package.json y package-lock.json: dependencias y scripts.
- README.md: instrucciones Node actualizadas.
- md/fase-5-5.md: este snapshot.

Archivos retirados:

- backend/app.py, auth.py, db.py, errors.py, serializers.py, requirements.txt, seed_users.py, verify_db.py, README.md, .env.example e __init__.py.
- backend/repositories/__init__.py, core_repository.py, apu_repository.py y budget_repository.py.
- backend/migrations/001_add_password_hash.sql.
- tests/test_backend_contract.py.
- vite.config.js.

src/ y dist/ se conservaron. src/ es una aplicación React/Vite paralela que no es importada por index.html; dist/ es salida generada e ignorada. Ninguno participa en npm start. Las dependencias y scripts Vite/React se retiraron del package.

## Datos y modelos actuales

mockDB contiene users, roles, clients, projects, apus, budgets, documents, comments, approvals, signatures, auditLog y priceReferences. appState contiene session, data, apuCatalog, budget, currentProjectId, currentBudgetId, ui, filters, settings y workflow.

hydrateStateFromMockDB() copia la semilla local. hydrateStateFromApi() transforma roles, usuarios, clientes, proyectos, APUs y presupuesto remotos hacia appState cuando hay API disponible. initializeApp() no consulta PostgreSQL antes de autenticar.

El catálogo local contiene 20 APUs con id, code, name, category, description, unit, unitPrice, currency, components y metadata. components contiene labor, materials, equipment, transport y other.

server/db.js define:

- DB_HOST: desktop-o7rhpvg.taila61603.ts.net por defecto.
- DB_PORT: 5432 por defecto.
- DB_NAME: al_bd por defecto.
- DB_USER: al_app por defecto.
- DB_PASSWORD: solo process.env.DB_PASSWORD, sin secreto alternativo.
- DB_CONNECTION_TIMEOUT_MS: 1500 ms por defecto.

server/auth.js selecciona password_hash internamente, pero safeUser() devuelve solo usuario y rol. safeUserRow() elimina passwordHash, password y password_hash.

server/migrations/001_add_password_hash.sql añade password_hash VARCHAR(255) con IF NOT EXISTS. No fue ejecutada.

server/seed-users.js contiene los seis usuarios demo. Busca cada role por nombre, ejecuta bcrypt.hash(password, 12) y actualiza o inserta. No se importa al iniciar el servidor y no fue ejecutado.

## API HTTP actual

| Método y ruta | Sesión | Implementación |
|---|---|---|
| GET / | No | sendFile(index.html) |
| GET /api/health | No | Responde status ok sin DB |
| GET /api/health/db | No | current_database() y current_user, error 503 sanitizado |
| POST /api/login | No previa | Email, active, bcrypt y sesión |
| GET /api/me | Sí | Usuario activo por session.userId |
| POST /api/logout | No | Destruye sesión y limpia cookie |
| GET /api/roles | Sí | listCore("roles") |
| GET /api/users | Sí | listCore("users") sin hash |
| GET /api/clients | Sí | listCore("clients") |
| GET /api/projects | Sí | listCore("projects") |
| GET /api/apus | Sí | listApus() |
| GET /api/apus/:apuId | Sí | getApu() |
| GET /api/budgets/:budgetId | Sí | getBudgetWithItems() |
| PATCH /api/budgets/:budgetId | Sí | updateBudgetSnapshot() |
| POST /api/budgets/:budgetId/items | Sí | addBudgetItem() |
| PATCH /api/budget-items/:itemId | Sí | updateBudgetItem() |
| DELETE /api/budget-items/:itemId | Sí | deleteBudgetItem() |

No existe GET /api/budget-items/:itemId. La ruta de una partida es PATCH o DELETE. La prueba fue corregida para verificar PATCH protegido.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción | Evidencia | Fase |
|---|---|---|---|---|---|---|
| Entrega de SPA | IMPLEMENTADO Y FUNCIONAL | app.get("/") | login-screen/app | GET / | VERIFICADO POR EJECUCIÓN: 200 | Actual |
| Login HTTP | IMPLEMENTADO PARCIALMENTE | apiClient.login(), POST /api/login, authenticate() | login-form y login-error | Envío de credenciales | Inspección; cuerpo inválido 400 ejecutado | Actual |
| Usuario desde DB | IMPLEMENTADO PARCIALMENTE | USER_SELECT, findUserByEmail(), findUserById() | applyAuthenticatedUser() | GET /api/me | DB real no verificada | Actual |
| Sesión | IMPLEMENTADO Y FUNCIONAL | express-session y session.userId | ui-layer | Cookie y logout | Inspección y endpoint ejecutado | Actual |
| No exponer hash | IMPLEMENTADO Y FUNCIONAL | safeUser(), safeUserRow() | No se renderiza | Respuesta pública | Inspección y test | Actual |
| Core API | IMPLEMENTADO PARCIALMENTE | listCore() | hydrateStateFromApi() | Lecturas autenticadas | Esquema no verificado | Actual |
| APUs remotos | IMPLEMENTADO PARCIALMENTE | listApus(), getApu() | apiClient de APUs | Lecturas autenticadas | Esquema no verificado | Actual |
| Presupuesto remoto | IMPLEMENTADO PARCIALMENTE | add/update/delete/snapshot | persist*() | Escrituras parametrizadas | DB no verificada | Actual |
| mockDB/appState | IMPLEMENTADO Y FUNCIONAL | objetos y hydration | Todos los renderers | Estado local | Código conectado | Fase 1 |
| Catálogo 20 APUs | IMPLEMENTADO Y FUNCIONAL | mockDB.apus y appState.apuCatalog | renderApuCatalog() | Listado y detalle | Código inspeccionado | Fase 1 |
| Búsqueda/filtros | IMPLEMENTADO Y FUNCIONAL | filterApus() y handlers | apuSearch/categoryFilter/unitFilter | Filtrado reactivo | Código conectado | Fase 1 |
| Agregar/incrementar APU | IMPLEMENTADO Y FUNCIONAL local | addApuToBudget() | data-action del catálogo | Incrementa sin duplicar | Código conectado | Fase 1 |
| Cantidad decimal | IMPLEMENTADO Y FUNCIONAL local | updateBudgetItemQuantity() | input data-action=quantity | Recalcula fila y totals | Código conectado | Fase 1 |
| Cálculos económicos | IMPLEMENTADO Y FUNCIONAL local | calculateTotalsFromItems() | summary/footer | Totals reactivos | Código conectado | Fase 1 |
| Parámetros económicos | IMPLEMENTADO Y FUNCIONAL local | updateEconomicSetting() | inputs data-setting | Cambia settings/totals | Código conectado | Fase 1 |
| Workflow local | IMPLEMENTADO PARCIALMENTE | changeWorkflowStage(), decideWorkflow() | renderWorkflowView() | Cambia estado local | Sin API de decisión | Fases 2–5 |
| rolePermissions/hasPermission | IMPLEMENTADO PARCIALMENTE | guards de index.html | navegación y botones | Control de UI | Sin middleware HTTP | Fase 2 |
| AuditLog | IMPLEMENTADO PARCIALMENTE | logAuditEvent() | renderAuditView() | Evento en memoria | Sin persistencia | Fase 5 |
| documents/comments/approvals | IMPLEMENTADO PARCIALMENTE | arrays y engines locales | workflow/document/legal/client | Demo local | Sin backend | Fases 2–4 |
| Chart.js | IMPLEMENTADO PARCIALMENTE | CDN, chartRegistry y renderers | canvas dinámicos | Gráficos derivados | Parseo; navegador no verificado | Fase 5 |
| Revisión técnica real | NO IMPLEMENTADO | No hay endpoint | No hay persistencia | No existe | Inspección | Fase 2 |
| Revisión financiera real | NO IMPLEMENTADO | No hay endpoint | No hay persistencia | No existe | Inspección | Fase 2 |
| Aprobación gerencial real | NO IMPLEMENTADO | No hay endpoint | Solo demo local | No existe | Inspección | Fase 2 |
| Documentos/firma reales | NO IMPLEMENTADO | No hay integración | Solo snapshots demo | No existe | Inspección | Fases 4–5 |

## Roles y estado RBAC

Los seis nombres siguen declarados en mockDB.roles y rolePermissions. El backend obtiene el rol mediante JOIN users y roles. Express actualmente aplica requireAuth(), pero no tiene requirePermission() ni mapa server-side de permisos.

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí | Parcial: hasPermission() local; Express solo sesión | Catálogo, presupuesto, settings, escenarios y dashboard | Agregar/eliminar partidas, editar cantidades, cambiar parámetros y ejecutar acciones locales permitidas | IMPLEMENTADO PARCIALMENTE |
| Revisor Técnico | Sí | Parcial: guards técnicos locales; sin 403 HTTP | Workflow, lectura de presupuesto, dashboard y comentarios | Decisión técnica local si etapa y permiso coinciden | IMPLEMENTADO PARCIALMENTE |
| Director Financiero | Sí | Parcial: guards financieros locales; sin 403 HTTP | Revisión financiera local, escenarios, precio, riesgo y dashboard | Decisión financiera local si etapa y permiso coinciden | IMPLEMENTADO PARCIALMENTE |
| Gerente General | Sí | Parcial: guards gerenciales/firma local; sin 403 HTTP | Dashboard, workflow y firma demo | Aprobación/firma local bajo las condiciones modeladas | IMPLEMENTADO PARCIALMENTE |
| Cliente | Sí | Parcial: guards de propuesta locales; sin 403 HTTP | Portal cliente y comentarios compartidos | Consultar/decidir propuesta solo en estado local permitido | IMPLEMENTADO PARCIALMENTE |
| Oficial Legal | Sí | Parcial: guards legal/contrato locales; sin 403 HTTP | Documentos, legal, contrato y firma demo | Revisión legal/contrato local en la etapa correspondiente | IMPLEMENTADO PARCIALMENTE |

No es correcto decir que RBAC está listo. Hoy existe identidad de rol desde backend y autorización de presentación/acciones en index.html. Falta autorización server-side.

## Componentes principales

No hay una jerarquía React montada por index.html. Los componentes son bloques DOM y renderizadores Vanilla:

| Componente | Función | Datos y DOM |
|---|---|---|
| Login | ui-layer | login-form, apiClient.login(), login-error, login-screen/app |
| Sidebar | renderSidebar() | session, canViewForRole(), data-view |
| Header | renderHeader() | usuario, proyecto, workflow, headerUserName/headerUserRole |
| Catálogo | renderFilters(), renderApuCatalog() | apuCatalog, filters, apuSearch, categoryFilter, unitFilter |
| Presupuesto | renderBudgetItems(), renderBudgetSummary() | budget.items, totals, budgetItemsBody, budgetFooter |
| Workflow | renderWorkflowView() | workflow, comments, approvals, workflow-view-container |
| Escenarios | renderScenariosView() | scenarios, variance, price y risk engines |
| Dashboard | renderDashboardView() | KPI, alerts, drivers, risk y audit |
| Gráficos | renderDashboardCharts(), renderScenarioCharts(), renderClientCostDistributionChart() | chartRegistry y canvas dinámicos |
| API client | apiClient | fetch relativo a /api |

## Funciones y utilidades principales

### Frontend

- apiClient.request(): único fetch de la SPA; parsea JSON y propaga errores.
- apiClient.login(), getMe() y logout(): frontera de autenticación.
- applyAuthenticatedUser(): coloca usuario seguro y permisos normalizados en appState.session.
- getCurrentUser(), getCurrentRole(), getPermissionsForRole() y hasPermission(): identidad y guards locales.
- hydrateStateFromMockDB() y hydrateStateFromApi(): semilla local y adaptación remota.
- filterApus(): combina texto, categoría y unidad.
- addApuToBudget(): agrega una APU o incrementa la partida existente por apuId.
- updateBudgetItemQuantity() y removeBudgetItem(): mutan partidas, recalculan y disparan persistencia opcional.
- calculateTotalsFromItems() y calculateBudgetTotals(): calculan directCost, overhead, contingency, profit, subtotal, tax y grandTotal.
- updateEconomicSetting(): modifica settings y recalcula.
- logAuditEvent(): agrega eventos al audit log local.
- changeWorkflowStage(), submitForTechnicalReview(), decideWorkflow() y createApprovalRecord(): workflow/approvals locales con guards.
- renderApp() y navigateTo(): coordinan renderers y navegación.
- renderDashboardCharts(), renderScenarioCharts() y renderClientCostDistributionChart(): gestionan Chart.js y fallback textual.

### Backend

- startServer(): app.listen(8000, 127.0.0.1).
- requireAuth(): resuelve session.userId, consulta usuario activo y devuelve 401 si falta.
- authenticate(): busca usuario, exige active y ejecuta bcrypt.compare().
- safeUser() y safeUserRow(): respuestas sin password_hash.
- query() y withTransaction(): acceso parametrizado y BEGIN/COMMIT/ROLLBACK.
- tableColumns(), firstColumn() y quoteIdentifier(): introspección y validación de identificadores.
- listCore(), listApus() y getApu(): lecturas de recursos.
- addBudgetItem(): transacción; combina budget_id + apu_id y aumenta quantity sin duplicar.
- updateBudgetItem(), deleteBudgetItem() y updateBudgetSnapshot(): mutaciones financieras.
- seedUsers(): hashes bcrypt y upsert manual de seis usuarios.

## Relación Estado → Función → Renderer → DOM

| Estado | Función | Renderer | DOM |
|---|---|---|---|
| appState.session | applyAuthenticatedUser(), getCurrentRole(), hasPermission() | renderHeader(), renderSidebar(), renderCurrentView() | headerUserName, headerUserRole, nav, login-screen/app |
| appState.ui.activeView | navigateTo() | renderCurrentView() | secciones data-ui-view |
| appState.filters | handlers de input/change | renderFilters(), renderApuCatalog() | apuSearch, categoryFilter, unitFilter, catálogo |
| appState.apuCatalog | hydration local/remota | renderApuCatalog() | filas, detalle y acciones APU |
| appState.budget.items | add/update/remove | renderBudgetItems(), renderBudgetSummary() | budgetItemsBody, budgetFooter, resumen |
| appState.budget.totals | calculateTotalsFromItems() | renderBudgetSummary(), renderDashboardView() | tarjetas financieras y grandTotal |
| appState.settings | updateEconomicSetting() | renderSettings(), renderBudgetSummary() | inputs data-setting |
| appState.workflow | changeWorkflowStage(), decideWorkflow() | renderWorkflowView(), renderHeader() | workflow-view-container, badges, timeline |
| comments/approvals/auditLog | addWorkflowComment(), createApprovalRecord(), logAuditEvent() | workflow, documents, legal, audit y dashboard | listas de comentarios, decisiones y eventos |
| budget.scenarios | ensureDefaultScenarios(), calculateScenarioTotals() | renderScenariosView() | scenarios-view-container |
| datos financieros/riesgo | getFinancialSCurveData(), getCostDistributionByCategory(), getTopCostDrivers(), getWorkflowStageDurations() | render*Chart() | canvas chart ids y data-chart-message |

bindStaticEvents() instala delegación de click, input y change en document. handleAppClick() resuelve data-action; handleAppInput() resuelve búsqueda, quantity y settings; handleAppChange() resuelve selectores y filtros.

## Flujos funcionales end-to-end

### Carga sin sesión

1. GET / entrega index.html.
2. El ui-layer muestra login-screen y oculta app.
3. No se ejecuta hidratación API antes de autenticar.
4. GET /api/me sin cookie pasa por requireAuth() y devuelve 401 AUTH_REQUIRED.
5. Resultado: formulario visible y aplicación protegida.

### Login inválido

1. login-form llama apiClient.login().
2. POST /api/login valida el objeto y campos.
3. Un cuerpo vacío no consulta DB.
4. Responde 400 INVALID_CREDENTIALS.
5. El ui-layer muestra login-error.
6. Este recorrido fue ejecutado contra npm start.

### Login válido

1. apiClient.login() envía email/password.
2. authenticate() usa USER_SELECT, active y bcrypt.compare().
3. Express regenera sesión y almacena userId.
4. safeUser() devuelve datos seguros.
5. apiClient.getMe() confirma la identidad.
6. applyAuthenticatedUser() actualiza appState y renderiza la app.
7. El código está conectado, pero falta verificación con PostgreSQL real.

### Agregar, incrementar, editar y eliminar APU

1. Un click data-action entra por handleAppClick().
2. addApuToBudget() busca por apuId; incrementa quantity si existe o crea una partida.
3. calculateBudgetTotals() actualiza el total.
4. renderBudgetItems() y renderBudgetSummary() actualizan la tabla y el footer.
5. El input data-action=quantity entra por handleAppInput(), valida decimal y recalcula subtotal.
6. removeBudgetItem() elimina por id y sincroniza el estado local.
7. persistBudgetItemAdd/Update/Delete envían POST, PATCH o DELETE si la conexión remota está activa.

### Navegación y gráficos

1. Click data-view entra por navigateTo().
2. Se valida supportedViews y canViewForRole().
3. renderCurrentView() ejecuta el renderer registrado.
4. Los renderizadores de gráficos destruyen instancias previas mediante chartRegistry.
5. Si Chart no existe, createChart() deja métricas textuales y escribe un fallback.

### Logout

1. El control data-ui-logout llama apiClient.logout().
2. Express destruye la sesión y limpia connect.sid.
3. El ui-layer limpia appState.session, oculta app y muestra login.

## Estado y gestión de datos

mockDB y appState son estado local relacionado. hydrateStateFromMockDB() inicializa la demo; syncCurrentBudgetToMockDB(), syncDocumentsToMockDB() y syncWorkflowToMockDB() reflejan cambios locales.

hydrateStateFromApi() puede sustituir datos locales con roles, users, clients, projects, APUs y budget remotos. La persistencia de presupuesto es opcional y asíncrona. Por eso mockDB no es la base de datos y puede divergir de PostgreSQL.

Los repositorios usan placeholders $1, $2 y siguientes para valores. Los identificadores dinámicos se obtienen de allowlists o information_schema y pasan por quoteIdentifier().

## Workflow y aprobaciones

index.html contiene WORKFLOW_STAGE, WORKFLOW_STATUS, workflowTransitions, getWorkflowStage(), getWorkflowStatus(), canTransitionTo(), changeWorkflowStage(), submitForTechnicalReview(), decideWorkflow(), createApprovalRecord() y renderWorkflowView().

Estas funciones modifican appState.workflow, budget.status, appState.data.approvals y mockDB.approvals cuando los guards locales coinciden. También agregan comentarios y AuditLog local.

No existe endpoint Express para cambiar etapa, crear approval, aprobar, rechazar o solicitar cambios. Por tanto workflow, approvals y revisiones son IMPLEMENTADO PARCIALMENTE, no un workflow servidor listo.

## Auditoría

logAuditEvent() crea id, budgetId, action, entityType, entityId, userId, role, description, timestamp y metadata; actualiza appState.data.auditLog y mockDB.auditLog. renderAuditView() lo filtra y muestra; el dashboard usa getRecentAuditEvents().

No hay tabla ni endpoint Node para audit events. La implementación es local y mutable, por lo que el audit trail persistente queda NO IMPLEMENTADO.

## Dependencias internas

Dependencias de producción:

- bcrypt.
- dotenv.
- express.
- express-session.
- pg.

Scripts:

- npm start: node server/server.js.
- npm run dev: node --watch server/server.js.
- npm run seed:users: node server/seed-users.js.
- npm test: node --test tests/*.test.js.

No hay scripts Vite ni dependencia runtime de Python, Flask o React. npm ls mostró bcrypt 6.0.0, dotenv 17.4.2, express 5.3.0, express-session 1.19.0 y pg 8.23.1.

## Verificación contra código

Se revisaron index.html completo, server/server.js, server/db.js, server/auth.js, server/serializers.js, server/errors.js, los tres repositorios, server/seed-users.js, la migración, package.json, package-lock.json, README.md, .gitignore, tests/server-contract.test.js, src/ y los AGENTS aplicables.

Conexiones confirmadas:

- apiClient.login(), getMe() y logout() usan rutas relativas.
- initializeApp() no hidrata PostgreSQL antes del login.
- applyAuthenticatedUser() alimenta appState.session.
- renderApp() y navigateTo() conectan estado, renderer y DOM.
- requireAuth() protege todas las rutas de datos.
- authenticate() está conectado a POST /api/login.
- findUserById() está conectado a GET /api/me.
- safeUser() y safeUserRow() omiten password_hash.
- addBudgetItem() evita duplicar una APU existente.
- updateBudgetItem() recalcula subtotal.
- chartRegistry y los renderizadores Chart.js se conectan a canvas dinámicos.

Inconsistencias corregidas:

1. Flask/psycopg fue sustituido por Node/Express/pg.
2. La migración y el seed se movieron a server/.
3. La prueba Python se sustituyó por tests/server-contract.test.js.
4. package.json dejó de declarar Vite/React como runtime y vite.config.js fue eliminado.
5. El comentario del ui-layer dejó de afirmar que la autenticación era Flask.
6. Chart.js ausente del HTML vigente fue restaurado desde el snapshot Git previo sin traer login fake ni role switcher.
7. La prueba de partida fue ajustada a PATCH porque GET /api/budget-items/:id no existe.
8. Se añadió timeout de conexión PostgreSQL de 1500 ms por defecto.
9. Se eliminó un import query sin uso del seed Node.

## Verificación funcional

### VERIFICADO POR EJECUCIÓN

- npm install: correcto; 92 paquetes auditados y 0 vulnerabilidades.
- node --check de todos los módulos server: correcto.
- vm.Script sobre los dos scripts inline de index.html: correcto.
- npm test: 5 tests, 5 pass, 0 fail.
- npm start: inició y anunció http://127.0.0.1:8000.
- Listener confirmado en 127.0.0.1.
- GET /: 200.
- GET /api/health: 200 con status ok.
- GET /api/health/db: 503 sanitizado sin DB_PASSWORD.
- GET /api/me sin sesión: 401.
- POST /api/login con cuerpo vacío: 400.
- Rutas sin sesión de roles, users, clients, projects, APUs, presupuesto y PATCH de partida: 401.
- HTML sin DB_PASSWORD=, postgresql://, hostname PostgreSQL, password_hash ni roleSwitcher.

### VERIFICADO POR INSPECCIÓN

- HOST y PORT están fijados en server/server.js.
- DB_PASSWORD solo se toma del entorno Node.
- bcrypt se usa para comparar y generar hashes.
- La sesión guarda userId y no el rol enviado por el navegador.
- Los valores SQL usan parámetros.
- No existe carpeta estática genérica.
- package.json y npm start no requieren Python, Flask ni Vite.
- Chart.js tiene un CDN y un chartRegistry conectado a renderers.
- mockDB, appState, 20 APUs, cálculos, filtros, event delegation, AuditLog y aliases permanecen conectados.

### NO VERIFICADO

- Conexión exitosa al PostgreSQL remoto.
- Ejecución de migración y seed.
- Login correcto con seis usuarios demo.
- Lecturas/escrituras de APUs y presupuesto contra el esquema real.
- Render visual del navegador con CDN Chart.js cargada.
- Store persistente de sesiones.

## Limitaciones actuales

1. No existe .env local con DB_PASSWORD; login y datos remotos no pueden completarse.
2. password_hash no se ha añadido en al_bd.
3. npm run seed:users no se ejecuta automáticamente y aún no fue ejecutado.
4. Express exige sesión, pero no permisos de negocio por endpoint; falta 403.
5. rolePermissions y hasPermission() son guards del cliente, no seguridad server-side.
6. MemoryStore pierde sesiones al reiniciar.
7. mockDB/appState pueden divergir de PostgreSQL.
8. Workflow, approvals, comments, documents, signatures, legal y escenarios no están persistidos por Node.
9. Chart.js no fue verificado visualmente en navegador.
10. src/ sigue siendo una arquitectura React/Vite paralela no montada por index.html.

## Cambios de esta iteración

1. Se creó server/server.js con Express, sesión, rutas, errores y entrega de index.html.
2. Se crearon server/db.js, auth.js, errors.js y serializers.js.
3. Se trasladaron los tres repositorios a JavaScript con SQL parametrizado.
4. Se creó server/migrations/001_add_password_hash.sql.
5. Se convirtió el seed Python en server/seed-users.js con bcrypt.hash().
6. Se creó .env.example en la raíz.
7. Se actualizó package.json y package-lock.json con las dependencias Node.
8. Se dejó npm start como comando de runtime.
9. Se eliminaron backend/, tests/test_backend_contract.py y vite.config.js.
10. Se creó tests/server-contract.test.js.
11. Se actualizó README.md y .gitignore.
12. Se restauró conservativamente el engine Chart.js previo.
13. Se creó md/fase-5-5.md sin modificar md/fase-5-4.md.

## Impacto técnico de esta iteración

### Archivos creados

.env.example; server/server.js; server/db.js; server/auth.js; server/errors.js; server/serializers.js; server/seed-users.js; server/repositories/core-repository.js; server/repositories/apu-repository.js; server/repositories/budget-repository.js; server/migrations/001_add_password_hash.sql; tests/server-contract.test.js; md/fase-5-5.md.

### Archivos modificados

index.html; package.json; package-lock.json; README.md; .gitignore.

### Archivos eliminados

Todo backend/ y su contenido Python, incluyendo la migración histórica, seed, repositorios, documentación y cachés; tests/test_backend_contract.py; vite.config.js.

### Contratos conservados

apiClient relativo a /api, mockDB, appState, aliases, cálculos, renderers, IDs DOM, agrupaciones de respuesta roles/users/clients/projects/apus/budget/items y fallback local.

### Riesgos

El esquema remoto puede tener columnas no contempladas; MemoryStore no es persistente; el frontend conserva fallback mock; Tailwind y Chart.js dependen de CDN; no hay enforcement de permisos server-side.

## Compatibilidad

- El navegador sigue cargando una SPA Vanilla desde index.html.
- No se requiere Vite, React ni Python para npm start.
- La aplicación escucha solo en loopback.
- PostgreSQL solo se conecta desde Node mediante pg.
- bcrypt reemplaza check_password_hash() y generate_password_hash().
- La migración mantiene el cambio de esquema password_hash.
- Las rutas core, APU y presupuesto conservan su contrato general.
- src/ permanece, pero no participa en ejecución.

## Preparación para siguientes fases

La siguiente fase debe reutilizar session.userId, request.user, safeUser(), USER_SELECT, ApiError, withTransaction(), appState.workflow, los nombres de permisos y las estructuras locales como contrato de migración. No debe tratarlos como seguridad o persistencia completa.

Para declarar RBAC funcional deberá añadir requirePermission(permission), respuestas 403, permisos server-side por ruta, validación transaccional de etapas, persistencia de revisiones/decisiones/comentarios/audit y pruebas negativas de los seis roles, usuario inactivo y sesión expirada.

## Próxima fase

Fase 2 debe implementar RBAC y workflow en Express: catálogo de permisos persistente, autorización derivada de users/roles, endpoints de revisión técnica, financiera y gerencial, transiciones de etapa dentro de transacciones, approvals y comentarios persistidos, y respuestas 403. La UI puede conservar hasPermission() para ocultar controles, pero el servidor debe ser la autoridad.

Fase 2 no debe asumir que approvals[], comments[], documents[] o rolePermissions ya son persistencia o seguridad.

## Arquitectura Producción / Homelab

- PostgreSQL remoto por Tailscale sigue siendo la dependencia prevista.
- Node/Express publica solo 127.0.0.1:8000.
- DB_PASSWORD y SESSION_SECRET deben existir solo en .env local o variables del proceso.
- MemoryStore es solo de hackathon.
- Tailwind y Chart.js permanecen por CDN.
- MinIO, DocuSeal, Cal.com, n8n y Keycloak no están conectados.
- No se modificó infraestructura, Tailscale, PostgreSQL, firewall ni DNS.

## Contrato para la siguiente iteración

1. Ejecutar server/migrations/001_add_password_hash.sql en al_bd.
2. Crear .env local desde .env.example y definir DB_PASSWORD y SESSION_SECRET sin subirlo.
3. Ejecutar npm run seed:users manualmente.
4. Verificar login de las seis cuentas.
5. Mantener password_hash fuera de toda respuesta.
6. No aceptar role, permissions o userId del navegador para autorizar.
7. Mantener GET /api/me como fuente de identidad de la SPA.
8. Añadir requirePermission() y 403 antes de afirmar RBAC funcional.
9. Persistir workflow, approvals, comments y audit trail antes de afirmar revisiones reales.
10. No avanzar a Fase 2 dentro de esta iteración.

Estado final: el runtime Node arranca y responde; la migración Python fue retirada; la integración PostgreSQL real queda explícitamente parcial por falta de credenciales y ejecución de migración/seed; Fase 2 no se inició.
