import React from 'react';
import { LucideIcon } from './LucideIcon';
import { SERCOP_SECTOR_BENCHMARKS } from '../data/parametricData.js';

export function ComparativeAnalysis({ result, onChangeBenchmarkRate }) {
  if (!result) return null;

  const {
    costBreakdown,
    unitEconomics,
    staffingMetrics,
    traditionalBenchmark,
    sercopBenchmark,
    inputs
  } = result;

  const formatUSD = (val) =>
    new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);

  const isLoss = traditionalBenchmark.grossProfit < 0;
  const isOverpriced = traditionalBenchmark.riskStatus === 'overpriced';

  return (
    <div className="comparison-box" id="comparative-analysis-section">
      <div className="comparison-header">
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LucideIcon name="Scale" size={20} className="table-icon emerald" />
            Validación Técnica: Modelo Paramétrico vs. Método Tradicional
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Demostración empírica de por qué la tarifa plana inelástica por m² erosiona la rentabilidad y vulnera los protocolos de bioseguridad
          </p>
        </div>

        {/* Traditional Rate Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <label htmlFor="benchmark-slider" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Tarifa Plana Comparada:
          </label>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#d97706' }}>
            ${inputs.benchmarkFlatRatePerM2.toFixed(2)}/m²
          </span>
          <input
            id="benchmark-slider"
            type="range"
            min="0.80"
            max="2.50"
            step="0.05"
            style={{ width: '90px' }}
            value={inputs.benchmarkFlatRatePerM2}
            onChange={(e) => onChangeBenchmarkRate(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="vs-cards-grid">
        {/* CARD 1: METODO TRADICIONAL */}
        <div className="vs-card traditional" id="vs-card-traditional">
          <div className="vs-card-tag" style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <LucideIcon name="AlertTriangle" size={14} /> Método Tradicional (Tarifa Plana Inelástica)
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Cálculo empírico manual: ${inputs.benchmarkFlatRatePerM2.toFixed(2)} × {inputs.areaM2} m²
          </div>

          <div className="vs-price-headline" style={{ color: isLoss ? '#dc2626' : '#d97706' }}>
            {formatUSD(traditionalBenchmark.totalPrice)}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}> /mes</span>
          </div>

          <div className="vs-metrics-list">
            <div className="vs-metric-row">
              <span style={{ color: 'var(--text-secondary)' }}>Personal asignado (al ojo):</span>
              <strong style={{ color: 'var(--text-primary)' }}>~{traditionalBenchmark.assignedFTE.toFixed(1)} FTE</strong>
            </div>

            <div className="vs-metric-row">
              <span style={{ color: 'var(--text-secondary)' }}>Costo real técnico de operación:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{formatUSD(costBreakdown.totalCost)}</span>
            </div>

            <div className="vs-metric-row">
              <span style={{ color: 'var(--text-secondary)' }}>Margen real obtenido:</span>
              <strong
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: isLoss ? '#dc2626' : (traditionalBenchmark.marginPercent < 10 ? '#d97706' : '#059669')
                }}
              >
                {traditionalBenchmark.marginPercent.toFixed(1)}% ({formatUSD(traditionalBenchmark.grossProfit)})
              </strong>
            </div>

            <div className="vs-metric-row">
              <span style={{ color: 'var(--text-secondary)' }}>Cumplimiento Bioseguridad:</span>
              <span style={{ color: traditionalBenchmark.biologicalComplianceIndex < 80 ? '#dc2626' : '#059669', fontWeight: 700 }}>
                {traditionalBenchmark.biologicalComplianceIndex}% de cobertura requerida
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: MODELO PARAMETRICO CLEANQUOTE */}
        <div className="vs-card parametric" id="vs-card-parametric">
          <div className="vs-card-tag" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <LucideIcon name="ShieldCheck" size={14} /> Modelo Paramétrico CleanQuote Pro
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Algoritmo dinámico calibrado con Pliegos SERCOP CPC {sercopBenchmark?.cpcCode || '85330'}
          </div>

          <div className="vs-price-headline" style={{ color: '#059669' }}>
            {formatUSD(costBreakdown.recommendedSellingPrice)}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}> /mes</span>
          </div>

          <div className="vs-metrics-list">
            <div className="vs-metric-row">
              <span style={{ color: 'var(--text-secondary)' }}>Personal exacto requerido:</span>
              <strong style={{ color: '#059669' }}>{staffingMetrics.assignedFTE.toFixed(1)} FTE</strong>
            </div>

            <div className="vs-metric-row">
              <span style={{ color: 'var(--text-secondary)' }}>Costo unitario optimizado:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatUSD(unitEconomics.unitPricePerM2)} /m²</span>
            </div>

            <div className="vs-metric-row">
              <span style={{ color: 'var(--text-secondary)' }}>Margen protegido y blindado:</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: '#059669' }}>
                {costBreakdown.profit.percentage.toFixed(1)}% ({formatUSD(costBreakdown.profit.amount)})
              </strong>
            </div>

            <div className="vs-metric-row">
              <span style={{ color: 'var(--text-secondary)' }}>Cumplimiento Bioseguridad:</span>
              <span style={{ color: '#059669', fontWeight: 700 }}>
                100% Protocolo Certificado
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DIAGNOSTIC ALERT BOX */}
      <div
        className={`alert-diagnosis-box ${isLoss ? 'danger' : isOverpriced ? 'warning' : 'success'}`}
        id="comparative-diagnosis-alert"
      >
        <div style={{ flexShrink: 0, marginTop: '2px' }}>
          <LucideIcon
            name={isLoss ? 'AlertOctagon' : isOverpriced ? 'AlertTriangle' : 'CheckCircle2'}
            size={20}
            color={isLoss ? '#dc2626' : isOverpriced ? '#d97706' : '#059669'}
          />
        </div>
        <div>
          <strong>Diagnóstico Técnico Operativo:</strong> {traditionalBenchmark.diagnosis}
          {traditionalBenchmark.fteDeficit > 0 && (
            <div style={{ marginTop: '0.25rem', fontSize: '0.785rem' }}>
              <strong>Déficit Operativo Crítico:</strong> El modelo tradicional asignaría un faltante de{' '}
              <span style={{ textDecoration: 'underline', fontWeight: 700 }}>
                {traditionalBenchmark.fteDeficit.toFixed(1)} operarios ({Math.round(traditionalBenchmark.hoursDeficit)} horas/mes)
              </span>,
              provocando incumplimiento de los protocolos microbiológicos y severo riesgo sanitario.
            </div>
          )}
        </div>
      </div>

      {/* MULTI-SECTOR OFFICIAL SERCOP PROCUREMENT BENCHMARK MATRIX */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <LucideIcon name="Landmark" size={16} className="table-icon blue" />
              Matriz Oficial de Precios Referenciales SERCOP vs. Sector Privado (Ecuador)
            </h4>
            <p style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Valores acreditados en el Sistema Oficial de Contratación Pública (CPC 85330) y Federación de Empresas de Limpieza (FEDELIMP)
            </p>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#059669', background: '#ecfdf5', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid #a7f3d0', fontWeight: 600 }}>
            <LucideIcon name="CheckCircle2" size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Calibración Verificada SERCOP
          </span>
        </div>

        <table className="data-table" id="sercop-multi-sector-table" style={{ fontSize: '0.8rem' }}>
          <thead>
            <tr>
              <th>Sector / Tipología de Infraestructura</th>
              <th>Código CPC SERCOP</th>
              <th>Banda Referencial SERCOP</th>
              <th>Mercado Privado</th>
              <th>Rendimiento Normado</th>
              <th>Contrato Oficial de Referencia</th>
            </tr>
          </thead>
          <tbody>
            {SERCOP_SECTOR_BENCHMARKS.map((item, idx) => {
              const isActiveSector = inputs.infrastructureType.cpcCode?.startsWith(item.cpcCode.slice(0, 8));
              return (
                <tr
                  key={idx}
                  style={isActiveSector ? { background: '#f0fdf4', borderLeft: '3px solid #059669' } : {}}
                >
                  <td>
                    <strong>{item.sector}</strong>
                    {isActiveSector && (
                      <span style={{ marginLeft: '0.4rem', fontSize: '0.68rem', background: '#059669', color: '#ffffff', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                        ACTIVO
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 5px', borderRadius: '3px' }}>
                      {item.cpcCode}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>
                      ${item.sercopMin.toFixed(2)} - ${item.sercopMax.toFixed(2)} /m²
                    </strong>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Promedio: ${item.sercopAvg.toFixed(2)}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#475569' }}>
                    {item.privateRate}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#334155' }}>
                    {item.normativeYield}
                  </td>
                  <td style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {item.officialContractRef}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
