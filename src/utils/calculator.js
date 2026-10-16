/**
 * MOTOR PARAMÉTRICO DE COTIZACIÓN — CleanQuote Pro
 *
 * Modelo (resumen):
 *  1. Cobertura por auxiliar y turno = Rendimiento_base_tipología × k_maquinaria × k_protocolo
 *                                      ÷ (k_riesgo × k_tráfico × k_frecuencia)
 *     (los factores k son RELATIVOS a los valores por defecto de la tipología, así que en
 *      condiciones por defecto la cobertura es la de la ficha SERCOP / referencia).
 *  2. Puestos por turno = Área ÷ Cobertura, redondeado con la regla de las fichas SERCOP.
 *  3. FTE = Σ (puestos × horas del turno × días/semana) ÷ 40h legales (× reemplazo de vacaciones si opera 7 días).
 *  4. Mano de obra = FTE × costo empresa (SBU 2026 + beneficios de ley) + recargo nocturno + supervisión.
 *  5. Costo directo = Mano de obra + insumos + EPP + maquinaria. Costo total = directo + indirectos.
 *  6. Precio = Costo total ÷ (1 − margen). IVA se muestra aparte.
 */

import {
  ECUADOR_LABOR_CONFIG,
  INFRASTRUCTURE_TYPES,
  TRAFFIC_LEVELS,
  SANITARY_RISK_LEVELS,
  DISINFECTION_PROTOCOLS,
  SHIFT_REGIMES,
  MACHINERY_OPTIONS,
  REAL_PRESETS
} from '../data/parametricData.js';

const L = ECUADOR_LABOR_CONFIG;

/**
 * Regla de redondeo de personal de las fichas SERCOP:
 * fracción < 0,50 se descarta; 0,50–0,80 agrega medio tiempo; > 0,80 agrega tiempo completo.
 * El mínimo es medio tiempo (0,5), o 1 puesto completo si se exige presencia continua.
 */
export function roundStaffSercop(raw, minimum = 0.5) {
  const whole = Math.floor(raw);
  const frac = raw - whole;
  let result = whole;
  if (frac > 0.8 + 1e-9) result = whole + 1;
  else if (frac >= 0.5 - 1e-9) result = whole + 0.5;
  return Math.max(minimum, result);
}

/**
 * Costo empresa mensual de 1 FTE.
 * @param {number} nocturnalShare fracción de horas trabajadas entre 19h00 y 06h00 (0 a 1)
 */
export function calculateUnitLaborCost({ sbu = L.sbuBase, nocturnalShare = 0, includeFondoReserva = true } = {}) {
  const iessPatronal = sbu * L.iessPatronalRate;
  const decimoTercero = sbu * L.decimoTerceroRate;
  const decimoCuarto = L.sbuBase * L.decimoCuartoRate; // 1 SBU vigente / 12, independiente del sueldo
  const fondoReserva = includeFondoReserva ? sbu * L.fondoReservaRate : 0;
  const vacaciones = sbu * L.vacacionesRate;
  const desahucio = sbu * L.desahucioRate;
  const uniformes = L.uniformesEPPBase;
  const seguro = L.seguroCapacitacion;

  // Recargo nocturno: 25% sobre la remuneración de las horas nocturnas; incrementa también
  // la base de IESS, décimo tercero, fondos de reserva y vacaciones.
  const recargoBase = sbu * L.recargoNocturnoRate * nocturnalShare;
  const recargoOnCosts = 1 + L.iessPatronalRate + L.decimoTerceroRate + (includeFondoReserva ? L.fondoReservaRate : 0) + L.vacacionesRate;
  const recargoNocturno = recargoBase * recargoOnCosts;

  const totalMonthlyCost =
    sbu + iessPatronal + decimoTercero + decimoCuarto + fondoReserva + vacaciones + desahucio + uniformes + seguro + recargoNocturno;

  return { sbu, iessPatronal, decimoTercero, decimoCuarto, fondoReserva, vacaciones, desahucio, uniformes, seguro, recargoNocturno, totalMonthlyCost };
}

export function calculateQuote(params) {
  const {
    areaM2 = 1000,
    infrastructureTypeId = 'corporate_office',
    trafficLevelId,
    sanitaryRiskLevelNumber,
    disinfectionProtocolId,
    shiftRegimeId,
    machineryOptionId = 'semi_mechanized',
    dailyFrequency,
    targetMargin = 18,
    indirectRate = 9,
    sbu = L.sbuBase,
    includeFondoReserva = true,
    benchmarkFlatRatePerM2 = 1.58
  } = params;

  const area = Math.max(1, Number(areaM2) || 1);
  const infra = INFRASTRUCTURE_TYPES[infrastructureTypeId] || INFRASTRUCTURE_TYPES.corporate_office;
  const traffic = TRAFFIC_LEVELS[trafficLevelId ?? infra.defaultTraffic] || TRAFFIC_LEVELS[infra.defaultTraffic];
  const risk = SANITARY_RISK_LEVELS[sanitaryRiskLevelNumber ?? infra.defaultRiskLevel] || SANITARY_RISK_LEVELS[infra.defaultRiskLevel];
  const protocol = DISINFECTION_PROTOCOLS[disinfectionProtocolId ?? infra.defaultProtocol] || DISINFECTION_PROTOCOLS[infra.defaultProtocol];
  const shift = SHIFT_REGIMES[shiftRegimeId ?? infra.defaultShift] || SHIFT_REGIMES[infra.defaultShift];
  const machinery = MACHINERY_OPTIONS[machineryOptionId] || MACHINERY_OPTIONS.semi_mechanized;
  const frequency = Math.max(1, Number(dailyFrequency ?? infra.defaultFrequency) || 1);

  const defRisk = SANITARY_RISK_LEVELS[infra.defaultRiskLevel];
  const defTraffic = TRAFFIC_LEVELS[infra.defaultTraffic];
  const defProtocol = DISINFECTION_PROTOCOLS[infra.defaultProtocol];

  // ── 1. FACTORES RELATIVOS Y COBERTURA ────────────────────────────────────
  const kRisk = risk.factor / defRisk.factor;
  const kTraffic = traffic.factor / defTraffic.factor;
  const kProtocol = protocol.yieldFactor / defProtocol.yieldFactor;
  const kMachinery = machinery.yieldMultiplier;
  // Cada pasada diaria adicional sobre la frecuencia por defecto añade 20% de carga (estimación)
  const kFrequency = Math.max(0.6, 1 + 0.2 * (frequency - infra.defaultFrequency));

  const baseYieldM2PerPost = infra.baseYieldM2PerPost;
  const coverageM2PerPost = (baseYieldM2PerPost * kMachinery * kProtocol) / (kRisk * kTraffic * kFrequency);
  const effectiveYieldM2H = coverageM2PerPost / 8;

  // ── 2. PUESTOS POR TURNO ──────────────────────────────────────────────────
  const multiShift = shift.shifts.length > 1;
  const rawPostsShift1 = area / coverageM2PerPost;
  const shiftRows = shift.shifts.map((s, idx) => {
    const raw = idx === 0 ? rawPostsShift1 : rawPostsShift1 * infra.secondaryShiftRatio;
    const posts = roundStaffSercop(raw, multiShift ? 1 : 0.5);
    const weeklyHours = posts * s.hours * shift.daysPerWeek;
    return { ...s, rawPosts: raw, posts, weeklyHours, nocturnalWeeklyHours: posts * s.nocturnalHours * shift.daysPerWeek };
  });

  // ── 3. PERSONAL (FTE) ─────────────────────────────────────────────────────
  const weeklyCoverageHours = shiftRows.reduce((a, r) => a + r.weeklyHours, 0);
  const weeklyNocturnalHours = shiftRows.reduce((a, r) => a + r.nocturnalWeeklyHours, 0);
  const vacationRelief = shift.daysPerWeek === 7 ? L.vacationReliefFactor : 1;
  const operatorFTE = Math.round((weeklyCoverageHours / L.horasSemanalesLegales) * vacationRelief * 100) / 100;
  const nocturnalShare = weeklyCoverageHours > 0 ? weeklyNocturnalHours / weeklyCoverageHours : 0;
  const headcount = Math.ceil(operatorFTE * 2) / 2; // personas (admite medio tiempo)
  const supervisors = operatorFTE > L.supervisorMinStaff ? Math.ceil(operatorFTE / L.supervisorRatio) : 0;
  const monthlyRequiredHours = (weeklyCoverageHours * 52) / 12;
  const operatingDaysMonth = (shift.daysPerWeek * 52) / 12;
  const dailyRequiredHours = weeklyCoverageHours / shift.daysPerWeek;

  // ── 4. MANO DE OBRA ───────────────────────────────────────────────────────
  const unitDay = calculateUnitLaborCost({ sbu, nocturnalShare: 0, includeFondoReserva });
  const unitBlended = calculateUnitLaborCost({ sbu, nocturnalShare, includeFondoReserva });
  const unitFullNight = calculateUnitLaborCost({ sbu, nocturnalShare: 1, includeFondoReserva });

  const baseLaborCost = operatorFTE * unitDay.totalMonthlyCost;
  const nightSurchargeCost = operatorFTE * unitBlended.recargoNocturno;
  const supervisionCost = supervisors * unitDay.totalMonthlyCost * L.supervisorSalaryMultiplier;
  const totalLaborCost = baseLaborCost + nightSurchargeCost + supervisionCost;

  // ── 5. INSUMOS, EPP, MAQUINARIA ───────────────────────────────────────────
  const daysFactor = operatingDaysMonth / 22;
  const protocolCostRel = protocol.costMultiplier / defProtocol.costMultiplier;
  const frequencyCostRel = frequency / infra.defaultFrequency;
  const chemicalCostPerM2 = infra.chemicalBaseCostM2 * protocolCostRel * frequencyCostRel * daysFactor;
  const totalChemicalsCost = area * chemicalCostPerM2;

  const riskEppAddon = risk.level >= 4 ? 15 : risk.level >= 3 ? 6 : 0;
  const eppPerFTE = infra.eppCostPerFTE + riskEppAddon;
  const totalPPECost = (operatorFTE + supervisors) * eppPerFTE;

  const totalEquipmentCost = area * machinery.monthlyCostPerM2;

  const totalDirectCost = totalLaborCost + totalChemicalsCost + totalPPECost + totalEquipmentCost;
  const indirectCost = totalDirectCost * (indirectRate / 100);
  const totalCost = totalDirectCost + indirectCost;

  // ── 6. PRECIO ─────────────────────────────────────────────────────────────
  const marginDecimal = Math.min(0.9, Math.max(0, targetMargin / 100));
  const recommendedSellingPrice = totalCost / (1 - marginDecimal);
  const grossProfit = recommendedSellingPrice - totalCost;
  const effectiveMarginPercent = (grossProfit / recommendedSellingPrice) * 100;
  const ivaAmount = recommendedSellingPrice * L.ivaRate;
  const priceWithIVA = recommendedSellingPrice + ivaAmount;

  const unitPricePerM2 = recommendedSellingPrice / area;
  const unitCostPerM2 = totalCost / area;
  const costPerHour = totalCost / Math.max(1, monthlyRequiredHours);
  const pricePerHour = recommendedSellingPrice / Math.max(1, monthlyRequiredHours);

  const pct = (v) => (v / recommendedSellingPrice) * 100;

  // ── 7. COMPARACIÓN CON REFERENCIA PÚBLICA ────────────────────────────────
  const ref = infra.reference;
  const refPrice = ref.priceM2;
  const percentDiffToRef = ((unitPricePerM2 - refPrice) / refPrice) * 100;
  let refStatus;
  let refStatusLabel;
  if (ref.kind === 'contratos' && unitPricePerM2 >= ref.minPriceM2 && unitPricePerM2 <= ref.maxPriceM2) {
    refStatus = 'within';
    refStatusLabel = 'Dentro del rango de contratos adjudicados';
  } else if (Math.abs(percentDiffToRef) <= 10) {
    refStatus = 'within';
    refStatusLabel = 'Dentro de ±10% de la referencia pública';
  } else if (percentDiffToRef < 0) {
    refStatus = 'below';
    refStatusLabel = `${Math.abs(percentDiffToRef).toFixed(0)}% por debajo de la referencia pública`;
  } else {
    refStatus = 'above';
    refStatusLabel = `${percentDiffToRef.toFixed(0)}% por encima de la referencia — justificar por exigencia operativa`;
  }
  // Margen que obtendría esta estructura de costos si se cobrara el precio de referencia
  const marginAtReferencePrice = (1 - totalCost / (refPrice * area)) * 100;

  // ── 8. MÉTODO TRADICIONAL (tarifa única + 1 auxiliar cada 900 m²) ─────────
  const traditionalTotalPrice = area * benchmarkFlatRatePerM2;
  const traditionalGrossProfit = traditionalTotalPrice - totalCost;
  const traditionalMarginPercent = (traditionalGrossProfit / traditionalTotalPrice) * 100;
  const traditionalAssignedFTE = roundStaffSercop(area / 900, 0.5);
  const fteDeficit = operatorFTE - traditionalAssignedFTE;
  const hoursDeficit = (fteDeficit * L.horasSemanalesLegales * 52) / 12;
  const staffCoverageIndex = Math.min(100, Math.round((traditionalAssignedFTE / Math.max(0.1, operatorFTE)) * 100));

  let riskStatus;
  let traditionalDiagnosis;
  if (traditionalGrossProfit < 0) {
    riskStatus = 'critical_loss';
    traditionalDiagnosis = `Pérdida estimada: la tarifa única de $${benchmarkFlatRatePerM2.toFixed(2)}/m² no cubre el costo calculado (−$${Math.abs(Math.round(traditionalGrossProfit)).toLocaleString('es-EC')}/mes) porque no considera turnos, riesgo sanitario ni frecuencia.`;
  } else if (traditionalMarginPercent < 8) {
    riskStatus = 'warning_loss';
    traditionalDiagnosis = `Margen insuficiente: la tarifa única deja solo ${traditionalMarginPercent.toFixed(1)}% de margen sobre el costo calculado.`;
  } else if (traditionalTotalPrice > recommendedSellingPrice * 1.25) {
    riskStatus = 'overpriced';
    traditionalDiagnosis = `Sobreprecio: la tarifa única cobra ${((traditionalTotalPrice / recommendedSellingPrice - 1) * 100).toFixed(0)}% más que el precio paramétrico, lo que reduce la competitividad de la oferta.`;
  } else {
    riskStatus = 'acceptable_gap';
    traditionalDiagnosis = 'Diferencia moderada frente a la tarifa única.';
  }

  return {
    inputs: {
      areaM2: area,
      infrastructureType: infra,
      trafficLevel: traffic,
      sanitaryRiskLevel: risk,
      disinfectionProtocol: protocol,
      shiftRegime: shift,
      machineryOption: machinery,
      dailyFrequency: frequency,
      targetMargin,
      indirectRate,
      sbu,
      includeFondoReserva,
      benchmarkFlatRatePerM2
    },
    factors: { kRisk, kTraffic, kProtocol, kMachinery, kFrequency },
    yieldMetrics: {
      baseYieldM2PerPost,
      coverageM2PerPost,
      effectiveYieldM2H,
      dailyInterventions: frequency,
      dailyRequiredHours,
      monthlyRequiredHours,
      operatingDaysMonth
    },
    staffingMetrics: {
      shiftRows,
      rawPostsShift1,
      weeklyCoverageHours,
      vacationRelief,
      assignedFTE: operatorFTE,
      headcount,
      supervisors,
      nocturnalShare,
      unitDayLaborCost: unitDay.totalMonthlyCost,
      unitNightLaborCost: unitFullNight.totalMonthlyCost,
      unitLaborBreakdown: unitDay
    },
    costBreakdown: {
      labor: { amount: totalLaborCost, percentage: pct(totalLaborCost), base: baseLaborCost, nightSurcharge: nightSurchargeCost, supervision: supervisionCost },
      chemicals: { amount: totalChemicalsCost, percentage: pct(totalChemicalsCost), costPerM2: chemicalCostPerM2 },
      ppe: { amount: totalPPECost, percentage: pct(totalPPECost), costPerFTE: eppPerFTE },
      equipment: { amount: totalEquipmentCost, percentage: pct(totalEquipmentCost), costPerM2: machinery.monthlyCostPerM2 },
      indirect: { amount: indirectCost, percentage: pct(indirectCost) },
      profit: { amount: grossProfit, percentage: effectiveMarginPercent },
      totalDirectCost,
      totalCost,
      recommendedSellingPrice,
      ivaAmount,
      priceWithIVA
    },
    unitEconomics: { unitPricePerM2, unitCostPerM2, costPerHour, pricePerHour },
    reference: {
      ...ref,
      percentDiffToRef,
      status: refStatus,
      statusLabel: refStatusLabel,
      marginAtReferencePrice
    },
    traditionalBenchmark: {
      ratePerM2: benchmarkFlatRatePerM2,
      totalPrice: traditionalTotalPrice,
      grossProfit: traditionalGrossProfit,
      marginPercent: traditionalMarginPercent,
      assignedFTE: traditionalAssignedFTE,
      financialDelta: recommendedSellingPrice - traditionalTotalPrice,
      fteDeficit,
      hoursDeficit,
      riskStatus,
      diagnosis: traditionalDiagnosis,
      staffCoverageIndex
    }
  };
}

/** Convierte un escenario (preset) al formato de parámetros del motor. */
export function presetToParams(p) {
  return {
    areaM2: p.areaM2,
    infrastructureTypeId: p.infrastructureType,
    trafficLevelId: p.trafficLevel,
    sanitaryRiskLevelNumber: p.sanitaryRiskLevel,
    disinfectionProtocolId: p.disinfectionProtocol,
    shiftRegimeId: p.shiftRegime,
    machineryOptionId: p.machineryOption,
    dailyFrequency: p.dailyFrequency,
    targetMargin: p.targetMargin,
    indirectRate: p.indirectRate
  };
}

/**
 * PRUEBAS AUTOMÁTICAS DE COHERENCIA (evidencia para el criterio de validación del Reto 2:
 * "coherencia entre variables, costos, margen y oferta resultante").
 */
export function runValidationSuite(currentParams) {
  const tests = [];
  const add = (group, name, pass, detail) => tests.push({ group, name, pass: Boolean(pass), detail });
  const q = (p) => calculateQuote(p);
  const near = (a, b, tol = 0.01) => Math.abs(a - b) <= tol;

  // A. Identidades contables
  const cur = q(currentParams);
  const cb = cur.costBreakdown;
  const sumParts = cb.labor.amount + cb.chemicals.amount + cb.ppe.amount + cb.equipment.amount + cb.indirect.amount + cb.profit.amount;
  add('Identidades contables', 'La suma de rubros + margen es igual al precio de venta', near(sumParts, cb.recommendedSellingPrice), `Σ = $${sumParts.toFixed(2)} vs precio $${cb.recommendedSellingPrice.toFixed(2)}`);
  add('Identidades contables', 'El margen efectivo es igual al margen objetivo', near(cb.profit.percentage, cur.inputs.targetMargin, 0.001), `${cb.profit.percentage.toFixed(3)}% vs ${cur.inputs.targetMargin}%`);
  add('Identidades contables', 'Precio unitario × área = precio total', near(cur.unitEconomics.unitPricePerM2 * cur.inputs.areaM2, cb.recommendedSellingPrice), `$${cur.unitEconomics.unitPricePerM2.toFixed(4)} × ${cur.inputs.areaM2} m²`);

  // B. Cumplimiento laboral
  const unit = calculateUnitLaborCost();
  add('Cumplimiento laboral', 'Costo empresa por FTE ≥ SBU 2026 + aporte patronal + décimos', unit.totalMonthlyCost >= L.sbuBase * (1 + L.iessPatronalRate) + L.sbuBase / 12 * 2, `$${unit.totalMonthlyCost.toFixed(2)}/mes`);
  const crit = q({ infrastructureTypeId: 'hospital_critical', areaM2: 300 });
  add('Cumplimiento laboral', 'Un servicio 24/7 tiene al menos 1 puesto por turno (≥ 4,2 FTE)', crit.staffingMetrics.assignedFTE >= 4.2, `300 m² críticos 24/7 → ${crit.staffingMetrics.assignedFTE.toFixed(2)} FTE`);
  add('Cumplimiento laboral', 'El turno nocturno incluye recargo del 25% (Art. 49)', crit.costBreakdown.labor.nightSurcharge > 0 && near(calculateUnitLaborCost({ nocturnalShare: 1 }).recargoNocturno / (L.sbuBase * 0.25), 1 + L.iessPatronalRate + L.decimoTerceroRate + L.fondoReservaRate + L.vacacionesRate, 1e-6), `Recargo nocturno mensual: $${crit.costBreakdown.labor.nightSurcharge.toFixed(2)}`);
  add('Cumplimiento laboral', 'Ningún FTE supera 40 h/semana', cur.staffingMetrics.weeklyCoverageHours / cur.staffingMetrics.assignedFTE <= 40 + 1e-6, `${(cur.staffingMetrics.weeklyCoverageHours / cur.staffingMetrics.assignedFTE).toFixed(1)} h/sem por FTE`);

  // C. Consistencia con fichas SERCOP
  for (const [area, expected] of [[3200, 3.5], [2700, 3], [1300, 1], [400, 0.5]]) {
    const r = q({ infrastructureTypeId: 'corporate_office', areaM2: area });
    add('Consistencia con fichas SERCOP', `Oficinas ${area} m² en condiciones de la ficha → ${expected} auxiliares (900 m²/aux + regla de redondeo)`, near(r.staffingMetrics.assignedFTE, expected), `Resultado: ${r.staffingMetrics.assignedFTE} FTE`);
  }
  const big = q({ infrastructureTypeId: 'industrial_logistics', areaM2: 80000, shiftRegimeId: 'diurno_5d' });
  add('Consistencia con fichas SERCOP', 'Supervisión: 1 supervisor por cada 25 auxiliares', big.staffingMetrics.supervisors === Math.ceil(big.staffingMetrics.assignedFTE / 25), `${big.staffingMetrics.assignedFTE} FTE → ${big.staffingMetrics.supervisors} supervisores`);

  // D. Monotonía (sensibilidad direccional)
  const base = { ...currentParams };
  const priceOf = (p) => q(p).unitEconomics.unitPricePerM2;
  const riskPrices = [1, 2, 3, 4, 5].map((lvl) => priceOf({ ...base, sanitaryRiskLevelNumber: lvl }));
  add('Coherencia de variables', 'Mayor riesgo sanitario ⇒ precio igual o mayor', riskPrices.every((v, i) => i === 0 || v >= riskPrices[i - 1] - 1e-9), riskPrices.map((v) => `$${v.toFixed(2)}`).join(' → '));
  const trafficPrices = ['low', 'medium', 'high', 'extreme'].map((t) => priceOf({ ...base, trafficLevelId: t }));
  add('Coherencia de variables', 'Mayor tráfico peatonal ⇒ precio igual o mayor', trafficPrices.every((v, i) => i === 0 || v >= trafficPrices[i - 1] - 1e-9), trafficPrices.map((v) => `$${v.toFixed(2)}`).join(' → '));
  const freqPrices = [1, 2, 3, 4].map((f) => priceOf({ ...base, dailyFrequency: f }));
  add('Coherencia de variables', 'Mayor frecuencia de desinfección ⇒ precio igual o mayor', freqPrices.every((v, i) => i === 0 || v >= freqPrices[i - 1] - 1e-9), freqPrices.map((v) => `$${v.toFixed(2)}`).join(' → '));
  const shiftPrices = ['diurno_5d', 'diurno_6d', 'extended_16h_7d', 'continuous_24_7'].map((s) => priceOf({ ...base, shiftRegimeId: s }));
  add('Coherencia de variables', 'Más horas de cobertura (5d → 6d → 16h/7d → 24/7) ⇒ precio mayor', shiftPrices.every((v, i) => i === 0 || v > shiftPrices[i - 1]), shiftPrices.map((v) => `$${v.toFixed(2)}`).join(' → '));
  const machFTE = ['manual', 'semi_mechanized', 'heavy_mechanized'].map((m) => q({ ...base, machineryOptionId: m }).staffingMetrics.assignedFTE);
  add('Coherencia de variables', 'Mayor mecanización ⇒ igual o menos personal', machFTE.every((v, i) => i === 0 || v <= machFTE[i - 1] + 1e-9), machFTE.map((v) => `${v} FTE`).join(' → '));
  const marginPrices = [10, 18, 25].map((m) => priceOf({ ...base, targetMargin: m }));
  add('Coherencia de variables', 'Mayor margen objetivo ⇒ mayor precio, mismo costo', marginPrices[0] < marginPrices[1] && marginPrices[1] < marginPrices[2], marginPrices.map((v) => `$${v.toFixed(2)}`).join(' → '));
  const sbuCost = [482, 500].map((s) => q({ ...base, sbu: s }).costBreakdown.totalCost);
  add('Coherencia de variables', 'Mayor SBU ⇒ mayor costo', sbuCost[1] > sbuCost[0], `$${sbuCost[0].toFixed(0)} → $${sbuCost[1].toFixed(0)}`);

  return { tests, passed: tests.filter((t) => t.pass).length, total: tests.length };
}

/** Escenarios de demostración vs referencia pública (calibración). */
export function runScenarioCalibration() {
  return REAL_PRESETS.map((p) => {
    const r = calculateQuote(presetToParams(p));
    return {
      id: p.id,
      name: p.name,
      unitPricePerM2: r.unitEconomics.unitPricePerM2,
      fte: r.staffingMetrics.assignedFTE,
      reference: r.reference,
      marginAtReferencePrice: r.reference.marginAtReferencePrice
    };
  });
}

/**
 * Análisis de sensibilidad tipo tornado: impacto en precio/m² al mover cada variable
 * a su valor mínimo y máximo, manteniendo el resto constante.
 */
export function runSensitivity(currentParams) {
  const baseResult = calculateQuote(currentParams);
  const basePrice = baseResult.unitEconomics.unitPricePerM2;
  const infra = baseResult.inputs.infrastructureType;
  const variations = [
    { label: 'Riesgo sanitario (nivel 1 ↔ 5)', low: { sanitaryRiskLevelNumber: 1 }, high: { sanitaryRiskLevelNumber: 5 } },
    { label: 'Tráfico peatonal (bajo ↔ extremo)', low: { trafficLevelId: 'low' }, high: { trafficLevelId: 'extreme' } },
    { label: 'Turnos (diurno 5d ↔ 24/7)', low: { shiftRegimeId: 'diurno_5d' }, high: { shiftRegimeId: 'continuous_24_7' } },
    { label: 'Frecuencia (1 ↔ 4 pasadas/día)', low: { dailyFrequency: 1 }, high: { dailyFrequency: 4 } },
    { label: 'Mecanización (alta ↔ manual)', low: { machineryOptionId: 'heavy_mechanized' }, high: { machineryOptionId: 'manual' } },
    { label: 'Protocolo (estándar ↔ terminal alto nivel)', low: { disinfectionProtocolId: 'standard' }, high: { disinfectionProtocolId: 'hospital_grade' } },
    { label: 'Margen objetivo (10% ↔ 25%)', low: { targetMargin: 10 }, high: { targetMargin: 25 } },
    { label: 'SBU (USD 482 ↔ 520)', low: { sbu: 482 }, high: { sbu: 520 } }
  ];
  const rows = variations.map((v) => {
    const lowP = calculateQuote({ ...currentParams, ...v.low }).unitEconomics.unitPricePerM2;
    const highP = calculateQuote({ ...currentParams, ...v.high }).unitEconomics.unitPricePerM2;
    return {
      label: v.label,
      lowPrice: lowP,
      highPrice: highP,
      lowDelta: ((lowP - basePrice) / basePrice) * 100,
      highDelta: ((highP - basePrice) / basePrice) * 100,
      span: Math.abs(highP - lowP)
    };
  });
  rows.sort((a, b) => b.span - a.span);
  return { basePrice, rows, typology: infra.name };
}

/**
 * VERIFICACIÓN DE CUMPLIMIENTO DEL PLIEGO (lógica determinística, no IA).
 * Compara los requisitos extraídos del pliego con la cotización calculada.
 * @param {object} result  resultado de calculateQuote
 * @param {object} req     requisitos normalizados (pliegoParser.normalizeExtraction().requirements)
 * @param {object} extracted valores clasificados por la IA (para comparar turnos, área y maquinaria)
 */
export function checkCompliance(result, req = {}, extracted = {}) {
  const checks = [];
  const add = (label, status, detail) => checks.push({ label, status, detail });
  const fmt = (v) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
  const sm = result.staffingMetrics;
  const cb = result.costBreakdown;

  // 1. Personal mínimo
  if (req.personal_minimo_auxiliares != null) {
    const need = req.personal_minimo_auxiliares;
    const have = sm.assignedFTE;
    if (have + 1e-9 >= need) add('Personal mínimo exigido', 'ok', `El modelo asigna ${have.toFixed(2)} FTE y el pliego exige ${need} auxiliares.`);
    else
      add(
        'Personal mínimo exigido',
        'fail',
        `El pliego exige ${need} auxiliares y el modelo calcula ${have.toFixed(2)} FTE (faltan ${(need - have).toFixed(2)}). Si se oferta con el personal exigido, la mano de obra sube aprox. ${fmt((need - have) * sm.unitDayLaborCost)}/mes.`
      );
  } else add('Personal mínimo exigido', 'info', 'El pliego no especifica personal mínimo.');

  // 2. Supervisores
  if (req.supervisores_minimos != null) {
    const need = req.supervisores_minimos;
    const have = sm.supervisors;
    if (have >= need) add('Supervisión exigida', 'ok', `${have} supervisor(es) en el modelo; el pliego exige ${need}.`);
    else add('Supervisión exigida', 'warn', `El pliego exige ${need} supervisor(es) dedicados y el modelo incluye ${have} (el modelo aplica la regla SERCOP de 1 supervisor cada 25 auxiliares).`);
  }

  // 3. Presupuesto referencial
  if (req.presupuesto_mensual != null) {
    const includesIva = req.presupuesto_incluye_iva === true;
    const price = includesIva ? cb.priceWithIVA : cb.recommendedSellingPrice;
    const diff = ((price - req.presupuesto_mensual) / req.presupuesto_mensual) * 100;
    const basis = includesIva ? 'con IVA' : 'sin IVA';
    const ivaNote = req.presupuesto_incluye_iva == null ? ' (el pliego no indica si incluye IVA; se comparó sin IVA)' : '';
    if (diff <= 0) add('Presupuesto referencial', 'ok', `Oferta ${fmt(price)}/mes ${basis} vs presupuesto ${fmt(req.presupuesto_mensual)}/mes: ${Math.abs(diff).toFixed(1)}% por debajo${ivaNote}.`);
    else add('Presupuesto referencial', 'fail', `Oferta ${fmt(price)}/mes ${basis} supera el presupuesto de ${fmt(req.presupuesto_mensual)}/mes en ${diff.toFixed(1)}%${ivaNote}.`);
  } else add('Presupuesto referencial', 'info', 'No se pudo calcular el presupuesto mensual (falta el valor total o el plazo).');

  // 4. Régimen de turnos
  if (extracted.regimen_turnos) {
    if (extracted.regimen_turnos === result.inputs.shiftRegime.id) add('Horario / turnos', 'ok', `Coincide con el pliego: ${result.inputs.shiftRegime.label}.`);
    else add('Horario / turnos', 'warn', `El pliego indica un régimen distinto al seleccionado (${result.inputs.shiftRegime.label}).`);
  }

  // 5. Área
  if (extracted.area_total_m2) {
    const d = Math.abs(result.inputs.areaM2 - extracted.area_total_m2) / extracted.area_total_m2;
    if (d <= 0.01) add('Área del servicio', 'ok', `${result.inputs.areaM2.toLocaleString('es-EC')} m², igual al pliego.`);
    else add('Área del servicio', 'warn', `Se cotizan ${result.inputs.areaM2.toLocaleString('es-EC')} m² y el pliego indica ${extracted.area_total_m2.toLocaleString('es-EC')} m².`);
  }

  // 6. Maquinaria
  const order = ['manual', 'semi_mechanized', 'heavy_mechanized'];
  if (extracted.maquinaria) {
    const need = order.indexOf(extracted.maquinaria);
    const have = order.indexOf(result.inputs.machineryOption.id);
    if (have >= need) add('Maquinaria mínima', 'ok', `${result.inputs.machineryOption.label} cumple lo exigido.`);
    else add('Maquinaria mínima', 'fail', `El pliego exige un nivel de maquinaria mayor al seleccionado (${result.inputs.machineryOption.label}).`);
  }

  const summary = {
    ok: checks.filter((c) => c.status === 'ok').length,
    warn: checks.filter((c) => c.status === 'warn').length,
    fail: checks.filter((c) => c.status === 'fail').length
  };
  return { checks, summary };
}
