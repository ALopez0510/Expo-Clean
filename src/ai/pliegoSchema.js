/**
 * ESQUEMA E INSTRUCCIONES PARA LA EXTRACCIÓN DE PLIEGOS CON IA
 * Archivo compartido por el servidor local (vite.config.js → server/pliegoApi.js) y la interfaz.
 * No importa React: se puede usar en Node y en el navegador.
 */
import { INFRASTRUCTURE_TYPES, SHIFT_REGIMES, TRAFFIC_LEVELS, DISINFECTION_PROTOCOLS, MACHINERY_OPTIONS } from '../data/parametricData.js';

export const ENUMS = {
  tipologia: Object.keys(INFRASTRUCTURE_TYPES),
  regimen_turnos: Object.keys(SHIFT_REGIMES),
  trafico: Object.keys(TRAFFIC_LEVELS),
  protocolo: Object.keys(DISINFECTION_PROTOCOLS),
  maquinaria: Object.keys(MACHINERY_OPTIONS)
};

// Esquema en el formato OpenAPI que acepta generationConfig.responseSchema de Gemini
const S = (type, extra = {}) => ({ type, ...extra });
const evidence = (valueSchema) =>
  S('OBJECT', {
    properties: {
      valor: { ...valueSchema, nullable: true },
      pagina: S('INTEGER', { nullable: true, description: 'Número de página del PDF (empezando en 1) donde está el dato' }),
      cita: S('STRING', { nullable: true, description: 'Cita textual breve (máx. 200 caracteres) del pliego que respalda el valor' })
    },
    required: ['valor', 'pagina', 'cita']
  });

export const RESPONSE_SCHEMA = S('OBJECT', {
  properties: {
    es_pliego_de_limpieza: S('BOOLEAN', { description: 'true si el documento es un pliego, TDR o especificación de un servicio de limpieza' }),
    entidad: S('STRING', { nullable: true }),
    objeto: S('STRING', { nullable: true, description: 'Objeto de la contratación, resumido' }),
    codigo_proceso: S('STRING', { nullable: true }),
    area_total_m2: evidence(S('NUMBER')),
    tipologia: evidence(S('STRING', { enum: ENUMS.tipologia })),
    regimen_turnos: evidence(S('STRING', { enum: ENUMS.regimen_turnos })),
    horario_texto: evidence(S('STRING')),
    frecuencia_diaria: evidence(S('INTEGER', { description: 'Pasadas de limpieza/desinfección por día en la zona predominante' })),
    riesgo_sanitario: evidence(S('INTEGER', { description: 'Nivel 1 a 5' })),
    trafico: evidence(S('STRING', { enum: ENUMS.trafico })),
    protocolo: evidence(S('STRING', { enum: ENUMS.protocolo })),
    maquinaria: evidence(S('STRING', { enum: ENUMS.maquinaria })),
    maquinaria_exigida_texto: evidence(S('STRING')),
    personal_minimo_auxiliares: evidence(S('NUMBER')),
    supervisores_minimos: evidence(S('NUMBER')),
    presupuesto_referencial_total: evidence(S('NUMBER', { description: 'En USD, tal como aparece en el documento' })),
    presupuesto_incluye_iva: evidence(S('BOOLEAN')),
    plazo_meses: evidence(S('NUMBER')),
    insumos_a_cargo_entidad: evidence(S('STRING')),
    zonas: S('ARRAY', {
      items: S('OBJECT', {
        properties: {
          nombre: S('STRING'),
          area_m2: S('NUMBER', { nullable: true }),
          tipologia: S('STRING', { enum: ENUMS.tipologia, nullable: true }),
          pagina: S('INTEGER', { nullable: true })
        },
        required: ['nombre']
      })
    }),
    multas: S('ARRAY', {
      items: S('OBJECT', { properties: { descripcion: S('STRING'), pagina: S('INTEGER', { nullable: true }) }, required: ['descripcion'] })
    }),
    advertencias: S('ARRAY', { items: S('STRING'), description: 'Datos faltantes, contradicciones o supuestos que el analista debe revisar' })
  },
  required: ['es_pliego_de_limpieza', 'area_total_m2', 'tipologia', 'regimen_turnos', 'personal_minimo_auxiliares', 'presupuesto_referencial_total', 'plazo_meses', 'zonas', 'advertencias']
});

const list = (obj, fmt) => Object.values(obj).map(fmt).join('\n');

export function buildPrompt() {
  return `Eres un analista de licitaciones de servicios de limpieza en Ecuador. Lee el documento PDF adjunto (pliego, términos de referencia o especificaciones técnicas) y extrae los datos necesarios para cotizar el servicio.

REGLAS OBLIGATORIAS
1. No inventes datos. Si un dato no aparece en el documento, usa "valor": null, "pagina": null y "cita": null.
2. Para cada dato indica la página del PDF (contando desde 1) y una cita textual breve copiada del documento.
3. Los valores clasificados (tipología, turnos, tráfico, protocolo, maquinaria, riesgo) son tu interpretación: elige la opción más cercana de las listas y explica en "advertencias" si hubo dudas.
4. Si el documento tiene varias zonas con distinta exigencia, lista todas en "zonas" y en "tipologia" elige la que tenga MAYOR área.
5. "frecuencia_diaria" corresponde a la zona predominante (la de mayor área).
6. "personal_minimo_auxiliares" es solo el número mínimo de auxiliares/operarios exigido; los supervisores van aparte.
7. "presupuesto_referencial_total" es el valor total del contrato en USD tal como aparece; indica si incluye IVA.
8. Si el documento NO es de un servicio de limpieza, responde "es_pliego_de_limpieza": false y deja los demás valores en null.
9. Registra en "advertencias" cualquier contradicción, dato faltante o supuesto importante.

OPCIONES DE TIPOLOGÍA
${list(INFRASTRUCTURE_TYPES, (t) => `- ${t.id}: ${t.name}`)}

OPCIONES DE RÉGIMEN DE TURNOS
${list(SHIFT_REGIMES, (s) => `- ${s.id}: ${s.label}`)}

OPCIONES DE TRÁFICO PEATONAL
${list(TRAFFIC_LEVELS, (t) => `- ${t.id}: ${t.label}`)}

OPCIONES DE PROTOCOLO DE DESINFECCIÓN
${list(DISINFECTION_PROTOCOLS, (p) => `- ${p.id}: ${p.name}`)}

OPCIONES DE MAQUINARIA
${list(MACHINERY_OPTIONS, (m) => `- ${m.id}: ${m.label}`)}

NIVELES DE RIESGO SANITARIO
1 = espacios secos generales; 2 = tránsito institucional; 3 = alimentos o sanitarios; 4 = áreas asistenciales/hospitalización/laboratorios; 5 = quirófanos, UCI, esterilización.

Responde únicamente con el JSON del esquema indicado.`;
}

/** Campos que se muestran en la pantalla de revisión y a qué parámetro del formulario se aplican. */
export const REVIEW_FIELDS = [
  { key: 'area_total_m2', label: 'Área total (m²)', formKey: 'areaM2', kind: 'number' },
  { key: 'tipologia', label: 'Tipología', formKey: 'infrastructureTypeId', kind: 'enum', options: 'tipologia' },
  { key: 'regimen_turnos', label: 'Régimen de turnos', formKey: 'shiftRegimeId', kind: 'enum', options: 'regimen_turnos' },
  { key: 'frecuencia_diaria', label: 'Frecuencia (pasadas/día)', formKey: 'dailyFrequency', kind: 'number' },
  { key: 'riesgo_sanitario', label: 'Riesgo sanitario (1-5)', formKey: 'sanitaryRiskLevelNumber', kind: 'number' },
  { key: 'trafico', label: 'Tráfico peatonal', formKey: 'trafficLevelId', kind: 'enum', options: 'trafico' },
  { key: 'protocolo', label: 'Protocolo de desinfección', formKey: 'disinfectionProtocolId', kind: 'enum', options: 'protocolo' },
  { key: 'maquinaria', label: 'Maquinaria', formKey: 'machineryOptionId', kind: 'enum', options: 'maquinaria' }
];

export const REQUIREMENT_FIELDS = [
  { key: 'personal_minimo_auxiliares', label: 'Personal mínimo exigido (auxiliares)', kind: 'number' },
  { key: 'supervisores_minimos', label: 'Supervisores exigidos', kind: 'number' },
  { key: 'presupuesto_referencial_total', label: 'Presupuesto referencial total (USD)', kind: 'number' },
  { key: 'presupuesto_incluye_iva', label: '¿El presupuesto incluye IVA?', kind: 'boolean' },
  { key: 'plazo_meses', label: 'Plazo (meses)', kind: 'number' },
  { key: 'horario_texto', label: 'Horario de servicio', kind: 'text' },
  { key: 'maquinaria_exigida_texto', label: 'Maquinaria exigida', kind: 'text' },
  { key: 'insumos_a_cargo_entidad', label: 'Insumos a cargo de la entidad', kind: 'text' }
];
