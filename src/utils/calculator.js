/**
 * MOTOR ALGORÍTMICO PARAMÉTRICO DE FACILITY MANAGEMENT
 * Cálculos matemáticos y estructuración de costos unitarios según variables operativas.
 * CALIBRADO CON DATOS REALES DEL SERVICIO NACIONAL DE CONTRATACIÓN PÚBLICA (SERCOP CPC 85330)
 * Y TABLA SECTORIAL NO. 19 DEL MINISTERIO DEL TRABAJO (MDT) DE ECUADOR.
 */

import {
  ECUADOR_LABOR_CONFIG,
  INFRASTRUCTURE_TYPES,
  TRAFFIC_LEVELS,
  SANITARY_RISK_LEVELS,
  DISINFECTION_PROTOCOLS,
  SHIFT_REGIMES,
  MACHINERY_OPTIONS
} from '../data/parametricData.js';

/**
 * Calcula el costo laboral unitario mensual de 1 FTE según turno y régimen legal
 */
export function calculateUnitLaborCost(isNightShift = false, customSBU = ECUADOR_LABOR_CONFIG.sbuBase) {
  const sbu = customSBU;
  const iessPatronal = sbu * ECUADOR_LABOR_CONFIG.iessPatronalRate; // 12.15%
  const decimoTercero = sbu * ECUADOR_LABOR_CONFIG.decimoTerceroRate; // 8.33%
  const decimoCuarto = sbu * ECUADOR_LABOR_CONFIG.decimoCuartoRate; // 8.33%
  const fondoReserva = sbu * ECUADOR_LABOR_CONFIG.fondoReservaRate; // 8.33%
  const vacaciones = sbu * ECUADOR_LABOR_CONFIG.vacacionesRate; // 4.16%
  const desahucio = sbu * ECUADOR_LABOR_CONFIG.desahucioRate; // 2.08%
  const uniformes = ECUADOR_LABOR_CONFIG.uniformesEPPBase; // $26.00
  const seguro = ECUADOR_LABOR_CONFIG.seguroCapacitacion; // $14.00

  let baseMonthlyCost = sbu + iessPatronal + decimoTercero + decimoCuarto + fondoReserva + vacaciones + desahucio + uniformes + seguro;

  if (isNightShift) {
    // Recargo del 25% sobre la componente salarial proporcional nocturna (Art. 49 Código del Trabajo)
    baseMonthlyCost += (sbu * ECUADOR_LABOR_CONFIG.recargoNocturnoRate);
  }

  return {
    sbu,
    iessPatronal,
    decimoTercero,
    decimoCuarto,
    fondoReserva,
    vacaciones,
    desahucio,
    uniformes,
    seguro,
    totalMonthlyCost: baseMonthlyCost
  };
}

/**
 * Función principal del motor de cálculo paramétrico
 */
export function calculateQuote(params) {
  const {
    areaM2 = 1000,
    infrastructureTypeId = 'corporate_office',
    trafficLevelId = 'medium',
    sanitaryRiskLevelNumber = 1,
    disinfectionProtocolId = 'standard',
    shiftRegimeId = 'diurno_5d',
    machineryOptionId = 'semi_mechanized',
    targetMargin = 18, // %
    indirectRate = 9, // %
    sbu = ECUADOR_LABOR_CONFIG.sbuBase,
    benchmarkFlatRatePerM2 = 1.25 // Tarifa plana tradicional de mercado en Ecuador ($1.25/m²)
  } = params;

  const infra = INFRASTRUCTURE_TYPES[infrastructureTypeId] || INFRASTRUCTURE_TYPES.corporate_office;
  const traffic = TRAFFIC_LEVELS[trafficLevelId] || TRAFFIC_LEVELS.medium;
  const risk = SANITARY_RISK_LEVELS[sanitaryRiskLevelNumber] || SANITARY_RISK_LEVELS[1];
  const protocol = DISINFECTION_PROTOCOLS[disinfectionProtocolId] || DISINFECTION_PROTOCOLS.standard;
  const shift = SHIFT_REGIMES[shiftRegimeId] || SHIFT_REGIMES.diurno_5d;
  const machinery = MACHINERY_OPTIONS[machineryOptionId] || MACHINERY_OPTIONS.semi_mechanized;

  // 1. COBERTURA NORMATIVA Y DIMENSIONAMIENTO DE PERSONAL (FTE)
  // Fórmula paramétrica: Cobertura_efectiva = (Cobertura_normada * k_maquinaria) / (k_riesgo * k_trafico)
  const baseCoverageM2 = infra.normativeYieldM2PerFTE || 900;
  // Factor de tiempo por protocolo de desinfección: más minutos de contacto = más tiempo de trabajo por m² (supuesto a validar)
  const protocolTimeFactor = 1 + Math.max(0, protocol.contactTimeMinutes - ECUADOR_LABOR_CONFIG.standardContactMinutes) * ECUADOR_LABOR_CONFIG.protocolTimePenaltyPerMin;
  const effectiveCoverageM2 = (baseCoverageM2 * machinery.yieldMultiplier) / (risk.factor * traffic.factor * protocolTimeFactor);
  const rawBaseFTE = areaM2 / effectiveCoverageM2;

  // Aplicación del factor de jornada laboral y relevos obligatorios por ley
  const totalCalculatedFTE = rawBaseFTE * (shift.workloadFactor || 1.0);
  const areaBasedFTE = Math.max(1, Math.round(totalCalculatedFTE * 10) / 10);
  // Piso de cobertura: en regímenes con presencia continua debe haber al menos 1 persona durante todas las horas de operación
  const coverageFloorFTE = shift.requiresContinuousPresence
    ? Math.round(((shift.operatingDaysMonth * shift.hoursPerDay) / ECUADOR_LABOR_CONFIG.horasMesPorOperario) * 10) / 10
    : 0;
  const coverageFloorApplied = coverageFloorFTE > areaBasedFTE;
  const assignedFTE = Math.max(areaBasedFTE, coverageFloorFTE);
  const roundedFTEInt = Math.ceil(assignedFTE);

  // Desglose de operarios por turnos diurnos vs nocturnos
  let nightFTE = 0;
  let dayFTE = assignedFTE;
  if (shift.shiftsPerDay === 3) {
    nightFTE = Math.round((assignedFTE / 3) * 10) / 10;
    dayFTE = Math.round((assignedFTE - nightFTE) * 10) / 10;
  } else if (shift.shiftsPerDay === 2 && shift.nightSurcharge) {
    nightFTE = Math.round((assignedFTE * 0.30) * 10) / 10;
    dayFTE = Math.round((assignedFTE - nightFTE) * 10) / 10;
  }

  // 2. RENDIMIENTO OPERATIVO Y HORAS REQUERIDAS MENSUALES
  // R_efectivo (m²/h) = (R_base * k_maquinaria) / (k_riesgo * k_trafico)
  const baseYieldM2H = infra.baseYieldM2H;
  const effectiveYieldM2H = (baseYieldM2H * machinery.yieldMultiplier) / (risk.factor * traffic.factor * protocolTimeFactor);
  const effectiveHoursPerFTE = ECUADOR_LABOR_CONFIG.horasMesPorOperario * ECUADOR_LABOR_CONFIG.factorEficienciaOEE; // 136 h/mes
  const monthlyRequiredHours = assignedFTE * effectiveHoursPerFTE;
  const dailyRequiredHours = monthlyRequiredHours / shift.operatingDaysMonth;
  const dailyInterventions = infra.defaultFrequency || 1;

  // 3. ESTRUCTURA DE COSTOS DIRECTOS
  // 3.1 Mano de Obra (MDO)
  const unitDayLabor = calculateUnitLaborCost(false, sbu);
  const unitNightLabor = calculateUnitLaborCost(true, sbu);

  const directDayLaborCost = dayFTE * unitDayLabor.totalMonthlyCost;
  const directNightLaborCost = nightFTE * unitNightLabor.totalMonthlyCost;
  const baseLaborCost = directDayLaborCost + directNightLaborCost;

  // Factor de supervisión especializada según complejidad
  const supervisionCost = baseLaborCost * (infra.supervisionMultiplier - 1);
  const totalLaborCost = baseLaborCost + supervisionCost;

  // 3.2 Insumos Químicos y Desinfectantes
  const chemicalFrequencyFactor = shift.operatingDaysMonth / 22;
  const chemicalCostPerM2 = infra.chemicalBaseCostM2 * protocol.costMultiplier;
  const totalChemicalsCost = areaM2 * chemicalCostPerM2 * chemicalFrequencyFactor;

  // 3.3 EPP y Bioseguridad Ocupacional
  const baseEppPerFTE = infra.eppCostPerFTE;
  const riskEppAddon = (risk.level >= 4) ? 15.00 : (risk.level >= 3 ? 6.00 : 0);
  const totalPPECost = assignedFTE * (baseEppPerFTE + riskEppAddon);

  // 3.4 Maquinaria y Equipos
  const totalEquipmentCost = areaM2 * machinery.monthlyCostPerM2;

  // TOTAL COSTOS DIRECTOS
  const totalDirectCost = totalLaborCost + totalChemicalsCost + totalPPECost + totalEquipmentCost;

  // 4. COSTOS INDIRECTOS (Supervisión corporativa, logística, administración)
  const indirectCost = totalDirectCost * (indirectRate / 100);

  // COSTO TOTAL TÉCNICO
  const totalCost = totalDirectCost + indirectCost;

  // 5. PRECIO DE VENTA Y UTILIDAD
  const marginDecimal = Math.min(Math.max(targetMargin, 0), 80) / 100; // evita división por cero con márgenes >= 100%
  const recommendedSellingPrice = totalCost / (1 - marginDecimal);
  const grossProfit = recommendedSellingPrice - totalCost;
  const effectiveMarginPercent = (grossProfit / recommendedSellingPrice) * 100;

  // COSTOS UNITARIOS
  const unitPricePerM2 = recommendedSellingPrice / areaM2;
  const unitCostPerM2 = totalCost / areaM2;
  const costPerHour = totalCost / Math.max(1, monthlyRequiredHours);
  const pricePerHour = recommendedSellingPrice / Math.max(1, monthlyRequiredHours);

  // 6. BENCHMARK OFICIAL SERCOP (CPC 85330)
  const sercopRef = infra.sercopReference || {
    source: 'Catálogo SERCOP General',
    minRateM2: 0.91,
    maxRateM2: 1.25,
    avgRateM2: 1.08,
    privateMarketRate: '$1.15 - $1.45 /m²',
    normativeYield: '900 m²/FTE'
  };

  const deltaToSercopAvg = unitPricePerM2 - sercopRef.avgRateM2;
  const percentDiffToSercopAvg = ((unitPricePerM2 - sercopRef.avgRateM2) / sercopRef.avgRateM2) * 100;
  const isInOfficialBand = (unitPricePerM2 >= sercopRef.minRateM2 * 0.90) && (unitPricePerM2 <= sercopRef.maxRateM2 * 1.10);

  let sercopStatus = 'aligned';
  let sercopStatusLabel = 'Dentro de la banda referencial';
  if (isInOfficialBand) {
    sercopStatus = 'aligned';
    sercopStatusLabel = 'Dentro de la banda referencial, con tolerancia de ±10 % (CPC 85330)';
  } else if (unitPricePerM2 < sercopRef.minRateM2 * 0.90) {
    sercopStatus = 'optimized';
    sercopStatusLabel = 'Bajo la banda: oferta muy competitiva o muy mecanizada';
  } else {
    sercopStatus = 'specialized';
    sercopStatusLabel = 'Sobre la banda: tarifa diferenciada por criticidad o cobertura';
  }

  // 7. BENCHMARK COMPARATIVO: MÉTODO TRADICIONAL (TARIFA PLANA)
  const traditionalTotalPrice = areaM2 * benchmarkFlatRatePerM2;
  const traditionalGrossProfit = traditionalTotalPrice - totalCost;
  const traditionalMarginPercent = (traditionalGrossProfit / traditionalTotalPrice) * 100;
  const financialDelta = recommendedSellingPrice - traditionalTotalPrice;

  // Operarios asignados tradicionalmente al ojo (1 cada 900 m² ciego)
  const traditionalAssignedFTE = Math.max(1, Math.round((areaM2 / 900) * 10) / 10);
  const fteDeficit = assignedFTE - traditionalAssignedFTE;
  const hoursDeficit = fteDeficit * effectiveHoursPerFTE;

  // Diagnóstico
  let traditionalDiagnosis = '';
  let riskStatus = 'healthy';

  if (traditionalGrossProfit < 0) {
    riskStatus = 'critical_loss';
    traditionalDiagnosis = `Pérdida Financiera Severa: La tarifa plana pierde -$${Math.abs(Math.round(traditionalGrossProfit)).toLocaleString()} al mes porque ignora el alto riesgo sanitario y la alta frecuencia de desinfección.`;
  } else if (traditionalMarginPercent < 8) {
    riskStatus = 'warning_loss';
    traditionalDiagnosis = `Margen Comprometido: La tarifa plana deja un margen de solo ${traditionalMarginPercent.toFixed(1)}%, exponiendo a la empresa a quiebra operativa ante cualquier imprevisto.`;
  } else if (traditionalTotalPrice > recommendedSellingPrice * 1.25) {
    riskStatus = 'overpriced';
    traditionalDiagnosis = `Sobrecotización Incompetitiva: La tarifa plana cobra un +${((traditionalTotalPrice / recommendedSellingPrice - 1) * 100).toFixed(0)}% por encima del costo real técnico, provocando la pérdida de la licitación.`;
  } else {
    riskStatus = 'acceptable_gap';
    traditionalDiagnosis = 'Variación moderada frente a tarifa plana.';
  }

  const biologicalComplianceIndex = Math.min(100, Math.round((traditionalAssignedFTE / Math.max(0.1, assignedFTE)) * 100));

  return {
    inputs: {
      areaM2,
      infrastructureType: infra,
      trafficLevel: traffic,
      sanitaryRiskLevel: risk,
      disinfectionProtocol: protocol,
      shiftRegime: shift,
      machineryOption: machinery,
      targetMargin,
      indirectRate,
      sbu,
      benchmarkFlatRatePerM2
    },
    yieldMetrics: {
      baseYieldM2H,
      baseCoverageM2,
      effectiveCoverageM2,
      effectiveYieldM2H,
      protocolTimeFactor,
      yieldBonusFactor: machinery.yieldMultiplier,
      hoursPerCleaningCycle: areaM2 / effectiveYieldM2H,
      dailyInterventions,
      dailyRequiredHours,
      monthlyRequiredHours
    },
    staffingMetrics: {
      rawBaseFTE,
      reliefFactor: shift.reliefFactor || 1.0,
      totalCalculatedFTE,
      assignedFTE,
      areaBasedFTE,
      coverageFloorFTE,
      coverageFloorApplied,
      roundedFTEInt,
      dayFTE,
      nightFTE,
      effectiveHoursPerFTE,
      unitDayLaborCost: unitDayLabor.totalMonthlyCost,
      unitNightLaborCost: unitNightLabor.totalMonthlyCost
    },
    costBreakdown: {
      labor: {
        amount: totalLaborCost,
        percentage: (totalLaborCost / recommendedSellingPrice) * 100,
        dayLabor: directDayLaborCost,
        nightLabor: directNightLaborCost,
        supervision: supervisionCost
      },
      chemicals: {
        amount: totalChemicalsCost,
        percentage: (totalChemicalsCost / recommendedSellingPrice) * 100,
        costPerM2: chemicalCostPerM2
      },
      ppe: {
        amount: totalPPECost,
        percentage: (totalPPECost / recommendedSellingPrice) * 100,
        costPerFTE: baseEppPerFTE + riskEppAddon
      },
      equipment: {
        amount: totalEquipmentCost,
        percentage: (totalEquipmentCost / recommendedSellingPrice) * 100,
        costPerM2: machinery.monthlyCostPerM2
      },
      indirect: {
        amount: indirectCost,
        percentage: (indirectCost / recommendedSellingPrice) * 100
      },
      profit: {
        amount: grossProfit,
        percentage: effectiveMarginPercent
      },
      totalDirectCost,
      totalCost,
      recommendedSellingPrice
    },
    unitEconomics: {
      unitPricePerM2,
      unitCostPerM2,
      costPerHour,
      pricePerHour
    },
    sercopBenchmark: {
      cpcCode: infra.cpcCode,
      source: sercopRef.source,
      minRateM2: sercopRef.minRateM2,
      maxRateM2: sercopRef.maxRateM2,
      avgRateM2: sercopRef.avgRateM2,
      privateMarketRate: sercopRef.privateMarketRate,
      normativeYield: sercopRef.normativeYield,
      notes: sercopRef.notes,
      deltaToSercopAvg,
      percentDiffToSercopAvg,
      isInOfficialBand,
      status: sercopStatus,
      statusLabel: sercopStatusLabel,
      legalWageCompliance: `SBU $${sbu.toFixed(2)} + beneficios de ley IESS: costo empresa $${unitDayLabor.totalMonthlyCost.toFixed(2)}/mes por operario diurno`
    },
    traditionalBenchmark: {
      ratePerM2: benchmarkFlatRatePerM2,
      totalPrice: traditionalTotalPrice,
      grossProfit: traditionalGrossProfit,
      marginPercent: traditionalMarginPercent,
      assignedFTE: traditionalAssignedFTE,
      financialDelta,
      fteDeficit,
      hoursDeficit,
      riskStatus,
      diagnosis: traditionalDiagnosis,
      biologicalComplianceIndex
    }
  };
}
