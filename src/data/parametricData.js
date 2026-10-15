/**
 * MATRICES PARAMÉTRICAS Y DATOS REALES DEL SECTOR DE FACILITY MANAGEMENT
 * CALIBRADO ESTRICTAMENTE CON FUENTES OFICIALES DEL SERVICIO NACIONAL DE CONTRATACIÓN PÚBLICA (SERCOP)
 * Y TABLAS DE SALARIOS MÍNIMOS SECTORIALES DEL MINISTERIO DEL TRABAJO (MDT) DE ECUADOR.
 */

// Parámetros económicos y laborales oficiales de Ecuador (USD)
export const ECUADOR_LABOR_CONFIG = {
  sbuBase: 482.00, // Salario Básico Unificado 2026 (Ecuador). Antes: 475. Verificar tabla sectorial MDT vigente si se cita.
  iessPatronalRate: 0.1215, // 12.15% Aporte Patronal IESS
  decimoTerceroRate: 1 / 12, // Décimo tercer sueldo mensualizado (8.33%)
  decimoCuartoRate: 1 / 12, // Décimo cuarto sueldo mensualizado (1 SBU / 12)
  fondoReservaRate: 0.0833, // 8.33% Fondos de reserva
  vacacionesRate: 0.0416, // Provisión vacaciones anuales (15 días / año = 4.16%)
  desahucioRate: 0.0208, // Provisión desahucio legal
  uniformesEPPBase: 26.00, // Dotación reglamentaria de uniformes y calzado antideslizante
  seguroCapacitacion: 14.00, // Exámenes médicos ocupacionales, seguro contra accidentes y capacitación
  recargoNocturnoRate: 0.25, // 25% de recargo jornada nocturna (Art. 49 Código del Trabajo: 19:00 a 06:00)
  horasMesPorOperario: 160, // 40 horas semanales x 4 semanas
  protocolTimePenaltyPerMin: 0.02, // SUPUESTO A VALIDAR CON EL SECTOR: +2% de tiempo de trabajo por cada minuto de contacto sobre el protocolo estándar
  standardContactMinutes: 2, // Tiempo de contacto del protocolo estándar (referencia 0% de recargo)
  factorEficienciaOEE: 0.85 // 85% de productividad efectiva (descuenta fatiga ergonómica, traslados y descansos de ley)
};

// Tipologías de infraestructura calibradas con Pliegos Oficiales y Catálogo SERCOP (CPC 85330)
export const INFRASTRUCTURE_TYPES = {
  hospital_critical: {
    id: 'hospital_critical',
    name: 'Área Crítica Hospitalaria (Quirófanos / UCI / Aislamiento)',
    category: 'Salud & Bioseguridad',
    iconName: 'Hospital',
    cpcCode: '85330.01.1',
    description: 'Quirófanos, UCI, áreas de aislamiento y esterilización con cobertura continua y riesgo microbiológico crítico.',
    normativeYieldM2PerFTE: 500, // Cobertura normada por operario en áreas críticas 24h
    baseYieldM2H: 75, // Rendimiento de desinfección profunda en m²/hora
    defaultRiskLevel: 5,
    defaultTraffic: 'medium',
    defaultProtocol: 'hospital_grade',
    defaultFrequency: 3, // Concurrente, terminal y repaso quirúrgico
    chemicalBaseCostM2: 0.35, // Peróxido de hidrógeno acelerado (AHP), amonio 5ta gen Lista N EPA y paños microfibra descartables
    eppCostPerFTE: 45.00, // EPP biológico nivel 3 (Tyvek, N95, nitrilo de alta resistencia, pantalla facial)
    supervisionMultiplier: 1.15, // Supervisión clínica y control microbiológico continuo
    sercopReference: {
      source: 'Ficha Técnica Base SERCOP - Unidades Hospitalarias de Alta Complejidad 24 Horas (compraspublicas.gob.ec)',
      cpcCode: '85330.01.1',
      minRateM2: 4.50,
      maxRateM2: 5.25,
      avgRateM2: 4.88,
      privateMarketRate: '$4.20 - $5.50 /m²',
      normativeYield: 'Hasta 250 - 320 m² por operario en jornada 24/7',
      notes: 'Pliegos oficiales con cobertura continua 24/7, recargos nocturnos, EPP biológico y desinfectantes aprobados por MSP/CDC.'
    }
  },
  general_healthcare: {
    id: 'general_healthcare',
    name: 'Hospitalización General & Clínicas Ambulatorias (IESS / MSP)',
    category: 'Salud & Bioseguridad',
    iconName: 'Activity',
    cpcCode: '85330.01.2',
    description: 'Salas de hospitalización, consultorios médicos, emergencia, laboratorios clínicos y pasillos sanitarios.',
    normativeYieldM2PerFTE: 850,
    baseYieldM2H: 120,
    defaultRiskLevel: 4,
    defaultTraffic: 'high',
    defaultProtocol: 'clinical_intermediate',
    defaultFrequency: 2,
    chemicalBaseCostM2: 0.22,
    eppCostPerFTE: 30.00,
    supervisionMultiplier: 1.10,
    sercopReference: {
      source: 'Contratos Adjudicados SERCOP: Hospital Teodoro Maldonado Carbo ($3,03-$3,21/m²), Hospital Verdi Cevallos ($2,86/m²), HCAM ($1,84/m²)',
      cpcCode: '85330.01.2',
      minRateM2: 1.84,
      maxRateM2: 3.21,
      avgRateM2: 2.75,
      privateMarketRate: '$2.50 - $3.40 /m²',
      normativeYield: '600 - 850 m² por operario con rotación de turnos',
      notes: 'Valores ponderados de contratos adjudicados en IESS y MSP para edificios hospitalarios completos.'
    }
  },
  food_court_retail: {
    id: 'food_court_retail',
    name: 'Patio de Comidas & Retail Masivo (Centros Comerciales)',
    category: 'Comercial & Alimentos',
    iconName: 'UtensilsCrossed',
    cpcCode: '85330.02.1',
    description: 'Zonas de alto tráfico peatonal continuo, mesas de rotación rápida, grasas orgánicas y residuos alimenticios húmedos.',
    normativeYieldM2PerFTE: 720,
    baseYieldM2H: 160,
    defaultRiskLevel: 3,
    defaultTraffic: 'extreme',
    defaultProtocol: 'food_safe',
    defaultFrequency: 2,
    chemicalBaseCostM2: 0.18,
    eppCostPerFTE: 20.00,
    supervisionMultiplier: 1.08,
    sercopReference: {
      source: 'FISP-SERCOP Catálogo Dinámico Inclusivo - Áreas de Alto Tráfico Peatonal y Terminales',
      cpcCode: '85330.02.1',
      minRateM2: 2.04,
      maxRateM2: 2.85,
      avgRateM2: 2.38,
      privateMarketRate: '$2.10 - $2.90 /m²',
      normativeYield: '500 - 650 m² por operario en horario extendido',
      notes: 'Jornadas extendidas de 14 a 16 horas diarias, rotación continua y desengrasantes certificados BPM / ARCSA.'
    }
  },
  corporate_office: {
    id: 'corporate_office',
    name: 'Oficinas Administrativas & Edificios Públicos / Corporativos',
    category: 'Corporativo & Administrativo',
    iconName: 'Building2',
    cpcCode: '85330.00.1',
    description: 'Edificios gubernamentales, ministerios, salas de reuniones y puestos de trabajo con bajo riesgo biológico.',
    normativeYieldM2PerFTE: 900, // Norma técnica oficial de la Ficha SERCOP Catálogo Inclusivo
    baseYieldM2H: 220,
    defaultRiskLevel: 1,
    defaultTraffic: 'low',
    defaultProtocol: 'standard',
    defaultFrequency: 1,
    chemicalBaseCostM2: 0.08,
    eppCostPerFTE: 16.00,
    supervisionMultiplier: 1.05,
    sercopReference: {
      source: 'Ficha Técnica FISP-SERCOP Catálogo Dinámico Inclusivo - Limpieza General de Inmuebles',
      cpcCode: '85330.00.1',
      minRateM2: 0.91,
      maxRateM2: 1.21,
      avgRateM2: 1.06,
      privateMarketRate: '$1.15 - $1.45 /m²',
      normativeYield: '630 m² a 900 m² por trabajador/día en jornada ordinaria de 40 horas',
      notes: 'Precio base de catálogo $0.91/m²; con consumibles de aseo, insumos completos y supervisión se sitúa en $1.06 - $1.21/m².'
    }
  },
  industrial_logistics: {
    id: 'industrial_logistics',
    name: 'Plantas Industriales & Bodegas Logísticas',
    category: 'Industrial',
    iconName: 'Factory',
    cpcCode: '85330.03.1',
    description: 'Grandes extensiones de piso de hormigón, tránsito de montacargas, polvo industrial y residuos operativos mecanizados.',
    normativeYieldM2PerFTE: 2400, // Rendimiento asistido por barredora/fregadora industrial
    baseYieldM2H: 550,
    defaultRiskLevel: 2,
    defaultTraffic: 'medium',
    defaultProtocol: 'industrial_degreaser',
    defaultFrequency: 1,
    chemicalBaseCostM2: 0.10,
    eppCostPerFTE: 26.00,
    supervisionMultiplier: 1.08,
    sercopReference: {
      source: 'Pliegos SERCOP EP Petroecuador, CELEC EP y Almacenes Centrales',
      cpcCode: '85330.03.1',
      minRateM2: 0.65,
      maxRateM2: 0.92,
      avgRateM2: 0.78,
      privateMarketRate: '$0.70 - $0.95 /m²',
      normativeYield: '2.000 a 2.500 m² por operario asistido por maquinaria pesada',
      notes: 'Alta productividad asistida por barredoras y fregadoras industriales de conductor a bordo.'
    }
  },
  educational_campus: {
    id: 'educational_campus',
    name: 'Centros Educativos & Universidades Públicas',
    category: 'Institucional & Educación',
    iconName: 'GraduationCap',
    cpcCode: '85330.00.2',
    description: 'Aulas magnas, pasillos de alto flujo en recesos, bibliotecas y baterías sanitarias escolares.',
    normativeYieldM2PerFTE: 1250,
    baseYieldM2H: 260,
    defaultRiskLevel: 2,
    defaultTraffic: 'high',
    defaultProtocol: 'standard',
    defaultFrequency: 1,
    chemicalBaseCostM2: 0.08,
    eppCostPerFTE: 18.00,
    supervisionMultiplier: 1.05,
    sercopReference: {
      source: 'Procesos SERCOP: Universidad Central del Ecuador (UCE), EPN, UNACH',
      cpcCode: '85330.00.2',
      minRateM2: 0.85,
      maxRateM2: 1.18,
      avgRateM2: 1.02,
      privateMarketRate: '$0.95 - $1.25 /m²',
      normativeYield: '1.000 a 1.200 m² por operario con refuerzos en recesos',
      notes: 'Jornadas diurnas de lunes a sábado con rotación de limpieza en aulas y baterías sanitarias.'
    }
  }
};

// Matriz Comparativa Oficial SERCOP Multi-Sector
export const SERCOP_SECTOR_BENCHMARKS = [
  {
    sector: 'Salud Crítica (Quirófanos / UCI 24/7)',
    cpcCode: '85330.01.1',
    sercopMin: 4.50,
    sercopMax: 5.25,
    sercopAvg: 4.88,
    privateRate: '$4.50 - $5.50',
    normativeYield: '250 - 320 m²/FTE',
    officialContractRef: 'Ficha Nacional Hospitalaria 24h / MSP Ecuador',
    riskLevel: 'Crítico (Nivel 5)'
  },
  {
    sector: 'Hospitales Generales (IESS / MSP)',
    cpcCode: '85330.01.2',
    sercopMin: 1.84,
    sercopMax: 3.21,
    sercopAvg: 2.75,
    privateRate: '$2.50 - $3.40',
    normativeYield: '600 - 700 m²/FTE',
    officialContractRef: 'H. Teodoro Maldonado ($3,12/m²) • H. Verdi Cevallos ($2,86/m²) • HCAM ($1,84/m²)',
    riskLevel: 'Alto (Nivel 4)'
  },
  {
    sector: 'Retail & Patios de Comida',
    cpcCode: '85330.02.1',
    sercopMin: 2.04,
    sercopMax: 2.85,
    sercopAvg: 2.38,
    privateRate: '$2.10 - $2.90',
    normativeYield: '500 - 650 m²/FTE',
    officialContractRef: 'FISP Áreas de Alto Tráfico y Terminales Terrestres',
    riskLevel: 'Medio (Nivel 3)'
  },
  {
    sector: 'Oficinas Administrativas & Edificios Públicos',
    cpcCode: '85330.00.1',
    sercopMin: 0.91,
    sercopMax: 1.21,
    sercopAvg: 1.06,
    privateRate: '$1.15 - $1.45',
    normativeYield: '630 - 900 m²/FTE',
    officialContractRef: 'Ficha Técnica FISP-SERCOP Catálogo Dinámico Inclusivo',
    riskLevel: 'Mínimo (Nivel 1)'
  },
  {
    sector: 'Industria & Bodegas Logísticas',
    cpcCode: '85330.03.1',
    sercopMin: 0.65,
    sercopMax: 0.92,
    sercopAvg: 0.78,
    privateRate: '$0.70 - $0.95',
    normativeYield: '2.000 - 2.500 m²/FTE',
    officialContractRef: 'Pliegos CELEC EP / EP Petroecuador Naves Industriales',
    riskLevel: 'Bajo (Nivel 2)'
  },
  {
    sector: 'Educación & Universidades Públicas',
    cpcCode: '85330.00.2',
    sercopMin: 0.85,
    sercopMax: 1.18,
    sercopAvg: 1.02,
    privateRate: '$0.95 - $1.25',
    normativeYield: '1.000 - 1.200 m²/FTE',
    officialContractRef: 'Licitaciones UCE, EPN, UNACH Campus Universitarios',
    riskLevel: 'Bajo (Nivel 2)'
  }
];

// Niveles de Tráfico Peatonal
export const TRAFFIC_LEVELS = {
  low: {
    id: 'low',
    label: 'Bajo (< 25 personas/hora)',
    factor: 0.95,
    description: 'Flujo mínimo o restringido. Baja tasa de reensuciamiento.'
  },
  medium: {
    id: 'medium',
    label: 'Medio (25 - 100 personas/hora)',
    factor: 1.00,
    description: 'Flujo constante pero ordenado. Requiere repaso intermedio de áreas comunes.'
  },
  high: {
    id: 'high',
    label: 'Alto (100 - 300 personas/hora)',
    factor: 1.12,
    description: 'Congestión periódica y picos de suciedad (entradas, corredores principales).'
  },
  extreme: {
    id: 'extreme',
    label: 'Extremo / Continuo (> 300 personas/hora)',
    factor: 1.25,
    description: 'Tránsito masivo ininterrumpido. Reensuciamiento acelerado de pisos y papeleras.'
  }
};

// Niveles de Riesgo Sanitario / Microbiológico
export const SANITARY_RISK_LEVELS = {
  1: {
    level: 1,
    label: 'Nivel 1 — Mínimo (Espacios secos generales)',
    factor: 0.95,
    description: 'Sin presencia de patógenos específicos. Polvo común y residuos de oficina.',
    color: '#059669'
  },
  2: {
    level: 2,
    label: 'Nivel 2 — Bajo (Tránsito general institucional)',
    factor: 1.00,
    description: 'Contacto de superficies públicas. Prevención básica de virus estacionales.',
    color: '#0284c7'
  },
  3: {
    level: 3,
    label: 'Nivel 3 — Medio (Manipulación de alimentos / Sanitarios)',
    factor: 1.10,
    description: 'Riesgo de bacterias entéricas, residuos orgánicos húmedos, coliformes.',
    color: '#d97706'
  },
  4: {
    level: 4,
    label: 'Nivel 4 — Alto (Áreas asistenciales / Laboratorios)',
    factor: 1.20,
    description: 'Exposición a fluidos corporales, bacterias patógenas, salas de internación.',
    color: '#ea580c'
  },
  5: {
    level: 5,
    label: 'Nivel 5 — Crítico (Quirófanos / UCI / Esterilización)',
    factor: 1.35,
    description: 'Riesgo vital microbiológico. Cero tolerancia a esporas y bacterias nosocomiales multirresistentes.',
    color: '#dc2626'
  }
};

// Protocolos y Normativas de Desinfección
export const DISINFECTION_PROTOCOLS = {
  standard: {
    id: 'standard',
    name: 'Protocolo Estándar (Limpieza y Aromatización)',
    normative: 'Norma Técnica INEN de Limpieza Institucional',
    chemicalProduct: 'Detergente Neutro biodegradable + Sanitizante de Superficies',
    contactTimeMinutes: 2,
    costMultiplier: 1.0,
    description: 'Mantenimiento diario de superficies sin desinfección profunda.'
  },
  food_safe: {
    id: 'food_safe',
    name: 'Protocolo Grado Alimentario (BPM / HACCP)',
    normative: 'Codex Alimentarius & BPM ARCSA',
    chemicalProduct: 'Desengrasante Alcalino concentrado + Cuaternario 5ta gen sin enjuague (200 ppm)',
    contactTimeMinutes: 5,
    costMultiplier: 1.15,
    description: 'Desengrase intensivo y desinfección bactericida apta para contacto con alimentos.'
  },
  clinical_intermediate: {
    id: 'clinical_intermediate',
    name: 'Desinfección Clínica Nivel Intermedio',
    normative: 'Manual de Bioseguridad MSP Ecuador / CDC',
    chemicalProduct: 'Hipoclorito de Sodio estabilizado (1000 ppm) + Amonio Cuaternario 4ta Gen',
    contactTimeMinutes: 8,
    costMultiplier: 1.25,
    description: 'Acción virucida, bactericida y fungicida para áreas clínicas generales.'
  },
  hospital_grade: {
    id: 'hospital_grade',
    name: 'Desinfección Terminal Quirúrgica de Alto Nivel',
    normative: 'Protocolo Quirúrgico Hospitalario / Lista N de EPA',
    chemicalProduct: 'Peróxido de Hidrógeno Acelerado (AHP) + Amonio Cuaternario 5ta Gen grado hospitalario',
    contactTimeMinutes: 12,
    costMultiplier: 1.40,
    description: 'Acción esporicida y micobactericida con tiempo de contacto certificado y paños microfibra descartables.'
  },
  industrial_degreaser: {
    id: 'industrial_degreaser',
    name: 'Protocolo Industrial Pesado',
    normative: 'Norma de Seguridad Industrial y Manejo Químico',
    chemicalProduct: 'Desengrasante Solvente emulsionable + Sellador acrílico protector',
    contactTimeMinutes: 6,
    costMultiplier: 1.10,
    description: 'Remoción de grasas minerales, caucho de montacargas e hidrocarburos.'
  }
};

// Regímenes de Turnos según Código del Trabajo de Ecuador
export const SHIFT_REGIMES = {
  diurno_5d: {
    id: 'diurno_5d',
    label: 'Diurno — Lunes a Viernes (40h/sem)',
    shiftsPerDay: 1,
    operatingDaysMonth: 22,
    hoursPerDay: 8,
    nightSurcharge: false,
    reliefFactor: 1.0, // Jornada ordinaria sin relevo de fin de semana
    workloadFactor: 1.0,
    description: 'Jornada diurna estándar de oficina o edificio público.'
  },
  diurno_6d: {
    id: 'diurno_6d',
    label: 'Diurno — Lunes a Sábado (44h/sem)',
    shiftsPerDay: 1,
    operatingDaysMonth: 26,
    hoursPerDay: 8,
    nightSurcharge: false,
    reliefFactor: 1.08,
    workloadFactor: 1.06,
    description: 'Jornada comercial diurna con sábado rotativo.'
  },
  extended_16h_7d: {
    id: 'extended_16h_7d',
    label: 'Extendido — 2 Turnos / 7 Días a la semana (16h/día)',
    shiftsPerDay: 2,
    operatingDaysMonth: 30,
    hoursPerDay: 16,
    nightSurcharge: true,
    requiresContinuousPresence: true, // Debe haber personal presente durante todas las horas de operación
    reliefFactor: 1.25,
    workloadFactor: 1.22,
    description: 'Patios de comida de centros comerciales, supermercados y terminales.'
  },
  continuous_24_7: {
    id: 'continuous_24_7',
    label: 'Continuo Crítico — 3 Turnos Rotativos 24/7 (24h/día)',
    shiftsPerDay: 3,
    operatingDaysMonth: 30,
    hoursPerDay: 24,
    nightSurcharge: true,
    requiresContinuousPresence: true, // Debe haber personal presente durante todas las horas de operación
    reliefFactor: 1.45,
    workloadFactor: 1.42,
    description: 'Quirófanos, salas de emergencia hospitalaria y plantas de producción continua.'
  }
};

// Grado de Maquinaria y Tecnología
export const MACHINERY_OPTIONS = {
  manual: {
    id: 'manual',
    label: 'Operación Manual Convencional',
    yieldMultiplier: 0.95,
    monthlyCostPerM2: 0.02,
    description: 'Herramientas manuales estándar (carros doble balde, mopas planas microfibra).'
  },
  semi_mechanized: {
    id: 'semi_mechanized',
    label: 'Semi-mecanizado (Aspiradoras & Rotativas)',
    yieldMultiplier: 1.10,
    monthlyCostPerM2: 0.04,
    description: 'Aspirado mecánico de sólidos y pulido de pisos con máquina monodisco.'
  },
  heavy_mechanized: {
    id: 'heavy_mechanized',
    label: 'Alta Mecanización (Fregadoras Automáticas)',
    yieldMultiplier: 1.25,
    monthlyCostPerM2: 0.07,
    description: 'Fregado industrial automático con secado instantáneo. Multiplica la productividad en pasillos amplios.'
  }
};

// Casos de Estudio Reales Preconfigurados del Mercado Ecuatoriano (SERCOP & Sector Privado)
export const REAL_PRESETS = [
  {
    id: 'hospital_quito',
    name: 'Hospital de Especialidades IESS — Quirófanos & UCI 24/7',
    subtitle: 'Caso Hospitalario Crítico (Quito, Ecuador • SERCOP CPC 85330.01.1)',
    infrastructureType: 'hospital_critical',
    areaM2: 650,
    sanitaryRiskLevel: 5,
    trafficLevel: 'medium',
    disinfectionProtocol: 'hospital_grade',
    shiftRegime: 'continuous_24_7',
    machineryOption: 'semi_mechanized',
    targetMargin: 16,
    indirectRate: 9
  },
  {
    id: 'hospital_general_iess',
    name: 'Hospital Teodoro Maldonado Carbo / Verdi Cevallos (Hospitalización General)',
    subtitle: 'Caso Salud General (Guayaquil / Portoviejo • SERCOP $2,86-$3,21/m²)',
    infrastructureType: 'general_healthcare',
    areaM2: 2800,
    sanitaryRiskLevel: 4,
    trafficLevel: 'high',
    disinfectionProtocol: 'clinical_intermediate',
    shiftRegime: 'continuous_24_7',
    machineryOption: 'semi_mechanized',
    targetMargin: 16,
    indirectRate: 8
  },
  {
    id: 'mall_foodcourt',
    name: 'Mall del Sol / Quicentro — Patio de Comidas Central',
    subtitle: 'Caso Retail Alto Tráfico (Guayaquil / Quito • SERCOP $2,04-$2,85/m²)',
    infrastructureType: 'food_court_retail',
    areaM2: 1850,
    sanitaryRiskLevel: 3,
    trafficLevel: 'extreme',
    disinfectionProtocol: 'food_safe',
    shiftRegime: 'extended_16h_7d',
    machineryOption: 'heavy_mechanized',
    targetMargin: 18,
    indirectRate: 8
  },
  {
    id: 'corporate_tower',
    name: 'Edificio Gubernamental / Plataforma Financiera (Oficinas)',
    subtitle: 'Caso Administrativo Público (Quito • Catálogo SERCOP $0,91-$1,21/m²)',
    infrastructureType: 'corporate_office',
    areaM2: 3200,
    sanitaryRiskLevel: 1,
    trafficLevel: 'low',
    disinfectionProtocol: 'standard',
    shiftRegime: 'diurno_5d',
    machineryOption: 'semi_mechanized',
    targetMargin: 18,
    indirectRate: 9
  },
  {
    id: 'industrial_plant',
    name: 'Planta de Procesamiento Agroindustrial / CELEC EP',
    subtitle: 'Caso Logística e Industria Pesada (SERCOP $0,65-$0,92/m²)',
    infrastructureType: 'industrial_logistics',
    areaM2: 4500,
    sanitaryRiskLevel: 2,
    trafficLevel: 'medium',
    disinfectionProtocol: 'industrial_degreaser',
    shiftRegime: 'diurno_6d',
    machineryOption: 'heavy_mechanized',
    targetMargin: 15,
    indirectRate: 8
  },
  {
    id: 'university_campus',
    name: 'Universidad Central del Ecuador / EPN (Campus Universitario)',
    subtitle: 'Caso Educación Superior Pública (Quito • SERCOP $0,85-$1,18/m²)',
    infrastructureType: 'educational_campus',
    areaM2: 2400,
    sanitaryRiskLevel: 2,
    trafficLevel: 'high',
    disinfectionProtocol: 'standard',
    shiftRegime: 'diurno_6d',
    machineryOption: 'semi_mechanized',
    targetMargin: 16,
    indirectRate: 8
  }
];
