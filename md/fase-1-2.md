# Fase 1 — Iteración 2

## Identificación

- Fase: 1
- Iteración: 2
- Archivo nuevo: md/fase-1-2.md
- Snapshot anterior: md/fase-1-1.md
- Fecha de auditoría: 2026-10-16
- Alcance: auditoría completa de Fase 1, correcciones mínimas de defectos comprobables y nueva documentación versionada.
- Estado de Fase 2: no iniciada.
- Archivo que ejecuta el flujo auditado: index.html.

El archivo md/fase-1-1.md no fue sobrescrito. Este snapshot describe el estado real después de la auditoría y distingue código ejecutado de estructuras que solo existen como datos o puntos de extensión.

## Resumen ejecutivo técnico

El runtime que Vite entrega actualmente es el HTML index.html con CSS inline, Tailwind por CDN y un script JavaScript inline. Ese script contiene el flujo de Fase 1 para catálogo de APUs, presupuesto, parámetros económicos, resumen y auditoría de mutaciones.

El resultado de la auditoría es:

- IMPLEMENTADO Y FUNCIONAL: hidratación de mockDB hacia appState, catálogo determinista de 20 APUs, búsqueda, filtros combinados, alta de APU, incremento sin duplicación, cantidades decimales, eliminación, cálculo financiero, parámetros económicos, formatCurrency, aliases de compatibilidad, selectors, event delegation, AuditLog de las acciones de presupuesto, navegación entre las tres vistas soportadas y render de los contratos DOM existentes.
- IMPLEMENTADO PARCIALMENTE: RBAC, porque existe una regla real y aplicada para Presupuestista, pero no hay reglas ni UI de actuación para los otros cinco roles; navegación, porque las tres vistas soportadas cambian el estado y hacen scroll, pero no existe un sistema de rutas URL ni aislamiento de páginas; paridad React/Vite, porque src contiene otra aplicación React y el index.html actual no la monta.
- PLACEHOLDER ESTRUCTURAL: documents, comments, approvals, scenarios por presupuesto, appState.workflow, roles no conectados a permisos, APP_CONFIG.futureViews y los getters de estado de workflow.
- NO IMPLEMENTADO: transiciones de workflow, revisión técnica, revisión financiera, aprobación gerencial, aprobación del Cliente, portal cliente, documentos reales, firmas, sistema legal, escenarios completos, historial visual de auditoría, backend, persistencia y autenticación.

No se implementó ninguna funcionalidad perteneciente a Fases 2–5.

## Estado general de implementación

| Área | Estado | Qué existe hoy | Qué no existe hoy | Fase |
|---|---|---|---|---|
| Fuente demo y modelos base | IMPLEMENTADO Y FUNCIONAL | mockDB, entidades demo, presupuesto BUD-001 y clones en appState.data | Persistencia externa | 1 |
| Estado de sesión y UI | IMPLEMENTADO Y FUNCIONAL | appState.session, appState.ui, filtros, IDs actuales y settings | Login, selección de usuario y persistencia | 1 |
| Catálogo APU | IMPLEMENTADO Y FUNCIONAL | Dataset hardcodeado de 20 APUs y render de tabla | CRUD de catálogo | 1 |
| Presupuesto | IMPLEMENTADO Y FUNCIONAL | Items, alta, incremento, edición, eliminación, totales y sincronización mockDB | Versionado real, concurrencia y backend | 1 |
| Navegación SPA | IMPLEMENTADO PARCIALMENTE | viewRegistry, activeView, renderCurrentView y scroll a tres secciones | Rutas URL, guards, vistas futuras y montaje React | 1 |
| RBAC | IMPLEMENTADO PARCIALMENTE | rolePermissions para Presupuestista y hasPermission aplicado a acciones mutables | Reglas y controles para cinco roles | 1 / 2 |
| AuditLog | IMPLEMENTADO Y FUNCIONAL | logAuditEvent para alta, eliminación, cantidad y settings | Consulta, filtros y renderer visual del log | 1 / 2 |
| Workflow y aprobaciones | PLACEHOLDER ESTRUCTURAL | workflow.status, workflow.currentStage, workflow.approvals y approvals[] | Transiciones, permisos, UI, estados persistidos y aprobación | 2 |
| Documentos y comentarios | PLACEHOLDER ESTRUCTURAL | documents[] y comments[] en ambas estructuras de datos | Crear, editar, adjuntar, comentar y renderizar | 2–4 |
| Legal | NO IMPLEMENTADO | Comentario de extensión en el script | Reglas, contratos, firma y validación legal | 4–5 |

## Cómo funciona actualmente

1. El navegador carga index.html. No existe un script module que monte src/main.jsx y tampoco existe un elemento root en este HTML.
2. El último script inline ejecuta initializeApp.
3. initializeApp llama hydrateStateFromMockDB, asigna el dataset de 20 APUs mediante el alias appState.apuCatalog, llama renderApp y conecta bindStaticEvents.
4. hydrateStateFromMockDB clona las colecciones de mockDB a appState.data. El alias apuCatalog actualiza appState.data.apus y mockDB.apus con el mismo dataset.
5. renderApp pinta sidebar, header, vista activa, items del presupuesto, resumen, settings, indicadores y contadores. calculateBudgetTotals se ejecuta antes de los renderers dependientes de totals.
6. Los eventos click, input y change se reciben en document por event delegation. handleAppClick localiza data-view, add-apu o remove-item mediante closest. handleAppInput procesa búsqueda, cantidad y settings. handleAppChange normaliza filtros, cantidad o setting y crea el AuditLog correspondiente.
7. Las mutaciones de presupuesto pasan por addApuToBudget, removeBudgetItem, updateBudgetItemQuantity o updateEconomicSetting. Cada mutación valida permiso, cambia appState, recalcula y renderiza.
8. calculateBudgetTotals guarda totals en el presupuesto activo y llama syncCurrentBudgetToMockDB. El presupuesto en mockDB queda como clon del presupuesto activo.
9. formatCurrency convierte valores no finitos a cero y presenta el resultado con Intl.NumberFormat usando APP_CONFIG.locale y appState.settings.currency.

El flujo real es:

mockDB -> hydrateStateFromMockDB -> appState.data -> selectors y engines -> renderers -> DOM

DOM event -> handler central -> permiso -> mutación de appState -> AuditLog cuando aplica -> calculateBudgetTotals -> sincronización mockDB -> render parcial

## Arquitectura global

### Runtime efectivo

El runtime efectivo de Fase 1 es una aplicación HTML/JavaScript inline. Las secciones del script se encuentran en index.html y son:

1. CONFIG
2. MOCK DATABASE
3. APP STATE
4. RBAC ENGINE
5. CORE / HELPERS
6. APU ENGINE
7. BUDGET ENGINE
8. FINANCIAL ENGINE
9. WORKFLOW ENGINE
10. DOCUMENT ENGINE
11. LEGAL ENGINE
12. AUDIT ENGINE
13. ROUTER / NAVIGATION
14. RENDERERS
15. EVENT HANDLERS
16. INITIALIZATION

### Inconsistencia arquitectónica confirmada

El repositorio también contiene src/main.jsx, src/App.jsx, componentes React, src/data y src/utils, además de vite.config.js y dependencias React. Sin embargo, el index.html actual no contiene root ni script module; por ello esos módulos no son consumidores del flujo auditado. npm run build pasa porque Vite entrega el HTML inline, pero la compilación transformó únicamente dos módulos y no montó App.

Esta iteración no migra ni reconstruye la aplicación en React: hacerlo sería un cambio arquitectónico separado. La discrepancia queda registrada como limitación y riesgo de integración para la siguiente decisión de arquitectura.

## Estructura física del proyecto

La estructura relevante encontrada es:

Expo-Clean/

- index.html: runtime efectivo de la Fase 1 auditada.
- src/main.jsx: entrada React existente, no referenciada por index.html.
- src/App.jsx: aplicación React existente, no referenciada por index.html.
- src/components/: componentes de la aplicación React existente.
- src/data/parametricData.js: dataset de la aplicación React existente.
- src/utils/calculator.js: calculadora de la aplicación React existente.
- src/index.css: estilos de la aplicación React existente.
- vite.config.js: configuración Vite con plugin React.
- package.json y package-lock.json: dependencias React/Vite.
- md/AGENTS.md: reglas específicas para snapshots.
- md/fase-1-1.md: documentación anterior, conservada.
- md/fase-1-2.md: este snapshot.
- AGENTS.md: reglas de arquitectura y trazabilidad.
- src/AGENTS.md: reglas de modificación del árbol src; se revisó y no se modificó src.
- tests/AGENTS.md: reglas de QA; no hay archivos de prueba ejecutables en tests.

dist/ se genera por build y node_modules/ contiene dependencias instaladas. Ninguno de esos directorios es fuente de negocio.

## Datos y modelos actuales

### mockDB

mockDB está declarado en index.html y contiene users, roles, clients, projects, apus, budgets, documents, comments, approvals y auditLog.

- users contiene USR-001, María Andrade, rol Presupuestista.
- roles contiene exactamente Presupuestista, Revisor Técnico, Director Financiero, Gerente General, Cliente y Oficial Legal.
- clients contiene CLI-001.
- projects contiene PRJ-001 referenciando CLI-001.
- budgets contiene BUD-001 referenciando PRJ-001, con items vacío al inicio, totals en cero, scenarios vacío y metadata.currency USD.
- apus comienza vacío en la literal mockDB y se llena durante initializeApp mediante el setter appState.apuCatalog.
- documents, comments, approvals y auditLog comienzan vacíos.

La inicialización de apus después de la hidratación no deja dos catálogos divergentes: el setter apuCatalog escribe appState.data.apus y mockDB.apus con clones del mismo valor.

### appState

appState es el objeto de estado canónico para el flujo activo y contiene:

- session.currentUserId = USR-001 y session.currentRole = Presupuestista.
- ui.activeView = apu-catalog, sidebarCollapsed, activeModal y toast.
- filters.apuSearch, apuCategory y apuUnit.
- data con las diez colecciones clonadas desde mockDB.
- currentProjectId = PRJ-001 y currentBudgetId = BUD-001.
- settings: currency, overheadPercent, contingencyPercent, profitPercent y taxPercent.
- workflow: status DRAFT, currentStage BUDGETING y approvals vacío.

Los aliases definidos con Object.defineProperties no mantienen una segunda copia de datos:

- currentUser llama getCurrentUser.
- activeView lee y escribe ui.activeView.
- apuCatalog lee data.apus; su setter actualiza también mockDB.apus.
- budget llama getCurrentBudget.
- auditLog, documents, comments y roles leen data.
- filters.search, filters.category y filters.unit leen o normalizan apuSearch, apuCategory y apuUnit.

### Catálogo de APUs

initializeApp declara 20 entradas APU-001 a APU-020. La inspección y la ejecución verificaron:

- 20 IDs únicos.
- 20 códigos únicos.
- Dos APUs por cada una de diez categorías.
- Unidades presentes: m, m2, m3, kg, u, punto y global.
- currency = USD en las 20 entradas.
- Cada APU contiene id, code, name, category, description, unit, unitPrice, currency, components y metadata.
- components es un objeto numérico con labor, materials, equipment, transport y other.
- La suma de esos cinco componentes coincide con unitPrice para las 20 entradas.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| mockDB | IMPLEMENTADO Y FUNCIONAL | const mockDB, hydrateStateFromMockDB y syncCurrentBudgetToMockDB | No editable como base externa; sus efectos se reflejan en tabla y resumen | Las acciones mutables sincronizan el presupuesto | VERIFICADO POR EJECUCIÓN: smoke runtime | 1 |
| appState | IMPLEMENTADO Y FUNCIONAL | const appState, aliases y selectors | La UI lee activeView, filtros, settings, items y totals | Los handlers mutan el estado canónico | VERIFICADO POR EJECUCIÓN e inspección | 1 |
| Catálogo de 20 APUs | IMPLEMENTADO Y FUNCIONAL | Dataset dentro de initializeApp | apuCatalogBody, contador y filtros | Render inicial y filtros actualizan tabla | VERIFICADO POR EJECUCIÓN | 1 |
| Búsqueda | IMPLEMENTADO Y FUNCIONAL | filterApus, renderApuCatalog y handleAppInput | input apuSearch y catalogResultCount | input actualiza apuSearch y renderiza resultados | VERIFICADO POR EJECUCIÓN por búsqueda combinada | 1 |
| Filtros combinados | IMPLEMENTADO Y FUNCIONAL | filterApus combina search, category y unit con AND | categoryFilter y unitFilter | change actualiza filtros y tabla | VERIFICADO POR EJECUCIÓN | 1 |
| Navegación SPA soportada | IMPLEMENTADO PARCIALMENTE | navigateTo, viewRegistry y renderCurrentView | navegación lateral con data-view y tres secciones | activeView cambia, se renderiza y se hace scroll | VERIFICADO POR EJECUCIÓN; no hay URL router | 1 |
| Agregar APU | IMPLEMENTADO Y FUNCIONAL | addApuToBudget | botones data-action=add-apu | crea item con quantity 1 | VERIFICADO POR EJECUCIÓN | 1 |
| Incrementar APU existente | IMPLEMENTADO Y FUNCIONAL | Rama existingItem de addApuToBudget | mismo botón de catálogo | incrementa quantity y conserva un solo item | VERIFICADO POR EJECUCIÓN repetida | 1 |
| Cantidad decimal | IMPLEMENTADO Y FUNCIONAL | updateBudgetItemQuantity normaliza Number y acepta decimales no negativos | input number con step 0.01 | input y change recalculan subtotal y totals | VERIFICADO POR EJECUCIÓN | 1 |
| Eliminar item | IMPLEMENTADO Y FUNCIONAL | removeBudgetItem | botón data-action=remove-item | splice, auditoría, recálculo y render | VERIFICADO POR EJECUCIÓN | 1 |
| Cálculos financieros | IMPLEMENTADO Y FUNCIONAL | calculateBudgetTotals fuera de renderers | summaryMetrics, summaryBreakdown y budgetFooter | directCost, porcentajes, subtotal, tax y grandTotal se actualizan | VERIFICADO POR EJECUCIÓN nominal, cero, decimal e inválido | 1 |
| Parámetros económicos | IMPLEMENTADO Y FUNCIONAL | updateEconomicSetting | inputs data-setting | valores numéricos se acotan entre 0 y 100 y recalculan | VERIFICADO POR EJECUCIÓN | 1 |
| formatCurrency | IMPLEMENTADO Y FUNCIONAL | formatCurrency usa APP_CONFIG.locale e Intl.NumberFormat | precios y totales | valores inválidos se presentan como USD 0.00, no NaN | VERIFICADO POR EJECUCIÓN | 1 |
| Selectors | IMPLEMENTADO Y FUNCIONAL | getCurrentUser, getCurrentProject, getCurrentClient, getCurrentBudget, getCurrentRole, getApuById y getBudgetItemById | renderers consumen sus resultados | fallos de find devuelven null salvo role fallback | VERIFICADO POR INSPECCIÓN y runtime | 1 |
| Event delegation | IMPLEMENTADO Y FUNCIONAL | bindStaticEvents, handleAppClick, handleAppInput y handleAppChange | listeners únicos en document | click/input/change alcanzan controles dinámicos | VERIFICADO POR EJECUCIÓN de binding y handlers | 1 |
| AuditLog | IMPLEMENTADO Y FUNCIONAL | logAuditEvent, appState.data.auditLog y mockDB.auditLog | No hay lista visual del log | registra alta, eliminación, quantity y setting | VERIFICADO POR EJECUCIÓN | 1 |
| RBAC Presupuestista | IMPLEMENTADO Y FUNCIONAL | rolePermissions y hasPermission aplicados a cuatro engines | UI compartida del catálogo/presupuesto | puede agregar, eliminar, editar quantity y settings | VERIFICADO POR EJECUCIÓN, incluido caso negativo | 1 |
| RBAC cinco roles restantes | IMPLEMENTADO PARCIALMENTE | nombres en mockDB.roles; no hay entrada en rolePermissions | No hay UI específica ni selector de sesión | hasPermission devuelve falso para sus acciones mutables | VERIFICADO POR INSPECCIÓN y caso negativo | 1; completar en 2 |
| Workflow base | PLACEHOLDER ESTRUCTURAL | workflow.status, currentStage, approvals y getters | No hay controles de workflow | ningún evento cambia status o stage | VERIFICADO POR INSPECCIÓN | 1; completar en 2 |
| documents/comments/approvals | PLACEHOLDER ESTRUCTURAL | arrays en mockDB y appState.data | No hay formularios, listas ni handlers | ninguna operación CRUD | VERIFICADO POR INSPECCIÓN | 1; completar por fase |
| scenarios | PLACEHOLDER ESTRUCTURAL | scenarios vacío dentro de BUD-001 | No hay UI ni Scenario Engine | ningún escenario se crea o calcula | VERIFICADO POR INSPECCIÓN | 1; completar en 2 |
| Document Engine | NO IMPLEMENTADO | Solo comentario de reserva en index.html | No existe UI | no hay creación, exportación ni versionado documental F1 | VERIFICADO POR INSPECCIÓN | 2–4 |
| Legal Engine | NO IMPLEMENTADO | Solo comentario de extensión en index.html | No existe UI | no hay reglas, contratos ni firma | VERIFICADO POR INSPECCIÓN | 4–5 |
| DOM Contract F1 | IMPLEMENTADO Y FUNCIONAL | IDs de secciones, tablas, inputs y contenedores existentes | catalog-section, budget-section, summary-section y controles requeridos | los renderers encuentran todos los IDs estáticos referenciados | VERIFICADO POR INSPECCIÓN estática | 1 |

## Roles y estado RBAC

La regla real no es un sistema de seis roles. rolePermissions solo contiene:

Presupuestista -> apu:read, budget:write, budget:delete, budget:quantity, settings:write.

hasPermission obtiene el rol desde getCurrentRole, busca la lista en rolePermissions y permite la acción solo si incluye el permiso o *. Las llamadas actualmente conectadas son:

- addApuToBudget -> budget:write.
- removeBudgetItem -> budget:delete.
- updateBudgetItemQuantity -> budget:quantity.
- updateEconomicSetting -> settings:write.

apu:read está declarado, pero el renderer de catálogo no lo consulta; el catálogo es visible para la sesión actual sin un guard de lectura separado.

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí, en mockDB.roles y USR-001 | Sí, cinco permisos; cuatro controlan acciones mutables | No específica; usa la UI común | Puede agregar APU, eliminar items, editar cantidades y settings | IMPLEMENTADO Y FUNCIONAL |
| Revisor Técnico | Sí, en mockDB.roles | No; no existe entrada en rolePermissions | No | No puede ejecutar las cuatro acciones protegidas cuando session.currentRole tiene este valor | IMPLEMENTADO PARCIALMENTE |
| Director Financiero | Sí, en mockDB.roles | No | No | No puede ejecutar las cuatro acciones protegidas | IMPLEMENTADO PARCIALMENTE |
| Gerente General | Sí, en mockDB.roles | No | No | No puede ejecutar las cuatro acciones protegidas | IMPLEMENTADO PARCIALMENTE |
| Cliente | Sí, en mockDB.roles | No | No | No puede ejecutar las cuatro acciones protegidas | IMPLEMENTADO PARCIALMENTE |
| Oficial Legal | Sí, en mockDB.roles | No | No | No puede ejecutar las cuatro acciones protegidas | IMPLEMENTADO PARCIALMENTE |

No existe login, selector de rol, gestión de usuarios, ocultamiento de controles por rol ni transición de sesión en la UI. Por tanto, declarar el nombre de un rol en roles[] no demuestra que ese rol pueda actuar.

## Componentes principales

### index.html

- Archivo: index.html.
- Responsabilidad: runtime completo de Fase 1; contiene markup, estilos inline, APP_CONFIG, datos, estado, engines, renderers, handlers e inicialización.
- Props: no aplica; no usa componentes React.
- Estado interno relevante: appState, mockDB, rolePermissions, viewRegistry.
- Callbacks y eventos: handleAppClick, handleAppInput, handleAppChange conectados por bindStaticEvents.
- Elementos funcionales: catálogo, filtros, tabla de presupuesto, settings, resumen, indicadores, toast y navegación.
- Estado: IMPLEMENTADO Y FUNCIONAL para las capacidades de Fase 1 enumeradas en la matriz.

### src/main.jsx y src/App.jsx

- Archivo: src/main.jsx monta ReactDOM sobre root y renderiza App.
- Archivo: src/App.jsx contiene otra aplicación de cotización paramétrica con estado React, presets, tabs, modales y calculateQuote.
- Props y callbacks: App entrega props a Header, InputPanel, ResultsDashboard, ComparativeAnalysis, ProposalPreviewModal y HackathonDefenseTab.
- Consumidores: no existen referencias desde el index.html actual; el HTML no tiene root ni script module.
- Estado: IMPLEMENTADO PARCIALMENTE respecto al repositorio global: el código React existe y tiene consumidores internos, pero no participa en el runtime auditado de Fase 1.

### Componentes de src/components

Los componentes React se revisaron como arquitectura existente, pero no son parte del flujo de Fase 1 index.html. No se les atribuyen las funciones de catálogo APU, presupuesto o AuditLog descritas en esta fase.

## Funciones y utilidades principales

| Archivo y función | Entradas | Lee | Modifica / devuelve | Efectos secundarios y consumidores | Estado |
|---|---|---|---|---|---|
| index.html / hydrateStateFromMockDB | Ninguna | mockDB.* | Reemplaza appState.data con clones | Inicialización; separa datos canónicos de la copia simulada | IMPLEMENTADO Y FUNCIONAL |
| index.html / syncCurrentBudgetToMockDB | Ninguna | presupuesto activo y currentBudgetId | Reemplaza el presupuesto correspondiente en mockDB | Consumida por calculateBudgetTotals | IMPLEMENTADO Y FUNCIONAL |
| index.html / getCurrentUser, getCurrentProject, getCurrentClient, getCurrentBudget | Ninguna | IDs actuales y appState.data | Devuelven entidad o null | Consumidas por renderers, aliases y engines | IMPLEMENTADO Y FUNCIONAL |
| index.html / getCurrentRole y hasPermission | permission en hasPermission | session y rolePermissions | Devuelve rol o booleano | Protege altas, bajas, cantidades y settings | IMPLEMENTADO PARCIALMENTE por cobertura de roles |
| index.html / getApuById y getBudgetItemById | ID | data.apus o presupuesto activo | Devuelven entidad o null | Consumo de engines y handlers | IMPLEMENTADO Y FUNCIONAL |
| index.html / filterApus | filtros actuales | apuCatalog y filters | Devuelve APUs coincidentes por AND | renderApuCatalog | IMPLEMENTADO Y FUNCIONAL |
| index.html / addApuToBudget | apuId | catálogo, presupuesto y permiso | Inserta item o incrementa quantity | AuditLog, toast, cálculo, render y sync mockDB | IMPLEMENTADO Y FUNCIONAL |
| index.html / removeBudgetItem | itemId | presupuesto y permiso | Elimina un item | AuditLog, cálculo, render, contador y toast | IMPLEMENTADO Y FUNCIONAL |
| index.html / updateBudgetItemQuantity | itemId, quantity, shouldAudit | item y permiso | Normaliza quantity, subtotal y updatedAt | Cálculo y opcional AuditLog | IMPLEMENTADO Y FUNCIONAL |
| index.html / updateEconomicSetting | key, value, shouldAudit | settings y permiso | Normaliza porcentaje entre 0 y 100 | Cálculo, opcional AuditLog y render summary | IMPLEMENTADO Y FUNCIONAL |
| index.html / calculateBudgetTotals | Ninguna | items, unitPrice, quantity y settings | Escribe item.subtotal y budget.totals | Sincroniza mockDB; consumida por render y mutaciones | IMPLEMENTADO Y FUNCIONAL |
| index.html / formatCurrency | value | APP_CONFIG.locale y settings.currency | Devuelve texto monetario | Consumida por todos los renderers financieros | IMPLEMENTADO Y FUNCIONAL |
| index.html / logAuditEvent | action, entity, entityId, description | usuario, rol y auditLog | Inserta evento en appState y mockDB | Consumida por mutaciones de presupuesto y settings | IMPLEMENTADO Y FUNCIONAL |
| index.html / navigateTo | viewName | APP_CONFIG.supportedViews y viewRegistry | Cambia ui.activeView | Renderiza vista y hace scroll | IMPLEMENTADO PARCIALMENTE como router |
| index.html / renderCurrentView | Ninguna | ui.activeView y viewRegistry | Ejecuta renderer y actualiza navegación | Consumida por initializeApp y navigateTo | IMPLEMENTADO Y FUNCIONAL |
| index.html / renderApp y renderers | Ninguna | estado canónico | Escriben innerHTML, textContent y valores de inputs | Actualización visual inicial y parcial | IMPLEMENTADO Y FUNCIONAL |
| index.html / handleAppClick, handleAppInput, handleAppChange | evento DOM | target, dataset y estado | Llaman callbacks/engines | Registrados una vez por bindStaticEvents | IMPLEMENTADO Y FUNCIONAL |

## Flujos funcionales end-to-end

### Carga inicial

1. Evento: carga del documento.
2. Receptor: ejecución final del script inline.
3. Función: initializeApp.
4. Estado: hydrateStateFromMockDB copia entidades; appState.apuCatalog establece 20 APUs.
5. Transformación: calculateBudgetTotals deja totals en cero.
6. Render: renderApp llama renderSidebar, renderHeader, renderCurrentView, renderBudgetItems, renderBudgetSummary, renderSettings, renderImpactMetrics y updateBudgetIndicators.
7. Resultado: catálogo, presupuesto vacío, settings, resumen y contadores se insertan en DOM.
8. Evidencia: VERIFICADO POR EJECUCIÓN en smoke runtime.

### Búsqueda y filtros combinados

1. Evento: input en apuSearch y change en categoryFilter/unitFilter.
2. Receptor: document.
3. Funciones: handleAppInput o handleAppChange, luego renderApuCatalog.
4. Estado: filters.apuSearch, filters.apuCategory y filters.apuUnit.
5. Transformación: filterApus exige coincidencia simultánea de texto, categoría y unidad.
6. Render: apuCatalogBody y catalogResultCount.
7. Resultado: la tabla muestra solo las APUs coincidentes.
8. Evidencia: VERIFICADO POR EJECUCIÓN con código, categoría y unidad de APU-001.

### Agregar una APU nueva

1. Evento: click en botón data-action=add-apu.
2. Receptor: handleAppClick mediante closest.
3. Función: addApuToBudget.
4. Estado: inserta budget-item-XXX con quantity 1, unitPrice y subtotal.
5. Transformación: logAuditEvent registra BUDGET_ITEM_ADDED; calculateBudgetTotals recalcula.
6. Render: renderBudgetItems, renderBudgetSummary, updateBudgetIndicators y toast.
7. Resultado: aparece una fila y se actualizan los totales.
8. Evidencia: VERIFICADO POR EJECUCIÓN.

### Agregar otra vez la misma APU

1. Evento: segundo click sobre la misma APU.
2. Receptor y función: el mismo handler y addApuToBudget.
3. Estado: existingItem.quantity aumenta en uno; no se crea una segunda fila.
4. Transformación: subtotal y totals se recalculan; se registra BUDGET_ITEM_ADDED con el mismo item.
5. Render: tabla, resumen, contador y toast.
6. Resultado: un solo item con quantity 2.
7. Evidencia: VERIFICADO POR EJECUCIÓN repetida.

### Editar cantidades decimales y valores inválidos

1. Evento: input o change en input data-action=quantity.
2. Receptor: handleAppInput o handleAppChange.
3. Función: updateBudgetItemQuantity.
4. Estado: Number(value) se acepta si es finito y >= 0; de lo contrario se usa 0.
5. Transformación: item.subtotal = quantity * unitPrice y calculateBudgetTotals recalcula el presupuesto.
6. Render: subtotal de la fila, resumen y, en change, tabla completa.
7. Resultado: 2.5 y 1.75 se conservan; invalid no produce NaN.
8. Evidencia: VERIFICADO POR EJECUCIÓN.

### Eliminar item

1. Evento: click en data-action=remove-item.
2. Receptor: handleAppClick.
3. Función: removeBudgetItem.
4. Estado: splice del item activo.
5. Transformación: AuditLog BUDGET_ITEM_REMOVED, calculateBudgetTotals y syncCurrentBudgetToMockDB.
6. Render: estado vacío o tabla, resumen, contador y toast.
7. Resultado: el item desaparece y mockDB refleja items vacío.
8. Evidencia: VERIFICADO POR EJECUCIÓN.

### Cambiar parámetros económicos

1. Evento: input o change en un control data-setting.
2. Receptor: handleAppInput o handleAppChange.
3. Función: updateEconomicSetting.
4. Estado: overheadPercent, contingencyPercent, profitPercent o taxPercent se normaliza entre 0 y 100.
5. Transformación: calculateBudgetTotals recalcula porcentajes, subtotal, tax y grandTotal.
6. Render: renderBudgetSummary; change además repinta settings y registra ECONOMIC_SETTING_CHANGED.
7. Resultado: el desglose refleja el porcentaje nuevo.
8. Evidencia: VERIFICADO POR EJECUCIÓN, incluido change sin input previo.

### Navegación

1. Evento: click en un control data-view.
2. Receptor: handleAppClick.
3. Función: navigateTo.
4. Estado: ui.activeView cambia solo si el nombre está en supportedViews.
5. Transformación: renderCurrentView toma el renderer desde viewRegistry.
6. Render: se actualiza la vista correspondiente y la navegación; se llama scrollIntoView al section ID.
7. Resultado: apu-catalog, budget y summary son navegables; workflow y demás futureViews se ignoran.
8. Evidencia: VERIFICADO POR EJECUCIÓN para las tres vistas soportadas y una vista inválida.

## Estado y gestión de datos

La relación entre estado, función, renderer y DOM es:

| Estado | Función que lo cambia | Renderer | DOM de salida |
|---|---|---|---|
| ui.activeView | navigateTo | renderCurrentView / updateNavigation | controles data-view y secciones catalog-section, budget-section, summary-section |
| filters.apuSearch | handleAppInput | renderApuCatalog | apuSearch, apuCatalogBody, catalogResultCount |
| filters.apuCategory | handleAppChange | renderApuCatalog | categoryFilter, apuCatalogBody |
| filters.apuUnit | handleAppChange | renderApuCatalog | unitFilter, apuCatalogBody |
| data.apus | initializeApp mediante alias apuCatalog | renderFilters / renderApuCatalog | categoryFilter, unitFilter, apuCatalogBody |
| budget.items | addApuToBudget, removeBudgetItem, updateBudgetItemQuantity | renderBudgetItems | budgetItemsBody, budgetFooter |
| budget.totals | calculateBudgetTotals | renderBudgetItems / renderBudgetSummary | budgetFooter, summaryMetrics, summaryBreakdown |
| settings.* | updateEconomicSetting | renderSettings / renderBudgetSummary | inputs data-setting, summaryBreakdown |
| data.auditLog | logAuditEvent | No existe renderer visual F1 | No se pinta una lista de AuditLog |
| ui.toast | showToast | showToast | toast-container |

La fuente de negocio es appState.data y sus aliases. El DOM no es usado como fuente de verdad: los inputs aportan valores de evento, pero los cálculos leen el estado y escriben de vuelta al DOM.

## Workflow y aprobaciones

Existe workflow con status DRAFT, currentStage BUDGETING y approvals vacío. También existe mockDB.approvals y appState.data.approvals como arrays vacíos.

El código real que existe es getWorkflowStatus y getWorkflowStage, que solo devuelven el valor actual. No existe una función de transición, validación de estado, permiso de aprobación, rechazo, comentario de decisión, renderer de workflow ni evento que modifique status, currentStage o approvals.

Estado: PLACEHOLDER ESTRUCTURAL.

La existencia de approvals[] no se interpreta como aprobación funcional. La implementación de transiciones y controles pertenece a Fase 2.

## Auditoría

AuditLog sí tiene comportamiento real para estas acciones:

- BUDGET_ITEM_ADDED, tanto al crear un item como al incrementar un item existente.
- BUDGET_ITEM_REMOVED.
- BUDGET_ITEM_QUANTITY_CHANGED.
- ECONOMIC_SETTING_CHANGED.

Cada evento contiene id, timestamp ISO, userId, role, action, entity, entityId y description. logAuditEvent inserta el evento en appState.data.auditLog y un deepClone en mockDB.auditLog.

No existe renderer, filtro, exportación ni pantalla de auditLog. La auditoría de Fase 1 es una estructura y escritura de eventos, no un Audit Trail visual.

Estado: IMPLEMENTADO Y FUNCIONAL para escritura de eventos de las acciones conectadas; IMPLEMENTADO PARCIALMENTE como producto de auditoría completo.

## Dependencias internas

- index.html depende de DOM APIs estándar, Intl.NumberFormat y Tailwind CSS por CDN para estilos.
- Vite procesa index.html y sirve el runtime inline.
- package.json declara React, ReactDOM, lucide-react y plugin React, pero esos paquetes no son requeridos por el flujo inline actual.
- No hay fetch, API de negocio, LocalStorage, IndexedDB, cookies, base de datos o servidor de autenticación.
- src/main.jsx importa React, ReactDOM y App, pero no es importado por index.html.

## Verificación contra código

### Comparación uno a uno con md/fase-1-1.md

| Afirmación o requisito revisado | Resultado contra código actual | Estado real |
|---|---|---|
| Existe mockDB con usuarios, roles, clientes, proyectos, APUs, presupuestos, documentos, comentarios, approvals y auditLog | La constante contiene las diez colecciones; apus se completa durante initializeApp | IMPLEMENTADO Y FUNCIONAL |
| Existe un único appState organizado por sesión, UI, filtros, data, IDs, settings y workflow | La estructura existe y sus aliases apuntan a ella sin duplicar datos | IMPLEMENTADO Y FUNCIONAL |
| Hay un catálogo de 20 APUs | initializeApp declara APU-001 a APU-020; el runtime lo hidrata y lo renderiza | IMPLEMENTADO Y FUNCIONAL |
| Hay búsqueda y filtros | filterApus usa texto, categoría y unidad con condición AND; handlers conectados | IMPLEMENTADO Y FUNCIONAL |
| Hay navegación SPA | viewRegistry admite apu-catalog, budget y summary; navigateTo cambia activeView y hace scroll | IMPLEMENTADO PARCIALMENTE: no hay URL router ni vistas futuras |
| Agregar APU funciona | addApuToBudget crea un budget item, audita, recalcula y renderiza | IMPLEMENTADO Y FUNCIONAL |
| Repetir una APU no duplica filas | existingItem incrementa quantity del item encontrado por apuId | IMPLEMENTADO Y FUNCIONAL |
| Las cantidades pueden ser decimales | input number step 0.01 y Number normalizado por updateBudgetItemQuantity | IMPLEMENTADO Y FUNCIONAL |
| Eliminar items funciona | removeBudgetItem elimina por ID, audita, recalcula y sincroniza mockDB | IMPLEMENTADO Y FUNCIONAL |
| Existen cálculos financieros | calculateBudgetTotals calcula directCost, overhead, contingency, profit, subtotal, tax y grandTotal | IMPLEMENTADO Y FUNCIONAL |
| Existen parámetros económicos | settings y updateEconomicSetting modifican cuatro porcentajes y recalculan | IMPLEMENTADO Y FUNCIONAL |
| Existe formatCurrency | Usa Intl.NumberFormat, locale configurable y fallback cero | IMPLEMENTADO Y FUNCIONAL |
| Existen selectors y aliases | Las funciones y Object.defineProperties están conectados a renderers y engines | IMPLEMENTADO Y FUNCIONAL |
| Existe event delegation | bindStaticEvents registra click, input y change sobre document | IMPLEMENTADO Y FUNCIONAL |
| Existe AuditLog | logAuditEvent escribe eventos de las mutaciones actuales en appState y mockDB | IMPLEMENTADO Y FUNCIONAL para escritura; sin UI visual |
| Existe RBAC | rolePermissions solo tiene Presupuestista; hasPermission bloquea las cuatro mutaciones protegidas | IMPLEMENTADO PARCIALMENTE |
| Existe workflow base | Existen status, currentStage, approvals y dos getters, sin transiciones | PLACEHOLDER ESTRUCTURAL |
| Existen documentos, comentarios, approvals y escenarios como estructuras | arrays vacíos existen; no tienen CRUD, UI ni flujo | PLACEHOLDER ESTRUCTURAL |
| Existe Legal Engine | Solo hay comentario de reserva; no existe lógica legal | NO IMPLEMENTADO |
| Existe DOM Contract | Los IDs exigidos por los renderers están en index.html; los IDs de fila son dinámicos | IMPLEMENTADO Y FUNCIONAL |
| La aplicación React/Vite descrita por el repositorio es el runtime de Fase 1 | src existe, pero index.html no monta root ni src/main.jsx | IMPLEMENTADO PARCIALMENTE como arquitectura global; no conectado al runtime F1 |

### Archivos principales revisados

- AGENTS.md.
- md/AGENTS.md.
- src/AGENTS.md.
- tests/AGENTS.md.
- md/fase-1-1.md.
- index.html completo, incluyendo markup, IDs, script inline y las 16 secciones.
- src/main.jsx, src/App.jsx, src/components, src/data/parametricData.js, src/utils/calculator.js, src/index.css.
- vite.config.js, package.json y README.md.

### Componentes, funciones y estructuras encontradas

- mockDB, appState, rolePermissions y viewRegistry existen en index.html.
- initializeApp conecta la carga inicial.
- hydrateStateFromMockDB y syncCurrentBudgetToMockDB conectan mockDB con appState.
- filterApus, addApuToBudget, removeBudgetItem, updateBudgetItemQuantity, updateEconomicSetting, calculateBudgetTotals, formatCurrency y logAuditEvent están definidos y son consumidos por handlers o renderers.
- navigateTo y renderCurrentView consumen viewRegistry.
- bindStaticEvents registra los tres listeners centrales.
- Los renderers encuentran los IDs DOM auditados.

### Inconsistencias detectadas y corregidas

1. formatCurrency tenía locale es-EC escrito directamente, aunque APP_CONFIG ya declaraba locale. Se modificó index.html para usar APP_CONFIG.locale.
2. handleAppChange para quantity y settings solo consumía el valor que un evento input anterior hubiese aplicado. Se modificó para llamar updateBudgetItemQuantity o updateEconomicSetting con shouldAudit=false antes de crear el evento de auditoría y renderizar. Esto evita estado obsoleto cuando el navegador o una prueba dispara change sin input previo.

### Inconsistencias detectadas y no modificadas

1. El index.html actual es el entrypoint efectivo, pero src/main.jsx y src/App.jsx describen otra aplicación React. Se conserva esta realidad y se documenta; no se inicia una migración arquitectónica durante una auditoría de Fase 1.
2. md/fase-1-1.md describe correctamente el flujo inline que existe, pero no identifica la falta de conexión con src. Este snapshot la incorpora como limitación.
3. Hay arrays y campos de workflow, documentos, comentarios, approvals y escenarios, pero no hay lógica de negocio asociada. Se clasificaron como PLACEHOLDER ESTRUCTURAL en vez de funcionalidad.

### DOM Contract

Los renderers usan estos IDs y la inspección estática no encontró referencias getElementById sin elemento estático correspondiente:

- app, sidebar, app-header, main-content, view-container.
- catalog-section, apu-catalog-container, apu-filters-container, apuSearch, categoryFilter, unitFilter, catalogResultCount, apuCatalogBody.
- budget-section, budget-items-container, budgetItemsBody, budgetFooter, budgetCount, sidebarBudgetCount.
- settings-section, economic-settings-container.
- summary-section, budget-summary-container, summaryMetrics, summaryBreakdown, impact-metrics-container, impact-band.
- toast-container y modal-container.

Los IDs quantity-... y los data-subtotal="..." son dinámicos y se generan con el ID del item; no se tratan como IDs estáticos faltantes.

## Verificación funcional

### VERIFICADO POR EJECUCIÓN

- npm run build: terminó con exit code 0; Vite 6.4.4 produjo dist/index.html.
- Análisis sintáctico del script inline: new Function sobre el contenido real de index.html terminó sin error.
- Smoke runtime sobre el script real: reportó runtime ok, apus 20, auditEvents 7 y routes apu-catalog,budget,summary.
- La prueba de smoke cubrió:
  - 20 APUs, IDs únicos, currency USD y suma de components igual a unitPrice.
  - presupuesto inicial vacío y totals finitos.
  - búsqueda y filtros combinados.
  - alta de APU y segunda alta sin duplicación.
  - sincronización del presupuesto en mockDB.
  - cantidad 2.5, cantidad 1.75, valor inválido y ausencia de NaN.
  - cambio de setting sin input previo.
  - caso negativo de RBAC con Revisor Técnico.
  - eliminación y AuditLog.
  - formatCurrency con NaN y undefined.
  - navegación válida e inválida.
  - binding de click, input y change.
  - ausencia de undefined o NaN en innerHTML generado por el smoke DOM.

### VERIFICADO POR INSPECCIÓN

- Las 16 secciones del script están presentes y ordenadas.
- Las funciones declaradas tienen consumidores dentro del script cuando se clasifican como funcionales.
- No hay imports nuevos ni referencias de módulos introducidas por esta iteración.
- El análisis de IDs estáticos no mostró IDs DOM faltantes.
- calculateBudgetTotals está fuera de los renderers.
- El flujo de sincronización mockDB ocurre después de cada recálculo.
- rolePermissions, hasPermission y los cuatro guards de mutación están conectados.

### NO VERIFICADO

- No se ejecutó un navegador visual con consola real durante esta iteración; por eso el aspecto responsive, el scroll visual y errores de consola del navegador no se declaran verificados por ejecución.
- No existe una suite automatizada persistente en tests. El smoke utilizado fue temporal, ejecutó el script real y se eliminó al finalizar.
- No se verificó persistencia entre recargas, concurrencia, accesibilidad completa ni compatibilidad entre navegadores.
- No se verificó que la aplicación React de src sea funcional como runtime de Fase 1, porque index.html no la monta y sería un flujo distinto.

## Limitaciones actuales

1. El runtime no tiene autenticación, selección de usuario ni cambio de rol. Solo se inicia la sesión fija USR-001 / Presupuestista.
2. Los seis nombres de rol existen en roles[], pero solo Presupuestista tiene permisos. Los otros cinco no tienen regla, UI específica ni acción ejecutable.
3. El catálogo no tiene alta, edición o baja de APUs; solo usa dataset hardcodeado.
4. La navegación no cambia URL, no crea rutas independientes y no oculta toda la UI no activa; hace render de la vista seleccionada y scroll a una sección.
5. workflow tiene campos y getters, pero no estados transitables, validación, acciones, UI ni auditoría de decisión.
6. documents[], comments[], approvals[] y scenarios[] son arrays sin CRUD ni renderers.
7. Document Engine y Legal Engine no tienen funciones de negocio. modal-container existe en el DOM, pero no implementa documentos ni legales.
8. AuditLog se escribe en memoria y no tiene pantalla, filtros, exportación o persistencia.
9. Los cálculos usan Number y JavaScript floating point; formatCurrency redondea para presentación, no existe redondeo monetario persistido por línea.
10. Los porcentajes económicos se acotan a 0–100, pero no hay validación de reglas de negocio más específicas.
11. No existe backend, API, persistencia, autenticación, almacenamiento documental ni firma.
12. La aplicación React en src y el runtime inline no comparten appState, catálogo, presupuesto ni AuditLog. La paridad entre ambos flujos no está implementada.
13. No existe un conjunto de pruebas persistente en tests.

Estas limitaciones distinguen capacidades futuras de defectos corregidos. No se implementan en esta iteración.

## Cambios de esta iteración

1. Se modificó index.html para inicializar settings.currency desde APP_CONFIG.currency.
2. Se modificó formatCurrency en index.html para utilizar APP_CONFIG.locale en Intl.NumberFormat.
3. Se modificó handleAppChange en index.html para volver a aplicar y normalizar el valor de quantity antes de auditar y renderizar.
4. Se modificó handleAppChange en index.html para volver a aplicar y normalizar el valor de data-setting antes de auditar y renderizar.
5. Se creó md/fase-1-2.md como snapshot nuevo.
6. No se modificó md/fase-1-1.md.
7. No se modificó src ni se inició Fase 2.

## Impacto técnico de esta iteración

- Archivo de runtime afectado: index.html.
- Archivo documental creado: md/fase-1-2.md.
- Contratos conservados: mockDB, appState, aliases, rolePermissions, viewRegistry, IDs DOM, nombres de acciones data-action y listeners de document.
- Comportamiento conservado: búsqueda, filtros, alta, incremento, cantidad, eliminación, settings, cálculos, navegación, toast y AuditLog.
- Comportamiento corregido: los eventos change ya no dejan estado viejo si no existe un input anterior; el locale de formato se obtiene de configuración.
- Dependencias nuevas: ninguna.
- Riesgo de regresión: bajo en Fase 1 porque los cambios están dentro de handlers existentes y fueron ejercitados por smoke runtime; permanece el riesgo arquitectónico por la coexistencia de runtime inline y src React.

## Compatibilidad

Se mantienen los nombres de contrato appState, mockDB, rolePermissions, viewRegistry, currentUser, activeView, apuCatalog, budget, auditLog, documents, comments, roles, filters.search, filters.category y filters.unit.

Las estructuras de presupuesto, item, totals, settings, workflow y AuditLog no cambiaron de forma. El setter apuCatalog sigue sincronizando mockDB.apus. Las mutaciones siguen llamando calculateBudgetTotals y los renderers siguen escribiendo en los mismos contenedores DOM.

## Preparación para siguientes fases

La siguiente fase debe extender el estado canónico y conservar:

- appState.data y mockDB como contratos de datos demo durante el prototipo.
- rolePermissions y hasPermission para añadir reglas por acción y por rol.
- workflow.status, workflow.currentStage y workflow.approvals como campos existentes, sin tratarlos como workflow hasta implementar transiciones reales.
- budget.scenarios como ubicación de escenarios por presupuesto, sin asumir que el array vacío calcula o compara escenarios.
- documents, comments y approvals como colecciones de datos, añadiendo operaciones, renderers, permisos y auditoría explícitos.
- logAuditEvent para nuevas acciones de negocio una vez que existan controles reales.

No se debe duplicar el estado en el DOM ni crear un segundo presupuesto fuera de appState.data.budgets.

## Próxima fase

Fase 2 deberá implementar explícitamente, en el orden definido por el plan del proyecto:

1. reglas concretas de permisos para Revisor Técnico, Director Financiero, Gerente General, Cliente y Oficial Legal;
2. controles UI que oculten o bloqueen acciones según hasPermission y una sesión capaz de representar cada rol;
3. workflow con conjunto de estados, transiciones válidas e inválidas, funciones de transición, actualización de status/currentStage, UI de estado y AuditLog;
4. revisión técnica y revisión financiera como acciones distintas, con actor, resultado, comentario y relación con el presupuesto;
5. aprobación gerencial y aprobación del Cliente con permisos, controles, estado y auditoría;
6. primer flujo de escenarios sobre budget.scenarios, con entrada, cálculo, renderer y comparación;
7. integración documental solo cuando se definan documentos, almacenamiento y permisos correspondientes.

Fase 2 no está iniciada en este snapshot.

## Arquitectura Producción / Homelab

El comentario de arquitectura de index.html establece equivalencias objetivo:

- mockDB -> PostgreSQL.
- estado en memoria -> backend/API.
- documents[] -> MinIO.
- firmas simuladas -> DocuSeal.
- agenda simulada -> Cal.com.
- automatizaciones -> n8n.
- RBAC local -> Keycloak.

Ninguno de esos servicios está conectado en el código auditado. La arquitectura Homelab es una referencia de evolución y no una funcionalidad implementada.

## Contrato para la siguiente iteración

La siguiente iteración debe:

- partir de index.html y de este snapshot para el runtime efectivo, o documentar y ejecutar una decisión explícita de migración a React;
- no afirmar que un rol actúa solo por aparecer en roles[];
- no afirmar que existe workflow por existir status, currentStage o approvals[];
- conservar los IDs y aliases de Fase 1 si se modifica el runtime;
- conectar cada nueva acción a estado, permiso, handler, renderer y AuditLog cuando corresponda;
- registrar cada transición y cada caso negativo verificado;
- mantener separadas las etiquetas IMPLEMENTADO Y FUNCIONAL, IMPLEMENTADO PARCIALMENTE, PLACEHOLDER ESTRUCTURAL y NO IMPLEMENTADO;
- no iniciar revisión legal, documentos reales, portal cliente ni integraciones de producción dentro de una tarea que no las autorice.

Conclusión: la Fase 1 funcional del runtime inline queda auditada con evidencia de ejecución para sus flujos de catálogo, presupuesto, cálculo y navegación soportada. Los módulos de roles restantes, workflow, documentos, escenarios, legal y la paridad React permanecen expresamente clasificados según el código real. No se inició Fase 2.
