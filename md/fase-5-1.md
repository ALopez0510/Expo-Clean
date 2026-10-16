# Fase 5 — Iteración 1

## Identificación

- Producto: CleanQuote Pro / Expo-Clean.
- Alcance: panel frontend Vanilla JS para productos de limpieza.
- Fecha de snapshot: 2026-10-16.
- Fuente de datos: PostgreSQL → Express → `/api/cleaning-products`.
- Edición/CRUD y Financial Engine: no incluidos.

## Resumen ejecutivo técnico

`index.html` ahora contiene una vista adicional `cleaning-products`, accesible desde la navegación principal con la etiqueta “Productos de Limpieza”. La vista reutiliza Tailwind/CDN, `escapeHTML`, `formatCurrency`, `hasPermission`, `apiClient` y el sistema de navegación existente.

El panel carga los productos solo al entrar a la vista mediante `apiClient.getCleaningProducts()`. No se duplican productos en `mockDB` ni en el HTML. La interfaz muestra búsqueda, categoría, estado activo/inactivo, contador, tabla y un drawer de detalle usando `#modal-container`.

El precio de compra solo se muestra cuando la sesión tiene el permiso frontend existente `price:read`. El precio de venta se muestra en la tabla y el drawer. Esto es una visibilidad de SPA; el backend actual no tiene RBAC granular por campo.

## Estado general de implementación

| Capacidad | Estado | Evidencia |
|---|---|---|
| Entrada de navegación Productos de Limpieza | IMPLEMENTADO Y FUNCIONAL | Botón `data-view="cleaning-products"` y `supportedViews` |
| Lectura API del catálogo | IMPLEMENTADO PARCIALMENTE | `apiClient.getCleaningProducts()` y `loadCleaningProducts()`; requiere API/DDL activos |
| Tabla de productos | IMPLEMENTADO PARCIALMENTE | `renderCleaningProductsView()` |
| Búsqueda, categoría y estado | IMPLEMENTADO Y FUNCIONAL por inspección | `cleaningProductFilters` y handlers de input/change |
| Contador | IMPLEMENTADO Y FUNCIONAL por inspección | Conteo de productos filtrados |
| Drawer/modal de detalle | IMPLEMENTADO PARCIALMENTE | `renderCleaningProductDrawer()` en `#modal-container` |
| Loading, vacío y error | IMPLEMENTADO Y FUNCIONAL por inspección | Estados en `renderCleaningProductsView()` |
| CRUD | NO IMPLEMENTADO | No hay botones ni mutaciones de productos |
| Financial Engine | NO IMPLEMENTADO | No se modificaron cálculos de presupuesto |

## Cómo funciona actualmente

La SPA sigue siendo el `index.html` activo. Al iniciar sesión, el flujo existente hidrata usuarios, roles, clientes, proyectos, APUs y presupuesto. El catálogo de productos no se agrega a ese `Promise.all`, evitando que una tabla 003 ausente o un endpoint no disponible rompa la hidratación de APUs y `BUD-001`.

Al pulsar “Productos de Limpieza”, `navigateTo()` comprueba que la vista esté soportada y que el rol tenga `apu:read`. Si el catálogo no se ha cargado, llama a `loadCleaningProducts()`. La respuesta `{ items: [...] }` se normaliza a `appState.data.cleaningProducts` y la vista se renderiza.

Si la API falla, el panel muestra mensaje de error y botón “Reintentar”. No existe fallback de productos en memoria porque eso requeriría duplicar datos; el fallback `mockDB` existente continúa aplicándose únicamente al flujo histórico de presupuesto/APUs.

## Arquitectura global

```text
PostgreSQL cleaning_products
          ↓
Express GET /api/cleaning-products
          ↓
index.html → apiClient.getCleaningProducts()
          ↓
appState.data.cleaningProducts
          ↓
renderCleaningProductsView() / renderCleaningProductDrawer()
```

La vista es un módulo adicional. No reemplaza `apu-catalog` ni modifica el motor financiero.

## Estructura física del proyecto

- `index.html`: navegación, estado, cliente API, renderer, filtros y drawer.
- `server/server.js`: endpoint backend existente de productos; no se modificó en esta fase.
- `server/repositories/cleaning-product-repository.js`: origen backend de los datos; no se modificó en esta fase.
- `server/serializers.js`: contrato camelCase usado por API; no se modificó.
- `tests/server-contract.test.js`: contratos de navegación y ausencia de IDs demo hardcodeados.
- `md/fase-5-1.md`: snapshot técnico de esta iteración.

## Datos y modelos actuales

El frontend consume los campos serializados por el backend: `id`, `sku`, `name`, `category`, `brand`, `description`, `unit`, `presentation`, `contentQuantity`, `contentUnit`, `purchasePrice`, `salePrice`, `supplier`, `sanitaryRegistration`, `active` y `metadata`.

La normalización conserva metadata flexible y convierte el ID a string. No transforma precios en datos financieros ni los incorpora a `budget.items`.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| Catálogo APU | IMPLEMENTADO Y FUNCIONAL | `renderApuCatalogView()` | `Catálogo de APUs` | Búsqueda, filtros y agregar al presupuesto | Suite existente | Histórica |
| Productos de Limpieza | IMPLEMENTADO PARCIALMENTE | `renderCleaningProductsView()` | `Productos de Limpieza` | Lectura, filtros y selección | Sintaxis + suite | 5.1 |
| Detalle de producto | IMPLEMENTADO PARCIALMENTE | `renderCleaningProductDrawer()` | Drawer lateral | Abrir/cerrar, Escape, overlay | Inspección estática | 5.1 |
| Precio de compra | IMPLEMENTADO PARCIALMENTE | `hasPermission("price:read")` | Columna/detalle condicionado | Visible para permisos existentes | Inspección estática | 5.1 |
| CRUD productos | NO IMPLEMENTADO | Ningún handler de escritura | No | No aplica | Código real | Posterior |
| Financial Engine con productos | NO IMPLEMENTADO | Sin cambios | No | No aplica | Código real | Posterior |

## Roles y estado RBAC

La vista usa el permiso frontend existente `apu:read`, porque productos son componentes de costo asociados al catálogo APU. La columna y el detalle de `purchasePrice` usan `price:read`. El backend sigue aceptando cualquier sesión autenticada en la ruta; la ocultación del precio es únicamente de UI hasta que exista RBAC granular backend.

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí | `apu:read`, `price:read` | Sí | Ver panel y precio de compra | IMPLEMENTADO PARCIALMENTE |
| Revisor Técnico | Sí | No `price:read`; según contrato puede no tener `apu:read` | Condicionada por permiso | Solo si tiene `apu:read`; precio oculto sin `price:read` | IMPLEMENTADO PARCIALMENTE |
| Director Financiero | Sí | `apu:read`/`price:read` según sesión | Sí si permiso | Ver panel y precio si permiso | IMPLEMENTADO PARCIALMENTE |
| Gerente General | Sí | Sin permiso específico de productos en contrato actual | No si no tiene `apu:read` | No tiene acceso garantizado al panel | IMPLEMENTADO PARCIALMENTE |
| Cliente | Sí | No `apu:read` | No | No ve el panel | IMPLEMENTADO PARCIALMENTE |
| Oficial Legal | Sí | Sin permiso específico de productos en contrato actual | No si no tiene `apu:read` | No tiene acceso garantizado al panel | IMPLEMENTADO PARCIALMENTE |

## Componentes principales

- Navegación lateral: botón `data-view="cleaning-products"`; `renderSidebar()` aplica `canViewForRole()` y puede ocultarlo.
- `cleaning-products-section`: sección `data-ui-view` sincronizada por la capa UI existente.
- `cleaning-products-view-container`: destino del renderer de catálogo.
- `modal-container`: contenedor existente reutilizado para el drawer, sin crear otro sistema modal.
- `cleaningProductSearch`, `cleaningProductCategory`, `cleaningProductActive`: controles renderizados por el panel.

## Funciones y utilidades principales

| Archivo | Función | Responsabilidad | Efectos |
|---|---|---|---|
| `index.html` | `apiClient.getCleaningProducts()` | Solicita `/api/cleaning-products` | Lectura HTTP |
| `index.html` | `normalizeApiCleaningProduct()` | Normaliza ID, strings, booleano activo y metadata | No persiste |
| `index.html` | `loadCleaningProducts()` | Gestiona carga, éxito y error | Actualiza estado de productos |
| `index.html` | `renderCleaningProductsView()` | Renderiza filtros, contador, tabla y estados | Actualiza DOM del panel |
| `index.html` | `renderCleaningProductDrawer()` | Renderiza detalle y valores condicionados por permiso | Actualiza `modal-container` |
| `index.html` | `navigateTo()` | Activa vista y carga productos al entrar | Actualiza vista/scroll |
| `index.html` | `handleAppInput()` / `handleAppChange()` | Actualiza filtros locales | Re-renderiza panel |

## Flujos funcionales end-to-end

### Entrada al panel

1. Usuario autenticado pulsa el botón lateral.
2. `handleAppClick()` llama `navigateTo("cleaning-products")`.
3. `navigateTo()` valida `apu:read` y activa la vista.
4. `loadCleaningProducts()` solicita la API.
5. La respuesta se normaliza y guarda en `appState.data.cleaningProducts`.
6. `renderCleaningProductsView()` muestra tabla y contador.

### Filtrado

1. Usuario escribe o cambia un filtro.
2. El handler actualiza `appState.ui.cleaningProductFilters`.
3. `renderCleaningProductsView()` aplica búsqueda por SKU, nombre, marca y descripción, categoría y estado.
4. La tabla y el contador se actualizan sin modificar PostgreSQL.

### Detalle

1. Usuario pulsa el nombre de un producto.
2. `openCleaningProductDrawer()` guarda el ID seleccionado.
3. `renderCleaningProductDrawer()` muestra descripción, presentación, proveedor, registro sanitario, metadata, precios y marcador demo.
4. El botón, overlay o tecla Escape llama `closeCleaningProductDrawer()`.

## Estado y gestión de datos

- `appState.data.cleaningProducts`: productos recibidos desde API.
- `appState.ui.cleaningProductsLoading`: estado de carga.
- `appState.ui.cleaningProductsLoaded`: indica respuesta recibida.
- `appState.ui.cleaningProductsError`: mensaje de error visible.
- `appState.ui.cleaningProductFilters`: búsqueda, categoría y estado.
- `appState.ui.selectedCleaningProductId`: producto activo en drawer.
- No se agregan productos al `mockDB`.
- No se modifican APUs, presupuestos ni partidas.

## Workflow y aprobaciones

No se modificaron workflow, aprobaciones, escenarios ni acciones de presupuesto.

## Auditoría

La consulta y navegación del catálogo no generan eventos de auditoría nuevos. No existe en esta fase una acción de escritura de producto que requiera trazabilidad.

## Dependencias internas

- `renderCleaningProductsView()` usa `escapeHTML`, `formatCurrency`, `hasPermission`, `APP_CONFIG` y `appState` existentes.
- `loadCleaningProducts()` usa `apiClient` y `readApiCollection` existentes.
- `syncView()` de la UI layer reconoce automáticamente la nueva sección por `data-ui-view`.
- La respuesta depende del endpoint Express y de la migración 003.

## Verificación contra código

- Se revisaron `AGENTS.md`, `md/AGENTS.md` y `md/fase-4-1.md`.
- Se revisaron navegación, `apiClient`, `appState`, `hydrateStateFromApi`, RBAC, router, renderers y handlers de `index.html`.
- Se verificó que no existen IDs `PRD-DEMO-*` en `index.html`.
- Se verificó que `apu-catalog` permanece separado y registrado.
- Se verificó que la API de productos no se incluye en la hidratación crítica del presupuesto.

## Verificación funcional

- Compilación de los cuatro bloques JavaScript extraídos de `index.html`: VERIFICADO POR EJECUCIÓN.
- Contrato estático de navegación, cliente API, renderer y ausencia de productos hardcodeados: VERIFICADO POR EJECUCIÓN.
- `npm test` con `DB_PASSWORD` vacío en el proceso: VERIFICADO POR EJECUCIÓN, 10/10 pruebas.
- Navegación autenticada con PostgreSQL y datos reales: NO VERIFICADO en esta sesión.
- Render visual en navegador real: NO VERIFICADO en esta sesión.
- Respuesta API vacía/error en navegador real: VERIFICADO POR INSPECCIÓN; requiere prueba manual con servidor y migración activos.

## Limitaciones actuales

1. El panel requiere que el endpoint y la migración 003 estén disponibles para mostrar datos.
2. No existe fallback de productos en memoria, deliberadamente, para evitar duplicar el catálogo.
3. La visibilidad de `purchasePrice` es frontend; el backend no restringe el campo por rol.
4. No existe paginación ni ordenamiento configurable.
5. No existe edición, alta, baja ni asociación APU desde la UI.
6. El Financial Engine todavía no calcula consumo de productos.

## Cambios de esta iteración

1. Se añadió el botón lateral `Productos de Limpieza`.
2. Se añadió `apiClient.getCleaningProducts()`.
3. Se añadió estado de productos, loading, error, selección y filtros.
4. Se añadió `renderCleaningProductsView()` con tabla, filtros y contador.
5. Se añadió `renderCleaningProductDrawer()` con metadata y marcador DEMO.
6. Se añadió visibilidad de precio de compra usando `price:read`.
7. Se añadieron contratos estáticos en `tests/server-contract.test.js`.
8. Se creó este snapshot técnico.

## Impacto técnico de esta iteración

- Archivo modificado: `index.html`.
- Archivo modificado: `tests/server-contract.test.js`.
- Archivo creado: `md/fase-5-1.md`.
- No se modificaron backend, API, migraciones, APUs, presupuestos ni Financial Engine.
- La navegación existente se conserva mediante `supportedViews`, `viewRegistry`, `navigateTo` y `syncView`.
- Riesgo residual: cambios en el contrato de permisos pueden ocultar la vista o el precio de compra hasta que se defina un permiso específico.

## Compatibilidad

- Vanilla JS preservado.
- Tailwind/CDN preservado.
- Catálogo APU preservado.
- `mockDB` histórico preservado sin productos hardcodeados.
- Login, `/api/me`, `/api/apus` y `/api/budgets` no fueron modificados.
- Los errores de API no cambian el estado del catálogo APU ni del presupuesto.

## Preparación para siguientes fases

La siguiente fase puede añadir integración visual de productos ligados a un APU usando `GET /api/apus/:apuId/cleaning-products`, pero deberá definir primero la ubicación dentro del detalle APU y el uso del snapshot de costo. La edición deberá incorporar permisos backend y frontend separados del permiso de lectura.

## Próxima fase

1. Ejecutar prueba manual autenticada con PostgreSQL y migración 003.
2. Verificar roles con y sin `price:read` en navegador.
3. Integrar lectura de relaciones dentro del detalle de APU si el alcance lo autoriza.
4. Diseñar permisos y endpoints de escritura antes de implementar CRUD.

## Arquitectura Producción / Homelab

No se añadieron servicios de producción ni dependencias nuevas. La SPA sigue sirviéndose por Express y consumiendo la API relativa `/api`.

## Contrato para la siguiente iteración

- No hardcodear productos en `index.html`.
- Mantener `cleaning-products` como módulo adicional, separado de `apu-catalog`.
- Mantener `purchasePrice` condicionado por permiso hasta definir RBAC backend.
- No alterar Financial Engine sin contrato de unidades y snapshots.
- Mantener estados loading, vacío y error.
- Verificar visualmente en navegador y contra PostgreSQL real antes de elevar el estado a `IMPLEMENTADO Y FUNCIONAL`.
