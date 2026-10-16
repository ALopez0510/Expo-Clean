# Fase 5 — Iteración 1

## Identificación

- Proyecto: BuildCost / Expo Clean.
- Fase: 5 — Dashboard ejecutivo, Audit Trail, KPIs, Timeline y cierre final.
- Iteración: 1.
- Fecha de verificación: 2026-10-16.
- Runtime activo: index.html.
- Snapshot anterior: md/fase-4-1.md.
- Fase 6: no existe en el alcance y no se inició.

Este snapshot sigue md/AGENTS.md. El código es la fuente de verdad. md/fase-4-1.md se revisó como referencia histórica, pero sus afirmaciones se contrastaron contra el runtime actual.

## Resumen ejecutivo técnico

Fase 5 está IMPLEMENTADO Y FUNCIONAL para el flujo demo en memoria:

- dashboard y audit están en APP_CONFIG.supportedViews, permisos, navegación y viewRegistry.
- renderDashboardView() consume los engines existentes y presenta una vista interna o una vista comercial restringida.
- renderAuditView() lee exclusivamente appState.data.auditLog, ordena de más reciente a más antiguo y permite filtros por rol, acción, entidad, categoría, etapa y búsqueda.
- Existen las ocho funciones KPI solicitadas, getExecutiveSummary(), getRecentAuditEvents(), getExecutiveAlerts(), validateAppStateConsistency() y getSystemHealth().
- logAuditEvent() admite metadata compatible; changeWorkflowStage() guarda etapa anterior, siguiente y estado para derivar tiempos.
- El Dashboard no crea eventos DASHBOARD_VIEWED ni KPI_CALCULATED.
- 3 semanas, 48 horas y aproximadamente 90% se muestran como narrativa/objetivo, separados del ciclo real derivado de timestamps.
- No se agregó funcionalidad de Fase 6.

La repetición completa Cliente → Legal → firmas → AWARDED no pudo certificarse nuevamente en la última sesión de navegador porque la pestaña agotó tiempo durante el click de aprobación del Cliente. md/fase-4-1.md registra esa ejecución completa previa; en esta iteración la conexión actual queda verificada por inspección y la sesión nueva llegó hasta propuesta enviada.

## Estado general de implementación

| Área | Estado | Qué existe hoy | Qué no existe |
|---|---|---|---|
| Catálogo de 20 APUs | IMPLEMENTADO Y FUNCIONAL | Dataset APU-001 a APU-020, búsqueda y filtros | Persistencia externa |
| Presupuesto | IMPLEMENTADO Y FUNCIONAL | Alta, incremento sin duplicar, decimales, eliminación y totales | Multi-presupuesto persistente |
| Parámetros económicos | IMPLEMENTADO Y FUNCIONAL | Overhead, contingencia, utilidad e IVA recalculados | Backend financiero |
| RBAC | IMPLEMENTADO Y FUNCIONAL | rolePermissions, hasPermission() y guards de UI/negocio | Identidad real |
| Workflow | IMPLEMENTADO Y FUNCIONAL | Transiciones, decisiones, comentarios y estados | Bandeja multiusuario persistente |
| Escenarios/precios/riesgo | IMPLEMENTADO Y FUNCIONAL | Scenario Engine, referencias, variancias, drivers, distribución y riesgo | Mercado externo |
| Documentos/legal/firma | IMPLEMENTADO Y FUNCIONAL | Propuesta, versiones, contrato, firmas demo y AWARDED condicionado | PDF y firma legal |
| KPI ejecutivo | IMPLEMENTADO Y FUNCIONAL | Ocho grupos KPI, resumen, ciclo y alertas | Telemetría histórica |
| Dashboard | IMPLEMENTADO Y FUNCIONAL | Vista interna y vista comercial de Cliente | Preferencias por usuario |
| Audit Trail | IMPLEMENTADO Y FUNCIONAL | Lectura, orden, categorías y filtros | Exportación/almacén inmutable |
| resetDemo() | IMPLEMENTADO PARCIALMENTE | Restaura snapshot determinista con confirmación | Persistencia entre sesiones |
| src/ React paralelo | PLACEHOLDER ESTRUCTURAL | Existe arquitectura paralela no importada por index.html | No es runtime ejecutable de esta demo |
| Notificaciones externas | NO IMPLEMENTADO | No existe engine externo | Email, Slack, push o scheduler |

## Cómo funciona actualmente

La aplicación se ejecuta desde index.html con un script inline. initializeApp() hidrata desde mockDB, carga 20 APUs, crea escenarios base, calcula totales, captura demoInitialSnapshot y llama renderApp(). bindStaticEvents() registra event delegation para click, input y change.

La navegación usa navigateTo(), valida APP_CONFIG.supportedViews y canViewForRole(), cambia appState.ui.activeView, ejecuta viewRegistry y desplaza el DOM. El presupuesto usa addApuToBudget(), removeBudgetItem(), updateBudgetItemQuantity(), updateEconomicSetting(), calculateTotalsFromItems() y calculateBudgetTotals().

Workflow usa changeWorkflowStage() y workflowTransitions. Documentos, comentarios, aprobaciones, firmas y auditoría viven en appState.data y se sincronizan con mockDB en los puntos existentes. Dashboard y Audit Trail derivan datos al entrar o al cambiar filtros; no guardan un store de Dashboard.

## Arquitectura global

| Capa | Código real |
|---|---|
| Configuración | APP_CONFIG y constantes de workflow/documentos |
| Seed | mockDB |
| Estado | appState, con aliases compatibles |
| Engines | APU, financiero, RBAC, workflow, documentos, escenarios/precios/riesgo, audit y analytics |
| Router | getViewPermission(), canViewForRole(), navigateTo(), viewRegistry |
| Renderers | funciones render*() en index.html |
| Eventos | handleAppClick(), handleAppInput(), handleAppChange() |
| Persistencia | No existe; el estado es memoria |

No se añadió una arquitectura paralela ni backend.

## Estructura física del proyecto

Archivos revisados:

- index.html: runtime activo completo.
- AGENTS.md: reglas generales.
- md/AGENTS.md: reglas de snapshots.
- src/AGENTS.md: confirma que src/ no es el runtime activo.
- tests/AGENTS.md: convenciones de evidencia.
- md/fase-1-1.md, md/fase-1-2.md, md/fase-2-1.md, md/fase-3-1.md y md/fase-4-1.md: snapshots anteriores.
- package.json y vite.config.js: build Vite.
- src/: código paralelo React/Vite no importado por index.html.

Se creó solamente md/fase-5-1.md; no se sobrescribió md/fase-4-1.md.

## Datos y modelos actuales

### mockDB

mockDB contiene users, roles, clients, projects, apus, budgets, documents, comments, approvals, signatures, auditLog y priceReferences. Inicialmente hay un usuario demo, un proyecto, un presupuesto y arrays vacíos para los registros de ejecución. Los arrays vacíos son estructuras de seed; la funcionalidad se acredita por las funciones que los llenan y consumen.

### appState

appState contiene session.currentUserId/currentRole, ui.activeView/activeScenarioId/activeDocumentId/auditFilters, filtros de catálogo, data normalizada, currentProjectId/currentBudgetId, settings y workflow.status/currentStage/approvals.

demoInitialSnapshot conserva una copia determinista después de cargar APUs y escenarios. No es una segunda fuente operativa; solo es la recuperación de resetDemo().

### Estado y sincronización

- hydrateStateFromMockDB(): clona mockDB a appState.data.
- syncCurrentBudgetToMockDB(): sincroniza presupuesto activo.
- syncDocumentsToMockDB(): sincroniza documentos.
- syncSignaturesToMockDB(): sincroniza firmas.
- logAuditEvent(): agrega a appState.data.auditLog y mockDB.auditLog.
- Los renderers leen appState, no mockDB directamente.

### Aliases y compatibilidad

Object.defineProperties() conserva currentUser, activeView, apuCatalog, budget, auditLog, documents, comments, signatures y roles. Los aliases search, category y unit de filtros también permanecen.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| mockDB/appState | IMPLEMENTADO Y FUNCIONAL | mockDB, appState, hydrateStateFromMockDB() | Header/sidebar | Seed y sincronización | VERIFICADO POR INSPECCIÓN | F1 |
| 20 APUs | IMPLEMENTADO Y FUNCIONAL | initializeApp() | apuCatalogBody | 20 botones visibles | VERIFICADO POR EJECUCIÓN | F1 |
| Búsqueda/filtros | IMPLEMENTADO Y FUNCIONAL | filterApus() | apuSearch/categoryFilter/unitFilter | Búsqueda y combinación | VERIFICADO POR EJECUCIÓN | F1 |
| Presupuesto | IMPLEMENTADO Y FUNCIONAL | addApuToBudget(), removeBudgetItem(), updateBudgetItemQuantity() | budgetItemsBody | Alta, incremento, decimal, baja | VERIFICADO POR EJECUCIÓN | F1 |
| Finanzas | IMPLEMENTADO Y FUNCIONAL | calculateTotalsFromItems(), calculateBudgetTotals() | summaryMetrics/summaryBreakdown | Recálculo inmediato | VERIFICADO POR EJECUCIÓN | F1 |
| RBAC | IMPLEMENTADO Y FUNCIONAL | rolePermissions, hasPermission() | Sidebar, botones, vistas | Cambio de rol y guards | VERIFICADO POR EJECUCIÓN | F2 |
| Workflow | IMPLEMENTADO Y FUNCIONAL | workflowTransitions, changeWorkflowStage() | workflow-view-container | Aprobar/rechazar/retornar | VERIFICADO POR INSPECCIÓN y ejecución histórica | F2 |
| Escenarios | IMPLEMENTADO Y FUNCIONAL | ensureDefaultScenarios(), createScenario(), promoteScenarioToBudget() | scenarios-view-container | Crear/ajustar/promover | VERIFICADO POR INSPECCIÓN | F3 |
| Price/risk | IMPLEMENTADO Y FUNCIONAL | getPriceRecommendation(), calculateScenarioRisk() | Panel de escenarios/Dashboard | Riesgo y referencias | VERIFICADO POR EJECUCIÓN | F3 |
| Documentos | IMPLEMENTADO Y FUNCIONAL | generateEconomicProposal(), sendProposalToClient() | Documents/Portal | Versionado y envío | VERIFICADO POR EJECUCIÓN histórica y parcial actual | F4 |
| Legal/firma | IMPLEMENTADO Y FUNCIONAL | startLegalReview(), generateContract(), signContract() | Legal/Portal/Documents | Contrato y firma demo | VERIFICADO POR INSPECCIÓN y ejecución histórica | F4 |
| KPI | IMPLEMENTADO Y FUNCIONAL | ocho calculate*KPIs() | Dashboard | Lectura derivada | VERIFICADO POR EJECUCIÓN | F5 |
| Dashboard | IMPLEMENTADO Y FUNCIONAL | renderDashboardView() | dashboard-section | Vista interna/comercial | VERIFICADO POR EJECUCIÓN | F5 |
| Audit | IMPLEMENTADO Y FUNCIONAL | buildAuditTimeline(), renderAuditView() | audit-section y seis filtros | Orden y filtros | VERIFICADO POR EJECUCIÓN | F5 |
| Consistencia | IMPLEMENTADO PARCIALMENTE | validateAppStateConsistency(), getSystemHealth() | Sin panel dedicado | API de lectura | VERIFICADO POR INSPECCIÓN | F5 |
| Notificaciones externas | NO IMPLEMENTADO | No existe código | No existe UI | No aplica | NO APLICA | Futuro |

## Matriz final de Fases 1–5

| Fase | Estado final | Evidencia de código actual | Límite exacto |
|---|---|---|---|
| Fase 1 — Presupuesto base | IMPLEMENTADO Y FUNCIONAL | mockDB, appState, 20 APUs, filtros, presupuesto y calculateBudgetTotals() | Memoria y un presupuesto demo |
| Fase 2 — RBAC y workflow | IMPLEMENTADO Y FUNCIONAL | rolePermissions, hasPermission(), workflowTransitions, decisiones y comentarios | Usuario demo, sin autenticación |
| Fase 3 — Escenarios y riesgo | IMPLEMENTADO Y FUNCIONAL | Scenario Engine, Price Intelligence, variancias, drivers y Risk Engine | Referencias deterministas, sin mercado externo |
| Fase 4 — Portal, documentos y legal | IMPLEMENTADO Y FUNCIONAL | propuesta, snapshots, portal, legal, contrato, firmas y AWARDED condicionado | Documentos y firma de demostración |
| Fase 5 — Dashboard y Audit Trail | IMPLEMENTADO Y FUNCIONAL | ocho KPI, resumen, alertas, renderers, filtros y cycle time | Sin persistencia, exportación ni notificaciones |

## Roles y estado RBAC

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí | presupuesto, settings, workflow técnico, propuestas, escenarios, dashboard interno/financiero/riesgo, audit | Dashboard, catálogo, presupuesto, workflow, escenarios, documentos | Edita presupuesto, envía revisión, genera/envía propuesta | IMPLEMENTADO Y FUNCIONAL |
| Revisor Técnico | Sí | lectura, revisión/aprobación/rechazo técnico, comentarios, escenarios, dashboard interno/financiero/riesgo, audit | Dashboard, Workflow, Audit | Decide revisión técnica | IMPLEMENTADO Y FUNCIONAL |
| Director Financiero | Sí | revisión/aprobación/rechazo financiero, propuesta, escenarios/precios, dashboard financiero/riesgo, audit | Dashboard, Workflow, escenarios, Audit | Decide revisión financiera | IMPLEMENTADO Y FUNCIONAL |
| Gerente General | Sí | revisión/aprobación/rechazo gerencial, contrato/firma, dashboard interno/financiero/riesgo, audit | Dashboard, Workflow, Documents, Legal | Decide revisión gerencial y firma | IMPLEMENTADO Y FUNCIONAL |
| Cliente | Sí | propuesta, aprobación/cambios, comentarios compartidos, contrato/firma, dashboard:view; sin audit ni permisos internos | Portal y Dashboard comercial | Aprueba/cambia propuesta y firma | IMPLEMENTADO Y FUNCIONAL |
| Oficial Legal | Sí | legal, contrato, aprobación de firma, comentarios internos, dashboard interno, audit; sin dashboard financiero/riesgo | Dashboard, Documents, Legal, Audit | Decide revisión legal y libera firma | IMPLEMENTADO Y FUNCIONAL |

Cliente no tiene workflow:internal-read ni audit:view. renderWorkflowView() y renderAuditView() rechazan el acceso. resetDemo() rechaza Cliente y exige dashboard:internal. La ocultación de botones y la validación de negocio están implementadas por separado.

## Componentes principales

El runtime no monta componentes React. Los componentes efectivos son contenedores DOM y renderers:

| Componente | Renderer | Función |
|---|---|---|
| Sidebar | renderSidebar() | Visibilidad, contador, etapa y responsable |
| Header | renderHeader() | Proyecto, cliente, moneda, etapa y responsable |
| Catálogo | renderFilters(), renderApuCatalog() | Filtros y alta de APUs |
| Presupuesto | renderBudgetItems(), renderBudgetSummary(), renderSettings() | Items, totales y parámetros |
| Workflow | renderWorkflowView(), renderWorkflowActions() | Timeline, acciones, decisiones y comentarios |
| Escenarios | renderScenariosView() | Escenarios, variancias, precios y riesgo |
| Portal | renderClientPortalView() | Propuesta y acciones Cliente |
| Documents | renderDocumentsView() | Versiones, preview, contrato y firma |
| Legal | renderLegalView() | Revisión legal y liberación |
| Dashboard | renderDashboardView() | KPI, timeline, drivers, documentos, alertas |
| Audit | renderAuditView() | Eventos, filtros y búsqueda |

## Funciones y utilidades principales

### Estado/router/RBAC

- getCurrentUser(), getCurrentProject(), getCurrentClient(), getCurrentBudget(): leen IDs activos y devuelven el registro o null.
- hasPermission(permission): lee rolePermissions del rol de sesión y devuelve booleano.
- getViewPermission(viewName): asigna permiso a cada vista.
- navigateTo(viewName): valida, modifica appState.ui.activeView, renderiza y hace scroll.
- switchRole(roleName): cambia sesión, registra ROLE_SWITCHED, aplica vista por rol y renderiza.

### Presupuesto

- addApuToBudget(apuId): si el apuId ya existe incrementa quantity; si no crea una fila; audita y recalcula.
- removeBudgetItem(itemId): valida budget:delete, elimina, audita y recalcula.
- updateBudgetItemQuantity(itemId, quantity, shouldAudit): normaliza cantidad no negativa, admite decimales y recalcula subtotal.
- updateEconomicSetting(key, value, shouldAudit): normaliza porcentaje entre 0 y 100 y recalcula.
- calculateTotalsFromItems(items, settings): devuelve directCost, overhead, contingency, profit, subtotal, tax y grandTotal.
- calculateBudgetTotals(): actualiza budget.totals, escenarios y mockDB.budgets.
- formatCurrency(value): usa Intl.NumberFormat es-EC/USD y evita NaN.

### Workflow/documentos/auditoría

- changeWorkflowStage(nextStage, options): valida transición, permiso y estado; modifica workflow/presupuesto y registra metadata temporal.
- getWorkflowApprovals() y getWorkflowComments(): leen registros del presupuesto activo.
- generateEconomicProposal(), sendProposalToClient(), approveClientProposal(), requestClientChanges(): gestionan propuesta, snapshot, envío y respuesta Cliente.
- startLegalReview(), approveLegalReview(), requestLegalChanges(), generateContract(), approveContractForSignature(): gestionan el tramo legal.
- signContract(): evita duplicar la firma por rol; solo termina en AWARDED cuando existen las firmas requeridas.
- logAuditEvent(action, entity, entityId, description, metadata): crea evento, lo inserta en ambos logs y devuelve el evento.

### Scenario/Risk Engine

- getCurrentScenario(): obtiene escenario activo/base.
- calculateScenarioTotals(): calcula total y variancia.
- calculateSavings(): calcula ahorro no negativo contra base.
- getTopCostDrivers() y getCostDistributionByCategory(): alimentan drivers y distribución del Dashboard.
- calculateScenarioRisk() y getCriticalApus(): alimentan score, nivel y APUs críticos.

### Executive Analytics Engine

- calculateExecutiveKPIs(): compone financial, workflow, scenarios, risk, documents, audit y cycle.
- calculateFinancialKPIs(): deriva margen como profit/subtotal y ahorro usando calculateSavings().
- calculateWorkflowKPIs(): devuelve etapa, estado, progreso, responsable, aprobaciones, rechazos y comentarios.
- calculateScenarioKPIs(): devuelve escenario activo y comparación.
- calculateRiskKPIs(): consume Risk Engine y cuenta niveles altos/críticos.
- calculateDocumentKPIs(): cuenta propuestas, versiones, contratos, firmas y awarded real.
- calculateAuditKPIs(): cuenta eventos y categorías.
- calculateCycleTimeKPIs(): deriva timestamps y duraciones; devuelve Sin datos suficientes cuando no alcanza evidencia.
- getExecutiveSummary(): devuelve proyecto, cliente, total, escenario, ahorro, riesgo, etapa, responsable, propuesta, contrato y awarded.
- getRecentAuditEvents(limit): devuelve copias ordenadas de eventos recientes.
- getExecutiveAlerts(): devuelve objetos deterministas id/severity/type/message/entityId.
- validateAppStateConsistency() y getSystemHealth(): validan relaciones de estado.
- resetDemo(confirmed): restaura snapshot, con guard de rol y confirmación.

## Flujos funcionales end-to-end

### Flujo 1 — Dashboard

El click en button[data-view=dashboard] llega a handleAppClick(), llama navigateTo(), valida dashboard:view y ejecuta renderDashboardView(). El renderer obtiene getExecutiveSummary() y calculateExecutiveKPIs(), deriva tarjetas y escribe dashboard-view-container. No modifica auditLog.

Resultado: VERIFICADO POR EJECUCIÓN. Con un APU agregado el total observado fue $17,39.

### Flujo 2 — Audit Trail

El click en button[data-view=audit] llega a navigateTo() y valida audit:view. renderAuditView() clona appState.data.auditLog mediante buildAuditTimeline(), añade categoría/etapa y ordena descendente. handleAppChange() actualiza filtros y handleAppInput() actualiza búsqueda.

Resultado: VERIFICADO POR EJECUCIÓN. Se observó BUDGET_ITEM_ADDED con categoría BUDGET y mensaje vacío exacto cuando no había eventos.

### Flujo 3 — F1 presupuesto

Catálogo → filterApus() → addApuToBudget() → calculateBudgetTotals() → renderBudgetItems()/renderBudgetSummary(). Se verificó búsqueda MT-001, combinación de filtros, dos clicks sin duplicar, cantidad 1.25 y eliminación.

Resultado: VERIFICADO POR EJECUCIÓN. 20 APUs; 2 resultados combinados; una fila con quantity 2; subtotal $15,63; cero filas tras eliminar.

### Flujo 4 — F2 workflow

Enviar a revisión → changeWorkflowStage() → aprobación por rol → siguiente stage. Cada decisión actualiza workflow y presupuesto, sincroniza mockDB y audita. En esta sesión se verificó hasta Listo para propuesta, pasando revisión técnica, financiera y gerencial.

Resultado: VERIFICADO POR EJECUCIÓN hasta esa etapa; cierre posterior VERIFICADO POR EJECUCIÓN en md/fase-4-1.md y VERIFICADO POR INSPECCIÓN en el código actual.

### Flujo 5 — F3/F4 propuesta, legal y firma

generateEconomicProposal() crea snapshot; sendProposalToClient() lleva a CLIENT_REVIEW; Cliente aprueba o solicita cambios; Legal revisa y genera contrato; approveContractForSignature() libera; signContract() registra dos roles y transita a SIGNED/AWARDED.

Resultado: propuesta y envío VERIFICADO POR EJECUCIÓN en la sesión actual; Cliente → Legal → firmas → AWARDED VERIFICADO POR EJECUCIÓN histórica en md/fase-4-1.md. El click de aprobación Cliente de la nueva sesión tuvo timeout y no se repitió.

### Flujo 6 — resetDemo

Rol interno → reset-demo → resetDemo() → confirmación → restauración de mockDB/appState desde demoInitialSnapshot → renderApp(). Cliente es rechazado.

Resultado: VERIFICADO POR INSPECCIÓN. No se ejecutó la acción destructiva sobre la sesión de prueba.

## Flujos E2E: happy path y ruta alternativa

### Happy path

Presupuestista agrega APU → envía a revisión técnica → Revisor Técnico aprueba → Director Financiero aprueba → Gerente General aprueba → Presupuestista genera y envía propuesta → Cliente aprueba → Oficial Legal revisa y genera contrato → Gerente General y Cliente firman → workflow llega a SIGNED y luego AWARDED. Cada mutación relevante genera audit event y cada etapa se refleja en workflow, Dashboard y Audit Trail.

Estado de evidencia: hasta propuesta enviada VERIFICADO POR EJECUCIÓN en esta iteración; tramo de Cliente, Legal y firmas VERIFICADO POR EJECUCIÓN en md/fase-4-1.md y VERIFICADO POR INSPECCIÓN en el runtime actual.

### Ruta alternativa: rechazo interno

Presupuestista envía a revisión → el rol revisor/financiero/gerencial rechaza con motivo obligatorio → la función de decisión registra aprobación negativa, comentario y estado REJECTED → la transición retorna a BUDGETING → el Dashboard crea alerta WARNING/CRITICAL según estado y Audit Trail muestra la secuencia. Esta ruta existe en rejectTechnicalReview(), rejectFinancialReview(), rejectManagementReview() y changeWorkflowStage().

Estado de evidencia: VERIFICADO POR INSPECCIÓN en el código; ejecución completa de esta rama no se repitió en la sesión F5.

### Ruta alternativa: cambios del Cliente

Cliente recibe propuesta → requestClientChanges() exige motivo → la propuesta pasa a CHANGES_REQUESTED → el workflow retorna a BUDGETING mediante workflow:changes-return → se puede generar una nueva versión. El historial anterior permanece en documents y auditLog.

Estado de evidencia: VERIFICADO POR INSPECCIÓN; el flujo de versionado y cambios está documentado con ejecución previa en md/fase-4-1.md.

## Estado y gestión de datos

### Relación Estado → Función → Renderer → DOM

| Estado | Función | Renderer | DOM |
|---|---|---|---|
| data.apus y filtros | filterApus(), addApuToBudget() | renderFilters(), renderApuCatalog() | apuSearch, categoryFilter, unitFilter, apuCatalogBody |
| budget.items | alta/baja/cantidad | renderBudgetItems() | budgetItemsBody, budgetFooter |
| settings y totals | updateEconomicSetting(), calculateBudgetTotals() | renderBudgetSummary(), renderSettings() | summaryMetrics, summaryBreakdown, economic-settings-container |
| workflow | changeWorkflowStage() | renderWorkflowView(), renderHeader(), renderSidebar() | workflow-view-container, headerWorkflowStage, sidebarWorkflowStatus |
| documents/signatures | engines F4 | renderDocumentsView(), renderClientPortalView(), renderLegalView() | sus contenedores |
| data.auditLog | buildAuditTimeline(), calculateAuditKPIs() | renderAuditView() | audit-view-container, audit* filters |
| workflow/finanzas/scenario/risk/docs/audit | calculateExecutiveKPIs() | renderDashboardView() | dashboard-view-container |

### DOM Contract

IDs nuevos: dashboard-section, dashboard-view-container, audit-section, audit-view-container, headerWorkflowOwner, reset-demo-button, auditRoleFilter, auditActionFilter, auditEntityFilter, auditCategoryFilter, auditStageFilter, auditSearch y auditEventCount.

Acciones nuevas: reset-demo. Se conservan todas las acciones de F1–F4.

## Router y vistas

getViewPermission() asigna dashboard:view a dashboard y audit:view a audit. canViewForRole() aplica ese permiso contra rolePermissions. navigateTo() solo permite nombres presentes en supportedViews, cambia activeView, invoca viewRegistry y usa estos targets: dashboard-section, catalog-section, budget-section, summary-section, workflow-section, scenarios-section, client-portal-section, documents-section, legal-section y audit-section.

viewRegistry contiene renderDashboardView() y renderAuditView() además de los ocho renderers anteriores. renderCurrentView() llama el renderer registrado y updateNavigation(). La navegación es SPA en el sentido del contrato existente: no cambia URL ni recarga la página; cambia vista y desplaza secciones del mismo DOM.

## Workflow y aprobaciones

Estados reales: DRAFT, IN_REVIEW, APPROVED, REJECTED, READY, SENT, VIEWED, CHANGES_REQUESTED, SIGNED, AWARDED.

Etapas reales: BUDGETING, TECHNICAL_REVIEW, FINANCIAL_REVIEW, MANAGEMENT_REVIEW, READY_FOR_CLIENT, PROPOSAL_READY, CLIENT_REVIEW, CHANGES_REQUESTED, CLIENT_APPROVED, LEGAL_REVIEW, CONTRACT_READY, SIGNATURE_PENDING, SIGNED, AWARDED.

changeWorkflowStage() contiene las transiciones y permisos reales:

| Origen | Destino | Permiso |
|---|---|---|
| BUDGETING | TECHNICAL_REVIEW | workflow:submit-technical |
| TECHNICAL_REVIEW | FINANCIAL_REVIEW / BUDGETING | workflow:technical-approve / workflow:technical-reject |
| FINANCIAL_REVIEW | MANAGEMENT_REVIEW / BUDGETING | workflow:financial-approve / workflow:financial-reject |
| MANAGEMENT_REVIEW | READY_FOR_CLIENT / BUDGETING | workflow:management-approve / workflow:management-reject |
| READY_FOR_CLIENT | PROPOSAL_READY | proposal:generate |
| PROPOSAL_READY | CLIENT_REVIEW | proposal:send |
| CLIENT_REVIEW | CLIENT_APPROVED / CHANGES_REQUESTED | workflow:client-approve / workflow:client-request-changes |
| CHANGES_REQUESTED | BUDGETING | workflow:changes-return |
| CLIENT_APPROVED | LEGAL_REVIEW | workflow:legal-review |
| LEGAL_REVIEW | CONTRACT_READY / BUDGETING | workflow:legal-approve / workflow:legal-request-changes |
| CONTRACT_READY | SIGNATURE_PENDING | contract:approve-signature |
| SIGNATURE_PENDING | SIGNED | contract:sign |
| SIGNED | AWARDED | contract:sign |

renderDashboardWorkflowTimeline() muestra COMPLETED, CURRENT, PENDING o REJECTED. La duración se deriva de budget.createdAt y metadata de WORKFLOW_STAGE_CHANGED; si falta timestamp muestra Sin datos.

## Auditoría

logAuditEvent() guarda id, timestamp, userId, role, action, entity, entityId, description y metadata opcional. buildAuditTimeline() clona y ordena; getAuditEventCategory() produce BUDGET, WORKFLOW, ROLE, SCENARIO, DOCUMENT, CLIENT, LEGAL, SIGNATURE o SYSTEM.

Eventos destacados: WORKFLOW_STAGE_CHANGED, DOCUMENT_SIGNED, CONTRACT_SIGNED y PROJECT_AWARDED. No se genera ruido de render/KPI.

## KPI ejecutivo, Dashboard y Audit Trail

Dashboard interno muestra:

- proyecto, cliente, total ofrecido, escenario, etapa, responsable y progreso;
- costo directo, gastos generales, imprevistos, utilidad, IVA, margen y ahorro;
- riesgo y APUs críticos cuando existe dashboard:risk;
- top cost drivers y distribución por categoría;
- aprobaciones, rechazos, ciclo, documentos, contrato, firmas y adjudicación;
- alertas deterministas y actividad reciente;
- timeline con estados y duraciones.

Cliente ve únicamente total comercial, propuesta, contrato, firmas y resultado. No ve margen, referencias, riesgo económico, comentarios internos ni AuditLog.

Audit Trail lee solo appState.data.auditLog. Los filtros no modifican los eventos. La vista vacía es No existen eventos de auditoría registrados.

## Dependencias internas

Dashboard depende de getExecutiveSummary(), calculateExecutiveKPIs(), getTopCostDrivers(), getCostDistributionByCategory(), getCriticalApus(), getRecentAuditEvents() y getExecutiveAlerts(). Los KPI dependen de los engines F1–F4; no crean bases paralelas.

## Verificación contra código

Revisados: index.html completo, los cuatro AGENTS aplicables, package.json, vite.config.js y snapshots previos.

Comprobaciones directas:

- supportedViews contiene dashboard y audit.
- getViewPermission() exige dashboard:view y audit:view.
- rolePermissions asigna permisos internos explícitos.
- viewRegistry conecta ambos renderers.
- renderApp() y refreshWorkflowDependentViews() los llaman.
- handlers conectan navegación, filtros y reset.
- logAuditEvent() conserva llamadas anteriores y acepta metadata.
- changeWorkflowStage() registra etapa y estado.
- No hay referencias getElementById() a IDs estáticos inexistentes.
- El DOM real no mostró IDs duplicados.
- new Function(script) validó sintaxis.

## Verificación funcional

| Prueba | Evidencia |
|---|---|
| npm run build | VERIFICADO POR EJECUCIÓN: Vite terminó correctamente |
| 20 APUs | VERIFICADO POR EJECUCIÓN |
| Búsqueda MT-001 | VERIFICADO POR EJECUCIÓN: 1 resultado |
| Filtros combinados | VERIFICADO POR EJECUCIÓN: 2 resultados |
| Incremento sin duplicar | VERIFICADO POR EJECUCIÓN: una fila, quantity 2 |
| Decimal | VERIFICADO POR EJECUCIÓN: subtotal $15,63 |
| Eliminar | VERIFICADO POR EJECUCIÓN: cero filas |
| Dashboard con datos | VERIFICADO POR EJECUCIÓN: total $17,39 |
| Audit event | VERIFICADO POR EJECUCIÓN: BUDGET_ITEM_ADDED/BUDGET |
| RBAC Cliente | VERIFICADO POR EJECUCIÓN: Dashboard comercial y Audit rechazado |
| Workflow técnico-financiero-gerencial | VERIFICADO POR EJECUCIÓN |
| Propuesta y envío | VERIFICADO POR EJECUCIÓN |
| Cierre Cliente/Legal/firma | NO VERIFICADO en la última sesión; VERIFICADO POR EJECUCIÓN en snapshot F4 |
| Consistencia DOM | VERIFICADO POR EJECUCIÓN: sin IDs duplicados |
| Sentinelas visibles | VERIFICADO POR EJECUCIÓN: sin undefined, NaN, Infinity o null |
| resetDemo | VERIFICADO POR INSPECCIÓN; no se ejecutó confirmación destructiva |

La consola no mostró errores de runtime. Reportó el warning preexistente de cdn.tailwindcss.com. No existen llamadas de aplicación a APIs ni motor de notificaciones.

## Estado final del hackathon

La demo Fase 5 comunica tres métricas de producto sin confundirlas con mediciones del estado actual: ciclo tradicional de 3 semanas, objetivo de plataforma de 48 horas y reducción estimada de aproximadamente 90%. El Dashboard presenta además el ciclo real cuando existen timestamps. En un seed vacío el total financiero es cero y el ciclo global indica Sin datos suficientes; no se inventan valores para aparentar una adjudicación.

La entrega queda lista para revisión del Tech Lead en cuanto a código, contratos DOM, RBAC, engines y documentación. No se inicia Fase 6.

## Limitaciones actuales

1. Estado en memoria; reload vuelve al seed.
2. Un usuario demo; cambiar rol no autentica otra identidad.
3. resetDemo() no persiste snapshots entre sesiones.
4. El ciclo real depende de timestamps disponibles; 48 horas es objetivo, no medición.
5. La etapa actual usa Date.now() desde el último timestamp conocido.
6. getExecutiveAlerts() solo renderiza objetos locales; no notifica externamente.
7. AuditLog no es almacén append-only de servidor ni exportable.
8. Documentos y firmas son demo; no hay PDF ni firma electrónica.
9. Tailwind se carga desde CDN; debe empaquetarse para producción aislada.
10. src/ no está conectado al runtime.
11. El click de aprobación Cliente de la última sesión agotó tiempo; no se afirma nueva ejecución completa.

## Cambios de esta iteración

1. Se añadieron las dos vistas, sus secciones DOM, router y viewRegistry.
2. Se añadieron permisos dashboard:view, dashboard:internal, dashboard:financial, dashboard:risk y audit:view.
3. Se añadió headerWorkflowOwner y reset-demo-button.
4. Se implementaron las ocho funciones KPI solicitadas.
5. Se implementaron resumen, alertas, recientes, categorías, timeline, consistencia y health.
6. Se implementaron renderDashboardView(), renderDashboardWorkflowTimeline() y renderAuditView().
7. Se conectaron filtros Audit a input/change.
8. Se añadió metadata de workflow en logAuditEvent()/changeWorkflowStage().
9. Se añadió demoInitialSnapshot/resetDemo().
10. Se actualizó el footer a Fase 5.
11. No se agregaron paquetes, backend, APIs ni eventos de tracking.

## Inconsistencias encontradas y corregidas

1. dashboard y audit estaban en futureViews y no eran navegables; se pasaron a supportedViews y viewRegistry.
2. No había permisos analíticos; se añadieron por rol con exclusión explícita de Cliente para audit/internal/financial/risk.
3. Header no mostraba responsable; se añadió el DOM y su renderer.
4. Workflow no guardaba metadata temporal; se añadió de forma compatible.
5. No había reset determinista; se añadió snapshot y restore protegido.
6. Footer decía Fase 4; se corrigió a Fase 5.

## Impacto técnico de esta iteración

Archivo de runtime afectado: index.html. Archivo documental nuevo: md/fase-5-1.md. No se alteró md/fase-4-1.md.

Se conservaron aliases, handlers, fórmulas, transiciones y contratos de F1–F4. El único cambio de firma es el quinto argumento opcional de logAuditEvent(). No se añadieron dependencias npm.

Riesgos: cambios futuros en nombres de acciones pueden requerir actualizar getAuditEventCategory(); timestamps demo fijos pueden producir duraciones distintas con otra fecha del sistema; los engines F3 actualizan métricas derivadas de escenario cuando el Dashboard calcula.

## Compatibilidad

Compatible con el build Vite existente y navegadores modernos. No requiere React para este runtime. Cliente conserva Portal Cliente como vista por defecto; puede abrir Dashboard comercial sin datos internos. Se mantienen mockDB, appState y aliases de Fase 1.

## Preparación para siguientes fases

No se inició Fase 6. Si se autoriza una fase posterior, debe reutilizar appState.data.auditLog, calculateExecutiveKPIs(), validateAppStateConsistency(), rolePermissions y el DOM Contract. No se debe crear otro estado paralelo.

Pendientes de Fase 2: ninguno de los flujos F2 documentados queda sin código; el cierre Cliente → Legal → firma solo requiere repetir la prueba completa en una sesión estable para confirmar evidencia de ejecución de esta iteración.

## Próxima fase

No se implementa próxima fase. Persistencia, autenticación, exportación Audit, notificaciones, PDF, firma electrónica y migración de runtime son trabajo futuro no presente en este snapshot.

## Arquitectura Producción / Homelab

Hoy: Vite, estado en memoria, seed determinista, sin API/base de datos/autenticación/scheduler. Tailwind depende de CDN.

Producción/Homelab requeriría API, base de datos, autenticación de servidor, audit append-only, almacenamiento documental, firmas, métricas de servidor y assets empaquetados. Ninguno se implementó.

## Contrato para la siguiente iteración

Conservar appState.data como fuente normalizada, mockDB como seed, hasPermission() y guards de negocio, logAuditEvent() solo para mutaciones, dashboard/audit en supportedViews/viewRegistry, Dashboard como consumidor de KPI y Audit como lector sin mutación. Mantener la condición AWARDED: etapa y estado AWARDED más firmas requeridas completas. No sobrescribir snapshots históricos.

## Secuencia recomendada de demo

1. Iniciar en Dashboard con Presupuestista.
2. Mostrar proyecto, total, etapa, responsable y objetivo 48 horas separado del ciclo real.
3. Abrir catálogo, mostrar 20 APUs y aplicar filtros.
4. Agregar un APU y volver al Dashboard para mostrar total, margen, ahorro, drivers, distribución y riesgo.
5. Enviar a revisión técnica; cambiar a Revisor Técnico, Director Financiero y Gerente General para decidir.
6. Generar y enviar propuesta.
7. Cambiar a Cliente y mostrar Portal/Dashboard comercial sin margen, riesgo interno ni AuditLog.
8. Aprobar propuesta o ejecutar solicitud de cambios.
9. Cambiar a Oficial Legal, aprobar legal, generar contrato y liberar firma.
10. Firmar como Gerente General y Cliente; mostrar SIGNED y luego AWARDED.
11. Abrir Dashboard interno y mostrar documentos, firmas, adjudicación y alertas.
12. Abrir Audit Trail y filtrar eventos, incluida la adjudicación.
13. Usar Restablecer demo solo cuando se quiera volver a la semilla.

