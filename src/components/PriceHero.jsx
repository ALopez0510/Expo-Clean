import React from 'react';
import { LucideIcon } from './LucideIcon';
import { formatUSD, formatInt, formatOne, formatPct, formatSigned, formatDec } from '../utils/format';
import { bandPosition, parseRange } from '../utils/analysis';

function niceStep(max) {
  const raw = max / 5;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / pow;
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return step * pow;
}

/** La regla: dónde cae el precio por m² frente a la banda de referencia. */
function BandRuler({ price, band, position }) {
  const priv = parseRange(band.privateMarketRate);
  const top = Math.max(band.maxRateM2 * 1.25, price * 1.15, priv ? priv.max * 1.1 : 0);
  const step = niceStep(top);
  const scaleMax = Math.ceil(top / step - 1e-9) * step;
  const at = (v) => `${Math.min(100, Math.max(0, (v / scaleMax) * 100))}%`;
  const width = (a, b) => `${Math.max(0.6, ((b - a) / scaleMax) * 100)}%`;

  const ticks = [];
  for (let v = 0; v <= scaleMax + 1e-9; v += step) ticks.push(v);

  const label = `Precio de ${formatUSD(price)} por m². Banda SERCOP de ${formatUSD(band.minRateM2)} a ${formatUSD(band.maxRateM2)}. ${position.label}.`;

  return (
    <div className="ruler">
      <div className="ruler-track" role="img" aria-label={label}>
        {priv && (
          <div className="ruler-private" style={{ left: at(priv.min), width: width(priv.min, priv.max) }} />
        )}
        <div className="ruler-band" style={{ left: at(band.minRateM2), width: width(band.minRateM2, band.maxRateM2) }} />
        <div className="ruler-avg" style={{ left: at(band.avgRateM2) }} />
        <div className={`ruler-marker ${position.id}`} style={{ left: at(price) }}>
          <span>{formatUSD(price)}</span>
        </div>
      </div>

      <div className="ruler-ticks" aria-hidden="true">
        {ticks.map((v) => (
          <span key={v} style={{ left: at(v) }}>
            ${formatDec(v, step < 1 ? 2 : 0)}
          </span>
        ))}
      </div>

      <div className="ruler-key">
        <span className="key-band">
          <i />Banda SERCOP {formatUSD(band.minRateM2)} a {formatUSD(band.maxRateM2)}
        </span>
        {priv && (
          <span className="key-private">
            <i />Mercado privado {formatUSD(priv.min)} a {formatUSD(priv.max)}
          </span>
        )}
        <span className="key-avg">
          <i />Promedio {formatUSD(band.avgRateM2)}
        </span>
      </div>
    </div>
  );
}

export function PriceHero({ result, projectName }) {
  if (!result) return null;

  const { costBreakdown, unitEconomics, staffingMetrics, yieldMetrics, inputs, sercopBenchmark: band } = result;
  const position = bandPosition(unitEconomics.unitPricePerM2, band);

  return (
    <section id="results-dashboard-panel" aria-labelledby="hero-title">
      <h2 className="hero-title" id="hero-title">{projectName || 'Oferta sin nombre'}</h2>
      <p className="hero-sub">
        {inputs.infrastructureType.name}, {formatInt(inputs.areaM2)} m², {inputs.shiftRegime.label.toLowerCase()}.
      </p>

      <div className="hero-figures">
        <div className="price-main" id="kpi-unit-price-card">
          {formatUSD(unitEconomics.unitPricePerM2)}
          <small>por m² al mes</small>
        </div>
        <div className="price-total">
          <strong>{formatUSD(costBreakdown.recommendedSellingPrice)}</strong>
          <span>al mes en total. Costo técnico {formatUSD(unitEconomics.unitCostPerM2)} por m².</span>
        </div>
      </div>

      {band && (
        <>
          <p className="hero-sub" style={{ marginTop: '1.25rem' }}>
            <span className={`status ${position.id}`}>{position.label}</span>{' '}
            {position.id === 'outside' && staffingMetrics.coverageFloorApplied
              ? 'Las áreas pequeñas con operación continua cuestan más por m²: la presencia mínima es un costo fijo.'
              : `${formatSigned(band.percentDiffToSercopAvg, 1)} frente al promedio de la referencia SERCOP.`}
          </p>
          <BandRuler price={unitEconomics.unitPricePerM2} band={band} position={position} />
        </>
      )}

      <div className="facts">
        <div className="fact" id="kpi-staffing-card">
          <div className="fact-label">Personal asignado</div>
          <div className="fact-value">
            {formatOne(staffingMetrics.assignedFTE)}
            <small>operarios (FTE)</small>
          </div>
          <div className="fact-note">
            {formatOne(staffingMetrics.dayFTE)} diurnos, {formatOne(staffingMetrics.nightFTE)} nocturnos
          </div>
          {staffingMetrics.coverageFloorApplied && (
            <div className="fact-note warn">
              Por área daban {formatOne(staffingMetrics.areaBasedFTE)}; se aplicó el piso de cobertura continua.
            </div>
          )}
        </div>

        <div className="fact" id="kpi-hours-card">
          <div className="fact-label">Horas operativas</div>
          <div className="fact-value">
            {formatInt(yieldMetrics.monthlyRequiredHours)}
            <small>h al mes</small>
          </div>
          <div className="fact-note">
            {yieldMetrics.dailyInterventions} pasadas por día, {formatInt(yieldMetrics.dailyRequiredHours)} h por día
          </div>
        </div>

        <div className="fact" id="kpi-profit-card">
          <div className="fact-label">Utilidad bruta</div>
          <div className="fact-value">{formatUSD(costBreakdown.profit.amount)}</div>
          <div className="fact-note">Margen de {formatPct(costBreakdown.profit.percentage)} sobre la venta</div>
        </div>
      </div>

      {band && (
        <details className="fold" id="sercop-benchmark-panel">
          <summary>
            Referencia SERCOP en detalle
            <LucideIcon name="ChevronDown" />
          </summary>
          <div className="fold-body">
            <dl className="def-list">
              <dt>Código CPC</dt>
              <dd>{band.cpcCode}</dd>
              <dt>Banda referencial</dt>
              <dd>
                {formatUSD(band.minRateM2)} a {formatUSD(band.maxRateM2)} por m² (promedio {formatUSD(band.avgRateM2)})
              </dd>
              <dt>Esta oferta</dt>
              <dd>
                {formatUSD(unitEconomics.unitPricePerM2)} por m², {formatSigned(band.percentDiffToSercopAvg, 1)} frente al
                promedio ({band.deltaToSercopAvg >= 0 ? '+' : '−'}{formatUSD(Math.abs(band.deltaToSercopAvg))})
              </dd>
              <dt>Clasificación del motor</dt>
              <dd>{band.statusLabel}</dd>
              <dt>Mercado privado</dt>
              <dd>{band.privateMarketRate}</dd>
              <dt>Rendimiento de referencia</dt>
              <dd>{band.normativeYield}</dd>
              <dt>Base salarial</dt>
              <dd>{band.legalWageCompliance}</dd>
              <dt>Fuente de la referencia</dt>
              <dd>{band.source}</dd>
            </dl>
            <p className="note" style={{ marginTop: '0.9rem' }}>
              Las bandas son referenciales. Antes de citar una cifra, verifica el código de proceso en compraspublicas.gob.ec.
            </p>
          </div>
        </details>
      )}
    </section>
  );
}
