import React from 'react';
import { LucideIcon } from './LucideIcon';
import { REFERENCE_TABLE } from '../data/parametricData.js';
import { formatUSD, SourceTypeBadge } from './ResultsDashboard';

export function ComparativeAnalysis({ result, onChangeBenchmarkRate }) {
  if (!result) return null;

  const { costBreakdown, unitEconomics, staffingMetrics, traditionalBenchmark, inputs } = result;
  const isLoss = traditionalBenchmark.grossProfit < 0;
  const isOverpriced = traditionalBenchmark.riskStatus === 'overpriced';

  return (
    <div className="comparison-box" id="comparative-analysis-section">
      <div className="comparison-header">
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LucideIcon name="Scale" size={20} className="table-icon emerald" />
            Modelo Paramétrico vs. Método Tradicional
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Método tradicional = una tarifa única por m² y 1 auxiliar cada 900 m², sin importar turnos, riesgo ni frecuencia
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <label htmlFor="benchmark-slider" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Tarifa única:
          </label>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#d97706' }}>${inputs.benchmarkFlatRatePerM2.toFixed(2)}/m²</span>
          <input
            id="benchmark-slider"
            type="range"
            min="0.60"
            max="6.00"
            step="0.02"
            style={{ width: '90px' }}
            value={inputs.benchmarkFlatRatePerM2}
            onChange={(e) => onChangeBenchmarkRate(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="vs-cards-grid">
        <div className="vs-card traditional" id="vs-card-traditional">
          <div className="vs-card-tag" style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <LucideIcon name="AlertTriangle" size={14} /> Método Tradicional (tarifa única)
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ${inputs.benchmarkFlatRatePerM2.toFixed(2)} × {inputs.areaM2.toLocaleString('es-EC')} m² (por defecto: precio de catálogo SERCOP de áreas internas, USD 1,58)
          </div>

          <div className="vs-price-headline" style={{ color: isLoss ? '#dc2626' : '#d97706' }}>
            {formatUSD(traditionalBenchmark.totalPrice)}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}> /mes</span>
          </div>

          <div className="vs-metrics-list">
            <div className="vs-metric-row">
              <span style={{ color: 'var(--text-secondary)' }}>Personal (1 aux. cada 900 m²):</span>
              <strong style={{ color: 'var(--text-primary)' }}>{traditionalBenchmark.assignedFTE.toFixed(1)} FTE</strong>
            </div>
            <div className="vs-metric-row">
              <span style={{ color: 'var(--text-secondary)' }}>Costo calculado de la operación:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{formatUSD(costBreakdown.totalCost)}</span>
            </div>
            <div className="vs-metric-row">
              <span style={{ color: 'var(--text-secondary)' }}>Margen resultante:</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: isLoss ? '#dc2626' : traditionalBenchmark.marginPercent < 10 ? '#d97706' : '#059669' }}>
                {traditionalBenchmark.marginPercent.toFixed(1)}% ({formatUSD(traditionalBenchmark.grossProfit)})
              </strong>
            </div>
            <div className="vs-metric-row">
              <span style={{ color: 'var(--text-secondary)' }}>Cobertura de personal vs. requerida:</span>
              <span style={{ color: traditionalBenchmark.staffCoverageIndex < 80 ? '#dc2626' : '#059669', fontWeight: 700 }}>{traditionalBenchmark.staffCoverageIndex}%</span>
            </div>
          </div>
        </div>

        <div className="vs-card parametric" id="vs-card-parametric">
          <div className="vs-card-tag" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <LucideIcon name="ShieldCheck" size={14} /> Modelo Paramétrico CleanQuote
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Considera tipología, riesgo, tráfico, turnos, protocolo y frecuencia</div>

          <div className="vs-price-headline" style={{ color: '#059669' }}>
            {formatUSD(costBreakdown.recommendedSellingPrice)}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}> /mes</span>
          </div>

          <div className="vs-metrics-list">
            <div className="vs-metric-row">
              <span style={{ color: 'var(--text-secondary)' }}>Personal calculado:</span>
              <strong style={{ color: '#059669' }}>{staffingMetrics.assignedFTE.toFixed(2)} FTE</strong>
            </div>
            <div className="vs-metric-row">
              <span style={{ color: 'var(--text-secondary)' }}>Precio unitario:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatUSD(unitEconomics.unitPricePerM2)} /m²</span>
            </div>
            <div className="vs-metric-row">
              <span style={{ color: 'var(--text-secondary)' }}>Margen objetivo:</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: '#059669' }}>
                {costBreakdown.profit.percentage.toFixed(1)}% ({formatUSD(costBreakdown.profit.amount)})
              </strong>
            </div>
            <div className="vs-metric-row">
              <span style={{ color: 'var(--text-secondary)' }}>Cobertura de personal vs. requerida:</span>
              <span style={{ color: '#059669', fontWeight: 700 }}>100%</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`alert-diagnosis-box ${isLoss ? 'danger' : isOverpriced ? 'warning' : 'success'}`} id="comparative-diagnosis-alert">
        <div style={{ flexShrink: 0, marginTop: '2px' }}>
          <LucideIcon name={isLoss ? 'AlertOctagon' : isOverpriced ? 'AlertTriangle' : 'CheckCircle2'} size={20} color={isLoss ? '#dc2626' : isOverpriced ? '#d97706' : '#059669'} />
        </div>
        <div>
          <strong>Diagnóstico:</strong> {traditionalBenchmark.diagnosis}
          {traditionalBenchmark.fteDeficit > 0.05 && (
            <div style={{ marginTop: '0.25rem', fontSize: '0.785rem' }}>
              <strong>Déficit de personal:</strong> la regla de 1 auxiliar cada 900 m² asignaría{' '}
              <span style={{ textDecoration: 'underline', fontWeight: 700 }}>
                {traditionalBenchmark.fteDeficit.toFixed(2)} FTE menos ({Math.round(traditionalBenchmark.hoursDeficit)} horas/mes)
              </span>{' '}
              de lo que requieren los turnos y la exigencia sanitaria seleccionados.
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <LucideIcon name="Landmark" size={16} className="table-icon blue" />
              Referencias públicas por tipología (Ecuador)
            </h4>
            <p style={{ fontSize: '0.74rem', color: '#64748b' }}>Catálogo SERCOP (fichas 2023) y contratos IESS adjudicados. Precios sin IVA.</p>
          </div>
        </div>

        <table className="data-table" id="sercop-multi-sector-table" style={{ fontSize: '0.8rem' }}>
          <thead>
            <tr>
              <th>Tipología</th>
              <th>CPC</th>
              <th>Referencia</th>
              <th>Rendimiento usado</th>
              <th>Fuente</th>
            </tr>
          </thead>
          <tbody>
            {REFERENCE_TABLE.map((item) => {
              const isActive = inputs.infrastructureType.id === item.id;
              return (
                <tr key={item.id} style={isActive ? { background: '#f0fdf4', borderLeft: '3px solid #059669' } : {}}>
                  <td>
                    <strong>{item.sector}</strong>
                    {isActive && (
                      <span style={{ marginLeft: '0.4rem', fontSize: '0.68rem', background: '#059669', color: '#ffffff', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>ACTIVO</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 5px', borderRadius: '3px' }}>{item.cpcCode}</span>
                  </td>
                  <td>
                    <strong style={{ color: '#059669', fontFamily: 'var(--font-mono)' }}>
                      {item.kind === 'contratos' ? `$${item.minPriceM2.toFixed(2)} – $${item.maxPriceM2.toFixed(2)}` : `$${item.priceM2.toFixed(2)}`} /m²
                    </strong>
                    <div style={{ marginTop: '2px' }}>
                      <SourceTypeBadge type={item.kind} />
                    </div>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#334155' }}>
                    {item.yieldM2.toLocaleString('es-EC')} m²/aux <SourceTypeBadge type={item.yieldSourceType} />
                  </td>
                  <td style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
