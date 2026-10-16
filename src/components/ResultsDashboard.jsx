import React, { useMemo } from 'react';
import { LucideIcon } from './LucideIcon';
import { SOURCES, SOURCE_TYPE_LABELS, ASSUMPTIONS, ECUADOR_LABOR_CONFIG } from '../data/parametricData.js';
import { runValidationSuite, runSensitivity, runScenarioCalibration, calculateUnitLaborCost } from '../utils/calculator.js';

export const formatUSD = (val) =>
  new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);

export function SourceTypeBadge({ type }) {
  const t = SOURCE_TYPE_LABELS[type] || SOURCE_TYPE_LABELS.estimacion;
  return (
    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: t.color, background: t.bg, border: `1px solid ${t.color}33`, padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
      {t.label}
    </span>
  );
}

const statusColors = {
  within: { color: '#059669', bg: '#ecfdf5', icon: 'CheckCircle2' },
  below: { color: '#0284c7', bg: '#eff6ff', icon: 'Info' },
  above: { color: '#d97706', bg: '#fffbeb', icon: 'AlertTriangle' }
};

export function ResultsDashboard({ result }) {
  if (!result) return null;

  const { costBreakdown, unitEconomics, staffingMetrics, yieldMetrics, inputs, reference, factors } = result;
  const st = statusColors[reference.status];

  return (
    <section className="glass-card" id="results-dashboard-panel">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon-badge">
            <LucideIcon name="BarChart3" size={18} />
          </div>
          <div>
            <h2>Estructuración Técnico-Financiera</h2>
            <p className="card-subtitle">Cálculo paramétrico de costos unitarios, personal e insumos</p>
          </div>
        </div>
        <div className="price-tag-summary">
          <span className="price-tag-label">Precio mensual (sin IVA)</span>
          <div className="price-tag-amount">
            {formatUSD(costBreakdown.recommendedSellingPrice)}
            <span className="price-tag-period"> /mes</span>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-cards-grid">
        <div className="kpi-card highlight" id="kpi-unit-price-card">
          <div className="kpi-top-row">
            <span className="kpi-label">Precio Unitario m²</span>
            <div className="kpi-icon-bubble emerald">
              <LucideIcon name="DollarSign" size={16} />
            </div>
          </div>
          <div className="kpi-value">{formatUSD(unitEconomics.unitPricePerM2)}</div>
          <div className="kpi-subtext">
            <span>Costo técnico: {formatUSD(unitEconomics.unitCostPerM2)}/m²</span>
          </div>
        </div>

        <div className="kpi-card" id="kpi-staffing-card">
          <div className="kpi-top-row">
            <span className="kpi-label">Personal Requerido</span>
            <div className="kpi-icon-bubble blue">
              <LucideIcon name="Users" size={16} />
            </div>
          </div>
          <div className="kpi-value">
            {staffingMetrics.assignedFTE.toFixed(2)} <span className="kpi-unit">FTE</span>
          </div>
          <div className="kpi-subtext">
            <span>
              {staffingMetrics.shiftRows.map((r) => r.posts).join(' + ')} puestos/turno
              {staffingMetrics.supervisors > 0 ? ` • ${staffingMetrics.supervisors} supervisor(es)` : ''}
            </span>
          </div>
        </div>

        <div className="kpi-card" id="kpi-hours-card">
          <div className="kpi-top-row">
            <span className="kpi-label">Horas de Cobertura</span>
            <div className="kpi-icon-bubble cyan">
              <LucideIcon name="Clock" size={16} />
            </div>
          </div>
          <div className="kpi-value">
            {Math.round(yieldMetrics.monthlyRequiredHours)} <span className="kpi-unit">h/mes</span>
          </div>
          <div className="kpi-subtext">
            <span>
              {yieldMetrics.dailyInterventions} pasadas/día • {(staffingMetrics.nocturnalShare * 100).toFixed(0)}% horas nocturnas
            </span>
          </div>
        </div>

        <div className="kpi-card" id="kpi-profit-card">
          <div className="kpi-top-row">
            <span className="kpi-label">Utilidad Bruta (antes de impuestos)</span>
            <div className="kpi-icon-bubble green">
              <LucideIcon name="TrendingUp" size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#059669' }}>
            {formatUSD(costBreakdown.profit.amount)}
          </div>
          <div className="kpi-subtext">
            <span>Margen sobre precio: {costBreakdown.profit.percentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* FORMULA BANNER */}
      <div className="formula-engine-banner" id="formula-engine-banner">
        <div className="formula-display">
          <div className="formula-badge">
            <LucideIcon name="Cpu" size={13} /> MOTOR PARAMÉTRICO
          </div>
          <div className="formula-text">
            Cobertura por auxiliar/turno = <strong>(R_base × k_maq × k_protocolo) ÷ (k_riesgo × k_tráfico × k_frecuencia)</strong>
            <div className="formula-subcalc">
              ({yieldMetrics.baseYieldM2PerPost} m² × {factors.kMachinery.toFixed(2)} × {factors.kProtocol.toFixed(2)}) ÷ ({factors.kRisk.toFixed(2)} × {factors.kTraffic.toFixed(2)} × {factors.kFrequency.toFixed(2)})
            </div>
          </div>
        </div>
        <div className="formula-calc-result">
          <div className="formula-result-label">Cobertura efectiva:</div>
          <div className="formula-result-val">
            {Math.round(yieldMetrics.coverageM2PerPost).toLocaleString('es-EC')} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>m²/aux</span>
          </div>
        </div>
      </div>

      {/* SHIFT TABLE */}
      <table className="data-table" style={{ fontSize: '0.8rem', marginBottom: '1.25rem' }}>
        <thead>
          <tr>
            <th>Turno ({inputs.shiftRegime.daysPerWeek} días/semana)</th>
            <th className="num-cell">Puestos (regla SERCOP)</th>
            <th className="num-cell">Horas nocturnas</th>
            <th className="num-cell">Horas/semana</th>
          </tr>
        </thead>
        <tbody>
          {staffingMetrics.shiftRows.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td className="num-cell">
                {r.posts} <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>(calc. {r.rawPosts.toFixed(2)})</span>
              </td>
              <td className="num-cell">{r.nocturnalHours} h</td>
              <td className="num-cell">{r.weeklyHours.toFixed(0)} h</td>
            </tr>
          ))}
          <tr className="subtotal-row">
            <td>
              <strong>FTE = {staffingMetrics.weeklyCoverageHours.toFixed(0)} h ÷ 40 h legales{staffingMetrics.vacationRelief > 1 ? ' × 1,043 reemplazo de vacaciones' : ''}</strong>
            </td>
            <td className="num-cell" colSpan="3">
              <strong>{staffingMetrics.assignedFTE.toFixed(2)} FTE</strong>
            </td>
          </tr>
        </tbody>
      </table>

      {/* PUBLIC REFERENCE PANEL */}
      <div className="sercop-benchmark-panel" id="sercop-benchmark-panel">
        <div className="sercop-panel-header">
          <div className="sercop-title-row">
            <span className="sercop-cpc-pill">
              <LucideIcon name="Landmark" size={13} /> CPC {reference.cpcCode}
            </span>
            <span className="sercop-status-pill" style={{ color: st.color, background: st.bg, borderColor: `${st.color}55` }}>
              <LucideIcon name={st.icon} size={13} /> {reference.statusLabel}
            </span>
          </div>
          <SourceTypeBadge type={reference.kind} />
        </div>

        <div className="sercop-comparison-grid">
          <div className="sercop-metric-cell">
            <span className="sercop-cell-label">Referencia pública:</span>
            <div className="sercop-cell-value">
              {reference.kind === 'contratos' ? `${formatUSD(reference.minPriceM2)} – ${formatUSD(reference.maxPriceM2)}` : formatUSD(reference.priceM2)}
              <span className="sercop-cell-unit"> /m²</span>
            </div>
            <span className="sercop-cell-hint">{reference.kind === 'contratos' ? `Promedio: ${formatUSD(reference.priceM2)}/m²` : 'Precio sin IVA'}</span>
          </div>

          <div className="sercop-metric-cell highlight">
            <span className="sercop-cell-label">Propuesta CleanQuote:</span>
            <div className="sercop-cell-value" style={{ color: '#059669' }}>
              {formatUSD(unitEconomics.unitPricePerM2)}
              <span className="sercop-cell-unit"> /m²</span>
            </div>
            <span className="sercop-cell-hint" style={{ fontWeight: 600 }}>
              {reference.percentDiffToRef >= 0 ? '+' : ''}
              {reference.percentDiffToRef.toFixed(1)}% vs. referencia
            </span>
          </div>

          <div className="sercop-metric-cell">
            <span className="sercop-cell-label">Margen al precio de referencia:</span>
            <div className="sercop-cell-value" style={{ color: reference.marginAtReferencePrice < 0 ? '#dc2626' : '#475569' }}>
              {reference.marginAtReferencePrice.toFixed(1)}%
            </div>
            <span className="sercop-cell-hint">Con esta estructura de costos</span>
          </div>
        </div>

        <div className="sercop-details-footer">
          <div className="sercop-detail-item" style={{ gridColumn: 'span 2' }}>
            <strong>Fuente:</strong> {reference.label}
          </div>
          <div className="sercop-detail-item" style={{ gridColumn: 'span 2' }}>
            <strong>Advertencia:</strong> {reference.caveat}
          </div>
          <div className="sercop-detail-item" style={{ gridColumn: 'span 2' }}>
            {reference.sourceKeys.map((k) => (
              <a key={k} href={SOURCES[k].url} target="_blank" rel="noreferrer" style={{ color: '#0284c7', marginRight: '1rem', fontSize: '0.75rem' }}>
                <LucideIcon name="ExternalLink" size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '3px' }} />
                {SOURCES[k].label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* COST DISTRIBUTION BAR */}
      <div className="cost-distribution-wrapper">
        <div className="distribution-header">
          <h4 className="distribution-title">
            <LucideIcon name="Layers" size={14} /> Composición Porcentual del Precio de Venta
          </h4>
          <span className="distribution-total">100% del precio sin IVA</span>
        </div>

        <div className="cost-bar-container" title="Distribución de costos y margen">
          {[
            ['labor', '#2563eb', 'Mano de Obra'],
            ['chemicals', '#0284c7', 'Insumos Químicos'],
            ['ppe', '#7c3aed', 'EPP'],
            ['equipment', '#d97706', 'Maquinaria'],
            ['indirect', '#64748b', 'Indirectos'],
            ['profit', '#059669', 'Margen']
          ].map(([k, c, n]) => (
            <div key={k} className="cost-bar-segment" style={{ width: `${costBreakdown[k].percentage}%`, background: c }} data-tooltip={`${n}: ${costBreakdown[k].percentage.toFixed(1)}%`} />
          ))}
        </div>

        <div className="cost-legend-grid">
          {[
            ['labor', '#2563eb', 'Mano de Obra'],
            ['chemicals', '#0284c7', 'Insumos Químicos'],
            ['ppe', '#7c3aed', 'EPP & Bioseguridad'],
            ['equipment', '#d97706', 'Maquinaria'],
            ['indirect', '#64748b', 'Indirectos'],
            ['profit', '#059669', 'Margen']
          ].map(([k, c, n]) => (
            <span key={k} className="legend-item">
              <span className="legend-dot" style={{ background: c }}></span> {n} ({costBreakdown[k].percentage.toFixed(1)}%)
            </span>
          ))}
        </div>
      </div>

      {/* DETAILED COST TABLE */}
      <table className="data-table" id="cost-breakdown-table">
        <thead>
          <tr>
            <th>Rubro Operativo</th>
            <th>Base de Asignación</th>
            <th className="num-cell">Valor Mensual</th>
            <th className="num-cell">% Precio</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div className="table-item-title">
                <LucideIcon name="Users" size={14} className="table-icon blue" />
                <strong>1. Mano de Obra Directa</strong>
              </div>
              <div className="table-item-desc">
                Base {formatUSD(costBreakdown.labor.base)} • Recargo nocturno {formatUSD(costBreakdown.labor.nightSurcharge)} • Supervisión {formatUSD(costBreakdown.labor.supervision)}
              </div>
            </td>
            <td>
              {staffingMetrics.assignedFTE.toFixed(2)} FTE × {formatUSD(staffingMetrics.unitDayLaborCost)}/mes
            </td>
            <td className="num-cell">{formatUSD(costBreakdown.labor.amount)}</td>
            <td className="num-cell">{costBreakdown.labor.percentage.toFixed(1)}%</td>
          </tr>

          <tr>
            <td>
              <div className="table-item-title">
                <LucideIcon name="FlaskConical" size={14} className="table-icon cyan" />
                <strong>2. Insumos Químicos y Desinfectantes</strong>
              </div>
              <div className="table-item-desc">{inputs.disinfectionProtocol.chemicalProduct}</div>
            </td>
            <td>
              ${costBreakdown.chemicals.costPerM2.toFixed(3)}/m² × {inputs.areaM2.toLocaleString('es-EC')} m²
            </td>
            <td className="num-cell">{formatUSD(costBreakdown.chemicals.amount)}</td>
            <td className="num-cell">{costBreakdown.chemicals.percentage.toFixed(1)}%</td>
          </tr>

          <tr>
            <td>
              <div className="table-item-title">
                <LucideIcon name="ShieldAlert" size={14} className="table-icon purple" />
                <strong>3. EPP y Bioseguridad Ocupacional</strong>
              </div>
              <div className="table-item-desc">Riesgo nivel {inputs.sanitaryRiskLevel.level}</div>
            </td>
            <td>
              {(staffingMetrics.assignedFTE + staffingMetrics.supervisors).toFixed(2)} personas × {formatUSD(costBreakdown.ppe.costPerFTE)}
            </td>
            <td className="num-cell">{formatUSD(costBreakdown.ppe.amount)}</td>
            <td className="num-cell">{costBreakdown.ppe.percentage.toFixed(1)}%</td>
          </tr>

          <tr>
            <td>
              <div className="table-item-title">
                <LucideIcon name="Cpu" size={14} className="table-icon amber" />
                <strong>4. Maquinaria y Equipos</strong>
              </div>
              <div className="table-item-desc">{inputs.machineryOption.label}</div>
            </td>
            <td>
              ${inputs.machineryOption.monthlyCostPerM2.toFixed(2)}/m² × {inputs.areaM2.toLocaleString('es-EC')} m²
            </td>
            <td className="num-cell">{formatUSD(costBreakdown.equipment.amount)}</td>
            <td className="num-cell">{costBreakdown.equipment.percentage.toFixed(1)}%</td>
          </tr>

          <tr className="subtotal-row">
            <td>
              <strong>SUBTOTAL COSTOS DIRECTOS</strong>
            </td>
            <td>Mano de Obra + Insumos + EPP + Equipos</td>
            <td className="num-cell" style={{ color: '#0284c7' }}>
              {formatUSD(costBreakdown.totalDirectCost)}
            </td>
            <td className="num-cell">{((costBreakdown.totalDirectCost / costBreakdown.recommendedSellingPrice) * 100).toFixed(1)}%</td>
          </tr>

          <tr>
            <td>
              <div className="table-item-title">
                <LucideIcon name="Percent" size={14} className="table-icon gray" />
                <strong>5. Gastos Indirectos (administración y logística)</strong>
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
                <strong style={{ color: '#059669' }}>6. Margen (utilidad antes de participación e impuestos)</strong>
              </div>
            </td>
            <td>{costBreakdown.profit.percentage.toFixed(1)}% sobre precio de venta</td>
            <td className="num-cell" style={{ color: '#059669' }}>
              {formatUSD(costBreakdown.profit.amount)}
            </td>
            <td className="num-cell" style={{ color: '#059669' }}>
              {costBreakdown.profit.percentage.toFixed(1)}%
            </td>
          </tr>

          <tr className="total-row">
            <td>
              <strong style={{ color: '#0f172a' }}>PRECIO MENSUAL SIN IVA</strong>
            </td>
            <td>Precio sugerido de la oferta</td>
            <td className="num-cell" style={{ color: '#059669', fontSize: '1.15rem' }}>
              {formatUSD(costBreakdown.recommendedSellingPrice)}
            </td>
            <td className="num-cell" style={{ color: '#059669' }}>
              100.0%
            </td>
          </tr>
          <tr>
            <td>IVA {(ECUADOR_LABOR_CONFIG.ivaRate * 100).toFixed(0)}%</td>
            <td>Precio total con IVA: {formatUSD(costBreakdown.priceWithIVA)}</td>
            <td className="num-cell">{formatUSD(costBreakdown.ivaAmount)}</td>
            <td className="num-cell">—</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PESTAÑA DE VALIDACIÓN: pruebas automáticas + sensibilidad + calibración
   ═══════════════════════════════════════════════════════════════════════════ */
export function ValidationPanel({ params }) {
  const validation = useMemo(() => runValidationSuite(params), [params]);
  const sensitivity = useMemo(() => runSensitivity(params), [params]);
  const calibration = useMemo(() => runScenarioCalibration(), []);
  const maxSpan = Math.max(...sensitivity.rows.map((r) => Math.max(Math.abs(r.lowDelta), Math.abs(r.highDelta))), 1);

  const groups = [...new Set(validation.tests.map((t) => t.group))];

  return (
    <section className="glass-card" id="validation-panel">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
            <LucideIcon name="ClipboardCheck" size={18} />
          </div>
          <div>
            <h2>Validación del Modelo</h2>
            <p className="card-subtitle">Coherencia entre variables, costos, margen y oferta resultante (Reto 2)</p>
          </div>
        </div>
        <span
          className="hackathon-badge"
          style={{ background: validation.passed === validation.total ? '#ecfdf5' : '#fef2f2', color: validation.passed === validation.total ? '#059669' : '#dc2626' }}
        >
          {validation.passed}/{validation.total} pruebas superadas
        </span>
      </div>

      {/* 1. Pruebas automáticas */}
      {groups.map((g) => (
        <div key={g} style={{ marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>{g}</h4>
          <table className="data-table" style={{ fontSize: '0.78rem' }}>
            <tbody>
              {validation.tests
                .filter((t) => t.group === g)
                .map((t, i) => (
                  <tr key={i}>
                    <td style={{ width: '28px' }}>
                      <LucideIcon name={t.pass ? 'CheckCircle2' : 'XCircle'} size={16} color={t.pass ? '#059669' : '#dc2626'} />
                    </td>
                    <td>{t.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#475569' }}>{t.detail}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* 2. Sensibilidad */}
      <div style={{ marginTop: '1.5rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <LucideIcon name="BarChart3" size={15} /> Análisis de sensibilidad del precio/m² (escenario actual: {formatUSD(sensitivity.basePrice)}/m²)
        </h4>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
          Variación del precio al llevar cada variable a sus extremos, manteniendo las demás constantes. Las variables de arriba son las que más mueven la oferta.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {sensitivity.rows.map((r) => (
            <div key={r.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 230px) 1fr', gap: '0.75rem', alignItems: 'center', fontSize: '0.75rem' }}>
              <span style={{ color: '#334155' }}>{r.label}</span>
              <div style={{ position: 'relative', height: '18px', background: '#f1f5f9', borderRadius: '4px' }}>
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: '#94a3b8' }} />
                {[r.lowDelta, r.highDelta].map((d, i) => (
                  <div
                    key={i}
                    title={`${d >= 0 ? '+' : ''}${d.toFixed(1)}%`}
                    style={{
                      position: 'absolute',
                      top: '3px',
                      height: '12px',
                      borderRadius: '2px',
                      background: d >= 0 ? '#d97706' : '#0284c7',
                      left: d >= 0 ? '50%' : `${50 - (Math.abs(d) / maxSpan) * 50}%`,
                      width: `${(Math.abs(d) / maxSpan) * 50}%`
                    }}
                  />
                ))}
                <span style={{ position: 'absolute', right: '4px', top: '1px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#0f172a' }}>
                  {r.lowDelta.toFixed(0)}% / {r.highDelta >= 0 ? '+' : ''}
                  {r.highDelta.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Calibración */}
      <div style={{ marginTop: '1.5rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <LucideIcon name="Landmark" size={15} /> Calibración: escenarios de demostración vs. referencias públicas
        </h4>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.6rem' }}>
          Las diferencias no son errores: muestran dónde una tarifa única por m² no refleja la operación real (turnos, riesgo, frecuencia). Cada referencia tiene sus advertencias.
        </p>
        <table className="data-table" style={{ fontSize: '0.75rem' }}>
          <thead>
            <tr>
              <th>Escenario</th>
              <th className="num-cell">FTE</th>
              <th className="num-cell">Precio modelo</th>
              <th className="num-cell">Referencia</th>
              <th>Lectura</th>
            </tr>
          </thead>
          <tbody>
            {calibration.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td className="num-cell">{c.fte.toFixed(2)}</td>
                <td className="num-cell">{formatUSD(c.unitPricePerM2)}</td>
                <td className="num-cell">
                  {formatUSD(c.reference.priceM2)} <SourceTypeBadge type={c.reference.kind} />
                </td>
                <td style={{ color: statusColors[c.reference.status].color }}>{c.reference.statusLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1.25rem', background: '#fffbeb', border: '1px solid #fde68a', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.78rem', color: '#92400e', lineHeight: 1.5 }}>
        <strong>Validación pendiente con usuarios (completar por el equipo):</strong> registrar entrevistas o pruebas con empresas de limpieza (nombre de la empresa o cargo del entrevistado, fecha, qué se probó y qué se modificó). El manual (Anexo 5.4) pide: ¿qué probamos?, ¿con quién?, ¿qué modificamos?
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PESTAÑA DE SUPUESTOS Y FUENTES
   ═══════════════════════════════════════════════════════════════════════════ */
export function AssumptionsPanel() {
  const unit = calculateUnitLaborCost();
  const rows = [
    ['SBU 2026', unit.sbu],
    ['Aporte patronal IESS + SECAP + IECE (12,15%)', unit.iessPatronal],
    ['Décimo tercero (1/12)', unit.decimoTercero],
    ['Décimo cuarto (SBU/12)', unit.decimoCuarto],
    ['Fondos de reserva (8,33%, desde el 2º año)', unit.fondoReserva],
    ['Vacaciones (15 días/año)', unit.vacaciones],
    ['Provisión desahucio (estimación)', unit.desahucio],
    ['Uniformes y calzado (estimación)', unit.uniformes],
    ['Exámenes ocupacionales y capacitación (estimación)', unit.seguro]
  ];

  return (
    <section className="glass-card" id="assumptions-panel">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon-badge" style={{ background: '#eff6ff', color: '#0284c7' }}>
            <LucideIcon name="BookOpen" size={18} />
          </div>
          <div>
            <h2>Supuestos, Fuentes y Normativa</h2>
            <p className="card-subtitle">Cada valor indica si es oficial, de contrato real, derivado o estimación del equipo</p>
          </div>
        </div>
      </div>

      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem' }}>Costo empresa de 1 auxiliar de limpieza (jornada diurna, 2026)</h4>
      <table className="data-table" style={{ fontSize: '0.78rem', marginBottom: '1.25rem' }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td className="num-cell">{formatUSD(v)}</td>
            </tr>
          ))}
          <tr className="total-row">
            <td>
              <strong>Costo empresa mensual por FTE</strong>
            </td>
            <td className="num-cell">
              <strong>{formatUSD(unit.totalMonthlyCost)}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem' }}>Supuestos del modelo</h4>
      <table className="data-table" style={{ fontSize: '0.76rem', marginBottom: '1.25rem' }}>
        <thead>
          <tr>
            <th>Parámetro</th>
            <th>Valor</th>
            <th>Tipo</th>
          </tr>
        </thead>
        <tbody>
          {ASSUMPTIONS.map((a) => (
            <tr key={a.param}>
              <td>
                {a.param}
                {a.source && (
                  <a href={SOURCES[a.source].url} target="_blank" rel="noreferrer" style={{ marginLeft: '0.35rem', color: '#0284c7' }} title={SOURCES[a.source].label}>
                    <LucideIcon name="ExternalLink" size={11} style={{ display: 'inline', verticalAlign: '-1px' }} />
                  </a>
                )}
              </td>
              <td>{a.value}</td>
              <td>
                <SourceTypeBadge type={a.type} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem' }}>Fuentes consultadas (15-oct-2026)</h4>
      <ul style={{ fontSize: '0.76rem', color: '#334155', lineHeight: 1.7, paddingLeft: '1.1rem' }}>
        {Object.entries(SOURCES).map(([k, s]) => (
          <li key={k}>
            <a href={s.url} target="_blank" rel="noreferrer" style={{ color: '#0284c7' }}>
              {s.label}
            </a>
          </li>
        ))}
      </ul>
      <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.75rem' }}>
        Las fichas SERCOP consultadas son de 2023 (Convenio Marco FISP-SERCOP-002-2022); los precios pudieron actualizarse. Verificar en el Catálogo Dinámico Inclusivo antes de usarlos en una oferta real.
      </p>
    </section>
  );
}
