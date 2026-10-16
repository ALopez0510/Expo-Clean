# Workflow: QA, Refactorización y Prevención de Regresiones de Expo

## Objetivo
Validar cambios y refactorizaciones sin convertir supuestos en afirmaciones de funcionamiento. Toda conclusión debe distinguir entre pruebas ejecutadas, inspección estática y capacidades no verificadas.

## Cada vez que se solicite refactorización
1. Lee completamente el módulo objetivo.
2. Busca todos sus consumidores.
3. Identifica entradas, salidas y efectos secundarios.
4. Identifica estado, props o datos que modifica.
5. Evalúa duplicación y responsabilidades mezcladas.
6. Mantén la interfaz pública siempre que sea razonable.
7. Refactoriza de forma incremental.
8. Añade o actualiza pruebas cuando la infraestructura lo permita.
9. Ejecuta las pruebas disponibles.
10. Comprueba regresiones en los consumidores.
11. Documenta exactamente qué fue ejecutado y qué solo fue inspeccionado.

## Regla de evidencia
Usa estas etiquetas:
- `VERIFICADO POR EJECUCIÓN`
- `VERIFICADO POR INSPECCIÓN`
- `NO VERIFICADO`
- `NO APLICA`

Nunca sustituyas una prueba no ejecutada por una afirmación como “todo funciona correctamente”.

## Validaciones mínimas de cálculos
Cuando se modifiquen cálculos:
- caso nominal;
- valores cero;
- decimales;
- valores vacíos;
- valores inválidos;
- `NaN`;
- límites razonables;
- repetición de operación;
- consistencia entre resultado interno y UI.

## Validaciones mínimas de UI
Cuando se modifique un componente:
- render inicial;
- evento principal;
- estado vacío;
- datos faltantes;
- actualización de props/estado;
- interacción repetida;
- errores de consola si se puede ejecutar;
- regresión en el componente padre y consumidores.

## Validaciones RBAC
No marques RBAC como funcional solo por existir roles.

Para cada permiso verifica:
1. rol identificado;
2. regla de permiso;
3. evaluación real;
4. acción bloqueada/permitida;
5. comportamiento observable;
6. caso negativo con otro rol.

## Validaciones Workflow
Para considerar un workflow funcional verifica:
1. estado inicial;
2. transición permitida;
3. transición rechazada cuando corresponde;
4. cambio de estado real;
5. UI actualizada;
6. permisos si aplican;
7. auditoría si existe.

## Cierre
Antes de dar una tarea por validada:
1. enumera pruebas realmente ejecutadas;
2. enumera comprobaciones estáticas;
3. enumera puntos no verificados;
4. no ocultes limitaciones;
5. registra cualquier regresión detectada;
6. asegúrate de que la documentación de `md/` use el mismo nivel de evidencia.
