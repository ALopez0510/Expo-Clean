# Fase 1 — Iteración 1

## Identificación

- Fase: 1
- Iteración: 1
- Archivo: `fase-1-1.md`
- Versión anterior: ninguna; es la primera documentación versionada de esta fase.
- Frontend: `Expo-Clean/index.html`
- Documentación: `md/fase-1-1.md`

## Estado del proyecto

BuildCost es una SPA B2B de escritorio responsive para explorar APUs, formar un presupuesto, editar cantidades y recalcular el resumen financiero en tiempo real. El catálogo contiene 20 actividades de construcción con datos demo de Ecuador. La sesión, el presupuesto, el audit log y los cambios económicos viven en memoria.

La interfaz mantiene las vistas de Catálogo de APUs, Presupuesto y Resumen ejecutivo, con navegación lateral y scroll interno. La Fase 1 no implementa todavía revisión técnica, revisión financiera, aprobaciones, escenarios, documentos, portal cliente, contratos ni Audit Trail visual.

## Arquitectura global

El archivo web único es `Expo-Clean/index.html`. Usa HTML5, JavaScript vanilla, CSS inline y Tailwind CSS mediante CDN. No usa React, Vue, Angular, Svelte, jQuery, Bootstrap, npm, bundler, backend, `fetch`, APIs de negocio, LocalStorage, IndexedDB ni cookies.

El JavaScript está organizado dentro de estas secciones explícitas:

```text
01. CONFIG
02. MOCK DATABASE
03. APP STATE
04. RBAC ENGINE
05. CORE / HELPERS
06. APU ENGINE
07. BUDGET ENGINE
08. FINANCIAL ENGINE
09. WORKFLOW ENGINE
10. DOCUMENT ENGINE
11. LEGAL ENGINE
12. AUDIT ENGINE
13. ROUTER / NAVIGATION
14. RENDERERS
15. EVENT HANDLERS
16. INITIALIZATION
```

El flujo es:

```text
mockDB → appState.data → engines / validación → renderers → DOM
DOM event → handler central → mutación de appState → audit log cuando aplica → cálculo → render parcial
```

Las siguientes fases deben extender esta arquitectura y no reconstruirla desde cero.

## Estructura física del proyecto

```text
Expo-clean/
├── Expo-Clean/                 # carpeta web existente; contiene index.html
│   └── index.html
├── md/                         # documentación versionada fuera de la carpeta web
│   └── fase-1-1.md
└── Expo-Clean.zip
```

No se creó una nueva carpeta web ni se movió el frontend. La documentación nueva está en `md/`, no dentro de `Expo-Clean/`.

## Mock Database

Existe una única constante `mockDB` con esta estructura:

```js
const mockDB = {
  users: [],
  roles: [],
  clients: [],
  projects: [],
  apus: [],
  budgets: [],
  documents: [],
  comments: [],
  approvals: [],
  auditLog: []
};
```

En el código, `users`, `roles`, `clients`, `projects` y `budgets` se inicializan con las entidades demo; `apus` se llena con el dataset hardcodeado durante `initializeApp()`. `documents`, `comments`, `approvals` y `auditLog` comienzan vacíos. `hydrateStateFromMockDB()` clona sus colecciones hacia `appState.data`; `syncCurrentBudgetToMockDB()` mantiene el presupuesto simulado actualizado y `logAuditEvent()` mantiene el audit log simulado.

## App State

La fuente de verdad de negocio es el único objeto `appState`:

```js
const appState = {
  session: {
    currentUserId: "USR-001",
    currentRole: "Presupuestista"
  },
  ui: {
    activeView: "apu-catalog",
    sidebarCollapsed: false,
    activeModal: null,
    toast: null
  },
  filters: {
    apuSearch: "",
    apuCategory: "ALL",
    apuUnit: "ALL"
  },
  data: {
    users: [],
    roles: [],
    clients: [],
    projects: [],
    apus: [],
    budgets: [],
    documents: [],
    comments: [],
    approvals: [],
    auditLog: []
  },
  currentProjectId: "PRJ-001",
  currentBudgetId: "BUD-001",
  settings: {
    currency: "USD",
    overheadPercent: 8,
    contingencyPercent: 3,
    profitPercent: 10,
    taxPercent: 15
  },
  workflow: {
    status: "DRAFT",
    currentStage: "BUDGETING",
    approvals: []
  }
};
```

Para no romper el contrato de la primera entrega, `Object.defineProperties` expone aliases de compatibilidad calculados: `appState.currentUser`, `appState.activeView`, `appState.apuCatalog`, `appState.budget`, `appState.auditLog`, `appState.documents`, `appState.comments`, `appState.roles`, y en `filters`, `search`, `category`, `unit`. Esos aliases no duplican datos; apuntan a `appState.ui`, `appState.data` o `appState.filters`.

## Entidades JSON

### Usuario

```js
{
  id: "USR-001",
  name: "María Andrade",
  role: "Presupuestista",
  email: "maria.andrade@demo.local",
  active: true
}
```

### Cliente

```js
{
  id: "CLI-001",
  name: "Hidalgo & Hidalgo",
  taxId: "DEMO-CLI-001",
  contactName: "Carlos Hidalgo",
  email: "cliente@demo.local"
}
```

### Proyecto

```js
{
  id: "PRJ-001",
  name: "Construcción Edificio Corporativo Quito",
  clientId: "CLI-001",
  location: "Quito, Ecuador",
  currency: "USD",
  status: "ACTIVE"
}
```

### Presupuesto

```js
{
  id: "BUD-001",
  projectId: "PRJ-001",
  name: "Presupuesto Base Rev. 01",
  version: 1,
  status: "DRAFT",
  createdBy: "USR-001",
  createdAt: "2026-10-15T09:00:00-05:00",
  updatedAt: "2026-10-15T09:00:00-05:00",
  items: [],
  totals: {
    directCost: 0,
    overhead: 0,
    contingency: 0,
    profit: 0,
    subtotal: 0,
    tax: 0,
    grandTotal: 0
  },
  scenarios: [],
  metadata: { currency: "USD" }
}
```

## Dataset APU

El catálogo contiene 20 registros: dos por cada una de estas diez categorías:

- Movimiento de tierras.
- Hormigón.
- Acero.
- Mampostería.
- Enlucidos / acabados.
- Instalaciones hidrosanitarias.
- Instalaciones eléctricas.
- Pavimentos.
- Estructuras.
- Obras preliminares.

Cada APU tiene exactamente:

```js
{
  id,
  code,
  name,
  category,
  description,
  unit,
  unitPrice,
  currency,
  components: { labor, materials, equipment, transport, other },
  metadata: { source, lastUpdated, region }
}
```

Las unidades usadas son `m`, `m2`, `m3`, `kg`, `u`, `punto` y `global`. Todos los precios son USD, todos los IDs y códigos son únicos y la suma de los cinco componentes coincide con `unitPrice` en los 20 registros.

## Budget

El presupuesto vigente se obtiene con `getCurrentBudget()` desde `appState.data.budgets` usando `appState.currentBudgetId`. Sus valores demo son `BUD-001`, proyecto `PRJ-001`, estado `DRAFT`, versión 1 y moneda USD. Cada cambio actualiza `updatedAt`, recalcula `totals` y sincroniza el presupuesto simulado en `mockDB.budgets`.

## Budget Item

Cada elemento de `budget.items` tiene esta estructura exacta:

```js
{
  id,
  apuId,
  code,
  name,
  unit,
  quantity,
  unitPrice,
  subtotal
}
```

Las cantidades aceptan decimales, no aceptan negativos y un campo vacío durante edición se convierte de forma segura a cero sin romper la UI. Agregar el mismo APU incrementa `quantity` en vez de crear un duplicado.

## Fórmulas financieras

Las fórmulas viven en `calculateBudgetTotals()` y se ejecutan antes de renderizar:

- `directCost = sumatoria de todos los subtotales de items`.
- `overhead = directCost * overheadPercent / 100`.
- `contingency = directCost * contingencyPercent / 100`.
- `profit = directCost * profitPercent / 100`.
- `subtotal = directCost + overhead + contingency + profit`.
- `tax = subtotal * taxPercent / 100`.
- `grandTotal = subtotal + tax`.

Los porcentajes nunca se duplican dentro de las fórmulas; se toman de `appState.settings`.

## Configuración económica

- `currency`: `"USD"`.
- `overheadPercent`: `8`.
- `contingencyPercent`: `3`.
- `profitPercent`: `10`.
- `taxPercent`: `15`.

Todos los porcentajes se limitan al rango `0`–`100`. `formatCurrency()` usa `Intl.NumberFormat("es-EC", { style: "currency", currency: appState.settings.currency })`.

## Selectores

Los selectores obligatorios son:

- `getCurrentUser()`: busca `appState.session.currentUserId` en `appState.data.users`.
- `getCurrentProject()`: busca `appState.currentProjectId` en `appState.data.projects`.
- `getCurrentClient()`: obtiene el cliente relacionado con el proyecto actual.
- `getCurrentBudget()`: busca `appState.currentBudgetId` en `appState.data.budgets`.

También existen `getCurrentRole()`, `getApuById(apuId)` y `getBudgetItemById(itemId)`.

## Core / Helpers

- `deepClone(value)`: clona JSON para separar mockDB y estado.
- `hydrateStateFromMockDB()`: carga las entidades del mock en `appState.data`.
- `syncCurrentBudgetToMockDB()`: sincroniza la entidad presupuestaria simulada.
- `escapeHTML(value)`: sanitiza valores antes de insertarlos en plantillas HTML.
- `formatCurrency(value)`: aplica formato monetario USD con `Intl.NumberFormat`.
- `generateId(prefix)`: genera IDs incrementales sin colisionar con items o eventos existentes.

## APU Engine

- `getApuById(apuId)` selecciona un APU desde `appState.data.apus`.
- `filterApus()` combina búsqueda en código, nombre y descripción con categoría y unidad.
- `renderFilters()` deriva categorías y unidades únicas desde el catálogo.
- `renderApuCatalog()` presenta el catálogo filtrado, contador y estado vacío.

## Budget Engine

- `getBudgetItemById(itemId)` selecciona un item del presupuesto actual.
- `addApuToBudget(apuId)` valida permisos, crea o incrementa el item, registra auditoría y recalcula.
- `removeBudgetItem(itemId)` valida permisos, elimina el item, registra auditoría y recalcula.
- `updateBudgetItemQuantity(itemId, quantity, shouldAudit = true)` valida permisos, normaliza la cantidad y recalcula; el handler de `input` pasa `false` para evitar un evento por cada tecla y el handler de `change` registra la confirmación.

## Financial Engine

`calculateBudgetTotals()` calcula y guarda `budget.totals`. Los renderers solo leen los totales ya calculados; no contienen las fórmulas. `updateEconomicSetting(key, value, shouldAudit = true)` aplica la validación y registra la mutación directa; el flujo de edición en vivo pasa `false` y el cambio confirmado genera el evento final.

## RBAC Engine

Existe `const rolePermissions = {}` con permisos funcionales para `Presupuestista`: `apu:read`, `budget:write`, `budget:delete`, `budget:quantity` y `settings:write`. `hasPermission(permission)` consulta el rol actual. En Fase 1 el usuario demo puede ejecutar las acciones funcionales. No se implementan todavía reglas completas para los seis roles.

## Workflow Engine

El estado reservado es:

```js
workflow: {
  status: "DRAFT",
  currentStage: "BUDGETING",
  approvals: []
}
```

`getWorkflowStatus()` y `getWorkflowStage()` son selectores funcionales. No hay transiciones reales de aprobación.

## Audit Engine

`logAuditEvent(action, entity, entityId, description)` agrega eventos a `appState.data.auditLog` y `mockDB.auditLog`. Cada evento tiene:

```js
{
  id,
  timestamp,
  userId,
  role,
  action,
  entity,
  entityId,
  description
}
```

Eventos implementados:

- `BUDGET_ITEM_ADDED` al agregar o incrementar un APU.
- `BUDGET_ITEM_REMOVED` al eliminar un item.
- `BUDGET_ITEM_QUANTITY_CHANGED` al confirmar una cantidad.
- `ECONOMIC_SETTING_CHANGED` al confirmar un porcentaje.

No hay todavía una interfaz de Audit Trail.

## Router SPA

El router usa `appState.ui.activeView` y la función `navigateTo(viewName)`. Las vistas funcionales son `apu-catalog`, `budget` y `summary`. La navegación usa `viewRegistry` y no un bloque monolítico de `if / else if`:

```js
const viewRegistry = {
  "apu-catalog": renderApuCatalogView,
  "budget": renderBudgetView,
  "summary": renderSummaryView
};
```

Las vistas reservadas en `APP_CONFIG.futureViews` son `workflow`, `scenarios`, `client-portal`, `documents`, `legal`, `audit` y `dashboard`; todavía no se renderizan.

## View Registry

- `renderApuCatalogView()` renderiza filtros y catálogo.
- `renderBudgetView()` renderiza items y resumen recalculado.
- `renderSummaryView()` renderiza resumen e indicadores.
- `renderCurrentView()` selecciona el renderer desde `viewRegistry` y actualiza la navegación.

## Renderers

- `renderApp()` coordina el render inicial.
- `renderSidebar()` actualiza el proyecto lateral y el contador de items.
- `renderHeader()` deriva usuario, rol, cliente, proyecto, ubicación y moneda mediante selectores.
- `renderFilters()` renderiza los selects.
- `renderApuCatalog()` renderiza solo el catálogo cuando cambian filtros.
- `renderBudgetItems()` renderiza solo la tabla de presupuesto al agregar, eliminar o confirmar una cantidad.
- `renderBudgetSummary()` renderiza métricas, desglose, IVA, total y participación promedio desde `budget.totals`.
- `renderSettings()` sincroniza inputs económicos.
- `renderImpactMetrics()` renderiza la banda de impacto demo.
- `updateBudgetIndicators()` actualiza contadores y feedback visual.
- `updateNavigation()` marca la vista activa.
- `showToast(message)` actualiza el toast de feedback y `appState.ui.toast`.

## Event Handlers

Los listeners dinámicos están centralizados en `bindStaticEvents()`:

- `handleAppClick(event)`: navegación, agregar APU y eliminar item.
- `handleAppInput(event)`: búsqueda, cantidades y cambios inmediatos de porcentajes.
- `handleAppChange(event)`: filtros, confirmación de cantidades y confirmación de porcentajes con audit log.

Se usan `data-action`, `data-apu-id`, `data-budget-item-id`, `data-view` y `data-setting`. No se agregan listeners individuales a las filas dinámicas.

## DOM Contract

IDs raíz estables:

- `app`
- `sidebar`
- `app-header`
- `main-content`
- `view-container`
- `toast-container`
- `modal-container`

IDs de vistas y contenedores:

- `catalog-section`
- `apu-catalog-container`
- `apu-filters-container`
- `apuCatalogBody`
- `budget-section`
- `budget-items-container`
- `budgetItemsBody`
- `budgetFooter`
- `economic-settings-container`
- `summary-section`
- `budget-summary-container`
- `summaryMetrics`
- `summaryBreakdown`
- `impact-metrics-container`
- `impact-band`
- `budgetCount`
- `sidebarBudgetCount`
- `apuSearch`
- `categoryFilter`
- `unitFilter`
- `catalogResultCount`

Los IDs de datos de proyecto, usuario y sesión son `sidebarProjectName`, `headerProjectName`, `headerClientName`, `headerProjectLocation`, `headerCurrency`, `headerUserName` y `headerUserRole`.

## Eventos AuditLog

La Fase 1 registra cinco clases de eventos críticos en el flujo normal: adición, incremento desde catálogo, eliminación, cambio de cantidad y cambio económico. El historial queda disponible en `appState.data.auditLog` para que Fase 5 lo consuma posteriormente en Audit Trail, Timeline, Dashboard Ejecutivo y KPIs.

## Roles

Los seis roles de `mockDB.roles` y `appState.data.roles` son:

- Presupuestista.
- Revisor Técnico.
- Director Financiero.
- Gerente General.
- Cliente.
- Oficial Legal.

El rol activo es `Presupuestista`.

## Cambios de esta iteración

- Se reemplazó el estado plano de la primera entrega por `session`, `ui`, `filters`, `data`, IDs actuales, `settings` y `workflow`.
- Se añadió `mockDB` con entidades separadas de usuarios, roles, clientes, proyectos, APUs, presupuestos, documentos, comentarios, aprobaciones y auditoría.
- Se añadieron selectores de usuario, proyecto, cliente y presupuesto.
- Se añadió `rolePermissions`, `hasPermission()` y `getCurrentRole()` como base RBAC.
- Se añadió router SPA con `navigateTo()`, `viewRegistry` y renderers por vista.
- Se añadió audit log funcional para cambios críticos.
- Se centralizaron eventos en `handleAppClick`, `handleAppInput` y `handleAppChange`.
- Se estabilizó el contrato DOM solicitado.
- Se añadió `scenarios: []` a cada presupuesto.
- Se añadió esta documentación completa en `md/fase-1-1.md`.

## Compatibilidad con iteraciones anteriores

La UI, catálogo de 20 APUs, búsqueda, filtros combinados, agregación sin duplicados, cantidades decimales, eliminación, fórmulas, IVA, impacto Hackathon y estados vacíos permanecen disponibles. Los aliases de compatibilidad evitan romper las funciones originales mientras el estado canónico es `appState.data`.

La documentación anterior `contexto_proyecto.md` pertenece a la entrega anterior. A partir de esta actualización, la documentación nueva usa únicamente el formato versionado `fase-{fase}-{iteracion}.md` en `md/`.

## Preparación para Fase 2

Se dejan activos `roles`, `rolePermissions`, `workflow`, `approvals`, `comments` y `auditLog`. Se mantienen puntos de extensión para revisión técnica, revisión financiera, aprobación de Gerencia, aprobación del Cliente y proceso Legal, pero ninguna de esas transiciones está implementada.

## Preparación para Fase 3

Cada presupuesto contiene `scenarios: []`. El espacio de arquitectura queda reservado para Scenario Engine, Price Intelligence, Variance Engine y Risk Engine; ninguno está implementado en esta fase.

## Preparación para Fase 4

`appState.data.documents` existe y se conserva vacío. Puede recibir posteriormente Oferta económica, Oferta técnica, Carta de presentación, Contrato, NDA y Orden de adjudicación. No se desarrollaron firma, portal cliente ni contratos reales.

## Preparación para Fase 5

`appState.data.auditLog` se acumula desde Fase 1 con eventos estructurados y consultables. Puede alimentar posteriormente Audit Trail, Timeline, Dashboard Ejecutivo y KPIs. No se implementó todavía la interfaz de auditoría.

## Arquitectura de producción / Homelab

La demo usa JSON hardcodeado y estado en memoria para priorizar determinismo, velocidad, resiliencia de demo, cero dependencia backend y reducción del riesgo operacional.

| Hackathon | Producción / Homelab |
|---|---|
| `mockDB` | PostgreSQL autohospedado |
| Estado en memoria | Backend / API |
| `documents[]` | MinIO |
| Firmas simuladas | DocuSeal |
| Agenda simulada | Cal.com |
| Automatizaciones | n8n |
| RBAC local | Keycloak |
| Base SaaS alternativa | Supabase, Firebase u otro BaaS |
| Documentos SaaS alternativos | AWS S3, Cloudflare R2 o equivalente |
| Firma SaaS alternativa | DocuSign o Adobe Sign |
| Agenda SaaS alternativa | Calendly |
| Automatización SaaS alternativa | Zapier o Make |
| SSO SaaS alternativo | Auth0, Clerk o equivalente |

## Contrato para la siguiente iteración

No romper los nombres globales `mockDB`, `appState`, `rolePermissions` y `viewRegistry`. Conservar `appState.session`, `appState.ui`, `appState.filters`, `appState.data`, `appState.currentProjectId`, `appState.currentBudgetId`, `appState.settings` y `appState.workflow`.

Conservar las funciones `initializeApp`, `renderApp`, `navigateTo`, `getCurrentUser`, `getCurrentProject`, `getCurrentClient`, `getCurrentBudget`, `renderSidebar`, `renderHeader`, `renderCurrentView`, `renderApuCatalog`, `renderBudgetItems`, `renderBudgetSummary`, `renderFilters`, `renderImpactMetrics`, `filterApus`, `addApuToBudget`, `removeBudgetItem`, `updateBudgetItemQuantity`, `updateEconomicSetting`, `calculateBudgetTotals`, `formatCurrency`, `generateId`, `escapeHTML`, `logAuditEvent`, `hasPermission`, `getCurrentRole`, `getWorkflowStatus`, `getWorkflowStage`, `handleAppClick`, `handleAppInput` y `handleAppChange`.

Respetar las estructuras JSON de usuario, cliente, proyecto, presupuesto, APU, budget item, `totals`, `settings`, `workflow` y eventos de `auditLog`. Reutilizar los IDs definidos en el DOM Contract y mantener el DOM como salida, nunca como fuente principal de datos.
