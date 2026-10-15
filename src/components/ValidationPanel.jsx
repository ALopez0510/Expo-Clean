import React, { useMemo } from 'react';
import { LucideIcon } from './LucideIcon';
import { SERCOP_SECTOR_BENCHMARKS } from '../data/parametricData.js';
import { buildSensitivity, runCoherenceChecks, presetContrast } from '../utils/analysis';
import { formatUSD, formatInt, formatSigned } from '../utils/format';

function Sensitivity({ state }) {
  const { base, rows } = useMemo(() => buildSensitivity(state), [state]);
  const scale = Math.max(10, ...rows.map((r) => r.span));

  const bar = (delta) => {
    const w = Math.min(50, (Math.abs(delta) / scale) * 50);
    return { width: `${w}%` };
  };

  return (
    <div>
      <h3 className="section-title">Qué mueve más el precio</h3>
      <p className="section-lead">
        Cambio del precio por m² (hoy {formatUSD(base)}) al llevar cada variable de un extremo al otro, con todo lo demás igual.
      </p>

      <ul className="tornado" id="sensitivity-chart">
        {rows.map((r) => (
          <li key={r.id}>
            <div className="tornado-name">
              {r.label}
              <small>
                {r.a.label} / {r.b.label}
              </small>
            </div>
            <div className="tornado-chart" role="img" aria-label={`${r.label}: ${r.a.label} ${formatSigned(r.a.delta)}, ${r.b.label} ${formatSigned(r.b.delta)}`}>
              <div className="tornado-axis" />
              {[r.a, r.b].map((s, i) => {
                const down = s.delta < 0;
                if (Math.abs(s.delta) < 0.05) return null;
                return (
                  <React.Fragment key={i}>
                    <div className={`tornado-bar ${down ? 'down' : 'up'}`} style={bar(s.delta)} />
                    <span
                      className="tornado-val"
                      style={down ? { right: `calc(50% + ${bar(s.delta).width} + 4px)` } : { left: `calc(50% + ${bar(s.delta).width} + 4px)` }}
                    >
                      {formatSigned(s.delta)}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      <div className="tornado-legend">
        <span />
        <div>
          <span>Baja el precio</span>
          <span>Sube el precio</span>
        </div>
      </div>
    </div>
  );
}

function Checks({ state }) {
  const checks = useMemo(() => runCoherenceChecks(state), [state]);
  const passed = checks.filter((c) => c.ok).length;

  return (
    <div id="coherence-checks">
      <h3 className="section-title">Pruebas de coherencia</h3>
      <p className="section-lead">
        Se ejecutan en vivo sobre el caso actual. Verifican que el modelo se comporte como se espera al mover cada variable:{' '}
        <span className="score">{passed} de {checks.length} superadas</span>.
      </p>
      <ul className="checks">
        {checks.map((c) => (
          <li key={c.id} className={c.ok ? '' : 'fail'}>
            <span className="mark">
              <LucideIcon name={c.ok ? 'Check' : 'X'} size={13} />
            </span>
            <span>
              {c.label}
              <small>{c.detail}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Contrast({ onSelectPreset }) {
  const rows = useMemo(() => presetContrast(), []);

  return (
    <div id="preset-contrast">
      <h3 className="section-title">Casos de referencia frente a su banda</h3>
      <p className="section-lead">
        El modelo aplicado a los 6 casos precargados, comparado con la banda referencial de su tipo de infraestructura.
      </p>
      <div className="table-wrap" style={{ marginTop: '1rem' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Caso</th>
              <th className="num">Metraje</th>
              <th className="num">Modelo por m²</th>
              <th className="num">Banda por m²</th>
              <th>Posición</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <button className="link-btn" onClick={() => onSelectPreset(r.id)}>
                    {r.name}
                  </button>
                  {r.floorApplied && <span className="row-note">Con piso de cobertura continua</span>}
                </td>
                <td className="num">{formatInt(r.areaM2)} m²</td>
                <td className="num">{formatUSD(r.price)}</td>
                <td className="num">
                  {formatUSD(r.min)} a {formatUSD(r.max)}
                </td>
                <td>
                  <span className={`status ${r.position.id}`}>{r.position.label}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note" style={{ marginTop: '0.9rem' }}>
        Esto compara el modelo con bandas referenciales, no con contratos individuales. Los coeficientes se ajustaron con esas
        mismas bandas, así que no es una validación independiente. Falta contrastar con una cotización real de una empresa del
        sector.
      </p>
    </div>
  );
}

function SectorMatrix({ activeCpc }) {
  return (
    <div>
      <h3 className="section-title">Precios de referencia por sector</h3>
      <p className="section-lead">
        Bandas referenciales (CPC 85330, contratación pública y sector privado). Verifica el código de proceso antes de citarlas.
      </p>
      <div className="table-wrap" style={{ marginTop: '1rem' }}>
        <table className="table" id="sercop-multi-sector-table">
          <thead>
            <tr>
              <th>Sector</th>
              <th>CPC</th>
              <th className="num">Banda SERCOP por m²</th>
              <th>Mercado privado</th>
              <th>Rendimiento de referencia</th>
              <th>Contratos citados</th>
            </tr>
          </thead>
          <tbody>
            {SERCOP_SECTOR_BENCHMARKS.map((item) => {
              const active = activeCpc?.startsWith(item.cpcCode.slice(0, 8));
              return (
                <tr key={item.cpcCode} className={active ? 'is-active' : ''}>
                  <td>
                    {item.sector}
                    {active && <span className="tag">En uso</span>}
                  </td>
                  <td>{item.cpcCode}</td>
                  <td className="num">
                    {formatUSD(item.sercopMin)} a {formatUSD(item.sercopMax)}
                    <span className="row-note">Promedio {formatUSD(item.sercopAvg)}</span>
                  </td>
                  <td>{item.privateRate}</td>
                  <td>{item.normativeYield}</td>
                  <td>{item.officialContractRef}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ValidationPanel({ formState, result, onSelectPreset }) {
  return (
    <>
      <Checks state={formState} />
      <Sensitivity state={formState} />
      <Contrast onSelectPreset={onSelectPreset} />
      <SectorMatrix activeCpc={result.inputs.infrastructureType.cpcCode} />
    </>
  );
}
