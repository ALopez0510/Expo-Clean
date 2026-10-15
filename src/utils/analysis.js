/**
 * Análisis sobre el motor de cálculo: sensibilidad, pruebas de coherencia y contraste
 * de los casos de referencia con las bandas SERCOP. Todo se calcula en vivo con calculateQuote.
 */
import { calculateQuote } from './calculator.js';
import { formatDec } from './format.js';
import {
  REAL_PRESETS,
  DISINFECTION_PROTOCOLS,
  SHIFT_REGIMES,
  ECUADOR_LABOR_CONFIG
} from '../data/parametricData.js';

export const FLAT_RATE_REFERENCE = 1.25;

/** Convierte un caso de referencia en el estado del formulario. */
export function presetToState(preset) {
  return {
    projectName: preset.name,
    infrastructureTypeId: preset.infrastructureType,
    areaM2: preset.areaM2,
    sanitaryRiskLevelNumber: preset.sanitaryRiskLevel,
    trafficLevelId: preset.trafficLevel,
    disinfectionProtocolId: preset.disinfectionProtocol,
    shiftRegimeId: preset.shiftRegime,
    machineryOptionId: preset.machineryOption,
    targetMargin: preset.targetMargin,
    indirectRate: preset.indirectRate,
    benchmarkFlatRatePerM2: FLAT_RATE_REFERENCE
  };
}

/** Posición exacta del precio respecto de la banda referencial. */
export function bandPosition(price, band) {
  if (!band) return { id: 'unknown', label: 'Sin referencia' };
  const { minRateM2: min, maxRateM2: max } = band;
  if (price >= min && price <= max) return { id: 'inside', label: 'Dentro de la banda' };
  if (price >= min * 0.9 && price <= max * 1.1) {
    return { id: 'near', label: price < min ? 'Apenas bajo la banda' : 'Apenas sobre la banda' };
  }
  return { id: 'outside', label: price < min ? 'Bajo la banda' : 'Sobre la banda' };
}

/** "$4.20 - $5.50 /m²" -> { min: 4.2, max: 5.5 } */
export function parseRange(text) {
  const m = String(text || '').match(/([\d]+(?:[.,]\d+)?)\s*[-–—]\s*\$?\s*([\d]+(?:[.,]\d+)?)/);
  if (!m) return null;
  const toNum = (s) => Number(s.replace(',', '.'));
  return { min: toNum(m[1]), max: toNum(m[2]) };
}

const priceOf = (state) => calculateQuote(state).unitEconomics.unitPricePerM2;

/** Cuánto se mueve el precio por m² cuando cada variable pasa de un extremo al otro. */
export function buildSensitivity(state) {
  const base = priceOf(state);
  const area = Number(state.areaM2) || 1000;

  const scenarios = [
    {
      id: 'riesgo',
      label: 'Riesgo sanitario',
      a: { label: 'Nivel 1', patch: { sanitaryRiskLevelNumber: 1 } },
      b: { label: 'Nivel 5', patch: { sanitaryRiskLevelNumber: 5 } }
    },
    {
      id: 'turnos',
      label: 'Turnos',
      a: { label: 'Diurno, 5 días', patch: { shiftRegimeId: 'diurno_5d' } },
      b: { label: 'Continuo 24/7', patch: { shiftRegimeId: 'continuous_24_7' } }
    },
    {
      id: 'trafico',
      label: 'Tráfico peatonal',
      a: { label: 'Bajo', patch: { trafficLevelId: 'low' } },
      b: { label: 'Extremo', patch: { trafficLevelId: 'extreme' } }
    },
    {
      id: 'protocolo',
      label: 'Protocolo de desinfección',
      a: { label: 'Estándar', patch: { disinfectionProtocolId: 'standard' } },
      b: { label: 'Hospitalario', patch: { disinfectionProtocolId: 'hospital_grade' } }
    },
    {
      id: 'mecanizacion',
      label: 'Mecanización',
      a: { label: 'Alta', patch: { machineryOptionId: 'heavy_mechanized' } },
      b: { label: 'Manual', patch: { machineryOptionId: 'manual' } }
    },
    {
      id: 'metraje',
      label: 'Metraje',
      a: { label: 'El doble', patch: { areaM2: area * 2 } },
      b: { label: 'La mitad', patch: { areaM2: Math.max(50, Math.round(area / 2)) } }
    },
    {
      id: 'margen',
      label: 'Margen deseado',
      a: { label: '10 %', patch: { targetMargin: 10 } },
      b: { label: '25 %', patch: { targetMargin: 25 } }
    },
    {
      id: 'indirectos',
      label: 'Costos indirectos',
      a: { label: '6 %', patch: { indirectRate: 6 } },
      b: { label: '14 %', patch: { indirectRate: 14 } }
    }
  ];

  const rows = scenarios.map((s) => {
    const pa = priceOf({ ...state, ...s.a.patch });
    const pb = priceOf({ ...state, ...s.b.patch });
    const da = (pa / base - 1) * 100;
    const db = (pb / base - 1) * 100;
    return {
      id: s.id,
      label: s.label,
      a: { label: s.a.label, price: pa, delta: da },
      b: { label: s.b.label, price: pb, delta: db },
      span: Math.max(Math.abs(da), Math.abs(db))
    };
  });

  rows.sort((x, y) => y.span - x.span);
  return { base, rows };
}

/**
 * Pruebas internas de coherencia: no comparan con el mundo real,
 * comprueban que el modelo se comporta como se espera al mover cada variable.
 */
export function runCoherenceChecks(state) {
  const q = calculateQuote(state);
  const checks = [];

  const fmt = (arr) => arr.map((p) => `$${formatDec(p)}`).join(' → ');

  const monotonic = (id, label, key, values) => {
    const prices = values.map((v) => priceOf({ ...state, [key]: v }));
    const ok = prices.every((p, i) => i === 0 || p >= prices[i - 1] - 1e-9);
    checks.push({ id, label, ok, detail: fmt(prices) });
  };

  monotonic('riesgo', 'Más riesgo sanitario no baja el precio', 'sanitaryRiskLevelNumber', [1, 2, 3, 4, 5]);
  monotonic('trafico', 'Más tráfico peatonal no baja el precio', 'trafficLevelId', ['low', 'medium', 'high', 'extreme']);

  // Cadena sanitaria de exigencia creciente. El protocolo industrial es de otro tipo y no entra en la comparación.
  const sanitaryChain = ['standard', 'food_safe', 'clinical_intermediate', 'hospital_grade'].filter(
    (id) => DISINFECTION_PROTOCOLS[id]
  );
  monotonic('protocolo', 'Un protocolo sanitario más exigente no baja el precio', 'disinfectionProtocolId', sanitaryChain);

  const shiftsByHours = Object.values(SHIFT_REGIMES)
    .sort((a, b) => a.operatingDaysMonth * a.hoursPerDay - b.operatingDaysMonth * b.hoursPerDay)
    .map((s) => s.id);
  monotonic('turnos', 'Más horas de operación no bajan el precio', 'shiftRegimeId', shiftsByHours);

  const fteByMachinery = ['manual', 'semi_mechanized', 'heavy_mechanized'].map(
    (m) => calculateQuote({ ...state, machineryOptionId: m }).staffingMetrics.assignedFTE
  );
  checks.push({
    id: 'mecanizacion',
    label: 'Más mecanización no aumenta el personal',
    ok: fteByMachinery.every((f, i) => i === 0 || f <= fteByMachinery[i - 1] + 1e-9),
    detail: fteByMachinery.map((f) => `${formatDec(f, 1)} FTE`).join(' → ')
  });

  const cb = q.costBreakdown;
  const parts = cb.labor.amount + cb.chemicals.amount + cb.ppe.amount + cb.equipment.amount + cb.indirect.amount + cb.profit.amount;
  checks.push({
    id: 'suma',
    label: 'Los rubros suman exactamente el precio de venta',
    ok: Math.abs(parts - cb.recommendedSellingPrice) < 0.01,
    detail: `${formatDec(parts)} frente a ${formatDec(cb.recommendedSellingPrice)}`
  });

  checks.push({
    id: 'margen',
    label: 'El margen resultante coincide con el margen deseado',
    ok: Math.abs(cb.profit.percentage - Math.min(Math.max(state.targetMargin, 0), 80)) < 0.05,
    detail: `${formatDec(cb.profit.percentage, 1)} % frente a ${state.targetMargin} %`
  });

  checks.push({
    id: 'piso',
    label: 'El personal cubre el piso de operación continua',
    ok: q.staffingMetrics.assignedFTE + 1e-9 >= q.staffingMetrics.coverageFloorFTE,
    detail: `${formatDec(q.staffingMetrics.assignedFTE, 1)} FTE, piso ${formatDec(q.staffingMetrics.coverageFloorFTE, 1)}`
  });

  checks.push({
    id: 'salario',
    label: 'El costo por operario no baja del SBU',
    ok: q.staffingMetrics.unitDayLaborCost >= ECUADOR_LABOR_CONFIG.sbuBase,
    detail: `$${formatDec(q.staffingMetrics.unitDayLaborCost)} frente a SBU $${formatDec(ECUADOR_LABOR_CONFIG.sbuBase)}`
  });

  return checks;
}

/** Los 6 casos de referencia frente a su banda SERCOP. */
export function presetContrast() {
  return REAL_PRESETS.map((p) => {
    const q = calculateQuote(presetToState(p));
    const band = q.sercopBenchmark;
    const price = q.unitEconomics.unitPricePerM2;
    return {
      id: p.id,
      name: p.name,
      areaM2: p.areaM2,
      price,
      min: band.minRateM2,
      max: band.maxRateM2,
      avg: band.avgRateM2,
      diffAvgPct: band.percentDiffToSercopAvg,
      position: bandPosition(price, band),
      floorApplied: q.staffingMetrics.coverageFloorApplied,
      flatLoss: q.traditionalBenchmark.grossProfit
    };
  });
}
