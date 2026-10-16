/**
 * Resultado PREGRABADO para el modo demo. Corresponde al pliego de ejemplo FICTICIO
 * public/demo/pliego_ejemplo_limpieza_hospital.pdf (mismas páginas y citas).
 * Se usa cuando no hay clave de API, no hay internet o se alcanza el límite gratuito.
 */
export const DEMO_FILE_NAME = 'pliego_ejemplo_limpieza_hospital.pdf';
export const DEMO_FILE_URL = '/demo/pliego_ejemplo_limpieza_hospital.pdf';

export const DEMO_PLIEGO_RESULT = {
  es_pliego_de_limpieza: true,
  entidad: 'Hospital General Monteverde Alto (entidad ficticia)',
  objeto: 'Servicio de limpieza, desinfección y manejo interno de desechos para las instalaciones del hospital',
  codigo_proceso: 'SIE-HGMA-2026-014 (ficticio)',
  area_total_m2: { valor: 6850, pagina: 2, cita: 'con un área total a intervenir de 6.850 m²' },
  tipologia: { valor: 'general_healthcare', pagina: 2, cita: 'Hospitalización: clínica, cirugía, pediatría y gineco-obstetricia ... Semicrítica 3.200' },
  regimen_turnos: { valor: 'continuous_24_7', pagina: 3, cita: 'continua las veinticuatro (24) horas del día, de lunes a domingo, incluidos feriados, mediante tres (3) turnos rotativos' },
  horario_texto: { valor: 'Continuo 24 h, lunes a domingo y feriados; turnos 06h00–14h00, 14h00–22h00 y 22h00–06h00', pagina: 3, cita: 'turno 1 de 06h00 a 14h00, turno 2 de 14h00 a 22h00 y turno 3 de 22h00 a 06h00' },
  frecuencia_diaria: { valor: 2, pagina: 3, cita: 'Hospitalización — Dos (2) veces al día' },
  riesgo_sanitario: { valor: 4, pagina: 2, cita: 'Hospitalización ... Semicrítica 3.200' },
  trafico: { valor: 'high', pagina: 2, cita: 'registran un flujo alto de pacientes y visitantes, especialmente entre las 07h00 y las 19h00' },
  protocolo: { valor: 'clinical_intermediate', pagina: 3, cita: 'En áreas semicríticas utilizará desinfectantes de nivel intermedio' },
  maquinaria: { valor: 'heavy_mechanized', pagina: 5, cita: 'Fregadora automática de pisos (operador a pie) — 2' },
  maquinaria_exigida_texto: { valor: '2 fregadoras automáticas, 2 pulidoras industriales, 3 aspiradoras industriales, 12 carros de doble balde, 4 carros de desechos', pagina: 5, cita: 'Fregadora automática de pisos (operador a pie) 2; Pulidora industrial de pisos 2' },
  personal_minimo_auxiliares: { valor: 22, pagina: 4, cita: 'Auxiliar de limpieza — 22' },
  supervisores_minimos: { valor: 2, pagina: 4, cita: 'Supervisor de servicio — 2' },
  presupuesto_referencial_total: { valor: 298500, pagina: 7, cita: 'USD 298.500,00 (doscientos noventa y ocho mil quinientos dólares ...), sin incluir el IVA' },
  presupuesto_incluye_iva: { valor: false, pagina: 7, cita: 'sin incluir el IVA' },
  plazo_meses: { valor: 12, pagina: 7, cita: 'El plazo de ejecución es de doce (12) meses' },
  insumos_a_cargo_entidad: { valor: 'Papel higiénico, toallas de papel, jabón líquido y gel antiséptico', pagina: 5, cita: 'El papel higiénico, las toallas de papel para manos, el jabón líquido y el gel antiséptico serán adquiridos por el Hospital' },
  zonas: [
    { nombre: 'Hospitalización (clínica, cirugía, pediatría, gineco-obstetricia)', area_m2: 3200, tipologia: 'general_healthcare', pagina: 2 },
    { nombre: 'Centro quirúrgico, UCI, neonatología y esterilización', area_m2: 780, tipologia: 'hospital_critical', pagina: 2 },
    { nombre: 'Emergencia y consulta externa', area_m2: 1450, tipologia: 'general_healthcare', pagina: 2 },
    { nombre: 'Laboratorio clínico e imagenología', area_m2: 420, tipologia: 'general_healthcare', pagina: 2 },
    { nombre: 'Áreas administrativas, auditorio y vestidores', area_m2: 1000, tipologia: 'corporate_office', pagina: 2 }
  ],
  multas: [
    { descripcion: '1x1.000 del valor mensual por cada día de retraso o incumplimiento', pagina: 8 },
    { descripcion: 'Auxiliar no asignado o no reemplazado en 2 horas: descuento proporcional + 1x1.000 del valor mensual', pagina: 8 },
    { descripcion: 'Incumplimiento de protocolos de bioseguridad: 2x1.000 del valor mensual por ocurrencia', pagina: 8 },
    { descripcion: 'Falta de equipo de protección personal: 1x1.000 del valor mensual por trabajador', pagina: 8 }
  ],
  advertencias: [
    'El pliego incluye 5 zonas con exigencias distintas (crítica, semicrítica y no crítica); se usó la tipología predominante (hospitalización, 3.200 m²).',
    'El área crítica (780 m²) exige 3 desinfecciones diarias y desinfección terminal por procedimiento: revisar si conviene cotizarla por separado.',
    'El pliego fija una distribución de 10, 7 y 5 auxiliares por turno; compararla con los puestos calculados por el modelo.'
  ]
};
