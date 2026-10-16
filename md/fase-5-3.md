# Fase 5 — Iteración 3

## Identificación

- Proyecto: BuildCost / Expo Clean.
- Fase vigente: 5 — Dashboard ejecutivo, Audit Trail, KPIs, Timeline y cierre final.
- Iteración: 3.
- Tipo de iteración: arquitectura transversal de visualizaciones con Chart.js.
- Fecha de verificación: 2026-10-16.
- Runtime activo: `index.html`, servido por Vite o por `backend/app.py`.
- Snapshot anterior: `md/fase-5-2.md`.
- Fase 6: no está definida en el alcance revisado y no se inició.

Este snapshot sigue `md/AGENTS.md`. El código real prevalece sobre los prompts y snapshots anteriores. Se revisaron `AGENTS.md`, `src/AGENTS.md`, `tests/AGENTS.md`, `md/AGENTS.md`, `md/fase-5-2.md` e `index.html` antes y después de los cambios.

## Resumen ejecutivo técnico

La aplicación activa sigue siendo el runtime inline de `index.html`. La carpeta `src/` contiene una arquitectura React/Vite paralela, pero `index.html` no importa `src/main.jsx`; por tanto, los cambios de esta iteración se realizaron en `index.html` y en la prueba de contrato de `tests/test_backend_contract.py`.

Se incorporó una arquitectura única de gráficos:

- Un único `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>` en `index.html`.
- `chartRegistry` centraliza las instancias de Chart.js.
- `destroyChart()` y `destroyAllCharts()` eliminan instancias anteriores.
- `createChart()` verifica la existencia del canvas, evita duplicados, maneja `Chart` no disponible y muestra un fallback textual sin romper la SPA.
- Los cálculos existentes siguen viviendo en funciones de negocio (`getCostDistributionByCategory()`, `compareScenarioTotals()`, `getTopCostDrivers()`, `getCriticalApus()`, `getWorkflowStageDurations()`). Los renderizadores solo transforman esos resultados en configuraciones Chart.js.
- La UI crea gráficos únicamente cuando la vista activa lo permite y destruye los gráficos de las vistas abandonadas.
- No se agregaron eventos de auditoría para dibujar o destruir gráficos.
- No se agregaron copias de datos de gráficos a `appState`.

Estado de la integración de Chart.js: `IMPLEMENTADO PARCIALMENTE`. La CDN, el registro, los builders, los renderizadores, los guards, el fallback y el build están verificados por inspección y automatización. No se ejecutó un navegador con la CDN cargada en esta iteración; por eso no se declara verificación visual end-to-end como evidencia de ejecución.

No se implementaron nuevas revisiones técnicas, revisiones financieras, aprobaciones gerenciales, portal cliente nuevo, sistema legal, documentos reales ni escenarios completos. Se conservaron las funciones demo ya existentes y se añadió únicamente su representación gráfica.

## Estado general de implementación

| Área | Estado | Implementado hoy | No implementado o no verificado |
|---|---|---|---|
| Runtime SPA activo | IMPLEMENTADO Y FUNCIONAL | `index.html` contiene HTML, CSS, Tailwind CDN, estado, renderizadores y event delegation | La arquitectura React de `src/` no es el runtime activo |
| Catálogo y presupuesto heredados | IMPLEMENTADO Y FUNCIONAL | `appState`, `mockDB`, 20 APUs, partidas, cantidades, eliminación y totales permanecen conectados | Persistencia PostgreSQL real depende de la infraestructura anterior |
| Cliente API y backend local | IMPLEMENTADO PARCIALMENTE | `apiClient`, Flask, repositorios y fallback mock de la iteración anterior | Conexión real a PostgreSQL no se verificó con credenciales |
| Motor Chart.js | IMPLEMENTADO PARCIALMENTE | CDN única, `chartRegistry`, lifecycle, builders, renderizadores y fallback | Carga y dibujo visual en navegador no ejecutados en esta iteración |
| Curva S financiera | IMPLEMENTADO PARCIALMENTE | `generateCashFlowProjection()`, `getFinancialSCurveData()` y `renderFinancialSCurve()` terminan el acumulado en `grandTotal` | No es cronograma contractual ni recibe avance de obra real |
| Distribución por capítulo | IMPLEMENTADO PARCIALMENTE | `renderCostDistributionChart()` reutiliza `getCostDistributionByCategory()` para escenarios, dashboard y portal | El portal cliente usa el escenario activo local, no un snapshot comercial remoto verificado |
| Comparativa de escenarios | IMPLEMENTADO PARCIALMENTE | `compareScenarioTotals()` alimenta `getScenarioComparisonChartData()` y un bar chart agrupado | Los escenarios siguen siendo demo local y no un módulo nuevo de Fase 3 |
| Drivers y riesgo | IMPLEMENTADO PARCIALMENTE | `getCostDriversRiskChartData()` combina monto, porcentaje y nivel de riesgo en tooltip/color | No existe nueva lógica de riesgo ni escala secundaria contractual |
| Ciclo workflow | IMPLEMENTADO PARCIALMENTE | `getWorkflowCycleChartData()` consume duraciones de `AuditLog` y excluye etapas sin datos | Si no hay timestamps suficientes solo muestra “Sin datos suficientes” |
| AuditLog | IMPLEMENTADO PARCIALMENTE | `appState.data.auditLog` sigue siendo append-only local y alimenta la duración del workflow | Los gráficos no auditan eventos y el AuditLog remoto no está conectado |
| RBAC local para gráficos | IMPLEMENTADO PARCIALMENTE | `hasPermission()` y `rolePermissions` controlan vistas y tarjetas | No hay autenticación ni autorización por rol en Flask |
| Datos de proyección persistidos | PLACEHOLDER ESTRUCTURAL | `mockDB.budgets[0].cashFlowProjection` existe como array vacío y puede contener una proyección válida | No existe planificación temporal real, persistencia de avance ni calendario contractual |
| Fases de negocio posteriores | NO IMPLEMENTADO como cambio de esta iteración | Se conservan los módulos demo anteriores | No se inició una fase nueva |

## Cómo funciona actualmente

1. El navegador carga `index.html`, Tailwind CSS y el CDN único de Chart.js.
2. `initializeApp()` hidrata el estado desde `mockDB`, carga los 20 APUs hardcodeados, asegura escenarios base, recalcula totales, captura `demoInitialSnapshot`, renderiza la SPA, conecta `bindStaticEvents()` y después intenta `hydrateStateFromApi()`.
3. `renderApp()` renderiza la vista activa y también refresca los contenedores compartidos de presupuesto, workflow, escenarios, portal, documentos, legal, dashboard y auditoría.
4. `renderCurrentView()` destruye las instancias de gráficos que pertenecen a otras vistas antes de ejecutar el renderer de la vista activa.
5. `renderDashboardView()` construye el dashboard y termina llamando `renderDashboardCharts()`. Esta función solo crea tarjetas autorizadas para el rol activo y solo cuando `appState.ui.activeView === "dashboard"`.
6. `renderScenariosView()` llama `destroyScenarioCharts()`, genera la vista textual de escenarios y, si la vista está activa y el rol puede verla, llama `renderScenarioCharts(active.id)`.
7. `navigateTo()` cambia `appState.ui.activeView`, ejecuta `renderCurrentView()` y, específicamente para `client-portal`, llama también `renderClientCostDistributionChart()` porque el portal crea su contenido dinámicamente.
8. `createChart()` busca el canvas por ID, destruye la instancia anterior del mismo `chartId`, comprueba `typeof Chart`, construye la instancia y la guarda en `chartRegistry`. Si la CDN falla o Chart.js lanza una excepción, conserva el resumen textual y escribe “Visualización no disponible”.
9. Las mutaciones de presupuesto y workflow siguen modificando el estado mediante las funciones existentes. Al volver a renderizar, los builders leen los datos actuales y los gráficos se reconstruyen sin duplicar estado.

El flujo de datos es:

`appState` → funciones de cálculo y analytics → builders de datos de gráfico → `createChart()` → canvas DOM.

No existe el flujo contrario: Chart.js no modifica `appState`, no ejecuta fórmulas financieras y no crea eventos de negocio.

## Relación Estado → Función → Renderer → DOM

| Estado/entrada | Función de negocio o builder | Renderer | DOM resultante |
|---|---|---|---|
| `getCurrentBudget().totals.grandTotal`, `budget.cashFlowProjection` | `generateCashFlowProjection()` → `getFinancialSCurveData()` | `renderFinancialSCurve()` | Canvas `financial-s-curve-chart` dentro de `#dashboard-chart-container` |
| Items del escenario y categorías APU | `getCostDistributionByCategory(scenarioId)` | `renderCostDistributionChart()` | Canvas `cost-distribution-chart` o `cost-distribution-dashboard-chart` |
| Colección de escenarios | `compareScenarioTotals()` → `getScenarioComparisonChartData()` | `renderScenarioComparisonChart()` | Canvas `scenario-comparison-chart` |
| Items del escenario, drivers y riesgos | `getTopCostDrivers()` + `getCriticalApus()` → `getCostDriversRiskChartData()` | `renderCostDriversRiskChart()` | Canvas `cost-drivers-risk-chart` o `cost-drivers-dashboard-chart` |
| `appState.data.auditLog` y timestamps de workflow | `getWorkflowStageDurations()` → `getWorkflowCycleChartData()` | `renderWorkflowCycleChart()` | Canvas `workflow-cycle-chart` |
| Categorías comerciales del estado visible al Cliente | `getCostDistributionByCategory()` | `renderClientCostDistributionChart()` | Canvas `client-cost-distribution-chart` dentro de `#client-cost-distribution-container` |

El renderer no cambia el Estado. `createChart()` solo vincula el resultado al canvas y al `chartRegistry`.

## Arquitectura global

| Capa | Código real | Responsabilidad actual |
|---|---|---|
| UI/runtime | `index.html` | HTML, CSS, Tailwind CDN, Chart.js CDN, estado, renderers y handlers |
| Estado | `mockDB`, `appState` en `index.html` | Datos demo, sesión, filtros, presupuesto, workflow, escenarios, documentos y AuditLog |
| Cálculo financiero | `calculateTotalsFromItems()`, `calculateBudgetTotals()` | Fuente de `directCost`, recargos, utilidad, IVA y `grandTotal` |
| Analytics de negocio | `getCostDistributionByCategory()`, `compareScenarioTotals()`, `getTopCostDrivers()`, `getCriticalApus()`, `getWorkflowStageDurations()` | Resultados deterministas que consumen los gráficos |
| Chart engine | Bloque `VISUALIZATION / CHART ENGINE` en `index.html` | Registry, lifecycle, colores, builders, renderers, fallback y tarjetas |
| Router | `viewRegistry`, `navigateTo()`, `renderCurrentView()` | Navegación SPA y limpieza de gráficos por vista |
| API local | `apiClient` en `index.html`, `backend/app.py` | Hidratación y mutaciones remotas heredadas |
| Persistencia | `backend/db.py` y repositorios | Conexión PostgreSQL opcional por backend; no usada directamente por Chart.js |
| Documentación | `md/fase-5-3.md` | Snapshot verificable de esta iteración |

## Estructura física del proyecto

Archivos relevantes revisados:

- `index.html`: runtime activo, `mockDB`, `appState`, `rolePermissions`, cálculos, workflow, analytics, Chart engine, renderers y event delegation.
- `tests/test_backend_contract.py`: contratos HTTP y contrato estático de Chart.js.
- `md/AGENTS.md`: reglas de documentación versionada.
- `md/fase-5-2.md`: snapshot anterior; no fue sobrescrito.
- `backend/app.py`, `backend/db.py`, `backend/repositories/` y `backend/serializers.py`: infraestructura API heredada.
- `vite.config.js`: proxy local `/api` hacia Flask.
- `src/main.jsx`, `src/App.jsx`, `src/components/`, `src/data/` y `src/utils/`: arquitectura React paralela no importada por el runtime activo.
- `AGENTS.md`, `src/AGENTS.md` y `tests/AGENTS.md`: instrucciones aplicables revisadas.

No se añadió una dependencia npm de Chart.js. La implementación usa el CDN único requerido. `dist/` se regenera con Vite y no es la fuente manual del runtime.

## Datos y modelos actuales

### `mockDB`

`mockDB` conserva `users`, `roles`, `clients`, `projects`, `apus`, `budgets`, `documents`, `comments`, `approvals`, `signatures`, `auditLog` y `priceReferences`. El catálogo local se carga en `initializeApp()` con `APU-001` a `APU-020`.

El presupuesto demo contiene `cashFlowProjection: []`. Esa propiedad es una estructura de datos, no una planificación financiera real. Cuando está vacía, `generateCashFlowProjection()` produce ocho periodos deterministas a partir de `budget.totals.grandTotal`; el último acumulado se fuerza exactamente al total.

### `appState`

`appState` conserva `session`, `ui`, `filters`, `data`, `currentProjectId`, `currentBudgetId`, `settings` y `workflow`. Los aliases de compatibilidad heredados siguen disponibles: `currentUser`, `activeView`, `apuCatalog`, `budget`, `auditLog`, `documents`, `comments`, `signatures` y `roles`.

Los gráficos no agregan propiedades de estado propias. `chartRegistry` contiene únicamente instancias efímeras de Chart.js y se limpia por lifecycle.

### Fuentes de datos de los gráficos

| Gráfico | Fuente real | Transformación |
|---|---|---|
| Curva S | `getCurrentBudget().totals.grandTotal` y opcionalmente `cashFlowProjection` | `generateCashFlowProjection()` o validación de una proyección persistida cuyo último acumulado coincide con el total |
| Distribución | `getCostDistributionByCategory(scenarioId)` | Categorías, monto y porcentaje; no recalcula reglas financieras |
| Escenarios | `compareScenarioTotals()` | Labels por escenario y datasets de costo directo, total y ahorro |
| Drivers/riesgo | `getTopCostDrivers()` + `getCriticalApus()` | Monto como barra; riesgo como color y tooltip |
| Workflow | `getWorkflowStageDurations()` | Solo etapas con `hasData === true`; las restantes se informan como insuficientes |

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| CDN único Chart.js | IMPLEMENTADO Y FUNCIONAL | `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>` en `index.html` | No visible por sí solo | El runtime puede resolver `Chart` | Conteo estático: una ocurrencia; build Vite exitoso | Fase 5 |
| Registro de instancias | IMPLEMENTADO Y FUNCIONAL | `chartRegistry`, `destroyChart()`, `destroyAllCharts()` | No visible por sí solo | Evita instancias duplicadas por `chartId` | Inspección y `node --check` | Fase 5 |
| Fallback sin Chart.js | IMPLEMENTADO PARCIALMENTE | `createChart()` y `setChartFallback()` | Texto `data-chart-message` | Mantiene resumen y no propaga excepción | Código conectado; navegador sin CDN no ejecutado | Fase 5 |
| Curva S financiera | IMPLEMENTADO PARCIALMENTE | `generateCashFlowProjection()`, `getFinancialSCurveData()`, `renderFinancialSCurve()` | `financial-s-curve-chart` en `dashboard-chart-container` | Director Financiero y Gerente General, si `dashboard:financial` | Build y contrato; no verificación visual | Fase 5 |
| Distribución interna | IMPLEMENTADO PARCIALMENTE | `renderCostDistributionChart()` + `getCostDistributionByCategory()` | `cost-distribution-dashboard-chart` y `cost-distribution-chart` | Dashboard interno y escenarios autorizados | Build y contrato; no verificación visual | Fase 5 / heredado Fase 3 |
| Distribución comercial Cliente | IMPLEMENTADO PARCIALMENTE | `renderClientCostDistributionChart()` | `client-cost-distribution-chart` creado dinámicamente | Solo rol Cliente con `proposal:view` | Conexión estática y lifecycle revisados | Fase 5 / heredado Fase 4 |
| Comparación escenarios | IMPLEMENTADO PARCIALMENTE | `getScenarioComparisonChartData()`, `renderScenarioComparisonChart()` | `scenario-comparison-chart` | Vista escenarios activa y permisos de escenario | Build y contrato; datos demo | Fase 5 / heredado Fase 3 |
| Cost drivers y riesgo | IMPLEMENTADO PARCIALMENTE | `getCostDriversRiskChartData()`, `renderCostDriversRiskChart()` | `cost-drivers-risk-chart` y `cost-drivers-dashboard-chart` | Monto en barra; nivel en color/tooltip | Build y contrato; no escala secundaria | Fase 5 / heredado Fase 3 |
| Ciclo workflow | IMPLEMENTADO PARCIALMENTE | `getWorkflowCycleChartData()`, `renderWorkflowCycleChart()` | `workflow-cycle-chart` | Roles no Cliente con `audit:view`; muestra insuficiencia | Inspección y build; datos temporales no ejercitados en navegador | Fase 5 |
| Lifecycle de vistas | IMPLEMENTADO PARCIALMENTE | `renderCurrentView()`, `navigateTo()`, `renderDashboardCharts()`, `renderScenarioCharts()` | Canvas se generan y destruyen por vista | Cambio de vista elimina instancias ajenas | Código y sintaxis; no prueba visual de navegación | Fase 5 |
| Reglas financieras | IMPLEMENTADO Y FUNCIONAL local | `calculateTotalsFromItems()` y `calculateBudgetTotals()` | Tarjetas y tablas existentes | Gráficos consumen resultados, no los recalculan | Heredado, build y tests de contrato | Fase 1 |
| API PostgreSQL | IMPLEMENTADO PARCIALMENTE | `backend/app.py`, `db.py`, repositorios y `apiClient` | No hay gráfico remoto específico | Hidratación remota opcional | Tests health; DB real no verificada | Infraestructura |
| Revisiones y aprobaciones nuevas | NO IMPLEMENTADO como cambio | No se añadió lógica de negocio | No se añadió UI de Fase 2 | No aplica | Diff revisado | Fase 2 |
| Sistema legal/documentos reales | NO IMPLEMENTADO | Solo estructuras y demo heredada | No se añadió UI nueva | No aplica | Diff revisado | Fase 4 |

## Roles y estado RBAC

Los seis roles están declarados en `mockDB.roles` y sus permisos están en `rolePermissions` dentro de `index.html`. `getCurrentRole()`, `hasPermission()`, `canViewForRole()` y los guards de los engines y handlers aplican la autorización local. No existe autenticación de usuario ni middleware RBAC en Flask; una petición HTTP no recibe ni valida el rol de la sesión demo.

### Matriz de roles

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí | `apu:read`, `budget:*`, `settings:write`, escenarios, precios, variancias, riesgo, `dashboard:*`, `audit:view` | Catálogo, presupuesto, settings, workflow de envío, escenarios, dashboard y audit | Puede editar partidas/cantidades/settings, agregar o eliminar APUs y ver gráficos internos según guards | IMPLEMENTADO PARCIALMENTE: local funcional; backend sin autorización |
| Revisor Técnico | Sí | Lectura de presupuesto, revisión/aprobación/rechazo técnico, comentarios, escenarios de lectura, dashboard interno/riesgo y audit | Workflow técnico, vistas internas permitidas, dashboard y audit | Puede decidir la revisión técnica local si etapa y permiso coinciden; no modifica el presupuesto | IMPLEMENTADO PARCIALMENTE: local funcional; backend sin autorización |
| Director Financiero | Sí | Revisión financiera, propuesta, escenarios/precios, variancia/riesgo, `dashboard:financial`, `dashboard:internal`, `dashboard:risk`, `audit:view` | Curva S, desglose financiero, dashboard, workflow financiero y escenarios | Puede decidir revisión financiera local y ver la Curva S; no hay identidad remota | IMPLEMENTADO PARCIALMENTE: local funcional; backend sin autorización |
| Gerente General | Sí | Revisión gerencial, propuesta, contrato/firma, dashboard interno/financiero/riesgo y audit | Dashboard, workflow gerencial, documentos y legal demo | Puede decidir gerencia y operar firma demo cuando el workflow lo permite | IMPLEMENTADO PARCIALMENTE: local funcional; backend sin autorización |
| Cliente | Sí | `proposal:view`, aprobación/cambios de propuesta, comentarios cliente, contrato/firma y `dashboard:view` | Portal cliente y propuesta comercial; no tarjetas internas ni gráficos de riesgo | Puede consultar la propuesta, aprobar, solicitar cambios y comentar en los estados permitidos | IMPLEMENTADO PARCIALMENTE: portal demo local; sin backend de identidad |
| Oficial Legal | Sí | Lectura documental, revisión/aprobación/cambios legales, contrato y audit | Legal, documentos y contrato demo | Puede iniciar/aprobar/rechazar revisión legal y preparar contrato demo con guards locales | IMPLEMENTADO PARCIALMENTE: local funcional; backend sin autorización |

### Reglas de visibilidad de gráficos

- Curva S: `renderDashboardCharts()` exige rol `Director Financiero` o `Gerente General` y `dashboard:financial`. El Presupuestista tiene el permiso en `rolePermissions`, pero la regla explícita de la tarjeta no le muestra esta curva.
- Distribución interna: se muestra a Presupuestista, Director Financiero y Gerente General con `dashboard:internal`.
- Cost drivers/riesgo: exige `dashboard:risk` y `dashboard:internal`; no se muestra al Cliente.
- Ciclo de workflow: exige un rol distinto de Cliente y `audit:view`.
- Gráficos de escenarios: se generan dentro de la vista de escenarios, que requiere `scenario:read` mediante `canViewScenarios()`.
- Distribución comercial cliente: `renderClientCostDistributionChart()` exige vista `client-portal`, rol `Cliente` y `proposal:view`.

## Componentes principales

### `index.html`

Es el runtime activo, no un componente React. Contiene los containers de vista, estilos, dataset, funciones de estado, cálculos, Chart engine, renderers y event delegation sobre `document`.

### Chart engine inline

- Responsabilidad: convertir resultados de analytics en instancias Chart.js y administrar su lifecycle.
- Entrada: IDs de chart/canvas, objetos de configuración y datos derivados.
- Estado interno: `chartRegistry` y `CHART_COLORS`.
- Efectos: crea o destruye objetos Chart.js y actualiza mensajes de fallback; no muta presupuesto ni AuditLog.
- Callbacks: renderers invocados por dashboard, escenarios, portal cliente y router.

### `apiClient` y backend heredados

`apiClient.request()` es el único `fetch()` del frontend. `backend/app.py` registra handlers; `backend/db.py` y los repositorios hablan con PostgreSQL si existen credenciales. Los gráficos consumen el estado resultante y no abren conexiones propias.

## Funciones y utilidades principales

| Función | Archivo | Qué hace hoy | Estado |
|---|---|---|---|
| `destroyChart(chartId)` | `index.html` | Llama `.destroy()` a la instancia registrada y elimina su entrada | IMPLEMENTADO Y FUNCIONAL |
| `destroyAllCharts()` | `index.html` | Itera el registry y destruye todas las instancias | IMPLEMENTADO Y FUNCIONAL |
| `createChart(chartId, canvasId, config)` | `index.html` | Busca canvas, destruye instancia previa, comprueba Chart.js, crea la instancia o muestra fallback | IMPLEMENTADO PARCIALMENTE por falta de ejecución visual |
| `generateCashFlowProjection(budget)` | `index.html` | Genera ocho semanas deterministas con participaciones fijas y ajusta el cierre a `grandTotal` | IMPLEMENTADO Y FUNCIONAL por inspección/build; demo no contractual |
| `getFinancialSCurveData()` | `index.html` | Valida `cashFlowProjection`; si falta o no cierra en `grandTotal`, usa la proyección demo | IMPLEMENTADO Y FUNCIONAL |
| `renderFinancialSCurve()` | `index.html` | Construye un line chart con planificado y acumulado; el acumulado tiene fill | IMPLEMENTADO PARCIALMENTE |
| `getScenarioComparisonChartData()` | `index.html` | Usa `compareScenarioTotals()` y crea datasets de costo directo, total y ahorro | IMPLEMENTADO Y FUNCIONAL por conexión de código |
| `renderScenarioComparisonChart()` | `index.html` | Dibuja bar chart agrupado en `scenario-comparison-chart` | IMPLEMENTADO PARCIALMENTE |
| `getCostDriversRiskChartData()` | `index.html` | Combina top drivers con `getCriticalApus()` y asigna color por riesgo | IMPLEMENTADO Y FUNCIONAL por conexión de código |
| `renderCostDriversRiskChart()` | `index.html` | Dibuja barras horizontales de monto y comunica riesgo por color/tooltip | IMPLEMENTADO PARCIALMENTE |
| `getWorkflowCycleChartData()` | `index.html` | Filtra etapas con timestamps válidos y conserva labels insuficientes | IMPLEMENTADO Y FUNCIONAL por conexión de código |
| `renderWorkflowCycleChart()` | `index.html` | Dibuja las horas observadas y formatea tooltip/eje con `formatDuration()` | IMPLEMENTADO PARCIALMENTE |
| `getCostDistributionByCategory()` | `index.html` | Agrupa subtotales por categoría y devuelve monto/porcentaje | IMPLEMENTADO Y FUNCIONAL local |
| `renderCostDistributionChart()` | `index.html` | Reutiliza la distribución y la muestra como doughnut | IMPLEMENTADO PARCIALMENTE |
| `renderDashboardCharts()` | `index.html` | Aplica permisos, crea tarjetas y renderiza gráficos activos del dashboard | IMPLEMENTADO PARCIALMENTE |
| `renderScenarioCharts()` | `index.html` | Inserta las tres tarjetas de escenarios y renderiza sus gráficos | IMPLEMENTADO PARCIALMENTE |
| `renderClientCostDistributionChart()` | `index.html` | Crea dinámicamente el container comercial del portal, renderiza y limpia al salir | IMPLEMENTADO PARCIALMENTE |
| `calculateTotalsFromItems()` | `index.html` | Calcula costo directo, recargos, utilidad, subtotal, impuesto y total | IMPLEMENTADO Y FUNCIONAL local |
| `hasPermission(permission)` | `index.html` | Comprueba el permiso del rol actual contra `rolePermissions` | IMPLEMENTADO Y FUNCIONAL local |
| `logAuditEvent()` | `index.html` | Agrega acciones de negocio al AuditLog local; no registra lifecycle Chart.js | IMPLEMENTADO Y FUNCIONAL local |

## Contrato de visualización y DOM

| Vista | Container | Canvas | Datos | Roles/guard |
|---|---|---|---|---|
| Dashboard | `#dashboard-chart-container` | `financial-s-curve-chart`, `cost-distribution-dashboard-chart`, `cost-drivers-dashboard-chart`, `workflow-cycle-chart` | Curva S, distribución interna, drivers/riesgo, workflow | Guards en `renderDashboardCharts()` |
| Escenarios | `#scenarios-view-container` | `scenario-comparison-chart`, `cost-distribution-chart`, `cost-drivers-risk-chart` | Comparativa, distribución y riesgo | `appState.ui.activeView === "scenarios"` y `canViewScenarios()` |
| Portal Cliente | `#client-portal-view-container` + `#client-cost-distribution-container` dinámico | `client-cost-distribution-chart` | Distribución comercial por capítulo | Rol Cliente + `proposal:view` |

Cada canvas recibe `role="img"` y `aria-label` mediante `chartCardMarkup()`. Cada tarjeta tiene un resumen textual en `data-chart-message`, que también sirve como fallback. Los nombres técnicos largos de los APUs se mantienen en labels; la barra representa monto y el riesgo se explica en tooltip/color, sin escala secundaria ambigua.

## Flujos funcionales end-to-end

### Abrir Dashboard y renderizar la Curva S

1. El usuario pulsa el botón con `data-view="dashboard"`.
2. `handleAppClick()` delega en `navigateTo("dashboard")`.
3. `navigateTo()` actualiza `appState.ui.activeView` y llama `renderCurrentView()`.
4. `renderDashboardView()` genera el dashboard y añade `#dashboard-chart-container`.
5. `renderDashboardCharts()` comprueba el rol y `dashboard:financial`.
6. `getFinancialSCurveData()` lee `getCurrentBudget().totals.grandTotal` y usa la proyección persistida válida o `generateCashFlowProjection()`.
7. `renderFinancialSCurve()` crea el canvas `financial-s-curve-chart` y entrega la configuración a `createChart()`.
8. `createChart()` registra la instancia en `chartRegistry["financial-s-curve"]`.
9. Resultado observable por código: tarjeta con resumen y canvas de Curva S para Director Financiero/Gerente General. Estado de ejecución visual: NO VERIFICADO en navegador en esta iteración.

### Cambiar un APU y actualizar datos que consumen gráficos

1. El usuario edita una cantidad en un input con `data-action="quantity"`.
2. El listener `handleAppInput()` llama `updateBudgetItemQuantity()`.
3. La función normaliza la cantidad, actualiza `subtotal`, recalcula `calculateBudgetTotals()` y persiste por API si corresponde.
4. La vista presupuestaria actualiza su subtotal y resumen.
5. Cuando el usuario entra nuevamente al dashboard o escenarios, `getCostDistributionByCategory()`, `getTopCostDrivers()` y los builders leen los valores actuales.
6. El renderer destruye la instancia anterior por `chartId` y crea una nueva.
7. No se escribe una segunda copia de totales dentro de Chart.js.

### Abrir Escenarios

1. El usuario pulsa `data-view="scenarios"`.
2. `navigateTo()` actualiza la vista; `renderCurrentView()` destruye gráficos dashboard y cliente.
3. `renderScenariosView()` verifica `canViewScenarios()`, calcula el escenario activo y renderiza la tabla existente.
4. `renderScenarioCharts(active.id)` llama `getScenarioComparisonChartData()`, `getCostDistributionByCategory(active.id)` y `getCostDriversRiskChartData(5, active.id)`.
5. Inserta `scenario-comparison-chart`, `cost-distribution-chart` y `cost-drivers-risk-chart` en `#scenarios-view-container`.
6. Los renderers crean las instancias correspondientes en `chartRegistry`.
7. Resultado observable por código: tabla, tarjetas textuales y tres canvas para roles con `scenario:read`. Ejecución visual no verificada en navegador.

### Cambiar de Escenarios a otra vista

1. `navigateTo()` cambia `appState.ui.activeView`.
2. `renderCurrentView()` ejecuta `destroyScenarioCharts()` porque la vista nueva no es `scenarios`.
3. Cada instancia registrada se destruye mediante el método Chart.js `.destroy()` y se elimina del registry.
4. El nuevo renderer construye únicamente la vista destino.
5. No quedan listeners de Chart.js ni canvas duplicados según el código de lifecycle.

### Portal Cliente

1. El usuario cambia el rol a Cliente con `switchRole("Cliente")` o navega a `client-portal`.
2. `refreshWorkflowDependentViews()` o `navigateTo()` renderiza `renderClientPortalView()`.
3. Si existe propuesta visible y `proposal:view` es válido, `renderClientCostDistributionChart()` crea `#client-cost-distribution-container` si aún no existe.
4. La función reutiliza `getCostDistributionByCategory()` y solo muestra categoría, monto y porcentaje comercial.
5. No renderiza Curva S, drivers, riesgo interno, proveedores ni márgenes internos para Cliente.
6. Si el usuario sale del portal, `renderCurrentView()` destruye `client-cost-distribution`.
7. Limitación: la fuente actual es el escenario activo del estado local, no un snapshot comercial remoto verificado.

### Workflow y gráfico de tiempos

1. Una transición válida pasa por `changeWorkflowStage()`.
2. La función actualiza `appState.workflow`, `budget.status`, sincroniza mockDB y llama `logAuditEvent("WORKFLOW_STAGE_CHANGED", ...)`.
3. `getWorkflowStageDurations()` ordena eventos del AuditLog, calcula horas únicamente con timestamps válidos y marca `hasData`.
4. `getWorkflowCycleChartData()` excluye etapas sin datos y conserva sus labels en `insufficientStages`.
5. `renderWorkflowCycleChart()` crea un bar chart de horas o deja el resumen “Sin datos suficientes”.
6. El dibujo no crea auditoría y no inventa tiempos.

## Estado y gestión de datos

- `appState` es la fuente que leen los renderers.
- `mockDB` se sincroniza por las funciones existentes como `syncCurrentBudgetToMockDB()`.
- `calculateBudgetTotals()` sigue siendo la entrada que mantiene `budget.totals` consistente.
- `chartRegistry` es efímero y no forma parte de `appState` ni `mockDB`.
- La proyección temporal demo no altera `budget.totals` ni crea registros de obra ejecutada.
- `safeMetric()` y `formatCurrency()` evitan que valores no numéricos se expongan como `NaN` en tooltips o resúmenes.
- El fallback de Chart.js evita que una CDN no disponible detenga la SPA.

## Workflow y aprobaciones

El workflow heredado conserva `WORKFLOW_STAGE`, `WORKFLOW_STATUS`, `workflowTransitions`, `canTransitionTo()`, `changeWorkflowStage()` y guards por permiso. Las funciones de aprobación, rechazo, propuesta, legal y firma demo ya existentes no fueron reescritas en esta iteración.

Lo que existe hoy:

- Hay objetos de workflow, approvals, comments, documents y signatures.
- Hay handlers y renderers locales para varias transiciones demo.
- `changeWorkflowStage()` genera `WORKFLOW_STAGE_CHANGED` en AuditLog.
- El gráfico de ciclo solo observa ese AuditLog.

Lo que no hace todavía:

- Chart.js no implementa revisión técnica, revisión financiera, aprobación gerencial, revisión legal ni firma real.
- No se agregaron nuevas transiciones ni permisos en esta iteración.
- No existe autorización de workflow en el backend Flask.

Estado: `IMPLEMENTADO PARCIALMENTE` para el workflow demo local; `NO IMPLEMENTADO` para un workflow empresarial remoto o firma real.

## Auditoría

`logAuditEvent()` sigue registrando acciones de negocio en `appState.data.auditLog` y sincronizando el mirror mock cuando corresponde. Los gráficos no llaman `logAuditEvent()` y no registran `CHART_RENDERED`, navegación, creación de canvas ni destrucción de instancias.

`getWorkflowStageDurations()` consume eventos `WORKFLOW_STAGE_CHANGED` con `metadata.previousStage`, `metadata.nextStage` y timestamps. Si los timestamps no son válidos, la etapa no se incluye en los datos del gráfico y la UI explica la insuficiencia.

El AuditLog remoto no fue añadido en esta iteración y el backend no persiste los eventos locales.

## Dependencias internas

- Chart.js se obtiene exclusivamente del CDN de jsDelivr indicado en `index.html`.
- Tailwind CSS continúa cargándose desde su CDN existente.
- Los gráficos dependen de `safeMetric()`, `formatCurrency()`, `formatDuration()`, `escapeHTML()`, `getCurrentBudget()`, `getCurrentScenario()`, `hasPermission()` y las funciones de analytics existentes.
- No se añadió paquete npm ni dependencia backend.
- Chart.js no depende de `apiClient`, PostgreSQL ni Tailscale; consume el estado ya hidratado.

## Verificación contra código

### Archivos y estructuras revisados

- `index.html`: único runtime activo; se localizaron `mockDB`, `appState`, `rolePermissions`, `viewRegistry`, cálculos, workflow, analytics, Chart engine, renderers y listeners.
- `tests/test_backend_contract.py`: se añadió un contrato para CDN única, registry, destroy helpers, builders, renderers, canvas IDs, ausencia de `CHART_RENDERED` y ausencia de `Math.random()`.
- `md/fase-5-2.md`: se usó como snapshot anterior, sin sobrescribirlo.
- `backend/app.py`, `backend/db.py`, repositorios y `vite.config.js`: se revisó la infraestructura heredada para confirmar que Chart.js no abre conexiones ni reemplaza el backend.

### Conexiones comprobadas

- `renderDashboardView()` → `renderDashboardCharts()`.
- `renderScenariosView()` → `renderScenarioCharts(active.id)`.
- `renderClientPortalView()` → `renderClientCostDistributionChart()` desde `renderApp()`, `refreshWorkflowDependentViews()` y `navigateTo()`.
- `renderCurrentView()` → destrucción de gráficos de vistas no activas.
- `getFinancialSCurveData()` → `getCurrentBudget()` / `generateCashFlowProjection()`.
- `getScenarioComparisonChartData()` → `compareScenarioTotals()`.
- `getCostDriversRiskChartData()` → `getTopCostDrivers()` / `getCriticalApus()`.
- `getWorkflowCycleChartData()` → `getWorkflowStageDurations()`.
- Todos los renderers → `createChart()` → `chartRegistry`.

### Inconsistencias encontradas y corregidas

1. El portal cliente no tenía un container estático para su gráfico. `renderClientCostDistributionChart()` ahora crea `#client-cost-distribution-container` dentro de `#client-portal-view-container` cuando la vista y el permiso son válidos.
2. El cambio de vista no destruía explícitamente el gráfico del portal cliente. `renderCurrentView()` ahora destruye `client-cost-distribution` al salir.
3. La navegación directa a `client-portal` llamaba al renderer textual, pero no al renderer de gráfico. `navigateTo()` ahora llama `renderClientCostDistributionChart()` para esa vista.
4. Una proyección persistida con acumulado final incorrecto podía contradecir el total presupuestado. `getFinancialSCurveData()` ahora la considera inválida y vuelve a la proyección determinista que fuerza el último acumulado a `grandTotal`.
5. El test estático inicial asumía que los canvas aparecían como `id="..."` literal en HTML. Los canvas se generan por `chartCardMarkup()`; el test fue corregido para verificar los IDs contractuales en los builders reales.

No se encontró una función Chart.js sin conexión en el flujo después de estas correcciones. `destroyAllCharts()` existe como helper global aunque el lifecycle normal usa destrucción por grupos de vista para evitar limpiar gráficos no afectados.

## Verificación funcional

### VERIFICADO POR EJECUCIÓN

- `npm run build`: exitoso; Vite generó `dist/index.html`.
- `python -m unittest discover -s tests -p "test_*.py" -v`: 6 pruebas exitosas.
- `python -m compileall -q backend tests`: exitoso.
- Extracción del script inline y `node --check`: sintaxis JavaScript válida.
- `git diff --check`: sin errores de whitespace; Git solo informó la conversión normal LF/CRLF de `index.html`.

### VERIFICADO POR INSPECCIÓN

- La CDN de Chart.js aparece una sola vez.
- Todos los builders y renderers usan `createChart()` y no calculan reglas financieras nuevas.
- Los IDs de canvas contractuales son consistentes entre `chartCardMarkup()`, renderers y `chartRegistry`.
- El fallback existe para `Chart` ausente y para excepciones de creación.
- El lifecycle destruye gráficos de dashboard, escenarios y portal cuando cambia la vista.
- `Math.random()` no aparece en `index.html`; no se generan datos aleatorios.
- No aparece `CHART_RENDERED` ni un evento equivalente de auditoría.

### NO VERIFICADO

- No se abrió un navegador en esta iteración.
- No se observó el canvas real con la CDN cargada.
- No se verificó el comportamiento cuando jsDelivr está bloqueado en una sesión real.
- No se verificó una hidratación PostgreSQL real ni una proyección temporal remota.

## Limitaciones actuales

1. Chart.js depende de una CDN sin pin de versión. Producción debe alojar o versionar el asset según la política de distribución.
2. La Curva S es una proyección demo de ocho semanas basada en participaciones fijas; no representa avance físico, fechas contractuales, flujo de caja real ni forecast de ejecución.
3. `cashFlowProjection` existe como array vacío en el mock; no hay editor, API, validación de calendario ni persistencia de periodos.
4. El gráfico del portal Cliente reutiliza `getCostDistributionByCategory()` del estado local/escenario activo; no consume un snapshot comercial remoto independiente.
5. La visualización del workflow depende de `AuditLog` local. Si faltan timestamps de transición, muestra “Sin datos suficientes” y no inventa duración.
6. Los roles y permisos se aplican solo en la SPA demo. Flask no valida sesión, token ni permisos de rol.
7. El fallback es textual; no existe una alternativa de render SVG/canvas local si Chart.js no carga.
8. No existe prueba de navegador automatizada ni prueba de accesibilidad con lector de pantalla.
9. `src/` sigue siendo una arquitectura React paralela no conectada al runtime activo; no se duplicó la implementación de gráficos allí.
10. No se implementaron funciones adicionales de Fase 2, Fase 3, Fase 4 ni una fase posterior; solo se representaron datos de capacidades heredadas cuando ya existían.

## Cambios de esta iteración

1. Se añadió el CDN único de Chart.js y se actualizó el comentario inicial de transparencia de `index.html` con las alternativas de producción.
2. Se añadió el bloque `VISUALIZATION / CHART ENGINE` con `chartRegistry`, `CHART_COLORS`, `destroyChart()`, `destroyAllCharts()`, `setChartFallback()`, `createChart()` y opciones comunes.
3. Se añadió la proyección determinista mediante `generateCashFlowProjection()` y la validación de cierre en `getFinancialSCurveData()`.
4. Se añadieron builders y renderers para Curva S, comparativa de escenarios, distribución por capítulo, cost drivers/riesgo y ciclo de workflow.
5. Se añadió `renderDashboardCharts()` con guards de rol/permisos y tarjetas textuales accesibles.
6. Se añadió `renderScenarioCharts()` con los tres canvas contractuales de escenarios.
7. Se añadió `renderClientCostDistributionChart()` con container dinámico y restricción comercial para Cliente.
8. Se modificó `renderCurrentView()` para destruir instancias de vistas no activas.
9. Se modificó `renderApp()`, `refreshWorkflowDependentViews()`, `markProposalViewed()` y `navigateTo()` para conectar el lifecycle del portal cliente.
10. Se modificó la validación de la Curva S para no aceptar una proyección persistida cuyo acumulado final no coincide con `grandTotal`.
11. Se añadieron estilos `.chart-shell` para una altura responsive y un canvas controlado.
12. Se añadió a `tests/test_backend_contract.py` el contrato de Chart.js, IDs de canvas, helpers de lifecycle y prohibición de datos aleatorios/eventos de render.
13. `renderWorkflowCycleChart()` ahora evita crear un canvas vacío cuando no existen timestamps suficientes y conserva el mensaje textual `Sin datos suficientes.`.
14. Se creó este snapshot nuevo `md/fase-5-3.md`; `md/fase-5-2.md` no fue sobrescrito.

## Impacto técnico de esta iteración

### Archivos afectados

- `index.html`: nueva dependencia CDN, estilos, estado de proyección demo, engine Chart.js, renderers y conexiones de lifecycle.
- `tests/test_backend_contract.py`: nuevas aserciones estáticas del contrato de visualización.
- `md/fase-5-3.md`: documentación versionada de la iteración.

### Contratos conservados

- `appState`, `mockDB`, `rolePermissions`, `hasPermission()`, `formatCurrency()`, `formatDuration()`, `getCostDistributionByCategory()`, `compareScenarioTotals()`, `getTopCostDrivers()`, `getCriticalApus()`, `getWorkflowStageDurations()` y los IDs de containers existentes no fueron reemplazados.
- `apiClient`, backend, mock fallback, cálculos y workflow siguen operando fuera del engine de gráficos.
- Las acciones de negocio conservan sus eventos de AuditLog; los gráficos no generan nuevos eventos.

### Riesgos de regresión

- La CDN externa puede no estar disponible; el fallback evita romper la SPA, pero elimina el canvas.
- El render general sigue llamando varios renderers heredados; el registry evita duplicación de instancias, pero una prueba de navegador debe confirmar el costo visual de estos rerenders.
- La proyección demo puede ser interpretada como cronograma si se elimina su texto descriptivo; la tarjeta la etiqueta explícitamente como “Proyección financiera demo, no cronograma contractual”.

## Compatibilidad

- Compatible con la SPA actual en `index.html`.
- Compatible con el proxy `/api` y el backend local porque los gráficos consumen el estado ya existente.
- Compatible con fallback `mockDB` cuando la API no responde.
- Compatible con roles locales porque los charts se ocultan por condiciones existentes de `rolePermissions` y `hasPermission()`.
- No modifica la API HTTP, las rutas Flask, las tablas PostgreSQL esperadas ni el contrato de persistencia de partidas.
- La arquitectura React de `src/` no fue modificada; no se debe asumir que los builders de gráficos están disponibles allí.

## Preparación para siguientes fases

La siguiente iteración de Fase 5, si se autoriza, debe reutilizar `chartRegistry`, `createChart()`, `chartCardMarkup()`, `safeMetric()`, `formatCurrency()`, `formatDuration()` y el contrato de containers/canvas. Debe evitar crear gráficos directamente dentro de handlers de negocio y debe destruir instancias al cambiar de vista.

Si el proyecto define una fase posterior para persistencia o producción, deberá:

- mover o versionar Chart.js según la política de assets;
- introducir un snapshot de proyección temporal con periodos y origen verificables;
- servir el snapshot comercial del Cliente sin exponer datos internos;
- mantener los guards frontend y agregar autorización backend real;
- añadir pruebas de navegador para navegación, roles, fallback y ausencia de duplicación de canvas;
- conservar el AuditLog de negocio sin registrar eventos de dibujo.

No se inició Fase 2 ni se añadió una revisión técnica, financiera o gerencial nueva.

## Próxima fase

No existe una Fase 6 definida en los documentos revisados. La siguiente acción concreta de este plan es una revisión de Tech Lead de esta iteración y, si se aprueba, una validación de navegador de los flujos de dashboard, escenarios y portal cliente. Esa validación debe comprobar que Chart.js carga, que cada canvas se dibuja una sola vez por vista, que el fallback textual aparece cuando la CDN falla y que Cliente no ve riesgo, drivers ni Curva S.

Fase 2 sigue pendiente como funcionalidad de negocio independiente: revisión técnica, revisión financiera, aprobación gerencial y sus transiciones, permisos, UI, handlers, AuditLog y pruebas end-to-end. Esta iteración no la inició.

## Arquitectura Producción / Homelab

La implementación actual usa Chart.js desde CDN y el estado demo/API del SPA. Una arquitectura de producción o Homelab debe conservar la separación:

`navegador → SPA → HTTP/JSON → Flask → psycopg → PostgreSQL por Tailscale`.

Chart.js debe cargarse desde asset versionado local, almacenamiento interno o una política CDN aprobada. El navegador no debe recibir `DB_PASSWORD`. Los equivalentes objetivo heredados siguen siendo PostgreSQL autohospedado, MinIO para objetos, DocuSeal para firma, Cal.com para agenda, n8n para automatizaciones y Keycloak para identidad/RBAC. Ninguno de esos servicios nuevos fue implementado en esta iteración.

## Contrato para la siguiente iteración

1. No cambiar `chartRegistry` ni los IDs de canvas sin actualizar este contrato y los tests.
2. Todo gráfico nuevo debe tener builder de datos separado del renderer.
3. Todo valor monetario debe pasar por `safeMetric()` y `formatCurrency()`.
4. Toda duración debe usar `getWorkflowStageDurations()`/`formatDuration()` o una función de negocio equivalente ya verificada.
5. No calcular reglas de negocio, permisos o totales dentro de callbacks de Chart.js.
6. No crear datos con `Math.random()` ni inventar timestamps.
7. No generar eventos `CHART_RENDERED` ni auditar el lifecycle del canvas.
8. Renderizar solo en la vista activa y destruir al abandonarla.
9. Mantener el resumen textual y el fallback cuando `Chart` no exista.
10. Verificar build, sintaxis, tests y navegador antes de afirmar `IMPLEMENTADO Y FUNCIONAL` para la parte visual.
