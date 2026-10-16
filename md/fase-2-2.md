# Fase 2 — Iteración 2: diseño PostgreSQL para productos de limpieza

## Identificación

- Fase: 2.
- Iteración: 2.
- Objetivo: diseñar una extensión relacional mínima para productos de limpieza y su relación con APUs.
- Fuente de verdad: esquema PostgreSQL consultado en modo lectura, `server/`, `tools/demo_data.py` e `index.html`.
- Snapshot anterior: `md/fase-2-1.md`.
- Alcance: diseño y archivos SQL no ejecutados.
- Fuera de alcance: ejecución contra PostgreSQL, cambios Node/Express, cambios frontend, carga de productos y modificación de datos actuales.

## Resumen ejecutivo técnico

El esquema real tiene `apus.id` como `VARCHAR`, `apus.components` como `JSONB` y no contiene ninguna tabla de productos. `budget_items` referencia únicamente al APU y conserva su propio `unit_price` como snapshot de presupuesto.

Se diseñaron dos tablas nuevas:

- `cleaning_products`: catálogo maestro de productos reales de limpieza.
- `apu_cleaning_products`: relación APU-producto con FKs, consumo por unidad de APU, desperdicio y precio unitario capturado.

La migración no altera `clients`, `projects`, `apus`, `budgets` ni `budget_items`. Incluye `sale_price` opcional como dato de referencia del catálogo demo, sin convertir CleanQuote en una tienda; `quantity` no se incluye porque duplicaría `consumption_per_unit`.

## Estado general de implementación

| Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| Esquema actual de APUs y presupuestos | IMPLEMENTADO Y FUNCIONAL | `server/repositories/`, esquema PostgreSQL real | `index.html` | Catálogo y presupuesto existentes | VERIFICADO POR EJECUCIÓN e inspección | Heredado |
| Catálogo `cleaning_products` | NO IMPLEMENTADO | No existe tabla aplicada | No existe | No existe | VERIFICADO POR INSPECCIÓN | Esta iteración |
| Relación `apu_cleaning_products` | NO IMPLEMENTADO | No existe tabla aplicada | No existe | No existe | VERIFICADO POR INSPECCIÓN | Esta iteración |
| Migración SQL diseñada | IMPLEMENTADO PARCIALMENTE | `server/migrations/003_add_cleaning_products.sql` | No aplica | No ejecutada | VERIFICADO POR INSPECCIÓN | Esta iteración |
| Rollback diseñado | IMPLEMENTADO PARCIALMENTE | `server/migrations/003_add_cleaning_products.rollback.sql` | No aplica | No ejecutado | VERIFICADO POR INSPECCIÓN | Esta iteración |
| API de productos | NO IMPLEMENTADO | No existe repositorio ni endpoint | No existe | No existe | VERIFICADO POR INSPECCIÓN | Posterior |

## Cómo funciona actualmente

El runtime activo carga `index.html`, usa `mockDB` como fallback y, cuando existe sesión, hidrata APUs y `BUD-001` mediante `/api/apus` y `/api/budgets/:budgetId`. Express usa `pg`; los repositorios actuales leen las tablas reales sin crear tablas.

El APU conserva cinco importes agregados en `components`: `labor`, `materials`, `equipment`, `transport` y `other`. La nueva extensión propuesta no reemplaza ese JSONB. La relación relacional permitirá consultar productos y aplicar FK sin convertir `budget_items` en líneas de productos.

La migración diseñada queda fuera del flujo de ejecución actual hasta que un operador la revise y la ejecute explícitamente.

## Arquitectura global

```text
cleaning_products
        │ product_id FK
        ▼
apu_cleaning_products ── apu_id FK ──> apus
                                      │ unit_price / components JSONB
                                      ▼
                               budget_items
                                      │
                                      ▼
                                  budgets
```

La extensión no introduce inventario, compras, órdenes, pagos, carrito ni tienda.

## Estructura física del proyecto

- `server/migrations/003_add_cleaning_products.sql`: migración nueva, idempotente para tablas e índices nuevos.
- `server/migrations/003_add_cleaning_products.rollback.sql`: rollback limitado a las tablas e índices nuevos.
- `server/db.js`: contrato existente de conexión, `VARCHAR`, `JSONB` y consultas parametrizadas.
- `server/repositories/apu-repository.js`: lectura existente de APUs; no modificado.
- `server/repositories/budget-repository.js`: lectura y mutación existente de presupuestos; no modificado.
- `tools/demo_data.py`: contrato demo existente; no modificado.
- `index.html`: runtime activo; no modificado.

## Datos y modelos actuales

El esquema PostgreSQL verificado contiene:

| Tabla | Campos principales | Restricciones relevantes |
|---|---|---|
| `apus` | `id VARCHAR`, `code VARCHAR`, `name`, `category`, `unit`, `unit_price NUMERIC`, `components JSONB` | PK `id`, `UNIQUE code`, precio no negativo |
| `budgets` | `id VARCHAR`, `project_id VARCHAR`, `name`, `version`, `status`, `totals JSONB`, `settings JSONB` | PK `id`, FK a `projects`, versión positiva |
| `budget_items` | `id VARCHAR`, `budget_id VARCHAR`, `apu_id VARCHAR`, `quantity`, `unit_price`, `subtotal` | PK `id`, FKs a presupuesto/APU, `UNIQUE (budget_id, apu_id)` |
| `projects` | `id VARCHAR`, `client_id VARCHAR`, `name`, `location`, `currency`, `status` | PK `id`, FK a `clients`, moneda de tres caracteres |
| `clients` | `id VARCHAR`, `name`, `tax_id`, `contact_name`, `email` | PK `id`, `UNIQUE tax_id` |

Diseño nuevo:

| Tabla | Propósito |
|---|---|
| `cleaning_products` | Identidad, clasificación, unidad, precio de compra, cumplimiento y metadatos flexibles |
| `apu_cleaning_products` | Consumo de un producto por unidad de APU, desperdicio y snapshot de precio |

## Matriz de roles y estado RBAC

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí | Permisos frontend y sesión API | Catálogo/presupuesto | Trabajar con APUs existentes | IMPLEMENTADO PARCIALMENTE |
| Revisor Técnico | Sí | Permisos frontend y sesión API | Workflow | Revisar flujo existente | IMPLEMENTADO PARCIALMENTE |
| Director Financiero | Sí | Permisos frontend y sesión API | Workflow | Revisar flujo existente | IMPLEMENTADO PARCIALMENTE |
| Gerente General | Sí | Permisos frontend y sesión API | Workflow | Revisar flujo existente | IMPLEMENTADO PARCIALMENTE |
| Cliente | Sí | Lectura de presupuesto | Portal demo | Consultar lo existente | IMPLEMENTADO PARCIALMENTE |
| Oficial Legal | Sí | Lectura legal/documental | Vista legal demo | Consultar lo existente | IMPLEMENTADO PARCIALMENTE |

La migración no modifica roles ni permisos. El backend actual exige sesión, pero no aplica permisos por operación en cada endpoint.

## Componentes principales

| Archivo | Componente | Responsabilidad | Estado |
|---|---|---|---|
| `index.html` | `hydrateStateFromApi()` | Carga APUs y presupuesto remoto | IMPLEMENTADO Y FUNCIONAL |
| `index.html` | `addApuToBudget()` | Crea o incrementa una partida APU | IMPLEMENTADO Y FUNCIONAL |
| `server/server.js` | Rutas API actuales | Expone APUs y presupuestos | IMPLEMENTADO Y FUNCIONAL |
| `server/repositories/apu-repository.js` | Lectura de APUs | `SELECT * FROM apus` | IMPLEMENTADO Y FUNCIONAL |
| `server/repositories/budget-repository.js` | Presupuesto/partidas | CRUD de `budgets` y `budget_items` | IMPLEMENTADO PARCIALMENTE |
| `server/migrations/003_add_cleaning_products.sql` | DDL nuevo | Define tablas, FKs, checks e índices | IMPLEMENTADO PARCIALMENTE |

## Funciones y utilidades principales

- `tableColumns()` en `server/db.js`: inspecciona columnas de tablas existentes.
- `listApus()` y `getApu()` en `apu-repository.js`: leen APUs sin alterar su forma.
- `getBudgetWithItems()` en `budget-repository.js`: lee presupuesto y partidas sin JOIN de enriquecimiento con APUs.
- `addBudgetItem()` en `budget-repository.js`: valida APU, toma `unit_price` y conserva la unicidad presupuesto/APU.
- `normalizeApiApu()` en `index.html`: conserva `components` como objeto JSON.
- `calculateTotalsFromItems()` en `index.html`: calcula subtotales y totales de presupuesto.

No existe todavía una función de lectura o escritura de productos.

## Flujos funcionales end-to-end

### Flujo heredado APU → presupuesto

1. La SPA carga catálogo local o remoto.
2. El usuario agrega un APU.
3. `addApuToBudget()` crea/incrementa un item por `apuId`.
4. El frontend calcula subtotal y totales.
5. La API persiste `budget_items` cuando hay conexión PostgreSQL.

### Flujo nuevo diseñado

1. Un operador revisa la migración.
2. La migración crea únicamente las dos tablas nuevas.
3. Un futuro repositorio valida `product_id` y `apu_id` mediante las FKs.
4. Un futuro proceso crea la receta APU-producto.
5. El presupuesto continúa usando el `unit_price` del APU y no agrega productos como partidas separadas.

Este segundo flujo no está implementado ni ejecutado.

## Estado y gestión de datos

- No se modificaron datos actuales.
- `BUD-001` no se toca.
- `APU-DEMO-*` no se toca.
- `budget_items` no se toca.
- `components JSONB` no se altera.
- `unit_price_snapshot` permite reproducir el precio del producto usado por la relación aun si cambia el catálogo.
- `waste_factor` se expresa como proporción entre `0` y `1`; por ejemplo, `0.05` representa 5%.
- `metadata` debe ser un objeto JSONB, no un array ni un escalar.

## Workflow y aprobaciones

No se agregan estados, transiciones ni aprobaciones. La relación APU-producto deberá respetar el workflow existente cuando se implemente una futura edición de APUs.

## Auditoría

La migración no escribe `audit_log` ni altera el audit trail local. Una futura operación de creación o edición de recetas deberá registrar auditoría desde el backend o el flujo autorizado.

## Dependencias internas

- PostgreSQL con soporte para JSONB, FKs, checks, índices funcionales y `TIMESTAMPTZ`.
- Tablas existentes `apus` y sus IDs `VARCHAR`.
- No se añaden dependencias npm, Python ni frontend.

## Verificación contra código

### VERIFICADO POR INSPECCIÓN

- No existe una tabla o migración previa con nombre `cleaning_products` o `apu_cleaning_products`.
- `apus.id` es `VARCHAR` y la nueva FK usa `VARCHAR` sin longitud restrictiva.
- `budget_items` ya conserva precio y subtotal propios; no requiere FK a productos.
- La migración solo contiene `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` y constraints nuevas.
- El rollback solo elimina índices y tablas nuevas, en orden de dependencia.
- No se modificaron archivos Node, frontend, datos demo ni migraciones existentes.

### NO VERIFICADO

- La migración no se ejecutó contra PostgreSQL.
- No se verificó la creación real de tablas, constraints o índices.
- No se probó rollback real.
- No existe todavía API ni UI de productos.

## Verificación funcional

### VERIFICADO POR EJECUCIÓN

- `npm test`: 10/10 pruebas contractuales existentes pasaron antes de crear estos archivos.
- Consulta de estado demo: PostgreSQL respondió con `BUD-001`, 12 APUs y 10 partidas existentes.

### NO APLICA

- No se ejecutó la migración ni se hizo prueba de escritura, por alcance explícito de esta iteración.

## Limitaciones actuales

1. La migración no valida automáticamente que una tabla preexistente con el mismo nombre tenga la forma esperada; `CREATE TABLE IF NOT EXISTS` no corrige esquemas incompatibles.
2. No existe trigger para actualizar automáticamente `updated_at`; el futuro repositorio deberá actualizarlo explícitamente.
3. La relación usa FK y snapshot de precio, pero no versiona APUs completos.
4. `metadata` no sustituye validación de campos financieros ni de FKs.
5. No existe todavía endpoint para consultar recetas APU-producto.

## Cambios de esta iteración

1. Se creó `server/migrations/003_add_cleaning_products.sql`.
2. Se creó `server/migrations/003_add_cleaning_products.rollback.sql`.
3. Se definió `cleaning_products` con catálogo, precio de compra, precio de referencia opcional, estado y JSONB flexible.
4. Se definió `apu_cleaning_products` con FKs a `apus` y `cleaning_products`.
5. Se añadieron checks de precios, consumo, desperdicio, unidades, IDs y JSONB.
6. Se añadieron índices de catálogo, búsqueda nominal y referencia de producto.
7. No se ejecutó SQL contra PostgreSQL.
8. No se cambió Node, frontend, esquema remoto ni datos existentes.

## Impacto técnico de esta iteración

- Archivos creados: dos migraciones SQL y este snapshot.
- Tablas nuevas diseñadas: dos.
- Tablas existentes modificadas: ninguna.
- Contratos HTTP modificados: ninguno.
- Contratos frontend modificados: ninguno.
- Datos demo modificados: ninguno.
- Riesgo principal: ejecutar la migración sin revisión del nombre de tablas nuevas o sin validar una eventual tabla preexistente incompatible.

## Compatibilidad

- IDs nuevos: `VARCHAR`, compatibles con `APU-001`, `APU-DEMO-001` y otros IDs actuales.
- APUs actuales: no requieren columnas nuevas.
- `components JSONB`: no se reemplaza.
- `BUD-001`: no se toca.
- `budget_items`: no se toca.
- Rollback: no usa `CASCADE`, por lo que falla de forma segura si una dependencia externa impide eliminar las tablas.

## Preparación para siguientes fases

La siguiente fase deberá implementar primero el repositorio de productos y la lectura de recetas, manteniendo `/api/apus` compatible. Después podrá añadirse validación backend y una UI técnica para asociar productos a APUs.

## Próxima fase

Antes de ejecutar la migración se requiere revisión de nombres, tipos, restricciones y política de rollback. Después de aplicarla, se deberán verificar columnas, FKs, índices y conteos mediante consultas de solo lectura.

## Arquitectura Producción / Homelab

La migración está diseñada para el PostgreSQL existente accesible por el backend Node/Express. No crea usuarios, roles, contraseñas, extensiones ni servicios externos. La seguridad de conexión continúa dependiendo de `.env`, `pg` y la configuración actual.

## Contrato para la siguiente iteración

- No modificar `apus`, `budgets`, `budget_items`, `projects` ni `clients` para introducir productos.
- No convertir productos en partidas de presupuesto.
- Mantener `purchase_price` como precio de costo del producto.
- Mantener `unit_price_snapshot` para reproducibilidad de la receta.
- Interpretar `waste_factor` como proporción `0..1`.
- No ejecutar el rollback como limpieza general.
- No llamar a la extensión `IMPLEMENTADO Y FUNCIONAL` hasta ejecutar y verificar la migración.
