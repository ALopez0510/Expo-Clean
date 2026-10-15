import React from 'react';
import { formatUSD, formatInt, formatOne, formatPct } from '../utils/format';

/** Modelo paramétrico frente a una tarifa plana por m². */
export function ComparativeAnalysis({ result, onChangeBenchmarkRate }) {
  if (!result) return null;

  const { costBreakdown, unitEconomics, staffingMetrics, traditionalBenchmark: flat, inputs, sercopBenchmark } = result;

  const isLoss = flat.grossProfit < 0;
  const isOverpriced = flat.riskStatus === 'overpriced';
  const tone = isLoss ? 'bad' : isOverpriced ? 'warn' : 'good';
  const marginTone = isLoss ? 'bad' : flat.marginPercent < 10 ? 'warn' : 'good';
  const coverageTone = flat.biologicalComplianceIndex < 80 ? 'bad' : 'good';

  return (
    <div id="comparative-analysis-section">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h3 className="section-title">Frente a una tarifa plana</h3>
          <p className="section-lead">
            Qué pasa si este mismo servicio se cotiza con un precio fijo por m², sin mirar riesgo, turnos ni protocolo.
          </p>
        </div>
        <label className="inline-control" htmlFor="benchmark-slider">
          <span>Tarifa plana de comparación</span>
          <strong>{formatUSD(inputs.benchmarkFlatRatePerM2)} por m²</strong>
          <input
            id="benchmark-slider"
            type="range"
            min="0.80"
            max="2.50"
            step="0.05"
            value={inputs.benchmarkFlatRatePerM2}
            onChange={(e) => onChangeBenchmarkRate(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="compare" style={{ marginTop: '1.25rem' }}>
        <div className="compare-col" id="vs-card-traditional">
          <div className="compare-name">Tarifa plana</div>
          <div className="compare-price" style={isLoss ? { color: 'var(--rojo)' } : undefined}>
            {formatUSD(flat.totalPrice)}
            <small> al mes</small>
          </div>
          <div className="compare-formula">
            {formatUSD(inputs.benchmarkFlatRatePerM2)} × {formatInt(inputs.areaM2)} m²
          </div>
          <ul className="rows">
            <li>
              <span>Personal asignado a ojo</span>
              <b>~{formatOne(flat.assignedFTE)} FTE</b>
            </li>
            <li>
              <span>Costo técnico real de operar</span>
              <b>{formatUSD(costBreakdown.totalCost)}</b>
            </li>
            <li>
              <span>Margen que realmente queda</span>
              <b className={marginTone}>
                {formatPct(flat.marginPercent)} ({formatUSD(flat.grossProfit)})
              </b>
            </li>
            <li>
              <span>Personal frente al requerido</span>
              <b className={coverageTone}>{flat.biologicalComplianceIndex} % del necesario</b>
            </li>
          </ul>
        </div>

        <div className="compare-col" id="vs-card-parametric">
          <div className="compare-name">CleanQuote</div>
          <div className="compare-price" style={{ color: 'var(--petroleo-hondo)' }}>
            {formatUSD(costBreakdown.recommendedSellingPrice)}
            <small> al mes</small>
          </div>
          <div className="compare-formula">
            {formatUSD(unitEconomics.unitPricePerM2)} por m², contrastado con la banda CPC {sercopBenchmark?.cpcCode || '85330'}
          </div>
          <ul className="rows">
            <li>
              <span>Personal requerido</span>
              <b>{formatOne(staffingMetrics.assignedFTE)} FTE</b>
            </li>
            <li>
              <span>Precio por m²</span>
              <b>{formatUSD(unitEconomics.unitPricePerM2)}</b>
            </li>
            <li>
              <span>Margen del modelo</span>
              <b className="good">
                {formatPct(costBreakdown.profit.percentage)} ({formatUSD(costBreakdown.profit.amount)})
              </b>
            </li>
            <li>
              <span>Protocolo considerado</span>
              <b>{inputs.disinfectionProtocol.name}</b>
            </li>
          </ul>
        </div>
      </div>

      <div className={`callout ${tone}`} id="comparative-diagnosis-alert" style={{ marginTop: '1.5rem' }}>
        <p>
          <strong>Diagnóstico.</strong> {flat.diagnosis}
        </p>
        {flat.fteDeficit > 0 && (
          <p>
            Con la tarifa plana faltarían {formatOne(flat.fteDeficit)} operarios ({formatInt(flat.hoursDeficit)} horas al mes) para
            cubrir el servicio con el protocolo indicado.
          </p>
        )}
      </div>

      <p className="note" style={{ marginTop: '1rem' }}>
        La tarifa plana de comparación es un valor de referencia que puedes ajustar. No representa lo que cobra una empresa en
        particular.
      </p>
    </div>
  );
}
