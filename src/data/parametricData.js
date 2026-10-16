/**
 * MATRICES PARAMÉTRICAS — CleanQuote Pro (Expo Clean Ecuador 2026, Reto 2)
 *
 * Cada parámetro indica su TIPO DE FUENTE para evitar presentar estimaciones como datos oficiales:
 *   - 'oficial'    : tomado textualmente de una fuente oficial (SERCOP, Código del Trabajo, MDT/IESS).
 *   - 'contrato'   : valor de un contrato público adjudicado, reportado por fuente verificable.
 *   - 'derivado'   : cálculo aritmético del equipo a partir de una fuente oficial (se explica la fórmula).
 *   - 'estimacion' : supuesto del equipo, pendiente de validar con empresas del sector.
 */

// ─────────────────────────────────────────────────────────────────────────────
// FUENTES VERIFICABLES (consultadas el 15-oct-2026)
// ─────────────────────────────────────────────────────────────────────────────
export const SOURCES = {
  sbu2026: {
    label: 'SBU 2026 = USD 482 (Ministerio del Trabajo, dic-2025)',
    url: 'https://www.vistazo.com/2025-12-15-salario-basico-usd-482-2026-ecuador-incremento-dolares-IC10565269'
  },
  iess2026: {
    label: 'Aporte patronal IESS 11,15% (+0,5% SECAP +0,5% IECE = 12,15%)',
    url: 'https://www.vistazo.com/actualidad/nacional/2025-12-17-aportes-iess-suben-2026-incremento-sueldo-basico-unificado-usd-482-ED10575274'
  },
  nocturno: {
    label: 'Código del Trabajo Art. 49: jornada nocturna 19h00–06h00, recargo 25%',
    url: 'https://www.eldiario.ec/ecuador/esto-deben-pagarte-por-cumplir-jornada-de-trabajo-nocturna-en-ecuador-segun-el-codigo-del-trabajo-25022026/'
  },
  fichaAreaInterna: {
    label: 'SERCOP Ficha Técnica "Servicio de limpieza de áreas internas de edificaciones" (CPC 853300013), 2023',
    url: 'https://portal.compraspublicas.gob.ec/sercop/wp-content/uploads/2023/03/3_LIMPIEZA-AREA-INTERNA.pdf'
  },
  fichaAltaAfluencia: {
    label: 'SERCOP Ficha Técnica "Limpieza en edificaciones con áreas de alta afluencia de usuarios" (CPC 853300012), 2023',
    url: 'https://portal.compraspublicas.gob.ec/sercop/wp-content/uploads/2023/03/2_ALTA-AFLUENCIA-USUARIO.pdf'
  },
  fichaEducativas: {
    label: 'SERCOP Ficha Técnica "Servicio de limpieza de instituciones educativas" (CPC 853300011), 2023',
    url: 'https://portal.compraspublicas.gob.ec/sercop/wp-content/uploads/2023/03/1_UNIDADES-EDUCATIVAS.pdf'
  },
  fichaAreaExterna: {
    label: 'SERCOP Ficha Técnica "Servicio de limpieza de áreas externas de edificaciones", 2023',
    url: 'https://portal.compraspublicas.gob.ec/sercop/wp-content/uploads/2023/03/4_LIMPIEZA-AREA-EXTERNA.pdf'
  },
  fichaHospitalaria8h: {
    label: 'SERCOP Ficha Técnica "Limpieza hospitalaria 8 horas" (CPC 853300311): USD 2,06/m² por turno de 8h (sin fecha, aprox. 2016-2017)',
    url: 'https://portal.compraspublicas.gob.ec/sercop/wp-content/uploads/2017/01/limpieza_hospitalaria_8_horas1.pdf'
  },
  contratosIESS: {
    label: 'Primicias (29-dic-2025): contratos de limpieza H. Teodoro Maldonado Carbo, HCAM y H. Verdi Cevallos',
    url: 'https://www.primicias.ec/sociedad/contrato-limpieza-hospital-iess-teodoro-maldonado-carbo-costo-quito-portoviejo-guayaquil-112602/'
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PARÁMETROS LABORALES ECUADOR 2026 (USD)
// ─────────────────────────────────────────────────────────────────────────────
export const ECUADOR_LABOR_CONFIG = {
  sbuBase: 482.0, // oficial — SBU 2026
  iessPatronalRate: 0.1215, // oficial — 11,15% IESS + 0,5% SECAP + 0,5% IECE
  decimoTerceroRate: 1 / 12, // oficial — 1 remuneración anual, mensualizada
  decimoCuartoRate: 1 / 12, // oficial — 1 SBU anual, mensualizado
  fondoReservaRate: 0.0833, // oficial — aplica desde el 2º año de servicio (supuesto: contrato plurianual)
  vacacionesRate: 1 / 24, // oficial — 15 días/año = 4,17%
  desahucioRate: 0.0208, // estimación — provisión del 25% por año de servicio (25%/12)
  uniformesEPPBase: 26.0, // estimación — dotación de uniforme y calzado
  seguroCapacitacion: 14.0, // estimación — exámenes ocupacionales y capacitación
  recargoNocturnoRate: 0.25, // oficial — Art. 49 Código del Trabajo (19h00–06h00)
  horasSemanalesLegales: 40, // oficial — jornada máxima ordinaria
  vacationReliefFactor: 365 / (365 - 15), // derivado — reemplazo de vacaciones en servicios de 7 días
  supervisorRatio: 25, // oficial — fichas SERCOP: 1 supervisor por cada 25 auxiliares
  supervisorMinStaff: 5, // oficial — fichas SERCOP: hasta 5 auxiliares, uno de ellos supervisa
  supervisorSalaryMultiplier: 1.25, // estimación — remuneración del supervisor vs auxiliar
  ivaRate: 0.15 // oficial — IVA vigente
};

// ─────────────────────────────────────────────────────────────────────────────
// TIPOLOGÍAS DE INFRAESTRUCTURA
// baseYieldM2PerPost: m² que cubre 1 auxiliar por turno de 8h en las condiciones por defecto
// de la tipología (riesgo, tráfico, protocolo y frecuencia por defecto).
// ─────────────────────────────────────────────────────────────────────────────
export const INFRASTRUCTURE_TYPES = {
  hospital_critical: {
    id: 'hospital_critical',
    name: 'Área Crítica Hospitalaria (Quirófanos / UCI / Aislamiento)',
    category: 'Salud & Bioseguridad',
    iconName: 'Hospital',
    baseYieldM2PerPost: 500,
    yieldSourceType: 'estimacion',
    yieldNote: 'Estimación del equipo: ~70% del rendimiento derivado de la ficha hospitalaria SERCOP (700 m²/auxiliar por turno) por mayor exigencia en áreas críticas.',
    defaultRiskLevel: 5,
    defaultTraffic: 'medium',
    defaultProtocol: 'hospital_grade',
    defaultShift: 'continuous_24_7',
    defaultFrequency: 3,
    secondaryShiftRatio: 1.0, // estimación — áreas críticas mantienen la misma dotación en todos los turnos
    chemicalBaseCostM2: 0.35, // estimación
    eppCostPerFTE: 45.0, // estimación
    reference: {
      kind: 'derivado',
      cpcCode: '853300311',
      priceM2: 6.18,
      label: 'Referencia derivada: ficha SERCOP limpieza hospitalaria USD 2,06/m² por turno de 8h × 3 turnos',
      caveat: 'Ficha sin fecha (aprox. 2016-2017, SBU de esa época). No existe ficha SERCOP específica para áreas críticas 24/7: es una referencia aproximada.',
      sourceKeys: ['fichaHospitalaria8h']
    }
  },
  general_healthcare: {
    id: 'general_healthcare',
    name: 'Hospitalización General & Clínicas (IESS / MSP)',
    category: 'Salud & Bioseguridad',
    iconName: 'Activity',
    baseYieldM2PerPost: 1000,
    yieldSourceType: 'estimacion',
    yieldNote: 'Estimación del equipo calibrada con contratos IESS 2024-2025 (la ficha SERCOP de 8h fija un mínimo de 2 auxiliares hasta 1.400 m²).',
    defaultRiskLevel: 4,
    defaultTraffic: 'high',
    defaultProtocol: 'clinical_intermediate',
    defaultShift: 'continuous_24_7',
    defaultFrequency: 2,
    secondaryShiftRatio: 0.5, // estimación — turnos de tarde/noche con 50% de la dotación diurna
    chemicalBaseCostM2: 0.22,
    eppCostPerFTE: 30.0,
    reference: {
      kind: 'contratos',
      cpcCode: '853300311',
      minPriceM2: 1.84,
      maxPriceM2: 3.03,
      priceM2: 2.58,
      label: 'Contratos adjudicados IESS: HCAM USD 1,84/m² (2025) • Verdi Cevallos USD 2,86/m² (2024) • Teodoro Maldonado Carbo USD 3,03/m² (2025)',
      caveat: 'Contratos de hospitales completos (37.000 a 112.000 m², incluyen áreas no críticas). Promedio simple USD 2,58/m².',
      contracts: [
        { name: 'Hospital Carlos Andrade Marín (Quito)', priceM2: 1.84, areaM2: 112228, date: 'sep-2025' },
        { name: 'Hospital Verdi Cevallos Balda (Portoviejo)', priceM2: 2.86, areaM2: 37587, date: 'jun-2024' },
        { name: 'Hospital Teodoro Maldonado Carbo (Guayaquil)', priceM2: 3.03, areaM2: 60418, date: 'ene-2025' }
      ],
      sourceKeys: ['contratosIESS', 'fichaHospitalaria8h']
    }
  },
  food_court_retail: {
    id: 'food_court_retail',
    name: 'Patio de Comidas & Áreas de Alta Afluencia',
    category: 'Comercial & Alto Tráfico',
    iconName: 'UtensilsCrossed',
    baseYieldM2PerPost: 650,
    yieldSourceType: 'oficial',
    yieldNote: 'Ficha SERCOP alta afluencia de usuarios: 650 m² por auxiliar.',
    defaultRiskLevel: 3,
    defaultTraffic: 'extreme',
    defaultProtocol: 'food_safe',
    defaultShift: 'extended_16h_7d',
    defaultFrequency: 2,
    secondaryShiftRatio: 1.0,
    chemicalBaseCostM2: 0.18,
    eppCostPerFTE: 20.0,
    reference: {
      kind: 'catalogo',
      cpcCode: '853300012',
      priceM2: 2.04,
      label: 'Catálogo SERCOP: limpieza en edificaciones con alta afluencia de usuarios, USD 2,04/m² (jornada 40h/sem)',
      caveat: 'Referencia análoga: la ficha aplica a edificios públicos de atención al usuario en jornada de 40h; un patio de comidas 7 días/16h requiere más personal.',
      sourceKeys: ['fichaAltaAfluencia']
    }
  },
  corporate_office: {
    id: 'corporate_office',
    name: 'Oficinas Administrativas & Edificios Públicos',
    category: 'Corporativo & Administrativo',
    iconName: 'Building2',
    baseYieldM2PerPost: 900,
    yieldSourceType: 'oficial',
    yieldNote: 'Ficha SERCOP áreas internas: 900 m² por auxiliar.',
    defaultRiskLevel: 1,
    defaultTraffic: 'low',
    defaultProtocol: 'standard',
    defaultShift: 'diurno_5d',
    defaultFrequency: 1,
    secondaryShiftRatio: 1.0,
    chemicalBaseCostM2: 0.08,
    eppCostPerFTE: 16.0,
    reference: {
      kind: 'catalogo',
      cpcCode: '853300013',
      priceM2: 1.58,
      label: 'Catálogo SERCOP: limpieza de áreas internas de edificaciones, USD 1,58/m² (sin IVA)',
      caveat: 'No incluye suministros de baño (papel, jabón), que adquiere la entidad. Ficha de 2023: verificar si el precio fue actualizado.',
      sourceKeys: ['fichaAreaInterna']
    }
  },
  industrial_logistics: {
    id: 'industrial_logistics',
    name: 'Plantas Industriales, Bodegas & Áreas Externas',
    category: 'Industrial',
    iconName: 'Factory',
    baseYieldM2PerPost: 2500,
    yieldSourceType: 'oficial',
    yieldNote: 'Ficha SERCOP áreas externas: 2.500 m² por auxiliar (referencia análoga para grandes superficies).',
    defaultRiskLevel: 2,
    defaultTraffic: 'medium',
    defaultProtocol: 'industrial_degreaser',
    defaultShift: 'diurno_6d',
    defaultFrequency: 1,
    secondaryShiftRatio: 1.0,
    chemicalBaseCostM2: 0.1,
    eppCostPerFTE: 26.0,
    reference: {
      kind: 'catalogo',
      cpcCode: '853300013',
      priceM2: 0.64,
      label: 'Catálogo SERCOP: limpieza de áreas externas de edificaciones, USD 0,64/m²',
      caveat: 'Referencia análoga: no existe ficha SERCOP específica para naves industriales.',
      sourceKeys: ['fichaAreaExterna']
    }
  },
  educational_campus: {
    id: 'educational_campus',
    name: 'Centros Educativos & Universidades',
    category: 'Institucional & Educación',
    iconName: 'GraduationCap',
    baseYieldM2PerPost: 1000,
    yieldSourceType: 'oficial',
    yieldNote: 'Ficha SERCOP instituciones educativas: 1.000 m² por auxiliar.',
    defaultRiskLevel: 2,
    defaultTraffic: 'high',
    defaultProtocol: 'standard',
    defaultShift: 'diurno_5d',
    defaultFrequency: 1,
    secondaryShiftRatio: 1.0,
    chemicalBaseCostM2: 0.08,
    eppCostPerFTE: 18.0,
    reference: {
      kind: 'catalogo',
      cpcCode: '853300011',
      priceM2: 1.19,
      label: 'Catálogo SERCOP: limpieza de instituciones educativas, USD 1,19/m² (sin IVA)',
      caveat: 'Ficha de 2023: verificar si el precio fue actualizado.',
      sourceKeys: ['fichaEducativas']
    }
  }
};

// Tabla de referencias construida desde las tipologías (una sola fuente de verdad)
export const REFERENCE_TABLE = Object.values(INFRASTRUCTURE_TYPES).map((t) => ({
  id: t.id,
  sector: t.name,
  cpcCode: t.reference.cpcCode,
  kind: t.reference.kind,
  priceM2: t.reference.priceM2,
  minPriceM2: t.reference.minPriceM2,
  maxPriceM2: t.reference.maxPriceM2,
  yieldM2: t.baseYieldM2PerPost,
  yieldSourceType: t.yieldSourceType,
  label: t.reference.label
}));

export const SOURCE_TYPE_LABELS = {
  oficial: { label: 'Oficial', color: '#059669', bg: '#ecfdf5' },
  contrato: { label: 'Contrato real', color: '#0284c7', bg: '#eff6ff' },
  contratos: { label: 'Contratos reales', color: '#0284c7', bg: '#eff6ff' },
  catalogo: { label: 'Catálogo SERCOP', color: '#059669', bg: '#ecfdf5' },
  derivado: { label: 'Derivado', color: '#7c3aed', bg: '#f5f3ff' },
  estimacion: { label: 'Estimación del equipo', color: '#d97706', bg: '#fffbeb' }
};

// ─────────────────────────────────────────────────────────────────────────────
// FACTORES OPERATIVOS (estimaciones del equipo). Se aplican de forma RELATIVA al valor
// por defecto de cada tipología, para que en condiciones por defecto el rendimiento
// sea exactamente el de la ficha / referencia.
// ─────────────────────────────────────────────────────────────────────────────
export const TRAFFIC_LEVELS = {
  low: { id: 'low', label: 'Bajo (< 25 personas/hora)', factor: 0.95, description: 'Flujo mínimo o restringido. Baja tasa de reensuciamiento.' },
  medium: { id: 'medium', label: 'Medio (25 - 100 personas/hora)', factor: 1.0, description: 'Flujo constante pero ordenado.' },
  high: { id: 'high', label: 'Alto (100 - 300 personas/hora)', factor: 1.12, description: 'Congestión periódica y picos de suciedad.' },
  extreme: { id: 'extreme', label: 'Extremo / Continuo (> 300 personas/hora)', factor: 1.25, description: 'Tránsito masivo ininterrumpido.' }
};

export const SANITARY_RISK_LEVELS = {
  1: { level: 1, label: 'Nivel 1 — Mínimo (Espacios secos generales)', factor: 0.95, description: 'Polvo común y residuos de oficina.', color: '#059669' },
  2: { level: 2, label: 'Nivel 2 — Bajo (Tránsito general institucional)', factor: 1.0, description: 'Contacto de superficies públicas.', color: '#0284c7' },
  3: { level: 3, label: 'Nivel 3 — Medio (Alimentos / Sanitarios)', factor: 1.1, description: 'Residuos orgánicos húmedos y baterías sanitarias.', color: '#d97706' },
  4: { level: 4, label: 'Nivel 4 — Alto (Áreas asistenciales / Laboratorios)', factor: 1.2, description: 'Exposición a fluidos corporales, salas de internación.', color: '#ea580c' },
  5: { level: 5, label: 'Nivel 5 — Crítico (Quirófanos / UCI / Esterilización)', factor: 1.35, description: 'Áreas críticas con desinfección terminal.', color: '#dc2626' }
};

export const DISINFECTION_PROTOCOLS = {
  standard: {
    id: 'standard',
    name: 'Protocolo Estándar (Limpieza general)',
    normative: 'Especificaciones de fichas SERCOP (insumos con registro sanitario o sello INEN)',
    chemicalProduct: 'Detergente neutro biodegradable + desinfectante de superficies',
    contactTimeMinutes: 2,
    costMultiplier: 1.0,
    yieldFactor: 1.0,
    description: 'Mantenimiento diario de superficies.'
  },
  food_safe: {
    id: 'food_safe',
    name: 'Protocolo Grado Alimentario (BPM)',
    normative: 'Buenas Prácticas de Manufactura (ARCSA)',
    chemicalProduct: 'Desengrasante alcalino + desinfectante apto para contacto con alimentos',
    contactTimeMinutes: 5,
    costMultiplier: 1.15,
    yieldFactor: 0.95,
    description: 'Desengrase y desinfección de superficies en contacto con alimentos.'
  },
  clinical_intermediate: {
    id: 'clinical_intermediate',
    name: 'Desinfección Clínica Nivel Intermedio',
    normative: 'Normativa de bioseguridad del MSP para establecimientos de salud',
    chemicalProduct: 'Hipoclorito de sodio en dilución indicada + amonio cuaternario',
    contactTimeMinutes: 8,
    costMultiplier: 1.25,
    yieldFactor: 0.9,
    description: 'Áreas clínicas generales.'
  },
  hospital_grade: {
    id: 'hospital_grade',
    name: 'Desinfección Terminal de Alto Nivel (áreas críticas)',
    normative: 'Normativa de bioseguridad del MSP para áreas críticas',
    chemicalProduct: 'Peróxido de hidrógeno acelerado + amonio cuaternario grado hospitalario',
    contactTimeMinutes: 12,
    costMultiplier: 1.4,
    yieldFactor: 0.85,
    description: 'Desinfección terminal con tiempo de contacto controlado.'
  },
  industrial_degreaser: {
    id: 'industrial_degreaser',
    name: 'Protocolo Industrial Pesado',
    normative: 'Normas de seguridad industrial y manejo de químicos',
    chemicalProduct: 'Desengrasante industrial emulsionable',
    contactTimeMinutes: 6,
    costMultiplier: 1.1,
    yieldFactor: 0.95,
    description: 'Remoción de grasas, aceites e hidrocarburos.'
  }
};

/**
 * Regímenes de turnos. Cada turno dura 8h; nocturnalHours = horas dentro de 19h00–06h00 (Art. 49).
 * El personal (FTE) se calcula por horas de cobertura semanales ÷ 40h legales.
 */
export const SHIFT_REGIMES = {
  diurno_5d: {
    id: 'diurno_5d',
    label: 'Diurno — Lunes a Viernes (1 turno, 40h/sem)',
    daysPerWeek: 5,
    shifts: [{ name: 'Diurno 07h00–15h00', hours: 8, nocturnalHours: 0 }],
    description: 'Jornada ordinaria de oficina o edificio público.'
  },
  diurno_6d: {
    id: 'diurno_6d',
    label: 'Diurno — Lunes a Sábado (1 turno, cobertura 48h/sem)',
    daysPerWeek: 6,
    shifts: [{ name: 'Diurno 07h00–15h00', hours: 8, nocturnalHours: 0 }],
    description: 'Cobertura de 6 días con personal de 40h/sem (requiere 1,2 FTE por puesto).'
  },
  extended_16h_7d: {
    id: 'extended_16h_7d',
    label: 'Extendido — 2 turnos, 7 días (06h00–22h00)',
    daysPerWeek: 7,
    shifts: [
      { name: 'Turno 1 06h00–14h00', hours: 8, nocturnalHours: 0 },
      { name: 'Turno 2 14h00–22h00', hours: 8, nocturnalHours: 3 }
    ],
    description: 'Centros comerciales, supermercados y terminales.'
  },
  continuous_24_7: {
    id: 'continuous_24_7',
    label: 'Continuo — 3 turnos rotativos 24/7',
    daysPerWeek: 7,
    shifts: [
      { name: 'Turno 1 06h00–14h00', hours: 8, nocturnalHours: 0 },
      { name: 'Turno 2 14h00–22h00', hours: 8, nocturnalHours: 3 },
      { name: 'Turno 3 22h00–06h00', hours: 8, nocturnalHours: 8 }
    ],
    description: 'Áreas hospitalarias y operaciones continuas.'
  }
};

export const MACHINERY_OPTIONS = {
  manual: {
    id: 'manual',
    label: 'Operación Manual (sin maquinaria)',
    yieldMultiplier: 0.9,
    monthlyCostPerM2: 0.02,
    description: 'Carros doble balde y mopas de microfibra.'
  },
  semi_mechanized: {
    id: 'semi_mechanized',
    label: 'Estándar SERCOP (pulidora + aspiradora industrial)',
    yieldMultiplier: 1.0,
    monthlyCostPerM2: 0.04,
    description: 'Maquinaria mínima exigida por las fichas SERCOP. Es la línea base del rendimiento.'
  },
  heavy_mechanized: {
    id: 'heavy_mechanized',
    label: 'Alta Mecanización (fregadoras automáticas)',
    yieldMultiplier: 1.15,
    monthlyCostPerM2: 0.07,
    description: 'Fregado automático con secado inmediato en superficies amplias.'
  }
};

/**
 * Supuestos visibles en la app (pestaña "Supuestos y fuentes").
 */
export const ASSUMPTIONS = [
  { param: 'Salario Básico Unificado 2026', value: 'USD 482,00', type: 'oficial', source: 'sbu2026' },
  { param: 'Aporte patronal IESS', value: '12,15% (11,15% + 0,5% SECAP + 0,5% IECE)', type: 'oficial', source: 'iess2026' },
  { param: 'Décimo tercero / décimo cuarto', value: '1/12 de la remuneración / 1 SBU anual ÷ 12', type: 'oficial', source: null },
  { param: 'Fondos de reserva', value: '8,33% (aplica desde el 2º año; se asume contrato plurianual)', type: 'oficial', source: null },
  { param: 'Vacaciones', value: '15 días/año (4,17%)', type: 'oficial', source: null },
  { param: 'Recargo nocturno', value: '25% sobre horas entre 19h00 y 06h00', type: 'oficial', source: 'nocturno' },
  { param: 'Jornada máxima', value: '40 h/semana', type: 'oficial', source: null },
  { param: 'Rendimientos oficinas / alta afluencia / educativas / externas', value: '900 / 650 / 1.000 / 2.500 m² por auxiliar', type: 'oficial', source: 'fichaAreaInterna' },
  { param: 'Regla de redondeo de personal', value: 'Fracción < 0,50 se descarta; 0,50–0,80 = medio tiempo; > 0,80 = tiempo completo', type: 'oficial', source: 'fichaAreaInterna' },
  { param: 'Supervisión', value: '1 supervisor cada 25 auxiliares; hasta 5 auxiliares supervisa uno de ellos', type: 'oficial', source: 'fichaAreaInterna' },
  { param: 'Rendimiento hospitalización general', value: '1.000 m² por auxiliar/turno', type: 'estimacion', source: 'contratosIESS' },
  { param: 'Rendimiento áreas críticas', value: '500 m² por auxiliar/turno', type: 'estimacion', source: 'fichaHospitalaria8h' },
  { param: 'Dotación en turnos 2 y 3 (hospitalización general)', value: '50% del turno diurno', type: 'estimacion', source: null },
  { param: 'Reemplazo de vacaciones (servicios 7 días)', value: '× 365/350 = 1,043', type: 'derivado', source: null },
  { param: 'Factores de riesgo, tráfico, protocolo, mecanización y frecuencia', value: 'Ver selector (relativos a la tipología)', type: 'estimacion', source: null },
  { param: 'Costos de insumos químicos, EPP, uniformes y maquinaria', value: 'Por tipología (USD/m² y USD/FTE)', type: 'estimacion', source: null },
  { param: 'Remuneración del supervisor', value: '1,25 × costo del auxiliar', type: 'estimacion', source: null },
  { param: 'Recargo 100% fines de semana y feriados', value: 'No incluido (se asumen descansos rotativos); validar con asesoría laboral', type: 'estimacion', source: null }
];

/**
 * Escenarios de demostración. Son casos HIPOTÉTICOS con parámetros representativos;
 * no corresponden a cotizaciones reales de las instituciones mencionadas en las referencias.
 */
export const REAL_PRESETS = [
  {
    id: 'critical_block',
    name: 'Escenario A — Bloque quirúrgico + UCI 24/7 (650 m²)',
    subtitle: 'Escenario hipotético de área crítica hospitalaria',
    infrastructureType: 'hospital_critical',
    areaM2: 650,
    sanitaryRiskLevel: 5,
    trafficLevel: 'medium',
    disinfectionProtocol: 'hospital_grade',
    shiftRegime: 'continuous_24_7',
    machineryOption: 'semi_mechanized',
    dailyFrequency: 3,
    targetMargin: 16,
    indirectRate: 9
  },
  {
    id: 'general_hospital',
    name: 'Escenario B — Hospitalización general 24/7 (2.800 m²)',
    subtitle: 'Escenario hipotético; se compara con contratos IESS reales',
    infrastructureType: 'general_healthcare',
    areaM2: 2800,
    sanitaryRiskLevel: 4,
    trafficLevel: 'high',
    disinfectionProtocol: 'clinical_intermediate',
    shiftRegime: 'continuous_24_7',
    machineryOption: 'semi_mechanized',
    dailyFrequency: 2,
    targetMargin: 16,
    indirectRate: 8
  },
  {
    id: 'food_court',
    name: 'Escenario C — Patio de comidas de centro comercial (1.850 m²)',
    subtitle: 'Escenario hipotético de alto tráfico, 2 turnos 7 días',
    infrastructureType: 'food_court_retail',
    areaM2: 1850,
    sanitaryRiskLevel: 3,
    trafficLevel: 'extreme',
    disinfectionProtocol: 'food_safe',
    shiftRegime: 'extended_16h_7d',
    machineryOption: 'heavy_mechanized',
    dailyFrequency: 2,
    targetMargin: 18,
    indirectRate: 8
  },
  {
    id: 'public_office',
    name: 'Escenario D — Edificio administrativo público (3.200 m²)',
    subtitle: 'Escenario hipotético comparable con el catálogo SERCOP de áreas internas',
    infrastructureType: 'corporate_office',
    areaM2: 3200,
    sanitaryRiskLevel: 1,
    trafficLevel: 'low',
    disinfectionProtocol: 'standard',
    shiftRegime: 'diurno_5d',
    machineryOption: 'semi_mechanized',
    dailyFrequency: 1,
    targetMargin: 18,
    indirectRate: 9
  },
  {
    id: 'industrial',
    name: 'Escenario E — Bodega logística / planta industrial (4.500 m²)',
    subtitle: 'Escenario hipotético de gran superficie mecanizada',
    infrastructureType: 'industrial_logistics',
    areaM2: 4500,
    sanitaryRiskLevel: 2,
    trafficLevel: 'medium',
    disinfectionProtocol: 'industrial_degreaser',
    shiftRegime: 'diurno_6d',
    machineryOption: 'heavy_mechanized',
    dailyFrequency: 1,
    targetMargin: 15,
    indirectRate: 8
  },
  {
    id: 'campus',
    name: 'Escenario F — Campus universitario (2.400 m²)',
    subtitle: 'Escenario hipotético comparable con el catálogo SERCOP de instituciones educativas',
    infrastructureType: 'educational_campus',
    areaM2: 2400,
    sanitaryRiskLevel: 2,
    trafficLevel: 'high',
    disinfectionProtocol: 'standard',
    shiftRegime: 'diurno_5d',
    machineryOption: 'semi_mechanized',
    dailyFrequency: 1,
    targetMargin: 16,
    indirectRate: 8
  }
];
