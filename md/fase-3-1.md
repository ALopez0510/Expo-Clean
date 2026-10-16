# Fase 3 — Iteración 1

## Identificación

- Producto: CleanQuote Pro / Expo-Clean.
- Alcance: carga controlada de productos de limpieza ficticios en la herramienta oficial `tools/demo_data.py`.
- Fecha de snapshot: 2026-10-16.
- Frontend, endpoints públicos y ejecución de PostgreSQL: sin cambios y sin ejecución automática de la migración.

## Resumen ejecutivo técnico

`tools/demo_data.py` ahora genera en una sola transacción 15 productos demo y 18 relaciones APU-producto, usando exclusivamente los 12 APU demo existentes en el propio seed. Los productos tienen IDs `PRD-DEMO-001` a `PRD-DEMO-015`; las relaciones tienen IDs `ACP-DEMO-001` a `ACP-DEMO-018`.

La herramienta valida precios no negativos, contenido positivo, consumo positivo, desperdicio dentro de `0..1`, unidades consistentes, IDs controlados y destinos de FK presentes en el conjunto de datos a insertar. `start` exige que la migración de productos exista; `status` conserva la salida de la demo anterior y muestra el conteo de productos y relaciones cuando el esquema está aplicado; `cleanup` elimina primero las relaciones y solo elimina entidades demo si no quedan referencias externas.

La migración `003_add_cleaning_products.sql` sigue sin ejecutarse. Se añadió `sale_price` opcional al catálogo y una cláusula compatible con un borrador anterior que no lo tuviera. No se modificaron tablas existentes ni datos de PostgreSQL.

## Estado general de implementación

| Capacidad | Estado | Evidencia |
|---|---|---|
| Seed existente de cliente, proyecto, APUs, presupuesto y partidas | IMPLEMENTADO Y FUNCIONAL | `tools/demo_data.py`, funciones `build_start_sql`, `build_cleanup_sql`, `status` |
| Catálogo demo de productos de limpieza | IMPLEMENTADO PARCIALMENTE | `demo_cleaning_products()` genera 15 registros y validaciones; falta ejecutar contra PostgreSQL |
| Relaciones demo APU-producto | IMPLEMENTADO PARCIALMENTE | `demo_apu_cleaning_products()` genera 18 filas con IDs de APUs existentes; falta ejecutar contra PostgreSQL |
| Migración PostgreSQL de las tablas nuevas | IMPLEMENTADO PARCIALMENTE | `server/migrations/003_add_cleaning_products.sql`; diseñada, no ejecutada |
| Rollback de tablas nuevas | IMPLEMENTADO PARCIALMENTE | `server/migrations/003_add_cleaning_products.rollback.sql`; no ejecutado |
| API pública de productos | NO IMPLEMENTADO | No se modificó `server/server.js` ni se creó endpoint |
| UI de productos | NO IMPLEMENTADO | No se modificó `index.html` ni la lógica del catálogo APU |

## Cómo funciona actualmente

La aplicación activa continúa siendo el runtime Node/Express de `server/server.js`, que sirve `index.html` y expone autenticación, salud, clientes, proyectos, APUs y presupuestos. Los endpoints `/api/apus` y `/api/apus/:apuId` siguen usando el repositorio existente y no leen las nuevas tablas.

`tools/demo_data.py` es un proceso separado del runtime. Lee `.env`, ejecuta `psql` mediante `subprocess` y mantiene la contraseña únicamente en `PGPASSWORD`. `start` valida la conexión y el esquema base, exige las tablas nuevas y ejecuta todos los `INSERT ... ON CONFLICT` dentro de `BEGIN/COMMIT`. `status` consulta el estado controlado. `cleanup` elimina las relaciones demo antes de APUs y productos y conserva filas con referencias no demo.

Los precios de los productos están marcados en `metadata` con `demo: true`, `source: tools/demo_data.py` y `marketPriceClaim: false`. Son datos ficticios de demostración; el seed no afirma que sean precios de mercado.

## Arquitectura global

```text
index.html / SPA Vanilla JS
          ↓
server/server.js
          ↓
repositories de APUs y presupuestos
          ↓
PostgreSQL: apus → budgets → budget_items
          ↓
PostgreSQL: cleaning_products ← apu_cleaning_products → apus

tools/demo_data.py ── seed/inspección/cleanup controlados, separado de la API
```

La relación nueva es relacional porque necesita FK real hacia `apus` y `cleaning_products`. Los atributos flexibles y marcadores de demo continúan en `metadata JSONB`.

## Estructura física del proyecto

- `server/server.js`: runtime Express y rutas públicas/protegidas.
- `server/repositories/apu-repository.js`: lectura de APUs y componentes JSONB.
- `server/repositories/budget-repository.js`: lectura y actualización de presupuestos y partidas.
- `server/repositories/core-repository.js`: entidades core.
- `server/serializers.js`: serialización de respuestas existentes.
- `server/migrations/001_add_password_hash.sql`: migración histórica.
- `server/migrations/002_sync_role_permissions.sql`: sincronización histórica de permisos.
- `server/migrations/003_add_cleaning_products.sql`: DDL de catálogo y relación nueva; no ejecutado.
- `server/migrations/003_add_cleaning_products.rollback.sql`: rollback limitado a objetos nuevos.
- `tools/demo_data.py`: seed oficial, status, cleanup y ahora validación/carga de productos demo.
- `index.html`: SPA activa; no modificada.
- `src/`: código paralelo identificado en la auditoría; no participa en este cambio.

No existe un `schema.sql` activo en el proyecto inspeccionado; el DDL se organiza en `server/migrations/`.

## Datos y modelos actuales

El esquema auditado contiene `clients`, `projects`, `apus`, `budgets` y `budget_items`, con IDs `VARCHAR`. `projects.client_id` referencia `clients`; `budgets.project_id` referencia `projects`; `budget_items.budget_id` referencia `budgets` y `budget_items.apu_id` referencia `apus`.

`apus` mantiene `id`, `code`, `name`, `category`, `unit`, `unit_price` y `components JSONB`. `budgets` mantiene `totals JSONB` y `settings JSONB`. `budget_items` conserva el snapshot de `unit_price` y `subtotal`, por lo que no se reemplaza su cálculo por el catálogo de productos en esta iteración.

La extensión diseñada añade:

- `cleaning_products`: identidad, SKU, descripción, clasificación, unidad, presentación, contenido, precio de compra, precio de referencia opcional, proveedor ficticio, registro demo, estado y `metadata JSONB`.
- `apu_cleaning_products`: FK a `apus` y `cleaning_products`, consumo por unidad de APU, unidad, desperdicio, snapshot del precio de compra y `metadata JSONB`.

Las filas demo se distribuyen entre Detergentes, Desinfectantes, Desengrasantes, Consumibles, Desechables, Higiene y EPP. Las 18 relaciones usan los APUs existentes `APU-DEMO-004`, `APU-DEMO-007`, `APU-DEMO-009`, `APU-DEMO-010`, `APU-DEMO-011` y `APU-DEMO-012`. En este dataset los productos representan consumibles de limpieza final/protección asociados a trabajos de obra; no se inventó un APU de servicio de limpieza.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| APUs existentes | IMPLEMENTADO Y FUNCIONAL | `server/repositories/apu-repository.js`, `/api/apus` | `index.html` | Consulta del catálogo APU | Contratos existentes y auditoría | Histórica |
| Presupuesto demo `BUD-001` | IMPLEMENTADO Y FUNCIONAL | `tools/demo_data.py`, `budget-repository.js` | `index.html` | Partidas y totales existentes | Seed y tests de contrato | Histórica |
| Catálogo demo de productos | IMPLEMENTADO PARCIALMENTE | `demo_cleaning_products()` | No | Seed programático | Validación Python estática | 3.1 |
| Relación APU-producto | IMPLEMENTADO PARCIALMENTE | `demo_apu_cleaning_products()` | No | Seed programático | 18 destinos validados contra `demo_apus()` | 3.1 |
| Status de productos | IMPLEMENTADO PARCIALMENTE | `status()` | No | CLI `python tools/demo_data.py status` | Salida condicionada al DDL aplicado | 3.1 |
| Cleanup seguro | IMPLEMENTADO PARCIALMENTE | `build_cleanup_sql()` / `cleanup()` | No | CLI `cleanup` | SQL generado; ejecución DB no verificada en esta iteración | 3.1 |
| API pública de productos | NO IMPLEMENTADO | Ningún archivo | No | No existe | No se cambió `server/server.js` | Posterior |

## Roles y estado RBAC

Los roles y la sincronización de permisos existentes no fueron modificados. La autenticación protege rutas, pero esta iteración no añadió acciones específicas por rol para productos.

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí | Parcial; rutas autenticadas, sin permiso específico nuevo | No | Puede usar las rutas genéricas existentes según sesión; no puede operar productos por API dedicada | IMPLEMENTADO PARCIALMENTE |
| Revisor Técnico | Sí | Parcial; sin regla nueva de productos | No | No tiene acción de producto específica verificable | IMPLEMENTADO PARCIALMENTE |
| Director Financiero | Sí | Parcial; sin regla nueva de productos | No | No tiene acción de producto específica verificable | IMPLEMENTADO PARCIALMENTE |
| Gerente General | Sí | Parcial; sin regla nueva de productos | No | No tiene acción de producto específica verificable | IMPLEMENTADO PARCIALMENTE |
| Cliente | Sí | Parcial; sin regla nueva de productos | No | No tiene acción de producto específica verificable | IMPLEMENTADO PARCIALMENTE |
| Oficial Legal | Sí | Parcial; sin regla nueva de productos | No | No tiene acción de producto específica verificable | IMPLEMENTADO PARCIALMENTE |

## Componentes principales

- `index.html`: conserva el catálogo APU y la interacción de presupuestos. No recibe props ni datos de productos en esta iteración.
- `server/server.js`: conserva las rutas Express y el middleware de autenticación. No expone catálogo de productos.
- `server/repositories/apu-repository.js`: continúa serializando/consultando APUs y `components`; no fue modificado.
- `server/repositories/budget-repository.js`: continúa resolviendo presupuestos, partidas y snapshots de precio; no fue modificado.
- `tools/demo_data.py`: ahora concentra productos, relaciones, validación, SQL de start/status/cleanup y control de IDs.

## Funciones y utilidades principales

| Archivo | Función | Responsabilidad | Estado |
|---|---|---|---|
| `tools/demo_data.py` | `demo_apus()` | Define los 12 APUs demo existentes y sus componentes JSONB | IMPLEMENTADO Y FUNCIONAL |
| `tools/demo_data.py` | `demo_cleaning_products()` | Define 15 productos ficticios con datos de presentación, precio y metadata demo | IMPLEMENTADO PARCIALMENTE |
| `tools/demo_data.py` | `demo_apu_cleaning_products()` | Define 18 relaciones solo a APUs y productos del mismo seed | IMPLEMENTADO PARCIALMENTE |
| `tools/demo_data.py` | `validate_demo_seed_data()` | Comprueba IDs, precios, consumo, unidades, snapshots y destinos de relación | IMPLEMENTADO Y FUNCIONAL por inspección/ejecución local |
| `tools/demo_data.py` | `build_start_sql()` | Genera una transacción idempotente con APUs, productos, relaciones, presupuesto y partidas | IMPLEMENTADO PARCIALMENTE |
| `tools/demo_data.py` | `status()` | Conserva métricas de demo y añade conteos de productos/relaciones | IMPLEMENTADO PARCIALMENTE |
| `tools/demo_data.py` | `build_cleanup_sql()` | Borra filas controladas en orden FK-safe y conserva objetos referenciados | IMPLEMENTADO PARCIALMENTE |
| `server/server.js` | handlers `/api/*` | Expone los contratos actuales de la API | IMPLEMENTADO Y FUNCIONAL; sin productos |

## Flujos funcionales end-to-end

### Seed

1. Se ejecuta `python tools/demo_data.py start`.
2. `main()` selecciona `start()`.
3. `start()` valida conexión y tablas base/nuevas.
4. `build_start_sql()` valida los APUs, productos y relaciones en memoria.
5. `run_psql()` ejecuta el SQL dentro de una transacción.
6. Los APUs existentes se insertan/actualizan antes de las relaciones; los productos se insertan antes de `apu_cleaning_products`.
7. `status()` muestra el estado controlado, incluyendo `Productos demo: 15` y `Relaciones APU-producto: 18` cuando la migración está aplicada.

### Cleanup

1. Se ejecuta `python tools/demo_data.py cleanup`.
2. `cleanup()` detecta si el esquema de productos está completo.
3. Si está completo, elimina primero `ACP-DEMO-*`, luego partidas demo, presupuesto/APUs/productos solo cuando no quedan referencias.
4. Proyecto y cliente se eliminan únicamente si ya no tienen presupuestos/proyectos referenciados.
5. Si el DDL nuevo no está aplicado, conserva el flujo histórico sin intentar consultar tablas inexistentes.

### API y UI

No existe un flujo end-to-end de productos desde la UI o la API en esta iteración. El catálogo APU, `/api/apus` y los presupuestos conservan el flujo previo.

## Estado y gestión de datos

- IDs controlados: `CLI-DEMO-001`, `PRJ-DEMO-001`, `BUD-001`, `APU-DEMO-001..012`, `BI-DEMO-001..010`, `PRD-DEMO-001..015` y `ACP-DEMO-001..018`.
- Idempotencia: `ON CONFLICT (id) DO UPDATE` en productos y relaciones, igual que el seed existente.
- Transacción: toda la carga se genera entre `BEGIN` y `COMMIT`.
- FKs: las relaciones se insertan después de APUs y productos; cleanup las elimina antes de los padres.
- JSONB: `metadata` lleva marcadores flexibles de demo; `components`, `totals` y `settings` existentes no cambian.
- Precios: `purchase_price` y `sale_price` se validan en Python y por `CHECK` PostgreSQL; no se presentan como precios reales.

## Workflow y aprobaciones

No se modificó workflow, escenarios, aprobaciones, clientes ni dashboard. La asociación de productos a APUs es únicamente dato de costo demo; no introduce transiciones de estado ni autorización nueva.

## Auditoría

La herramienta no crea `AuditLog` ni modifica el sistema de auditoría existente. La carga se identifica mediante IDs `*-DEMO-*` y `metadata.demo = true`, lo que delimita el cleanup sin afirmar que exista auditoría funcional de productos.

## Dependencias internas

- `tools/demo_data.py` depende de `psql`, `.env` y del esquema PostgreSQL.
- `start` depende de `server/migrations/003_add_cleaning_products.sql` aplicada previamente.
- Las relaciones dependen de FKs a `apus` y `cleaning_products`.
- `server/server.js`, repositorios, serializers e `index.html` no dependen todavía de las nuevas tablas.

## Verificación contra código

- Se revisaron `AGENTS.md` raíz y `md/AGENTS.md`; no existe `AGENTS.md` aplicable a `tools/` ni `server/`.
- Se revisó `tools/demo_data.py`, incluyendo `demo_apus()`, `demo_items()`, `build_start_sql()`, `build_cleanup_sql()`, `status()`, `start()` y `cleanup()`.
- Se revisó `server/server.js`, los repositorios APU/presupuesto, `server/serializers.js` e `index.html`.
- Se verificó que los 12 IDs APU usados por el seed coinciden con los APUs demo auditados.
- Se verificó que las 18 relaciones usan únicamente los seis IDs APU existentes indicados arriba.
- Se verificó que no se añadió un segundo seed ni endpoints públicos.

## Verificación funcional

- `compile(Path('tools/demo_data.py').read_text(...), ...)`: VERIFICADO POR EJECUCIÓN; sintaxis Python correcta.
- `validate_demo_seed_data()`: VERIFICADO POR EJECUCIÓN; 15 productos y 18 relaciones válidos en memoria.
- Generación de `build_start_sql()`: VERIFICADO POR EJECUCIÓN; 58 sentencias `INSERT`, con `BEGIN/COMMIT`.
- Generación de cleanup: VERIFICADO POR EJECUCIÓN; incluye deletes de relaciones/productos y orden FK-safe.
- `npm test`: VERIFICADO POR EJECUCIÓN fuera del sandbox; 10 tests pasaron, 0 fallaron.
- `python tools/demo_data.py status`: NO VERIFICADO contra PostgreSQL en esta iteración; el intento actual no pudo conectar con el PostgreSQL local por Tailscale.
- Migración y cleanup real contra PostgreSQL: NO VERIFICADO; no se ejecutaron por instrucción.

## Limitaciones actuales

1. La migración nueva no está aplicada, por lo que no hay registros persistidos de productos en la base inspeccionada.
2. No hay endpoints `/api/cleaning-products` ni endpoint de relaciones.
3. No existe UI para alta, edición, selección o visualización de productos.
4. Los APUs demo son de construcción; las relaciones actuales modelan consumibles asociados a limpieza final/protección, no un catálogo de servicios de limpieza.
5. El precio de venta se almacena como referencia opcional de catálogo, pero no participa en presupuestos ni venta.
6. No se ejecutó un ciclo real `start → status → start → cleanup` contra PostgreSQL.

## Cambios de esta iteración

1. Se amplió `tools/demo_data.py` con 15 productos demo en siete categorías.
2. Se amplió `tools/demo_data.py` con 18 relaciones `apu_cleaning_products` a APUs existentes.
3. Se añadió validación de precios, consumo, desperdicio, unidades, snapshots, IDs y destinos de relación.
4. Se actualizó `status` para mostrar productos y relaciones cuando el DDL está aplicado, sin romper el status base cuando no lo está.
5. Se actualizó `cleanup` para respetar dependencias externas y borrar primero relaciones.
6. Se ajustó `server/migrations/003_add_cleaning_products.sql` para incluir `sale_price` opcional y su `CHECK` idempotente.
7. Se actualizó `md/fase-2-2.md` para no contradecir el DDL actual.
8. Se creó este snapshot `md/fase-3-1.md`.

## Impacto técnico de esta iteración

- Archivos modificados: `tools/demo_data.py`, `server/migrations/003_add_cleaning_products.sql`, `md/fase-2-2.md`.
- Archivo creado: `md/fase-3-1.md`.
- Contrato CLI conservado: siguen existiendo `start`, `status`, `cleanup` y `run`.
- Contratos HTTP conservados: no se modificó `server/server.js` ni serializers.
- Datos existentes conservados: no se ejecutó SQL y no se añadieron columnas a tablas existentes.
- Riesgo residual: `start` requiere aplicar el DDL nuevo antes de cargar productos; la transacción evita dejar una carga parcial si las tablas no existen.
- Riesgo residual: si existen referencias no demo a `BUD-001`, APUs o productos demo, cleanup conserva el padre o puede dejar filas controladas para no tocar datos ajenos.

## Compatibilidad

- IDs siguen siendo `VARCHAR`.
- Los APUs y presupuestos existentes conservan sus columnas y payloads JSONB.
- `BUD-001` continúa siendo el presupuesto controlado; no se creó otro presupuesto demo.
- La ausencia del DDL nuevo no rompe `status` ni el cleanup histórico; `start` se detiene antes de modificar datos y solicita la migración.
- No se agregaron dependencias Node ni cambios de frontend.

## Preparación para siguientes fases

La siguiente fase puede aplicar la migración 003, ejecutar un ciclo de demo controlado y auditar los conteos. Después podrá diseñarse el contrato de lectura de productos y relaciones en repositorios/API sin mezclarlo con el seed. La UI deberá reutilizar el catálogo APU existente y definir cómo mostrar consumo, unidad y snapshot de costo.

## Próxima fase

1. Revisar y ejecutar explícitamente `server/migrations/003_add_cleaning_products.sql` en el entorno autorizado.
2. Ejecutar `start`, `status`, `start` y `cleanup` y comprobar conteos y FKs.
3. Diseñar repositorio y endpoints de solo lectura para productos/APU-producto, si el alcance lo autoriza.
4. Definir cómo el costo de producto participa en un APU sin alterar retroactivamente `budget_items`.

## Arquitectura Producción / Homelab

Esta iteración solo carga datos demo en PostgreSQL existente. No configura producción, homelab, MinIO, DocuSeal, Cal.com, n8n ni Keycloak. Esos servicios siguen siendo arquitectura objetivo y no deben describirse como implementados.

## Contrato para la siguiente iteración

- No borrar ni renombrar tablas existentes.
- No asumir que un producto demo implica un producto comercial real.
- Mantener `PRD-DEMO-*` y `ACP-DEMO-*` como alcance explícito del cleanup.
- Mantener los APUs reales auditados y no inventar IDs.
- No exponer endpoints ni cambiar frontend sin una fase autorizada.
- Verificar primero la migración aplicada y el ciclo PostgreSQL real antes de declarar el catálogo funcional.
