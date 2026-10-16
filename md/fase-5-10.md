# Fase 5 — Iteración 10: herramienta aislada de datos demo PostgreSQL

## Identificación

- Fase: 5.
- Iteración: 10.
- Objetivo de esta iteración: crear una herramienta Python independiente para cargar, consultar y limpiar datos ficticios controlados en PostgreSQL.
- Fuente de verdad: código actual de `index.html`, `server/`, esquema real consultado en `al_bd` y ejecución de la herramienta.
- Documentación anterior revisada: `md/fase-5-9.md`.
- Documento nuevo: `md/fase-5-10.md`.
- Alcance explícitamente excluido: cambios en el runtime Node/Express, autenticación, usuarios, roles, contraseñas, workflow adicional, escenarios persistidos, documentos, legal, auditoría, Chart.js y cualquier avance funcional de otra fase.

## Resumen ejecutivo técnico

Se creó `tools/demo_data.py`. La herramienta lee el `.env` de la raíz, valida la identidad de la conexión (`al_bd`/`al_app`), valida las columnas reales de las cinco tablas que el runtime usa para clientes, proyectos, APUs y presupuesto, y ejecuta SQL mediante `psql` en una transacción.

La carga utiliza únicamente datos ficticios y IDs controlados:

- Cliente: `CLI-DEMO-001`.
- Proyecto: `PRJ-DEMO-001`.
- Presupuesto: `BUD-001`.
- APUs: `APU-DEMO-001` a `APU-DEMO-012`.
- Partidas: `BI-DEMO-001` a `BI-DEMO-010`.

La ejecución real creó 12 APUs y 10 partidas con cantidades decimales positivas. El estado verificado después de la carga fue:

- Cliente, proyecto y presupuesto: presentes.
- APUs controlados: `12/12`.
- Partidas controladas: `10/10`.
- Costo directo calculado desde partidas: `USD 52949.4350`.
- Total general almacenado en `budgets.totals`: `USD 73679.14`.

La herramienta no modifica `users`, `roles`, `password_hash`, `roles.permissions`, `scenarios`, `scenario_adjustments`, `price_references`, `documents` ni `audit_log`. No se ejecutó `cleanup`; los datos demo permanecen para revisión.

## Estado general de implementación

| Capacidad | Estado | Qué existe hoy | Qué no hace todavía | Fase |
|---|---|---|---|---|
| Herramienta Python de datos demo | IMPLEMENTADO Y FUNCIONAL | `tools/demo_data.py` con `start`, `status`, `cleanup` y `run` | No es un servicio ni reemplaza al runtime Node | Esta iteración |
| Lectura segura de `.env` | IMPLEMENTADO Y FUNCIONAL | `load_root_env()` lee `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` sin imprimir valores | No crea `.env` ni gestiona secretos fuera del proceso | Esta iteración |
| Uso de `psql` | IMPLEMENTADO Y FUNCIONAL | `resolve_psql()` busca `psql` en PATH y usa el fallback de PostgreSQL 18 en Windows; `run_psql()` pasa la contraseña como `PGPASSWORD` | No instala PostgreSQL ni dependencias | Esta iteración |
| Validación del esquema | IMPLEMENTADO Y FUNCIONAL | `validate_connection()`, `schema_columns()` y `validate_schema()` verifican identidad, tablas y columnas reales | No crea ni migra tablas | Esta iteración |
| Datos demo de clientes/proyectos/APUs/presupuesto | IMPLEMENTADO Y FUNCIONAL | Upserts idempotentes en cinco tablas reales | No agrega descripciones ni columnas que el esquema no tiene | Esta iteración |
| Limpieza controlada | IMPLEMENTADO Y FUNCIONAL | `build_cleanup_sql()` borra solo IDs controlados y en orden de dependencias | Puede fallar de forma segura si otro dato externo referencia esos registros | Esta iteración |
| Estado PostgreSQL en la SPA | IMPLEMENTADO PARCIALMENTE | `hydrateStateFromApi()` carga datos desde `/api/*`; el presupuesto demo ya responde por API | El endpoint de lectura no enriquece partidas con datos del APU; el servidor no aplica permisos de negocio | Fase 2 / evolución backend |
| RBAC | IMPLEMENTADO PARCIALMENTE | `rolePermissions`, `getPermissionsForRole()` y `hasPermission()` existen en `index.html`; el servidor valida sesión | `requireAuth` no autoriza cada operación según permiso/rol en PostgreSQL | Fase 2 |
| Workflow y approvals | IMPLEMENTADO PARCIALMENTE | Hay transiciones y funciones locales de decisión en `index.html` | No están persistidos por la herramienta ni conectados a endpoints de workflow | Fase 2 |
| Escenarios, price intelligence, variancias y riesgo | IMPLEMENTADO PARCIALMENTE | Existen estructuras y motores locales en `index.html` | Esta iteración no inserta ni sincroniza tablas de escenarios o referencias | Fase 3 |
| Portal cliente, documentos y legal | IMPLEMENTADO PARCIALMENTE | Existen vistas y estructuras locales de la SPA | No se cargan documentos, contratos ni firmas desde esta herramienta | Fase 4 |
| Dashboard, timeline y auditoría | IMPLEMENTADO PARCIALMENTE | Renderizadores locales calculan información desde `appState` y `auditLog` | La herramienta no escribe auditoría; no existe una fuente PostgreSQL para todo el dashboard | Fase 5 |

## Cómo funciona actualmente

El navegador carga `index.html`. La SPA intenta autenticarse mediante `/api/login`, restaura sesión con `/api/me` y, si la API está habilitada, `hydrateStateFromApi()` solicita en paralelo roles, usuarios, clientes, proyectos, APUs y `BUD-001`. El backend en `server/server.js` atiende esas rutas, `server/auth.js` resuelve la identidad desde PostgreSQL y los repositorios usan `server/db.js`/`pg`.

La herramienta nueva tiene otro recorrido, sin pasar por la SPA:

1. `python tools/demo_data.py start` lee el `.env` raíz.
2. `resolve_psql()` localiza el ejecutable de PostgreSQL.
3. `validate_connection()` ejecuta una consulta de identidad y rechaza una base o usuario distintos de `al_bd`/`al_app`.
4. `validate_schema()` consulta `information_schema.columns` y rechaza un esquema incompatible antes de modificar datos.
5. `build_start_sql()` construye un `BEGIN`, los upserts de clientes, proyecto, 12 APUs, presupuesto y 10 partidas, y un `COMMIT`.
6. `run_psql()` ejecuta ese SQL con `PGPASSWORD` únicamente en el entorno hijo; la contraseña no aparece en argumentos, SQL, stdout ni mensajes de error propios.
7. `status()` consulta presencia, conteos y totales sin devolver secretos.

El proceso Python termina después de `start` o `status`. El servidor continúa siendo Node/Express y no se modifica por esta herramienta.

## Arquitectura global

```text
Browser / index.html
        │ HTTP JSON + cookie de sesión
        ▼
server/server.js (Express en 127.0.0.1:8000)
        │ pg / server/db.js
        ▼
PostgreSQL remoto por Tailscale: al_bd / al_app

tools/demo_data.py
        │ subprocess + psql + PGPASSWORD en entorno del proceso
        ▼
PostgreSQL remoto por Tailscale: al_bd / al_app
```

La herramienta Python no se importa desde `server/server.js`, no se ejecuta al iniciar Flask/Node y no altera el contrato HTTP.

## Estructura física del proyecto

Archivos revisados o relevantes:

- `index.html`: SPA, `mockDB`, `appState`, motores de permisos, presupuesto, workflow, escenarios, renderizadores y cliente HTTP.
- `server/server.js`: Express, sesión, endpoints de salud, autenticación y presupuesto.
- `server/db.js`: conexión `pg`, carga de `.env`, identidad de base y utilidades de esquema.
- `server/auth.js`: autenticación y serialización segura de usuarios/roles.
- `server/repositories/core-repository.js`: lectura de `roles`, `users`, `clients` y `projects`.
- `server/repositories/apu-repository.js`: lectura de `apus`.
- `server/repositories/budget-repository.js`: lectura, inserción, actualización y eliminación de `budgets`/`budget_items`.
- `server/serializers.js`: conversión snake_case → camelCase para respuestas JSON.
- `server/migrations/001_add_password_hash.sql`: migración de contraseña hash, no tocada.
- `server/migrations/002_sync_role_permissions.sql`: sincronización de permisos, no tocada.
- `tests/server-contract.test.js`: contratos del runtime y de seguridad, no tocado.
- `tools/demo_data.py`: archivo creado en esta iteración.
- `md/AGENTS.md`: reglas que exige este snapshot.

## Datos y modelos actuales

### Esquema real consultado

La consulta de solo lectura a `information_schema` confirmó estas columnas:

| Tabla | Columnas reales utilizadas |
|---|---|
| `clients` | `id`, `name`, `tax_id`, `contact_name`, `email` |
| `projects` | `id`, `client_id`, `name`, `location`, `currency`, `status` |
| `apus` | `id`, `code`, `name`, `category`, `unit`, `unit_price`, `components` |
| `budgets` | `id`, `project_id`, `name`, `version`, `status`, `totals`, `settings` |
| `budget_items` | `id`, `budget_id`, `apu_id`, `quantity`, `unit_price`, `subtotal` |

Las claves verificadas son `id` como clave primaria en las cinco tablas y la restricción única compuesta `(budget_id, apu_id)` en `budget_items`. También se verificaron las FK `projects.client_id`, `budgets.project_id`, `budget_items.budget_id` y `budget_items.apu_id`.

### Datos creados

- `clients`: un cliente ficticio, `Constructora Andina Demo`.
- `projects`: un proyecto ficticio en Quito, moneda USD y estado `ACTIVE`.
- `apus`: 12 registros en cinco categorías: Movimiento de tierras, Hormigón, Acero, Mampostería, Enlucidos/acabados e Instalaciones hidrosanitarias.
- `components`: objeto JSONB con `labor`, `materials`, `equipment`, `transport` y `other`; la suma de los componentes coincide con el precio unitario demo de cada APU.
- `budgets`: `BUD-001`, versión 1, estado `DRAFT`, configuración USD con 8% gastos generales, 3% imprevistos, 10% utilidad y 15% IVA.
- `budget_items`: 10 APUs distintos, cantidades decimales positivas y `subtotal = quantity × unit_price`.

No se inventaron `description`, `currency`, `metadata`, `created_at` ni `updated_at` para APUs porque esas columnas no existen en la tabla real.

### Estructuras de la SPA no tocadas

`index.html` mantiene `mockDB`, `appState.data`, `appState.budget`, `appState.settings`, `appState.workflow`, `documents`, `comments`, `approvals`, `signatures`, `auditLog`, `priceReferences` y `scenarios`. Esas estructuras pertenecen al runtime de la SPA y la herramienta no las reemplaza ni las persiste automáticamente.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| Configuración de conexión demo | IMPLEMENTADO Y FUNCIONAL | `tools/demo_data.py`: `load_root_env()`, `run_psql()` | No aplica; CLI | Lee `.env` y ejecuta `psql` | `status` conectado a `al_bd` | Esta iteración |
| Descubrimiento de `psql` | IMPLEMENTADO Y FUNCIONAL | `resolve_psql()` | No aplica | PATH y fallback Windows | `py_compile` y `status` | Esta iteración |
| Validación de identidad DB | IMPLEMENTADO Y FUNCIONAL | `validate_connection()` | No aplica | Rechaza base/usuario inesperados | `status` confirmó `al_bd` | Esta iteración |
| Validación de columnas reales | IMPLEMENTADO Y FUNCIONAL | `schema_columns()`, `validate_schema()` | No aplica | Falla antes de mutar ante esquema incompatible | `start` pasó con el esquema real | Esta iteración |
| Cliente/proyecto demo | IMPLEMENTADO Y FUNCIONAL | `build_start_sql()` | Se muestra mediante datos cargados por `/api/clients` y `/api/projects` | Upsert idempotente | `status` presente | Esta iteración |
| Catálogo de APUs demo | IMPLEMENTADO Y FUNCIONAL | `demo_apus()`, upserts de `apus` | `renderApuCatalog()` consume `appState.data.apus` | 12 APUs con categorías y componentes | `status` `12/12`; GET protegido probado indirectamente con runtime | Esta iteración |
| Presupuesto y partidas demo | IMPLEMENTADO Y FUNCIONAL | `demo_items()`, `calculate_totals()`, upserts | `renderBudgetItems()`/`renderBudgetSummary()` consumen presupuesto | 10 partidas, cantidades decimales y totales positivos | GET `BUD-001` 200, 10 items | Esta iteración |
| Idempotencia | IMPLEMENTADO Y FUNCIONAL | `ON CONFLICT (id) DO UPDATE` | No aplica | Repetir `start` conserva 12/10 sin duplicar | `start` ejecutado dos veces | Esta iteración |
| Estado demo | IMPLEMENTADO Y FUNCIONAL | `status()` | No aplica | Presencia, conteos y totales | Dos ejecuciones de status | Esta iteración |
| Limpieza controlada | IMPLEMENTADO Y FUNCIONAL | `build_cleanup_sql()`, `cleanup()` | No aplica | DELETE por IDs concretos; no TRUNCATE/DROP | Verificado por inspección; no se ejecutó para conservar datos | Esta iteración |
| Persistencia HTTP de presupuesto | IMPLEMENTADO PARCIALMENTE | `server/repositories/budget-repository.js` | `hydrateStateFromApi()` | Lee y muta filas PostgreSQL | GET 200; API no enriquece campos derivables | Fase 2 |
| RBAC de frontend | IMPLEMENTADO PARCIALMENTE | `rolePermissions`, `hasPermission()` | `canViewForRole()` y botones condicionados | Bloquea acciones en la SPA | Inspección de `index.html` | Fase 2 |
| RBAC server-side | NO IMPLEMENTADO | `requireAuth` solo comprueba sesión | No aplica | Las rutas no comparan permiso por operación | Inspección de `server/server.js` | Fase 2 |
| Workflow local | IMPLEMENTADO PARCIALMENTE | `changeWorkflowStage()`, `createApprovalRecord()` | `renderWorkflowView()` | Cambios locales y decisiones locales | Inspección; no se persiste por herramienta | Fase 2 |
| Escenarios persistidos | NO IMPLEMENTADO en esta herramienta | No hay SQL de escenarios en `tools/demo_data.py` | SPA tiene motores locales | No se cargan filas PostgreSQL | Inspección de tablas y archivo | Fase 3 |
| Documentos/legal persistidos | NO IMPLEMENTADO en esta herramienta | No hay SQL de documentos/legal | SPA tiene vistas locales | No se crean documentos ni firmas | Inspección | Fase 4 |
| Audit trail PostgreSQL | NO IMPLEMENTADO en esta herramienta | `logAuditEvent()` solo modifica memoria/mockDB | `renderAuditView()` | No se insertan filas en `audit_log` | Conteo inicial y alcance del script | Fase 5 |

## Roles y estado RBAC

La fuente frontend `rolePermissions` está en `index.html` y la fuente autenticada remota llega desde `server/auth.js` mediante el objeto `role.permissions`. `applyAuthenticatedUser()` copia el usuario seguro y permisos a `appState.session`; `getPermissionsForRole()` usa los permisos de sesión para el rol autenticado y `hasPermission()` evalúa pertenencia o `*`.

El servidor actual usa `requireAuth` para exigir sesión en `/api/roles`, `/api/users`, `/api/clients`, `/api/projects`, `/api/apus` y presupuesto. No existe middleware que compare `request.user.role.permissions` con la operación HTTP. Por eso el estado RBAC global es `IMPLEMENTADO PARCIALMENTE`, no una autorización completa de backend.

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí, en frontend y roles PostgreSQL | Sí en SPA mediante `hasPermission()`; no por permiso en Express | Sí: presupuesto, catálogo, configuración, escenarios internos | Agregar APUs, incrementar existentes, editar cantidades, eliminar partidas, cambiar parámetros y enviar a revisión técnica cuando está autenticado y el estado es `BUDGETING` | IMPLEMENTADO PARCIALMENTE |
| Revisor Técnico | Sí | Sí en SPA para lectura y decisiones técnicas; no en Express | Sí: vistas internas/workflow según `canViewForRole()` | Consultar presupuesto y ejecutar aprobación/rechazo técnico en la SPA si el permiso remoto está presente | IMPLEMENTADO PARCIALMENTE |
| Director Financiero | Sí | Sí en SPA para revisión financiera; no en Express | Sí: vistas internas/financieras según permisos | Consultar y ejecutar decisión financiera local si el flujo y permisos coinciden | IMPLEMENTADO PARCIALMENTE |
| Gerente General | Sí | Sí en SPA para revisión gerencial y firma; no en Express | Sí: dashboard/workflow/documentos según permisos | Ejecutar decisión gerencial local y acciones de firma disponibles en la SPA | IMPLEMENTADO PARCIALMENTE |
| Cliente | Sí | Sí en SPA para lectura/propuesta y acciones de cliente; no en Express | Sí: vista cliente y navegación restringida por `getDefaultViewForRole()` | Consultar propuesta y registrar acciones locales de aprobación/cambios si el flujo lo permite | IMPLEMENTADO PARCIALMENTE |
| Oficial Legal | Sí | Sí en SPA para revisión legal/contrato; no en Express | Sí: vista legal/documentos según permisos | Ejecutar acciones legales locales disponibles en la SPA | IMPLEMENTADO PARCIALMENTE |

La herramienta demo no crea, actualiza ni elimina usuarios o roles y no modifica `roles.permissions`.

## Componentes principales

| Archivo | Componente/función | Responsabilidad real | Estado |
|---|---|---|---|
| `index.html` | `mockDB` | Valores iniciales locales de usuarios, roles, clientes, proyectos y presupuesto; no es PostgreSQL | IMPLEMENTADO PARCIALMENTE |
| `index.html` | `appState` | Fuente normalizada de sesión, UI, filtros, datos, presupuesto, configuración y workflow | IMPLEMENTADO Y FUNCIONAL en memoria |
| `index.html` | `renderApp()` | Ejecuta renderizadores y actualiza la UI completa | IMPLEMENTADO Y FUNCIONAL |
| `index.html` | `renderApuCatalog()` / `renderBudgetItems()` / `renderBudgetSummary()` | Renderizan catálogo, partidas y resumen financiero | IMPLEMENTADO Y FUNCIONAL localmente |
| `index.html` | `renderWorkflowView()` | Renderiza etapa, estado, decisiones y comentarios locales | IMPLEMENTADO PARCIALMENTE |
| `server/server.js` | Express API | Sirve `index.html`, login, sesión, salud, lecturas y mutaciones de presupuesto | IMPLEMENTADO PARCIALMENTE por autorización de negocio incompleta |
| `tools/demo_data.py` | CLI demo | Carga, consulta y limpia filas controladas | IMPLEMENTADO Y FUNCIONAL |

La herramienta Python no tiene props, callbacks ni DOM: es un comando de datos. La SPA sigue siendo la única responsable de renderizar la interfaz.

## Funciones y utilidades principales

### `tools/demo_data.py`

- `load_root_env()`: entrada `.env` de la raíz; salida diccionario de conexión; no modifica estado; nunca imprime valores.
- `resolve_psql()`: entrada PATH/Windows; salida ruta al ejecutable; lanza error seguro si falta.
- `run_psql(sql, tuples_only=False)`: recibe SQL; crea un proceso `psql`; usa `PGPASSWORD` solo en el entorno hijo; devuelve stdout o error genérico; no imprime stderr.
- `schema_columns()` y `validate_schema()`: consultan `information_schema.columns`; comprueban las cinco tablas y columnas reales antes de escribir.
- `validate_connection()`: comprueba `current_database()` y `current_user` contra `al_bd`/`al_app`.
- `demo_apus()`: devuelve 12 registros con la forma exacta de la tabla `apus` y componentes JSON numéricos.
- `demo_items()`: devuelve 10 filas con IDs, presupuesto, APU, cantidad, precio y subtotal.
- `calculate_totals()`: calcula costo directo, 8% de gastos generales, 3% de imprevistos, 10% de utilidad, subtotal, 15% de IVA y total general.
- `build_start_sql()`: genera upserts en el orden cliente → proyecto → APUs → presupuesto → partidas dentro de una transacción.
- `build_cleanup_sql()`: genera DELETE únicamente para IDs controlados en orden partidas → presupuesto → APUs → proyecto → cliente.
- `start()`: valida, carga y muestra estado.
- `status()`: valida, consulta presencia, conteos y totales; no muta.
- `cleanup()`: valida, ejecuta limpieza controlada y muestra estado.
- `run_lifecycle()`: ejecuta `start`, espera Ctrl+C y luego llama `cleanup`; no se utilizó en esta verificación.

### SPA y backend

- `index.html`: `hydrateStateFromApi()` carga la respuesta remota; `normalizeApiApu()` conserva componentes; `normalizeApiBudgetItem()` normaliza cantidad, precio y subtotal; `persistBudgetItemAdd/Update/Delete()` envían cambios al backend.
- `index.html`: `addApuToBudget()` incrementa el item existente por `apuId` o crea uno; `updateBudgetItemQuantity()` acepta decimales no negativos; `removeBudgetItem()` elimina el item local; `calculateBudgetTotals()` recalcula y sincroniza el presupuesto local.
- `server/repositories/apu-repository.js`: `listApus()` y `getApu()` hacen `SELECT *` sobre `apus`.
- `server/repositories/budget-repository.js`: `getBudgetWithItems()` hace lecturas separadas de `budgets` y `budget_items`; `addBudgetItem()` evita duplicar por `(budget_id, apu_id)` y suma cantidad si ya existe; update/delete cambian partidas y snapshots.
- `server/serializers.js`: serializa snake_case a camelCase, por lo que `apu_id` se entrega como `apuId` y `unit_price` como `unitPrice`.

## Relación Estado → Función → Renderer → DOM

| Estado | Función que lo modifica o hidrata | Renderer | DOM/resultado |
|---|---|---|---|
| `appState.data.apus` | `hydrateStateFromApi()`, `normalizeApiApu()` | `renderApuCatalog()` | `#apuCatalogBody`, filtros `#apuSearch`, `#categoryFilter`, `#unitFilter` |
| `appState.budget.items` | `addApuToBudget()`, `updateBudgetItemQuantity()`, `removeBudgetItem()`, `hydrateStateFromApi()` | `renderBudgetItems()` | tabla de partidas y controles de cantidad/eliminación |
| `appState.budget.totals` | `calculateBudgetTotals()` / `calculateTotalsFromItems()` | `renderBudgetSummary()`, `renderDashboardView()` | resumen, métricas y total general |
| `appState.settings` | `updateEconomicSetting()`, `hydrateStateFromApi()` | `renderSettings()`, `renderBudgetSummary()` | inputs de parámetros y desglose financiero |
| `appState.session` | `applyAuthenticatedUser()`, `restoreSession()` | `renderHeader()`, `renderSidebar()` | usuario, rol, navegación y vistas visibles |
| `appState.workflow` | `changeWorkflowStage()`, `submitForTechnicalReview()`, decisiones | `renderWorkflowView()` | badge, timeline, botones y decisiones |
| `appState.data.approvals`/`auditLog` | `createApprovalRecord()`/`logAuditEvent()` | `renderWorkflowView()`/`renderAuditView()` | lista local de aprobaciones y auditoría |
| PostgreSQL demo | `tools/demo_data.py` mediante `psql` | No tiene renderer propio | La SPA lo consume por `/api/*` en una nueva carga/hidratación |

La herramienta no modifica el DOM. El enlace con la UI ocurre después, cuando `hydrateStateFromApi()` reemplaza `appState.data.apus`, clientes, proyectos y el presupuesto remoto y luego llama a `renderApp()`.

## Flujos funcionales end-to-end

### Carga de datos demo

1. El usuario ejecuta `python tools/demo_data.py start`.
2. `main()` selecciona `start()`.
3. `start()` valida identidad y esquema.
4. `build_start_sql()` genera la transacción con los cinco conjuntos de datos.
5. `run_psql()` ejecuta SQL contra PostgreSQL sin exponer `DB_PASSWORD`.
6. PostgreSQL confirma la transacción.
7. `status()` observa cliente, proyecto, presupuesto, 12 APUs, 10 partidas y totales.
8. El proceso termina; no se inicia Node ni se cambia `index.html`.

Resultado observado: flujo completado y repetido dos veces sin duplicar los IDs controlados.

### Login y lectura de `BUD-001`

1. El cliente envía credenciales a `/api/login`.
2. `server/server.js` delega en `authenticate()` de `server/auth.js` y crea sesión.
3. La SPA usa `/api/me` y `applyAuthenticatedUser()` para guardar identidad y permisos seguros.
4. `hydrateStateFromApi()` solicita `/api/apus` y `/api/budgets/BUD-001` junto con los recursos core.
5. `getBudgetWithItems()` lee `budgets` y `budget_items`; `serializeRow()` entrega claves camelCase.
6. `normalizeApiBudgetItem()` convierte cantidades, precios y subtotales a números.
7. `renderApp()` renderiza las vistas y el resumen local.

Resultado observado: login demo `200`; `GET /api/budgets/BUD-001` `200`; 10 items; `grandTotal` `73679.14`.

### Agregar o actualizar una partida desde la SPA

1. El usuario pulsa un botón `[data-action="add-apu"]`.
2. La delegación de eventos llama `addApuToBudget(apuId)`.
3. Si ya existe el `apuId`, incrementa `quantity` sin crear otro item; si no existe, crea un item.
4. `calculateBudgetTotals()` recalcula subtotales y totales.
5. `renderBudgetItems()` y `renderBudgetSummary()` actualizan la tabla y los importes.
6. `persistBudgetItemAdd()` llama al endpoint de presupuesto cuando `apiConnectionState === "postgres"`.
7. El repositorio vuelve a aplicar la unicidad de `(budget_id, apu_id)`.

La lógica está conectada y fue verificada por inspección de código; no se ejecutó una interacción de navegador en esta iteración.

### Limpieza controlada

1. El usuario ejecuta `python tools/demo_data.py cleanup`.
2. `cleanup()` valida conexión y esquema.
3. `build_cleanup_sql()` elimina solo `BI-DEMO-*`, `BUD-001`, `APU-DEMO-*`, `PRJ-DEMO-001` y `CLI-DEMO-001`.
4. La transacción termina con `COMMIT` o falla completa sin continuar.
5. No hay `TRUNCATE`, `DROP`, DELETE de usuarios/roles ni eliminación por tabla completa.

Este flujo se verificó por inspección del SQL; no se ejecutó para preservar la carga demo solicitada para revisión.

## Estado y gestión de datos

- `mockDB` es una estructura local inicial y `appState.data` es la estructura normalizada de la SPA.
- `syncCurrentBudgetToMockDB()` mantiene el espejo local después de cálculos, pero no es una sincronización general con PostgreSQL.
- `hydrateStateFromApi()` reemplaza clientes, proyectos, APUs y el presupuesto con la respuesta remota cuando todo el lote de API tiene éxito; en error usa el fallback mock según `API_CONFIG.fallbackToMock`.
- `tools/demo_data.py` no modifica `mockDB` ni `appState`; solo deja filas que la próxima hidratación puede consumir.
- Los totales se calculan dos veces con propósitos distintos: el script guarda un snapshot JSON redondeado a dos decimales y la SPA vuelve a calcular con `calculateTotalsFromItems()` en memoria. `formatCurrency()` es el renderer final y evita mostrar `NaN` convirtiendo entradas no finitas a cero.

## Workflow y aprobaciones

`workflowTransitions`, `WORKFLOW_STAGE`, `WORKFLOW_STATUS`, `getWorkflowTransitionPermission()`, `canTransitionTo()`, `changeWorkflowStage()`, `submitForTechnicalReview()`, `completeWorkflowDecision()` y `createApprovalRecord()` existen en `index.html`.

Hoy esas funciones modifican `appState.workflow`, `budget.status`, `appState.data.approvals` y `mockDB.approvals`, y `renderWorkflowView()` los muestra. No existe una tabla ni endpoint de workflow utilizado por `tools/demo_data.py`; tampoco hay persistencia PostgreSQL de las decisiones locales. El estado correcto es `IMPLEMENTADO PARCIALMENTE`, no funcionalidad completa de aprobación distribuida.

## Auditoría

`logAuditEvent()` crea un objeto con `id`, `timestamp`, `userId`, `role`, `action`, `entity`, `entityId`, `description` y metadata opcional; lo añade a `appState.data.auditLog` y a `mockDB.auditLog`. `renderAuditView()` muestra esa colección.

El esquema real contiene `audit_log`, pero esta iteración no lo consulta ni lo modifica. No se presentó una afirmación de audit trail PostgreSQL completo.

## Dependencias internas

- Python estándar: `argparse`, `json`, `os`, `pathlib`, `shutil`, `subprocess`, `sys`, `time`, `decimal`.
- Ejecutable externo: `psql` de PostgreSQL; no se añadió dependencia Python ni npm.
- Runtime existente: Node, Express, `pg`, `dotenv`, `express-session`, `bcrypt`.
- La herramienta no importa módulos del servidor y no cambia `package.json`.

## Verificación contra código

### Archivos y componentes revisados

- Se revisaron `AGENTS.md`, `md/AGENTS.md` y `tests/AGENTS.md`.
- Se revisaron `md/fase-5-9.md`, `index.html`, `server/server.js`, `server/db.js`, `server/auth.js`, `server/serializers.js`, `server/repositories/core-repository.js`, `server/repositories/apu-repository.js`, `server/repositories/budget-repository.js` y las migraciones SQL existentes.
- Se localizaron `mockDB`, `appState`, `rolePermissions`, `hasPermission()`, `hydrateStateFromApi()`, `addApuToBudget()`, `updateBudgetItemQuantity()`, `removeBudgetItem()`, `calculateBudgetTotals()`, `renderApp()`, `logAuditEvent()`, las funciones de workflow y las rutas HTTP.
- Se consultó el esquema PostgreSQL real, sus columnas, FK, PK/unique y conteos iniciales.

### Inconsistencias encontradas

1. `md/fase-5-9.md` indicaba que `BUD-001` podía responder 404 por estar la base sin datos. La consulta real confirmó que las cinco tablas estaban vacías antes de esta iteración. La herramienta corrige esa condición operativa cargando el presupuesto demo controlado; no se modificó el runtime.
2. La tabla real `apus` no contiene `description`, `currency` ni `metadata`; la herramienta no inventa esas columnas. La SPA puede mostrar descripción vacía cuando el catálogo proviene exclusivamente de PostgreSQL.
3. La tabla real `budget_items` no contiene `code`, `name` ni `unit`. `getBudgetWithItems()` hace `SELECT *` sin join a `apus`; `normalizeApiBudgetItem()` deja esos campos en cadenas vacías si no vienen de API. Esto puede producir filas visuales sin nombre/unidad tras hidratar desde PostgreSQL. No se corrigió porque la instrucción de esta iteración prohíbe modificar Node/Express e `index.html`.
4. La API del servidor protege las rutas con sesión (`requireAuth`) pero no aplica cada permiso de `roles.permissions` en backend. No se corrigió porque la herramienta solicitada solo gestiona datos demo y no inicia Fase 2.

### Corrección interna de esta iteración

Durante la construcción se detectó que `components` y los cálculos usan `Decimal`, que no es serializable directamente por `json.dumps`. `sql_json()` usa ahora `json_numbers()` para convertir los valores a números JSON antes de generar el literal JSONB. `py_compile` y `start` real confirmaron la corrección.

## Verificación funcional

### VERIFICADO POR EJECUCIÓN

- `python -m py_compile tools/demo_data.py`: pasó sin salida ni error.
- `python tools/demo_data.py status` antes de la carga: `al_bd`; cliente, proyecto y presupuesto ausentes; 0/12 APUs; 0/10 partidas; totales cero.
- `python tools/demo_data.py start`: pasó la conexión, esquema, transacción y estado final `12/12` APUs y `10/10` partidas.
- Segundo `python tools/demo_data.py start`: pasó con los mismos conteos; no duplicó IDs.
- `npm test`: 10 tests pasaron, 0 fallaron.
- Servidor temporal Node: `/api/health` respondió `ok`.
- Login demo autenticado: respondió `200`.
- `GET /api/budgets/BUD-001` autenticado: respondió `200`, `10` items, `grandTotal = 73679.14`.
- `python tools/demo_data.py status` final: confirmó que los datos permanecen presentes. No se ejecutó `cleanup`.

### VERIFICADO POR INSPECCIÓN

- El password se obtiene de `.env` y solo se asigna a `PGPASSWORD` en el entorno de `psql`; no existe contraseña hardcodeada en `tools/demo_data.py`.
- El SQL de limpieza está limitado a IDs controlados y no contiene `TRUNCATE`, `DROP`, `users` ni `roles`.
- Los upserts usan las PK reales y respetan las FK reales.
- La herramienta no importa Express, Node, `index.html`, usuarios, roles, workflow, documentos, escenarios o Chart.js.
- `index.html` conserva el enlace entre `appState`, funciones de mutación, cálculos y renderizadores.

### NO VERIFICADO

- No se ejecutó `python tools/demo_data.py cleanup`, porque el requisito de esta iteración es conservar la carga para revisión.
- No se ejecutó `tools/demo_data.py run`, porque su ciclo espera Ctrl+C y luego limpia los datos.
- No se automatizó un click de navegador para validar visualmente cada fila; la suite y el endpoint sí se verificaron.
- No se verificó una carga con datos no demo preexistentes en las restricciones únicas, porque la base real estaba vacía al inicio.

### NO APLICA

- Migraciones de esquema, seed de usuarios, passwords, roles y permisos no pertenecen a esta herramienta.
- Escenarios persistidos, documentos reales, portal cliente, legal, firma, Chart.js y backend RBAC pertenecen a otras iteraciones/fases.

## Limitaciones actuales

1. `tools/demo_data.py` depende de que `psql` exista en PATH o en la ruta PostgreSQL 18 configurada; no instala el cliente.
2. El script requiere `.env` en la raíz y no acepta una contraseña como argumento.
3. Los datos son ficticios y no representan una fuente oficial de precios ni una aprobación real.
4. La tabla real `apus` no guarda descripción, moneda ni metadata; no se pueden cargar esos campos sin una migración fuera de alcance.
5. `budget_items` no guarda código, nombre ni unidad y el repositorio de lectura no hace join; la interfaz puede necesitar enriquecimiento posterior.
6. `status` reporta el snapshot de totales almacenado y la suma de subtotales; no modifica ni recalcula el snapshot de un presupuesto externo.
7. `cleanup` no intenta borrar escenarios, documentos, auditoría ni referencias que pudieran depender de `BUD-001`; si existieran, PostgreSQL debe impedir una eliminación insegura.
8. El backend actual exige autenticación, pero la autorización por permiso todavía es frontend-only en varias rutas.

## Cambios de esta iteración

1. Se creó `tools/demo_data.py`.
2. Se añadió carga de configuración desde el `.env` raíz sin imprimir `DB_PASSWORD`.
3. Se añadió detección de `psql` por PATH y fallback explícito de PostgreSQL 18 para Windows.
4. Se añadió validación de identidad `al_bd`/`al_app` y validación de columnas de `clients`, `projects`, `apus`, `budgets` y `budget_items`.
5. Se añadió una carga transaccional e idempotente de un cliente, un proyecto, 12 APUs, `BUD-001` y 10 partidas.
6. Se añadió `status` con presencia, conteos y totales sin secretos.
7. Se añadió `cleanup` limitado a IDs controlados, sin ejecutarlo al terminar.
8. Se corrigió la serialización interna de `Decimal` a números JSON para `components`, `totals` y `settings`.
9. No se modificaron `index.html`, `server/`, `tests/`, `package.json`, migraciones ni configuraciones del runtime.
10. Se creó este nuevo documento `md/fase-5-10.md`; `md/fase-5-9.md` no fue sobrescrito.

## Impacto técnico de esta iteración

- Archivo nuevo: `tools/demo_data.py`.
- Archivo nuevo: `md/fase-5-10.md`.
- Tablas escritas por `start`: `clients`, `projects`, `apus`, `budgets`, `budget_items`.
- Tablas no escritas: `users`, `roles`, `scenarios`, `scenario_adjustments`, `price_references`, `documents`, `audit_log`.
- Contratos HTTP: sin cambios.
- Contratos frontend: sin cambios.
- Dependencias npm/Python: sin cambios; se usa la biblioteca estándar de Python y `psql` instalado.
- Comportamiento conservado: el runtime sigue iniciándose con `npm start` y la suite contractual permanece en 10/10.
- Riesgo de regresión: bajo para el runtime porque no hubo cambios en sus archivos; el riesgo operativo de `cleanup` está acotado por IDs y FK.

## Compatibilidad

- Windows PowerShell: verificado con Python 3.15 y `C:\Program Files\PostgreSQL\18\bin\psql.exe`.
- PostgreSQL: conexión real a `al_bd` con `al_app` verificada.
- Node/Express: `npm test` pasó con la carga demo presente.
- Reejecución: `start` repetido conserva conteos y totales.
- Seguridad: no se imprimen valores de `DB_PASSWORD`; el comando no lleva la contraseña como argumento.

## Preparación para siguientes fases

Los datos controlados ofrecen un presupuesto consultable para revisión manual del Tech Lead. No se considera que esto implemente la siguiente fase.

Para la siguiente fase, el backend deberá reutilizar la identidad de `server/auth.js`, las permissions JSONB provenientes de `roles`, el presupuesto de `budget-repository.js` y las restricciones de `index.html`, pero deberá añadir autorización server-side por operación, persistencia de decisiones y pruebas de permisos. Esas acciones no fueron ejecutadas aquí.

## Próxima fase

Fase 2 deberá implementar de forma explícita:

- autorización backend basada en `request.user.role.permissions`, no solo `requireAuth`;
- endpoints y persistencia para revisiones técnicas, financieras y gerenciales;
- reglas de transición alineadas con `workflowTransitions` y validación de comentarios/rechazos;
- persistencia de approvals y comentarios con actor, rol, etapa y fecha;
- pruebas HTTP por rol, permiso, estado y transición;
- conexión de esas respuestas con `appState.workflow`, `appState.data.approvals` y `renderWorkflowView()`.

No se inició ninguna de esas implementaciones.

## Arquitectura Producción / Homelab

La arquitectura actual separa tres responsabilidades:

1. El navegador solo conoce HTTP JSON y cookie de sesión; nunca recibe `DB_PASSWORD`.
2. Node/Express sirve la SPA en `127.0.0.1:8000`, valida sesión y usa `pg` para PostgreSQL.
3. `tools/demo_data.py` es una utilidad operativa manual que usa `psql` directamente para datos ficticios controlados; no queda residente y no reemplaza al backend.

La conexión PostgreSQL real se identificó como `al_bd`/`al_app`. El host se toma del `.env`; no se copia ni se documenta la contraseña.

## Contrato para la siguiente iteración

- Mantener `BUD-001`, `PRJ-DEMO-001`, `CLI-DEMO-001`, `APU-DEMO-*` y `BI-DEMO-*` como IDs controlados de demo.
- No utilizar estos datos como evidencia de aprobación real.
- No borrar la carga demo sin ejecutar explícitamente `python tools/demo_data.py cleanup`.
- No modificar usuarios, roles ni credenciales desde la herramienta.
- Si se añade persistencia de workflow, documentar tablas, FK, permisos server-side y pruebas antes de llamarla funcional.
- No iniciar otra fase automáticamente; este snapshot deja Fase 1 de datos demo cerrada para revisión y Fase 2 pendiente.
