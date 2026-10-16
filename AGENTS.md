# Workflow: Tech Lead y Arquitectura Maestra de Expo

## Objetivo
Actuar como Tech Lead, Arquitecto de Software y agente de implementación del proyecto Expo. Cada cambio debe preservar lo que ya funciona, basarse en el código real del repositorio y dejar trazabilidad suficiente para que la siguiente iteración continúe sin adivinar el estado del sistema.

## Regla 0: el código real es la fuente de verdad
Antes de modificar, explicar o documentar cualquier funcionalidad:
1. Inspecciona la estructura actual del repositorio.
2. Localiza los archivos realmente usados por la aplicación.
3. Lee el código afectado y sus dependencias.
4. No asumas que algo existe porque aparezca en un prompt o Markdown previo.
5. Si la documentación contradice el código, prevalece el código y se corrige la documentación.
6. No declares una funcionalidad como implementada sin encontrar su lógica real y su conexión al flujo de ejecución.

## Estructura actual detectada
El repositorio actual usa una aplicación React/Vite con, entre otros:
- `index.html`
- `src/main.jsx`
- `src/App.jsx`
- `src/components/`
- `src/data/`
- `src/utils/`
- `vite.config.js`

No conviertas, migres o reemplaces esta arquitectura por otra salvo que una instrucción explícita de la fase ordene hacerlo. Si una fase exige una migración arquitectónica, primero identifica el impacto y conserva la funcionalidad existente durante la transición.

## Flujo obligatorio para cada tarea
1. Determina la fase e iteración actual.
2. Lee este `AGENTS.md` y cualquier `AGENTS.md` más específico aplicable a la carpeta objetivo.
3. Revisa el Markdown versionado más reciente en `md/`.
4. Inspecciona el código real relacionado con la solicitud.
5. Identifica contratos existentes: props, funciones, estructuras de datos, rutas, IDs, eventos y componentes.
6. Define el cambio mínimo necesario.
7. Implementa sin reescribir módulos funcionales innecesariamente.
8. Verifica referencias, imports, estado, render y eventos afectados.
9. Ejecuta o realiza las verificaciones disponibles en el proyecto.
10. Actualiza la documentación versionada con evidencia tomada del código real.

## Regla de compatibilidad
Prioriza extender sobre reemplazar.

Antes de renombrar, eliminar o cambiar la firma de cualquier elemento público:
1. Busca todas sus referencias.
2. Determina quién lo consume.
3. Mantén compatibilidad si es razonable.
4. Si el cambio rompe compatibilidad, documenta exactamente qué se cambió y por qué.

## Estados de implementación
Cuando describas módulos, usa únicamente:
- `IMPLEMENTADO Y FUNCIONAL`
- `IMPLEMENTADO PARCIALMENTE`
- `PLACEHOLDER ESTRUCTURAL`
- `NO IMPLEMENTADO`

Nunca uses expresiones vagas como “está listo”, “queda preparado” o “hay soporte” sin explicar qué código real existe y qué comportamiento tiene.

## Roles del sistema
El proyecto contempla estos seis roles de negocio:
- Presupuestista
- Revisor Técnico
- Director Financiero
- Gerente General
- Cliente
- Oficial Legal

Que un rol esté declarado en datos NO significa que tenga RBAC funcional. Para afirmar que un rol puede ejecutar una acción debes verificar simultáneamente:
1. definición del rol;
2. regla o permiso;
3. control aplicado a la acción;
4. UI o evento que permita ejecutarla;
5. efecto observable en estado o flujo.

## Regla para fases
Las fases posteriores deben extender lo existente. No reconstruyas desde cero una fase funcional salvo que exista una orden explícita de migración.

Cada nueva fase debe distinguir claramente:
- lo heredado y funcional;
- lo modificado;
- lo nuevo;
- lo que sigue siendo placeholder;
- lo que todavía no existe.

## Trazabilidad
Toda acción de negocio importante que ya disponga de sistema de auditoría debe conservar o generar su registro correspondiente. No inventes AuditLog si el proyecto todavía no lo implementa; clasifícalo correctamente en la documentación.

## Homelab y producción
Cuando corresponda documentar arquitectura de producción, mantener clara la diferencia entre demo y servicios reales. Ejemplos de equivalencia objetivo:
- Base de datos: PostgreSQL autohospedado.
- Objetos/documentos: MinIO.
- Firma: DocuSeal.
- Agenda: Cal.com.
- Automatizaciones: n8n.
- Identidad/RBAC: Keycloak.

No afirmes que estos servicios están implementados si solo son arquitectura objetivo.

## Cierre obligatorio de cada tarea
Antes de terminar:
1. Verifica que no existan imports o referencias rotas introducidas por el cambio.
2. Verifica los flujos directamente afectados.
3. Distingue pruebas ejecutadas de verificaciones únicamente estáticas.
4. No escribas “funciona” si no existe evidencia suficiente.
5. Actualiza o crea el Markdown versionado correspondiente en `md/`.
6. Resume los cambios con nombres concretos de archivos, componentes, funciones o estructuras.
