# Fase 5 — Iteración 2

## Identificación

- Proyecto: BuildCost / Expo Clean.
- Fase vigente: 5 — Dashboard ejecutivo, Audit Trail, KPIs, Timeline y cierre final.
- Iteración: 2.
- Tipo de iteración: infraestructura local y persistencia, sin avance de fase de negocio.
- Fecha de verificación: 2026-10-16.
- Runtime activo: index.html, servido por Vite o por backend/app.py.
- Snapshot anterior: md/fase-5-1.md.
- Fase 6: no existe en el alcance y no se inició.

Este snapshot sigue md/AGENTS.md. El código real prevalece sobre el prompt y sobre snapshots anteriores. Se revisaron AGENTS.md, src/AGENTS.md, tests/AGENTS.md, md/AGENTS.md, md/fase-5-1.md e index.html antes de modificar.

## Resumen ejecutivo técnico

Esta iteración añade una frontera HTTP local y un backend Python para conectar, cuando existe un DB_PASSWORD local válido, el SPA con PostgreSQL mediante el hostname de Tailscale indicado por el proyecto. El navegador no contiene credenciales ni ejecuta conexiones PostgreSQL.

El backend está IMPLEMENTADO PARCIALMENTE:

- backend/app.py existe, escucha por defecto en 127.0.0.1:8000, sirve la SPA y expone health, core, APUs y presupuesto.
- backend/db.py centraliza la conexión psycopg 3, carga solo backend/.env y sanitiza errores.
- Los repositorios separan el SQL de los handlers y consultan information_schema para no inventar columnas sin que exista schema.sql.
- La ruta GET /api/health fue ejecutada y respondió 200.
- La ruta GET /api/health/db fue ejecutada sin contraseña y respondió 503 sanitizado. No se verificó una conexión real a al_bd porque el usuario no proporcionó DB_PASSWORD.
- No existe seed, migración ni schema.sql en el repositorio.

La integración del frontend está IMPLEMENTADA PARCIALMENTE:

- index.html tiene un único apiClient con métodos para health, core, APUs y partidas.
- initializeApp() conserva primero la carga de mockDB y después intenta hydrateStateFromApi().
- Si la API no está disponible, el flujo de Fase 1–5 permanece en memoria.
- Cuando la hidratación API tiene éxito, el presupuesto y el catálogo se reemplazan con la respuesta remota y las mutaciones de partidas se envían al backend.
- No se verificó en navegador una hidratación exitosa desde PostgreSQL ni una recarga que conserve datos remotos.

La funcionalidad de negocio de Fase 1–5 se conserva. Esta iteración no implementa revisión técnica, revisión financiera, aprobación gerencial, portal cliente nuevo, sistema legal nuevo, documentos reales, escenarios completos nuevos ni una fase posterior.

## Estado general de implementación

| Área | Estado | Implementado hoy | No implementado o no verificado |
|---|---|---|---|
| SPA existente Fase 1–5 | IMPLEMENTADO Y FUNCIONAL | index.html conserva el runtime inline, estado, renderers, navegación, presupuesto, workflow demo, escenarios, documentos demo, legal demo, dashboard y audit local | Persistencia remota verificada |
| Cliente HTTP frontend | IMPLEMENTADO PARCIALMENTE | apiClient.request() concentra el único fetch() y expone métodos por recurso | CORS entre orígenes distintos; no requerido para el flujo same-origin |
| Backend Flask | IMPLEMENTADO PARCIALMENTE | create_app(), handlers sanitizados, binding local y servicio de index.html | Despliegue productivo y servidor WSGI |
| Conexión Tailscale → PostgreSQL | IMPLEMENTADO PARCIALMENTE | configuración DB_HOST, DB_PORT, DB_NAME y DB_USER; psycopg usa el hostname | Conexión real y credenciales no verificadas |
| Health sin DB | IMPLEMENTADO Y FUNCIONAL | GET /api/health responde status ok | No aplica |
| Health de DB | IMPLEMENTADO PARCIALMENTE | SELECT de identidad y respuesta 503 sin contraseña; validación esperada al_bd/al_app | Respuesta 200 contra la base remota |
| Roles, usuarios, clientes, proyectos | IMPLEMENTADO PARCIALMENTE | CoreRepository consulta tablas existentes y convierte nombres de campos | Datos y columnas reales no verificados |
| Catálogo APU | IMPLEMENTADO PARCIALMENTE | ApuRepository lista y obtiene APUs, conserva JSONB components | Esquema real, 20 registros remotos y campos reales no verificados |
| Presupuesto remoto | IMPLEMENTADO PARCIALMENTE | BudgetRepository lee presupuesto, items, totals y settings y valida IDs/cantidades | CRUD remoto no ejecutado contra al_bd |
| Persistencia de partidas | IMPLEMENTADO PARCIALMENTE | POST incrementa una partida existente por APU; PATCH actualiza quantity/subtotal; DELETE elimina | Confirmación de columnas, transacciones y recarga remota no verificada |
| Cálculo financiero | IMPLEMENTADO Y FUNCIONAL en demo | calculateTotalsFromItems() y calculateBudgetTotals() siguen siendo la única fuente de fórmulas del SPA | Cálculo del backend no existe ni debe duplicarse |
| Audit log remoto | IMPLEMENTADO PARCIALMENTE | AuditLog local append-only se conserva; el backend no actualiza audit_log | Persistencia append-only de audit_log no conectada |
| Seed/migración | NO IMPLEMENTADO | No se crean datos ni tablas | Requiere schema.sql y contrato explícito |
| Fases de negocio posteriores | NO IMPLEMENTADO como cambio de esta iteración | Se conserva el código demo existente | No se inició una fase nueva |

## Cómo funciona actualmente

El archivo index.html sigue siendo el runtime usado. Al cargarse, initializeApp() llama hydrateStateFromMockDB(), carga el dataset de veinte APUs hardcodeado, asegura escenarios base, recalcula totales, captura demoInitialSnapshot, renderiza y registra event delegation.

Después del primer render, initializeApp() ejecuta hydrateStateFromApi(). La función lanza en paralelo getRoles(), getUsers(), getClients(), getProjects(), getApus() y getBudget() a través de apiClient. Si todas responden con un presupuesto válido, reemplaza appState.data para esos recursos, normaliza partidas, aplica settings y totals, marca apiConnectionState como postgres, recalcula y renderiza otra vez. Si falla cualquier llamada, apiConnectionState vuelve a mock y no se descarta el estado de demo.

Las mutaciones siguen siendo síncronas para que la interfaz responda inmediatamente:

1. addApuToBudget() busca el APU, incrementa el item existente o crea uno nuevo, recalcula y renderiza. Si la hidratación remota fue exitosa, persistBudgetItemAdd() envía solo el incremento solicitado, no la cantidad acumulada.
2. updateBudgetItemQuantity() normaliza la cantidad a un número finito no negativo, recalcula y llama persistBudgetItemUpdate() en modo remoto.
3. removeBudgetItem() elimina localmente, recalcula y llama persistBudgetItemDelete() en modo remoto.
4. updateEconomicSetting() mantiene el cálculo frontend. El evento change llama persistBudgetSnapshot() para enviar totals y settings al presupuesto remoto.

El backend recibe HTTP/JSON. app.py valida el cuerpo mínimo y delega. db.py abre una transacción psycopg con DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD. Los repositorios hacen SELECT/INSERT/UPDATE/DELETE parametrizados. Los identificadores SQL dinámicos solo se toman de information_schema y se validan antes de citarse.

## Arquitectura global

| Capa | Código real | Responsabilidad actual |
|---|---|---|
| UI/runtime | index.html | HTML, CSS, Tailwind CDN, estado y JavaScript inline |
| Cliente API | index.html: API_CONFIG y apiClient | Único punto frontend que ejecuta fetch() |
| Estado local | index.html: mockDB y appState | Fallback determinista y estado normalizado |
| Backend HTTP | backend/app.py | Rutas, JSON, validación básica y errores sanitizados |
| Conexión | backend/db.py | Configuración, conexión, transacción e introspección de columnas |
| Serialización | backend/serializers.py | snake_case a camelCase y valores PostgreSQL a JSON |
| Repositorio core | backend/repositories/core_repository.py | roles, users, clients y projects |
| Repositorio APU | backend/repositories/apu_repository.py | listado y detalle de apus |
| Repositorio presupuesto | backend/repositories/budget_repository.py | presupuesto, partidas y snapshot financiero |
| Servidor de desarrollo | vite.config.js | Proxy /api desde Vite hacia 127.0.0.1:8000 |
| Documentación | md/fase-5-2.md | Estado versionado y evidencia |

Flujo objetivo local:

SPA → HTTP/JSON → Flask 127.0.0.1 → psycopg → hostname Tailscale → PostgreSQL al_bd.

El navegador nunca recibe DB_PASSWORD. No se añadió CORS global. El recorrido same-origin es backend sirviendo index.html, y el recorrido de desarrollo usa el proxy de Vite.

## Estructura física del proyecto

Archivos revisados o afectados:

- index.html: runtime activo, mockDB, appState, engines, renderers, eventos y apiClient.
- vite.config.js: proxy local de /api a 127.0.0.1:8000.
- backend/app.py: aplicación Flask y rutas.
- backend/db.py: conexión, transacción, configuración y metadata de esquema.
- backend/errors.py: errores API sanitizados.
- backend/serializers.py: serialización central.
- backend/repositories/core_repository.py: recursos core.
- backend/repositories/apu_repository.py: catálogo APU.
- backend/repositories/budget_repository.py: presupuesto y partidas.
- backend/verify_db.py: verificación directa de current_database() y current_user.
- backend/requirements.txt: Flask, psycopg[binary] y python-dotenv.
- backend/.env.example: valores de conexión sin contraseña.
- backend/README.md: instalación, ejecución, endpoints y límites.
- .gitignore: exclusión de .env, backend/.env, *.pid, __pycache__/ y .venv/.
- tests/test_backend_contract.py: pruebas de contrato sin credenciales.
- md/fase-5-1.md: snapshot anterior revisado, no sobrescrito.
- md/AGENTS.md, AGENTS.md, src/AGENTS.md y tests/AGENTS.md: reglas aplicables revisadas.

No existe schema.sql, no existe database/seed.sql y no existe backend/seed.py. src/ continúa siendo una arquitectura React/Vite paralela no importada por index.html.

## Datos y modelos actuales

### mockDB

mockDB sigue conteniendo users, roles, clients, projects, apus, budgets, documents, comments, approvals, signatures, auditLog y priceReferences. El catálogo local se carga con APU-001 a APU-020. La base mock continúa siendo un fallback y no se elimina al activar la API.

### appState

appState conserva session, ui, filters, data, currentProjectId, currentBudgetId, settings y workflow. appState.data es la fuente usada por los renderers. Los aliases currentUser, activeView, apuCatalog, budget, auditLog, documents, comments, signatures y roles se mantienen.

### Datos PostgreSQL esperados por el backend

El código consulta las tablas roles, users, clients, projects, apus, budgets y budget_items porque son los recursos definidos por el contrato de integración. No se inventa un schema: cada repositorio consulta information_schema antes de construir la consulta de datos.

- roles, users, clients y projects se devuelven como registros completos, con nombres de campos snake_case convertidos a camelCase.
- apus conserva el objeto JSONB components si PostgreSQL lo devuelve.
- budgets devuelve budget, items, totals y settings.
- budget_items requiere una columna compatible con budget_id, una con apu_id, una con quantity, una con unit_price y, cuando existe, una con subtotal.
- Si falta una columna requerida, el backend devuelve SCHEMA_UNSUPPORTED y no crea una sustituta.

### Fórmulas

El frontend calcula directCost, overhead, contingency, profit, subtotal, tax y grandTotal en calculateTotalsFromItems(). El backend no duplica estas fórmulas. Las operaciones remotas pueden guardar el snapshot totals/settings recibido de la SPA cuando existen esas columnas JSON/JSONB en budgets.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| Configuración segura | IMPLEMENTADO Y FUNCIONAL | backend/.env.example, db.py, .gitignore | No expone secreto | DB_PASSWORD solo proceso/backend | Inspección y pruebas de ausencia en HTML | Infraestructura |
| Backend local | IMPLEMENTADO PARCIALMENTE | backend/app.py | Backend sirve index.html | Inicia en 127.0.0.1:8000 | Ejecución del proceso y test client | Infraestructura |
| Health API | IMPLEMENTADO Y FUNCIONAL | app.py /api/health | No tiene pantalla propia | GET devuelve status ok | VERIFICADO POR EJECUCIÓN | Infraestructura |
| Health PostgreSQL | IMPLEMENTADO PARCIALMENTE | database_identity(), /api/health/db | No tiene pantalla propia | Devuelve 503 sanitizado sin DB_PASSWORD | VERIFICADO POR EJECUCIÓN solo en fallo esperado | Infraestructura |
| Tailscale | IMPLEMENTADO PARCIALMENTE | .env.example DB_HOST | No visible | psycopg usaría desktop-o7rhpvg.taila61603.ts.net | Configuración inspeccionada | Infraestructura |
| Core API | IMPLEMENTADO PARCIALMENTE | CoreRepository y cuatro rutas | Consume respuestas en hydrateStateFromApi() | GET por recurso | Rutas inspeccionadas; DB no verificada | Infraestructura |
| APU API | IMPLEMENTADO PARCIALMENTE | ApuRepository y /api/apus | Reemplaza appState.data.apus al hidratar | GET listado/detalle | Rutas y serializer inspeccionados | Infraestructura |
| Presupuesto API | IMPLEMENTADO PARCIALMENTE | BudgetRepository y rutas budget | Reemplaza presupuesto local | GET/POST/PATCH/DELETE | Rutas y validaciones inspeccionadas | Infraestructura |
| Add sin duplicado | IMPLEMENTADO PARCIALMENTE | addApuToBudget() y add_item() | Botón de catálogo | Local incrementa; remoto busca budget+apu antes de insertar | Local heredado; remoto no verificado | Fase 1 + persistencia |
| Cantidades decimales | IMPLEMENTADO Y FUNCIONAL localmente | updateBudgetItemQuantity(), calculateTotalsFromItems() | Input data-action quantity | Normaliza finito no negativo y recalcula | Código y build; flujo UI no repetido en esta iteración | Fase 1 |
| Eliminación | IMPLEMENTADO PARCIALMENTE | removeBudgetItem(), delete_item() | Acción remove-item | Local elimina; remoto DELETE si está conectado | Código y rutas; DB no verificada | Fase 1 + persistencia |
| Parámetros económicos | IMPLEMENTADO PARCIALMENTE | updateEconomicSetting(), PATCH snapshot | Inputs data-setting | Fórmula local; snapshot remoto opcional | Código; DB no verificada | Fase 1 + persistencia |
| AuditLog | IMPLEMENTADO PARCIALMENTE | logAuditEvent(), appState.data.auditLog | Audit view y filtros | Local append-only por acciones existentes | Heredado y revisado; remoto pendiente | Fase 5 + persistencia |
| Seed/migración | NO IMPLEMENTADO | No existe archivo | No aplica | No se ejecuta | Búsqueda de schema/seed | Infraestructura |
| Fase 2–5 nueva | NO IMPLEMENTADO como cambio | No se añadió lógica nueva de negocio | No se añadió UI nueva | No aplica | Inspección de diff | Fuera de alcance |

## Roles y estado RBAC

El RBAC que existe hoy está en index.html mediante rolePermissions, getCurrentRole(), hasPermission(), canEditBudget(), canViewForRole() y guards dentro de engines y handlers. No existe autenticación backend ni middleware que asocie una petición HTTP con un rol. Por eso el RBAC local es funcional para la demo, mientras que la autorización de la API es IMPLEMENTADO PARCIALMENTE.

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí, mockDB.roles y rolePermissions | apu:read, budget:read/write/delete/quantity, settings:write, workflow submit, escenarios, precios, dashboard y audit | Catálogo, presupuesto, settings, workflow, escenarios, documentos, legal demo, dashboard y audit según vista | Puede editar presupuesto, cantidades, settings, enviar a revisión y operar acciones permitidas por guards; API no verifica su identidad | IMPLEMENTADO PARCIALMENTE respecto de backend; IMPLEMENTADO Y FUNCIONAL local |
| Revisor Técnico | Sí | budget:read, workflow technical review/approve/reject, comentarios, documentos read/preview, escenarios read, variance/risk y dashboard/audit | Workflow técnico, vistas internas permitidas y comentarios | Puede aprobar/rechazar la etapa técnica en la sesión local cuando el workflow y permiso coinciden; no puede editar presupuesto | IMPLEMENTADO PARCIALMENTE respecto de backend; local funcional |
| Director Financiero | Sí | budget:read, workflow financial review/approve/reject, documentos/propuesta, escenarios/precios/variance/risk y dashboard/audit | Workflow financiero, propuesta interna, escenarios y dashboard | Puede decidir la revisión financiera en la sesión local; no existe enforcement en Flask | IMPLEMENTADO PARCIALMENTE respecto de backend; local funcional |
| Gerente General | Sí | budget:read, workflow management review/approve/reject, propuesta, contrato/sign, escenarios read y dashboard/audit | Revisión gerencial, contrato demo, firma demo y dashboard | Puede decidir gerencia y firmar en el modelo demo si los guards lo permiten; no autenticación real | IMPLEMENTADO PARCIALMENTE respecto de backend; local funcional |
| Cliente | Sí | budget/proposal read/view, approve/request-changes, comentarios cliente, contract read/sign y dashboard:view | Portal cliente, propuesta y acciones de cliente del runtime actual | Puede aprobar o solicitar cambios en el flujo local según documento, estado y permiso; API no conoce al cliente | IMPLEMENTADO PARCIALMENTE respecto de backend; local funcional |
| Oficial Legal | Sí | budget:read, workflow legal, comentarios, documentos, contract:read, dashboard internal y audit | Legal, documentos y contrato demo | Puede iniciar/aprobar/rechazar revisión legal y preparar contrato en la demo; no sistema legal real ni autorización HTTP | IMPLEMENTADO PARCIALMENTE respecto de backend; local funcional |

No se afirma que el backend tenga RBAC: app.py no recibe token, sesión ni rol, y los repositorios no autorizan por usuario. La fase de identidad/autorización remota queda pendiente de una instrucción específica y no se implementó aquí.

## Componentes principales

### index.html

- No es un componente React; es el runtime HTML/JavaScript activo.
- Renderiza sidebar, header, vistas de catálogo, presupuesto, workflow, escenarios, portal, documentos, legal, dashboard y audit.
- Consume appState, mockDB, funciones de cálculo y guards.
- Usa event delegation sobre document mediante bindStaticEvents().

### apiClient en index.html

- No renderiza UI.
- apiClient.request() construye la URL, añade headers JSON, ejecuta el único fetch(), interpreta JSON y rechaza respuestas HTTP no exitosas.
- Métodos públicos: getHealth(), getHealthDb(), getRoles(), getUsers(), getClients(), getProjects(), getApus(), getApu(), getBudget(), updateBudgetSnapshot(), addBudgetItem(), updateBudgetItem() y deleteBudgetItem().
- No recibe ni almacena contraseña.

### backend/app.py

- create_app() registra handlers, sirve index.html y define todas las rutas.
- No contiene SQL de negocio.
- Sus handlers convierten el resultado de repositorio a JSON y read_json() valida que el cuerpo sea un objeto.

### Repositorios

- CoreRepository.list() consulta una tabla permitida y devuelve registros serializados.
- ApuRepository.list() y get() consultan apus y preservan components JSONB.
- BudgetRepository.get(), add_item(), update_item(), delete_item() y update_snapshot() encapsulan las operaciones del presupuesto.
- No hay props ni callbacks porque son módulos backend; sus entradas son IDs y payloads JSON.

### src/

src/main.jsx y src/App.jsx existen como arquitectura React paralela, pero index.html no los importa. No se modificaron para evitar crear dos runtimes o romper una arquitectura no activa.

## Funciones y utilidades principales

| Función | Archivo | Responsabilidad actual | Estado |
|---|---|---|---|
| API_CONFIG | index.html | Habilita API por defecto, permite deshabilitarla con window.BUILDCOST_API_ENABLED y permite cambiar base URL | IMPLEMENTADO Y FUNCIONAL |
| apiClient.request() | index.html | Único fetch frontend, headers, JSON y errores | IMPLEMENTADO Y FUNCIONAL |
| hydrateStateFromApi() | index.html | Lee core/APUs/presupuesto, reemplaza appState y vuelve a renderizar; fallback a mock | IMPLEMENTADO PARCIALMENTE |
| persistBudgetItemAdd() | index.html | Envía un incremento unitario o la cantidad solicitada; evita doble incremento remoto | IMPLEMENTADO PARCIALMENTE |
| persistBudgetItemUpdate() | index.html | Envía quantity y snapshot a PATCH | IMPLEMENTADO PARCIALMENTE |
| persistBudgetItemDelete() | index.html | Envía DELETE y snapshot | IMPLEMENTADO PARCIALMENTE |
| persistBudgetSnapshot() | index.html | Envía totals/settings al PATCH de presupuesto | IMPLEMENTADO PARCIALMENTE |
| connection() | backend/db.py | Abre psycopg solo con contraseña de entorno y devuelve error sanitizado | IMPLEMENTADO PARCIALMENTE |
| transaction() | backend/db.py | Ejecuta commit o rollback | IMPLEMENTADO PARCIALMENTE |
| database_identity() | backend/db.py | Ejecuta current_database() y current_user | IMPLEMENTADO PARCIALMENTE |
| table_columns() | backend/db.py | Inspecciona information_schema | IMPLEMENTADO Y FUNCIONAL por código |
| serialize_row() | backend/serializers.py | Convierte snake_case, Decimal y fechas a JSON | IMPLEMENTADO Y FUNCIONAL por pruebas indirectas |
| calculateTotalsFromItems() | index.html | Fuente única de las fórmulas financieras | IMPLEMENTADO Y FUNCIONAL local |
| calculateBudgetTotals() | index.html | Guarda totals, recalcula escenarios y sincroniza mockDB | IMPLEMENTADO Y FUNCIONAL local |
| syncCurrentBudgetToMockDB() | index.html | Mantiene mockDB.budgets alineado con appState.budget | IMPLEMENTADO Y FUNCIONAL local |
| logAuditEvent() | index.html | Añade registros al AuditLog local y mockDB | IMPLEMENTADO Y FUNCIONAL local |

## Flujos funcionales end-to-end

### Arranque con fallback mockDB

1. El navegador carga index.html.
2. initializeApp() hidrata mockDB, carga 20 APUs y calcula el presupuesto.
3. renderApp() actualiza las vistas y bindStaticEvents() conecta click, input y change.
4. hydrateStateFromApi() intenta las llamadas HTTP.
5. Si el backend está apagado, el catch mantiene apiConnectionState en mock y no reemplaza appState.
6. Resultado: el flujo demo permanece disponible en memoria.

La conexión lógica está VERIFICADA POR INSPECCIÓN. El parser del JavaScript y el build pasan; no se ejecutó un navegador en esta iteración.

### Arranque con API y PostgreSQL

1. initializeApp() ejecuta en paralelo las seis lecturas.
2. Flask delega cada lectura al repositorio correspondiente.
3. El repositorio abre una transacción, consulta columnas y registros y serializa la respuesta.
4. hydrateStateFromApi() reemplaza roles, users, clients, projects, apus y el presupuesto actual.
5. calculateBudgetTotals() conserva las fórmulas del frontend.
6. renderApp() actualiza la UI y muestra un toast de carga desde PostgreSQL.

La ruta completa depende de DB_PASSWORD, tablas y columnas reales. Estado: NO VERIFICADO.

### Agregar APU existente

1. El usuario pulsa un botón data-action=add-apu.
2. handleAppClick() llama addApuToBudget().
3. La función busca el APU por id, aumenta quantity en 1 si ya existe o crea un item.
4. calculateBudgetTotals(), renderBudgetItems(), renderBudgetSummary() y updateBudgetIndicators() actualizan la UI.
5. persistBudgetItemAdd() envía quantity=1 al backend cuando apiConnectionState es postgres.
6. BudgetRepository.add_item() busca el par budget_id + apu_id y actualiza la partida existente o inserta una nueva.

El flujo local está heredado y conectado. La escritura remota no fue ejecutada contra PostgreSQL.

### Editar cantidad decimal

1. input o change llega a handleAppInput() o handleAppChange() por delegación.
2. updateBudgetItemQuantity() convierte la entrada a Number y convierte valores inválidos o negativos a 0.
3. Se calcula subtotal=quantity*unitPrice y se recalculan los totales.
4. La UI actualiza subtotal y resumen.
5. En API, persistBudgetItemUpdate() envía quantity y el snapshot financiero.
6. BudgetRepository.update_item() actualiza quantity y subtotal con parámetros.

Estado: IMPLEMENTADO Y FUNCIONAL localmente; persistencia remota NO VERIFICADA.

### Eliminar partida

1. El usuario pulsa data-action=remove-item.
2. handleAppClick() llama removeBudgetItem().
3. Se quita el item, se audita, se recalcula y se renderizan tabla y resumen.
4. persistBudgetItemDelete() llama DELETE /api/budget-items/<item_id> en modo remoto.
5. El repositorio elimina por ID y puede actualizar totals/settings si se enviaron.

Estado: IMPLEMENTADO Y FUNCIONAL localmente; persistencia remota NO VERIFICADA.

### Navegación y flujo de negocio existente

La navegación y workflow de Fase 1–5 siguen usando navigateTo(), viewRegistry, changeWorkflowStage(), workflowTransitions(), guards y renderers existentes. Esta iteración no cambia las transiciones ni agrega aprobaciones nuevas. La persistencia remota no cubre workflow, documentos, comentarios, approvals ni signatures.

## Estado y gestión de datos

mockDB y appState no se eliminaron. appState es la fuente de render y mockDB se sincroniza desde calculateBudgetTotals() mediante syncCurrentBudgetToMockDB(). La API no se mezcla directamente dentro de renderers: solo hydrateStateFromApi() y las funciones persistBudget* conocen apiClient.

El estado de conexión tiene tres valores observables en código:

- mock: fallback inicial o API no disponible.
- postgres: las seis lecturas API terminaron con presupuesto válido.
- degraded: falló una persistencia posterior; el cambio local no se revierte automáticamente.

No se guarda información en localStorage, sessionStorage ni cookies. No se crea .env. El DB_PASSWORD solo puede existir en backend/.env local o en variables de entorno del proceso.

La persistencia de settings y totals es un snapshot enviado por el frontend. No se recalculan fórmulas en backend. El presupuesto remoto debe tener columnas JSON/JSONB compatibles para conservar ese snapshot.

## Workflow y aprobaciones

El workflow demo existente permanece en index.html:

- WORKFLOW_STAGE y WORKFLOW_STATUS definen valores.
- workflowTransitions define destinos.
- changeWorkflowStage() valida transición, permisos, actualiza appState.workflow y genera auditoría.
- approvals, comments, documents y signatures siguen siendo estructuras y motores locales descritos en md/fase-5-1.md.

El backend de esta iteración no expone endpoints de workflow, approvals, comments, documents ni signatures. No se conectó ningún botón de aprobación a PostgreSQL. La persistencia remota de esas estructuras es NO IMPLEMENTADO en esta iteración.

## Auditoría

AuditLog local continúa conectado:

- logAuditEvent() genera eventos para acciones existentes.
- appState.data.auditLog es leído por renderAuditView().
- mockDB.auditLog se mantiene sincronizado por las funciones actuales.
- El dashboard y Audit Trail siguen siendo locales.

El backend no inserta, actualiza ni elimina audit_log. Esto evita violar el requisito append-only, pero significa que la auditoría remota es IMPLEMENTADO PARCIALMENTE: existe el log local; no existe el contrato SQL ni el endpoint append-only. No se usa UPDATE ni DELETE contra audit_log en el código añadido.

## Dependencias internas

- Flask 3.x para HTTP local.
- psycopg 3 con binary para PostgreSQL.
- python-dotenv para leer backend/.env.
- Tailwind CSS por CDN sigue siendo la dependencia visual externa del runtime.
- Vite sigue sirviendo el frontend y ahora proxifica /api.
- No se añadió ORM, SQLAlchemy, Django, migración ni cliente PostgreSQL en el navegador.

## Verificación contra código

### Archivos y referencias revisados

- index.html fue leído en las áreas de configuración, mockDB, appState, aliases, RBAC, init, renderers, eventos, presupuesto, cálculos, workflow, dashboard y audit.
- Se confirmó que index.html no importa src/main.jsx; por eso es el runtime activo.
- Se inspeccionó vite.config.js y se agregó únicamente proxy /api.
- Se buscó schema.sql recursivamente y no existe.
- Se revisaron todos los AGENTS.md aplicables antes de editar.
- Se inspeccionaron md/fase-5-1.md y los snapshots previos como referencia, sin tratar sus afirmaciones como evidencia nueva.

### Inconsistencias encontradas y corregidas

1. El comentario inicial y el footer de index.html afirmaban que no había backend ni llamadas externas. Se corrigieron para describir el fallback mockDB y la API local opcional.
2. La arquitectura anterior no tenía frontera de persistencia. Se añadió apiClient como único punto de fetch y se conectó después del render inicial, preservando el fallback.
3. La operación de agregar una APU existente podía duplicar un incremento si el frontend enviaba la cantidad acumulada al backend. persistBudgetItemAdd() ahora envía solo el delta solicitado.
4. La documentación previa describía exclusivamente estado en memoria. Este snapshot deja explícito que existe backend local, pero que la conexión remota aún no está verificada.
5. No se encontró schema.sql. En lugar de inventar una migración, los repositorios inspeccionan information_schema y devuelven SCHEMA_UNSUPPORTED cuando faltan columnas.

### Referencias y handlers

- El único fetch() añadido está en apiClient.request().
- Los handlers frontend llaman apiClient indirectamente mediante hydrateStateFromApi() y persistBudget*.
- Las rutas Flask están presentes en app.url_map.
- Los handlers HTTP no contienen SQL.
- Los nombres de campos se convierten en backend/serializers.py.

## Verificación funcional

### VERIFICADO POR EJECUCIÓN

- python -m compileall -q backend tests.
- npm run build: Vite produjo dist/index.html sin error.
- Parser del JavaScript inline mediante new Function(): inline-js-ok.
- python -m unittest discover -s tests -p test_*.py -v: 5 pruebas OK, incluida la comprobación de que Flask no sirve backend/.env como archivo estático.
- Flask test client GET /api/health: 200 y {status: ok}.
- Flask test client GET /api/health/db sin DB_PASSWORD: 503 con DATABASE_UNAVAILABLE y sin contraseña en la respuesta.
- Importación de backend.app y creación de app.test_client().
- Arranque del proceso python -m backend.app: Flask anunció http://127.0.0.1:8000.

### VERIFICADO POR INSPECCIÓN

- Que backend/db.py usa el hostname Tailscale declarado y no escucha en 0.0.0.0.
- Que no existe contraseña en HTML, JSON, Markdown ni .env creado.
- Que frontend usa un único apiClient y no dispersa fetch en renderers.
- Que addApuToBudget() envía un delta de 1 para una APU repetida.
- Que el backend usa parámetros psycopg para valores y cita solo identificadores validados.
- Que el cálculo financiero permanece en calculateTotalsFromItems() y no se duplicó en el backend.
- Que mockDB, appState, aliases, renderers, event delegation y workflow local no se eliminan.
- Que no se añadieron funcionalidades de revisión/aprobación de nuevas fases.

### NO VERIFICADO

- Conexión real a desktop-o7rhpvg.taila61603.ts.net:5432.
- SELECT current_database() y current_user con identidad al_bd/al_app usando credenciales reales.
- Existencia y tipos exactos de roles, users, clients, projects, apus, budgets y budget_items.
- Que PostgreSQL tenga exactamente veinte APUs remotos.
- GET core/APUs/budget contra la base remota.
- POST, PATCH y DELETE contra budget_items reales.
- Persistencia de totals/settings y reload desde la base.
- Verificación de consola y clicks en navegador en esta iteración.
- AuditLog remoto append-only.
- CORS entre orígenes distintos; el contrato elegido es same-origin/proxy local.

### NO APLICA

- Migración o seed, porque no se recibió schema.sql y no se debe inventar.
- Revisión técnica, revisión financiera y aprobación gerencial nuevas.
- Portal cliente nuevo, documentos reales, sistema legal real y firma real.
- Escenarios completos de una fase nueva.

## Limitaciones actuales

1. Sin DB_PASSWORD el backend solo permite verificar health básico; /api/health/db y recursos PostgreSQL quedan 503.
2. Sin schema.sql no se puede certificar que las columnas reales coincidan con los candidatos inspeccionados.
3. Los IDs iniciales del mock, como BUD-001 y PRJ-001, se usan para iniciar la lectura API. El contrato no implementa una selección remota de presupuesto.
4. El backend no tiene autenticación ni RBAC; cualquier autorización actual pertenece al runtime local.
5. El backend no persiste workflow, comentarios, documentos, approvals, signatures ni AuditLog.
6. Si falla una escritura remota después de una mutación local, el estado de la SPA queda local y apiConnectionState pasa a degraded; no existe cola ni rollback remoto.
7. No existe indicador visual dedicado para mock, postgres o degraded; el código conserva apiConnectionState y solo muestra toast de éxito de hidratación.
8. El backend usa el servidor de desarrollo Flask. No es una configuración productiva.
9. No se implementó CORS abierto. Un frontend servido desde un origen distinto debe usar el proxy o una configuración explícita y restringida, que no forma parte de esta iteración.
10. El proceso de recarga remota y la reconciliación de IDs no fueron certificados contra la base real.

## Cambios de esta iteración

1. Se añadió backend/__init__.py, backend/app.py, backend/db.py, backend/errors.py y backend/serializers.py.
2. Se añadieron CoreRepository, ApuRepository y BudgetRepository en backend/repositories.
3. Se añadió backend/verify_db.py para ejecutar la consulta directa de identidad.
4. Se añadió backend/requirements.txt con Flask, psycopg[binary] y python-dotenv.
5. Se añadió backend/.env.example con DB_HOST=desktop-o7rhpvg.taila61603.ts.net, DB_PORT=5432, DB_NAME=al_bd, DB_USER=al_app, DB_PASSWORD vacío, BACKEND_HOST=127.0.0.1 y BACKEND_PORT=8000.
6. Se añadió backend/README.md con instalación, ejecución, endpoints y limitaciones.
7. Se actualizó .gitignore para excluir secretos y archivos de runtime.
8. Se añadió API_CONFIG, apiClient, hydrateStateFromApi() y funciones persistBudget* en index.html.
9. Se conectó initializeApp() con hidratación API posterior al render inicial.
10. Se modificaron addApuToBudget(), removeBudgetItem(), updateBudgetItemQuantity() y el manejo de settings para intentar persistencia remota sin cambiar el cálculo local.
11. Se actualizó vite.config.js con proxy /api hacia 127.0.0.1:8000.
12. Se actualizó el comentario de transparencia y el footer de index.html para no afirmar que no existe backend.
13. Se añadió tests/test_backend_contract.py.
14. Se restringió el servidor Flask a servir únicamente index.html, evitando exponer backend/.env u otros archivos del proyecto como assets estáticos.
15. Se creó este snapshot sin sobrescribir md/fase-5-1.md.

## Impacto técnico de esta iteración

### Archivos afectados

El runtime afectado es index.html; el backend es nuevo; vite.config.js, .gitignore y tests/test_backend_contract.py se modificaron o añadieron. No se modificó src/.

### Contratos nuevos

- API health: GET /api/health.
- API DB health: GET /api/health/db.
- Core: GET /api/roles, /api/users, /api/clients y /api/projects.
- APUs: GET /api/apus y GET /api/apus/<id>.
- Presupuesto: GET/PATCH /api/budgets/<budget_id>.
- Partidas: POST /api/budgets/<budget_id>/items, PATCH/DELETE /api/budget-items/<item_id>.
- Configuración de proceso: BACKEND_HOST, BACKEND_PORT, DB_HOST, DB_PORT, DB_NAME, DB_USER y DB_PASSWORD.

### Comportamiento conservado

mockDB, appState, el catálogo local de 20 APUs, permisos locales, workflow, cálculos, renderers, navegación, audit local y reset demo siguen presentes. La API no es requisito para que el modo mock se renderice.

### Riesgos de regresión

- Un esquema real con IDs o columnas no compatibles puede devolver SCHEMA_UNSUPPORTED o error sanitizado.
- Un presupuesto remoto con ID distinto de BUD-001 no puede descubrirse porque no existe endpoint de listado/selección de presupuestos en esta iteración.
- Un backend disponible pero sin datos compatibles provoca fallback completo a mock.
- La persistencia asíncrona no bloquea el render; puede dejar divergencia temporal si PostgreSQL rechaza la escritura.

## Compatibilidad

- Se preservan las firmas públicas de addApuToBudget(), removeBudgetItem(), updateBudgetItemQuantity(), updateEconomicSetting(), calculateBudgetTotals() y los handlers existentes.
- Se preservan los aliases de appState y la estructura de mockDB.
- Vite sigue usando el puerto 5173; solo se añadió proxy /api.
- El backend sirve el mismo index.html en el puerto 8000 para flujo same-origin.
- No se añadió una dependencia frontend de Node.
- El código frontend funciona con o sin backend; el comportamiento sin DB_PASSWORD permanece el fallback de demo.

## Preparación para siguientes fases

La siguiente iteración de infraestructura debe recibir o inspeccionar el schema.sql real, completar DB_PASSWORD en backend/.env solo en la máquina local, ejecutar backend/verify_db.py y verificar current_database=al_bd y current_user=al_app. Después debe ejecutar GET de core, APUs y presupuesto, y las operaciones de partida sobre datos controlados.

Para conectar auditoría sin romper el requisito append-only se necesitará un contrato explícito de columnas y un endpoint de inserción que solo haga INSERT. No debe añadirse UPDATE ni DELETE de audit_log.

Para autorización real se necesitará un mecanismo de identidad y autorización del backend. No debe confundirse rolePermissions del navegador con RBAC de API.

No se debe iniciar una nueva fase de negocio hasta cerrar estas verificaciones de infraestructura y confirmar que el flujo Fase 1–5 sigue disponible con fallback.

## Próxima fase

No se inicia Fase 6 ni otra fase de negocio. La próxima iteración recomendada es una verificación de persistencia contra el esquema real, no una funcionalidad de revisión, aprobación, portal, legal o dashboard nueva.

Trabajo concreto pendiente para esa iteración:

1. Obtener schema.sql o leer el esquema autorizado de al_bd.
2. Crear backend/.env local sin incluirlo en Git y completar DB_PASSWORD fuera de la documentación.
3. Ejecutar backend/verify_db.py y GET /api/health/db.
4. Verificar registros reales y mapear cualquier divergencia de nombres.
5. Probar GET/POST/PATCH/DELETE de presupuesto con una partida controlada.
6. Abrir el SPA en navegador, observar carga remota, agregar, editar, eliminar y recargar.
7. Decidir con evidencia si se mantiene fallback automático o se agrega un selector visible de origen.

## Arquitectura Producción / Homelab

La arquitectura objetivo de esta iteración es:

Browser SPA → Flask local 127.0.0.1 → psycopg → Tailscale → PostgreSQL al_bd.

Esto no es aún un despliegue productivo. No hay reverse proxy, WSGI productivo, TLS local configurado, pool de conexiones, backups, monitoreo, gestión de secretos, migraciones ni política de firewall implementada por este cambio. No se hicieron modificaciones de infraestructura o de Tailscale.

Equivalencias que siguen siendo objetivo y no implementación:

- PostgreSQL remoto autohospedado: objetivo de persistencia.
- MinIO: no conectado para documents.
- Keycloak: no conectado para identidad/RBAC.
- DocuSeal: no conectado para firma.
- Cal.com y n8n: no conectados.

## Contrato para la siguiente iteración

Entradas esperadas:

- schema.sql o acceso de lectura autorizado al esquema real.
- DB_PASSWORD provisto solo mediante backend/.env local o entorno del proceso.
- Un presupuesto y APU de prueba existentes, sin inventar IDs.

Resultados que deben certificarse:

- database_identity() devuelve al_bd y al_app.
- /api/health/db devuelve 200 con database al_bd.
- CoreRepository, ApuRepository y BudgetRepository leen las tablas reales.
- El SPA hidrata desde API sin undefined visible ni NaN.
- Agregar una APU existente incrementa una sola partida.
- Cantidad decimal, eliminación y snapshot totals/settings persisten.
- La recarga obtiene el mismo estado remoto.
- Fase 1–5 local no regresa a mock silenciosamente cuando la API sí está sana.
- AuditLog permanece append-only si se conecta.

Estados que deben seguir usando la siguiente iteración:

- IMPLEMENTADO Y FUNCIONAL: health básico, build, contrato local, cálculos y flujo mock.
- IMPLEMENTADO PARCIALMENTE: conexión DB, API de datos, persistencia, integración remota y RBAC de backend.
- PLACEHOLDER ESTRUCTURAL: no se crea una nueva estructura de negocio en esta iteración.
- NO IMPLEMENTADO: seed/migración, auth real, audit remoto, documentos persistentes y fases posteriores.
