import React from 'react';
import { LucideIcon } from './LucideIcon';
import { formatUSD, formatInt, formatOne, formatPct, formatDec } from '../utils/format';

const COLORS = {
  labor: '#0a6b70',
  chemicals: '#3a9a9e',
  ppe: '#7cc0c2',
  equipment: '#add8da',
  indirect: '#c3cfce',
  profit: '#7db02a'
};

/** Desglose del precio: composición, tabla de rubros y cómo se calculó. */
export function ResultsDashboard({ result }) {
  if (!result) return null;

  const { costBreakdown: cb, staffingMetrics: staff, yieldMetrics: yieldM, inputs } = result;
  const sale = cb.recommendedSellingPrice;

  const parts = [
    { key: 'labor', label: 'Mano de obra', pct: cb.labor.percentage },
    { key: 'chemicals', label: 'Insumos químicos', pct: cb.chemicals.percentage },
    { key: 'ppe', label: 'EPP y bioseguridad', pct: cb.ppe.percentage },
    { key: 'equipment', label: 'Maquinaria y equipos', pct: cb.equipment.percentage },
    { key: 'indirect', label: 'Costos indirectos', pct: cb.indirect.percentage },
    { key: 'profit', label: 'Utilidad', pct: cb.profit.percentage }
  ];

  return (
    <div id="cost-breakdown-panel">
      <div>
        <h3 className="section-title">De qué se compone el precio</h3>
        <p className="section-lead">Cada dólar de la oferta, repartido entre costos directos, indirectos y utilidad.</p>

        <div className="stack-bar" role="img" aria-label="Composición porcentual del precio de venta">
          {parts.map((p) => (
            <div key={p.key} style={{ width: `${p.pct}%`, background: COLORS[p.key] }} title={`${p.label}: ${formatPct(p.pct)}`} />
          ))}
        </div>

        <div className="legend">
          {parts.map((p) => (
            <span className="legend-item" key={p.key}>
              <i style={{ background: COLORS[p.key] }} />
              {p.label}
              <b>{formatPct(p.pct)}</b>
            </span>
          ))}
        </div>
      </div>

      <div className="table-wrap" style={{ marginTop: '2rem' }}>
        <table className="table" id="cost-breakdown-table">
          <thead>
            <tr>
              <th>Rubro</th>
              <th>Cómo se calcula</th>
              <th className="num">Mensual</th>
              <th className="num">% de la oferta</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                Mano de obra directa
                <span className="row-note">
                  {formatOne(staff.assignedFTE)} operarios con SBU, IESS patronal 12,15 %, 13º, 14º y fondos de reserva
                </span>
              </td>
              <td>
                {formatOne(staff.assignedFTE)} FTE × {formatUSD(staff.unitDayLaborCost)} al mes
              </td>
              <td className="num">{formatUSD(cb.labor.amount)}</td>
              <td className="num">{formatPct(cb.labor.percentage)}</td>
            </tr>
            <tr>
              <td>
                Insumos químicos y desinfectantes
                <span className="row-note">{inputs.disinfectionProtocol.chemicalProduct}</span>
              </td>
              <td>
                ${formatDec(cb.chemicals.costPerM2, 3)} por m² × {formatInt(inputs.areaM2)} m²
              </td>
              <td className="num">{formatUSD(cb.chemicals.amount)}</td>
              <td className="num">{formatPct(cb.chemicals.percentage)}</td>
            </tr>
            <tr>
              <td>
                EPP y bioseguridad ocupacional
                <span className="row-note">
                  Riesgo nivel {inputs.sanitaryRiskLevel.level}, {formatUSD(cb.ppe.costPerFTE)} por operario al mes
                </span>
              </td>
              <td>{formatOne(staff.assignedFTE)} FTE protegidos</td>
              <td className="num">{formatUSD(cb.ppe.amount)}</td>
              <td className="num">{formatPct(cb.ppe.percentage)}</td>
            </tr>
            <tr>
              <td>
                Equipamiento y amortización de maquinaria
                <span className="row-note">{inputs.machineryOption.label}</span>
              </td>
              <td>
                ${formatDec(inputs.machineryOption.monthlyCostPerM2, 2)} por m² × {formatInt(inputs.areaM2)} m²
              </td>
              <td className="num">{formatUSD(cb.equipment.amount)}</td>
              <td className="num">{formatPct(cb.equipment.percentage)}</td>
            </tr>
            <tr className="subtotal">
              <td>Subtotal de costos directos</td>
              <td>Mano de obra, insumos, EPP y equipos</td>
              <td className="num">{formatUSD(cb.totalDirectCost)}</td>
              <td className="num">{formatPct((cb.totalDirectCost / sale) * 100)}</td>
            </tr>
            <tr>
              <td>Gastos indirectos y supervisión central</td>
              <td>{inputs.indirectRate} % sobre el costo directo</td>
              <td className="num">{formatUSD(cb.indirect.amount)}</td>
              <td className="num">{formatPct(cb.indirect.percentage)}</td>
            </tr>
            <tr className="subtotal">
              <td>Costo técnico total</td>
              <td>Directos más indirectos</td>
              <td className="num">{formatUSD(cb.totalCost)}</td>
              <td className="num">{formatPct((cb.totalCost / sale) * 100)}</td>
            </tr>
            <tr>
              <td>Margen de rentabilidad (utilidad bruta)</td>
              <td>{formatPct(cb.profit.percentage)} sobre el valor de venta</td>
              <td className="num">{formatUSD(cb.profit.amount)}</td>
              <td className="num">{formatPct(cb.profit.percentage)}</td>
            </tr>
            <tr className="total">
              <td>Oferta técnico-financiera total</td>
              <td>Precio sugerido</td>
              <td className="num">{formatUSD(sale)}</td>
              <td className="num">100,0 %</td>
            </tr>
          </tbody>
        </table>
      </div>

      <details className="fold" id="formula-engine-banner">
        <summary>
          Cómo se calculó el rendimiento
          <LucideIcon name="ChevronDown" />
        </summary>
        <div className="fold-body">
          <div className="formula">
            <p>
              Rendimiento efectivo = (R_base × k_maquinaria) ÷ (k_riesgo × k_tráfico × k_protocolo)
            </p>
            <p className="muted">
              ({yieldM.baseYieldM2H} m²/h × {formatDec(yieldM.yieldBonusFactor)}) ÷ ({formatDec(inputs.sanitaryRiskLevel.factor)} ×{' '}
              {formatDec(inputs.trafficLevel.factor)} × {formatDec(yieldM.protocolTimeFactor)}) ={' '}
              <strong>{formatDec(yieldM.effectiveYieldM2H, 1)} m²/h</strong>
            </p>
            <p className="muted">
              Piso de cobertura continua = horas de operación al mes ÷ 160 h por operario
              {staff.coverageFloorFTE > 0 ? ` = ${formatOne(staff.coverageFloorFTE)} FTE` : ' (no aplica en este régimen)'}
            </p>
          </div>
          <p className="note" style={{ marginTop: '0.75rem' }}>
            El factor de protocolo (k_protocolo) es un supuesto: 2 % más de tiempo de trabajo por cada minuto de contacto sobre
            el protocolo estándar. Conviene validarlo con una empresa del sector.
          </p>
        </div>
      </details>
    </div>
  );
}
