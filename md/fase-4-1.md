# Fase 4 — Iteración 1

## Identificación

- Proyecto: Expo / BuildCost.
- Fase: 4 — Portal Cliente, Documentos, Legal y Cierre Comercial.
- Iteración: 1.
- Fecha de verificación: 2026-10-16.
- Fuente de verdad: `index.html`, que contiene el runtime ejecutado por la demo.
- Archivos de referencia revisados: `md/fase-3-1.md`, `md/fase-2-1.md`, `md/fase-1-2.md`, `md/fase-1-1.md`.
- Archivos de instrucciones aplicables revisados: `AGENTS.md`, `md/AGENTS.md`, `src/AGENTS.md` y `tests/AGENTS.md`.
- Estado del repositorio al iniciar: `index.html` modificado por las iteraciones anteriores y documentación versionada existente; no se sobrescribió ningún snapshot histórico.

## Resumen ejecutivo técnico

La Fase 4 está implementada como una extensión del workflow único de `index.html`. El flujo parte de `READY_FOR_CLIENT` y pasa por `PROPOSAL_READY`, `CLIENT_REVIEW`, `CLIENT_APPROVED`, `LEGAL_REVIEW`, `CONTRACT_READY`, `SIGNATURE_PENDING`, `SIGNED` y `AWARDED`. La rama de cambios pasa por `CHANGES_REQUESTED` y vuelve a `BUDGETING`.

La demo tiene funcionalmente:

- catálogo de 20 APUs, presupuesto, cálculos financieros, filtros, navegación SPA en memoria y capacidades de Fases 1–3;
- documentos en `appState.data.documents` y `mockDB.documents`;
- propuesta económica con versionado y `contentSnapshot` inmutable;
- envío simulado, vista Cliente, aprobación Cliente y solicitud de cambios;
- revisión legal, generación de contrato demo y preparación para firma;
- firmas demo de Gerente General y Cliente, sin duplicar el firmante por rol;
- transición final a `AWARDED` y auditoría de las acciones relevantes;
- permisos efectivos para los seis roles declarados.

No se implementaron backend, persistencia, PDF real, almacenamiento de objetos, email real, DocuSeal, firma criptográfica, automatizaciones, dashboard ni vista visual completa del AuditLog. Esas capacidades permanecen fuera de esta iteración.

## Estado general de implementación

| Área | Estado | Qué existe realmente | Qué no existe todavía |
|---|---|---|---|
| Presupuesto y motor financiero Fase 1 | `IMPLEMENTADO Y FUNCIONAL` | `appState.budget`, `calculateBudgetTotals()`, `calculateTotalsFromItems()`, `formatCurrency()`, renderizadores de catálogo, presupuesto, resumen y settings. | Persistencia backend y multiusuario real. |
| Workflow base Fase 2 | `IMPLEMENTADO Y FUNCIONAL` | `WORKFLOW_STAGE`, `WORKFLOW_STATUS`, `workflowTransitions`, `changeWorkflowStage()`, aprobaciones, comentarios y acciones conectadas por event delegation. | Identidad/autenticación real y concurrencia multiusuario. |
| Escenarios, variancias y riesgo Fase 3 | `IMPLEMENTADO Y FUNCIONAL` | Escenarios base/optimizado/conservador/custom, referencias de precio, promoción, variancias y riesgo económico. | Persistencia e integración con fuentes de mercado reales. |
| RBAC demo | `IMPLEMENTADO Y FUNCIONAL` | `rolePermissions`, `hasPermission()`, selector de rol, controles en router, renderizadores y funciones de negocio. | Autorización de servidor y administración de usuarios. |
| Tipos de documento Fase 4 | `IMPLEMENTADO PARCIALMENTE` | Constante `DOCUMENT_TYPE` con seis tipos. Propuesta económica y contrato tienen flujo real. | `TECHNICAL_PROPOSAL`, `COVER_LETTER`, `NDA` y `AWARD_NOTICE` solo tienen el tipo declarado; no tienen generación ni workflow propio. |
| Propuesta económica | `IMPLEMENTADO Y FUNCIONAL` | `generateEconomicProposal()`, versionado, snapshot, envío, visto, aprobación y cambios. | Plantilla documental enriquecida y exportación PDF. |
| Portal Cliente | `IMPLEMENTADO Y FUNCIONAL` | `renderClientPortalView()`, selector de cliente/proyecto mediante `getCurrentClient()`/`getCurrentProject()`, vista comercial filtrada y acciones de Cliente. | Portal externo, autenticación del cliente y comunicación real. |
| Legal y contrato demo | `IMPLEMENTADO Y FUNCIONAL` | `startLegalReview()`, `approveLegalReview()`, `requestLegalChanges()`, `generateContract()`, `approveContractForSignature()`. | Revisión legal real, plantillas contractuales legales y almacenamiento externo. |
| Firmas demo | `IMPLEMENTADO Y FUNCIONAL` | `appState.data.signatures`, `mockDB.signatures`, `signContract()`, firmantes requeridos y estados `SIGNED`/`AWARDED`. | Firma electrónica real, certificado, proveedor externo y no repudio. |
| AuditLog | `IMPLEMENTADO PARCIALMENTE` | `logAuditEvent()` registra eventos en memoria y se sincroniza con `mockDB.auditLog`; Fase 4 añade eventos de documentos, legal, firma y adjudicación. | Vista visual, filtros, exportación, retención y persistencia; corresponden a Fase 5/producción. |
| Documentos técnicos, NDA, carta y aviso | `PLACEHOLDER ESTRUCTURAL` | Tipos en `DOCUMENT_TYPE` y almacenamiento genérico en `documents`. | Generadores, snapshots específicos, estados y UI de negocio. |
| Backend, PostgreSQL, MinIO, DocuSeal, email, n8n, Keycloak | `NO IMPLEMENTADO` | No hay llamadas de red ni integración de servicios. | Todos los servicios reales. |
| Dashboard, KPIs y AuditLog visual de Fase 5 | `NO IMPLEMENTADO` | `APP_CONFIG.futureViews` conserva `audit` y `dashboard` como rutas futuras. | Views, métricas, filtros y componentes Fase 5. |

## Cómo funciona actualmente

El navegador carga `index.html`. El script inline inicializa `mockDB`, copia sus datos a `appState` mediante `hydrateStateFromMockDB()`, carga los 20 APUs en `appState.apuCatalog`, crea los escenarios por defecto con `ensureDefaultScenarios()`, enlaza los listeners globales en `bindStaticEvents()` y ejecuta `renderApp()`.

La aplicación no usa `src/main.jsx` durante esta ejecución: `src/main.jsx` y los componentes React existentes pertenecen a una arquitectura paralela declarada en `src/AGENTS.md`, pero `index.html` no los importa. Por eso las capacidades de esta iteración se localizaron, modificaron y verificaron en `index.html`.

El estado normalizado se mantiene en `appState.data`; los aliases `appState.budget`, `appState.documents`, `appState.comments`, `appState.signatures`, `appState.auditLog` y `appState.apuCatalog` conservan compatibilidad con el contrato anterior. Las escrituras de documentos y firmas usan `syncDocumentsToMockDB()` y `syncSignaturesToMockDB()` para mantener las dos representaciones demo consistentes.

El router en memoria usa `navigateTo()` y `viewRegistry`. Cada entrada de `viewRegistry` llama al renderer de su vista, y `renderCurrentView()` actualiza la navegación. La navegación se filtra mediante `canViewForRole()` y `getViewPermission()`.

Las acciones HTML usan `data-action`. `bindStaticEvents()` registra un único listener de `click`, y `handleAppClick()` delega a las funciones de dominio. No existen handlers separados por fila para documentos, APUs o firmas.

## Arquitectura global

```text
mockDB
  ├─ users / roles / clients / projects / apus / budgets
  ├─ documents / comments / approvals / signatures / auditLog
  └─ priceReferences
          │ hydrateStateFromMockDB()
          ▼
appState
  ├─ session / ui / filters / settings
  ├─ data.documents / data.comments / data.approvals / data.signatures
  └─ workflow.currentStage / workflow.status
          │
          ├─ motores: presupuesto, escenarios, documentos, legal, firmas
          ├─ router: navigateTo() / viewRegistry / renderCurrentView()
          └─ auditoría: logAuditEvent()
          │
          ▼
DOM
  ├─ catalog-section / budget-section / summary-section
  ├─ workflow-section / scenarios-section
  └─ client-portal-section / documents-section / legal-section
```

No existe un segundo workflow para documentos o contratos. `changeWorkflowStage()` es la única función que cambia `appState.workflow.currentStage` y `appState.workflow.status`.

## Estructura física del proyecto

- `index.html`: runtime real de la demo, markup estático, estado, motores, router, renderizadores y event delegation.
- `src/main.jsx`: entrada React/Vite separada; no es importada por `index.html`.
- `src/App.jsx`, `src/components/`, `src/data/`, `src/utils/`: implementación React paralela; no se modificó para Fase 4 porque no es el runtime cargado por la demo.
- `md/AGENTS.md`: contrato de snapshots técnicos.
- `md/fase-1-1.md`, `md/fase-1-2.md`, `md/fase-2-1.md`, `md/fase-3-1.md`: snapshots históricos; no se sobrescribieron.
- `md/fase-4-1.md`: este snapshot.
- `tests/AGENTS.md`: instrucciones de pruebas; no había suite ejecutable persistente en `tests/`.
- `package.json`: scripts `dev`, `build`, `preview`; dependencias React/Vite existentes.

## Datos y modelos actuales

### Estado y sincronización

`mockDB` contiene arrays demo para usuarios, roles, clientes, proyectos, APUs, presupuestos, documentos, comentarios, aprobaciones, firmas, auditoría y referencias de precio. `hydrateStateFromMockDB()` hace una copia profunda al iniciar.

El presupuesto activo se encuentra por `appState.currentBudgetId`. `calculateBudgetTotals()` recalcula el presupuesto, sus escenarios y sincroniza el presupuesto con `mockDB`. Los documentos y las firmas no se recalculan a partir del presupuesto después de creados: conservan una copia profunda del contenido que fue utilizado.

### Workflow

`WORKFLOW_STATUS` contiene exactamente estos estados globales: `DRAFT`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `READY`, `SENT`, `VIEWED`, `CHANGES_REQUESTED`, `SIGNED`, `AWARDED`.

`WORKFLOW_STAGE` contiene:

`BUDGETING → TECHNICAL_REVIEW → FINANCIAL_REVIEW → MANAGEMENT_REVIEW → READY_FOR_CLIENT → PROPOSAL_READY → CLIENT_REVIEW → CLIENT_APPROVED → LEGAL_REVIEW → CONTRACT_READY → SIGNATURE_PENDING → SIGNED → AWARDED`.

La rama de cambio es `CLIENT_REVIEW → CHANGES_REQUESTED → BUDGETING`. Legal puede devolver desde `LEGAL_REVIEW` a `BUDGETING` mediante su permiso específico.

`getDefaultWorkflowStatusForStage()` asigna estados coherentes a las etapas documentales. `changeWorkflowStage()` valida la transición declarada, el permiso, el estado global, actualiza el presupuesto y registra `WORKFLOW_STAGE_CHANGED`.

### Documentos

`DOCUMENT_TYPE` declara:

`ECONOMIC_PROPOSAL`, `TECHNICAL_PROPOSAL`, `COVER_LETTER`, `CONTRACT`, `NDA`, `AWARD_NOTICE`.

`DOCUMENT_STATUS` declara:

`DRAFT`, `READY`, `SENT`, `VIEWED`, `APPROVED`, `CHANGES_REQUESTED`, `LEGAL_REVIEW`, `READY_FOR_SIGNATURE`, `SIGNED`, `ARCHIVED`.

Una propuesta económica tiene esta forma funcional:

```text
{
  id, budgetId, projectId, clientId,
  type: ECONOMIC_PROPOSAL,
  version, status, createdBy, createdAt, updatedAt,
  contentSnapshot: {
    project, client,
    budget: { id, name, version },
    scenario: { id, name } | null,
    items, totals,
    commercialTerms: { validityDays: 30, currency },
    generatedAt
  }
}
```

El snapshot se genera con `deepClone()`. Cambiar después el presupuesto o un escenario no cambia `contentSnapshot`.

Un contrato demo contiene `project`, `client`, `proposalDocumentId`, `approvedAmount`, `currency`, `terms` y `generatedAt` dentro de su snapshot.

### Firmas

`REQUIRED_CONTRACT_SIGNERS` exige `Gerente General` y `Cliente`, ambos con `contract:sign`. Cada firma guardada tiene:

```text
{ id, documentId, userId, role, signerName, signedAt, method: "DEMO_SIGNATURE" }
```

`signContract()` evita una segunda firma para el mismo `documentId` y `role`. La demo cambia de rol con el mismo usuario técnico `USR-001`, por lo que la unicidad efectiva se evalúa por rol del firmante; esto permite simular dos personas distintas sin inventar identidades autenticadas.

### Comentarios y aprobaciones

Los comentarios reutilizan `appState.data.comments`. `addWorkflowComment()` acepta opcionalmente `documentId` y `visibility`; los valores son `INTERNAL` y `CLIENT_SHARED`. `addClientComment()` fuerza `CLIENT_SHARED` y `comments:create-client`. Portal Cliente filtra exclusivamente por `documentId` y `CLIENT_SHARED`.

`createApprovalRecord()` mantiene el contrato F2 y ahora acepta `APPROVED`, `REJECTED` y `CHANGES_REQUESTED`, además de `documentId`. La estructura no se interpreta por sí sola como una aprobación: la decisión solamente se registra si existe permiso, etapa y transición válidos.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| Catálogo de 20 APUs | `IMPLEMENTADO Y FUNCIONAL` | `appState.apuCatalog`, `renderApuCatalog()`, `filterApus()` | `catalog-section`, filtros `apuSearch`, `categoryFilter`, `unitFilter` | búsqueda, filtros combinados y `add-apu` | `VERIFICADO POR EJECUCIÓN` | Fase 1 |
| Presupuesto y cantidades decimales | `IMPLEMENTADO Y FUNCIONAL` | `addApuToBudget()`, `updateBudgetItemQuantity()`, `removeBudgetItem()` | `budgetItemsBody`, inputs `data-action="quantity"` | agrega, incrementa sin duplicar, edita y elimina | `VERIFICADO POR EJECUCIÓN` | Fase 1 |
| Cálculo económico | `IMPLEMENTADO Y FUNCIONAL` | `calculateTotalsFromItems()`, `calculateBudgetTotals()`, `formatCurrency()` | `summaryMetrics`, `summaryBreakdown`, settings | recalculado al editar items/settings | `VERIFICADO POR EJECUCIÓN` | Fase 1 |
| Workflow F1–F2 | `IMPLEMENTADO Y FUNCIONAL` | `workflowTransitions`, `changeWorkflowStage()`, decisiones | `workflow-view-container` | revisión técnica, financiera y gerencial | `VERIFICADO POR EJECUCIÓN` | Fases 1–2 |
| Escenarios F3 | `IMPLEMENTADO Y FUNCIONAL` | `ensureDefaultScenarios()`, `createScenario()`, `promoteScenarioToBudget()`, análisis de riesgo | `scenarios-view-container` | escenarios, referencias, variancias y promoción | `VERIFICADO POR INSPECCIÓN` en esta iteración; ejecución previa documentada en Fase 3 | Fase 3 |
| Estados globales | `IMPLEMENTADO Y FUNCIONAL` | `WORKFLOW_STATUS`, `WORKFLOW_STATUS_LABELS` | header, sidebar, workflow | etiquetas sin `undefined` | `VERIFICADO POR INSPECCIÓN` | Fase 4 |
| Tipos y estados documentales | `IMPLEMENTADO PARCIALMENTE` | `DOCUMENT_TYPE`, `DOCUMENT_STATUS` | estados visibles en Documents | propuesta y contrato; cuatro tipos sin flujo | `VERIFICADO POR INSPECCIÓN` | Fase 4 |
| Snapshot de propuesta | `IMPLEMENTADO Y FUNCIONAL` | `getCommercialSource()`, `generateEconomicProposal()` | Document preview | fuente base/escenario, versión, snapshot inmutable | `VERIFICADO POR EJECUCIÓN` | Fase 4 |
| Versionado documental | `IMPLEMENTADO Y FUNCIONAL` | `getNextDocumentVersion()`, `getLatestDocumentByType()` | lista Documents | v1, v2 y `DOCUMENT_VERSION_CREATED` para v2+ | `VERIFICADO POR EJECUCIÓN` | Fase 4 |
| Envío y visto | `IMPLEMENTADO Y FUNCIONAL` | `sendProposalToClient()`, `markProposalViewed()` | Documents, Portal Cliente | `READY → SENT → VIEWED` | `VERIFICADO POR EJECUCIÓN` | Fase 4 |
| Aprobación/cambios Cliente | `IMPLEMENTADO Y FUNCIONAL` | `approveClientProposal()`, `requestClientChanges()` | Portal Cliente, Workflow | aprobación; cambios vuelven a BUDGETING | `VERIFICADO POR EJECUCIÓN` | Fase 4 |
| Portal Cliente restringido | `IMPLEMENTADO Y FUNCIONAL` | `renderClientPortalView()` | `client-portal-section` | muestra snapshot comercial, comentarios compartidos y firma cliente | `VERIFICADO POR EJECUCIÓN` e inspección de contenido | Fase 4 |
| Revisión Legal | `IMPLEMENTADO Y FUNCIONAL` | `startLegalReview()`, `approveLegalReview()`, `requestLegalChanges()` | `legal-section`, Workflow | aprobación a contrato o devolución a presupuesto | `VERIFICADO POR EJECUCIÓN` | Fase 4 |
| Contrato demo | `IMPLEMENTADO Y FUNCIONAL` | `generateContract()`, `approveContractForSignature()` | Legal, Documents, preview | contrato desde propuesta aprobada, listo para firma | `VERIFICADO POR EJECUCIÓN` | Fase 4 |
| Firma y adjudicación demo | `IMPLEMENTADO Y FUNCIONAL` | `signContract()`, `getDocumentSignatures()` | Portal Cliente, Workflow, Documents | dos firmas, `SIGNED`, `AWARDED` | `VERIFICADO POR EJECUCIÓN` | Fase 4 |
| AuditLog de Fase 4 | `IMPLEMENTADO Y FUNCIONAL` | `logAuditEvent()` y llamadas de negocio | no hay vista Audit | eventos en arrays de memoria y mockDB | `VERIFICADO POR EJECUCIÓN` | Fase 4 |
| Vista visual AuditLog/KPIs | `NO IMPLEMENTADO` | no existe renderer | no existe sección activa | no ejecutable | `NO APLICA` | Fase 5 |
| Persistencia/servicios externos | `NO IMPLEMENTADO` | no existe cliente HTTP ni SDK | no existe integración | no ejecutable | `NO APLICA` | Producción |

## Roles y estado RBAC

`rolePermissions` es la matriz real. `hasPermission(permission)` consulta el rol seleccionado en `appState.session.currentRole`. Las funciones de dominio vuelven a comprobar el permiso; ocultar un botón no es el único control.

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí, en `mockDB.roles` | `budget:write`, `budget:delete`, `budget:quantity`, `settings:write`, workflow técnico, escenarios y precios F3, `proposal:generate`, `proposal:send`, documentos de lectura | Catálogo, Presupuesto, Escenarios, Workflow, Documents | editar presupuesto en `BUDGETING`, enviar a revisión, generar y enviar propuesta; no aprueba legal ni firma | `IMPLEMENTADO Y FUNCIONAL` |
| Revisor Técnico | Sí | `budget:read`, `workflow:technical-review`, `workflow:technical-approve`, `workflow:technical-reject`, comentarios y lectura documental | Workflow, Documents | aprobar o rechazar revisión técnica con motivo en rechazo | `IMPLEMENTADO Y FUNCIONAL` |
| Director Financiero | Sí | revisión financiera, escenarios/precios F3, lectura documental, `proposal:generate`, `proposal:send` | Workflow, Escenarios, Documents | aprobar o rechazar revisión financiera; puede generar/enviar propuesta cuando la etapa lo permite; no firma | `IMPLEMENTADO Y FUNCIONAL` |
| Gerente General | Sí | revisión gerencial, lectura de documentos, `contract:read`, `contract:sign` | Workflow, Documents; ruta por defecto Workflow | aprobar gestión, firmar como Gerente General en `SIGNATURE_PENDING`; no genera contrato legal | `IMPLEMENTADO Y FUNCIONAL` |
| Cliente | Sí | `proposal:read`, `proposal:view`, `proposal:approve`, `proposal:request-changes`, `comments:create-client`, `contract:read`, `contract:sign`, permisos de transición Cliente | Portal Cliente; el menú Workflow interno se oculta y su renderer muestra una explicación sin datos privados | ver propuesta comercial, marcar visto, aprobar, solicitar cambios, comentar compartido y firmar como Cliente; no tiene `budget:write`, `settings:write`, `scenario:write`, `workflow:internal-read`, aprobación interna ni `legal:write` | `IMPLEMENTADO Y FUNCIONAL` |
| Oficial Legal | Sí | `legal:read`, `legal:review`, `legal:approve`, `legal:request-changes`, `contract:create`, `contract:read`, `contract:approve-signature`, comentarios internos | Legal, Documents, Workflow | iniciar/aprobar/devolver revisión legal, generar contrato y prepararlo para firma; no edita presupuesto ni firma porque no es firmante requerido | `IMPLEMENTADO Y FUNCIONAL` |

## Componentes principales

El runtime real no usa componentes React para estas vistas. Los componentes funcionales son contenedores DOM y renderizadores en `index.html`.

| Componente/renderizador | Archivo | Responsabilidad | Estado/consumo | Elementos que renderiza |
|---|---|---|---|---|
| `renderApuCatalogView()` | `index.html` | Coordina filtros y catálogo | `appState.filters`, `appState.apuCatalog` | `categoryFilter`, `unitFilter`, `apuSearch`, `apuCatalogBody` |
| `renderBudgetView()` | `index.html` | Actualiza items y resumen | `appState.budget`, `appState.settings` | `budgetItemsBody`, `budgetFooter`, summary |
| `renderWorkflowView()` | `index.html` | Muestra etapa, timeline, decisiones y comentarios | `appState.workflow`, approvals, comments | `workflow-view-container` |
| `renderScenariosView()` | `index.html` | Muestra escenarios F3 | budget.scenarios, referencias, riesgo | `scenarios-view-container` |
| `renderClientPortalView()` | `index.html` | Vista comercial filtrada para Cliente | propuesta snapshot, comentarios `CLIENT_SHARED`, contrato para firma | `client-portal-view-container` |
| `renderDocumentsView()` | `index.html` | Lista documentos, versiones, previews y acciones | `appState.data.documents`, permisos | `documents-view-container`, `documentPreviewContainer` |
| `renderProposalPreview()` | `index.html` | Presenta snapshot de propuesta/contrato | `contentSnapshot` | target recibido, normalmente `documentPreviewContainer` |
| `renderLegalView()` | `index.html` | Revisión legal, contrato y firmas | documentos, firmas, comentarios internos | `legal-view-container`, preview contractual |
| `viewRegistry` | `index.html` | Mapea nombre de vista a renderer | `appState.ui.activeView` | navegación SPA en memoria |

No hay props ni estado interno React en estos componentes. Los callbacks se conectan por `data-action` y `handleAppClick()`.

## Funciones y utilidades principales

| Función | Responsabilidad y entradas | Datos que lee/modifica | Consumidores | Estado |
|---|---|---|---|---|
| `hydrateStateFromMockDB()` | Sin entrada; copia datos iniciales | reemplaza `appState.data` | `initializeApp()` | `IMPLEMENTADO Y FUNCIONAL` |
| `hasPermission(permission)` | permiso solicitado | lee `appState.session.currentRole` y `rolePermissions` | router, acciones y renderers | `IMPLEMENTADO Y FUNCIONAL` |
| `changeWorkflowStage(nextStage, options)` | siguiente etapa, permiso/estado opcionales | modifica `appState.workflow`, `budget.status`, auditoría | todos los pasos F2–F4 | `IMPLEMENTADO Y FUNCIONAL` |
| `createApprovalRecord(params)` | budget, document, stage, decision, comment | agrega `appState.data.approvals`, `mockDB.approvals`, referencia en workflow | revisiones y Cliente/Legal | `IMPLEMENTADO Y FUNCIONAL` |
| `addWorkflowComment(message, options)` | mensaje y visibilidad opcional | agrega comentario interno/compartido y AuditLog | Workflow, Portal, Legal | `IMPLEMENTADO Y FUNCIONAL` |
| `getCommercialSource()` | sin entrada | lee budget y escenario; devuelve copia de items/totales | `generateEconomicProposal()` | `IMPLEMENTADO Y FUNCIONAL` |
| `generateEconomicProposal()` | sin entrada; exige etapa `READY_FOR_CLIENT` | agrega documento `READY`, snapshot, AuditLog y avanza a `PROPOSAL_READY` | Workflow, Documents | `IMPLEMENTADO Y FUNCIONAL` |
| `getDocumentsForBudget(id)` | budget opcional | filtra/sort de `appState.data.documents` | Documents y motores | `IMPLEMENTADO Y FUNCIONAL` |
| `getDocumentById(id)` | id documental | lee documento | acciones y previews | `IMPLEMENTADO Y FUNCIONAL` |
| `getLatestDocumentByType(type)` | tipo y budget opcional | selecciona máxima versión | propuesta/contrato | `IMPLEMENTADO Y FUNCIONAL` |
| `getNextDocumentVersion(type)` | tipo | calcula `max(version)+1` | generadores | `IMPLEMENTADO Y FUNCIONAL` |
| `sendProposalToClient(id)` | documento opcional | cambia documento a `SENT`, avanza a `CLIENT_REVIEW`, audita | Documents/Workflow | `IMPLEMENTADO Y FUNCIONAL` |
| `markProposalViewed(id, shouldRender)` | documento y control de render | cambia `SENT → VIEWED`, audita una vez | Portal Cliente | `IMPLEMENTADO Y FUNCIONAL` |
| `approveClientProposal(id, confirmed)` | documento y confirmación | approval `APPROVED`, documento `APPROVED`, etapa `CLIENT_APPROVED` | Portal Cliente | `IMPLEMENTADO Y FUNCIONAL` |
| `requestClientChanges(id, reason, confirmed)` | documento, motivo, confirmación | approval `CHANGES_REQUESTED`, documento cambiado y workflow a `BUDGETING` | Portal Cliente | `IMPLEMENTADO Y FUNCIONAL` |
| `startLegalReview()` | sin entrada | etapa `CLIENT_APPROVED → LEGAL_REVIEW`, propuesta `LEGAL_REVIEW` | Legal | `IMPLEMENTADO Y FUNCIONAL` |
| `approveLegalReview(id, comment)` | propuesta y comentario | approval, propuesta aprobada, etapa `CONTRACT_READY` | Legal | `IMPLEMENTADO Y FUNCIONAL` |
| `requestLegalChanges(reason, id)` | motivo y documento | approval, documento cambiado, etapa `BUDGETING` | Legal | `IMPLEMENTADO Y FUNCIONAL` |
| `generateContract()` | sin entrada | agrega contrato DRAFT con snapshot de propuesta aprobada | Legal/Documents | `IMPLEMENTADO Y FUNCIONAL` |
| `approveContractForSignature(id)` | contrato | `DRAFT → READY_FOR_SIGNATURE`, etapa `SIGNATURE_PENDING` | Legal/Documents | `IMPLEMENTADO Y FUNCIONAL` |
| `getDocumentSignatures(id)` | id documental | filtra y ordena firmas | Legal, Portal, Workflow | `IMPLEMENTADO Y FUNCIONAL` |
| `signContract(id, confirmed)` | contrato y confirmación | agrega firma; si están las dos, cambia a `SIGNED` y `AWARDED` | Portal, Workflow, Documents | `IMPLEMENTADO Y FUNCIONAL` |
| `logAuditEvent(action, entity, entityId, description)` | datos del evento | agrega a `appState.data.auditLog` y `mockDB.auditLog` | todas las acciones auditadas | `IMPLEMENTADO Y FUNCIONAL` en memoria |
| `formatCurrency(value)` | valor numérico | no muta estado; normaliza inválidos a cero | todos los renderers monetarios | `IMPLEMENTADO Y FUNCIONAL` |

## Flujos funcionales end-to-end

### Flujo 1 — Propuesta económica y envío

1. El usuario Gerente General pulsa aprobar gestión; `handleAppClick()` llama `approveManagementReview()`.
2. `completeWorkflowDecision()` registra la aprobación y `changeWorkflowStage()` mueve el workflow a `READY_FOR_CLIENT` con estado `APPROVED`.
3. El Presupuestista pulsa `generate-economic-proposal` desde Workflow o Documents.
4. `generateEconomicProposal()` consulta `getCommercialSource()`, calcula la fuente base/escenario, hace `deepClone()` y guarda el documento en `appState.data.documents` y `mockDB.documents`.
5. La función registra `PROPOSAL_GENERATED`, eventualmente `DOCUMENT_VERSION_CREATED`, y mueve el workflow a `PROPOSAL_READY`.
6. El Presupuestista pulsa `send-proposal`; `sendProposalToClient()` cambia el documento a `SENT`, registra `sentAt`, mueve a `CLIENT_REVIEW` y audita `PROPOSAL_SENT_TO_CLIENT`.
7. `refreshWorkflowDependentViews()` vuelve a renderizar header, sidebar, workflow, Documents, Portal y Legal.
8. Resultado observable: la propuesta aparece como enviada y el Portal Cliente puede mostrarla.

### Flujo 2 — Cliente ve, aprueba o solicita cambios

1. El selector de rol ejecuta `switchRole("Cliente")`; la ruta por defecto pasa a `client-portal` porque `canViewForRole()` permite `proposal:view`.
2. `renderClientPortalView()` busca cliente/proyecto con `getCurrentClient()` y `getCurrentProject()`, toma el último documento económico y filtra comentarios `CLIENT_SHARED`.
3. Si el documento está `SENT`, el renderer llama `markProposalViewed(id, false)`, cambia a `VIEWED` y audita `PROPOSAL_VIEWED_BY_CLIENT` sin recursión de render.
4. La tabla del portal usa únicamente `contentSnapshot.items` y el total comercial; no renderiza settings, overhead, márgenes, proveedores, riesgo, AuditLog ni comentarios `INTERNAL`.
5. Aprobar ejecuta `approveClientProposal()`, registra approval `APPROVED`, mueve a `CLIENT_APPROVED` y audita `CLIENT_PROPOSAL_APPROVED`.
6. Solicitar cambios ejecuta `requestClientChanges()`, exige motivo, registra `CHANGES_REQUESTED`, pasa por la etapa transitoria `CHANGES_REQUESTED` y termina en `BUDGETING`.
7. Resultado observable: el Cliente puede decidir sin editar presupuesto; el Presupuestista recupera la etapa de edición para generar una nueva versión.

### Flujo 3 — Versionado y snapshot

1. Tras el retorno a `BUDGETING`, el equipo vuelve a completar las revisiones F2.
2. `getNextDocumentVersion(ECONOMIC_PROPOSAL)` calcula 2 o la siguiente versión existente.
3. `generateEconomicProposal()` guarda otra propuesta sin sobrescribir la anterior.
4. `contentSnapshot` de la versión anterior conserva sus items/totales porque fue clonado al generar.
5. Resultado observable: Documents lista v1 y v2; la versión anterior queda trazable y la nueva tiene su propia fuente.

### Flujo 4 — Legal, contrato y firmas

1. Con propuesta `APPROVED` y etapa `CLIENT_APPROVED`, el Oficial Legal pulsa iniciar revisión.
2. `startLegalReview()` mueve a `LEGAL_REVIEW`, marca la propuesta `LEGAL_REVIEW` y audita `LEGAL_REVIEW_STARTED`.
3. Aprobar llama `approveLegalReview()`, registra approval y mueve a `CONTRACT_READY`; solicitar cambios llama `requestLegalChanges()` y vuelve a `BUDGETING` con motivo.
4. Legal pulsa generar contrato; `generateContract()` crea un documento `CONTRACT` con `DRAFT` y snapshot del monto aprobado/propuesta.
5. `approveContractForSignature()` cambia el contrato a `READY_FOR_SIGNATURE`, mueve a `SIGNATURE_PENDING` y audita `CONTRACT_READY_FOR_SIGNATURE`.
6. Cliente firma desde Portal Cliente o Workflow; Gerente General firma desde Workflow o Documents. `signContract()` agrega una entidad de firma y `DOCUMENT_SIGNED`.
7. Cuando existen ambos roles en `getDocumentSignatures()`, el contrato pasa a `SIGNED`, el workflow a `SIGNED` y después a `AWARDED`; se auditan `CONTRACT_SIGNED` y `PROJECT_AWARDED`.
8. Resultado observable: dos firmas demo, contrato firmado y proyecto adjudicado, sin firma Legal ni duplicación del mismo rol.

### Flujo 5 — Comentarios y visibilidad

1. Workflow/Legal usan `addWorkflowComment()` con permiso `comments:create` y visibilidad `INTERNAL` por defecto.
2. Portal Cliente usa `addClientComment()`, que requiere `comments:create-client` y guarda `CLIENT_SHARED` junto con `documentId`.
3. `renderWorkflowComments()` puede mostrar comentarios de workflow a roles internos; `renderClientPortalView()` filtra solo comentarios compartidos del documento actual.
4. Resultado observable: el mensaje compartido aparece al Cliente; el comentario interno no aparece en el Portal.

## Estado y gestión de datos

### Relación Estado → Función → Renderer → DOM

| Estado | Función que lo cambia | Renderer | DOM observable |
|---|---|---|---|
| `appState.budget.items` | `addApuToBudget()`, `updateBudgetItemQuantity()`, `removeBudgetItem()` | `renderBudgetItems()`, `renderBudgetSummary()` | `budgetItemsBody`, `budgetFooter`, `summaryMetrics`, `summaryBreakdown` |
| `appState.settings` | `updateEconomicSetting()` | `renderSettings()`, `renderBudgetSummary()` | inputs `[data-setting]`, `summaryBreakdown` |
| `appState.workflow.currentStage/status` | `changeWorkflowStage()` | `renderHeader()`, `renderSidebar()`, `renderWorkflowView()` | header, sidebar, `workflow-view-container` |
| `appState.data.documents` | generadores y acciones documentales | `renderDocumentsView()`, `renderClientPortalView()`, `renderLegalView()` | `documents-view-container`, `client-portal-view-container`, `legal-view-container` |
| `appState.data.approvals` | `createApprovalRecord()` | `renderWorkflowView()`, decisiones internas | panel de decisiones |
| `appState.data.comments` | `addWorkflowComment()`, `addClientComment()` | Workflow, Portal, Legal | paneles de comentarios |
| `appState.data.signatures` | `signContract()` | `renderLegalView()`, Portal, Documents | lista de firmas y acciones |
| `appState.data.auditLog` | `logAuditEvent()` | no hay renderer Fase 4 | solo memoria y `mockDB.auditLog`; vista visual queda en Fase 5 |
| `appState.ui.activeView` | `navigateTo()`, `switchRole()` | `renderCurrentView()` | sección destino por `targetId` |
| `appState.ui.activeDocumentId` | preview de Documents/contrato | `renderProposalPreview()` | `documentPreviewContainer` o preview Legal |

### Aliases y compatibilidad

Se conservaron `appState.activeView`, `appState.apuCatalog`, `appState.budget`, `appState.documents`, `appState.comments`, `appState.signatures`, `appState.auditLog`, `appState.roles` y aliases de filtros. Las funciones de F2 (`createApprovalRecord`, `addWorkflowComment`) mantienen su uso anterior y aceptan opciones nuevas sin crear una segunda API incompatible.

## Workflow y aprobaciones

### Transiciones y permisos

| Desde | Hacia | Permiso real | Función que lo usa |
|---|---|---|---|
| `READY_FOR_CLIENT` | `PROPOSAL_READY` | `proposal:generate` | `generateEconomicProposal()` |
| `PROPOSAL_READY` | `CLIENT_REVIEW` | `proposal:send` | `sendProposalToClient()` |
| `CLIENT_REVIEW` | `CLIENT_APPROVED` | `workflow:client-approve` | `approveClientProposal()` |
| `CLIENT_REVIEW` | `CHANGES_REQUESTED` | `workflow:client-request-changes` | `requestClientChanges()` |
| `CHANGES_REQUESTED` | `BUDGETING` | `workflow:changes-return` | `requestClientChanges()` |
| `CLIENT_APPROVED` | `LEGAL_REVIEW` | `workflow:legal-review` | `startLegalReview()` |
| `LEGAL_REVIEW` | `CONTRACT_READY` | `workflow:legal-approve` | `approveLegalReview()` |
| `LEGAL_REVIEW` | `BUDGETING` | `workflow:legal-request-changes` | `requestLegalChanges()` |
| `CONTRACT_READY` | `SIGNATURE_PENDING` | `contract:approve-signature` | `approveContractForSignature()` |
| `SIGNATURE_PENDING` | `SIGNED` | `contract:sign` | `signContract()` cuando completa firmas |
| `SIGNED` | `AWARDED` | `contract:sign` | `signContract()` tras firma completa |

Las revisiones técnica, financiera y gerencial conservan sus permisos y funciones F2. No se implementó un workflow alterno para Legal, documentos o firmas.

## Auditoría

`logAuditEvent()` genera `id`, `timestamp`, `userId`, `role`, `action`, `entity`, `entityId` y `description`, y escribe en `appState.data.auditLog` y `mockDB.auditLog`.

Fase 4 registra, cuando la acción es válida:

`PROPOSAL_GENERATED`, `DOCUMENT_VERSION_CREATED`, `PROPOSAL_SENT_TO_CLIENT`, `PROPOSAL_VIEWED_BY_CLIENT`, `CLIENT_PROPOSAL_APPROVED`, `CLIENT_CHANGES_REQUESTED`, `LEGAL_REVIEW_STARTED`, `LEGAL_REVIEW_APPROVED`, `LEGAL_CHANGES_REQUESTED`, `CONTRACT_GENERATED`, `CONTRACT_READY_FOR_SIGNATURE`, `DOCUMENT_SIGNED`, `CONTRACT_SIGNED`, `PROJECT_AWARDED` y los eventos genéricos `WORKFLOW_STAGE_CHANGED`.

La auditoría existe como datos y registro de negocio. No existe todavía una pantalla `AuditLog`, filtro, exportación o KPI visual.

## Dependencias internas

- `deepClone()` soporta snapshots y sincronización mock.
- `sanitizeText()` limita comentarios y motivos antes de guardarlos.
- `escapeHTML()` se usa en las salidas dinámicas de Documents, Portal y Legal.
- `formatCurrency()` centraliza moneda y evita mostrar `NaN` para valores inválidos.
- `generateId()` considera IDs de items, escenarios, ajustes, approvals, comments, documents, signatures y audit events.
- Los únicos listeners globales son los registrados por `bindStaticEvents()`; las acciones F4 usan event delegation.
- Tailwind CDN continúa siendo una dependencia visual existente; no hay dependencia documental, PDF, firma o backend nueva.

## Verificación contra código

Archivos y estructuras revisados directamente:

- `index.html`: markup, IDs DOM, `mockDB`, `appState`, permisos, motores, workflow, router, renderizadores, handlers e inicialización.
- `src/main.jsx`, `src/App.jsx`, `src/components/`, `src/data/`, `src/utils/`: se revisaron para confirmar la arquitectura paralela y que no son importados por `index.html`.
- `md/fase-3-1.md`, `md/fase-2-1.md`, `md/fase-1-2.md`, `md/fase-1-1.md`: se compararon contra el código, sin tratarlos como fuente de verdad.
- `md/AGENTS.md`, `AGENTS.md`, `src/AGENTS.md`, `tests/AGENTS.md`: se aplicaron sus restricciones.

Inconsistencias encontradas y corregidas en esta iteración:

1. `mockDB` no tenía `signatures`; se agregó y se conectó a `hydrateStateFromMockDB()` y `syncSignaturesToMockDB()`.
2. El estado global solo contemplaba cinco etapas F2; se extendió el mismo `workflowTransitions` y `changeWorkflowStage()` con el ciclo comercial/legal.
3. `createApprovalRecord()` solo aceptaba `APPROVED`/`REJECTED`; ahora acepta `CHANGES_REQUESTED` y `documentId`, conservando llamadas F2.
4. Los comentarios no tenían visibilidad ni documento; se añadieron `documentId`, `visibility` y `addClientComment()`.
5. `mockDB` y `appState.data` no tenían permisos documentales, de Cliente, Legal ni firma; se añadieron controles en funciones y UI.
6. El timeline mostraba siempre `/5`; ahora usa `stages.length` para las etapas F1–F4.
7. Las vistas F4 no existían en router ni markup; se añadieron `client-portal`, `documents` y `legal`, sus contenedores y renderizadores.
8. La firma del segundo rol no podía simularse con el usuario demo único porque se bloqueaba por `userId`; la unicidad ahora se verifica por `documentId + role`, que corresponde a los dos firmantes requeridos de la demo.
9. El Portal Cliente inicialmente no ofrecía la firma Cliente y el Gerente no tenía acción de firma accesible; se añadieron acciones en Portal, Workflow y Documents respetando permisos.
10. Se confirmó que `index.html` no tiene llamadas `fetch`, `XMLHttpRequest` ni `axios` para datos externos.

## Verificación funcional

### Verificaciones ejecutadas

- `VERIFICADO POR EJECUCIÓN`: extracción del script inline con `new Function(...)` sin error de sintaxis.
- `VERIFICADO POR EJECUCIÓN`: `npm run build` completó correctamente con Vite 6.4.4; salida `dist/index.html` generada.
- `VERIFICADO POR EJECUCIÓN`: smoke end-to-end F1–F4 en un DOM controlado: 20 APUs, incremento sin duplicado, cantidad decimal, workflow F2, propuesta, envío, visto, aprobación Cliente, revisión Legal, contrato, dos firmas, `SIGNED`, `AWARDED`, sincronización mock y eventos de auditoría. Resultado observado: `apus=20`, `items=2`, `documents=2`, `signatures=2`, `stage=AWARDED`, `status=AWARDED`, `auditEvents=39`.
- `VERIFICADO POR EJECUCIÓN`: smoke de ramas: `CLIENT_REVIEW → CHANGES_REQUESTED → BUDGETING`, generación de propuesta v2, preservación del snapshot v1, devolución Legal a `BUDGETING` y sincronización de dos documentos. Resultado observado: `proposalVersions=[1,2]`, `stage=BUDGETING`, `clientCanBudget=false`, `mockDocuments=2`.
- `VERIFICADO POR EJECUCIÓN`: `git diff --check` no reportó errores de whitespace; solo informó la conversión de finales de línea CRLF de Git.
- `VERIFICADO POR INSPECCIÓN`: no hay referencias a IDs estáticos inexistentes; la comprobación automatizada de `getElementById()` no encontró faltantes.
- `VERIFICADO POR INSPECCIÓN`: no hay llamadas de datos externas en `index.html`.
- `VERIFICADO POR INSPECCIÓN`: `escapeHTML()` se aplica a nombres, estados, comentarios, motivos, IDs y datos documentales mostrados en Fase 4.

### Cobertura y límites de la verificación

- `VERIFICADO POR EJECUCIÓN`: flujo principal de aprobación y firma.
- `VERIFICADO POR EJECUCIÓN`: flujo de cambios Cliente y versionado.
- `VERIFICADO POR EJECUCIÓN`: restricciones principales del rol Cliente y ausencia de datos internos en el markup del Portal.
- `VERIFICADO POR INSPECCIÓN`: Legal no recibe `budget:write`, `scenario:write` ni `settings:write`; Cliente no recibe esos permisos ni permisos de aprobación interna.
- `VERIFICADO POR INSPECCIÓN`: componentes React de `src/` no son el runtime que consume el navegador en esta demo.
- `NO VERIFICADO`: compatibilidad visual en todos los navegadores, navegación con lector de pantalla, impresión real en cada navegador y concurrencia de múltiples usuarios.
- `NO APLICA`: PDF real, email real, firma criptográfica, backend, MinIO, DocuSeal y dashboard Fase 5, porque están fuera del alcance de esta iteración.

## Limitaciones actuales

1. Todos los datos viven en memoria; recargar la página elimina documentos, approvals, firmas y auditoría.
2. `mockDB` es una estructura JavaScript, no una base de datos transaccional.
3. El selector de rol es una simulación; no hay autenticación, sesión segura ni separación real de identidades.
4. La firma usa `method: "DEMO_SIGNATURE"`; no prueba identidad, integridad criptográfica ni validez legal.
5. El contrato usa términos demo y no una plantilla legal revisada.
6. Solo `ECONOMIC_PROPOSAL` y `CONTRACT` tienen generadores; los otros cuatro tipos de documento son `PLACEHOLDER ESTRUCTURAL`.
7. No hay PDF real ni envío de email. El botón de impresión solo invoca `window.print()` cuando existe.
8. No hay portal externo, enlace seguro, token de cliente ni almacenamiento de archivos.
9. No hay vista visual del AuditLog, dashboard, KPIs ni exportación; Fase 5 debe implementar esas vistas consumiendo `appState.data.auditLog` y los documentos existentes.
10. El usuario demo único se reutiliza al cambiar de rol; la simulación distingue los firmantes por rol, no por una identidad externa independiente.
11. No existe backend para impedir que un cliente manipule el DOM o los datos locales; RBAC actual es control de UI y funciones de la demo.

## Cambios de esta iteración

1. Se extendieron `APP_CONFIG.supportedViews`, `WORKFLOW_STATUS`, `WORKFLOW_STAGE`, etiquetas y owners en `index.html`.
2. Se añadieron `DOCUMENT_TYPE`, `DOCUMENT_STATUS`, `COMMENT_VISIBILITY` y `REQUIRED_CONTRACT_SIGNERS`.
3. Se añadieron `documents` y `signatures` a `mockDB`, `appState.data`, aliases, hidratación, sincronización e IDs.
4. Se amplió `rolePermissions` para documentos, propuestas, Legal, contratos, firma y comentarios de Cliente.
5. Se ampliaron `getWorkflowTransitionPermission()`, `getWorkflowDecisionPermission()`, `getDefaultWorkflowStatusForStage()` y `changeWorkflowStage()`.
6. Se extendió `createApprovalRecord()` y `addWorkflowComment()` manteniendo compatibilidad F2.
7. Se implementaron los motores de documentos, propuesta económica, versionado, Portal Cliente, Legal, contrato y firmas.
8. Se añadieron los renderizadores `renderClientPortalView()`, `renderDocumentsView()`, `renderProposalPreview()` y `renderLegalView()`.
9. Se añadieron las secciones DOM y navegación `client-portal`, `documents` y `legal`.
10. Se conectaron las acciones F4 en `handleAppClick()` con event delegation.
11. Se agregaron eventos de auditoría para propuesta, Cliente, Legal, contrato, firma y adjudicación.
12. Se creó este archivo `md/fase-4-1.md`; `md/fase-3-1.md` permaneció intacto.

## Impacto técnico de esta iteración

- Archivo funcional afectado: `index.html`.
- Archivo documental creado: `md/fase-4-1.md`.
- Contratos ampliados: workflow, approvals, comments, `appState.data.documents`, `appState.data.signatures`, permisos y router.
- Comportamiento conservado: APUs, presupuesto, cálculos, settings, escenarios, referencias, variancias, riesgo, filtros, aliases F1–F3 y workflow de revisiones internas.
- Dependencias nuevas: ninguna dependencia npm; no se agregó biblioteca PDF, firma ni cliente HTTP.
- Riesgo residual: el runtime inline es un archivo grande y mantiene una arquitectura demo en memoria; las futuras modificaciones deben seguir los IDs, permisos y transiciones documentados.
- Riesgo de seguridad esperado: RBAC es local al cliente y no puede sustituir autorización backend.

## Compatibilidad

- Se preservaron los nombres públicos de funciones F1–F3.
- `createApprovalRecord()` conserva los campos históricos y agrega `documentId`.
- `addWorkflowComment(message)` continúa funcionando sin segundo argumento.
- Los aliases de `appState` y filtros continúan definidos.
- Las vistas antiguas siguen registradas en `viewRegistry`.
- La aplicación sigue compilando con el `package.json` existente y no requiere migrar a React para esta fase.

## Preparación para siguientes fases

La siguiente implementación debe reutilizar, sin duplicar estado ni workflow:

- `appState.data.auditLog` y `logAuditEvent()` como fuente para la vista histórica;
- `appState.data.documents`, `getDocumentsForBudget()`, tipos/status y snapshots como fuente del dashboard documental;
- `appState.data.signatures` y `getDocumentSignatures()` para indicadores de cierre;
- `appState.workflow.currentStage/status` para KPIs de pipeline;
- `rolePermissions` y `hasPermission()` para filtrar acciones y métricas por rol;
- `viewRegistry`, `navigateTo()` y los contenedores actuales para incorporar `audit` y `dashboard` sin crear un router paralelo.

No se inició Fase 5 en esta iteración.

## Próxima fase

Fase 5 debe implementar explícitamente el dashboard y la auditoría visual: componentes para KPIs por etapa, documentos, conversiones, cambios, firmas y adjudicaciones; filtros por proyecto/cliente/rol/fecha; consulta de `auditLog`; estados vacíos; exportación si se define; y, si el plan lo requiere, persistencia backend. Debe mantener el mismo `changeWorkflowStage()`, los estados documentales, los snapshots y las firmas existentes.

Las capacidades de Fase 2 ya están usadas por Fase 4: `rolePermissions`, `hasPermission()`, `changeWorkflowStage()`, `createApprovalRecord()` y `addWorkflowComment()`. No queda una aprobación interna de Fase 2 pendiente para que el flujo F4 funcione; cualquier ampliación de autenticación o autorización de servidor pertenece a una iteración posterior y no está incluida aquí.

## Arquitectura Producción / Homelab

Esta sección describe arquitectura objetivo, no implementación presente.

| Necesidad | Demo actual | Objetivo de producción/homelab | Estado actual |
|---|---|---|---|
| Base de datos | `mockDB` y `appState` en memoria | PostgreSQL autohospedado | `NO IMPLEMENTADO` |
| Archivos/documentos | `contentSnapshot` JavaScript | MinIO | `NO IMPLEMENTADO` |
| Identidad/RBAC | selector local de rol | Keycloak y autorización de servidor | `NO IMPLEMENTADO` |
| Firma | `DEMO_SIGNATURE` | DocuSeal o proveedor legal equivalente | `NO IMPLEMENTADO` |
| Email | botón/acciones locales | servicio SMTP o proveedor transaccional | `NO IMPLEMENTADO` |
| Automatizaciones | ninguna | n8n | `NO IMPLEMENTADO` |
| Agenda | ninguna | Cal.com si el producto lo requiere | `NO IMPLEMENTADO` |

No se debe interpretar esta tabla como servicios instalados.

## Contrato para la siguiente iteración

1. No crear una segunda colección de workflow: usar `appState.workflow` y `changeWorkflowStage()`.
2. No mutar `contentSnapshot` después de generar una propuesta o contrato.
3. No mostrar al Cliente comentarios `INTERNAL`, settings económicos, márgenes, overhead, proveedores, riesgo o AuditLog.
4. Mantener `documentId` y `visibility` en comentarios.
5. Mantener unicidad de firma por documento y rol requerido.
6. Auditar cada transición y cada acción documental relevante mediante `logAuditEvent()`.
7. Usar estados exactos de `WORKFLOW_STATUS` y `DOCUMENT_STATUS`; no introducir etiquetas ambiguas.
8. Mantener los estados históricos de documentos y no sobrescribir versiones anteriores.
9. Si se añade persistencia, migrar las estructuras actuales sin eliminar los aliases de compatibilidad hasta verificar consumidores.
10. Antes de iniciar Fase 5, volver a verificar `npm run build`, los flujos de aprobación/cambios/firma y la matriz de permisos.

