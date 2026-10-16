# Fase 7 — Iteración 1

## Identificación

- Producto: CleanQuote Pro / Expo Clean Ecuador 2026.
- Alcance: CRUD controlado del catálogo de productos de limpieza para la demo.
- Fecha de snapshot: 2026-10-16.
- Documentación anterior revisada: `md/fase-6-1.md`.
- Fuente de verdad: `index.html`, `server/server.js`, `server/repositories/cleaning-product-repository.js`, `server/migrations/003_add_cleaning_products.sql` y `tools/demo_data.py`.
- No se añadió una migración en esta iteración porque el esquema vigente ya contiene las columnas, restricciones y FKs requeridas.

## Resumen ejecutivo técnico

El catálogo de productos de limpieza ahora tiene escritura controlada sobre las tablas existentes. Express expone `POST /api/cleaning-products`, `PUT/PATCH /api/cleaning-products/:id` y `DELETE /api/cleaning-products/:id`. `DELETE` no borra filas: cambia `active` a `false` y conserva las relaciones `apu_cleaning_products`.

La SPA mantiene el catálogo anterior y añade controles de nuevo, edición, activación y desactivación. Las validaciones se ejecutan en el navegador para feedback inmediato y en el repositorio para proteger el contrato real. Los permisos de escritura reutilizan `budget:write` porque el esquema de roles no tiene todavía un permiso específico para productos. La API sigue devolviendo `purchasePrice` a cualquier sesión autenticada; la ocultación por `price:read` es una regla de la SPA heredada y no un RBAC server-side por campo.

Los eventos `PRODUCT_CREATED`, `PRODUCT_UPDATED` y `PRODUCT_DEACTIVATED` se registran con `logAuditEvent()` en el `auditLog` local existente. No son eventos backend inmutables: el proyecto no tiene una tabla ni endpoint de auditoría persistente para estas mutaciones.

## Estado general de implementación

| Capacidad | Estado | Evidencia |
|---|---|---|
| Lectura del catálogo | IMPLEMENTADO Y FUNCIONAL | `GET /api/cleaning-products`, `listCleaningProducts()` y `renderCleaningProductsView()` |
| Crear producto | IMPLEMENTADO PARCIALMENTE | `POST`, `createCleaningProduct()`, formulario y evento local; ejecución DB real pendiente de sesión válida |
| Editar producto | IMPLEMENTADO PARCIALMENTE | `PATCH`/`PUT`, `updateCleaningProduct()` y `openEditCleaningProductForm()` |
| Desactivar producto | IMPLEMENTADO PARCIALMENTE | `DELETE` lógico mediante `deactivateCleaningProduct()`; conserva FKs |
| Activar producto | IMPLEMENTADO PARCIALMENTE | `PATCH { active: true }` desde `activateCleaningProduct()` |
| Validación de SKU y campos | IMPLEMENTADO Y FUNCIONAL por inspección | `validateProductPayload()`, validación client-side y UNIQUE de `003_add_cleaning_products.sql` |
| Permiso de escritura | IMPLEMENTADO PARCIALMENTE | `requireCleaningProductWrite()` en Express y `canManageCleaningProducts()` en SPA; usa puente `budget:write` |
| Auditoría local | IMPLEMENTADO PARCIALMENTE | `logAuditEvent()` con tres acciones; no existe persistencia backend inmutable |
| Financial Engine con productos | NO IMPLEMENTADO | Se mantienen `components` y totales; no se cambia el cálculo por riesgo de doble conteo |
| Edición de relaciones APU-producto | NO IMPLEMENTADO | No existen endpoints ni controles CRUD para `apu_cleaning_products` |

## Cómo funciona actualmente

El usuario autenticado navega a `Productos de Limpieza`. `navigateTo()` comprueba `getViewPermission("cleaning-products")`, que actualmente exige `apu:read`, y `loadCleaningProducts()` llama al API existente. `renderCleaningProductsView()` filtra localmente por búsqueda, categoría y estado, muestra el contador y añade acciones de escritura solo cuando `canManageCleaningProducts()` devuelve verdadero.

Al crear o editar, `openNewCleaningProductForm()` u `openEditCleaningProductForm()` abren el formulario en el mismo `#modal-container` utilizado por los drawers existentes. `collectCleaningProductForm()` valida texto, precios, contenido y JSONB; `saveCleaningProduct()` llama a `apiClient.createCleaningProduct()` o `apiClient.updateCleaningProduct()`, actualiza el catálogo y registra un evento local.

Al desactivar, `deactivateCleaningProduct()` pide confirmación, llama al `DELETE` lógico y conserva el producto para no romper FKs. Al activar, `activateCleaningProduct()` usa el mismo `PATCH` de actualización con `active: true`. La UI no ofrece borrado físico.

En el backend, `requireAuth` resuelve la sesión mediante `findUserById()`. `requireCleaningProductWrite()` evalúa el objeto JSONB de permisos de `request.user.role.permissions` y exige `budget:write`. El servidor delega la validación, unicidad y SQL parametrizado al repositorio; `server.js` no contiene SQL.

## Arquitectura global

```text
index.html
  apiClient + renderCleaningProductsView()
       │
       ├── POST/PATCH/PUT/DELETE /api/cleaning-products
       │             │
       │             ▼
       │     server/server.js
       │             │ requireAuth + budget:write
       │             ▼
       │     cleaning-product-repository.js
       │             │ SQL parametrizado
       │             ▼
       └── PostgreSQL cleaning_products
                         │ FK restrict
                         ▼
                  apu_cleaning_products → apus → budgets
```

El producto sigue siendo un componente de costo de un APU, no una tienda. La relación existente producto → APU → presupuesto se conserva. Esta iteración no recalcula `unitPrice`, `budget_items` ni `totals`.

## Estructura física del proyecto

- `index.html`: cliente API, estado del editor, validación de formulario, render de tabla/drawer, eventos y auditoría local.
- `server/server.js`: importación del repositorio, permiso de escritura y rutas CRUD.
- `server/repositories/cleaning-product-repository.js`: validación, SKU, inserción, actualización, desactivación lógica, lectura y relación APU-producto.
- `server/migrations/003_add_cleaning_products.sql`: esquema existente no modificado en esta iteración.
- `server/serializers.js`: serializa snake_case a camelCase; no requiere cambio.
- `tools/demo_data.py`: seed oficial de 15 productos ficticios y relaciones demo; no se cambia en esta iteración.
- `tests/server-contract.test.js`: protección de mutaciones sin sesión, contrato de UI, repositorio y no borrado físico.
- `README.md`: documentación de producto, flujo y comandos demo.
- `md/fase-7-1.md`: este snapshot completo.

## Datos y modelos actuales

### `cleaning_products`

La tabla existente usa IDs `VARCHAR`, `sku` único, `name`, `category`, `unit` obligatorios, precios no negativos, `active`, `metadata JSONB` y timestamps. El repositorio acepta payload camelCase y snake_case para conservar compatibilidad de integración. Los nuevos IDs de aplicación tienen forma `PRD-<UUID corto>`; los datos seed conservan `PRD-DEMO-001...`.

### `apu_cleaning_products`

La relación mantiene `apu_id` y `product_id` con FKs `ON DELETE RESTRICT`, consumo positivo, unidad, factor de desperdicio, snapshot de precio y metadata. Esta fase no permite crear ni editar relaciones: solo modifica la ficha del producto sin tocar la relación.

### JSONB y datos demo

`metadata` conserva datos flexibles y el backend fuerza `demo: true`, `marketPriceClaim: false` y un `source` por defecto para los productos creados por este flujo. Las marcas, proveedores y precios de `tools/demo_data.py` son ficticios y no se presentan como precios de mercado.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| Catálogo de productos | IMPLEMENTADO Y FUNCIONAL | `listCleaningProducts()` | Tabla, filtros y contador | Consulta y detalle | Código + contratos | 5/7.1 |
| Alta de producto | IMPLEMENTADO PARCIALMENTE | `createCleaningProduct()` | `renderCleaningProductEditor()` | Validar y guardar | Código + sintaxis | 7.1 |
| Edición de producto | IMPLEMENTADO PARCIALMENTE | `updateCleaningProduct()` | Formulario modal | PATCH/PUT | Código + sintaxis | 7.1 |
| Activar/desactivar | IMPLEMENTADO PARCIALMENTE | `deactivateCleaningProduct()` | Botones y confirmación | `active=false/true` | Código + contrato | 7.1 |
| Relación producto-APU | IMPLEMENTADO PARCIALMENTE | `listCleaningProductsForApu()` | Drawer APU de solo lectura | Lectura de consumo/costo informativo | Código + suite | 6 |
| Integración financiera | NO IMPLEMENTADO | Sin cambios en Financial Engine | Advertencia anti doble conteo | No muta totales | Inspección | Posterior |
| Auditoría persistente | NO IMPLEMENTADO | No existe tabla de eventos | AuditLog local | Eventos locales no inmutables | Inspección | Posterior |

## Roles y estado RBAC

La SPA usa `rolePermissions` estático como fallback y permisos efectivos de `/api/me` después del login. La lectura del módulo y del catálogo APU requiere `apu:read`. La escritura usa `budget:write` en frontend y backend. No existe `cleaning-products:write` en `server/migrations/002_sync_role_permissions.sql`.

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí | `apu:read`, `budget:write`, `price:read` | Sí, ve Nuevo/Editar/Activar/Desactivar | Puede mutar productos si la sesión tiene `budget:write` y la API está disponible | IMPLEMENTADO PARCIALMENTE |
| Revisor Técnico | Sí | `budget:read` y revisión; no `budget:write` en permisos actuales | No recibe controles de escritura | Puede consultar solo si su sesión obtiene `apu:read`; Express rechaza mutaciones | IMPLEMENTADO PARCIALMENTE |
| Director Financiero | Sí | `budget:read`, `price:read`; no `budget:write` | No recibe controles de escritura | Puede consultar según `apu:read` efectivo; no puede mutar | IMPLEMENTADO PARCIALMENTE |
| Gerente General | Sí | `budget:read`; no `budget:write` ni `apu:read` en mapa actual | No recibe controles de escritura | No tiene acceso garantizado al panel | IMPLEMENTADO PARCIALMENTE |
| Cliente | Sí | permisos comerciales; no `apu:read` ni `budget:write` | No recibe controles de escritura | No puede administrar productos | IMPLEMENTADO Y FUNCIONAL para la restricción |
| Oficial Legal | Sí | permisos legales y lectura de presupuesto; no `budget:write` | No recibe controles de escritura | No puede administrar productos | IMPLEMENTADO Y FUNCIONAL para la restricción |

La compra puede quedar visible en la API para cualquier sesión autenticada porque el backend aún no tiene RBAC granular por campo. La SPA oculta el valor si falta `price:read`; esto es una limitación documentada, no una garantía de confidencialidad server-side.

## Componentes principales

| Archivo | Componente/función | Responsabilidad real | Estado |
|---|---|---|---|
| `index.html` | `renderCleaningProductsView()` | Tabla, filtros, contador y acciones según permisos | IMPLEMENTADO Y FUNCIONAL por inspección |
| `index.html` | `renderCleaningProductEditor()` | Formulario modal de alta y edición | IMPLEMENTADO PARCIALMENTE |
| `index.html` | `collectCleaningProductForm()` | Validación y payload camelCase | IMPLEMENTADO Y FUNCIONAL por inspección |
| `index.html` | `renderCleaningProductDrawer()` | Detalle y acciones del producto seleccionado | IMPLEMENTADO PARCIALMENTE |
| `server/server.js` | `requireCleaningProductWrite()` | Guard de `budget:write` para mutaciones | IMPLEMENTADO Y FUNCIONAL por inspección |
| `server/repositories/cleaning-product-repository.js` | `validateProductPayload()` | Validación común de create/update | IMPLEMENTADO Y FUNCIONAL por inspección |
| `server/repositories/cleaning-product-repository.js` | `deactivateCleaningProduct()` | Actualización lógica de `active` | IMPLEMENTADO Y FUNCIONAL por inspección |

## Funciones y utilidades principales

| Archivo | Función | Entrada | Salida/efecto | Estado |
|---|---|---|---|---|
| `index.html` | `canManageCleaningProducts()` | Sesión actual | Booleano basado en `budget:write` | IMPLEMENTADO Y FUNCIONAL |
| `index.html` | `saveCleaningProduct()` | Estado del editor + DOM | POST/PATCH, refresh y evento local | IMPLEMENTADO PARCIALMENTE |
| `index.html` | `deactivateCleaningProduct()` | ID de producto | Confirmación, DELETE lógico, refresh y evento | IMPLEMENTADO PARCIALMENTE |
| `index.html` | `activateCleaningProduct()` | ID de producto | PATCH `active:true`, refresh y evento | IMPLEMENTADO PARCIALMENTE |
| `server/repositories/cleaning-product-repository.js` | `createCleaningProduct()` | Objeto JSON | INSERT parametrizado y fila serializada | IMPLEMENTADO Y FUNCIONAL por inspección |
| `server/repositories/cleaning-product-repository.js` | `updateCleaningProduct()` | ID + objeto JSON | UPDATE parametrizado y fila serializada | IMPLEMENTADO Y FUNCIONAL por inspección |
| `server/repositories/cleaning-product-repository.js` | `assertSkuAvailable()` | SKU + ID opcional | Detecta duplicados case-insensitive | IMPLEMENTADO Y FUNCIONAL por inspección |
| `server/repositories/cleaning-product-repository.js` | `findProductRow()` | ID | SELECT parametrizado o 404 | IMPLEMENTADO Y FUNCIONAL por inspección |
| `index.html` | `logAuditEvent()` | Acción, entidad, ID, descripción, metadata | Mutación del `auditLog` local/mockDB | IMPLEMENTADO Y FUNCIONAL como auditoría local |

## Flujos funcionales end-to-end

### Crear

1. Presupuestista abre Productos de Limpieza.
2. Pulsa `Nuevo producto`; `handleAppClick()` llama `openNewCleaningProductForm()`.
3. `renderCleaningProductEditor()` muestra el formulario.
4. `saveCleaningProduct()` ejecuta `collectCleaningProductForm()` y valida campos y JSON.
5. `apiClient.createCleaningProduct()` envía `POST` a Express.
6. `requireAuth` valida sesión y `requireCleaningProductWrite` valida `budget:write`.
7. `createCleaningProduct()` valida, comprueba SKU y ejecuta `INSERT` parametrizado.
8. La SPA recarga el catálogo y registra `PRODUCT_CREATED` en auditoría local.

### Editar

1. El usuario autorizado pulsa `Editar` o `Editar producto` en el drawer.
2. `openEditCleaningProductForm()` carga el producto de `appState.data.cleaningProducts`.
3. El formulario valida nombre, categoría, unidad, precios, presentación y metadata.
4. `apiClient.updateCleaningProduct()` envía `PATCH`; `PUT` queda disponible en API para integraciones.
5. `updateCleaningProduct()` conserva el ID, comprueba SKU y actualiza columnas conocidas.
6. La UI recarga y registra `PRODUCT_UPDATED` localmente.

### Desactivar y activar

1. El usuario autorizado pulsa `Desactivar`.
2. La SPA pide confirmación y llama `DELETE /api/cleaning-products/:id`.
3. `deactivateCleaningProduct()` ejecuta `UPDATE active = FALSE`; nunca ejecuta `DELETE FROM cleaning_products`.
4. Las FKs siguen apuntando al mismo ID y las relaciones APU no se rompen.
5. Reactivar usa `PATCH { active: true }` y registra `PRODUCT_UPDATED`.

### APU y presupuesto

El drawer APU existente sigue leyendo `/api/apus/:apuId/cleaning-products` y calcula únicamente el costo informativo `consumptionPerUnit × purchasePrice`. Agregar el APU al presupuesto y cambiar cantidad continúa usando los handlers y Financial Engine existentes. Esta iteración no añade productos al `budget_items` ni modifica totales, evitando doble conteo con `components.materials`.

## Estado y gestión de datos

- `appState.ui.cleaningProductEditor`: `{ open, mode, productId, saving, error }`.
- `appState.data.cleaningProducts`: catálogo serializado y normalizado desde API.
- `cleaningProductsLoading`, `cleaningProductsLoaded`, `cleaningProductsError`: estados del catálogo.
- `cleaningProductFilters`: búsqueda, categoría y estado.
- `mockDB.auditLog` y `appState.data.auditLog`: auditoría local.
- El backend es la fuente de verdad para productos cuando `API_CONFIG.enabled` está activo; no se hardcodean `PRD-DEMO-*` en `index.html`.

## Workflow y aprobaciones

Crear, editar, activar o desactivar un producto no cambia `workflow.status`, `workflow.currentStage`, aprobaciones, documentos, comentarios ni firmas. Agregar APUs y modificar cantidades mantiene el flujo heredado. No existe aprobación de cambios de catálogo.

## Auditoría

`logAuditEvent()` registra `PRODUCT_CREATED`, `PRODUCT_UPDATED` y `PRODUCT_DEACTIVATED` con entidad `cleaning-product`, usuario/rol actuales y metadata local. El registro se modifica en memoria junto con el resto de la demo y no tiene garantía de inmutabilidad, transacción ni persistencia backend.

## Dependencias internas

- Node.js + Express 5 y `express-session`.
- PostgreSQL vía `pg` y utilidades existentes de `server/db.js`.
- `serializeRow()` para contrato camelCase.
- `escapeHTML()`, `formatCurrency()`, `hasPermission()`, `logAuditEvent()` y `loadCleaningProducts()` de `index.html`.
- Esquema existente de `server/migrations/003_add_cleaning_products.sql`.
- No se añadió ORM, TypeScript, framework frontend ni dependencia npm.

## Verificación contra código

- Se leyeron `AGENTS.md`, `md/AGENTS.md` y `tests/AGENTS.md` aplicables.
- Se revisaron `md/fase-6-1.md`, `README.md`, `index.html`, `server/server.js`, `server/repositories/cleaning-product-repository.js`, `server/serializers.js`, `server/migrations/003_add_cleaning_products.sql` y `tools/demo_data.py`.
- Se verificó que los IDs demo y las relaciones ya existen en `tools/demo_data.py`; no se inventaron IDs para esta fase.
- Se verificó que las FKs de `apu_cleaning_products` son restrictivas y que la implementación no contiene borrado físico de `cleaning_products`.
- Se verificó que el frontend no contiene SKUs demo hardcodeados.

## Verificación funcional

- `node --check server/repositories/cleaning-product-repository.js`: VERIFICADO POR EJECUCIÓN.
- `node --check server/server.js`: VERIFICADO POR EJECUCIÓN.
- `node --check tests/server-contract.test.js`: VERIFICADO POR EJECUCIÓN.
- Compilación de los cuatro bloques JavaScript de `index.html` con `new Function`: VERIFICADO POR EJECUCIÓN.
- Suite `npm test`: VERIFICADO POR EJECUCIÓN, 12/12 pruebas aprobadas.
- `python tools/demo_data.py status`: VERIFICADO POR EJECUCIÓN; `BUD-001`, 12/12 APUs y 10/10 items existen, pero el esquema de productos no está aplicado.
- `python tools/demo_data.py start`: NO VERIFICADO; terminó con el error controlado `Faltan las tablas de productos demo. Aplica server/migrations/003_add_cleaning_products.sql antes de ejecutar start.`
- Aplicación de `003_add_cleaning_products.sql`: NO VERIFICADO; no se ejecutó porque habría sido una mutación durable de esquema no autorizada explícitamente en esta iteración.
- POST/PATCH/PUT/DELETE autenticados contra PostgreSQL real: NO VERIFICADO hasta disponer de una sesión demo y DB disponible.
- Prueba visual completa del formulario y confirmación: NO VERIFICADO en navegador.
- `start`, login, consulta de APU, presupuesto, recálculo, workflow y dashboard: NO VERIFICADO end-to-end en esta iteración.

## Limitaciones actuales

1. El permiso de producto reutiliza `budget:write`; no existe `cleaning-products:write` ni una migración de roles específica.
2. `purchasePrice` sigue en la respuesta de lectura para toda sesión autenticada; `price:read` solo oculta el valor en la SPA.
3. La auditoría es local y mutable; no hay persistencia backend inmutable.
4. No existe CRUD de relaciones `apu_cleaning_products`.
5. Los productos ligados no se incluyen en Financial Engine, `unitPrice`, `budget_items` ni `totals` por el riesgo de duplicar `components.materials`.
6. El formulario exige JSON válido en metadata, pero no existe catálogo cerrado de categorías ni unidades; se valida texto no vacío y longitudes del esquema.
7. La validación de SKU tiene preconsulta y UNIQUE en DB; una carrera concurrente aún depende del manejo genérico de errores de PostgreSQL.

## Cambios de esta iteración

1. Se añadieron `createCleaningProduct()`, `updateCleaningProduct()` y `deactivateCleaningProduct()` al repositorio.
2. Se añadió validación server-side de campos, precios, contenido, metadata y SKU.
3. Se añadieron rutas POST, PUT, PATCH y DELETE lógico en `server/server.js`.
4. Se añadió `requireCleaningProductWrite()` con el permiso existente `budget:write`.
5. Se añadieron métodos CRUD al `apiClient` y estado `cleaningProductEditor`.
6. Se añadió el formulario de alta/edición, acciones de activación/desactivación y confirmación.
7. Se conectaron eventos locales `PRODUCT_CREATED`, `PRODUCT_UPDATED` y `PRODUCT_DEACTIVATED`.
8. Se ampliaron `tests/server-contract.test.js` para protección de mutaciones y no borrado físico.
9. Se actualizó `README.md` con el flujo Producto → APU → Presupuesto y la advertencia de precios demo.
10. Se creó este snapshot técnico.

## Impacto técnico de esta iteración

- Archivos modificados: `server/repositories/cleaning-product-repository.js`, `server/server.js`, `index.html`, `tests/server-contract.test.js`, `README.md`.
- Archivo creado: `md/fase-7-1.md`.
- Tablas y migraciones: sin modificación; se reutiliza el esquema ya aplicado.
- Contratos nuevos: mutaciones autenticadas de `/api/cleaning-products`; el contrato de lectura no cambia.
- Datos existentes: no se actualizan desde código; desactivar conserva filas y FKs.
- Riesgos: permissions heterogéneos entre frontend y DB, exposición server-side de `purchasePrice`, y posible error genérico ante carrera de SKU.

## Compatibilidad

- Los APUs antiguos mantienen `components JSONB` y no cambian de precio.
- `BUD-001`, `budget_items`, workflow y dashboard no reciben nuevas columnas ni migraciones.
- Los IDs existentes `PRD-DEMO-*`, `APU-DEMO-*` y `BUD-001` siguen siendo válidos.
- El serializer existente mantiene camelCase para el frontend.
- `PUT` y `PATCH` comparten la misma lógica para no duplicar reglas.
- La desactivación lógica respeta `ON DELETE RESTRICT` y evita referencias rotas.

## Preparación para siguientes fases

La siguiente fase puede añadir una política de permisos dedicada, protección server-side de precios y CRUD de `apu_cleaning_products` sobre el mismo repositorio. Antes de integrar productos en Financial Engine se debe definir una fuente única para `components.materials` versus la relación relacional y probar que no exista doble conteo.

## Próxima fase

1. Probar con PostgreSQL real las mutaciones como Presupuestista y como un rol sin `budget:write`.
2. Decidir si se agrega `cleaning-products:read/write` al JSONB de roles.
3. Definir snapshots de precio y fecha de vigencia para presupuestos productivos.
4. Diseñar la edición controlada de `apu_cleaning_products` sin modificar APUs históricos.
5. Resolver la fuente contable única antes de extender el Financial Engine.

## Arquitectura Producción / Homelab

La implementación real actual usa PostgreSQL, Node.js/Express, `express-session` y una SPA Vanilla JS. Para una instalación productiva se debe añadir un IdP/RBAC como Keycloak, PostgreSQL autohospedado con backups, un audit log persistente y observabilidad. MinIO, DocuSeal, Cal.com y n8n permanecen como arquitectura objetivo; no están implementados por esta fase.

## Contrato para la siguiente iteración

- Entrada de alta: objeto JSON con `sku`, `name`, `category`, `unit`, `purchasePrice` y opcionales de catálogo.
- Salida: `{ "product": <fila serializada> }`; alta HTTP 201, edición/desactivación HTTP 200.
- Error de SKU: HTTP 409 con código `SKU_EXISTS` cuando la preconsulta detecta duplicado.
- Error de validación: HTTP 400 con código `INVALID_PRODUCT`.
- Error de autorización: HTTP 403 con código `FORBIDDEN`.
- Eliminación: no existe borrado físico; `DELETE` significa desactivación lógica.
- Frontend: los roles sin `budget:write` no reciben controles de mutación.
