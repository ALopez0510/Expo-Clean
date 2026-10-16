# Fase 5 — Iteración 8: sincronización de permisos PostgreSQL ↔ frontend

## Identificación

- Proyecto: CleanQuote Pro — Expo Clean Ecuador 2026.
- Fase: 5.
- Iteración: 8.
- Fecha: 2026-10-16.
- Snapshot anterior: `md/fase-5-7.md`.
- Este snapshot es nuevo; `fase-5-7.md` no fue sobrescrito.
- Alcance único: corregir la nomenclatura de `roles.permissions` frente a `rolePermissions` de `index.html`.
- SQL de migración generado, pero no ejecutado automáticamente.

## Resumen ejecutivo técnico

El frontend compara permisos con claves usando `:` (`budget:read`, `workflow:technical-review`, etc.). PostgreSQL tenía claves con `.` (`budget.read`, `workflow.technical_review`, etc.). Como consecuencia, el rol llegaba autenticado, pero `hasPermission()` no encontraba las claves esperadas y ocultaba vistas/acciones.

La corrección es exclusivamente una migración nueva: `server/migrations/002_sync_role_permissions.sql`. Contiene seis `UPDATE roles`, conserva `jsonb`, usa los seis IDs indicados por el contrato y copia exactamente las listas presentes en `rolePermissions`.

No se modificaron `index.html`, `server/auth.js`, `server/server.js`, contraseñas, usuarios, workflow, escenarios, dashboard, Chart.js, documentos, legal, almacenamiento ni infraestructura.

## Estado general de implementación

| Capacidad | Estado | Código real | Límite actual |
|---|---|---|---|
| Contrato frontend `rolePermissions` | IMPLEMENTADO Y FUNCIONAL | `index.html:692-699` | Es una lista local; no modifica PostgreSQL |
| Conversión JSONB → lista frontend | IMPLEMENTADO Y FUNCIONAL | `normalizePermissions()` en `index.html:866-875` | Solo acepta claves cuyos valores sean exactamente `true` |
| Consumo de permisos autenticados | IMPLEMENTADO Y FUNCIONAL | `getPermissionsForRole()`, `hasPermission()`, `canViewForRole()` | La decisión ocurre en el cliente |
| Migración de nomenclatura | IMPLEMENTADO PARCIALMENTE | `002_sync_role_permissions.sql` | No fue ejecutada; el estado remoto posterior no está verificado |
| Prueba de correspondencia | IMPLEMENTADO Y FUNCIONAL | Contrato nuevo en `tests/server-contract.test.js` | Valida archivo y frontend, no ejecuta la migración |
| Autorización server-side | NO IMPLEMENTADO | `requireAuth()` solo autentica sesión | Fuera de este bug y de esta iteración |

## Cómo funciona actualmente

`server/auth.js` obtiene `r.permissions` mediante el JOIN de `users` con `roles`. `safeUser()` conserva ese objeto JSONB en `user.role.permissions` sin cambiar sus claves. Al recibir `/api/me`, `applyAuthenticatedUser()` guarda el objeto en `appState.session.permissions`.

`normalizePermissions()` transforma un objeto como `{ "budget:read": true }` en `[`"budget:read"`]`. `getPermissionsForRole()` devuelve esa lista para el rol autenticado y `hasPermission()` usa `Array.includes()`. `getViewPermission()` asigna cada vista a una clave y `canViewForRole()` decide si la vista puede mostrarse. `renderSidebar()` aplica esa decisión al atributo `hidden` de los botones `[data-view]`.

Antes de aplicar la migración, un objeto con `budget.read` no podía satisfacer `budget:read`. Después de aplicar la migración, el valor remoto tendrá exactamente el contrato que ya consume el frontend.

## Arquitectura global

```text
PostgreSQL roles.permissions (JSONB)
        ↓ JOIN en server/auth.js
safeUser().role.permissions
        ↓ GET /api/me
appState.session.permissions
        ↓ normalizePermissions()
hasPermission() / canViewForRole()
        ↓
renderSidebar() y renderizadores de vistas
```

La arquitectura HTTP, el servidor Node/Express en `127.0.0.1:8000`, PostgreSQL por Tailscale y el fallback `mockDB` no fueron modificados.

## Estructura física del proyecto

- `index.html`: contrato fuente `rolePermissions`, normalización, guards locales y renderers.
- `server/auth.js`: consulta `users`/`roles` y serialización segura de permisos.
- `server/server.js`: rutas de autenticación; no modificado.
- `server/repositories/core-repository.js`: lectura de roles/usuarios; no modificado.
- `server/migrations/002_sync_role_permissions.sql`: archivo nuevo con seis `UPDATE roles`.
- `tests/server-contract.test.js`: contrato nuevo de igualdad entre frontend y SQL.
- `md/fase-5-8.md`: este snapshot.

## Datos y modelos actuales

Las listas se extrajeron directamente de `rolePermissions` en `index.html`:

| Rol | ID SQL | Cantidad | Permisos exactos |
|---|---|---:|---|
| Presupuestista | `ROLE-PRESUPUESTISTA` | 32 | `apu:read`, `budget:read`, `budget:write`, `budget:delete`, `budget:quantity`, `settings:write`, `workflow:internal-read`, `workflow:submit-technical`, `comments:create`, `documents:read`, `documents:preview`, `proposal:read`, `proposal:view`, `proposal:generate`, `proposal:send`, `scenario:read`, `scenario:create`, `scenario:write`, `scenario:delete`, `scenario:adjust`, `scenario:optimize`, `scenario:conservative`, `scenario:promote`, `price:read`, `price:apply`, `variance:read`, `risk:read`, `dashboard:view`, `dashboard:internal`, `dashboard:financial`, `dashboard:risk`, `audit:view` |
| Revisor Técnico | `ROLE-REVISOR` | 16 | `budget:read`, `workflow:internal-read`, `workflow:technical-review`, `workflow:technical-approve`, `workflow:technical-reject`, `comments:create`, `documents:read`, `documents:preview`, `scenario:read`, `variance:read`, `risk:read`, `dashboard:view`, `dashboard:internal`, `dashboard:financial`, `dashboard:risk`, `audit:view` |
| Director Financiero | `ROLE-FINANCIERO` | 26 | `budget:read`, `workflow:internal-read`, `workflow:financial-review`, `workflow:financial-approve`, `workflow:financial-reject`, `comments:create`, `documents:read`, `documents:preview`, `proposal:read`, `proposal:view`, `proposal:generate`, `proposal:send`, `scenario:read`, `scenario:create`, `scenario:write`, `scenario:adjust`, `scenario:promote`, `price:read`, `price:apply`, `variance:read`, `risk:read`, `dashboard:view`, `dashboard:internal`, `dashboard:financial`, `dashboard:risk`, `audit:view` |
| Gerente General | `ROLE-GERENTE` | 20 | `budget:read`, `workflow:internal-read`, `workflow:management-review`, `workflow:management-approve`, `workflow:management-reject`, `comments:create`, `documents:read`, `documents:preview`, `proposal:read`, `proposal:view`, `contract:read`, `contract:sign`, `scenario:read`, `variance:read`, `risk:read`, `dashboard:view`, `dashboard:internal`, `dashboard:financial`, `dashboard:risk`, `audit:view` |
| Cliente | `ROLE-CLIENTE` | 12 | `budget:read`, `proposal:read`, `proposal:view`, `proposal:approve`, `proposal:request-changes`, `comments:create-client`, `contract:read`, `contract:sign`, `workflow:client-approve`, `workflow:client-request-changes`, `workflow:changes-return`, `dashboard:view` |
| Oficial Legal | `ROLE-LEGAL` | 20 | `budget:read`, `workflow:internal-read`, `legal:read`, `documents:read`, `documents:preview`, `proposal:read`, `proposal:view`, `legal:review`, `legal:approve`, `legal:request-changes`, `contract:create`, `contract:read`, `contract:approve-signature`, `comments:create`, `workflow:legal-review`, `workflow:legal-approve`, `workflow:legal-request-changes`, `dashboard:view`, `dashboard:internal`, `audit:view` |

Todos los valores escritos por la migración son booleanos `true`; no hay claves duplicadas ni claves con `.` o `_` en lugar de `:`.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| Extracción de permisos | IMPLEMENTADO Y FUNCIONAL | `rolePermissions` en `index.html` | No cambia UI | Lista exacta por rol | Inspección y test | Actual |
| Normalización JSONB | IMPLEMENTADO Y FUNCIONAL | `normalizePermissions()` | Alimenta guards | Objeto booleano → array de claves | Inspección | Actual |
| Comparación de permiso | IMPLEMENTADO Y FUNCIONAL | `hasPermission()` | Guards de acciones/vistas | `includes(permission)` | Inspección | Actual |
| Visibilidad de vistas | IMPLEMENTADO Y FUNCIONAL | `getViewPermission()`, `canViewForRole()`, `renderSidebar()` | Botones `[data-view]` | `hidden` según permiso | Inspección | Actual |
| SQL de sincronización | IMPLEMENTADO PARCIALMENTE | `002_sync_role_permissions.sql` | No aplica | Se aplicará manualmente | Test estático; no ejecutado | Actual |
| Autenticación | IMPLEMENTADO PARCIALMENTE | `server/auth.js` | Login existente | Rol viene de DB | No modificado | Anterior |

## Roles y estado RBAC

Los seis roles tienen listas concretas en el frontend y seis `UPDATE` en el SQL. La migración todavía no fue ejecutada, por lo que la coincidencia entre PostgreSQL remoto y frontend queda pendiente de aplicación.

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí | Lista exacta en SQL, pendiente de ejecución | UI existente | Cliente local puede actuar según `hasPermission()` | IMPLEMENTADO PARCIALMENTE |
| Revisor Técnico | Sí | Lista exacta en SQL, pendiente de ejecución | UI existente | Cliente local puede actuar según workflow/guards existentes | IMPLEMENTADO PARCIALMENTE |
| Director Financiero | Sí | Lista exacta en SQL, pendiente de ejecución | UI existente | Cliente local puede actuar según workflow/guards existentes | IMPLEMENTADO PARCIALMENTE |
| Gerente General | Sí | Lista exacta en SQL, pendiente de ejecución | UI existente | Cliente local puede actuar según workflow/guards existentes | IMPLEMENTADO PARCIALMENTE |
| Cliente | Sí | Lista exacta en SQL, pendiente de ejecución | UI existente | Cliente local puede actuar según guards existentes | IMPLEMENTADO PARCIALMENTE |
| Oficial Legal | Sí | Lista exacta en SQL, pendiente de ejecución | UI existente | Cliente local puede actuar según guards existentes | IMPLEMENTADO PARCIALMENTE |

No se modificó la autoridad server-side. `requireAuth()` sigue validando sesión, no permisos de negocio.

## Componentes principales

| Componente | Archivo | Responsabilidad en este bug | Cambio |
|---|---|---|---|
| `rolePermissions` | `index.html` | Define las claves canónicas consumidas por el cliente | Ninguno |
| `normalizePermissions()` | `index.html` | Convierte JSONB object válido en array de claves | Ninguno; ya acepta el formato |
| `getPermissionsForRole()` | `index.html` | Selecciona permisos autenticados o fallback por rol | Ninguno |
| `hasPermission()` | `index.html` | Compara permiso requerido con lista recibida | Ninguno |
| `renderSidebar()` | `index.html` | Oculta botones sin permiso | Ninguno |
| `safeUser()` | `server/auth.js` | Devuelve `role.permissions` sin modificar claves | Ninguno |
| Migración | `server/migrations/002_sync_role_permissions.sql` | Cambia solo `roles.permissions` | Archivo nuevo |

## Funciones y utilidades principales

- `normalizePermissions(value)`: si recibe objeto, devuelve las claves cuyo valor es `true`; si recibe JSON string, lo parsea; no necesita conversión de puntos a dos puntos porque la migración escribe las claves canónicas.
- `getPermissionsForRole(role)`: usa `appState.session.permissions` para el rol autenticado y `rolePermissions[role]` como fallback local.
- `hasPermission(permission)`: permite `*` o coincidencia exacta mediante `includes()`.
- `getViewPermission(viewName)`: asigna dashboard, catálogo, presupuesto, workflow, escenarios, portal, documentos, legal y auditoría a sus claves `:`.
- `canViewForRole(viewName, role)`: evalúa la clave obtenida contra la lista del rol.
- `renderSidebar()`: aplica la evaluación a cada botón `[data-view]` mediante `button.hidden`.
- `safeUser(row)`: obtiene `role_id`, `role_name` y `role_permissions` desde el JOIN y elimina `password_hash` de la respuesta pública.

## Relación Estado → Función → Renderer → DOM

| Estado | Función | Renderer | DOM |
|---|---|---|---|
| `user.role.permissions` | `applyAuthenticatedUser()` | `getPermissionsForRole()` | Estado de sesión |
| `appState.session.permissions` | `hasPermission()` | `canViewForRole()` | Decisión de visibilidad |
| `appState.ui.activeView` + permiso requerido | `renderSidebar()` | No cambia contenido | Botones `[data-view]` con `hidden` |
| `appState.workflow` + permisos | `renderWorkflowView()` | Guards de acciones | `#workflow-view-container` |

La migración no cambia el renderer ni los IDs DOM.

## Flujos funcionales end-to-end

### Flujo de permisos después de aplicar la migración

1. La migración actualiza un `roles.permissions` existente con JSONB.
2. `server/auth.js` lo obtiene mediante `USER_SELECT`.
3. `safeUser()` lo incluye en `user.role.permissions`.
4. `GET /api/me` devuelve el usuario autenticado.
5. `applyAuthenticatedUser()` lo guarda en `appState.session.permissions`.
6. `normalizePermissions()` convierte cada valor `true` en una clave de array.
7. `hasPermission()` encuentra `budget:read`, `workflow:technical-review` u otra clave exacta.
8. `canViewForRole()` y `renderSidebar()` permiten mostrar la vista correspondiente.

Este flujo fue verificado por inspección; la migración no fue ejecutada.

## Estado y gestión de datos

Solo se modifica el campo `roles.permissions` mediante seis `UPDATE`. No se insertan roles, no se eliminan roles, no se actualizan usuarios y no se cambian contraseñas. `mockDB` y `appState` no fueron modificados.

## Workflow y aprobaciones

NO APLICA a esta iteración. No se cambiaron transiciones, aprobaciones, comentarios ni workflow.

## Auditoría

NO APLICA a esta iteración. La migración no crea eventos de auditoría.

## Dependencias internas

No se añadieron dependencias ni se modificó `package.json`. La prueba utiliza las dependencias existentes de Node.js.

## Verificación contra código

Se revisaron:

- `AGENTS.md`, `md/AGENTS.md`, `tests/AGENTS.md` y `md/fase-5-7.md`.
- `index.html`, especialmente `rolePermissions`, `normalizePermissions()`, `getPermissionsForRole()`, `hasPermission()`, `getViewPermission()`, `canViewForRole()`, `renderSidebar()` y `applyAuthenticatedUser()`.
- `server/auth.js`, `server/server.js` y `server/repositories/core-repository.js`.
- El nuevo `server/migrations/002_sync_role_permissions.sql`.
- `tests/server-contract.test.js`.

Resultado de la inspección:

- `normalizePermissions()` ya acepta JSONB válido como objeto `{ clave: true }`.
- El backend ya obtiene permisos desde `roles.permissions` y los devuelve dentro del rol seguro.
- El frontend espera claves con `:` y no realiza ninguna conversión desde `.`/`_`.
- La discrepancia se corrige en SQL, sin cambiar frontend ni autenticación.

## Verificación funcional

### VERIFICADO POR EJECUCIÓN

- `npm test`: 9 tests passed, 0 failed.
- El contrato de permisos extrajo `rolePermissions` desde `index.html` y comparó las seis actualizaciones SQL.
- Se verificaron seis `UPDATE roles`, sin sentencias `INSERT`, `DELETE`, `ALTER`, `CREATE` o `DROP`.
- Se verificaron cantidades, orden, claves exactas, valores booleanos `true`, ausencia de duplicados y ausencia de permisos cruzados.
- Con `.env` local presente, `GET /api/health/db` respondió HTTP 200 con `database: "al_bd"` y `user: "al_app"` durante `npm test`.
- Los valores de `.env` no fueron impresos.

### VERIFICADO POR INSPECCIÓN

- No fue necesario modificar `normalizePermissions()`.
- No fue necesario tocar `index.html`, `server/auth.js`, `server/server.js` ni `core-repository.js`.
- La migración conserva JSONB y actualiza únicamente roles existentes por ID.

### NO VERIFICADO

- Ejecución de `002_sync_role_permissions.sql` contra PostgreSQL.
- Login real de cada uno de los seis roles después de aplicar la migración.
- Render visual en navegador con las seis sesiones.

### NO APLICA

- Pruebas de workflow, escenarios, dashboard, Chart.js, documentos, legal o almacenamiento.

## Limitaciones actuales

1. La migración fue generada, pero no ejecutada automáticamente por la restricción explícita de la iteración.
2. Hasta aplicar el SQL, el PostgreSQL remoto puede conservar la nomenclatura anterior.
3. El test valida el contrato generado, no confirma que los IDs existan realmente en la base hasta ejecutar la migración.
4. No se implementó RBAC server-side; este cambio solo sincroniza las claves consumidas por el frontend.

## Cambios de esta iteración

1. Se creó `server/migrations/002_sync_role_permissions.sql` con seis `UPDATE roles` y JSONB.
2. Se amplió `tests/server-contract.test.js` para comparar automáticamente el SQL contra `rolePermissions`, detectar duplicados y rechazar permisos cruzados.
3. Se creó este snapshot `md/fase-5-8.md`.

No se tocó `index.html` ni se cambió la autenticación.

## Impacto técnico de esta iteración

- El comportamiento frontend no cambia mientras la migración no se aplique.
- Después de aplicar la migración, `safeUser()` entregará claves que `normalizePermissions()` y `hasPermission()` ya reconocen.
- No se agregaron dependencias ni se alteraron contratos HTTP.
- El SQL no se ejecuta en `npm start` ni en `npm test`.

## Compatibilidad

Se conservaron `rolePermissions`, `normalizePermissions()`, `hasPermission()`, los nombres de roles, las rutas HTTP, la sesión, `users` y el formato JSONB. La migración es aditiva respecto al esquema: reemplaza únicamente el valor de permisos de cada rol existente.

## Preparación para siguientes fases

No se preparó ninguna funcionalidad de fase posterior. La única acción pendiente de esta corrección es revisión y ejecución manual de la migración por una persona autorizada sobre PostgreSQL.

## Próxima fase

No se inicia otra fase. Después de aplicar el SQL, debe verificarse el login de Carlos Revisor y una sesión de cada rol; esa verificación pertenece al cierre de esta corrección, no a una nueva funcionalidad.

## Arquitectura Producción / Homelab

Sin cambios. Node/Express permanece en la laptop; PostgreSQL continúa en la torre mediante Tailscale. No se tocaron PostgreSQL salvo el SQL preparado para `roles.permissions`, ni Tailscale, firewall, red o almacenamiento.

## Contrato para la siguiente iteración

- Aplicar manualmente únicamente `server/migrations/002_sync_role_permissions.sql`.
- No ejecutar seed, no insertar roles y no modificar usuarios.
- Confirmar que los seis IDs existen antes de aplicar la migración.
- Verificar que cada `roles.permissions` conserve JSONB y coincida con `rolePermissions`.
- No modificar `index.html` para compensar una discrepancia que pertenece a PostgreSQL.
