# Workflow: Desarrollo Frontend y Lógica de Aplicación de Expo

## Objetivo
Modificar la aplicación dentro de `src/` sin romper arquitectura, contratos ni flujos existentes. El código real es la fuente de verdad y cualquier cambio debe partir de una inspección del componente, utilidad, datos y consumidores implicados.

## Antes de modificar cualquier archivo en `src/`
1. Lee el archivo completo.
2. Revisa sus imports.
3. Busca dónde se importa o utiliza.
4. Identifica props, estado, callbacks y datos que consume.
5. Identifica efectos secundarios y dependencias.
6. Revisa el Markdown versionado más reciente solo como contexto secundario.
7. Si la documentación contradice el código, corrige la documentación; no fuerces el código a coincidir con una descripción desactualizada.

## Arquitectura actual
El repositorio actual utiliza React/Vite. Respeta la separación existente entre:
- `src/App.jsx`: composición/orquestación principal.
- `src/components/`: UI y componentes funcionales.
- `src/data/`: datasets y configuración estática.
- `src/utils/`: cálculo y lógica reutilizable.
- `src/main.jsx`: arranque de aplicación.

No muevas toda la lógica a `App.jsx` ni conviertas componentes en bloques monolíticos.

## Flujo de cambio de UI
Cada vez que añadas o modifiques una interacción:
1. Identifica el estado fuente.
2. Identifica el componente que lo lee.
3. Identifica el evento que dispara el cambio.
4. Valida y normaliza entradas.
5. Actualiza el estado o llama a la utilidad correspondiente.
6. Evita duplicar cálculos de negocio dentro del JSX.
7. Verifica el resultado renderizado.
8. Verifica que el cambio no rompa componentes consumidores.

## Lógica de negocio
Cuando exista una utilidad en `src/utils/`, reutilízala antes de duplicar fórmulas en componentes.

Para una función de cálculo documenta mentalmente antes de editar:
- entradas;
- salidas;
- unidades;
- valores límite;
- manejo de datos inválidos;
- consumidores.

## Componentes
Mantén componentes enfocados. Si una modificación agrega demasiadas responsabilidades a un componente:
1. identifica una unidad reutilizable;
2. extrae solo si mejora claridad o reutilización real;
3. conserva interfaces simples;
4. evita refactors cosméticos masivos durante una fase funcional.

## RBAC y roles
No confundas roles declarados con permisos funcionales.

Para considerar un permiso implementado deben existir evidencias de:
- regla de autorización;
- evaluación de la regla;
- bloqueo/ocultamiento o rechazo de la acción;
- comportamiento verificable.

Si solo existe un array con nombres de roles, documenta `PLACEHOLDER ESTRUCTURAL` o `IMPLEMENTADO PARCIALMENTE`, según el código real.

## Workflow y aprobaciones
Que existan campos como `status`, `approvals`, `comments` o similares no implica que exista un workflow funcional.

Un workflow solo puede marcarse como `IMPLEMENTADO Y FUNCIONAL` si existe:
1. un conjunto real de estados;
2. transiciones;
3. validación de transición;
4. acción o evento que ejecute la transición;
5. actualización del estado;
6. UI o consumidor que refleje el resultado.

## Datos demo
Los datasets hardcodeados deben ser consistentes y deterministas. Mantén IDs únicos y referencias válidas.

No introduzcas datos de ejemplo genéricos cuando la aplicación ya use entidades del dominio.

## Seguridad y robustez
- No uses `dangerouslySetInnerHTML` salvo necesidad real y contenido controlado.
- Valida números antes de calcular.
- Maneja `NaN`, `undefined`, arrays vacíos y datos faltantes.
- No asumas que `.find()` siempre devuelve un elemento.
- Evita errores que rompan el render completo por un dato opcional.

## Verificación posterior a cada cambio
Comprueba como mínimo los flujos afectados. Cuando sean relevantes:
1. carga inicial;
2. edición de inputs;
3. cálculos;
4. actualización de resultados;
5. apertura/cierre de modales;
6. navegación o tabs;
7. comparativas;
8. propuestas;
9. estados vacíos;
10. responsive básico.

## Regla documental
Al terminar, el archivo de `md/` correspondiente debe indicar exactamente:
- qué archivo de `src/` cambió;
- qué función/componente cambió;
- qué comportamiento cambió;
- qué se verificó;
- qué todavía no está implementado.
