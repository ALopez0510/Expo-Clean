# Fase 3 — Iteración 1

## Identificación

- Fase: 3 — Escenarios, Price Intelligence, Variancias y Riesgo Económico.
- Iteración: 1.
- Fecha de verificación: 2026-10-16.
- Runtime auditado: index.html, que es el archivo que Vite entrega y que contiene el runtime inline actualmente ejecutado.
- Documentación de entrada revisada: md/fase-1-1.md, md/fase-1-2.md y md/fase-2-1.md.
- Instrucciones aplicadas: AGENTS.md, md/AGENTS.md, src/AGENTS.md y tests/AGENTS.md.
- Archivo creado: md/fase-3-1.md.
- Archivos históricos preservados: md/fase-1-1.md, md/fase-1-2.md y md/fase-2-1.md no fueron sobrescritos.

## Resumen ejecutivo técnico

Fase 3 está implementada en el runtime real sobre la arquitectura heredada de Fases 1 y 2. El presupuesto base permanece en appState.data.budgets y mockDB.budgets. Los escenarios viven en budget.scenarios, se calculan como derivados del presupuesto base y solo cambian el presupuesto base mediante la acción explícita promoteScenarioToBudget().

El Scenario Engine crea tres registros idempotentes por defecto: BASE, OPTIMIZED y CONSERVATIVE. Los escenarios personalizados se crean, duplican, renombran y eliminan con permisos y auditoría. Los ajustes soportan UNIT_PRICE y QUANTITY; cuando ambos existen para un item, el precio unitario ajustado se usa en el subtotal junto con la cantidad ajustada. La base no se modifica durante el análisis.

El Price Intelligence usa 30 referencias locales, deterministas y en USD para APU-001 a APU-010. Incluye CURRENT_BUDGET, HISTORICAL, MARKET_REFERENCE y SUPPLIER_OFFER. No hay fetch, XMLHttpRequest, axios, API ni llamada de mercado. Los APU-011 a APU-020 no tienen referencias locales y el Risk Engine los penaliza por ausencia de referencias.

Variance Engine, Savings Engine, Risk Engine y los analizadores de cost drivers están conectados a renderScenariosView(). La vista muestra selector, comparación, APUs, variancias, recomendaciones, referencias, distribución por categoría, top cost drivers y APUs críticos. Los roles sin scenario:read reciben un estado de acceso restringido y no ven Price Intelligence interno.

Fase 4 y Fase 5 no fueron iniciadas. No se implementaron portal cliente, aprobación cliente, documentos reales, firma, contratos, legal workflow, adjudicación, Audit Trail visual ni dashboard ejecutivo final.

## Estado general de implementación

| Capacidad | Estado | Qué existe hoy | Qué no existe todavía | Fase |
|---|---|---|---|---|
| mockDB y appState | IMPLEMENTADO Y FUNCIONAL | mockDB, hydrateStateFromMockDB(), aliases y sincronización del presupuesto | Persistencia externa, backend y concurrencia | 1-3 |
| Catálogo de 20 APUs | IMPLEMENTADO Y FUNCIONAL | Dataset cargado por initializeApp() y expuesto en appState.data.apus | Catálogo remoto o editable por servidor | 1 |
| Presupuesto base | IMPLEMENTADO Y FUNCIONAL | Items, cantidad decimal, alta sin duplicación, eliminación, totals y sincronización mockDB | Versionado persistente y locks distribuidos | 1-2 |
| Cálculos financieros | IMPLEMENTADO Y FUNCIONAL | calculateTotalsFromItems() y calculateBudgetTotals() con directCost, overhead, contingency, profit, subtotal, tax y grandTotal | Monedas distintas de USD y reglas tributarias externas | 1-3 |
| RBAC Fases 1-3 | IMPLEMENTADO Y FUNCIONAL en demo | rolePermissions, hasPermission(), guards de engines y UI por rol | Autenticación y autorización de servidor | 2-3 |
| Workflow Fase 2 | IMPLEMENTADO Y FUNCIONAL en demo | estados, transiciones, aprobaciones, rechazos, comentarios y bloqueo fuera de BUDGETING | Documentos, firma y aprobación cliente | 2 |
| Scenario Engine | IMPLEMENTADO Y FUNCIONAL | escenarios default, custom, ajustes, comparación y promoción explícita | Escenarios persistidos y colaboración concurrente | 3 |
| Price Intelligence | IMPLEMENTADO Y FUNCIONAL con dataset local | 30 referencias locales, recomendaciones, promedio, mínimo, máximo y aplicación al escenario | Ingesta real, actualización de mercado y fuentes externas | 3 |
| Variance y Savings Engine | IMPLEMENTADO Y FUNCIONAL | variancia por item, escenario, total y ahorro seguro ante cero | Análisis histórico entre revisiones persistidas | 3 |
| Risk Engine | IMPLEMENTADO Y FUNCIONAL en reglas deterministas | score 0-100, niveles LOW/MEDIUM/HIGH/CRITICAL, factores, críticos y riesgo agregado | Modelo estadístico, calibración real y datos de riesgo externos | 3 |
| Vista Scenarios | IMPLEMENTADO Y FUNCIONAL en SPA en memoria | navegación, selector, comparativa, tabla APU, Price Intelligence y métricas | URL routing, persistencia y exportación | 3 |
| settings.scenario | IMPLEMENTADO PARCIALMENTE | minReliability 0.70 y conservativeBufferPercent 5 consumidos por engines | Inputs UI para que el usuario cambie esos parámetros | 3 |
| AuditLog Fase 3 | IMPLEMENTADO PARCIALMENTE | diez acciones Fase 3 se escriben en appState.data.auditLog y mockDB.auditLog | Pantalla visual, filtros y exportación | 3; visual en 5 |
| documents, portal, legal y dashboard | PLACEHOLDER ESTRUCTURAL | arrays, aliases y futureViews existentes | Flujos reales, UI y backend | 4-5 |
| Persistencia, API y autenticación | NO IMPLEMENTADO | ninguna conexión de datos externa | PostgreSQL, MinIO, Keycloak, API y sesión real | Producción futura |

## Cómo funciona actualmente

1. El navegador carga index.html. Vite entrega este archivo; no existe una importación desde index.html hacia src/main.jsx.
2. initializeApp() ejecuta hydrateStateFromMockDB(), carga exactamente 20 APUs mediante appState.apuCatalog, crea los escenarios por defecto mediante ensureDefaultScenarios(), ejecuta renderApp() y registra los listeners globales de event delegation con bindStaticEvents().
3. hydrateStateFromMockDB() clona users, roles, clients, projects, apus, budgets, documents, comments, approvals, auditLog y priceReferences desde mockDB hacia appState.data.
4. El alias appState.budget resuelve el presupuesto actual por currentBudgetId. El alias appState.apuCatalog lee appState.data.apus y su setter mantiene mockDB.apus sincronizado.
5. calculateBudgetTotals() llama calculateTotalsFromItems() para recalcular el presupuesto base. El mismo helper puro sobre una lista derivada calcula cada escenario sin escribir sobre budget.items.
6. navigateTo() valida APP_CONFIG.supportedViews, cambia appState.ui.activeView, llama al renderer registrado en viewRegistry y desplaza la pantalla al section correspondiente. No hay URL, history API ni recarga.
7. renderScenariosView() valida scenario:read antes de escribir Price Intelligence. Para un rol autorizado obtiene el escenario activo, recalcula totals, calcula riesgo y construye la salida HTML mediante escapeHTML() y formatCurrency().
8. Un click con data-action llega a handleAppClick(); un change llega a handleAppChange(). Ambos llaman engines con validaciones de permisos, etapa, IDs y números antes de mutar appState.
9. Las mutaciones de escenario actualizan budget.scenarios, sincronizan mockDB.budgets, registran AuditLog y vuelven a renderizar la vista de escenarios. Ninguna mutación de escenario llama changeWorkflowStage().
10. promoteScenarioToBudget() es la única operación Fase 3 que copia cantidades y precios derivados al presupuesto base. Exige scenario:promote, exige etapa BUDGETING y usa confirmación del navegador cuando existe window.confirm().

## Arquitectura global

La arquitectura vigente es una aplicación demo en memoria con el siguiente recorrido:

    mockDB -> hydrateStateFromMockDB() -> appState.data -> selectors/engines -> renderers -> DOM

La fuente de verdad de ejecución es el estado normalizado de appState. mockDB conserva una copia simulada para verificar sincronización. El presupuesto base conserva el contrato de Fase 1: items, totals, status, metadata y scenarios. Los escenarios son snapshots de definición y ajustes, pero sus items efectivos se derivan cada vez desde budget.items.

Los engines de Fase 3 están en index.html junto a los engines de APU, presupuesto, finanzas, workflow, auditoría y router. No se añadió una dependencia de visualización. La distribución de costos usa barras CSS; no se introdujo una librería de gráficos.

La arquitectura declarada en AGENTS.md y src/ es React/Vite. La inspección real demuestra que src/main.jsx no es importado por index.html. src permanece sin cambios en esta iteración; su build independiente sigue compilando, pero no consume appState ni los engines inline.

## Estructura física del proyecto

- index.html: runtime efectivo, markup, estilos, mockDB, appState, engines, renderers, router y event delegation.
- src/main.jsx, src/App.jsx, src/components/, src/data/ y src/utils/: aplicación React/Vite separada que no está montada por el index.html actual.
- md/AGENTS.md: contrato de documentación.
- md/fase-1-1.md: snapshot inicial de Fase 1, preservado.
- md/fase-1-2.md: auditoría de Fase 1, preservada.
- md/fase-2-1.md: snapshot de Fase 2, preservado.
- md/fase-3-1.md: este snapshot.
- package.json y vite.config.js: build de Vite sin dependencias nuevas.
- tests/AGENTS.md: reglas de verificación; no existe una suite persistente de tests.
- Manual HACKATON EXPO CLEAN Ecuador 2026.pdf: material de referencia; no es un módulo de ejecución.

## Datos y modelos actuales

### mockDB

mockDB contiene users, roles, clients, projects, apus, budgets, documents, comments, approvals, auditLog y priceReferences. El presupuesto BUD-001 conserva:

    {
      id: "BUD-001",
      items: [],
      totals: { directCost, overhead, contingency, profit, subtotal, tax, grandTotal },
      scenarios: [],
      metadata: { currency: "USD" }
    }

initializeApp() completa apus y luego ensureDefaultScenarios() completa scenarios. La copia en mockDB.budgets se actualiza por syncCurrentBudgetToMockDB(). priceReferences se hidrata como copia separada y no se modifica cuando se ajusta un escenario.

### appState

appState contiene session, ui, filters, data, currentProjectId, currentBudgetId, settings y workflow.

- ui.activeScenarioId identifica el escenario activo.
- ui.selectedScenarioApuId identifica el APU que aparece en el panel de referencias.
- data.priceReferences contiene la copia de las 30 referencias.
- settings.scenario.minReliability es 0.70.
- settings.scenario.conservativeBufferPercent es 5.
- workflow conserva status, currentStage y approvals de Fase 2.

Los aliases currentUser, activeView, apuCatalog, budget, auditLog, documents, comments, roles, filters.search, filters.category y filters.unit siguen existiendo.

### Scenario schema

Cada escenario creado por createScenarioRecord() tiene:

    {
      id,
      budgetId,
      name,
      type: "BASE" | "OPTIMIZED" | "CONSERVATIVE" | "CUSTOM",
      description,
      createdBy,
      createdAt,
      updatedAt,
      adjustments: [],
      totals: { directCost, overhead, contingency, profit, subtotal, tax, grandTotal },
      metrics: { varianceAmount, variancePercent, savings, savingsPercent, riskScore, riskLevel }
    }

BASE, OPTIMIZED y CONSERVATIVE se identifican por type. CUSTOM es el único tipo creado por la UI de createScenario(). El registro BASE no acepta ajustes. Los tres defaults se crean una sola vez por tipo; ensureDefaultScenarios() no crea duplicados cuando se llama repetidamente.

### Adjustment schema

applyScenarioAdjustment() crea:

    {
      id,
      scenarioId,
      budgetItemId,
      apuId,
      type: "UNIT_PRICE" | "QUANTITY",
      value,
      sourceId,
      reason,
      createdBy,
      createdAt
    }

Para el mismo budgetItemId y type se conserva un único ajuste vigente. getScenarioItems() busca los ajustes de precio y cantidad por separado; calcula primero valores finitos no negativos y luego subtotal = quantity * unitPrice. Por tanto, un UNIT_PRICE ajustado determina el precio efectivo aunque exista también un ajuste QUANTITY.

### Price Reference schema

PRICE_REFERENCE_DATA contiene 30 registros:

    {
      id,
      apuId,
      type: "CURRENT_BUDGET" | "HISTORICAL" | "MARKET_REFERENCE" | "SUPPLIER_OFFER",
      source,
      unitPrice,
      currency: "USD",
      reliability,
      referenceDate,
      validFrom,
      validTo
    }

Existen tres referencias para cada APU-001 a APU-010. Todos los registros tienen moneda USD, fecha de vigencia que incluye APP_CONFIG.referenceDate = 2026-10-16, precio finito no negativo y confiabilidad entre 0 y 1. APU-011 a APU-020 no tienen registros locales.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| Hidratación | IMPLEMENTADO Y FUNCIONAL | hydrateStateFromMockDB(), deepClone() | render inicial | initializeApp() | VERIFICADO POR EJECUCIÓN | 1 |
| 20 APUs | IMPLEMENTADO Y FUNCIONAL | dataset dentro de initializeApp() | apuCatalogBody | search, filtros y agregar | VERIFICADO POR EJECUCIÓN | 1 |
| APU sin duplicación | IMPLEMENTADO Y FUNCIONAL | addApuToBudget() | data-action add-apu | segunda alta incrementa quantity | VERIFICADO POR EJECUCIÓN | 1 |
| Cantidad decimal | IMPLEMENTADO Y FUNCIONAL | updateBudgetItemQuantity() | quantity inputs | input/change delegado | VERIFICADO POR EJECUCIÓN | 1 |
| Presupuesto y eliminación | IMPLEMENTADO Y FUNCIONAL | removeBudgetItem(), calculateBudgetTotals() | budgetItemsBody | remove-item | VERIFICADO POR EJECUCIÓN | 1 |
| Parámetros económicos | IMPLEMENTADO Y FUNCIONAL | updateEconomicSetting() | setting-input | input/change delegado | VERIFICADO POR EJECUCIÓN | 1 |
| Formato monetario | IMPLEMENTADO Y FUNCIONAL | formatCurrency() | tablas, métricas y paneles | Intl.NumberFormat es-EC/USD | VERIFICADO POR INSPECCIÓN y ejecución indirecta | 1 |
| SPA en memoria | IMPLEMENTADO Y FUNCIONAL | navigateTo(), viewRegistry | botones data-view | scroll y renderer por vista | VERIFICADO POR EJECUCIÓN | 1-3 |
| RBAC | IMPLEMENTADO Y FUNCIONAL en demo | rolePermissions, hasPermission(), canEditBudget(), canModifyScenario() | roleSwitcher y controles condicionales | permit/deny por rol y etapa | VERIFICADO POR EJECUCIÓN | 2-3 |
| Workflow | IMPLEMENTADO Y FUNCIONAL en demo | changeWorkflowStage(), submitForTechnicalReview(), completeWorkflowDecision() | workflow-view-container | submit, approve, reject y comentarios | VERIFICADO POR EJECUCIÓN | 2 |
| Scenario defaults | IMPLEMENTADO Y FUNCIONAL | ensureDefaultScenarios() | selector de escenarios | tres tipos, sin duplicados | VERIFICADO POR EJECUCIÓN | 3 |
| Scenario CRUD | IMPLEMENTADO Y FUNCIONAL | createScenario(), duplicateScenario(), deleteScenario(), renameScenario() | botones del header | mutación, toast y auditoría | VERIFICADO POR EJECUCIÓN | 3 |
| Scenario selector | IMPLEMENTADO Y FUNCIONAL | setActiveScenario() | scenarioSelector | change delegado | VERIFICADO POR INSPECCIÓN y ejecución de engine | 3 |
| Ajustes | IMPLEMENTADO Y FUNCIONAL | applyScenarioAdjustment(), removeScenarioAdjustment() | ajuste listado y botones Aplicar/Quitar | upsert, remove y recálculo | VERIFICADO POR EJECUCIÓN | 3 |
| Totales de escenarios | IMPLEMENTADO Y FUNCIONAL | getScenarioItems(), calculateScenarioTotals(), calculateTotalsFromItems() | tarjetas, comparación y tabla | base no se muta | VERIFICADO POR EJECUCIÓN | 3 |
| Referencias de precio | IMPLEMENTADO Y FUNCIONAL | getPriceReferencesForApu(), getBestPriceReference(), getAverageReferencePrice(), getMinReferencePrice(), getMaxReferencePrice() | Price Intelligence | lectura local y filtros de vigencia | VERIFICADO POR EJECUCIÓN | 3 |
| Recomendación | IMPLEMENTADO Y FUNCIONAL | calculatePriceVariance(), getPriceRecommendation() | panel seleccionado | promedio, rango, mejor referencia y ahorro | VERIFICADO POR EJECUCIÓN | 3 |
| Aplicar referencia | IMPLEMENTADO Y FUNCIONAL | applyPriceReferenceToScenario() | botón Aplicar | ajuste UNIT_PRICE y auditoría adicional | VERIFICADO POR EJECUCIÓN | 3 |
| Optimización | IMPLEMENTADO Y FUNCIONAL | optimizeScenario() | Optimizar precios | mínimo confiable bajo el precio actual | VERIFICADO POR EJECUCIÓN | 3 |
| Conservador | IMPLEMENTADO Y FUNCIONAL | buildConservativeScenario() | Construir conservador | máximo de precio y buffer | VERIFICADO POR EJECUCIÓN | 3 |
| Variancias | IMPLEMENTADO Y FUNCIONAL | calculateItemVariance(), calculateScenarioVariance() | tabla APU y comparación | delta y porcentaje zero-safe | VERIFICADO POR EJECUCIÓN | 3 |
| Savings | IMPLEMENTADO Y FUNCIONAL | calculateSavings(), calculateSavingsPercent() | métrica y comparativa | cero si no hay ahorro | VERIFICADO POR EJECUCIÓN | 3 |
| Comparación | IMPLEMENTADO Y FUNCIONAL | compareScenarioTotals(), compareScenarios() | tabla comparativa | total, variancia, ahorro y riesgo | VERIFICADO POR EJECUCIÓN | 3 |
| Riesgo | IMPLEMENTADO Y FUNCIONAL en reglas deterministas | calculateApuRisk(), calculateScenarioRisk(), getRiskLevel() | métrica y lista críticos | score y factores | VERIFICADO POR EJECUCIÓN | 3 |
| Críticos y drivers | IMPLEMENTADO Y FUNCIONAL | getCriticalApus(), getTopCostDrivers(), getCostDistributionByCategory() | tarjetas/listas CSS | top 5, categorías y barras | VERIFICADO POR EJECUCIÓN | 3 |
| Promoción | IMPLEMENTADO Y FUNCIONAL en BUDGETING | promoteScenarioToBudget() | botón con confirmación | copia explícita al base y audit | VERIFICADO POR EJECUCIÓN | 3 |
| Audit Trail visual | NO IMPLEMENTADO | logAuditEvent() solo escribe | no hay lista visual | no hay filtros/exportación | VERIFICADO POR INSPECCIÓN | 5 |
| Portal, documentos, legal | PLACEHOLDER ESTRUCTURAL | arrays, aliases y comments F2 fuera de documentos | no hay flujo de F4 | no hay firma ni contrato | VERIFICADO POR INSPECCIÓN | 4 |

## Roles y estado RBAC

La autorización real no se infiere solo del selector. rolePermissions define los permisos y cada engine de mutación vuelve a evaluar hasPermission(). canModifyScenario() además exige una etapa de análisis permitida. renderScenariosView() exige scenario:read antes de mostrar el contenido.

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí, mockDB.roles y session demo | scenario:read, create, write, delete, adjust, optimize, conservative, promote, price:read, price:apply, variance:read, risk:read; además permisos F1/F2 | selector, controles Custom, optimización, conservador, aplicar, quitar y promover | Puede crear/duplicar/renombrar/eliminar Custom, ajustar, aplicar referencias, optimizar, construir conservador y promover solo en BUDGETING | IMPLEMENTADO Y FUNCIONAL en demo |
| Revisor Técnico | Sí, mockDB.roles | scenario:read, variance:read, risk:read; no scenario:write ni price:read | ve vista, tabla de variancias, riesgo y panel restringido | Puede analizar; no puede cambiar escenarios ni Price Intelligence interno | IMPLEMENTADO Y FUNCIONAL en demo |
| Director Financiero | Sí, mockDB.roles | scenario:read, create, write, adjust, promote, price:read, price:apply, variance:read, risk:read | selector, Custom, duplicar, renombrar, ajustes y Price Intelligence | Puede crear, ajustar, aplicar referencias y promover solo en BUDGETING; no tiene optimize/conservative/delete | IMPLEMENTADO Y FUNCIONAL en demo |
| Gerente General | Sí, mockDB.roles | scenario:read, variance:read, risk:read y permisos de aprobación gerencial | vista comparativa, ahorro, riesgo y críticos; sin controles de mutación | Puede comparar y revisar riesgo/ahorro; no puede modificar ni aplicar precios | IMPLEMENTADO Y FUNCIONAL en demo |
| Cliente | Sí, mockDB.roles | budget:read y proposal:read; no scenario:read | botón Escenarios puede ser visible, pero renderScenariosView() muestra acceso restringido | No puede ver escenarios internos, Price Intelligence, riesgo ni variancias internas | IMPLEMENTADO Y FUNCIONAL en demo |
| Oficial Legal | Sí, mockDB.roles | budget:read y legal:read; no scenario:read | botón Escenarios puede ser visible, pero renderScenariosView() muestra acceso restringido | No puede ver ni modificar escenarios; no hay legal workflow en esta fase | IMPLEMENTADO Y FUNCIONAL en demo para la restricción |

La selección de rol es simulada por switchRole(). No es autenticación. El usuario USR-001 mantiene su identidad demo y appState.session.currentRole determina el modo activo.

## Componentes principales

El runtime efectivo usa secciones DOM y renderers funcionales, no componentes React montados:

| Componente/Renderer | Archivo | Responsabilidad | Datos que consume | Elementos que actualiza |
|---|---|---|---|---|
| renderSidebar() | index.html | proyecto, contador y owner de workflow | project, budget, workflow | sidebarProjectName, sidebarBudgetCount, sidebarWorkflowStatus, sidebarWorkflowOwner |
| renderHeader() | index.html | proyecto, usuario, rol y workflow | project, client, session, settings, workflow | headerProjectName, headerClientName, headerUserRole, headerWorkflowStatus, headerWorkflowStage |
| renderApuCatalog() | index.html | búsqueda, filtros y catálogo | apus y filters | catalogResultCount, apuCatalogBody |
| renderBudgetItems() | index.html | items editables o solo lectura | budget.items y canEditBudget() | budgetItemsBody, budgetFooter |
| renderBudgetSummary() | index.html | métricas y desglose financiero | budget.totals y settings | summaryMetrics, summaryBreakdown |
| renderWorkflowView() | index.html | timeline, decisiones y comentarios | workflow, approvals, comments, role | workflow-view-container |
| renderScenariosView() | index.html | análisis Fase 3 completo | scenarios, priceReferences, totals, variance, risk, permissions | scenarios-view-container |
| renderRoleSwitcher() | index.html | selector demo de seis roles | mockDB.roles, session.currentRole | roleSwitcher |

renderScenariosView() no recibe props React. Lee appState, calcula la salida, escapa contenido textual con escapeHTML() y solo presenta Price Intelligence cuando hasPermission("price:read") devuelve true. Los botones usan data-action y son atendidos por el document listener compartido.

## Funciones y utilidades principales

### Estado y sincronización

| Función | Entradas | Lee | Modifica | Consumidores | Estado |
|---|---|---|---|---|---|
| hydrateStateFromMockDB() | ninguna | mockDB | appState.data | initializeApp() | IMPLEMENTADO Y FUNCIONAL |
| syncCurrentBudgetToMockDB() | ninguna | budget actual | mockDB.budgets | totals y mutaciones | IMPLEMENTADO Y FUNCIONAL |
| getCurrentBudget() | ninguna | currentBudgetId y data.budgets | nada | todos los engines | IMPLEMENTADO Y FUNCIONAL |
| generateId(prefix, reservedIds) | prefijo y IDs reservados | items, escenarios, ajustes, approvals, comments, audit | nada | creación de entidades | IMPLEMENTADO Y FUNCIONAL |

generateId() fue extendida para recibir reservedIds. La extensión es necesaria para que una operación que construye múltiples ajustes antes de insertarlos no repita IDs. Las operaciones optimizeScenario(), buildConservativeScenario() y duplicateScenario() reservan cada ID generado.

### Scenario Engine

| Función | Responsabilidad actual | Efectos y consumidores | Estado |
|---|---|---|---|
| ensureDefaultScenarios() | crea BASE, OPTIMIZED y CONSERVATIVE si falta alguno, define activeScenarioId y recalcula totals | inicialización y render Scenarios; sincroniza budget.scenarios | IMPLEMENTADO Y FUNCIONAL |
| getCurrentScenario() | devuelve activeScenarioId, o BASE, o primer escenario | render y engines | IMPLEMENTADO Y FUNCIONAL |
| getScenarioById() | selector por ID dentro del presupuesto actual | mutaciones, comparativas y risk | IMPLEMENTADO Y FUNCIONAL |
| createScenario() | crea solo CUSTOM con nombre saneado y permisos | botón Crear Custom, audit SCENARIO_CREATED | IMPLEMENTADO Y FUNCIONAL |
| duplicateScenario() | clona un escenario como CUSTOM, clona ajustes con IDs nuevos | botón Duplicar, audit SCENARIO_DUPLICATED | IMPLEMENTADO Y FUNCIONAL |
| deleteScenario() | elimina solo CUSTOM y vuelve a BASE si era activo | botón Eliminar, audit SCENARIO_DELETED | IMPLEMENTADO Y FUNCIONAL |
| renameScenario() | renombra un escenario distinto de BASE | botón Renombrar, audit SCENARIO_RENAMED | IMPLEMENTADO Y FUNCIONAL |
| setActiveScenario() | cambia activeScenarioId y limpia APU seleccionado | selector scenarioSelector | IMPLEMENTADO Y FUNCIONAL |
| applyScenarioAdjustment() | valida tipo, número, APU, permiso y etapa; reemplaza el ajuste del mismo item/tipo | botones y Price Intelligence; audit SCENARIO_ADJUSTMENT_APPLIED | IMPLEMENTADO Y FUNCIONAL |
| removeScenarioAdjustment() | elimina ajuste por ID, recalcula y audita | botón Quitar; audit SCENARIO_ADJUSTMENT_REMOVED | IMPLEMENTADO Y FUNCIONAL |
| getScenarioItems() | deriva cantidad, precio y subtotal desde budget.items más adjustments | totals, variance, risk y render | IMPLEMENTADO Y FUNCIONAL |
| calculateScenarioTotals() | calcula formulas financieras sobre items derivados y guarda scenario.totals/metrics | comparativas, tarjetas y promoción | IMPLEMENTADO Y FUNCIONAL |

Los selectors getScenarioById() y getCurrentScenario() no son una frontera de seguridad por sí solos; las mutaciones tienen sus guards y la UI de Scenarios valida scenario:read. Esto está documentado para no confundir selector de datos con autorización.

### Price Intelligence

| Función | Regla real | Estado |
|---|---|---|
| getPriceReferencesForApu() | filtra APU, USD, precio finito, reliability 0-1 y vigencia sobre referenceDate | IMPLEMENTADO Y FUNCIONAL |
| getBestPriceReference() | ordena reliability descendente, precio ascendente e ID; admite excluir CURRENT_BUDGET y minReliability | IMPLEMENTADO Y FUNCIONAL |
| getAverageReferencePrice() | promedio aritmético de referencias vigentes | IMPLEMENTADO Y FUNCIONAL |
| getMinReferencePrice() | mínimo de referencias vigentes | IMPLEMENTADO Y FUNCIONAL |
| getMaxReferencePrice() | máximo de referencias vigentes | IMPLEMENTADO Y FUNCIONAL |
| calculatePriceVariance() | precio actual menos promedio; porcentaje seguro si promedio es cero | IMPLEMENTADO Y FUNCIONAL |
| getPriceRecommendation() | entrega rango, promedio, variancia, mejor referencia externa y ahorro posible | IMPLEMENTADO Y FUNCIONAL |
| applyPriceReferenceToScenario() | exige price:apply, usa UNIT_PRICE, registra ajuste y PRICE_REFERENCE_APPLIED | IMPLEMENTADO Y FUNCIONAL |

optimizeScenario() excluye CURRENT_BUDGET, exige reliability >= settings.scenario.minReliability y solo acepta referencias más baratas que el precio actual. El desempate es precio menor, reliability mayor e ID.

### Variance, Savings, Risk y analítica

| Función | Responsabilidad actual | Estado |
|---|---|---|
| calculateItemVariance() | compara amount base y amount derivado, unitPriceDelta, quantityDelta y porcentaje | IMPLEMENTADO Y FUNCIONAL |
| calculateScenarioVariance() | compara grandTotal del escenario contra grandTotal base | IMPLEMENTADO Y FUNCIONAL |
| calculateSavings() | max(0, baseTotal - scenarioTotal) | IMPLEMENTADO Y FUNCIONAL |
| calculateSavingsPercent() | ahorro/baseTotal*100, cero si base es cero | IMPLEMENTADO Y FUNCIONAL |
| compareScenarioTotals() | produce una fila por escenario con total, variancia, savings y riesgo | IMPLEMENTADO Y FUNCIONAL |
| compareScenarios() | alias funcional de compareScenarioTotals() | IMPLEMENTADO Y FUNCIONAL |
| getRiskLevel() | LOW 0-29, MEDIUM 30-59, HIGH 60-79, CRITICAL 80-100 | IMPLEMENTADO Y FUNCIONAL |
| calculateApuRisk() | combina ausencia de refs, desviación, dispersión, reliability y participación | IMPLEMENTADO Y FUNCIONAL |
| calculateScenarioRisk() | pondera scores APU por costo directo y agrega premium de variancia positiva | IMPLEMENTADO Y FUNCIONAL |
| getCriticalApus() | ordena por 55% risk, 25% variancia absoluta y 20% participación; devuelve máximo 5 | IMPLEMENTADO Y FUNCIONAL |
| getTopCostDrivers() | ordena subtotales directos descendentes y devuelve máximo limit, default 5 | IMPLEMENTADO Y FUNCIONAL |
| getCostDistributionByCategory() | agrupa subtotal directo por categoría y calcula porcentaje | IMPLEMENTADO Y FUNCIONAL |

Risk Engine no usa aleatoriedad. Para un APU sin referencias aplica una penalización fija de 55; la reliability máxima disponible, desviación, dispersión y participación agregan penalizaciones acotadas. El resultado se limita a 0-100 y nunca devuelve NaN ni Infinity.

### Promoción al presupuesto

promoteScenarioToBudget() exige scenario:promote y BUDGETING. Si existe window.confirm(), solicita confirmación indicando que reemplazará cantidades y precios. Copia los items derivados a budget.items, llama calculateBudgetTotals(), sincroniza mockDB.budgets, escribe SCENARIO_PROMOTED_TO_BUDGET y no cambia workflow.currentStage ni workflow.status.

## Flujos funcionales end-to-end

### Carga inicial y defaults

1. Evento inicial: carga del documento.
2. initializeApp() llama hydrateStateFromMockDB().
3. appState.apuCatalog carga 20 APUs y actualiza mockDB.apus por su setter.
4. ensureDefaultScenarios() inserta exactamente BASE, OPTIMIZED y CONSERVATIVE en budget.scenarios.
5. calculateScenarioTotals() calcula totals iniciales; con presupuesto vacío todos quedan en cero.
6. renderApp() y renderScenariosView() escriben el DOM.
7. Resultado: selector de escenarios con tres opciones, sin duplicados y con estados vacíos explícitos.
8. Evidencia: VERIFICADO POR EJECUCIÓN.

### Crear, ajustar y comparar Custom

1. Evento inicial: click en Crear Custom.
2. handleAppClick() lee scenarioNameInput y llama createScenario().
3. createScenario() exige scenario:create, etapa de análisis, sesión y nombre saneado.
4. Se añade un registro CUSTOM, se cambia activeScenarioId, se recalculan totals y se sincroniza mockDB.budgets.
5. logAuditEvent() registra SCENARIO_CREATED.
6. renderScenariosView() muestra el escenario y sus controles.
7. Un ajuste QUANTITY o UNIT_PRICE pasa por applyScenarioAdjustment(); el mismo item y tipo reemplaza su ajuste anterior.
8. calculateScenarioTotals() deriva items sin modificar budget.items.
9. Resultado: comparación, tabla APU, variancia, ajuste listado y AuditLog actualizado.
10. Evidencia: VERIFICADO POR EJECUCIÓN.

### Price Intelligence y aplicación de referencia

1. Evento inicial: selección de un APU en scenarioApuSelect o en una fila de la tabla.
2. handleAppChange() o handleAppClick() actualiza selectedScenarioApuId y repinta.
3. renderScenariosView() llama getPriceRecommendation() y getPriceReferencesForApu().
4. Si el rol tiene price:read, muestra actual, promedio, mínimo, máximo, variancia y referencias vigentes.
5. Click en Aplicar llama applyPriceReferenceToScenario().
6. La función exige price:apply y scenario:adjust, crea UNIT_PRICE y registra SCENARIO_ADJUSTMENT_APPLIED y PRICE_REFERENCE_APPLIED.
7. Resultado: el precio efectivo cambia solo en el escenario seleccionado; el presupuesto base no cambia.
8. Evidencia: VERIFICADO POR EJECUCIÓN.

### Optimización y escenario conservador

1. Evento inicial: click en Optimizar precios o Construir conservador.
2. handleAppClick() llama optimizeScenario() o buildConservativeScenario().
3. Ambos exigen permisos y una etapa de análisis permitida.
4. optimizeScenario() selecciona referencias externas con reliability mínima 0.70 y precio menor al actual.
5. buildConservativeScenario() aplica max(precio actual, máximo de referencias) * 1.05.
6. Se reemplaza el conjunto de ajustes, se recalcula y se sincroniza.
7. Se registran SCENARIO_OPTIMIZED o SCENARIO_CONSERVATIVE_BUILT.
8. Resultado: la comparativa muestra ahorro o sobrecosto y el riesgo se recalcula.
9. Evidencia: VERIFICADO POR EJECUCIÓN.

### Promoción explícita

1. Evento inicial: click en Promover al presupuesto.
2. handleAppClick() llama promoteScenarioToBudget().
3. La función exige scenario:promote y etapa BUDGETING.
4. En navegador se muestra window.confirm(); una cancelación no muta datos.
5. Con confirmación, copia cantidad, precio y subtotal efectivos a budget.items.
6. calculateBudgetTotals() recalcula todos los parámetros financieros.
7. mockDB.budgets recibe el clon actualizado y AuditLog recibe SCENARIO_PROMOTED_TO_BUDGET.
8. Workflow conserva su etapa; no se aprueba ni se envía nada automáticamente.
9. Evidencia: VERIFICADO POR EJECUCIÓN con confirmed=true en smoke de engine; confirmación visual de navegador no fue automatizada.

### Bloqueo por rol y etapa

1. Evento inicial: cambio de roleSwitcher o workflow.
2. switchRole() modifica session.currentRole y repinta.
3. renderScenariosView() bloquea roles sin scenario:read.
4. canModifyScenario() combina etapa y permiso para ocultar controles y bloquear engines.
5. promoteScenarioToBudget() agrega la regla adicional de BUDGETING.
6. Resultado: Revisor y Gerente pueden analizar según su matriz; Cliente y Legal no ven datos internos; roles sin permiso no pueden mutar mediante llamada directa.
7. Evidencia: VERIFICADO POR EJECUCIÓN para Revisor y Presupuestista.

### Workflow heredado sin regresión

1. Presupuestista agrega items y envía a revisión.
2. Revisor Técnico aprueba.
3. Director Financiero aprueba.
4. Gerente General aprueba.
5. changeWorkflowStage() actualiza etapa/status, approvals y AuditLog.
6. El resultado final es READY_FOR_CLIENT y APPROVED.
7. Los escenarios se pueden recalcular para análisis durante BUDGETING, TECHNICAL_REVIEW, FINANCIAL_REVIEW y MANAGEMENT_REVIEW, pero no alteran estas transiciones.
8. Evidencia: VERIFICADO POR EJECUCIÓN.

## Estado y gestión de datos

| Estado | Función que lo modifica | Renderer | DOM |
|---|---|---|---|
| appState.ui.activeScenarioId | setActiveScenario(), ensureDefaultScenarios(), create/duplicate/delete | renderScenariosView() | scenarioSelector, escenarios seleccionados |
| appState.ui.selectedScenarioApuId | handleAppClick(), handleAppChange() | renderScenariosView() | scenarioApuSelect, panel Price Intelligence |
| budget.scenarios | ensureDefaultScenarios(), create/duplicate/delete/rename, adjustment engines | renderScenariosView() | comparación, ajustes y métricas |
| scenario.adjustments | applyScenarioAdjustment(), removeScenarioAdjustment(), optimizeScenario(), buildConservativeScenario() | renderScenariosView() | tabla de ajustes y botones |
| scenario.totals | calculateScenarioTotals() | renderScenariosView() | tarjetas, comparación y APU table |
| scenario.metrics | calculateScenarioTotals(), calculateScenarioRisk() | renderScenariosView() | ahorro, variancia y riesgo |
| appState.data.priceReferences | hydrateStateFromMockDB() | renderScenariosView() solo con price:read | referencias y recomendación |
| appState.budget.items | engines Fase 1 o promoteScenarioToBudget() | renderBudgetItems(), renderBudgetSummary() | presupuesto base |
| appState.budget.totals | calculateBudgetTotals() | renderBudgetItems(), renderBudgetSummary(), escenarios | summaryMetrics, summaryBreakdown |
| appState.data.auditLog | logAuditEvent() | sin renderer visual | memoria y mockDB |

Los escenarios no son una segunda lista de budget.items. getScenarioItems() parte de budget.items y aplica ajustes. Esta decisión evita la duplicación de estado y permite que un cambio válido del presupuesto base se refleje en los escenarios cuando calculateScenarioTotals() se ejecuta.

## Workflow y aprobaciones

Fase 3 no agrega estados ni transiciones de workflow. Se conservan:

- WORKFLOW_STATUS: DRAFT, IN_REVIEW, APPROVED, REJECTED.
- WORKFLOW_STAGE: BUDGETING, TECHNICAL_REVIEW, FINANCIAL_REVIEW, MANAGEMENT_REVIEW, READY_FOR_CLIENT.
- workflowTransitions como mapa central.
- submitForTechnicalReview(), approve/rejectTechnicalReview(), approve/rejectFinancialReview() y approve/rejectManagementReview().
- createApprovalRecord() y addWorkflowComment().

Los escenarios pueden analizarse en las cuatro etapas previas a READY_FOR_CLIENT porque canModifyScenario() usa SCENARIO_ANALYSIS_STAGES. Solo las acciones con permisos adecuados pueden modificar. En READY_FOR_CLIENT no hay mutación de escenario; la vista se mantiene de lectura.

Ninguna función de escenario llama changeWorkflowStage(), crea Approval Record ni convierte una promoción en aprobación. promoteScenarioToBudget() solo recalcula el presupuesto y registra su propio evento.

## Auditoría

logAuditEvent() conserva el contrato de Fases 1 y 2: id, timestamp, userId, role, action, entity, entityId y description. Cada evento se añade a appState.data.auditLog y a mockDB.auditLog como clone.

Eventos heredados preservados:

- BUDGET_ITEM_ADDED.
- BUDGET_ITEM_REMOVED.
- BUDGET_ITEM_QUANTITY_CHANGED.
- ECONOMIC_SETTING_CHANGED.
- ROLE_SWITCHED.
- WORKFLOW_SUBMITTED_TECHNICAL.
- TECHNICAL_REVIEW_APPROVED y TECHNICAL_REVIEW_REJECTED.
- FINANCIAL_REVIEW_APPROVED y FINANCIAL_REVIEW_REJECTED.
- MANAGEMENT_REVIEW_APPROVED y MANAGEMENT_REVIEW_REJECTED.
- WORKFLOW_COMMENT_ADDED.
- WORKFLOW_STAGE_CHANGED.

Eventos Fase 3:

| Acción | Productor | Entity | Efecto |
|---|---|---|---|
| SCENARIO_CREATED | createScenario() | scenario | registra nuevo CUSTOM |
| SCENARIO_DUPLICATED | duplicateScenario() | scenario | registra copia |
| SCENARIO_DELETED | deleteScenario() | scenario | registra eliminación |
| SCENARIO_RENAMED | renameScenario() | scenario | registra cambio de nombre |
| SCENARIO_ADJUSTMENT_APPLIED | applyScenarioAdjustment() | scenario-adjustment | registra UNIT_PRICE o QUANTITY |
| SCENARIO_ADJUSTMENT_REMOVED | removeScenarioAdjustment() | scenario-adjustment | registra eliminación de ajuste |
| PRICE_REFERENCE_APPLIED | applyPriceReferenceToScenario() | price-reference | registra fuente aplicada |
| SCENARIO_OPTIMIZED | optimizeScenario() | scenario | registra recalculo optimizado |
| SCENARIO_CONSERVATIVE_BUILT | buildConservativeScenario() | scenario | registra recalculo conservador |
| SCENARIO_PROMOTED_TO_BUDGET | promoteScenarioToBudget() | scenario | registra copia explícita al base |

No existe Audit Trail visual, filtrado, exportación ni dashboard de auditoría. Esto es una limitación documentada, no una afirmación de funcionalidad Fase 5.

## Dependencias internas

- index.html usa DOM API, Intl.NumberFormat y clases CSS/Tailwind ya existentes.
- El build usa Vite 6.4.4 y no recibe dependencias nuevas.
- Fase 3 no usa librerías de gráficos.
- No hay API ni backend.
- La etiqueta existente de Tailwind CDN sigue siendo una dependencia visual preexistente; los engines de negocio no realizan llamadas externas ni leen datos remotos.
- mockDB y appState son memoria de sesión.
- src/main.jsx y el árbol React no consumen el runtime inline ni sus escenarios.

## Verificación contra código

### Archivos revisados

- AGENTS.md completo.
- md/AGENTS.md completo.
- src/AGENTS.md completo.
- tests/AGENTS.md completo.
- md/fase-1-1.md completo.
- md/fase-1-2.md completo.
- md/fase-2-1.md completo.
- index.html completo, incluyendo markup, configuración, mockDB, appState, aliases, RBAC, engines, renderers, handlers e inicialización.
- package.json, vite.config.js, README.md y árbol de src/.

### Elementos encontrados y conexiones

- mockDB.priceReferences se declara con 30 registros y hydrateStateFromMockDB() lo copia a appState.data.priceReferences.
- appState.ui.activeScenarioId y selectedScenarioApuId existen en la literal de estado.
- appState.settings.scenario existe con 0.70 y 5.
- budget.scenarios se conserva en mockDB y es consumido por Scenario Engine.
- APP_CONFIG.supportedViews incluye scenarios; futureViews conserva client-portal, documents, legal, audit y dashboard.
- viewRegistry incluye scenarios y navigateTo() usa scenarios-section.
- renderScenariosView() está conectado desde renderApp(), refreshWorkflowDependentViews() y viewRegistry.
- handleAppClick() conecta todos los botones Fase 3.
- handleAppChange() conecta scenarioSelector y scenarioApuSelect.
- bindStaticEvents() conserva event delegation en document para click, input y change.
- calculateBudgetTotals() delega la fórmula común a calculateTotalsFromItems().
- syncCurrentBudgetToMockDB() conserva la sincronización base y también persiste el array scenarios clonado.
- rolePermissions y hasPermission() se consumen en renderScenariosView(), canModifyScenario(), applyScenarioAdjustment(), applyPriceReferenceToScenario() y promoteScenarioToBudget().

### Inconsistencias encontradas y corregidas

1. La documentación de Fase 2 indicaba que budget.scenarios seguía vacío porque Fase 3 aún no había comenzado. El código actual ahora implementa ese contrato y este snapshot lo actualiza.
2. El primer diseño de Fase 3 podía repetir un ID ADJ cuando optimizeScenario(), buildConservativeScenario() o duplicateScenario() construían varios ajustes antes de insertarlos. Se corrigió generateId(prefix, reservedIds) y se reservan IDs por operación. La corrección fue verificada con tres ajustes optimizados, tres conservadores y sus tres duplicados con IDs únicos.
3. getPriceReferencesForApu() inicialmente solo filtraba APU, USD y precio. Se añadió validación de reliability, fechas finitas y vigencia sobre APP_CONFIG.referenceDate.
4. La arquitectura React/Vite de AGENTS.md y el runtime inline siguen coexistiendo. Se confirmó que src no está importado por index.html; no se realizó una migración porque la petición ordena extender el código real sin reescribir la arquitectura.
5. El selector de escenarios de la vista es dinámico y no existe en el markup inicial. Los handlers solo lo consultan después de renderScenariosView(); la comprobación estática separó IDs dinámicos de IDs estáticos y no encontró referencias estáticas inexistentes.

## Verificación funcional

### VERIFICADO POR EJECUCIÓN

- Extracción del script inline real y node --check: sin errores de sintaxis.
- npm run build: correcto con Vite 6.4.4; dist/index.html generado con 148.77 kB en la última ejecución.
- Smoke runtime Fases 1-3 ejecutado con un DOM fake determinista:
  - 20 APUs.
  - 30 referencias.
  - tres escenarios default y un CUSTOM.
  - alta repetida de APU sin duplicar fila.
  - cantidad decimal 2.5.
  - cálculo financiero positivo.
  - optimización y escenario conservador.
  - riesgo, críticos, drivers y distribución.
  - create, duplicate, rename, delete y ajustes de escenario.
  - aplicación de PR-002.
  - promoción explícita.
  - Revisor bloqueado para modificar.
  - submit técnico, aprobación técnica, financiera y gerencial.
  - resultado READY_FOR_CLIENT y APPROVED.
  - cálculo con NaN/undefined normalizado a valores finitos.
  - diez acciones de auditoría Fase 3 presentes.
- Resultado del smoke integral anterior a la corrección de IDs: {"apus":20,"refs":30,"scenarios":4,"stage":"READY_FOR_CLIENT","status":"APPROVED","audit":28}.
- Smoke posterior a la corrección de IDs: {"optimizedAdjustments":3,"conservativeAdjustments":3,"duplicateAdjustments":3,"auditEvents":6}; verificó unicidad de IDs en cada conjunto.
- Smoke integral final posterior a la corrección de IDs: {"apus":20,"references":30,"scenarios":4,"stage":"READY_FOR_CLIENT","status":"APPROVED","auditEvents":28}.
- npm run build posterior a la corrección de IDs: correcto.
- npx esbuild src/main.jsx --bundle --format=esm: correcto; src no fue modificado.

### VERIFICADO POR INSPECCIÓN

- Las 30 referencias son constantes locales, no una llamada de red.
- Los tipos de referencia incluyen CURRENT_BUDGET, HISTORICAL, MARKET_REFERENCE y SUPPLIER_OFFER.
- Todas las operaciones financieras pasan por calculateTotalsFromItems() o calculateBudgetTotals(); los renderers no contienen la fórmula principal.
- Los cálculos manejan arrays vacíos, precios/cantidades inválidos, base total cero y referencias ausentes.
- Los roles Cliente y Oficial Legal no tienen scenario:read ni price:read.
- Revisor Técnico y Gerente General tienen lectura de escenario, variancia y riesgo, pero no permisos mutables.
- Director Financiero tiene lectura, creación, ajuste, aplicación de referencias y promoción; no tiene optimize/conservative/delete.
- Las mutaciones de escenario no llaman changeWorkflowStage().
- La promoción solo permite BUDGETING.
- escapeHTML() se aplica a nombres, IDs, categorías, fuentes, motivos y texto visible interpolado.
- Los IDs estáticos referenciados por getElementById() existen; los dinámicos workflowDecisionReason, workflowCommentInput, scenarioSelector, scenarioNameInput y scenarioApuSelect se generan antes de su uso.
- git diff --check no reportó errores de whitespace; solo informó la conversión de LF a CRLF del archivo existente en Windows.

### NO VERIFICADO

- No se automatizó una inspección visual en un navegador real. Responsive, scroll visual, confirm nativo y errores de consola del navegador quedan sin verificar por ejecución visual.
- No existe suite persistente en tests; los smoke scripts fueron temporales, se ejecutaron y luego se eliminaron.
- No se verificaron recarga, persistencia entre sesiones, dos usuarios concurrentes, backend, autenticación, API ni autorización de servidor.
- No se verificó que la aplicación React de src sea el runtime de producción; la inspección de index.html demuestra lo contrario.

## Limitaciones actuales

1. El Scenario Engine es de memoria. Una recarga pierde items, escenarios, ajustes y auditoría.
2. Price Intelligence usa 30 referencias demo fijas. No ingiere histórico real, mercado real ni ofertas reales.
3. APU-011 a APU-020 no tienen referencias y aparecen con riesgo alto/crítico por la penalización de ausencia.
4. Los escenarios OPTIMIZED y CONSERVATIVE se crean con ajustes vacíos; se materializan cuando el usuario ejecuta Optimizar precios o Construir conservador. Esto es intencional para evitar mutaciones/auditoría durante la carga inicial.
5. settings.scenario se consume por código, pero no tiene controles UI para cambiar reliability mínima o buffer.
6. La selección de escenario y APU se refleja en la vista, no en URL ni en almacenamiento persistente.
7. La promoción modifica el presupuesto base solo después de una acción explícita, pero no crea una nueva revisión/version de budget.
8. AuditLog se escribe y replica, pero no existe Audit Trail visual, filtros, exportación ni dashboard.
9. RBAC y switchRole() son controles de demo en JavaScript. Un cliente real debe validar permisos en backend.
10. No hay documentación real, portal cliente, propuesta enviada, firma, contrato, adjudicación ni legal workflow.
11. No se implementó un dashboard ejecutivo final ni visualización histórica de escenarios.
12. index.html y src/ siguen siendo dos superficies de aplicación distintas; Fase 3 no las fusionó.

## Cambios de esta iteración

1. Se añadió scenarios a APP_CONFIG.supportedViews y se conservó la lista de futureViews de Fase 4/5.
2. Se añadió la navegación Scenarios, scenarios-section y scenarios-view-container.
3. Se añadió SCENARIO_TYPE, SCENARIO_TYPES, labels, APP_CONFIG.referenceDate y PRICE_REFERENCE_DATA.
4. Se añadió mockDB.priceReferences y appState.data.priceReferences.
5. Se añadió appState.ui.activeScenarioId y selectedScenarioApuId.
6. Se añadió settings.scenario con minReliability 0.70 y conservativeBufferPercent 5.
7. Se extendió rolePermissions con permisos de scenario, price, variance y risk para los seis roles.
8. Se implementó ensureDefaultScenarios() con creación idempotente de BASE, OPTIMIZED y CONSERVATIVE.
9. Se implementaron selectors, CRUD de escenarios, ajustes y sincronización en budget.scenarios.
10. Se implementó calculateTotalsFromItems() y calculateScenarioTotals() para reutilizar fórmulas financieras sin mutar el presupuesto base.
11. Se implementaron referencias, recomendaciones, aplicación de precio, optimización y escenario conservador.
12. Se implementaron variancias, savings, comparación, score de riesgo, niveles, críticos, drivers y distribución.
13. Se implementó promoteScenarioToBudget() con guard de etapa, permiso y confirmación.
14. Se implementó renderScenariosView() con selector, comparación, tabla APU, Price Intelligence, ajustes, distribución, drivers y críticos.
15. Se conectaron los controles mediante handleAppClick(), handleAppChange() y event delegation.
16. Se añadieron diez acciones de AuditLog de Fase 3 sin eliminar eventos de Fases 1 y 2.
17. Se extendió generateId() con reservedIds para eliminar colisiones de ajustes en operaciones por lote.
18. Se añadió validación de vigencia, moneda, reliability y números finitos de Price Intelligence.
19. No se modificó src/, no se añadieron dependencias npm y no se inició Fase 4 o Fase 5.
20. Se creó este archivo nuevo md/fase-3-1.md sin sobrescribir snapshots anteriores.

## Impacto técnico de esta iteración

- Archivo modificado: index.html.
- Archivo creado: md/fase-3-1.md.
- Archivos de src/: sin cambios.
- Contratos preservados: mockDB, appState, aliases de Fase 1, rolePermissions, viewRegistry, calculateBudgetTotals(), formatCurrency(), event delegation, IDs DOM heredados, workflow, approvals, comments y AuditLog.
- Contratos extendidos: APP_CONFIG.supportedViews, mockDB, appState.ui, appState.data, settings, rolePermissions, generateId() y viewRegistry.
- Contratos nuevos: Scenario schema, Adjustment schema, Price Reference schema, Scenario Engine, Price Intelligence, Variance Engine, Risk Engine y vista Scenarios.
- Dependencias nuevas: ninguna.
- Riesgo controlado: el cálculo derivado evita duplicar budget.items; reservedIds evita colisiones de ajuste; el guard de promoción evita cambios base durante revisión.
- Riesgo pendiente: el runtime inline y src/React continúan separados; la autorización es únicamente demo en cliente.

## Compatibilidad

Se conservaron:

- mockDB, appState, rolePermissions y viewRegistry.
- appState.session, appState.ui, appState.filters, appState.data, currentProjectId, currentBudgetId, settings y workflow.
- aliases currentUser, activeView, apuCatalog, budget, auditLog, documents, comments, roles, filters.search, filters.category y filters.unit.
- funciones Fase 1 y Fase 2, incluidos addApuToBudget(), removeBudgetItem(), updateBudgetItemQuantity(), updateEconomicSetting(), calculateBudgetTotals(), formatCurrency(), hasPermission(), navigateTo(), changeWorkflowStage(), createApprovalRecord() y addWorkflowComment().
- IDs catalog-section, budget-section, summary-section, workflow-section, apuCatalogBody, budgetItemsBody, summaryMetrics, summaryBreakdown, settings y workflow heredados.
- event delegation en document.

La única modificación interna del Financial Engine es extraer la fórmula común a calculateTotalsFromItems(); calculateBudgetTotals() conserva su nombre, salida, sincronización y contrato. La ampliación de generateId() es compatible porque el segundo parámetro es opcional.

## Preparación para siguientes fases

### Preparación para Fase 4

- READY_FOR_CLIENT sigue siendo salida del workflow de Fase 2 y no significa aprobación del Cliente.
- Cliente sigue sin scenario:read y sin aprobación.
- documents[] continúa vacío y sin CRUD.
- appState.budget.scenarios y auditLog pueden ser consumidos por una futura propuesta, pero no existe propuesta real.
- Fase 4 deberá añadir permisos y engines separados para proposal/client approval, documentos, contratos, firma y legal, sin reutilizar scenario:promote como aprobación.

### Preparación para Fase 5

- appState.data.auditLog y mockDB.auditLog contienen eventos de Fases 1, 2 y 3.
- scenario.metrics contiene variancia, savings y riesgo calculados para un posible dashboard, pero no es un dashboard.
- compareScenarios(), getTopCostDrivers(), getCostDistributionByCategory() y getCriticalApus() entregan datos para indicadores futuros.
- Fase 5 deberá añadir renderer visual de Audit Trail, filtros, exportación, KPIs y dashboard ejecutivo sin eliminar eventos históricos.

## Próxima fase

La siguiente fase planificada es Fase 4. Debe implementar específicamente:

1. propuesta visible para Cliente cuando corresponda al workflow;
2. permisos separados para lectura y decisión de Cliente;
3. documentos reales y sus estados;
4. contratos, firma y legal workflow;
5. auditoría de cada documento, aprobación y firma;
6. persistencia o API si el alcance lo autoriza.

No debe convertir READY_FOR_CLIENT en aprobación automática del Cliente, no debe sobrescribir el presupuesto base sin acción explícita y no debe eliminar Scenario Engine, Price Intelligence, Variance Engine, Risk Engine ni eventos existentes.

## Arquitectura Producción / Homelab

El runtime actual sigue siendo una demo en memoria:

- mockDB -> PostgreSQL autohospedado.
- documents[] -> MinIO.
- identidad y permisos -> Keycloak.
- firma -> DocuSeal.
- automatizaciones -> n8n.
- agenda -> Cal.com.

Ninguno de esos servicios está conectado. PRICE_REFERENCE_DATA no representa un feed de mercado real. rolePermissions y switchRole() no sustituyen autenticación ni autorización server-side.

## Contrato para la siguiente iteración

La siguiente iteración debe:

- conservar mockDB.budgets[].scenarios, appState.ui.activeScenarioId y appState.data.priceReferences;
- conservar los cuatro tipos de escenario y los esquemas de Scenario, Adjustment y Price Reference;
- conservar la regla de que los escenarios derivan de budget.items y solo promoteScenarioToBudget() puede copiar valores al base;
- conservar los diez eventos de auditoría Fase 3 y todos los eventos de Fases 1 y 2;
- conservar rolePermissions y evaluar permisos en engines, no solo en botones;
- conservar workflowTransitions y no iniciar aprobación cliente, documentos o legal por inferencia;
- conservar formatCurrency(), escapeHTML(), event delegation, IDs DOM heredados y viewRegistry;
- distinguir en la documentación IMPLEMENTADO Y FUNCIONAL, IMPLEMENTADO PARCIALMENTE, PLACEHOLDER ESTRUCTURAL y NO IMPLEMENTADO;
- separar VERIFICADO POR EJECUCIÓN, VERIFICADO POR INSPECCIÓN y NO VERIFICADO;
- no introducir llamadas externas para Price Intelligence sin una decisión explícita de arquitectura y seguridad.

Conclusión: Fase 1, Fase 2 y Fase 3 quedan auditadas sobre el código real del runtime inline. El presupuesto base, workflow y auditoría heredados siguen operativos; escenarios, referencias locales, variancias, ahorros, riesgos, cost drivers y promoción explícita están implementados y verificados en memoria. Fase 4 no fue iniciada.
