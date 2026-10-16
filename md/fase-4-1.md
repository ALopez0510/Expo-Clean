# Fase 4 — Iteración 1

## Identificación

- Producto: CleanQuote Pro / Expo-Clean.
- Alcance: lectura backend de productos de limpieza y relaciones APU-producto.
- Fecha de snapshot: 2026-10-16.
- Frontend y Financial Engine: sin cambios.

## Resumen ejecutivo técnico

Se añadió `server/repositories/cleaning-product-repository.js` siguiendo el patrón de `apu-repository.js`, `db.js`, `errors.js` y `serializeRow`. Se añadieron tres rutas protegidas por `requireAuth`:

- `GET /api/cleaning-products`
- `GET /api/cleaning-products/:id`
- `GET /api/apus/:apuId/cleaning-products`

Las consultas usan valores parametrizados, orden estable y validación de esquema existente. El listado acepta `category`, `active` y `q`. La ruta APU valida que el APU exista, devuelve lista vacía si existe sin productos y devuelve 404 si el APU no existe.

`purchase_price` se expone a cualquier sesión autenticada porque el backend actual no contiene controles RBAC granulares por endpoint. Esto sigue el patrón actual de `SELECT *`/serialización y no representa una autorización financiera por rol.

## Estado general de implementación

| Capacidad | Estado | Evidencia |
|---|---|---|
| Listado de productos | IMPLEMENTADO PARCIALMENTE | `listCleaningProducts()` y `GET /api/cleaning-products`; requiere migración 003 aplicada para ejecución DB |
| Detalle de producto | IMPLEMENTADO PARCIALMENTE | `getCleaningProduct()` y `GET /api/cleaning-products/:id` |
| Productos ligados a APU | IMPLEMENTADO PARCIALMENTE | `listCleaningProductsForApu()` y `GET /api/apus/:apuId/cleaning-products` |
| Serialización camelCase | IMPLEMENTADO Y FUNCIONAL | Reutiliza `serializeRow()` |
| Autenticación de rutas nuevas | IMPLEMENTADO Y FUNCIONAL | Las tres rutas usan `requireAuth` |
| RBAC granular de precios | NO IMPLEMENTADO | No existe evaluación por rol en estos endpoints |
| Financial Engine | NO IMPLEMENTADO | No se modificó ningún cálculo |
| Frontend de productos | NO IMPLEMENTADO | No se modificó `index.html` |

## Cómo funciona actualmente

`server/server.js` mantiene `requireAuth`, `asyncRoute` y el manejador global de errores. Las rutas nuevas solo delegan en el repositorio; no contienen SQL ni crean conexiones.

`cleaning-product-repository.js` consulta `information_schema.columns` mediante `tableColumns()` antes de leer. Si las tablas no existen o faltan columnas, lanza `SchemaUnsupported`. Si un producto o APU no existe, lanza `ResourceNotFound`, que el manejador de Express serializa como HTTP 404 con el contrato `{ error: { code, message } }`.

El serializer existente convierte nombres como `purchase_price`, `content_quantity`, `consumption_per_unit` y `unit_price_snapshot` a `purchasePrice`, `contentQuantity`, `consumptionPerUnit` y `unitPriceSnapshot`.

## Arquitectura global

```text
HTTP autenticado
      ↓
server/server.js
      ↓
cleaning-product-repository.js
      ↓
server/db.js → pg Pool
      ↓
cleaning_products ← apu_cleaning_products → apus
```

No se introdujo ORM, TypeScript, framework, conexión paralela ni acceso SQL directo desde `server.js`.

## Estructura física del proyecto

- `server/server.js`: rutas Express y autenticación.
- `server/db.js`: pool, consultas parametrizadas, transacciones y verificación de esquema.
- `server/errors.js`: `ApiError`, `ResourceNotFound`, `SchemaUnsupported` y errores de DB.
- `server/serializers.js`: `serializeRow()` y conversión snake_case a camelCase.
- `server/repositories/apu-repository.js`: patrón existente para APUs.
- `server/repositories/cleaning-product-repository.js`: repositorio nuevo de productos y relaciones.
- `server/migrations/003_add_cleaning_products.sql`: tablas esperadas por el repositorio.
- `tests/server-contract.test.js`: pruebas de autenticación de rutas protegidas.
- `index.html`: frontend existente; no modificado.

## Datos y modelos actuales

`cleaning_products` contiene identidad, SKU, clasificación, marca, descripción, unidad, presentación, contenido, precio de compra, precio de venta opcional, proveedor, registro sanitario, estado y metadata JSONB.

`apu_cleaning_products` contiene `apu_id`, `product_id`, `consumption_per_unit`, `unit`, `waste_factor`, `unit_price_snapshot` y metadata JSONB. La respuesta de relación incluye además los datos serializados del producto y campos explícitos para cálculo posterior:

- `consumptionPerUnit`;
- `consumptionUnit`;
- `wasteFactor`;
- `unitPriceSnapshot`;
- `apuCleaningProductId`;
- `linkedApuId`.

El Financial Engine no utiliza todavía esos valores.

## SQL usado por cada repository

### `listCleaningProducts(filters)`

```sql
SELECT *
FROM "cleaning_products"
WHERE [filtros parametrizados opcionales]
ORDER BY "category" ASC, "name" ASC, "id" ASC;
```

Filtros:

- `category`: `LOWER("category") = LOWER($n)`;
- `active`: `"active" = $n`;
- `q`: `"name" ILIKE $n OR "sku" ILIKE $n OR "brand" ILIKE $n`.

### `getCleaningProduct(productId)`

```sql
SELECT *
FROM "cleaning_products"
WHERE "id" = $1
LIMIT 1;
```

### `listCleaningProductsForApu(apuId)`

Primero verifica el APU:

```sql
SELECT 1
FROM "apus"
WHERE "id" = $1
LIMIT 1;
```

Después consulta la relación:

```sql
SELECT cp.*,
       acp."id" AS apu_cleaning_product_id,
       acp."apu_id" AS linked_apu_id,
       acp."consumption_per_unit",
       acp."unit" AS consumption_unit,
       acp."waste_factor",
       acp."unit_price_snapshot",
       acp."metadata" AS relation_metadata
FROM "apu_cleaning_products" AS acp
INNER JOIN "cleaning_products" AS cp ON cp."id" = acp."product_id"
WHERE acp."apu_id" = $1
ORDER BY cp."category", cp."name", cp."id";
```

Todos los valores externos se pasan como parámetros. Los identificadores SQL son constantes internas validadas por `quoteIdentifier()`.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| `/api/apus` | IMPLEMENTADO Y FUNCIONAL | `server.js` + `apu-repository.js` | Sí | Catálogo APU existente | Suite de contrato y código | Histórica |
| `/api/budgets` | IMPLEMENTADO Y FUNCIONAL | `server.js` + `budget-repository.js` | Sí | Lectura/edición de presupuesto | Suite de contrato y código | Histórica |
| `/api/cleaning-products` | IMPLEMENTADO PARCIALMENTE | `server.js` + nuevo repositorio | No | Lectura autenticada | Sintaxis y ruta protegida verificadas; DB no verificada | 4.1 |
| `/api/cleaning-products/:id` | IMPLEMENTADO PARCIALMENTE | `getCleaningProduct()` | No | Lectura autenticada y 404 lógico | Inspección de código | 4.1 |
| `/api/apus/:apuId/cleaning-products` | IMPLEMENTADO PARCIALMENTE | `listCleaningProductsForApu()` | No | Lectura autenticada y 404 lógico | Inspección de código | 4.1 |
| Exposición de precios | IMPLEMENTADO PARCIALMENTE | `serializeRow()` sobre `SELECT *` | No | Visible a cualquier sesión autenticada | Sin RBAC granular | 4.1 |
| Financial Engine | NO IMPLEMENTADO | Sin cambios | No | No calcula costos de productos | No aplica en esta fase | Posterior |

## Roles y estado RBAC

Los seis roles siguen declarados en el sistema, pero no existe una comprobación de permiso específica dentro de las rutas nuevas. `requireAuth` comprueba sesión, no rol ni permiso de precio.

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí | Autenticación, sin regla específica de productos | No | Puede leer si tiene sesión válida | IMPLEMENTADO PARCIALMENTE |
| Revisor Técnico | Sí | Autenticación, sin regla específica de productos | No | Puede leer si tiene sesión válida | IMPLEMENTADO PARCIALMENTE |
| Director Financiero | Sí | Autenticación, sin regla específica de productos | No | Puede leer si tiene sesión válida | IMPLEMENTADO PARCIALMENTE |
| Gerente General | Sí | Autenticación, sin regla específica de productos | No | Puede leer si tiene sesión válida | IMPLEMENTADO PARCIALMENTE |
| Cliente | Sí | Autenticación, sin regla específica de productos | No | Puede leer si tiene sesión válida | IMPLEMENTADO PARCIALMENTE |
| Oficial Legal | Sí | Autenticación, sin regla específica de productos | No | Puede leer si tiene sesión válida | IMPLEMENTADO PARCIALMENTE |

La exposición uniforme de `purchasePrice` debe revisarse en una fase RBAC posterior si el negocio exige ocultarlo a ciertos roles.

## Componentes principales

- `server/server.js`: añade imports y tres handlers delgados; conserva la autenticación y el error handler.
- `server/repositories/cleaning-product-repository.js`: concentra esquema, filtros, consultas, orden y serialización de filas.
- `server/serializers.js`: no fue modificado; mantiene la conversión de nombres.
- `server/db.js`: no fue modificado; mantiene pool y parámetros `$1`, `$2`, etc.

## Funciones y utilidades principales

| Archivo | Función | Entradas | Salida/efecto | Estado |
|---|---|---|---|---|
| `cleaning-product-repository.js` | `listCleaningProducts` | filtros `category`, `active`, `q` | filas serializadas ordenadas | IMPLEMENTADO PARCIALMENTE |
| `cleaning-product-repository.js` | `getCleaningProduct` | ID VARCHAR | producto serializado o 404 | IMPLEMENTADO PARCIALMENTE |
| `cleaning-product-repository.js` | `listCleaningProductsForApu` | APU ID VARCHAR | filas combinadas producto/relación o 404 APU | IMPLEMENTADO PARCIALMENTE |
| `cleaning-product-repository.js` | `assertColumns` | resultado de `tableColumns` | 500 `SCHEMA_UNSUPPORTED` si falta estructura | IMPLEMENTADO Y FUNCIONAL por inspección |
| `server.js` | `requireAuth` | sesión Express | 401 o `request.user` | IMPLEMENTADO Y FUNCIONAL |

## Flujos funcionales end-to-end

### Listado

1. Cliente autenticado solicita `/api/cleaning-products`.
2. `requireAuth` valida sesión.
3. `listCleaningProducts(request.query)` valida filtros.
4. El repositorio consulta columnas y ejecuta SQL parametrizado.
5. `serializeRow()` convierte nombres a camelCase.
6. Express devuelve `{ items: [...] }`.

### Detalle

1. Cliente autenticado solicita `/api/cleaning-products/:id`.
2. El repositorio busca el ID con `$1`.
3. Si no existe, lanza `ResourceNotFound` y Express devuelve 404.
4. Si existe, devuelve `{ product: ... }`.

### Productos de APU

1. Cliente autenticado solicita `/api/apus/:apuId/cleaning-products`.
2. El repositorio comprueba la existencia del APU.
3. Ejecuta el `INNER JOIN` parametrizado contra la tabla de relación.
4. Devuelve `{ items: [...] }`, incluyendo consumo y snapshot de precio.

No hay flujo UI para estos endpoints y no existe cálculo financiero nuevo.

## Estado y gestión de datos

- No se insertan, actualizan ni eliminan registros.
- No se altera `BUD-001`, `budget_items`, APUs ni componentes JSONB.
- Se reutiliza el pool de `server/db.js`.
- Los filtros no interpolan valores externos en SQL.
- El orden es determinista por categoría, nombre e ID.

## Workflow y aprobaciones

No se modificaron workflow, escenarios, aprobaciones ni estados de presupuestos.

## Auditoría

No se añadió `AuditLog`. Las rutas son de lectura y siguen el comportamiento de auditoría existente, que no registra lecturas de catálogo en esta arquitectura.

## Dependencias internas

- `server.js` depende del nuevo repositorio.
- El repositorio depende de `db.js`, `errors.js` y `serializers.js` existentes.
- Las tablas dependen de la migración 003.
- La API depende de una sesión Express válida.

## Verificación contra código

- Se leyeron `AGENTS.md` raíz y `tests/AGENTS.md`; no existe `AGENTS.md` específico bajo `server/`.
- Se revisaron `server/server.js`, `server/db.js`, `server/errors.js`, `server/serializers.js` y los repositorios existentes.
- Se verificaron los contratos actuales `{ apus: [...] }`, `{ apu: ... }` y `{ error: { code, message } }`.
- Se verificó que las rutas nuevas no contienen SQL directo.
- Se verificó que no se modificó `index.html`, Financial Engine, `/api/apus`, `/api/budgets`, `/api/me` ni login.

## Verificación funcional

- `node --check server/repositories/cleaning-product-repository.js`: VERIFICADO POR EJECUCIÓN.
- `node --check server/server.js`: VERIFICADO POR EJECUCIÓN.
- Las tres rutas nuevas sin sesión devuelven 401 en la suite: VERIFICADO POR EJECUCIÓN.
- Suite `npm test`: 9 pruebas pasaron; 1 prueba falló porque `/api/health/db` no pudo conectar al PostgreSQL configurado y devolvió 503 donde el test esperaba 200. No está relacionado con las rutas nuevas.
- Listado autenticado contra tablas 003: NO VERIFICADO; no se ejecutó contra PostgreSQL.
- 404 de producto/APU contra PostgreSQL: NO VERIFICADO por la misma restricción de conexión.

## Pruebas manuales

PowerShell, con el servidor ejecutándose en otra consola:

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/api/login `
  -ContentType 'application/json' `
  -Body '{"email":"presupuestista@buildcost.local","password":"<PASSWORD_DEMO>"}' `
  -SessionVariable cleanQuoteSession

Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/cleaning-products' -WebSession $cleanQuoteSession
Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/cleaning-products?category=Desinfectantes&active=true&q=demo' -WebSession $cleanQuoteSession
Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/cleaning-products/PRD-DEMO-001' -WebSession $cleanQuoteSession
Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/apus/APU-DEMO-010/cleaning-products' -WebSession $cleanQuoteSession
```

La contraseña debe provenir del entorno de demo autorizado; no se documenta ni se incorpora ninguna credencial real. Para comprobar 401 sin sesión:

```powershell
try { Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/cleaning-products' } catch { $_.Exception.Response.StatusCode.value__ }
```

Con `curl` y cookie persistida:

```bash
curl -i -c cleanquote.cookies -H "Content-Type: application/json" \
  -d '{"email":"presupuestista@buildcost.local","password":"<PASSWORD_DEMO>"}' \
  http://127.0.0.1:8000/api/login
curl -i -b cleanquote.cookies http://127.0.0.1:8000/api/cleaning-products
curl -i -b cleanquote.cookies "http://127.0.0.1:8000/api/cleaning-products?active=true&q=desinfectante"
curl -i -b cleanquote.cookies http://127.0.0.1:8000/api/cleaning-products/PRD-DEMO-001
curl -i -b cleanquote.cookies http://127.0.0.1:8000/api/apus/APU-DEMO-010/cleaning-products
```

## Limitaciones actuales

1. La migración 003 debe estar aplicada para que los endpoints puedan consultar tablas nuevas.
2. `purchasePrice` se expone a toda sesión autenticada; no existe RBAC granular de campos.
3. No se añadió paginación.
4. No se modificó el Financial Engine para calcular consumo por cantidad de APU.
5. No hay endpoints de escritura ni UI para productos.

## Cambios de esta iteración

1. Se creó `server/repositories/cleaning-product-repository.js`.
2. Se añadieron los tres endpoints autenticados en `server/server.js`.
3. Se añadieron filtros parametrizados `category`, `active` y `q`.
4. Se añadió validación de existencia de APU y producto con 404.
5. Se extendió `tests/server-contract.test.js` para comprobar autenticación de las rutas nuevas.
6. Se creó este snapshot técnico.

## Impacto técnico de esta iteración

- Archivos modificados: `server/server.js`, `tests/server-contract.test.js`.
- Archivo creado: `server/repositories/cleaning-product-repository.js`.
- Documentación creada: `md/fase-4-1.md`.
- Contratos existentes conservados: `/api/apus`, `/api/budgets`, `/api/me`, login, serializers y conexión.
- Nueva dependencia lógica: tablas `cleaning_products` y `apu_cleaning_products` de la migración 003.
- Riesgo residual: exposición de precio de compra por ausencia de RBAC granular.

## Compatibilidad

- No se cambiaron nombres de tablas existentes ni columnas existentes.
- No se cambió el formato de APUs ni presupuestos.
- No se cambió el motor financiero.
- Las rutas nuevas usan los mismos errores JSON y la misma sesión Express.
- La ausencia de tablas nuevas produce `SCHEMA_UNSUPPORTED`/503 sanitizado según el flujo actual, no una conexión alternativa.

## Preparación para siguientes fases

La siguiente fase puede consumir `{ items }` desde el frontend o integrar el repositorio con el Financial Engine. Debe decidir primero si el costo calculado usa `unitPriceSnapshot` o `purchasePrice`, y si el precio de compra debe ocultarse mediante RBAC por rol/campo.

## Próxima fase

1. Ejecutar migración 003 y probar lectura autenticada real.
2. Añadir pruebas de integración con PostgreSQL para 200, 401, 404, filtros y lista vacía.
3. Diseñar autorización granular para precios si el negocio lo exige.
4. Integrar el cálculo de consumo en el Financial Engine solo después de fijar el contrato de unidades.

## Arquitectura Producción / Homelab

No se agregaron servicios de producción, MinIO, DocuSeal, Cal.com, n8n o Keycloak. La API continúa usando el PostgreSQL configurado por `server/db.js` y sesiones Express locales.

## Contrato para la siguiente iteración

- Mantener repositorios para todo acceso PostgreSQL.
- Mantener consultas parametrizadas y `serializeRow()`.
- No exponer permisos RBAC inexistentes como si fueran granulares.
- No cambiar `/api/apus`, `/api/budgets`, `/api/me` ni login.
- Verificar PostgreSQL real antes de marcar las rutas como `IMPLEMENTADO Y FUNCIONAL`.
