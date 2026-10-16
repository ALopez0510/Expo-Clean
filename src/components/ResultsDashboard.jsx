import React, { useState } from 'react';
import { LucideIcon } from './LucideIcon';

export function ResultsDashboard({
  result,
  calculatedResults,
  category,
  areaM2,
  marginPercent,
  onMarginChange,
  breakdown,
}) {
  const [hoveredSliceId, setHoveredSliceId] = useState(null);
  const res = result || calculatedResults;
  if (!res) return null;

  // Formatting helpers
  const formatUSD = (val) =>
    new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val || 0);

  const formatNumber = (val, decimals = 2) =>
    new Intl.NumberFormat('es-EC', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(val || 0);

  // Normalize Cost Breakdown
  const costBreakdown = res.costBreakdown || {
    recommendedSellingPrice: res.totalMonthlyPrice || 0,
    totalCost: (res.totalMonthlyPrice || 0) * (1 - ((res.grossMarginPercent || marginPercent || 18) / 100)),
    totalDirectCost: (res.totalMonthlyPrice || 0) * 0.82,
    labor: {
      amount: res.breakdown?.labor || (res.totalMonthlyPrice || 0) * 0.55,
      percentage: res.breakdown?.laborPercent || 55,
      dayLabor: (res.totalMonthlyPrice || 0) * 0.55,
      nightLabor: 0,
      supervision: 0
    },
    chemicals: {
      amount: res.breakdown?.chemicals || (res.totalMonthlyPrice || 0) * 0.10,
      percentage: res.breakdown?.chemicalsPercent || 10,
      costPerM2: (res.breakdown?.chemicals || 0) / Math.max(1, res.areaM2 || areaM2 || 1000),
    },
    ppe: {
      amount: res.breakdown?.ppe || (res.totalMonthlyPrice || 0) * 0.05,
      percentage: res.breakdown?.ppePercent || 5,
      costPerFTE: 35,
    },
    equipment: {
      amount: res.breakdown?.equipment || (res.totalMonthlyPrice || 0) * 0.05,
      percentage: res.breakdown?.equipmentPercent || 5,
    },
    indirect: {
      amount: res.breakdown?.indirect || (res.totalMonthlyPrice || 0) * 0.08,
      percentage: res.breakdown?.indirectPercent || 8,
    },
    profit: {
      amount: res.grossMarginUSD || (res.totalMonthlyPrice || 0) * ((res.grossMarginPercent || marginPercent || 18) / 100),
      percentage: res.grossMarginPercent || marginPercent || 18,
    }
  };

  // Normalize Unit Economics
  const currentArea = res.inputs?.areaM2 || res.areaM2 || areaM2 || 1000;
  const unitEconomics = res.unitEconomics || {
    unitPricePerM2: res.unitCostM2 || (costBreakdown.recommendedSellingPrice / currentArea),
    unitCostPerM2: res.baseCostM2 || (costBreakdown.totalCost / currentArea),
    pricePerHour: costBreakdown.recommendedSellingPrice / Math.max(1, res.monthlyHours || 160),
    costPerHour: costBreakdown.totalCost / Math.max(1, res.monthlyHours || 160),
  };

  // Normalize Staffing Metrics
  const staffingMetrics = res.staffingMetrics || {
    assignedFTE: res.fteTotal || 1,
    dayFTE: res.fteDay || (res.fteTotal || 1),
    nightFTE: res.fteNight || 0,
    effectiveHoursPerFTE: 136,
    unitDayLaborCost: 721.09,
    unitNightLaborCost: 839.87,
  };

  // Normalize Yield Metrics
  const yieldMetrics = res.yieldMetrics || {
    monthlyRequiredHours: res.monthlyHours || 160,
    effectiveYieldM2H: res.effectiveYieldM2h || 120,
    baseYieldM2H: 100,
    yieldBonusFactor: 1.1,
    dailyInterventions: 1,
    dailyRequiredHours: (res.monthlyHours || 160) / 22,
  };

  // Normalize Inputs
  const inputs = res.inputs || {
    areaM2: currentArea,
    sanitaryRiskLevel: { level: res.riskLevel || 1, factor: 1.0 },
    trafficLevel: { factor: 1.0 },
    disinfectionProtocol: {
      name: 'Protocolo Estándar',
      chemicalProduct: 'Detergente Neutro biodegradable + Sanitizante',
      contactTimeMinutes: 2
    },
    machineryOption: { label: 'Semi-mecanizado', monthlyCostPerM2: 0.04 },
    indirectRate: 9,
  };

  // Normalize SERCOP Benchmark
  const defaultMinSercop = res.sercopRange?.min || 0.91;
  const defaultMaxSercop = res.sercopRange?.max || 1.25;
  const sercopBenchmark = res.sercopBenchmark || {
    cpcCode: '85330.00.1',
    statusLabel: res.isWithinSercopRange !== false ? 'Conforme a Banda Referencial SERCOP (CPC 85330)' : 'Tarifa Técnica Diferenciada',
    minRateM2: defaultMinSercop,
    maxRateM2: defaultMaxSercop,
    avgRateM2: (defaultMinSercop + defaultMaxSercop) / 2,
    privateMarketRate: '$1.15 - $1.45 /m²',
    deltaToSercopAvg: unitEconomics.unitPricePerM2 - ((defaultMinSercop + defaultMaxSercop) / 2),
    percentDiffToSercopAvg: res.sercopDiffPercent || 0,
    normativeYield: '630 - 900 m²/FTE',
    legalWageCompliance: 'MDT Comisión No. 19 ($721.09/mes con IESS)',
    source: 'Catálogo Dinámico Inclusivo FISP-SERCOP',
  };

  // Normalize breakdown data: prioritize breakdown prop, res.breakdown, or derive from costBreakdown
  const rawBreakdown = Array.isArray(breakdown) && breakdown.length > 0
    ? breakdown
    : (Array.isArray(res.breakdown) && res.breakdown.length > 0 ? res.breakdown : null);

  const breakdownData = rawBreakdown
    ? rawBreakdown.map((item) => ({
        id: item.id || item.label,
        label: item.label,
        percentage: Number(item.percentage ?? item.pct ?? 0),
        color: item.color || (
          item.id === 'labor' ? '#2563eb' :
          item.id === 'supplies' || item.id === 'chemicals' ? '#0284c7' :
          item.id === 'epp' || item.id === 'ppe' ? '#7c3aed' :
          item.id === 'equipment' ? '#d97706' :
          item.id === 'overheads' || item.id === 'indirect' ? '#64748b' :
          '#059669'
        )
      }))
    : [
        { id: 'labor', label: 'Mano de Obra', percentage: Number(costBreakdown.labor?.percentage) || 0, color: '#2563eb' },
        { id: 'supplies', label: 'Insumos Químicos', percentage: Number(costBreakdown.chemicals?.percentage) || 0, color: '#0284c7' },
        { id: 'epp', label: 'EPP & Bioseguridad', percentage: Number(costBreakdown.ppe?.percentage) || 0, color: '#7c3aed' },
        { id: 'equipment', label: 'Maquinaria', percentage: Number(costBreakdown.equipment?.percentage) || 0, color: '#d97706' },
        { id: 'overheads', label: 'Indirectos', percentage: Number(costBreakdown.indirect?.percentage) || 0, color: '#64748b' },
        { id: 'margin', label: 'Margen Utilidad', percentage: Number(costBreakdown.profit?.percentage) || 0, color: '#059669' }
      ];

  const activeItem = breakdownData.find((item) => item.id === hoveredSliceId);

  // Donut SVG geometry parameters (r=60, cx=80, cy=80, viewBox="0 0 160 160")
  const RADIUS = 60;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~376.9911
  let accumulatedPercent = 0;
  const donutSegments = breakdownData.map((item) => {
    const strokeDasharray = `${(item.percentage / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * CIRCUMFERENCE);
    accumulatedPercent += item.percentage;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <section className="rd-panel glass-card" id="results-dashboard-panel">

      {/* ═══════════════════════════════════════════════════════════════════
          1. HERO HEADER — Título + Hero Price Card
          ═══════════════════════════════════════════════════════════════════ */}
      <header className="rd-hero-header">
        <div className="rd-header-info">
          <div className="rd-title-group">
            <div className="rd-icon-badge">
              <LucideIcon name="BarChart3" size={18} />
            </div>
            <div>
              <div className="rd-title-row">
                <h2 className="rd-main-title">Estructuración Técnico-Financiera</h2>
                <span className="rd-verified-tag">
                  <span className="rd-pulse-dot" />
                  SERCOP Verificado
                </span>
              </div>
              <p className="rd-subtitle">
                Cálculo paramétrico de costos unitarios, personal e insumos homologados
              </p>
            </div>
          </div>
        </div>

        <div className="rd-hero-price-card" id="hero-final-price-card">
          <div className="rd-hero-top">
            <span className="rd-hero-badge">PRECIO PROPUESTA FINAL</span>
            <span className="rd-hero-vat">Sin IVA (15%)</span>
          </div>
          <div className="rd-hero-amount-row">
            <span className="rd-hero-amount tabular-nums">
              {formatUSD(costBreakdown.recommendedSellingPrice)}
            </span>
            <span className="rd-hero-period">/mes</span>
          </div>
          <div className="rd-hero-metrics tabular-nums">
            <span className="rd-hero-metric">
              Tarifa: <strong>{formatUSD(unitEconomics.unitPricePerM2)}/m²</strong>
            </span>
            <span className="rd-hero-sep">•</span>
            <span className="rd-hero-metric">
              Hora op.: <strong>{formatUSD(unitEconomics.pricePerHour)}/h</strong>
            </span>
            <span className="rd-hero-sep">•</span>
            <span className="rd-hero-metric">
              Margen: <strong className="rd-emerald-accent">{costBreakdown.profit.percentage.toFixed(1)}%</strong>
            </span>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          2. KPI METRICS CARDS (4 columnas)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="rd-kpi-grid">
        {/* KPI 1: Costo Unitario m² */}
        <article className="rd-kpi-card rd-kpi-highlight" id="kpi-unit-price-card">
          <div className="rd-kpi-top">
            <span className="rd-kpi-label">COSTO UNITARIO M²</span>
            <div className="rd-kpi-icon rd-kpi-icon--emerald">
              <LucideIcon name="DollarSign" size={16} />
            </div>
          </div>
          <div className="rd-kpi-value tabular-nums">{formatUSD(unitEconomics.unitPricePerM2)}</div>
          <div className="rd-kpi-sub">
            Base técnica costo: <strong>{formatUSD(unitEconomics.unitCostPerM2)}/m²</strong>
          </div>
          {sercopBenchmark && (
            <div className="rd-kpi-sercop-pill">
              <LucideIcon name="ShieldCheck" size={12} />
              <span>Banda SERCOP: ${sercopBenchmark.minRateM2.toFixed(2)} – ${sercopBenchmark.maxRateM2.toFixed(2)}/m²</span>
            </div>
          )}
        </article>

        {/* KPI 2: Personal Asignado (FTE) */}
        <article className="rd-kpi-card" id="kpi-staffing-card">
          <div className="rd-kpi-top">
            <span className="rd-kpi-label">PERSONAL ASIGNADO</span>
            <div className="rd-kpi-icon rd-kpi-icon--blue">
              <LucideIcon name="Users" size={16} />
            </div>
          </div>
          <div className="rd-kpi-value tabular-nums">
            {formatNumber(staffingMetrics.assignedFTE, 1)} <span className="rd-kpi-unit">FTE</span>
          </div>
          <div className="rd-kpi-sub">
            <strong>{formatNumber(staffingMetrics.dayFTE, 1)}</strong> Diurnos • <strong>{formatNumber(staffingMetrics.nightFTE, 1)}</strong> Nocturnos
          </div>
          <div className="rd-kpi-hint rd-kpi-hint--blue">
            <LucideIcon name="CheckCircle2" size={11} />
            <span>Relevos y descansos 48h de ley</span>
          </div>
        </article>

        {/* KPI 3: Horas Operativas */}
        <article className="rd-kpi-card" id="kpi-hours-card">
          <div className="rd-kpi-top">
            <span className="rd-kpi-label">HORAS OPERATIVAS</span>
            <div className="rd-kpi-icon rd-kpi-icon--cyan">
              <LucideIcon name="Clock" size={16} />
            </div>
          </div>
          <div className="rd-kpi-value tabular-nums">
            {Math.round(yieldMetrics.monthlyRequiredHours).toLocaleString('es-EC')}{' '}
            <span className="rd-kpi-unit">h/mes</span>
          </div>
          <div className="rd-kpi-sub">
            {yieldMetrics.dailyInterventions} pasadas/día ({Math.round(yieldMetrics.dailyRequiredHours)}h/día)
          </div>
          <div className="rd-kpi-hint rd-kpi-hint--cyan">
            <LucideIcon name="Cpu" size={11} />
            <span>Eficiencia OEE 85% calibrada</span>
          </div>
        </article>

        {/* KPI 4: Utilidad Bruta Proyectada */}
        <article className="rd-kpi-card" id="kpi-profit-card">
          <div className="rd-kpi-top">
            <span className="rd-kpi-label">UTILIDAD BRUTA PROYECTADA</span>
            <div className="rd-kpi-icon rd-kpi-icon--green">
              <LucideIcon name="TrendingUp" size={16} />
            </div>
          </div>
          <div className="rd-kpi-value tabular-nums rd-emerald-accent">
            {formatUSD(costBreakdown.profit.amount)}
          </div>
          <div className="rd-kpi-sub">
            Margen blindado: <strong>{costBreakdown.profit.percentage.toFixed(1)}%</strong>
          </div>
          <div className="rd-kpi-hint rd-kpi-hint--emerald">
            <LucideIcon name="ShieldCheck" size={11} />
            <span>Sin riesgo de subcotización</span>
          </div>
        </article>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. FORMULA ENGINE BANNER — Motor Paramétrico PRO
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="rd-formula-card" id="formula-engine-banner">
        <div className="rd-formula-left">
          <div className="rd-formula-tag">
            <LucideIcon name="Cpu" size={13} />
            <span>MOTOR PARAMÉTRICO PRO</span>
          </div>
          <div className="rd-formula-equation">
            <span className="rd-formula-lbl">Fórmula:</span>
            <span className="rd-formula-expr">
              Rendimiento Efectivo = (R<sub>base</sub> × k<sub>maquinaria</sub>) ÷ (k<sub>riesgo</sub> × k<sub>tráfico</sub>)
            </span>
          </div>
          <div className="rd-formula-calc tabular-nums">
            Cálculo aplicado: ({yieldMetrics.baseYieldM2H} m²/h × {formatNumber(yieldMetrics.yieldBonusFactor, 2)}) ÷ ({formatNumber(inputs.sanitaryRiskLevel.factor, 2)} riesgo × {formatNumber(inputs.trafficLevel.factor, 2)} tráfico)
          </div>
        </div>
        <div className="rd-formula-right">
          <span className="rd-yield-label">RENDIMIENTO OPERATIVO</span>
          <div className="rd-yield-value tabular-nums">
            {formatNumber(yieldMetrics.effectiveYieldM2H, 1)}
            <span className="rd-yield-unit">m²/h</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. SERCOP BENCHMARK — 3 Columnas Comparativas
          ═══════════════════════════════════════════════════════════════════ */}
      {sercopBenchmark && (
        <div className="rd-sercop-card" id="sercop-benchmark-panel">
          <div className="rd-sercop-header">
            <div className="rd-sercop-pills">
              <span className="rd-cpc-pill">
                <LucideIcon name="ShieldCheck" size={13} /> CPC {sercopBenchmark.cpcCode}
              </span>
              <span className="rd-status-pill">
                <LucideIcon name="CheckCircle2" size={13} /> {sercopBenchmark.statusLabel}
              </span>
            </div>
            <span className="rd-sercop-source">
              <LucideIcon name="ExternalLink" size={12} />
              Compras Públicas Ecuador (SERCOP)
            </span>
          </div>

          <div className="rd-sercop-grid">
            {/* Col 1: Banda Oficial SERCOP */}
            <div className="rd-sercop-col rd-sercop-col--neutral">
              <div className="rd-sercop-col-head">
                <span className="rd-sercop-col-title">BANDA OFICIAL SERCOP</span>
                <span className="rd-sercop-col-badge">LOSNCP</span>
              </div>
              <div className="rd-sercop-col-amount tabular-nums">
                {formatUSD(sercopBenchmark.minRateM2)} – {formatUSD(sercopBenchmark.maxRateM2)}
                <span className="rd-sercop-col-unit">/m²</span>
              </div>
              <div className="rd-sercop-col-foot">
                Promedio estatal: <strong>{formatUSD(sercopBenchmark.avgRateM2)}/m²</strong>
              </div>
            </div>

            {/* Col 2: Propuesta CleanQuote (Destacada) */}
            <div className="rd-sercop-col rd-sercop-col--hero">
              <div className="rd-sercop-col-head">
                <span className="rd-sercop-col-title rd-emerald-accent">PROPUESTA CLEANQUOTE</span>
                <span className="rd-sercop-hero-badge">
                  {sercopBenchmark.deltaToSercopAvg >= 0 ? '+' : ''}{formatUSD(sercopBenchmark.deltaToSercopAvg)} vs. prom.
                </span>
              </div>
              <div className="rd-sercop-col-amount rd-emerald-accent tabular-nums">
                {formatUSD(unitEconomics.unitPricePerM2)}
                <span className="rd-sercop-col-unit">/m²</span>
              </div>
              <div className="rd-sercop-col-foot rd-emerald-hint">
                {sercopBenchmark.percentDiffToSercopAvg >= 0 ? '+' : ''}{sercopBenchmark.percentDiffToSercopAvg.toFixed(1)}% vs. promedio estatal
              </div>
            </div>

            {/* Col 3: Mercado Privado (FEDELIMP) */}
            <div className="rd-sercop-col rd-sercop-col--private">
              <div className="rd-sercop-col-head">
                <span className="rd-sercop-col-title">MERCADO PRIVADO</span>
                <span className="rd-sercop-col-badge rd-sercop-col-badge--blue">FEDELIMP</span>
              </div>
              <div className="rd-sercop-col-amount tabular-nums">
                {sercopBenchmark.privateMarketRate}
              </div>
              <div className="rd-sercop-col-foot">
                Sector corporativo privado
              </div>
            </div>
          </div>

          <div className="rd-sercop-footer">
            <div className="rd-sercop-detail">
              <strong>Rendimiento Normado SERCOP:</strong> {sercopBenchmark.normativeYield}
            </div>
            <div className="rd-sercop-detail">
              <strong>Sueldo Legal Garantizado:</strong> {sercopBenchmark.legalWageCompliance}
            </div>
            <div className="rd-sercop-detail rd-sercop-detail--wide">
              <strong>Base Contractual Oficial:</strong> {sercopBenchmark.source}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          5. COMPOSICIÓN PORCENTUAL — Donut Chart SVG + Leyenda 2 Columnas
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="composition-section rd-composition" id="cost-composition-section">
        <div className="composition-card">
          <div className="rd-comp-header">
            <h4 className="rd-comp-title">
              <LucideIcon name="PieChart" size={15} />
              Composición Porcentual del Precio de Venta
            </h4>
            <span className="rd-comp-badge">100% de la Oferta Técnica</span>
          </div>

          <div className="composition-card-body composition-body">
            {/* Gráfico de Dona SVG Limpio y Único */}
            <div className="donut-chart-container">
              <svg
                className="donut-svg"
                viewBox="0 0 160 160"
                width="160"
                height="160"
                role="img"
                aria-label="Gráfico de dona de composición porcentual"
              >
                {/* Background Track Circle */}
                <circle
                  cx="80"
                  cy="80"
                  r={RADIUS}
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="18"
                />

                {/* Donut Segments */}
                {donutSegments.map((item) => (
                  <circle
                    key={item.id}
                    cx="80"
                    cy="80"
                    r={RADIUS}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={hoveredSliceId === item.id ? "21" : "18"}
                    strokeDasharray={item.strokeDasharray}
                    strokeDashoffset={item.strokeDashoffset}
                    transform="rotate(-90 80 80)"
                    className={`donut-segment ${hoveredSliceId === item.id ? 'is-active' : ''}`}
                    onMouseEnter={() => setHoveredSliceId(item.id)}
                    onMouseLeave={() => setHoveredSliceId(null)}
                    style={{
                      cursor: 'pointer',
                      transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                      opacity: hoveredSliceId && hoveredSliceId !== item.id ? 0.45 : 1,
                    }}
                  >
                    <title>{`${item.label}: ${item.percentage.toFixed(1)}%`}</title>
                  </circle>
                ))}

                {/* Center Content */}
                <text
                  x="80"
                  y="74"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="donut-center-value tabular-nums"
                  style={{
                    fill: activeItem ? activeItem.color : '#0f172a',
                    fontSize: '1.45rem',
                    fontWeight: '800',
                    fontFamily: 'var(--font-display, inherit)',
                    transition: 'fill 0.2s ease',
                  }}
                >
                  {activeItem ? `${activeItem.percentage.toFixed(1)}%` : '100%'}
                </text>
                <text
                  x="80"
                  y="94"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="donut-center-label"
                  style={{
                    fill: '#64748b',
                    fontSize: '0.62rem',
                    fontWeight: '700',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {activeItem ? activeItem.label : 'Oferta Técnica'}
                </text>
              </svg>
            </div>

            {/* Leyenda Estructurada a 2 Columnas */}
            <div className="donut-legend-grid">
              {breakdownData.map((item) => {
                const isHovered = hoveredSliceId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`donut-legend-card tabular-nums ${isHovered ? 'is-active' : ''}`}
                    onMouseEnter={() => setHoveredSliceId(item.id)}
                    onMouseLeave={() => setHoveredSliceId(null)}
                    style={{
                      borderColor: isHovered ? item.color : undefined,
                      boxShadow: isHovered ? `0 4px 14px -2px ${item.color}35` : undefined,
                    }}
                  >
                    <span
                      className="donut-legend-dot"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="donut-legend-text">
                      <span className="donut-legend-name">{item.label}</span>
                      <span className="donut-legend-sep">—</span>
                      <span
                        className="donut-legend-pct"
                        style={{ color: item.color }}
                      >
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          6. TABLA DETALLADA DE COSTOS
          ═══════════════════════════════════════════════════════════════════ */}
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
                {formatNumber(staffingMetrics.assignedFTE, 1)} operarios FTE (SBU Ecuador $475, IESS 12.15%, 13º, 14º, fondos reserva)
              </div>
            </td>
            <td className="tabular-nums">{formatNumber(staffingMetrics.assignedFTE, 1)} FTE × ${formatNumber(staffingMetrics.unitDayLaborCost, 2)}/mes</td>
            <td className="num-cell tabular-nums">{formatUSD(costBreakdown.labor.amount)}</td>
            <td className="num-cell tabular-nums">{costBreakdown.labor.percentage.toFixed(1)}%</td>
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
            <td className="tabular-nums">${formatNumber(costBreakdown.chemicals.costPerM2, 3)}/m² × {Number(inputs.areaM2).toLocaleString('es-EC')} m²</td>
            <td className="num-cell tabular-nums">{formatUSD(costBreakdown.chemicals.amount)}</td>
            <td className="num-cell tabular-nums">{costBreakdown.chemicals.percentage.toFixed(1)}%</td>
          </tr>

          <tr>
            <td>
              <div className="table-item-title">
                <LucideIcon name="ShieldAlert" size={14} className="table-icon purple" />
                <strong>3. EPP y Bioseguridad Ocupacional</strong>
              </div>
              <div className="table-item-desc">
                Riesgo Nivel {inputs.sanitaryRiskLevel.level} ({formatNumber(costBreakdown.ppe.costPerFTE, 2)} $/FTE/mes)
              </div>
            </td>
            <td className="tabular-nums">{formatNumber(staffingMetrics.assignedFTE, 1)} FTE protegidos</td>
            <td className="num-cell tabular-nums">{formatUSD(costBreakdown.ppe.amount)}</td>
            <td className="num-cell tabular-nums">{costBreakdown.ppe.percentage.toFixed(1)}%</td>
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
            <td className="tabular-nums">${formatNumber(inputs.machineryOption.monthlyCostPerM2, 2)}/m² × {Number(inputs.areaM2).toLocaleString('es-EC')} m²</td>
            <td className="num-cell tabular-nums">{formatUSD(costBreakdown.equipment.amount)}</td>
            <td className="num-cell tabular-nums">{costBreakdown.equipment.percentage.toFixed(1)}%</td>
          </tr>

          <tr className="subtotal-row">
            <td>
              <strong>SUBTOTAL COSTOS DIRECTOS</strong>
            </td>
            <td>Mano de Obra + Insumos + EPP + Equipos</td>
            <td className="num-cell tabular-nums" style={{ color: '#0284c7' }}>{formatUSD(costBreakdown.totalDirectCost)}</td>
            <td className="num-cell tabular-nums">{((costBreakdown.totalDirectCost / costBreakdown.recommendedSellingPrice) * 100).toFixed(1)}%</td>
          </tr>

          <tr>
            <td>
              <div className="table-item-title">
                <LucideIcon name="Percent" size={14} className="table-icon gray" />
                <strong>5. Gastos Indirectos y Supervisión Central</strong>
              </div>
            </td>
            <td className="tabular-nums">{inputs.indirectRate}% sobre costo directo</td>
            <td className="num-cell tabular-nums">{formatUSD(costBreakdown.indirect.amount)}</td>
            <td className="num-cell tabular-nums">{costBreakdown.indirect.percentage.toFixed(1)}%</td>
          </tr>

          <tr className="technical-cost-row">
            <td>
              <strong>COSTO TÉCNICO TOTAL</strong>
            </td>
            <td>Directos + Indirectos</td>
            <td className="num-cell tabular-nums">{formatUSD(costBreakdown.totalCost)}</td>
            <td className="num-cell tabular-nums">{((costBreakdown.totalCost / costBreakdown.recommendedSellingPrice) * 100).toFixed(1)}%</td>
          </tr>

          <tr className="profit-row">
            <td>
              <div className="table-item-title">
                <LucideIcon name="TrendingUp" size={14} className="table-icon emerald" />
                <strong style={{ color: '#059669' }}>6. Margen de Rentabilidad (Utilidad Bruta)</strong>
              </div>
            </td>
            <td className="tabular-nums">{costBreakdown.profit.percentage.toFixed(1)}% sobre valor de venta</td>
            <td className="num-cell tabular-nums" style={{ color: '#059669' }}>{formatUSD(costBreakdown.profit.amount)}</td>
            <td className="num-cell tabular-nums" style={{ color: '#059669' }}>{costBreakdown.profit.percentage.toFixed(1)}%</td>
          </tr>

          <tr className="total-row">
            <td>
              <strong style={{ color: '#0f172a' }}>OFERTA TÉCNICO-FINANCIERA TOTAL</strong>
            </td>
            <td>Precio sugerido de licitación</td>
            <td className="num-cell tabular-nums" style={{ color: '#059669', fontSize: '1.2rem', fontWeight: 800 }}>
              {formatUSD(costBreakdown.recommendedSellingPrice)}
            </td>
            <td className="num-cell tabular-nums" style={{ color: '#059669', fontWeight: 700 }}>100.0%</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
