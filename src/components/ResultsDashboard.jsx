import React from 'react';
import { LucideIcon } from './LucideIcon';

export function ResultsDashboard({ result }) {
  if (!result) return null;

  const {
    costBreakdown,
    unitEconomics,
    staffingMetrics,
    yieldMetrics,
    inputs
  } = result;

  const formatUSD = (val) =>
    new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);

  return (
    <section className="glass-card" id="results-dashboard-panel">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon-badge">
            <LucideIcon name="BarChart3" size={18} />
          </div>
          <div>
            <h2>Estructuración Técnico-Financiera</h2>
            <p className="card-subtitle">
              Cálculo paramétrico de costos unitarios, personal e insumos
            </p>
          </div>
        </div>
        <div className="price-tag-summary">
          <span className="price-tag-label">Precio Propuesta Final</span>
          <div className="price-tag-amount">
            {formatUSD(costBreakdown.recommendedSellingPrice)}
            <span className="price-tag-period"> /mes</span>
          </div>
        </div>
      </div>

      {/* KPI CARDS GRID */}
      <div className="kpi-cards-grid">
        {/* KPI 1 */}
        <div className="kpi-card highlight" id="kpi-unit-price-card">
          <div className="kpi-top-row">
            <span className="kpi-label">Costo Unitario m²</span>
            <div className="kpi-icon-bubble emerald">
              <LucideIcon name="DollarSign" size={16} />
            </div>
          </div>
          <div className="kpi-value">{formatUSD(unitEconomics.unitPricePerM2)}</div>
          <div className="kpi-subtext">
            <span>Base técnica: {formatUSD(unitEconomics.unitCostPerM2)}/m²</span>
          </div>
          {result.sercopBenchmark && (
            <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid #e2e8f0', fontSize: '0.72rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
              <LucideIcon name="ShieldCheck" size={12} />
              <span>Banda SERCOP: ${result.sercopBenchmark.minRateM2.toFixed(2)} - ${result.sercopBenchmark.maxRateM2.toFixed(2)}/m²</span>
            </div>
          )}
        </div>

        {/* KPI 2 */}
        <div className="kpi-card" id="kpi-staffing-card">
          <div className="kpi-top-row">
            <span className="kpi-label">Personal Asignado</span>
            <div className="kpi-icon-bubble blue">
              <LucideIcon name="Users" size={16} />
            </div>
          </div>
          <div className="kpi-value">
            {staffingMetrics.assignedFTE.toFixed(1)} <span className="kpi-unit">FTE</span>
          </div>
          <div className="kpi-subtext">
            <span>{staffingMetrics.dayFTE.toFixed(1)} Diurnos • {staffingMetrics.nightFTE.toFixed(1)} Nocturnos</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="kpi-card" id="kpi-hours-card">
          <div className="kpi-top-row">
            <span className="kpi-label">Horas Operativas</span>
            <div className="kpi-icon-bubble cyan">
              <LucideIcon name="Clock" size={16} />
            </div>
          </div>
          <div className="kpi-value">
            {Math.round(yieldMetrics.monthlyRequiredHours)}{' '}
            <span className="kpi-unit">h/mes</span>
          </div>
          <div className="kpi-subtext">
            <span>{yieldMetrics.dailyInterventions} pasadas/día ({Math.round(yieldMetrics.dailyRequiredHours)}h/día)</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="kpi-card" id="kpi-profit-card">
          <div className="kpi-top-row">
            <span className="kpi-label">Utilidad Bruta Proyectada</span>
            <div className="kpi-icon-bubble green">
              <LucideIcon name="TrendingUp" size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#059669' }}>
            {formatUSD(costBreakdown.profit.amount)}
          </div>
          <div className="kpi-subtext">
            <span>Margen blindado: {costBreakdown.profit.percentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* PARAMETRIC FORMULA COMPUTATIONAL BANNER */}
      <div className="formula-engine-banner" id="formula-engine-banner">
        <div className="formula-display">
          <div className="formula-badge">
            <LucideIcon name="Cpu" size={13} /> MOTOR PARAMÉTRICO PRO
          </div>
          <div className="formula-text">
            Rendimiento Efectivo = <strong>(R_base × k_maquinaria) ÷ (k_riesgo × k_tráfico)</strong>
            <div className="formula-subcalc">
              ({yieldMetrics.baseYieldM2H} m²/h × {yieldMetrics.yieldBonusFactor.toFixed(2)}) ÷ ({inputs.sanitaryRiskLevel.factor.toFixed(2)} × {inputs.trafficLevel.factor.toFixed(2)})
            </div>
          </div>
        </div>
        <div className="formula-calc-result">
          <div className="formula-result-label">Rendimiento Operativo:</div>
          <div className="formula-result-val">
            {yieldMetrics.effectiveYieldM2H.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>m²/h</span>
          </div>
        </div>
      </div>

      {/* SERCOP OFFICIAL BENCHMARK VALIDATION CARD */}
      {result.sercopBenchmark && (
        <div className="sercop-benchmark-panel" id="sercop-benchmark-panel">
          <div className="sercop-panel-header">
            <div className="sercop-title-row">
              <span className="sercop-cpc-pill">
                <LucideIcon name="ShieldCheck" size={13} /> CPC {result.sercopBenchmark.cpcCode}
              </span>
              <span className="sercop-status-pill">
                <LucideIcon name="CheckCircle2" size={13} /> {result.sercopBenchmark.statusLabel}
              </span>
            </div>
            <div className="sercop-source-badge">
              <LucideIcon name="ExternalLink" size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
              Compras Públicas Ecuador (SERCOP)
            </div>
          </div>

          <div className="sercop-comparison-grid">
            <div className="sercop-metric-cell">
              <span className="sercop-cell-label">Banda Oficial SERCOP:</span>
              <div className="sercop-cell-value">
                {formatUSD(result.sercopBenchmark.minRateM2)} - {formatUSD(result.sercopBenchmark.maxRateM2)}
                <span className="sercop-cell-unit"> /m²</span>
              </div>
              <span className="sercop-cell-hint">Promedio estatal: {formatUSD(result.sercopBenchmark.avgRateM2)}/m²</span>
            </div>

            <div className="sercop-metric-cell highlight">
              <span className="sercop-cell-label">Propuesta CleanQuote:</span>
              <div className="sercop-cell-value" style={{ color: '#059669' }}>
                {formatUSD(unitEconomics.unitPricePerM2)}
                <span className="sercop-cell-unit"> /m²</span>
              </div>
              <span className="sercop-cell-hint" style={{ color: '#059669', fontWeight: 600 }}>
                {result.sercopBenchmark.deltaToSercopAvg >= 0 ? '+' : ''}{formatUSD(result.sercopBenchmark.deltaToSercopAvg)} vs. prom. ({result.sercopBenchmark.percentDiffToSercopAvg >= 0 ? '+' : ''}{result.sercopBenchmark.percentDiffToSercopAvg.toFixed(1)}%)
              </span>
            </div>

            <div className="sercop-metric-cell">
              <span className="sercop-cell-label">Mercado Privado (FEDELIMP):</span>
              <div className="sercop-cell-value" style={{ color: '#475569' }}>
                {result.sercopBenchmark.privateMarketRate}
              </div>
              <span className="sercop-cell-hint">Sector corporativo privado</span>
            </div>
          </div>

          <div className="sercop-details-footer">
            <div className="sercop-detail-item">
              <strong>Rendimiento Normado SERCOP:</strong> {result.sercopBenchmark.normativeYield}
            </div>
            <div className="sercop-detail-item">
              <strong>Sueldo Legal Garantizado:</strong> {result.sercopBenchmark.legalWageCompliance}
            </div>
            <div className="sercop-detail-item" style={{ gridColumn: 'span 2' }}>
              <strong>Base Contractual Oficial:</strong> {result.sercopBenchmark.source}
            </div>
          </div>
        </div>
      )}

      {/* COST DISTRIBUTION VISUAL BAR */}
      <div className="cost-distribution-wrapper">
        <div className="distribution-header">
          <h4 className="distribution-title">
            <LucideIcon name="Layers" size={14} /> Composición Porcentual del Precio de Venta
          </h4>
          <span className="distribution-total">100% de la Oferta Técnica</span>
        </div>

        <div className="cost-bar-container" title="Distribución de costos y margen">
          <div
            className="cost-bar-segment"
            style={{ width: `${costBreakdown.labor.percentage}%`, background: '#2563eb' }}
            data-tooltip={`Mano de Obra: ${costBreakdown.labor.percentage.toFixed(1)}%`}
          />
          <div
            className="cost-bar-segment"
            style={{ width: `${costBreakdown.chemicals.percentage}%`, background: '#0284c7' }}
            data-tooltip={`Insumos Químicos: ${costBreakdown.chemicals.percentage.toFixed(1)}%`}
          />
          <div
            className="cost-bar-segment"
            style={{ width: `${costBreakdown.ppe.percentage}%`, background: '#7c3aed' }}
            data-tooltip={`EPP y Bioseguridad: ${costBreakdown.ppe.percentage.toFixed(1)}%`}
          />
          <div
            className="cost-bar-segment"
            style={{ width: `${costBreakdown.equipment.percentage}%`, background: '#d97706' }}
            data-tooltip={`Maquinaria & Equipos: ${costBreakdown.equipment.percentage.toFixed(1)}%`}
          />
          <div
            className="cost-bar-segment"
            style={{ width: `${costBreakdown.indirect.percentage}%`, background: '#64748b' }}
            data-tooltip={`Costos Indirectos: ${costBreakdown.indirect.percentage.toFixed(1)}%`}
          />
          <div
            className="cost-bar-segment"
            style={{ width: `${costBreakdown.profit.percentage}%`, background: '#059669' }}
            data-tooltip={`Margen Utilidad: ${costBreakdown.profit.percentage.toFixed(1)}%`}
          />
        </div>

        {/* Legend */}
        <div className="cost-legend-grid">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#2563eb' }}></span> Mano de Obra ({costBreakdown.labor.percentage.toFixed(1)}%)
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#0284c7' }}></span> Insumos Químicos ({costBreakdown.chemicals.percentage.toFixed(1)}%)
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#7c3aed' }}></span> EPP & Bioseguridad ({costBreakdown.ppe.percentage.toFixed(1)}%)
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#d97706' }}></span> Maquinaria ({costBreakdown.equipment.percentage.toFixed(1)}%)
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#64748b' }}></span> Indirectos ({costBreakdown.indirect.percentage.toFixed(1)}%)
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#059669' }}></span> Margen Utilidad ({costBreakdown.profit.percentage.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* DETAILED COST TABLE */}
      <table className="data-table" id="cost-breakdown-table">
        <thead>
          <tr>
            <th>Rubro Operativo</th>
            <th>Base de Asignación</th>
            <th className="num-cell">Valor Mensual</th>
            <th className="num-cell">% Oferta</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div className="table-item-title">
                <LucideIcon name="Users" size={14} className="table-icon blue" />
                <strong>1. Mano de Obra Directa (MDO)</strong>
              </div>
              <div className="table-item-desc">
                {staffingMetrics.assignedFTE.toFixed(1)} operarios FTE (SBU Ecuador, IESS 12.15%, 13º, 14º, fondos reserva)
              </div>
            </td>
            <td>{staffingMetrics.assignedFTE.toFixed(1)} FTE × ${staffingMetrics.unitDayLaborCost.toFixed(2)}/mes</td>
            <td className="num-cell">{formatUSD(costBreakdown.labor.amount)}</td>
            <td className="num-cell">{costBreakdown.labor.percentage.toFixed(1)}%</td>
          </tr>

          <tr>
            <td>
              <div className="table-item-title">
                <LucideIcon name="FlaskConical" size={14} className="table-icon cyan" />
                <strong>2. Insumos Químicos y Desinfectantes</strong>
              </div>
              <div className="table-item-desc">
                {inputs.disinfectionProtocol.chemicalProduct}
              </div>
            </td>
            <td>${costBreakdown.chemicals.costPerM2.toFixed(3)}/m² × {inputs.areaM2} m²</td>
            <td className="num-cell">{formatUSD(costBreakdown.chemicals.amount)}</td>
            <td className="num-cell">{costBreakdown.chemicals.percentage.toFixed(1)}%</td>
          </tr>

          <tr>
            <td>
              <div className="table-item-title">
                <LucideIcon name="ShieldAlert" size={14} className="table-icon purple" />
                <strong>3. EPP y Bioseguridad Ocupacional</strong>
              </div>
              <div className="table-item-desc">
                Riesgo Nivel {inputs.sanitaryRiskLevel.level} ({costBreakdown.ppe.costPerFTE.toFixed(2)} $/FTE/mes)
              </div>
            </td>
            <td>{staffingMetrics.assignedFTE.toFixed(1)} FTE protegidos</td>
            <td className="num-cell">{formatUSD(costBreakdown.ppe.amount)}</td>
            <td className="num-cell">{costBreakdown.ppe.percentage.toFixed(1)}%</td>
          </tr>

          <tr>
            <td>
              <div className="table-item-title">
                <LucideIcon name="Cpu" size={14} className="table-icon amber" />
                <strong>4. Equipamiento y Amortización de Maquinaria</strong>
              </div>
              <div className="table-item-desc">
                {inputs.machineryOption.label}
              </div>
            </td>
            <td>${inputs.machineryOption.monthlyCostPerM2.toFixed(2)}/m² × {inputs.areaM2} m²</td>
            <td className="num-cell">{formatUSD(costBreakdown.equipment.amount)}</td>
            <td className="num-cell">{costBreakdown.equipment.percentage.toFixed(1)}%</td>
          </tr>

          <tr className="subtotal-row">
            <td>
              <strong>SUBTOTAL COSTOS DIRECTOS</strong>
            </td>
            <td>Mano de Obra + Insumos + EPP + Equipos</td>
            <td className="num-cell" style={{ color: '#0284c7' }}>{formatUSD(costBreakdown.totalDirectCost)}</td>
            <td className="num-cell">{((costBreakdown.totalDirectCost / costBreakdown.recommendedSellingPrice) * 100).toFixed(1)}%</td>
          </tr>

          <tr>
            <td>
              <div className="table-item-title">
                <LucideIcon name="Percent" size={14} className="table-icon gray" />
                <strong>5. Gastos Indirectos y Supervisión Central</strong>
              </div>
            </td>
            <td>{inputs.indirectRate}% sobre costo directo</td>
            <td className="num-cell">{formatUSD(costBreakdown.indirect.amount)}</td>
            <td className="num-cell">{costBreakdown.indirect.percentage.toFixed(1)}%</td>
          </tr>

          <tr className="technical-cost-row">
            <td>
              <strong>COSTO TÉCNICO TOTAL</strong>
            </td>
            <td>Directos + Indirectos</td>
            <td className="num-cell">{formatUSD(costBreakdown.totalCost)}</td>
            <td className="num-cell">{((costBreakdown.totalCost / costBreakdown.recommendedSellingPrice) * 100).toFixed(1)}%</td>
          </tr>

          <tr className="profit-row">
            <td>
              <div className="table-item-title">
                <LucideIcon name="TrendingUp" size={14} className="table-icon emerald" />
                <strong style={{ color: '#059669' }}>6. Margen de Rentabilidad (Utilidad Bruta)</strong>
              </div>
            </td>
            <td>{costBreakdown.profit.percentage.toFixed(1)}% sobre valor de venta</td>
            <td className="num-cell" style={{ color: '#059669' }}>{formatUSD(costBreakdown.profit.amount)}</td>
            <td className="num-cell" style={{ color: '#059669' }}>{costBreakdown.profit.percentage.toFixed(1)}%</td>
          </tr>

          <tr className="total-row">
            <td>
              <strong style={{ color: '#0f172a' }}>OFERTA TÉCNICO-FINANCIERA TOTAL</strong>
            </td>
            <td>Precio sugerido de licitación</td>
            <td className="num-cell" style={{ color: '#059669', fontSize: '1.15rem' }}>
              {formatUSD(costBreakdown.recommendedSellingPrice)}
            </td>
            <td className="num-cell" style={{ color: '#059669' }}>100.0%</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
