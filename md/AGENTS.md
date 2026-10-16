# Workflow: Documentación Técnica Versionada y Verificable de Expo

## Objetivo
Mantener snapshots técnicos completos, cronológicos y comprobables contra el código real del proyecto. La documentación no debe describir intenciones como si fueran funcionalidades existentes.

## 1. El código es la fuente de verdad
Antes de generar un `.md` de fase:
1. inspecciona los archivos reales del repositorio;
2. localiza los componentes, utilidades y datos que implementan cada afirmación;
3. verifica imports y conexiones entre módulos;
4. revisa el Markdown anterior solo como referencia histórica;
5. corrige cualquier contradicción entre documentación anterior y código actual.

Nunca documentes algo solo porque estaba solicitado en un prompt.

## 2. Nombre y versionado
Los snapshots usan:

`fase-{fase}-{iteracion}.md`

Ejemplos:
- `fase-1-1.md`
- `fase-1-2.md`
- `fase-2-1.md`

Antes de crear uno nuevo:
1. lista los archivos `fase-{fase}-*.md` existentes;
2. detecta la iteración máxima;
3. incrementa en uno;
4. crea un archivo nuevo;
5. nunca sobrescribas una versión histórica.

Cuando cambia la fase, la iteración vuelve a `1`.

## 3. Snapshot completo, no solo diff
Cada archivo debe describir el estado completo vigente del proyecto en ese momento.

La sección `Cambios de esta iteración` sí debe contener únicamente las diferencias respecto de la versión anterior.

## 4. Estados obligatorios de implementación
Clasifica cada módulo o capacidad con uno de estos estados exactos:
- `IMPLEMENTADO Y FUNCIONAL`
- `IMPLEMENTADO PARCIALMENTE`
- `PLACEHOLDER ESTRUCTURAL`
- `NO IMPLEMENTADO`

### IMPLEMENTADO Y FUNCIONAL
Solo cuando existe código real conectado al flujo y produce un comportamiento observable.

### IMPLEMENTADO PARCIALMENTE
Cuando existe lógica real pero falta parte importante del flujo, reglas, UI o integración.

### PLACEHOLDER ESTRUCTURAL
Cuando únicamente existe una estructura, array, propiedad, componente vacío o función stub para una fase futura.

### NO IMPLEMENTADO
Cuando no existe código real para esa capacidad.

## 5. Prohibido usar lenguaje ambiguo
No escribas frases como:
- “está preparado”;
- “queda listo”;
- “hay soporte”;
- “se contempla”;
- “los roles existen”;

sin especificar exactamente qué código existe.

En su lugar usa siempre:

### Lo que existe
Nombres concretos de archivos, funciones, propiedades, componentes o datos.

### Lo que funciona actualmente
Comportamiento real y observable.

### Lo que todavía no existe
Funciones, reglas, UI o integraciones faltantes.

### Fase donde se completará
Solo si está definida en el plan del proyecto.

## 6. No confundir datos con funcionalidad
Ejemplo obligatorio de interpretación:

Si existe `approvals: []`, eso demuestra únicamente que existe una estructura de datos.

NO demuestra que exista:
- aprobación;
- rechazo;
- permisos;
- cambio de estado;
- UI de aprobación;
- workflow.

Lo mismo aplica a:
- `roles`;
- `comments`;
- `documents`;
- `scenarios`;
- `workflow`;
- `auditLog`.

## 7. Verificación directa contra el código
Cada snapshot debe incluir:

## Verificación contra código

Debe indicar:
- archivos principales revisados;
- componentes encontrados;
- funciones encontradas;
- estructuras encontradas;
- inconsistencias detectadas.

Ejemplo:

- `src/App.jsx`: revisado.
- `src/utils/calculator.js`: revisado.
- `src/data/parametricData.js`: revisado.
- `calculateX()`: encontrado y utilizado por `Y`.

Si algo descrito anteriormente no existe, indícalo y corrige el estado.

No escribas “no puedo comprobar el código” si el repositorio está disponible: búscalo y revísalo.

## 8. Verificación funcional vs inspección estática
Distingue siempre:
- `VERIFICADO POR EJECUCIÓN`: se ejecutó y se observó el comportamiento.
- `VERIFICADO POR INSPECCIÓN`: se comprobó la conexión lógica en código, sin ejecutar el flujo.
- `NO VERIFICADO`: no existe evidencia suficiente.
- `NO APLICA`: pertenece a una fase futura o no corresponde.

No marques algo como funcional únicamente porque exista una función con ese nombre.

## 9. Roles: explicación individual obligatoria
Para cada uno de los seis roles documenta:
- Declarado: Sí/No.
- Permisos reales: Sí/Parcial/No.
- UI específica: Sí/No.
- Acciones actualmente ejecutables.
- Restricciones actualmente aplicadas.
- Estado de implementación.

Roles:
- Presupuestista
- Revisor Técnico
- Director Financiero
- Gerente General
- Cliente
- Oficial Legal

No escribas simplemente “los seis roles están declarados”. Explica qué puede hacer realmente cada uno.

## 10. Matriz de implementación obligatoria
Incluye una tabla:

| Módulo/Capacidad | Estado | Código real | UI real | Interacción real | Evidencia | Fase |
|---|---|---|---|---|---|---|

La tabla debe derivarse del código real.

## 11. Matriz de roles obligatoria
Incluye una tabla:

| Rol | Declarado | Permisos aplicados | UI específica | Puede actuar hoy | Estado |
|---|---|---|---|---|---|

No completes valores por expectativa futura.

## 12. Explicar funciones importantes
Para cada función core relevante documenta:
- archivo;
- responsabilidad;
- entradas;
- salidas;
- estado/datos que lee;
- estado/datos que modifica;
- efectos secundarios;
- consumidores;
- estado de implementación.

Evita descripciones triviales como “calcula totales”.

## 13. Explicar componentes importantes
Para cada componente principal documenta:
- archivo;
- responsabilidad;
- props;
- estado interno relevante;
- callbacks importantes;
- utilidades/datos que consume;
- elementos funcionales que renderiza.

## 14. Flujos end-to-end
Documenta los flujos realmente existentes paso a paso.

Cada flujo debe explicar:
1. evento inicial del usuario;
2. componente que recibe el evento;
3. función/callback ejecutado;
4. dato o estado modificado;
5. cálculo o transformación;
6. nuevo render;
7. resultado observable.

Solo documenta como flujo funcional aquello que puedas rastrear en el código.

## 15. Cómo funciona actualmente
Cada snapshot debe incluir una sección narrativa concreta llamada:

## Cómo funciona actualmente

Debe explicar el recorrido real de la aplicación usando nombres reales de archivos, componentes y funciones.

No uses lenguaje aspiracional.

## 16. Limitaciones actuales
Incluye una sección:

## Limitaciones actuales

Enumera claramente qué NO hace todavía el sistema y, cuando corresponda, qué fase lo completará.

Las limitaciones no son errores si son intencionales; deben quedar inequívocamente diferenciadas de funcionalidades rotas.

## 17. Cambios de esta iteración
Lista cambios concretos, por ejemplo:
1. Se añadió `X` en `src/...`.
2. Se modificó `Y()` para ...
3. `ComponentA` ahora pasa `propB` a `ComponentC`.

Evita “se mejoró la arquitectura”.

## 18. Impacto técnico
Incluye:

## Impacto técnico de esta iteración

Explica:
- archivos afectados;
- contratos cambiados;
- comportamiento conservado;
- nuevas dependencias;
- posibles riesgos de regresión.

## 19. Próxima fase
Explica qué se añadirá concretamente y qué estructuras existentes deberá reutilizar.

No escribas solo “implementar RBAC”; especifica permisos, controles, transiciones, eventos, UI y datos esperados si están definidos.

## 20. Estructura mínima obligatoria del snapshot

# Fase X — Iteración N

## Identificación
## Resumen ejecutivo técnico
## Estado general de implementación
## Cómo funciona actualmente
## Arquitectura global
## Estructura física del proyecto
## Datos y modelos actuales
## Matriz de implementación
## Roles y estado RBAC
## Componentes principales
## Funciones y utilidades principales
## Flujos funcionales end-to-end
## Estado y gestión de datos
## Workflow y aprobaciones
## Auditoría
## Dependencias internas
## Verificación contra código
## Verificación funcional
## Limitaciones actuales
## Cambios de esta iteración
## Impacto técnico de esta iteración
## Compatibilidad
## Preparación para siguientes fases
## Próxima fase
## Arquitectura Producción / Homelab
## Contrato para la siguiente iteración

## 21. Regla final
El Markdown debe permitir que otra persona responda sin abrir el código:
1. ¿Qué funciona hoy?
2. ¿Qué está parcialmente implementado?
3. ¿Qué es solo placeholder?
4. ¿Qué no existe?
5. ¿Qué archivos implementan cada capacidad?
6. ¿Qué funciones/componentes participan?
7. ¿Qué rol puede ejecutar cada acción?
8. ¿Qué se verificó realmente?
9. ¿Qué cambió en esta iteración?
10. ¿Qué debe hacerse después?

Si el documento no permite responder esas diez preguntas con precisión, todavía no está terminado.
