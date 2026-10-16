# Fase 2 — Iteración 1

## Identificación

- Fase: 2
- Iteración: 1
- Archivo nuevo: md/fase-2-1.md
- Snapshot anterior: md/fase-1-2.md
- Fecha: 2026-10-16
- Runtime auditado: index.html con JavaScript inline.
- Alcance: RBAC demo, cambio de rol, workflow, revisiones, aprobaciones, rechazos, comentarios, bloqueo de edición y trazabilidad.
- Fase 3: no iniciada.

No se sobrescribieron md/fase-1-1.md ni md/fase-1-2.md. La aplicación React existente en src no fue reemplazada ni migrada; el runtime efectivo sigue siendo index.html, que es el archivo servido por Vite.

## Resumen ejecutivo técnico

Fase 2 extiende el estado, los engines, los renderers y los handlers existentes de Fase 1. El flujo actual conserva:

mockDB → appState → Business Engines → Renderers → DOM

Para las acciones sensibles se implementó:

DOM EVENT → HANDLER → RBAC → VALIDACIÓN → MUTACIÓN DEL ESTADO → WORKFLOW → AUDIT LOG → RENDER PARCIAL

### IMPLEMENTADO Y FUNCIONAL

- rolePermissions contiene reglas explícitas para los seis roles.
- hasPermission se aplica en engines y handlers de edición, workflow y comentarios.
- switchRole cambia appState.session.currentRole, registra ROLE_SWITCHED y actualiza header, sidebar, catálogo, presupuesto, settings y Workflow.
- workflowTransitions restringe las etapas válidas.
- submitForTechnicalReview valida presupuesto, items, total y permiso.
- Revisor Técnico puede aprobar o rechazar en TECHNICAL_REVIEW.
- Director Financiero puede aprobar o rechazar en FINANCIAL_REVIEW.
- Gerente General puede aprobar o rechazar en MANAGEMENT_REVIEW.
- Los rechazos exigen motivo y regresan a BUDGETING con status REJECTED.
- La aprobación gerencial lleva a READY_FOR_CLIENT con status APPROVED.
- appState.data.approvals conserva cada decisión y appState.data.comments conserva comentarios.
- renderWorkflowView muestra etapa, status, timeline, responsable, decisiones, comentarios y acciones del rol actual.
- Fase 1 continúa funcionando: catálogo, búsqueda, filtros, presupuesto, cantidades decimales, eliminación, settings, cálculos, navegación existente y AuditLog anterior.

### IMPLEMENTADO PARCIALMENTE

- RBAC es funcional en la demo local, pero no es autenticación ni autorización de backend.
- El cambio de rol es una simulación de Hackathon: modifica la sesión en memoria, no identidad real.
- La vista Workflow es una sección SPA con scroll; no hay rutas URL ni persistencia.
- Cliente y Oficial Legal participan en el selector y reciben una vista informativa, pero no aprueban, firman ni gestionan documentos.
- La UI oculta o deshabilita acciones de edición, pero el acceso sigue dependiendo también de los guards de engine; no existe una capa de servidor.

### PLACEHOLDER ESTRUCTURAL

- documents[].
- scenarios[] dentro del presupuesto.
- APP_CONFIG.futureViews para escenarios, cliente, documentos, legal, auditoría y dashboard.
- workflow.approvals como lista de IDs de compatibilidad; los registros completos viven en appState.data.approvals.
- Integraciones PostgreSQL, MinIO, DocuSeal, Cal.com, n8n y Keycloak.

### NO IMPLEMENTADO

- Autenticación real, SSO y autorización backend.
- Aprobación real del Cliente.
- Contratos, documentos, firma, adjudicación y Legal Engine.
- Scenario Engine, Price Intelligence, Variance Engine y Risk Engine.
- Audit Trail visual completo, filtros históricos, KPIs y dashboard.
- Persistencia entre recargas, API y concurrencia.

## Estado general de implementación

| Área | Estado | Código real | Resultado actual | No implementado |
|---|---|---|---|---|
| mockDB y appState | IMPLEMENTADO Y FUNCIONAL | mockDB, hydrateStateFromMockDB, appState y aliases | Datos y sesión en memoria conectados | Persistencia |
| Roles y permisos | IMPLEMENTADO Y FUNCIONAL | rolePermissions, hasPermission, canEditBudget y guards | Seis roles con acciones diferenciadas | Auth backend |
| Cambio de rol | IMPLEMENTADO Y FUNCIONAL | switchRole, renderRoleSwitcher | Selector visible, sesión, rerender y auditoría | Identidad real |
| Workflow | IMPLEMENTADO Y FUNCIONAL | constantes, workflowTransitions, canTransitionTo y changeWorkflowStage | Etapas, status y transiciones validadas | Workflow distribuido |
| Revisión técnica | IMPLEMENTADO Y FUNCIONAL | submitForTechnicalReview, approveTechnicalReview, rejectTechnicalReview | Envío, aprobación y rechazo con motivo | Integración técnica externa |
| Revisión financiera | IMPLEMENTADO Y FUNCIONAL | approveFinancialReview, rejectFinancialReview | Aprobación y rechazo con motivo | Firma financiera real |
| Aprobación gerencial | IMPLEMENTADO Y FUNCIONAL | approveManagementReview, rejectManagementReview | Llegada a READY_FOR_CLIENT o retorno | Aprobación real |
| Cliente | IMPLEMENTADO PARCIALMENTE | permisos proposal:read, renderWorkflowActions | Visualiza mensaje informativo | Aprobación cliente |
| Legal | IMPLEMENTADO PARCIALMENTE | permisos legal:read, renderWorkflowActions | Visualiza estado informativo | Documentos y firma |
| Approvals | IMPLEMENTADO Y FUNCIONAL | createApprovalRecord, appState.data.approvals | Historial inmutable durante la sesión | Persistencia |
| Comments | IMPLEMENTADO Y FUNCIONAL | addWorkflowComment, getWorkflowComments | Mensajes sanitizados, ordenados y renderizados | Moderación y persistencia |
| AuditLog Fase 1 | IMPLEMENTADO Y FUNCIONAL | logAuditEvent y eventos existentes | Alta, baja, cantidades y settings conservados | Audit Trail visual |
| AuditLog Fase 2 | IMPLEMENTADO Y FUNCIONAL | logAuditEvent desde workflow y roles | ROLE_SWITCHED, transiciones, decisiones y comments | Consulta visual |
| React/Vite como runtime Fase 2 | IMPLEMENTADO PARCIALMENTE | src existe, index.html no monta src/main.jsx | Runtime inline funcional con Vite | Decisión de convergencia |

## Cómo funciona actualmente

El navegador carga index.html y ejecuta initializeApp. hydrateStateFromMockDB clona mockDB en appState.data. initializeApp carga las 20 APUs, renderApp pinta Fase 1 y renderWorkflowView pinta la nueva sección.

El selector roleSwitcher genera sus seis opciones a partir de mockDB.roles. Un change llama switchRole. La función valida que el rol esté declarado y tenga una entrada en rolePermissions, cambia appState.session.currentRole, registra ROLE_SWITCHED y repinta la UI dependiente de permisos.

El usuario Presupuestista crea el presupuesto en BUDGETING. submitForTechnicalReview exige items, grandTotal finito y mayor que cero, permiso workflow:submit-technical y transición BUDGETING → TECHNICAL_REVIEW. changeWorkflowStage cambia workflow.currentStage y workflow.status, copia el status al presupuesto, sincroniza mockDB y registra WORKFLOW_STAGE_CHANGED. Después submitForTechnicalReview registra WORKFLOW_SUBMITTED_TECHNICAL.

Cada revisor se selecciona mediante el selector demo. Los wrappers approveTechnicalReview, rejectTechnicalReview, approveFinancialReview, rejectFinancialReview, approveManagementReview y rejectManagementReview llaman completeWorkflowDecision. Esa función valida usuario, rol, etapa, permiso, transición y motivo si es rechazo; crea un Approval Record; cambia la etapa; escribe el evento específico de decisión y actualiza la vista.

addWorkflowComment valida comments:create, elimina caracteres de etiqueta, exige texto no vacío, asocia budgetId, etapa, userId, role y createdAt, escribe en appState.data.comments y mockDB.comments, genera WORKFLOW_COMMENT_ADDED y renderiza de nuevo.

Las funciones de edición de Fase 1 ahora llaman canEditBudget además de su permiso específico. Por tanto, aunque una llamada directa intente agregar APU, eliminar, editar cantidad o cambiar settings durante una revisión, el engine la rechaza.

## Arquitectura global

### Estado heredado

- mockDB conserva users, roles, clients, projects, apus, budgets, documents, comments, approvals y auditLog.
- appState conserva session, ui, filters, data, IDs actuales, settings y workflow.
- appState.data.approvals y appState.data.comments son las colecciones canónicas de Fase 2.
- appState.workflow.approvals contiene IDs de Approval Records para mantener la estructura existente; no contiene una copia completa.

### Capas de seguridad funcional

1. La UI consulta permisos y etapa para mostrar botones de edición y acciones de workflow.
2. El engine vuelve a consultar permiso, rol, etapa, transición y datos obligatorios.
3. Solo después de pasar ambas capas se muta el estado.

La UI no es la única barrera. addApuToBudget, removeBudgetItem, updateBudgetItemQuantity, updateEconomicSetting, changeWorkflowStage, completeWorkflowDecision y addWorkflowComment contienen validaciones de engine.

## Estructura física del proyecto

- index.html: runtime efectivo y archivo modificado.
- md/fase-1-1.md: snapshot histórico de Fase 1, no modificado.
- md/fase-1-2.md: auditoría anterior de Fase 1, no modificada.
- md/fase-2-1.md: este snapshot.
- md/AGENTS.md: reglas de documentación aplicadas.
- AGENTS.md: reglas de arquitectura aplicadas.
- src/main.jsx y src/App.jsx: aplicación React existente, no consumida por el index.html actual.
- src/components, src/data y src/utils: aplicación React existente, no modificada.
- vite.config.js: configuración Vite existente.
- tests/AGENTS.md: reglas de QA; no hay suite persistente.

## Datos y modelos actuales

### rolePermissions

| Rol | Permisos reales |
|---|---|
| Presupuestista | apu:read, budget:read, budget:write, budget:delete, budget:quantity, settings:write, workflow:submit-technical, comments:create |
| Revisor Técnico | budget:read, workflow:technical-review, workflow:technical-approve, workflow:technical-reject, comments:create |
| Director Financiero | budget:read, workflow:financial-review, workflow:financial-approve, workflow:financial-reject, comments:create |
| Gerente General | budget:read, workflow:management-review, workflow:management-approve, workflow:management-reject, comments:create |
| Cliente | budget:read, proposal:read |
| Oficial Legal | budget:read, legal:read |

hasPermission busca el rol actual en esta matriz. La entrada no existente o permiso no incluido devuelve false.

### Estados Workflow

| Status | Etapa típica | Significado observable |
|---|---|---|
| DRAFT | BUDGETING | Presupuesto en edición inicial |
| IN_REVIEW | TECHNICAL_REVIEW, FINANCIAL_REVIEW o MANAGEMENT_REVIEW | Decisión pendiente del responsable de la etapa |
| REJECTED | BUDGETING | Una revisión rechazó el presupuesto; el Presupuestista puede corregirlo |
| APPROVED | READY_FOR_CLIENT | Aprobación gerencial completada; la aceptación del Cliente no existe en Fase 2 |

Las constantes WORKFLOW_STATUS y WORKFLOW_STAGE evitan strings de etapa y status dispersos.

### Etapas y responsables

| Etapa | Responsable actual | Acciones de Fase 2 |
|---|---|---|
| BUDGETING | Presupuestista | editar presupuesto y enviar a revisión técnica |
| TECHNICAL_REVIEW | Revisor Técnico | aprobar, rechazar con motivo y comentar |
| FINANCIAL_REVIEW | Director Financiero | aprobar, rechazar con motivo y comentar |
| MANAGEMENT_REVIEW | Gerente General | aprobar, rechazar con motivo y comentar |
| READY_FOR_CLIENT | Cliente | solo estado informativo; no acepta |

### Transiciones permitidas

workflowTransitions contiene exactamente:

- BUDGETING → TECHNICAL_REVIEW.
- TECHNICAL_REVIEW → FINANCIAL_REVIEW.
- TECHNICAL_REVIEW → BUDGETING.
- FINANCIAL_REVIEW → MANAGEMENT_REVIEW.
- FINANCIAL_REVIEW → BUDGETING.
- MANAGEMENT_REVIEW → READY_FOR_CLIENT.
- MANAGEMENT_REVIEW → BUDGETING.
- READY_FOR_CLIENT no tiene salidas.

canTransitionTo verifica la lista central y el permiso canónico de la transición. changeWorkflowStage repite las validaciones, actualiza estado y sincroniza el presupuesto. No existe asignación arbitraria de currentStage desde la UI.

### Approval schema

Cada registro de appState.data.approvals tiene:

    {
      id,
      budgetId,
      stage,
      decision,
      userId,
      role,
      comment,
      createdAt
    }

decision solo puede ser APPROVED o REJECTED. createApprovalRecord rechaza presupuesto ajeno, etapa distinta, decisión desconocida, usuario inválido, rol sin permiso o rechazo sin comentario. Los registros existentes no se eliminan.

### Comment schema

Cada registro de appState.data.comments tiene:

    {
      id,
      budgetId,
      stage,
      userId,
      role,
      message,
      createdAt
    }

addWorkflowComment recorta a 1000 caracteres, elimina < y >, exige message.trim().length mayor que cero, asocia la etapa actual y conserva el orden por createdAt en getWorkflowComments.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| rolePermissions de seis roles | IMPLEMENTADO Y FUNCIONAL | rolePermissions y hasPermission | Acciones derivadas por rol | Cambio de rol modifica permisos | VERIFICADO POR EJECUCIÓN | 2 |
| Cambio de rol | IMPLEMENTADO Y FUNCIONAL | switchRole, renderRoleSwitcher | roleSwitcher en header | change sobre selector | VERIFICADO POR EJECUCIÓN | 2 |
| Bloqueo de edición | IMPLEMENTADO Y FUNCIONAL | canEditBudget en cuatro engines | botones ocultos y inputs disabled en revisión | Llamadas directas son rechazadas | VERIFICADO POR EJECUCIÓN | 2 |
| Estados de workflow | IMPLEMENTADO Y FUNCIONAL | WORKFLOW_STATUS, WORKFLOW_STAGE | header, sidebar y Workflow | status/currentStage se actualizan | VERIFICADO POR EJECUCIÓN | 2 |
| Transiciones | IMPLEMENTADO Y FUNCIONAL | workflowTransitions, canTransitionTo, changeWorkflowStage | acciones específicas por etapa | solo transiciones permitidas | VERIFICADO POR EJECUCIÓN | 2 |
| Submit técnico | IMPLEMENTADO Y FUNCIONAL | submitForTechnicalReview | botón del Presupuestista | valida items y grandTotal | VERIFICADO POR EJECUCIÓN | 2 |
| Revisión técnica | IMPLEMENTADO Y FUNCIONAL | approveTechnicalReview, rejectTechnicalReview | panel del Revisor Técnico | avance o retorno con motivo | VERIFICADO POR EJECUCIÓN | 2 |
| Revisión financiera | IMPLEMENTADO Y FUNCIONAL | approveFinancialReview, rejectFinancialReview | panel del Director Financiero | avance o retorno con motivo | VERIFICADO POR EJECUCIÓN | 2 |
| Aprobación gerencial | IMPLEMENTADO Y FUNCIONAL | approveManagementReview, rejectManagementReview | panel del Gerente General | READY_FOR_CLIENT o retorno | VERIFICADO POR EJECUCIÓN | 2 |
| Approval Records | IMPLEMENTADO Y FUNCIONAL | createApprovalRecord | decisiones anteriores en Workflow | conserva aprobaciones y rechazos | VERIFICADO POR EJECUCIÓN | 2 |
| Comentarios | IMPLEMENTADO Y FUNCIONAL | addWorkflowComment, getWorkflowComments | textarea y lista de comentarios | validación, sanitización y render | VERIFICADO POR EJECUCIÓN | 2 |
| Vista Workflow | IMPLEMENTADO Y FUNCIONAL | renderWorkflowView, renderWorkflowTimeline, renderWorkflowActions, renderWorkflowComments | navegación Workflow y panel | cambia según etapa/rol | VERIFICADO POR EJECUCIÓN e inspección | 2 |
| Timeline | IMPLEMENTADO Y FUNCIONAL | renderWorkflowTimeline deriva estado de stage y approvals | cinco etapas con COMPLETED, CURRENT, PENDING o REJECTED | actualiza al cambiar stage | VERIFICADO POR INSPECCIÓN y runtime | 2 |
| AuditLog de Fase 1 | IMPLEMENTADO Y FUNCIONAL | logAuditEvent conservado | sin Audit Trail visual | eventos anteriores siguen escritos | VERIFICADO POR EJECUCIÓN | 1/2 |
| AuditLog de Fase 2 | IMPLEMENTADO Y FUNCIONAL | llamadas desde switchRole, changeWorkflowStage, decisions y comments | no hay listado visual | diez clases de eventos trazables | VERIFICADO POR EJECUCIÓN | 2 |
| Cliente y Legal | IMPLEMENTADO PARCIALMENTE | permisos y ramas informativas en renderWorkflowActions | selector y mensajes de estado | no pueden editar ni decidir | VERIFICADO POR EJECUCIÓN e inspección | 2; completar en 4 |
| Documents | PLACEHOLDER ESTRUCTURAL | documents[] heredado | sin UI | ninguna operación | VERIFICADO POR INSPECCIÓN | 4 |
| Scenarios | PLACEHOLDER ESTRUCTURAL | budget.scenarios vacío | sin UI | ningún cálculo | VERIFICADO POR INSPECCIÓN | 3 |
| Documentos, firma y contratos | NO IMPLEMENTADO | no hay engine de negocio | no hay controles | no existe flujo | VERIFICADO POR INSPECCIÓN | 4/5 |

## Roles y estado RBAC

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí, mockDB.roles y session | Sí: edición Fase 1, submit técnico y comments:create | Selector, edición en BUDGETING y panel submit | Agrega, elimina, cambia cantidades/settings, comenta y envía | IMPLEMENTADO Y FUNCIONAL |
| Revisor Técnico | Sí | Sí: review, approve, reject y comments:create | Panel de acciones solo en TECHNICAL_REVIEW | Aprueba, rechaza con motivo y comenta en su etapa | IMPLEMENTADO Y FUNCIONAL |
| Director Financiero | Sí | Sí: review, approve, reject y comments:create | Panel de acciones solo en FINANCIAL_REVIEW | Aprueba, rechaza con motivo y comenta en su etapa | IMPLEMENTADO Y FUNCIONAL |
| Gerente General | Sí | Sí: review, approve, reject y comments:create | Panel de acciones solo en MANAGEMENT_REVIEW | Aprueba, rechaza con motivo y comenta en su etapa | IMPLEMENTADO Y FUNCIONAL |
| Cliente | Sí | Sí: budget:read y proposal:read | Selector y mensaje informativo | Puede consultar la vista; no aprueba ni edita | IMPLEMENTADO PARCIALMENTE |
| Oficial Legal | Sí | Sí: budget:read y legal:read | Selector y mensaje informativo | Puede consultar el estado; no crea documentos ni edita | IMPLEMENTADO PARCIALMENTE |

El selector no crea usuarios ni cambia la entidad user.role de USR-001; cambia únicamente appState.session.currentRole, que es la sesión demo evaluada por getCurrentRole. Esto conserva el usuario y permite simular los seis actores sin autenticación.

## Matriz de permisos

| Permiso | Roles con permiso | Control de engine | Control UI | Efecto |
|---|---|---|---|---|
| apu:read | Presupuestista | Declarado; catálogo sigue siendo lectura | No usado para ocultar catálogo | Lectura del catálogo demo |
| budget:read | Revisor Técnico, Director Financiero, Gerente General, Cliente, Oficial Legal, Presupuestista | Se usa como matriz de rol; el render común es de lectura | Vista común | Lectura del presupuesto |
| budget:write | Presupuestista | addApuToBudget + canEditBudget | Agregar visible solo en edición | Agregar/incrementar APU |
| budget:delete | Presupuestista | removeBudgetItem + canEditBudget | Eliminar visible solo en edición | Eliminar item |
| budget:quantity | Presupuestista | updateBudgetItemQuantity + canEditBudget | input habilitado solo en edición | Editar cantidad |
| settings:write | Presupuestista | updateEconomicSetting + canEditBudget | settings disabled fuera de edición | Cambiar porcentajes |
| workflow:submit-technical | Presupuestista | submitForTechnicalReview y canTransitionTo | botón en BUDGETING | Enviar a TECHNICAL_REVIEW |
| workflow:technical-review | Revisor Técnico | render del panel | panel en etapa técnica | Visibilidad de su panel |
| workflow:technical-approve | Revisor Técnico | completeWorkflowDecision y createApprovalRecord | approve-technical | Avanzar a FINANCIAL_REVIEW |
| workflow:technical-reject | Revisor Técnico | requiere motivo y transición | reject-technical | Volver a BUDGETING |
| workflow:financial-review | Director Financiero | render del panel | panel en etapa financiera | Visibilidad de su panel |
| workflow:financial-approve | Director Financiero | completeWorkflowDecision | approve-financial | Avanzar a MANAGEMENT_REVIEW |
| workflow:financial-reject | Director Financiero | requiere motivo y transición | reject-financial | Volver a BUDGETING |
| workflow:management-review | Gerente General | render del panel | panel en etapa gerencial | Visibilidad de su panel |
| workflow:management-approve | Gerente General | completeWorkflowDecision | approve-management | Avanzar a READY_FOR_CLIENT |
| workflow:management-reject | Gerente General | requiere motivo y transición | reject-management | Volver a BUDGETING |
| comments:create | Presupuestista, Revisor Técnico, Director Financiero, Gerente General | addWorkflowComment | textarea y botón Comentar | Crear comment |
| proposal:read | Cliente | No hay mutación de propuesta | mensaje de cliente | Lectura informativa |
| legal:read | Oficial Legal | No hay mutación legal | mensaje legal | Lectura informativa |

## Componentes principales

### index.html

- Responsabilidad: runtime de Fase 1 y Fase 2, markup, CSS, estado, engines, renderers y handlers.
- Estado: appState, mockDB, rolePermissions y workflow constants.
- UI nueva: roleSwitcher, navegación data-view=workflow, workflow-section, workflow-view-container, timeline, panel de acciones, textarea de rechazo y textarea de comentarios.
- Callbacks: handleAppClick, handleAppChange, handleAppInput y bindStaticEvents.
- Estado: IMPLEMENTADO Y FUNCIONAL para el flujo demo descrito.

### src/main.jsx, src/App.jsx y src/components

Estos archivos se revisaron como arquitectura existente, pero el index.html actual no contiene root ni script module. No se les atribuyen RBAC ni Workflow de Fase 2. No fueron modificados.

Estado: IMPLEMENTADO PARCIALMENTE respecto al repositorio completo; no son consumidores del runtime Fase 2.

## Funciones y utilidades principales

| Archivo y función | Entradas | Lee | Modifica / devuelve | Consumidores y efectos | Estado |
|---|---|---|---|---|---|
| index.html / switchRole | roleName | mockDB.roles, rolePermissions, session | currentRole y AuditLog | selector change; rerender general y toast | IMPLEMENTADO Y FUNCIONAL |
| index.html / canEditBudget | Ninguna | currentStage y budget:write | boolean | cuatro engines y renderers de edición | IMPLEMENTADO Y FUNCIONAL |
| index.html / canTransitionTo | nextStage y permiso opcional | currentStage, transitions, rolePermissions | boolean | submit, change y decisiones | IMPLEMENTADO Y FUNCIONAL |
| index.html / changeWorkflowStage | nextStage y options | presupuesto, etapa, permiso y status | workflow, budget.status, timestamps | registra WORKFLOW_STAGE_CHANGED y rerender | IMPLEMENTADO Y FUNCIONAL |
| index.html / submitForTechnicalReview | Ninguna | presupuesto, totals, etapa y permiso | etapa/status | botón del Presupuestista; registra submit | IMPLEMENTADO Y FUNCIONAL |
| index.html / completeWorkflowDecision | nextStage, permission, decision, comment | usuario, rol, etapa, transitions | Approval Record y workflow | wrappers de tres revisiones; registra decisión | IMPLEMENTADO Y FUNCIONAL |
| index.html / createApprovalRecord | budgetId, stage, decision, comment | presupuesto, etapa, permiso y user | data.approvals, mockDB.approvals, workflow.approvals | historial de decisiones | IMPLEMENTADO Y FUNCIONAL |
| index.html / addWorkflowComment | message | permiso, presupuesto, sesión, etapa | data.comments y mockDB.comments | textarea; AuditLog y render | IMPLEMENTADO Y FUNCIONAL |
| index.html / getWorkflowComments | Ninguna | comments y currentBudgetId | lista ordenada | renderWorkflowComments | IMPLEMENTADO Y FUNCIONAL |
| index.html / renderWorkflowView | Ninguna | workflow, approvals, comments y role | workflow-view-container.innerHTML | viewRegistry y rerenders | IMPLEMENTADO Y FUNCIONAL |
| index.html / renderWorkflowTimeline | Ninguna | stage y approvals | HTML derivado | renderWorkflowView | IMPLEMENTADO Y FUNCIONAL |
| index.html / renderWorkflowActions | Ninguna | role, stage, permissions | HTML derivado | renderWorkflowView | IMPLEMENTADO Y FUNCIONAL |
| index.html / renderWorkflowComments | Ninguna | comments y comments:create | HTML derivado | renderWorkflowView | IMPLEMENTADO Y FUNCIONAL |
| index.html / addApuToBudget | apuId | permiso, stage y presupuesto | items y totals | handler click; ahora bloquea fuera de BUDGETING | IMPLEMENTADO Y FUNCIONAL |
| index.html / removeBudgetItem | itemId | permiso, stage y presupuesto | items y totals | handler click; ahora bloquea fuera de BUDGETING | IMPLEMENTADO Y FUNCIONAL |
| index.html / updateBudgetItemQuantity | itemId, quantity, shouldAudit | permiso, stage e item | quantity, subtotal y totals | input/change; bloquea fuera de BUDGETING | IMPLEMENTADO Y FUNCIONAL |
| index.html / updateEconomicSetting | key, value, shouldAudit | permiso, stage y settings | settings y totals | input/change; bloquea fuera de BUDGETING | IMPLEMENTADO Y FUNCIONAL |
| index.html / logAuditEvent | action, entity, entityId, description | user, role y auditLog | appState.data.auditLog y mockDB.auditLog | todas las mutaciones auditadas | IMPLEMENTADO Y FUNCIONAL |
| index.html / renderRoleSwitcher | Ninguna | mockDB.roles y currentRole | roleSwitcher.innerHTML/value | renderApp y switchRole | IMPLEMENTADO Y FUNCIONAL |

## Flujos funcionales end-to-end

### Cambio de rol

1. Evento: change en roleSwitcher.
2. Handler: handleAppChange.
3. Función: switchRole.
4. Validación: roleName debe estar en mockDB.roles y rolePermissions.
5. Estado: appState.session.currentRole cambia.
6. Auditoría: ROLE_SWITCHED con rol anterior y nuevo.
7. Render: header, sidebar, catálogo, presupuesto, settings, workflow y navegación.
8. Resultado: la UI muestra acciones correspondientes al nuevo rol sin recargar.
9. Evidencia: VERIFICADO POR EJECUCIÓN.

### Flujo feliz completo

1. Presupuestista agrega APU y permanece en BUDGETING.
2. Presupuestista pulsa Enviar a revisión técnica; submitForTechnicalReview valida item y grandTotal.
3. Revisor Técnico cambia el selector de rol; approveTechnicalReview crea Approval APPROVED y avanza a FINANCIAL_REVIEW.
4. Director Financiero cambia el rol; approveFinancialReview avanza a MANAGEMENT_REVIEW.
5. Gerente General cambia el rol; approveManagementReview crea Approval APPROVED y avanza a READY_FOR_CLIENT con status APPROVED.
6. Cada etapa registra WORKFLOW_STAGE_CHANGED y el evento específico de submit o aprobación.
7. Evidencia: VERIFICADO POR EJECUCIÓN sin recargar página.

### Rechazo técnico, financiero y gerencial

1. El responsable de la etapa pulsa Rechazar.
2. handleAppClick toma workflowDecisionReason y llama al wrapper correspondiente.
3. completeWorkflowDecision sanitiza y exige motivo no vacío.
4. createApprovalRecord conserva decision REJECTED y comment.
5. changeWorkflowStage regresa a BUDGETING con status REJECTED.
6. El AuditLog recibe WORKFLOW_STAGE_CHANGED y el evento específico REJECTED.
7. renderWorkflowView muestra la decisión anterior y canEditBudget vuelve a ser verdadero solo para Presupuestista.
8. Evidencia: VERIFICADO POR EJECUCIÓN para las tres etapas.

### Comentario

1. Evento: click en Comentar.
2. Handler: handleAppClick.
3. Función: addWorkflowComment.
4. Validación: comments:create, presupuesto y user; message sanitizado y no vacío.
5. Estado: data.comments y mockDB.comments reciben el registro.
6. Auditoría: WORKFLOW_COMMENT_ADDED.
7. Render: renderWorkflowComments lista role, fecha, mensaje y etapa.
8. Resultado: el comentario persiste durante el cambio de vista en la sesión.
9. Evidencia: VERIFICADO POR EJECUCIÓN.

### Bloqueo de edición

1. Con etapa distinta de BUDGETING, canEditBudget devuelve false.
2. renderApuCatalog reemplaza Agregar por Solo lectura.
3. renderBudgetItems deshabilita quantity y reemplaza eliminar por Solo lectura.
4. renderSettings marca los inputs como disabled.
5. Una llamada directa a los cuatro engines ejecuta showPermissionDenied y no muta items/settings.
6. Evidencia: VERIFICADO POR EJECUCIÓN e inspección de los cuatro guards.

### Fase 1 sin regresión

1. Se hidratan 20 APUs.
2. Búsqueda y filtros AND siguen funcionando.
3. Agregar dos veces conserva una fila e incrementa quantity.
4. Cantidad decimal, settings y eliminación mantienen sus cálculos.
5. Navegación apu-catalog, budget, summary y workflow cambia activeView.
6. Eventos BUDGET_ITEM_ADDED y BUDGET_ITEM_REMOVED siguen en AuditLog.
7. Evidencia: VERIFICADO POR EJECUCIÓN de regresión.

## Estado y gestión de datos

| Estado | Función | Renderer | DOM |
|---|---|---|---|
| session.currentRole | switchRole | renderHeader, renderSidebar, renderRoleSwitcher, renderWorkflowActions | headerUserRole, sidebarWorkflowOwner, roleSwitcher, workflow-view-container |
| workflow.status | changeWorkflowStage | renderHeader, renderSidebar, renderWorkflowView | headerWorkflowStatus, sidebarWorkflowStatus, status chip |
| workflow.currentStage | submit, approvals y changeWorkflowStage | renderWorkflowTimeline, renderWorkflowActions | workflow-section, timeline, action panel |
| data.approvals | createApprovalRecord | renderWorkflowView | Decisiones anteriores |
| data.comments | addWorkflowComment | renderWorkflowComments | Comentarios |
| budget.status | changeWorkflowStage | presupuesto sincronizado | mockDB.budgets y estado informativo |
| budget.items | engines Fase 1 con canEditBudget | renderApuCatalog, renderBudgetItems | catálogo y budgetItemsBody |
| settings | updateEconomicSetting con canEditBudget | renderSettings, renderBudgetSummary | inputs data-setting y summaryBreakdown |
| data.auditLog | logAuditEvent | No hay renderer visual | memoria y mockDB.auditLog |

El DOM sigue siendo salida. Los handlers leen valores de los controles, pero el engine valida y actualiza appState antes de que los renderers escriban la UI.

## Workflow y aprobaciones

workflow conserva status, currentStage y approvals heredados. Fase 2 agrega constantes, transiciones, helpers y funciones específicas. approvals[] de workflow se utiliza como lista de IDs para conservar el contrato; el objeto completo se almacena una sola vez en data.approvals y mockDB.approvals.

No hay transiciones para Cliente ni Legal. READY_FOR_CLIENT es la salida de Fase 2 y no inicia aprobación real.

## Auditoría

Se mantienen los eventos de Fase 1:

- BUDGET_ITEM_ADDED.
- BUDGET_ITEM_REMOVED.
- BUDGET_ITEM_QUANTITY_CHANGED.
- ECONOMIC_SETTING_CHANGED.

Fase 2 agrega:

| Evento | Productor | Entity | Cuándo |
|---|---|---|---|
| ROLE_SWITCHED | switchRole | session | cambio de rol válido |
| WORKFLOW_SUBMITTED_TECHNICAL | submitForTechnicalReview | workflow | envío válido |
| TECHNICAL_REVIEW_APPROVED | approveTechnicalReview | workflow | aprobación técnica |
| TECHNICAL_REVIEW_REJECTED | rejectTechnicalReview | workflow | rechazo técnico con motivo |
| FINANCIAL_REVIEW_APPROVED | approveFinancialReview | workflow | aprobación financiera |
| FINANCIAL_REVIEW_REJECTED | rejectFinancialReview | workflow | rechazo financiero con motivo |
| MANAGEMENT_REVIEW_APPROVED | approveManagementReview | workflow | aprobación gerencial |
| MANAGEMENT_REVIEW_REJECTED | rejectManagementReview | workflow | rechazo gerencial con motivo |
| WORKFLOW_COMMENT_ADDED | addWorkflowComment | workflow-comment | comentario válido |
| WORKFLOW_STAGE_CHANGED | changeWorkflowStage | workflow | cualquier transición válida |

Todos mantienen id, timestamp, userId, role, action, entity, entityId y description mediante logAuditEvent.

No existe todavía una pantalla de Audit Trail. La trazabilidad implementada es escritura de eventos y registros históricos en memoria.

## Dependencias internas

- index.html usa DOM API, Intl.NumberFormat y Tailwind CDN.
- Vite sigue entregando index.html.
- No se añadieron dependencias npm.
- src/main.jsx y src/App.jsx permanecen sin conexión con el runtime inline.
- No hay backend, autenticación, API, persistencia ni servidor de autorización.

## Verificación contra código

### Archivos revisados

- AGENTS.md.
- md/AGENTS.md.
- src/AGENTS.md.
- tests/AGENTS.md.
- md/fase-1-2.md completo.
- index.html completo, incluyendo markup, CSS, estado, engines, renderers y handlers.
- src/main.jsx, src/App.jsx, src/components, src/data, src/utils y src/index.css.
- vite.config.js, package.json y README.md.

### Elementos encontrados y conexiones

- rolePermissions en index.html es consumido por hasPermission, canEditBudget, canTransitionTo, switchRole, renderWorkflowActions y los engines.
- WORKFLOW_STATUS, WORKFLOW_STAGE y workflowTransitions se consumen en validación, transición y render.
- createApprovalRecord escribe data.approvals, mockDB.approvals y workflow.approvals.
- addWorkflowComment escribe data.comments, mockDB.comments y logAuditEvent.
- viewRegistry incluye workflow y navigateTo usa workflow-section.
- bindStaticEvents sigue registrando exactamente click, input y change en document.
- Los controles nuevos usan data-action y se resuelven por el mismo event delegation.

### DOM Contract nuevo y heredado

IDs estáticos nuevos:

- roleSwitcher.
- sidebarWorkflowStatus.
- sidebarWorkflowOwner.
- headerWorkflowStatus.
- headerWorkflowStage.
- workflow-section.
- workflow-view-container.

IDs dinámicos generados solo cuando la etapa y el rol los requieren:

- workflowDecisionReason.
- workflowCommentInput.

Los IDs heredados de catálogo, presupuesto, resumen, settings, toast y navegación se conservaron.

### Inconsistencias detectadas

1. La documentación de Fase 1 clasificaba workflow como placeholder; el código actual lo extiende con funciones y UI reales. Este snapshot actualiza su estado.
2. La arquitectura React/Vite declarada en AGENTS y README sigue coexistiendo con el runtime inline. Fase 2 extiende el runtime que realmente se ejecuta y no modifica src.
3. La entidad user USR-001 conserva role Presupuestista mientras la sesión demo cambia currentRole. Esto es intencional para no alterar la identidad demo; getCurrentRole es la fuente del rol activo.

## Verificación funcional

### VERIFICADO POR EJECUCIÓN

- Análisis sintáctico del script inline real con new Function: correcto.
- npm run build: correcto con Vite 6.4.4.
- Smoke Fase 2: runtime final-ok; resultado READY_FOR_CLIENT, APPROVED, 9 approvals, 1 comment y 41 auditEvents.
- Smoke Fase 2 cubrió:
  - selector de roles y ROLE_SWITCHED;
  - envío técnico;
  - rechazo técnico con motivo;
  - rechazo financiero con motivo;
  - rechazo gerencial con motivo;
  - reenvíos después de rechazo;
  - aprobaciones técnica, financiera y gerencial;
  - historial de 9 Approval Records;
  - comment sanitizado y rechazo de comment vacío;
  - mockDB.approvals y mockDB.comments sincronizados;
  - bloqueo de edición del engine;
  - UI de catálogo Solo lectura y quantity disabled;
  - diez familias de eventos AuditLog;
  - render del estado Listo para Cliente;
  - event delegation de click, input y change.
- Smoke de regresión Fase 1: runtime fase1-regression-ok; 20 APUs, presupuesto vacío tras eliminación, navegación final workflow y 5 eventos heredados.
- Smoke de timeline posterior a la corrección: runtime timeline-ok; TECHNICAL_REVIEW con última decisión APPROVED se muestra como Completado aunque exista un rechazo histórico anterior.

### VERIFICADO POR INSPECCIÓN

- Los seis roles tienen entrada explícita en rolePermissions.
- Todos los engines de mutación de presupuesto llaman canEditBudget y su permiso específico.
- changeWorkflowStage no permite una transición fuera de workflowTransitions ni un permiso override distinto al permiso canónico.
- createApprovalRecord exige presupuesto actual, etapa actual, decisión válida, permiso y motivo en rechazo.
- renderWorkflowTimeline deriva el estado de cada etapa desde currentStage y approvals; no fija una etapa activa estática.
- Los controles UI se generan según permiso y etapa.
- Los roles Cliente y Oficial Legal no tienen funciones de aprobación, edición, documentos ni firma.
- budget.scenarios, documents[] y futureViews no se convirtieron en funcionalidades de Fase 3 o 4.

### NO VERIFICADO

- No se ejecutó un navegador visual con consola real; responsive, scroll visual y ausencia de errores de consola del navegador quedan sin verificar por ejecución.
- No existe suite persistente en tests; los smoke scripts fueron temporales y se eliminaron.
- No se verificó persistencia entre recargas, concurrencia, autenticación, API ni backend.
- No se verificó el runtime React de src como consumidor de Fase 2, porque index.html no lo monta.

## Limitaciones actuales

1. RBAC vive en JavaScript y protege la demo, no un servidor.
2. switchRole simula la sesión; no autentica ni cambia la entidad persistida del usuario.
3. El presupuesto se bloquea en revisión mediante canEditBudget en UI y engines, pero no existe lock distribuido.
4. Los rechazos conservan el motivo en Approval Record y AuditLog; no crean automáticamente un Comment separado.
5. La vista Workflow no ofrece URL routing ni persistencia.
6. Cliente no aprueba y Oficial Legal solo observa; esto queda reservado para Fase 4.
7. No existen documentos, contratos, firma, adjudicación, portal cliente ni legal workflow.
8. No existen escenarios completos, comparación de precios, varianzas ni riesgos; Fase 3 los implementará.
9. AuditLog no tiene lista visual, filtros, exportación ni dashboard; Fase 5 podrá consumir los eventos acumulados.
10. La aplicación React en src y el runtime inline no comparten el estado de Fase 2.
11. No existe almacenamiento persistente.

Las limitaciones anteriores son capacidades no implementadas, no fallos ocultos del flujo ejecutado.

## Cambios de esta iteración

1. Se extendió APP_CONFIG para aceptar workflow como vista soportada y conservar las vistas futuras de escenarios, cliente, documentos, legal, auditoría y dashboard.
2. Se añadieron WORKFLOW_STATUS, WORKFLOW_STAGE, etiquetas, responsables y workflowTransitions.
3. Se reemplazó rolePermissions de un solo rol por una matriz explícita de los seis roles.
4. Se añadieron canEditBudget, canTransitionTo, changeWorkflowStage, getCurrentWorkflowOwnerRole y helpers de status/etapa.
5. Se añadieron switchRole y renderRoleSwitcher con selector visible de demo.
6. Se añadieron submitForTechnicalReview, las seis funciones específicas de aprobación/rechazo y completeWorkflowDecision.
7. Se convirtió appState.data.approvals en historial funcional con createApprovalRecord, incluyendo réplica en mockDB y lista de IDs en workflow.approvals.
8. Se convirtió appState.data.comments en historial funcional con addWorkflowComment y getWorkflowComments.
9. Se añadió renderWorkflowView, renderWorkflowTimeline, renderWorkflowActions y renderWorkflowComments.
10. Se extendió viewRegistry y navigateTo con workflow.
11. Se extendieron los handlers centrales con acciones de workflow, roleSwitcher y comentarios.
12. Se aplicó canEditBudget a agregar, eliminar, quantity y settings, además de la visibilidad/habilitación de controles.
13. Se añadieron los eventos de auditoría de roles, workflow, approvals y comments, conservando los cuatro eventos de Fase 1.
14. Se actualizó el texto visual de la aplicación de Fase 1 a Fase 2.
15. Se creó md/fase-2-1.md.
16. No se modificó src, no se sobrescribieron snapshots y no se inició Fase 3.
17. Se corrigió renderWorkflowTimeline para usar la última decisión de cada etapa; el historial conserva rechazos anteriores sin dejar el estado visual obsoleto.

## Impacto técnico de esta iteración

- Archivo afectado: index.html.
- Archivo creado: md/fase-2-1.md.
- Archivos de src: sin cambios.
- Contratos conservados: mockDB, appState, viewRegistry, Budget Engine, Financial Engine, APU Engine, Router, Audit Engine, aliases Fase 1 e IDs DOM existentes.
- Contratos extendidos: APP_CONFIG.supportedViews incorpora workflow; rolePermissions incorpora permisos Fase 2; appState.workflow conserva sus tres propiedades y agrega uso de IDs; data.approvals y data.comments pasan de arrays vacíos a registros.
- Dependencias nuevas: ninguna.
- Riesgo: el runtime sigue siendo index.html inline mientras src contiene una aplicación React separada; cualquier futura convergencia debe decidirse explícitamente.

## Compatibilidad

Las funciones de Fase 1 mantienen sus nombres y parámetros. Sus guards ahora exigen además que la etapa sea BUDGETING, que es la regla de negocio de Fase 2.

Los aliases currentUser, activeView, apuCatalog, budget, auditLog, documents, comments, roles, filters.search, filters.category y filters.unit continúan funcionando.

Los IDs de catálogo, presupuesto, settings, resumen, toast, modal, header y navegación se conservaron. Los nuevos controles usan event delegation, no listeners individuales.

Budget Engine y Financial Engine no fueron reemplazados. calculateBudgetTotals sigue calculando y sincronizando el presupuesto; workflow solo cambia status, etapa, permisos y trazabilidad.

## Preparación para siguientes fases

### Preparación para Fase 3

- budget.scenarios permanece como array vacío dentro del presupuesto.
- No se añadieron Scenario Engine, Price Intelligence, Variance Engine ni Risk Engine.
- Fase 3 debe reutilizar appState.budget, settings, totals y renderers sin duplicar presupuesto.

### Preparación para Fase 4

- READY_FOR_CLIENT es la salida de la aprobación gerencial.
- Cliente y Oficial Legal están en roles y selector, pero no tienen aprobación, documentos o firma.
- appState.data.documents permanece vacío.
- Fase 4 deberá añadir proposal/client approval, documentos, contratos y firma con permisos y auditoría propios.

### Preparación para Fase 5

- Todos los eventos Fase 1 y Fase 2 se acumulan en appState.data.auditLog y mockDB.auditLog.
- Cada evento conserva action, entity, entityId, userId, role, timestamp y description.
- Fase 5 podrá consumir ese historial para Audit Trail, timeline, KPIs y dashboard, sin reconstruir decisiones desde el DOM.

## Próxima fase

La próxima implementación autorizada debe ser Fase 3, centrada en scenarios, Price Intelligence, Variance Engine y Risk Engine. Debe conservar workflow.approvals, data.approvals, data.comments, auditLog y la salida READY_FOR_CLIENT, sin introducir aprobación cliente, documentos o legal antes de Fase 4.

## Arquitectura Producción / Homelab

El runtime continúa siendo demo en memoria. Las equivalencias objetivo siguen siendo:

- mockDB → PostgreSQL.
- documents[] → MinIO.
- firma → DocuSeal.
- agenda → Cal.com.
- automatizaciones → n8n.
- identidad y RBAC → Keycloak.

Ninguno de estos servicios está conectado. rolePermissions y switchRole no sustituyen autenticación o autorización de servidor.

## Contrato para la siguiente iteración

La siguiente iteración debe:

- conservar las seis claves de rolePermissions y evaluar permisos desde engines, no solo desde UI;
- conservar workflowTransitions como única fuente de transiciones;
- conservar los Approval Records y Comments históricos;
- no eliminar eventos de appState.data.auditLog;
- no convertir READY_FOR_CLIENT en aprobación del Cliente;
- no modificar budget.scenarios, documents[] ni activar Fase 4 o Fase 5;
- mantener los IDs DOM y event delegation;
- distinguir en la documentación IMPLEMENTADO Y FUNCIONAL, IMPLEMENTADO PARCIALMENTE, PLACEHOLDER ESTRUCTURAL y NO IMPLEMENTADO;
- documentar pruebas ejecutadas y verificaciones estáticas separadamente.

Conclusión: Fase 2 implementa en el runtime real el cambio de rol demo, RBAC de seis roles, bloqueo de edición, workflow validado, revisiones, aprobaciones, rechazos con motivo, comentarios, timeline y trazabilidad. El flujo feliz alcanza READY_FOR_CLIENT y los tres tipos de rechazo regresan a BUDGETING conservando historial. Fase 3 no fue iniciada.
