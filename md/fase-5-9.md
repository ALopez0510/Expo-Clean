# Fase 5 — Iteración 9: identidad autenticada antes de hidratar la SPA

## Identificación

- Proyecto: CleanQuote Pro — Expo Clean Ecuador 2026.
- Fase: 5.
- Iteración: 9.
- Fecha: 2026-10-16.
- Snapshot anterior: `md/fase-5-8.md`.
- Objetivo único: permitir que cualquier usuario válido de `/api/me` supere la puerta de entrada frontend antes de `hydrateStateFromApi()`.
- No se modificaron PostgreSQL, permisos, roles, SQL, backend, autenticación, diseño ni funcionalidades de otras fases.

## Resumen ejecutivo técnico

El `mockDB` inicial contiene solo a Ana (`USR-001`). `getCurrentUser()` resuelve la identidad desde `appState.data.users` usando `appState.session.currentUserId`.

`applyAuthenticatedUser()` ya insertaba un usuario remoto que no estuviera en `appState.data.users`, pero rechazaba la identidad si `rolePermissions[roleName]` no tenía una entrada local. Esa validación ocurría antes de `hydrateStateFromApi()` y convertía un usuario autenticado en `false`; el handler terminaba mostrando `No se pudo cargar la sesión.` sin iniciar las peticiones de hidratación.

La corrección en `index.html` elimina esa dependencia previa del mapa local. La función ahora exige únicamente una identidad segura con `id`, `role.name` y `role.permissions` provenientes de `/api/me`; agrega o actualiza la representación temporal segura con `id`, `name`, `email`, `role`, `permissions` y `active`; y conserva el objeto de permisos recibido en `appState.session.permissions`.

No se crea un usuario falso, no se sustituye el rol, no se consulta otro usuario de `mockDB` y no se modifica la fuente PostgreSQL.

## Estado general de implementación

| Capacidad | Estado | Código real | Limitación |
|---|---|---|---|
| Identidad segura recibida de `/api/me` | IMPLEMENTADO Y FUNCIONAL | `applyAuthenticatedUser()` | Depende de que `/api/me` entregue `id`, `role.name` y `role.permissions` |
| Usuario remoto ausente de `mockDB` | IMPLEMENTADO Y FUNCIONAL | `appState.data.users.unshift(localUser)` | La representación es temporal hasta la hidratación remota |
| Permisos de sesión | IMPLEMENTADO Y FUNCIONAL | `appState.session.permissions = authenticatedPermissions` | La autorización continúa siendo local en frontend |
| Hidratación posterior | IMPLEMENTADO PARCIALMENTE | `enter()` → `hydrateStateFromApi()` | `BUD-001` puede devolver 404 y activar fallback mock, por diseño actual |
| Login y `/api/me` | IMPLEMENTADO PARCIALMENTE | `apiClient.login()`, `apiClient.getMe()` | El login real de Ana/Carlos no fue repetido con credenciales durante esta iteración |
| Fallback `mockDB` | IMPLEMENTADO Y FUNCIONAL | `hydrateStateFromMockDB()` y `hydrateStateFromApi()` catch | No persiste entre reinicios |
| SQL/permisos/roles | IMPLEMENTADO Y FUNCIONAL | Sin cambios en esta iteración | No aplica al bug actual |

## Cómo funciona actualmente

El formulario llama `apiClient.login()` y luego `apiClient.getMe()`. El objeto `me.user` se entrega a `enter()`.

`enter()` llama primero a `applyAuthenticatedUser(user)`. Si la identidad es válida, actualiza `appState.session`, agrega o actualiza al usuario seguro en `appState.data.users`, oculta el login, muestra la aplicación y ejecuta `await hydrateStateFromApi()`.

Si alguna lectura posterior falla —incluido el 404 conocido de `BUD-001`— `hydrateStateFromApi()` captura el error, conserva `appState` local y cambia `apiConnectionState` a `mock`. Ese fallo posterior no devuelve `false` desde `enter()` ni se convierte en un fallo de autenticación.

Después, `enter()` ejecuta `renderApp()`, navega a la vista por defecto del rol, aplica la identidad y muestra el toast de sesión iniciada.

## Arquitectura global

```text
POST /api/login
       ↓
GET /api/me
       ↓
enter(user)
       ↓
applyAuthenticatedUser(user)
       ↓
appState.session + appState.data.users
       ↓
hydrateStateFromApi()
       ↓ fallo remoto permitido
mockDB/appState local + renderApp()
```

La API, Node/Express, PostgreSQL, Tailscale y el contrato de permisos de la iteración anterior no fueron modificados.

## Estructura física del proyecto

- `index.html`: runtime Vanilla JS, `mockDB`, `appState`, login, `applyAuthenticatedUser()`, `enter()` y `hydrateStateFromApi()`.
- `server/auth.js`: entrega la identidad segura; no modificado.
- `server/server.js`: rutas HTTP; no modificado.
- `server/migrations/002_sync_role_permissions.sql`: migración anterior; no modificada.
- `tests/server-contract.test.js`: pruebas de contrato y regresión de Ana/Carlos antes de hidratación.
- `md/fase-5-9.md`: este snapshot.

## Datos y modelos actuales

### Estado inicial

`mockDB.users` contiene una representación inicial de Ana. `appState.data.users` se hidrata desde `mockDB` al inicio y puede no contener a un usuario autenticado que exista únicamente en PostgreSQL.

### Identidad segura temporal

`applyAuthenticatedUser()` crea únicamente:

```js
{
  id,
  name,
  email,
  role,
  permissions,
  active: true
}
```

Los campos `password`, `password_hash` y cualquier secreto no se copian. `role` se conserva como `user.role.name` y `permissions` se derivan exclusivamente de `user.role.permissions`.

## Matriz de implementación

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|
| Usuario inicial Ana | IMPLEMENTADO Y FUNCIONAL | `mockDB.users` | Header/login | Puede resolver identidad inicial | Inspección y prueba | Fase 1 |
| Usuario autenticado ausente del mock | IMPLEMENTADO Y FUNCIONAL | `applyAuthenticatedUser()` | Aplicación después de `/api/me` | Inserta representación segura por `id` | Prueba ejecutada con Ana/Carlos | Actual |
| Usuario autenticado existente | IMPLEMENTADO Y FUNCIONAL | `Object.assign(existingUser, localUser)` | Header | Actualiza identidad sin duplicar | Inspección y prueba | Actual |
| Permisos remotos | IMPLEMENTADO Y FUNCIONAL | `authenticatedPermissions` | Guards de vistas/acciones | Se conserva en sesión | Prueba ejecutada | Actual |
| Hidratación API | IMPLEMENTADO PARCIALMENTE | `hydrateStateFromApi()` | Datos remotos | Promise.all y fallback mock | Inspección; 404 conocido | Actual |
| Manejo del 404 de BUD-001 | IMPLEMENTADO Y FUNCIONAL | `catch` de `hydrateStateFromApi()` | UI conserva demo local | No se modifica presupuesto vacío | Inspección | Actual |
| Backend y permisos | IMPLEMENTADO Y FUNCIONAL | Sin cambios | Sin cambios | Fuera del bug | No modificado | Anterior |

## Roles y estado RBAC

La corrección no altera roles ni permisos. Cada rol continúa llegando desde `user.role` de `/api/me`; la función ya no exige que el nombre también exista en un mapa local antes de aceptar la sesión.

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|
| Presupuestista | Sí | Se conserva desde `/api/me` | UI existente | Acciones según permisos de sesión | IMPLEMENTADO PARCIALMENTE |
| Revisor Técnico | Sí | Se conserva desde `/api/me` | UI existente | Puede superar la puerta de entrada; acciones locales dependen de sus permisos | IMPLEMENTADO PARCIALMENTE |
| Director Financiero | Sí | Se conserva desde `/api/me` | UI existente | Acciones según permisos de sesión | IMPLEMENTADO PARCIALMENTE |
| Gerente General | Sí | Se conserva desde `/api/me` | UI existente | Acciones según permisos de sesión | IMPLEMENTADO PARCIALMENTE |
| Cliente | Sí | Se conserva desde `/api/me` | UI existente | Vista por defecto de cliente si el payload es válido | IMPLEMENTADO PARCIALMENTE |
| Oficial Legal | Sí | Se conserva desde `/api/me` | UI existente | Acciones según permisos de sesión | IMPLEMENTADO PARCIALMENTE |

La autorización server-side no se modifica en esta iteración.

## Componentes principales

| Componente | Archivo | Responsabilidad | Cambio |
|---|---|---|---|
| Login handler | `index.html` | Ejecuta login, `/api/me` y `enter()` | Ninguno en el handler |
| `applyAuthenticatedUser()` | `index.html` | Convierte identidad remota segura en estado de sesión inmediato | Sí |
| `getCurrentUser()` | `index.html` | Busca el usuario por `currentUserId` | Sin cambio; ahora encuentra la representación temporal |
| `getCurrentRole()` | `index.html` | Usa `session.currentRole` antes del usuario local | Sin cambio |
| `hydrateStateFromApi()` | `index.html` | Carga roles, usuarios, clientes, proyectos, APUs y presupuesto | Sin cambio |
| `renderApp()` | `index.html` | Renderiza la aplicación después de la hidratación/fallback | Sin cambio |

## Funciones y utilidades principales

- `applyAuthenticatedUser(user)`: recibe únicamente el objeto seguro de `/api/me`; valida `id`, `role.name` y `role.permissions`; inserta/actualiza el usuario local; actualiza `currentUserId`, `currentRole`, `permissions` e `isAuthenticated`; ajusta la vista por defecto.
- `getCurrentUser()`: busca por `String(user.id) === String(appState.session.currentUserId)` y devuelve la identidad local disponible.
- `getCurrentRole()`: prioriza `appState.session.currentRole`; no infiere ni cambia el rol.
- `getPermissionsForRole()`: normaliza `appState.session.permissions` para el rol autenticado.
- `enter(user)`: corta solo si `applyAuthenticatedUser()` rechaza el payload; después llama `hydrateStateFromApi()` y mantiene fallback mock si la API de datos falla.
- `hydrateStateFromApi()`: realiza las lecturas remotas en `Promise.all`; si una falla, no lanza el error fuera de la función y cambia a modo mock.
- `restoreSession()`: llama `/api/me` al cargar la página y delega en `enter()`.

## Relación Estado → Función → Renderer → DOM

| Estado | Función | Renderer | DOM |
|---|---|---|---|
| `user.id` de `/api/me` | `applyAuthenticatedUser()` | `getCurrentUser()` | Identidad de header |
| `user.name`, `user.email` | `applyAuthenticatedUser()` | `renderHeader()` | `#headerUserName` |
| `user.role.name` | `applyAuthenticatedUser()` / `getCurrentRole()` | `renderHeader()`, `renderSidebar()` | `#headerUserRole`, botones de navegación |
| `user.role.permissions` | `applyAuthenticatedUser()` / `getPermissionsForRole()` | `hasPermission()`, `canViewForRole()` | Vistas y acciones visibles |
| `appState.data.users` | inserción/actualización temporal; luego `hydrateStateFromApi()` | `renderHeader()` | Header de usuario |
| `apiConnectionState` | `hydrateStateFromApi()` | `renderApp()` | Aplicación local/remota |

## Flujos funcionales end-to-end

### Ana Presupuesto

1. El payload seguro contiene `USR-001`, Ana y Presupuestista.
2. `applyAuthenticatedUser()` encuentra y actualiza la representación inicial.
3. Guarda `currentUserId`, `currentRole`, permisos y estado autenticado.
4. `enter()` continúa hacia `hydrateStateFromApi()`.
5. El usuario no se duplica.

Estado: `VERIFICADO POR EJECUCIÓN` mediante la prueba de identidad frontend.

### Carlos Revisor

1. El payload seguro contiene `USR-REV-001`, Carlos y Revisor Técnico.
2. `applyAuthenticatedUser()` no exige que `USR-REV-001` exista en `mockDB`.
3. Inserta una representación local segura con nombre, email, rol y permisos remotos.
4. Guarda `currentUserId = USR-REV-001` y `currentRole = Revisor Técnico`.
5. Devuelve `true`, por lo que `enter()` puede avanzar a `hydrateStateFromApi()`.

Estado: `VERIFICADO POR EJECUCIÓN` en el test focalizado con el payload seguro de `/api/me`. El login real de navegador no fue repetido durante esta iteración.

### Fallo posterior de hidratación

1. `enter()` ya aceptó la identidad.
2. `hydrateStateFromApi()` solicita las colecciones y el presupuesto.
3. Si `BUD-001` devuelve 404, el `catch` cambia `apiConnectionState` a `mock`.
4. `enter()` continúa con `renderApp()` y navegación local.

Estado: `VERIFICADO POR INSPECCIÓN`; no se modificó el 404 de `BUD-001`.

## Estado y gestión de datos

La identidad temporal se añade a `appState.data.users` solo para que el estado pueda resolver inmediatamente el usuario autenticado. Cuando `/api/users` responde, `hydrateStateFromApi()` reemplaza la colección con los usuarios remotos. La sesión conserva sus permisos y rol recibidos de `/api/me`.

No se crean registros PostgreSQL ni usuarios falsos. No se modifica `mockDB` como fuente de usuarios remotos; solo se actualiza la colección de sesión en memoria.

## Workflow y aprobaciones

NO APLICA. No se modificaron workflow, transiciones, approvals ni comentarios.

## Auditoría

NO APLICA. No se modificó `auditLog` ni `logAuditEvent()`.

## Dependencias internas

No se agregaron dependencias. `npm test` continúa usando Node.js, Express y las dependencias existentes.

## Verificación contra código

Se revisaron `AGENTS.md`, `md/AGENTS.md`, `tests/AGENTS.md`, `md/fase-5-8.md` e `index.html` completo en las secciones de login, estado, identidad, permisos, render y API. Se revisaron también `server/auth.js`, `server/server.js` y `server/repositories/core-repository.js` para confirmar que el payload seguro y las rutas no requerían cambios.

Se localizaron y verificaron:

- `mockDB.users`: contiene inicialmente a Ana.
- `getCurrentUser()`: depende de `appState.data.users` y `currentUserId`.
- `applyAuthenticatedUser()`: era la puerta previa a `hydrateStateFromApi()`.
- `enter()`: llama `applyAuthenticatedUser()` y luego `hydrateStateFromApi()`.
- `hydrateStateFromApi()`: conserva fallback mock ante errores de datos.
- `renderHeader()` y `renderSidebar()`: consumen el estado ya autenticado.

Inconsistencia corregida: la identidad segura de PostgreSQL estaba condicionada a la existencia del nombre del rol en `rolePermissions` antes de hidratar usuarios remotos. La corrección elimina esa precondición y conserva el objeto seguro recibido.

## Verificación funcional

### VERIFICADO POR EJECUCIÓN

- `npm test`: 10 tests passed, 0 failed.
- Test focalizado para Ana (`USR-001`): identidad aceptada y actualizada sin duplicación.
- Test focalizado para Carlos (`USR-REV-001`): identidad ausente del mock aceptada, insertada de forma segura y con permisos conservados.
- No se copiaron `password` ni `password_hash` en ninguna representación local.
- Scripts inline de `index.html`: 4/4 con sintaxis válida mediante `node --check`.
- Health DB existente: continúa respondiendo correctamente con la configuración local actual.

### VERIFICADO POR INSPECCIÓN

- `enter()` conserva el orden `applyAuthenticatedUser()` → `hydrateStateFromApi()`.
- `hydrateStateFromApi()` mantiene el fallback cuando `BUD-001` responde 404.
- No se modificaron `rolePermissions`, `roles.permissions`, SQL, backend, autenticación ni diseño.

### NO VERIFICADO

- Sesión de navegador completa con las credenciales reales de Ana.
- Sesión de navegador completa con las credenciales reales de Carlos.
- Network real del navegador después de `/api/me` en esta ejecución.
- Respuesta remota real de `/api/users` para reemplazar la identidad temporal.

### NO APLICA

- Pruebas de PostgreSQL, migraciones, workflow, escenarios, dashboard, Chart.js, documentos y legal.

## Limitaciones actuales

1. La prueba de Ana/Carlos usa exactamente el payload seguro esperado de `/api/me`, pero no introduce contraseñas ni realiza login real de navegador.
2. La carga real de `BUD-001` puede seguir devolviendo 404; el fallback local permanece intencionalmente.
3. El backend no fue modificado para aplicar permisos server-side; no forma parte de este bug.
4. `mockDB` continúa siendo una fuente local de fallback y no una copia completa de todos los usuarios remotos.

## Cambios de esta iteración

1. Se modificó únicamente `applyAuthenticatedUser()` en `index.html`.
2. Se eliminó la condición previa `!rolePermissions[roleName]` para aceptar el payload seguro remoto antes de hidratar.
3. Se añadió `permissions` a la representación temporal local usando `normalizePermissions(user.role.permissions)`.
4. Se conservó el objeto original de permisos en `appState.session.permissions`.
5. Se agregó una prueba focalizada para Ana y Carlos en `tests/server-contract.test.js`.
6. Se creó `md/fase-5-9.md`.

## Impacto técnico de esta iteración

- Archivos afectados: `index.html`, `tests/server-contract.test.js` y `md/fase-5-9.md`.
- No cambiaron contratos HTTP, roles, permisos, SQL, backend o dependencias.
- Un usuario autenticado no necesita existir inicialmente en `mockDB.users` para pasar a `hydrateStateFromApi()`.
- El riesgo controlado es aceptar un rol remoto cuyo nombre no esté en el mapa local; sus permisos siguen viniendo exclusivamente de `/api/me` y los guards locales continúan evaluando la sesión.

## Compatibilidad

Ana conserva su flujo y no se duplica. Los usuarios remotos nuevos reciben la misma forma temporal segura. `getCurrentUser()`, `getCurrentRole()`, `hasPermission()`, renderers y fallback mock conservan sus firmas.

## Preparación para siguientes fases

No se preparó una funcionalidad de fase posterior. El cambio solo estabiliza el paso de autenticación frontend a hidratación de datos.

## Próxima fase

No se inicia otra fase. La siguiente verificación operativa, si se solicita, debe abrir la SPA con Ana y Carlos y confirmar la secuencia Network `login → me → roles → users → clients → projects → apus → budget`, aceptando el 404 de `BUD-001` mientras el fallback permanezca activo.

## Arquitectura Producción / Homelab

Sin cambios. Node/Express sigue en la laptop, PostgreSQL en la torre y Tailscale sin modificaciones.

## Contrato para la siguiente iteración

- Mantener la identidad de sesión basada exclusivamente en `/api/me`.
- No seleccionar ni sustituir roles en el navegador.
- No crear usuarios falsos ni copiar credenciales.
- Mantener la inserción temporal segura para IDs remotos ausentes del mock.
- Mantener el fallback ante el 404 de `BUD-001` hasta que exista una solicitud separada para ese problema.
