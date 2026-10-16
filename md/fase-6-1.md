# Fase 6 — Iteración 1

## Identificación

- Producto: CleanQuote Pro / Expo-Clean.
- Alcance: integración visual y de lectura de productos de limpieza dentro del detalle de un APU.
- Fecha de snapshot: 2026-10-16.
- Documentación anterior revisada: `md/fase-5-10.md` y snapshots de la Fase 5.
- Fuente de datos: PostgreSQL → Express → `GET /api/apus/:apuId/cleaning-products` → `index.html`.
- Cambios financieros, escritura de relaciones y CRUD: no incluidos.

## Resumen ejecutivo técnico

El catálogo APU no tenía un drawer de detalle: solo mostraba la acción `Agregar`. Esta iteración añade un botón `Detalle` y reutiliza el contenedor modal existente `#modal-container` para mostrar información del APU, el desglose `components` y los productos de limpieza ligados.

La SPA solicita los productos mediante `apiClient.getApuCleaningProducts(apuId)`. El drawer muestra producto, unidad, consumo por unidad de APU, precio unitario de compra, costo por unidad de APU y total según la cantidad del APU en el presupuesto activo cuando existe.

El precio unitario del APU, `components`, `budget_items`, `budgets` y el Financial Engine no se modifican. La razón es verificable en `tools/demo_data.py`: los componentes `labor`, `materials`, `equipment`, `transport` y `other` suman el `unit_price` de cada APU demo. No existe una marca que pruebe que `components.materials` excluye los productos relacionados.

## Estado general de implementación

| Capacidad | Estado | Evidencia |
|---|---|---|
| Botón Detalle en catálogo APU | IMPLEMENTADO Y FUNCIONAL | `renderApuCatalog()` añade `data-action="open-apu-detail"` |
| Drawer de detalle APU | IMPLEMENTADO PARCIALMENTE | `openApuDetailDrawer()` y `renderApuDetailDrawer()` usan `#modal-container`; falta prueba visual con PostgreSQL real |
| Lectura de relaciones APU-producto | IMPLEMENTADO PARCIALMENTE | `apiClient.getApuCleaningProducts()` y `loadApuCleaningProducts()` |
| Desglose legacy `components` | IMPLEMENTADO Y FUNCIONAL por inspección | Se conserva y se muestra por categorías, incluyendo `MATERIALES · components JSONB` |
| Productos de limpieza en el detalle | IMPLEMENTADO PARCIALMENTE | Tabla de relaciones con estados loading, vacío y error |
| Fórmula informativa por producto | IMPLEMENTADO PARCIALMENTE | `calculateApuCleaningProductCost()` calcula `consumptionPerUnit × purchasePrice` solo para render |
| Total según cantidad presupuestada | IMPLEMENTADO PARCIALMENTE | Se muestra si existe un `budget.items` con el mismo `apuId`; no se persiste ni recalcula presupuesto |
| Prevención de doble conteo | IMPLEMENTADO Y FUNCIONAL por diseño | No se modifica `unitPrice`, `components`, `budget_items` ni `calculateBudgetTotals()` |
| CRUD de productos o relaciones | NO IMPLEMENTADO | No hay endpoints ni controles de escritura en esta iteración |
| Financial Engine con productos | NO IMPLEMENTADO | Se detuvo deliberadamente por ambigüedad de `components.materials` |

## Cómo funciona actualmente

El usuario autenticado entra a `apu-catalog`. `renderApuCatalog()` conserva la búsqueda, filtros y acción `Agregar`, y añade `Detalle`. Al pulsar el detalle, `openApuDetailDrawer()` obtiene el APU desde `appState.data.apus`, limpia la relación anterior y renderiza inmediatamente la información legacy. Después llama a `loadApuCleaningProducts()`.

`loadApuCleaningProducts()` solicita `/api/apus/{apuId}/cleaning-products`, normaliza los campos snake/camel ya serializados y guarda las relaciones en `appState.data.apuCleaningProducts`. El drawer se vuelve a renderizar con las filas recibidas. Un fallo de API no elimina ni cambia el APU ni sus componentes; muestra un error y permite reintentar.

El backend mantiene la ruta autenticada existente en `server/server.js`. `server/repositories/cleaning-product-repository.js` realiza la consulta parametrizada y ahora proyecta explícitamente `acp.product_id AS linked_product_id`, necesario para que el frontend pueda identificar cada relación. `serializeRow()` mantiene el contrato camelCase.

## Arquitectura global

```text
appState.data.apus / components JSONB
              │
              ├── renderApuCatalog() ── botón Detalle
              │                         │
              │                         ▼
              │                  openApuDetailDrawer()
              │                         │
              │                         ▼
              │                  GET /api/apus/:apuId/cleaning-products
              │                         │
              │                         ▼
PostgreSQL apus + apu_cleaning_products + cleaning_products
              │
              ▼
renderApuDetailDrawer(): components legacy + Productos de limpieza
```

## Estructura física del proyecto

- `index.html`: API client, estado, normalización, drawer APU, fórmula informativa, eventos y render del catálogo.
- `server/server.js`: ruta autenticada existente para relaciones APU-producto; no se cambió la ruta pública.
- `server/repositories/cleaning-product-repository.js`: consulta de relaciones y productos; se añadió `linked_product_id` a la proyección.
- `server/serializers.js`: serialización snake_case → camelCase; no se modificó.
- `tools/demo_data.py`: fuente de APUs y relaciones demo; se usa para verificar `APU-DEMO-004` y `APU-DEMO-007`.
- `tests/server-contract.test.js`: contratos de protección, frontend y proyección de la relación.
- `md/fase-6-1.md`: snapshot técnico de esta iteración.

## Datos y modelos actuales

### APU existente

`appState.data.apus` recibe APUs con `id`, `code`, `name`, `category`, `unit`, `unitPrice` y `components`. `normalizeApiApu()` conserva `components` como objeto y usa `{}` si el backend no entrega un objeto válido.

### Componentes legacy

El JSONB demo contiene `labor`, `materials`, `equipment`, `transport` y `other`. Se muestran como desglose informativo. No se reemplaza el JSONB por filas relacionales y no se cambia el precio unitario.

### Relación APU-producto

El endpoint devuelve los campos del producto más los campos de `apu_cleaning_products`: `productId` o `linkedProductId`, `consumptionPerUnit`, `consumptionUnit`, `purchasePrice`, `unitPriceSnapshot`, `wasteFactor` y metadata de la relación. El repositorio ahora garantiza `linkedProductId` aunque `cp.*` no contenga esa columna.

### Fórmula aplicada en UI

```text
costo_por_unidad_APU = consumptionPerUnit × purchasePrice
costo_total_presupuesto = cantidad_presupuestada × costo_por_unidad_APU
```

La segunda fórmula solo se muestra cuando existe una partida del APU en el presupuesto activo. Ninguna fórmula actualiza `unitPrice`, `subtotal`, `totals` ni PostgreSQL.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| Catálogo APU existente | IMPLEMENTADO Y FUNCIONAL | `renderApuCatalog()` | Tabla de APUs | Filtros y agregar al presupuesto | Suite + código | Histórica |
| Detalle de APU | IMPLEMENTADO PARCIALMENTE | `openApuDetailDrawer()`, `renderApuDetailDrawer()` | Drawer lateral | Abrir, cerrar, overlay y Escape | Sintaxis + suite | 6.1 |
| Componentes legacy | IMPLEMENTADO Y FUNCIONAL por inspección | `normalizeApiApu()`, `components` | Desglose de costos | Visualización sin mutación | Código real | 6.1 |
| Relaciones de productos | IMPLEMENTADO PARCIALMENTE | `loadApuCleaningProducts()` y repositorio | Tabla Productos de limpieza | Lectura, error, vacío y reintento | Suite + código | 6.1 |
| Costo por producto | IMPLEMENTADO PARCIALMENTE | `calculateApuCleaningProductCost()` | Costo / APU | Cálculo informativo | Suite contractual + inspección | 6.1 |
| Doble conteo financiero | IMPLEMENTADO Y FUNCIONAL por exclusión | `calculateBudgetTotals()` sin cambios | Advertencia de compatibilidad | No se suma relación a totals | Código real | 6.1 |
| Financial Engine integrado | NO IMPLEMENTADO | Sin cambios | No | No aplica | Inspección | Posterior |
| Escritura de relaciones | NO IMPLEMENTADO | Sin POST/PATCH/DELETE | No | No aplica | Código real | Posterior |

## Roles y estado RBAC

La vista APU sigue usando el permiso frontend existente `apu:read`. La compra y los costos derivados usan `price:read`; si el permiso no existe, las celdas muestran `Restringido`. El backend actual exige sesión, pero no aplica RBAC granular por campo. Las tablas se basan en permisos efectivos de la sesión cuando vienen de `/api/me`; la lista local es el fallback frontend.

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí | `apu:read`, `price:read`, `budget:*` aplicados en SPA | Sí | Abrir detalle APU, ver costos, agregar APUs y editar presupuesto según estado | IMPLEMENTADO PARCIALMENTE |
| Revisor Técnico | Sí | No `apu:read` en el mapa frontend estático; permisos de revisión sí | No garantizada para catálogo APU | Puede ver el catálogo solo si la sesión entrega `apu:read`; costos solo con `price:read` | IMPLEMENTADO PARCIALMENTE |
| Director Financiero | Sí | `price:read` existe; `apu:read` no está en el mapa frontend estático | No garantizada para catálogo APU | Puede ver detalle solo si los permisos efectivos incluyen `apu:read` | IMPLEMENTADO PARCIALMENTE |
| Gerente General | Sí | No `apu:read` en el mapa frontend estático | No | No tiene acceso garantizado al detalle APU | IMPLEMENTADO PARCIALMENTE |
| Cliente | Sí | No `apu:read` | No | No abre el detalle APU desde la navegación actual | IMPLEMENTADO PARCIALMENTE |
| Oficial Legal | Sí | No `apu:read` | No | No tiene acceso garantizado al detalle APU | IMPLEMENTADO PARCIALMENTE |

## Componentes principales

| Archivo | Componente/función | Responsabilidad real | Estado |
|---|---|---|---|
| `index.html` | `renderApuCatalog()` | Renderiza filas de APUs y acciones Detalle/Agregar | IMPLEMENTADO Y FUNCIONAL |
| `index.html` | `openApuDetailDrawer()` | Selecciona un APU, reinicia estado de relaciones y dispara lectura | IMPLEMENTADO PARCIALMENTE |
| `index.html` | `renderApuDetailDrawer()` | Renderiza cabecera, `components`, relaciones, estados y advertencia | IMPLEMENTADO PARCIALMENTE |
| `index.html` | `#modal-container` | Contenedor compartido con el drawer de productos | IMPLEMENTADO Y FUNCIONAL por inspección |
| `server/server.js` | `GET /api/apus/:apuId/cleaning-products` | Autentica y delega al repositorio | IMPLEMENTADO PARCIALMENTE por falta de prueba DB en esta iteración |
| `server/repositories/cleaning-product-repository.js` | `listCleaningProductsForApu()` | Valida APU, une relación/producto y serializa filas | IMPLEMENTADO Y FUNCIONAL por inspección |

## Funciones y utilidades principales

| Archivo | Función | Entrada | Salida/efecto | Estado |
|---|---|---|---|---|
| `index.html` | `apiClient.getApuCleaningProducts()` | `apuId` | Solicitud GET parametrizada por URL encode | IMPLEMENTADO Y FUNCIONAL |
| `index.html` | `normalizeApiApuCleaningProduct()` | Fila serializada | Relación normalizada con ID, consumo y precios numéricos | IMPLEMENTADO Y FUNCIONAL |
| `index.html` | `loadApuCleaningProducts()` | `apuId` y estado de sesión/API | Actualiza loading, error y `appState.data.apuCleaningProducts` | IMPLEMENTADO PARCIALMENTE |
| `index.html` | `calculateApuCleaningProductCost()` | Relación | Costo informativo o `null` para datos inválidos | IMPLEMENTADO Y FUNCIONAL por inspección |
| `index.html` | `getBudgetQuantityForApu()` | `apuId` | Cantidad de la partida actual o `null` | IMPLEMENTADO Y FUNCIONAL por inspección |
| `index.html` | `closeApuDetailDrawer()` | Ninguna | Limpia selección, estado de carga y relaciones | IMPLEMENTADO Y FUNCIONAL por inspección |
| `server/repositories/cleaning-product-repository.js` | `listCleaningProductsForApu()` | `apuId` | Filas de `apus`, `apu_cleaning_products` y `cleaning_products` | IMPLEMENTADO PARCIALMENTE por falta de DB real en esta iteración |

## Flujos funcionales end-to-end

### Abrir detalle de un APU

1. El usuario pulsa `Detalle` en una fila del catálogo.
2. `handleAppClick()` identifica `data-action="open-apu-detail"`.
3. `openApuDetailDrawer()` busca el APU en `appState.data.apus` y guarda `selectedApuId`.
4. `renderApuDetailDrawer()` muestra inmediatamente el desglose legacy.
5. `loadApuCleaningProducts()` solicita la ruta autenticada.
6. La respuesta se normaliza y se guarda en `appState.data.apuCleaningProducts`.
7. El drawer se renderiza de nuevo con las filas de productos y costos informativos.

### APU antiguo sin relaciones

1. `components` se conserva y se muestra aunque no haya productos.
2. La API devuelve una colección vacía o el endpoint no tiene relaciones.
3. La sección muestra que no hay productos ligados.
4. El precio unitario, presupuesto y `components` no cambian.

### Error de API

1. La solicitud falla o la API está deshabilitada.
2. `loadApuCleaningProducts()` conserva el APU seleccionado.
3. `renderApuDetailDrawer()` muestra error y Reintentar.
4. No se aplica fallback de productos en memoria para no duplicar el catálogo PostgreSQL.

### Cálculo informativo

1. Cada relación aporta `consumptionPerUnit` y `purchasePrice` o `unitPriceSnapshot` como fallback.
2. `calculateApuCleaningProductCost()` multiplica ambos valores.
3. Si existe una partida con el mismo `apuId`, se multiplica también por `quantity` para mostrar el total presupuestado.
4. No se llama a `calculateBudgetTotals()` ni a ningún endpoint de escritura.

## Estado y gestión de datos

- `appState.ui.selectedApuId`: APU actualmente abierto.
- `appState.ui.apuCleaningProductsLoading`: carga de la relación.
- `appState.ui.apuCleaningProductsLoaded`: respuesta recibida correctamente.
- `appState.ui.apuCleaningProductsError`: error visible y reintentable.
- `appState.data.apuCleaningProducts`: filas normalizadas de la relación actual.
- `appState.data.apus`: APUs existentes y sus `components`.
- El drawer no añade productos a `mockDB` y no persiste cálculos.

## Workflow y aprobaciones

No se modificaron estados de workflow, aprobaciones, comentarios, documentos, escenarios ni decisiones. Abrir el drawer y consultar productos no genera una transición.

## Auditoría

No se añadió evento de auditoría: la operación es de lectura y el sistema actual no registra lecturas de catálogo como eventos independientes.

## Dependencias internas

- `index.html` depende de `escapeHTML`, `formatCurrency`, `hasPermission`, `readApiCollection`, `getApuById` y `appState` existentes.
- `server/server.js` conserva la autenticación `requireAuth` y la ruta existente.
- `server/repositories/cleaning-product-repository.js` depende de `tableColumns`, `quoteIdentifier`, `coerceIdentifier`, `query` y `serializeRow`.
- `tools/demo_data.py` debe haber cargado `APU-DEMO-004`, `APU-DEMO-007` y sus relaciones para las pruebas manuales con datos.

## Verificación contra código

- Se leyeron `AGENTS.md`, `md/AGENTS.md` y `tests/AGENTS.md` aplicables.
- Se revisó el snapshot anterior `md/fase-5-10.md`.
- Se verificó que el catálogo APU no tenía detalle antes del cambio; solo tenía `Agregar`.
- Se revisaron `index.html`, `server/server.js`, `server/repositories/cleaning-product-repository.js`, `server/serializers.js` y `tools/demo_data.py`.
- Se comprobó que `demo_apus()` suma `components` hasta `unit_price` y que las relaciones demo existen para varios APUs.
- Se detectó y corrigió la ausencia de `product_id` en la proyección SQL de relaciones.

## Verificación funcional

- Compilación de los cuatro bloques JavaScript de `index.html`: VERIFICADO POR EJECUCIÓN.
- `npm test` con `DB_PASSWORD` vacío: VERIFICADO POR EJECUCIÓN, 11/11 pruebas.
- Contrato estático de dos relaciones demo (`APU-DEMO-004` y `APU-DEMO-007`): VERIFICADO POR EJECUCIÓN en `tests/server-contract.test.js`.
- Respuesta autenticada real de `/api/apus/APU-DEMO-004/cleaning-products`: NO VERIFICADO en esta iteración.
- Respuesta autenticada real de `/api/apus/APU-DEMO-007/cleaning-products`: NO VERIFICADO en esta iteración.
- Render visual en navegador con datos PostgreSQL: NO VERIFICADO.

Prueba manual pendiente con una sesión válida:

```powershell
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$login = @{ email = "<usuario-demo>"; password = "<password-demo>" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/login" -Method Post -WebSession $session -ContentType "application/json" -Body $login
Invoke-RestMethod -Uri "http://localhost:3000/api/apus/APU-DEMO-004/cleaning-products" -WebSession $session
Invoke-RestMethod -Uri "http://localhost:3000/api/apus/APU-DEMO-007/cleaning-products" -WebSession $session
```

Se esperan tres relaciones demo para cada uno de esos APUs según `tools/demo_data.py`. En la UI, abrir sus filas debe mostrar el desglose legacy y la tabla Productos de limpieza.

## Limitaciones actuales

1. El detalle APU es nuevo y está implementado en la SPA monolítica `index.html`; no existe un componente separado.
2. No se modificó el Financial Engine porque `components.materials` ya participa en el precio unitario y no hay una exclusión demostrable.
3. No se aplican `wasteFactor` ni snapshots históricos al costo informativo; la fórmula visible sigue exactamente `consumptionPerUnit × purchasePrice`.
4. El backend exige sesión, pero no limita `purchasePrice` por rol; el ocultamiento de precios es de la SPA.
5. No se probó la respuesta con PostgreSQL real ni el render en navegador en esta iteración.
6. No hay edición, asociación, eliminación ni paginación de relaciones.

## Cambios de esta iteración

1. Se añadió `getApuCleaningProducts()` al cliente API de `index.html`.
2. Se añadió estado para APU seleccionado, carga, error y relaciones.
3. Se añadió `Detalle` al catálogo APU.
4. Se implementó `renderApuDetailDrawer()` con desglose `components` y Productos de limpieza.
5. Se implementaron estados loading, vacío, error, reintento, overlay y Escape.
6. Se implementó el cálculo visual por producto y, cuando aplica, por cantidad presupuestada.
7. Se proyectó `linked_product_id` en `listCleaningProductsForApu()`.
8. Se añadieron contratos estáticos para la ruta, el repositorio y dos APUs demo.
9. Se creó este snapshot técnico.

## Impacto técnico de esta iteración

- Modificados: `index.html`, `server/repositories/cleaning-product-repository.js`, `tests/server-contract.test.js`.
- Creado: `md/fase-6-1.md`.
- Contrato HTTP de la ruta: sin cambio de URL ni método; la respuesta ahora incluye `linkedProductId` para identificar explícitamente la relación.
- Tablas y migraciones: sin cambios.
- Datos existentes: no modificados.
- Financial Engine: sin cambios.
- Riesgo residual: incorporar el costo de relaciones al total sin definir si reemplaza o complementa `components.materials` produciría doble conteo.

## Compatibilidad

- APUs antiguos siguen usando `components` y pueden abrir el drawer aunque no tengan relaciones.
- APUs con productos mantienen sus componentes existentes y muestran las relaciones en una sección separada.
- `BUD-001`, `budget_items`, `/api/apus`, `/api/budgets`, `/api/me` y login no cambian de contrato.
- El catálogo APU no se reemplaza; solo recibe una acción adicional.
- La ruta sigue parametrizada y protegida por sesión.

## Preparación para siguientes fases

Antes de modificar costos se debe definir un contrato excluyente: si `apu_cleaning_products` sustituye una parte de `components.materials`, si `components.materials` pasa a ser solo material no relacionado, o si cada componente debe identificarse por fuente. También debe definirse si el precio efectivo usa `purchasePrice`, `unitPriceSnapshot`, `wasteFactor` o un snapshot presupuestario.

## Próxima fase

La siguiente fase debe decidir y probar el modelo contable de materiales/productos con APUs demo y `BUD-001`. Debe incluir casos nominales, cero, decimales, relación sin precio, cambios de precio y un caso que pruebe que el subtotal no se duplica. Solo después podrá actualizarse `calculateBudgetTotals()` o persistirse un nuevo snapshot.

## Arquitectura Producción / Homelab

No se añadieron servicios ni dependencias. La SPA continúa sirviéndose por Express, el repositorio continúa usando `pg` y PostgreSQL conserva las tablas `apus`, `cleaning_products` y `apu_cleaning_products` existentes.

## Contrato para la siguiente iteración

- Mantener `components` JSONB para compatibilidad.
- Mantener el drawer de detalle como extensión del catálogo APU.
- No sumar productos al Financial Engine sin resolver doble conteo.
- Mantener la fórmula visual y distinguir costo por APU de total presupuestado.
- Mantener la ruta autenticada y el contrato camelCase.
- Probar al menos `APU-DEMO-004` y `APU-DEMO-007` contra PostgreSQL real antes de cambiar estado a `IMPLEMENTADO Y FUNCIONAL`.
