import React, { useEffect, useRef, useState } from 'react';
import { LucideIcon } from './LucideIcon';
import { analyzePliego, getAiStatus, getDemoResult, normalizeExtraction, buildFormPatch, typologyName } from '../ai/pliegoParser.js';
import { DEMO_FILE_URL } from '../ai/demoPliegoResult.js';
import { INFRASTRUCTURE_TYPES, SHIFT_REGIMES, TRAFFIC_LEVELS, DISINFECTION_PROTOCOLS, MACHINERY_OPTIONS } from '../data/parametricData.js';
import { formatUSD } from './ResultsDashboard';

const OPTION_SOURCES = {
  tipologia: Object.values(INFRASTRUCTURE_TYPES).map((t) => [t.id, t.name]),
  regimen_turnos: Object.values(SHIFT_REGIMES).map((s) => [s.id, s.label]),
  trafico: Object.values(TRAFFIC_LEVELS).map((t) => [t.id, t.label]),
  protocolo: Object.values(DISINFECTION_PROTOCOLS).map((p) => [p.id, p.name]),
  maquinaria: Object.values(MACHINERY_OPTIONS).map((m) => [m.id, m.label])
};

const box = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem' };
const muted = { fontSize: '0.75rem', color: '#64748b' };

function Evidence({ page, quote }) {
  if (!page && !quote) return <span style={{ ...muted, fontStyle: 'italic' }}>No encontrado en el pliego</span>;
  return (
    <span style={{ fontSize: '0.74rem', color: '#334155' }}>
      {page ? <strong style={{ color: '#0284c7' }}>Pág. {page}</strong> : null}
      {quote ? <span style={{ fontStyle: 'italic' }}> “{quote}”</span> : null}
    </span>
  );
}

function SourceBadge({ meta }) {
  const isDemo = meta?.provider === 'demo';
  return (
    <span
      style={{
        fontSize: '0.7rem',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '999px',
        color: isDemo ? '#92400e' : '#065f46',
        background: isDemo ? '#fef3c7' : '#d1fae5',
        border: `1px solid ${isDemo ? '#fcd34d' : '#6ee7b7'}`
      }}
    >
      {isDemo ? 'MODO DEMO — resultado pregrabado' : `IA: Gemini (${meta?.model})`}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODAL: subir pliego → analizar → revisar → aplicar
   ═══════════════════════════════════════════════════════════════════════════ */
export function PliegoImporter({ onClose, onApply }) {
  const [step, setStep] = useState('upload'); // upload | analyzing | review
  const [status, setStatus] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);
  const [data, setData] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    getAiStatus().then(setStatus);
  }, []);

  const loadResult = ({ extraction, meta: m }) => {
    const normalized = normalizeExtraction(extraction);
    setMeta(m);
    setData(normalized);
    setStep('review');
  };

  const runAnalysis = async () => {
    setError(null);
    setStep('analyzing');
    try {
      loadResult(await analyzePliego(file));
    } catch (e) {
      setError(e);
      setStep('upload');
    }
  };

  const useDemo = () => {
    setError(null);
    loadResult(getDemoResult());
  };

  const onPick = (f) => {
    setError(null);
    if (f && f.type && f.type !== 'application/pdf') {
      setError(new Error('El archivo debe ser un PDF.'));
      return;
    }
    setFile(f || null);
  };

  const updateField = (key, patch) => setData((d) => ({ ...d, reviewFields: d.reviewFields.map((f) => (f.key === key ? { ...f, ...patch } : f)) }));

  const apply = () => {
    const patch = buildFormPatch(data.reviewFields);
    const extracted = Object.fromEntries(data.reviewFields.map((f) => [f.key, f.value]));
    onApply({ patch, normalized: data, extracted, meta });
  };

  return (
    <div className="modal-overlay" id="pliego-modal-overlay">
      <div className="modal-container" style={{ maxWidth: '1050px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="card-icon-badge" style={{ background: '#eef2ff', color: '#4f46e5', width: '32px', height: '32px' }}>
              <LucideIcon name="Sparkles" size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>Importar pliego con IA</h3>
              <p style={muted}>La IA propone los datos con su evidencia; el analista revisa y el motor paramétrico calcula.</p>
            </div>
          </div>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '0.5rem 0.75rem' }} id="pliego-close-btn">
            <LucideIcon name="X" size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Indicador de conexión */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.78rem' }}>
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: status === null ? '#94a3b8' : status.configured ? '#10b981' : '#f59e0b'
              }}
            />
            {status === null && <span style={muted}>Verificando conexión con la IA…</span>}
            {status?.configured && <span style={{ color: '#065f46' }}>IA conectada: Gemini (clave configurada en .env.local)</span>}
            {status && !status.configured && (
              <span style={{ color: '#92400e' }}>
                {status.available ? 'Sin clave de Gemini en .env.local: solo está disponible el modo demo.' : 'Servidor de IA no disponible: solo está disponible el modo demo.'}
              </span>
            )}
          </div>

          {/* PASO 1: SUBIR */}
          {step === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  onPick(e.dataTransfer.files?.[0]);
                }}
                onClick={() => inputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#4f46e5' : '#cbd5e1'}`,
                  background: dragOver ? '#eef2ff' : '#f8fafc',
                  borderRadius: '12px',
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                id="pliego-dropzone"
              >
                <LucideIcon name="FileText" size={30} color="#4f46e5" />
                <p style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.5rem' }}>{file ? file.name : 'Arrastra aquí el pliego o términos de referencia (PDF)'}</p>
                <p style={muted}>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'o haz clic para seleccionarlo • máximo 20 MB'}</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => onPick(e.target.files?.[0])}
                  id="pliego-file-input"
                />
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <strong>No se pudo analizar el pliego:</strong> {error.message}
                  {['NO_KEY', 'QUOTA', 'NETWORK', 'API_ERROR'].includes(error.code) && <div style={{ marginTop: '0.35rem' }}>Puedes continuar con el modo demo mientras tanto.</div>}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn-primary" disabled={!file || !status?.configured} onClick={runAnalysis} id="pliego-analyze-btn" style={{ opacity: !file || !status?.configured ? 0.5 : 1 }}>
                  <LucideIcon name="Sparkles" size={14} /> Analizar con IA
                </button>
                <button className="btn-secondary" onClick={useDemo} id="pliego-demo-btn">
                  <LucideIcon name="FolderOpen" size={14} /> Usar ejemplo (modo demo, sin IA)
                </button>
                <a href={DEMO_FILE_URL} download style={{ fontSize: '0.78rem', color: '#0284c7' }}>
                  <LucideIcon name="Download" size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 3 }} />
                  Descargar el pliego de ejemplo (ficticio) para probar la IA
                </a>
              </div>
              <p style={muted}>
                El PDF se envía a Google Gemini para su análisis. En el plan gratuito, Google puede usar el contenido para mejorar sus servicios: use solo pliegos públicos.
              </p>
            </div>
          )}

          {/* PASO 2: ANALIZANDO */}
          {step === 'analyzing' && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div className="pliego-spinner" style={{ width: 40, height: 40, margin: '0 auto', border: '4px solid #e0e7ff', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'pliegospin 0.9s linear infinite' }} />
              <style>{'@keyframes pliegospin { to { transform: rotate(360deg); } }'}</style>
              <p style={{ fontWeight: 600, marginTop: '1rem' }}>Analizando "{file?.name}" con Gemini…</p>
              <p style={muted}>Suele tardar entre 10 y 60 segundos según el tamaño del documento.</p>
            </div>
          )}

          {/* PASO 3: REVISAR */}
          {step === 'review' && data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ ...box, display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.6 }}>
                  <div>
                    <strong>Archivo:</strong> {meta?.fileName}
                  </div>
                  {data.entidad && (
                    <div>
                      <strong>Entidad:</strong> {data.entidad}
                    </div>
                  )}
                  {data.objeto && (
                    <div>
                      <strong>Objeto:</strong> {data.objeto}
                    </div>
                  )}
                  {data.codigo && (
                    <div>
                      <strong>Código:</strong> {data.codigo}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <SourceBadge meta={meta} />
                  {meta?.ms && <div style={{ ...muted, marginTop: 4 }}>{(meta.ms / 1000).toFixed(1)} s</div>}
                </div>
              </div>

              {!data.isCleaningTender && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                  La IA indica que este documento <strong>no parece un pliego de servicio de limpieza</strong>. Revise los datos antes de aplicarlos.
                </div>
              )}

              {data.warnings.length > 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.78rem', color: '#92400e' }}>
                  <strong>Advertencias para el analista:</strong>
                  <ul style={{ paddingLeft: '1.1rem', marginTop: '0.25rem' }}>
                    {data.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Parámetros a aplicar */}
              <div style={box}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>1. Parámetros para el cotizador (revise y corrija antes de aplicar)</h4>
                <table className="data-table" style={{ fontSize: '0.78rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Aplicar</th>
                      <th>Parámetro</th>
                      <th style={{ width: '32%' }}>Valor propuesto por la IA</th>
                      <th>Evidencia en el pliego</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reviewFields.map((f) => (
                      <tr key={f.key}>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={f.apply} disabled={f.value === null} onChange={(e) => updateField(f.key, { apply: e.target.checked })} />
                        </td>
                        <td>
                          <strong>{f.label}</strong>
                        </td>
                        <td>
                          {f.kind === 'enum' ? (
                            <select
                              className="select-input"
                              style={{ fontSize: '0.75rem', padding: '0.3rem' }}
                              value={f.value ?? ''}
                              onChange={(e) => updateField(f.key, { value: e.target.value || null, apply: Boolean(e.target.value) })}
                            >
                              <option value="">— no encontrado —</option>
                              {OPTION_SOURCES[f.options].map(([id, label]) => (
                                <option key={id} value={id}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number"
                              className="text-input"
                              style={{ fontSize: '0.75rem', padding: '0.3rem', width: '120px' }}
                              value={f.value ?? ''}
                              placeholder="no encontrado"
                              onChange={(e) => {
                                const v = e.target.value === '' ? null : Number(e.target.value);
                                updateField(f.key, { value: v, apply: v !== null });
                              }}
                            />
                          )}
                        </td>
                        <td>
                          <Evidence page={f.page} quote={f.quote} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Requisitos */}
              <div style={box}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>2. Requisitos del pliego (para verificar cumplimiento)</h4>
                <table className="data-table" style={{ fontSize: '0.78rem' }}>
                  <tbody>
                    {data.requirementFields.map((f) => (
                      <tr key={f.key}>
                        <td style={{ width: '32%' }}>
                          <strong>{f.label}</strong>
                        </td>
                        <td style={{ width: '28%' }}>
                          {f.value === null
                            ? '—'
                            : f.kind === 'boolean'
                              ? f.value
                                ? 'Sí'
                                : 'No'
                              : f.key === 'presupuesto_referencial_total'
                                ? formatUSD(f.value)
                                : String(f.value)}
                        </td>
                        <td>
                          <Evidence page={f.page} quote={f.quote} />
                        </td>
                      </tr>
                    ))}
                    {data.requirements.presupuesto_mensual != null && (
                      <tr>
                        <td>
                          <strong>Presupuesto mensual (calculado)</strong>
                        </td>
                        <td>{formatUSD(data.requirements.presupuesto_mensual)}</td>
                        <td style={muted}>Total ÷ plazo (cálculo del sistema, no de la IA)</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Zonas y multas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div style={box}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem' }}>Zonas detectadas</h4>
                  {data.zonas.length === 0 ? (
                    <p style={muted}>No se detectaron zonas.</p>
                  ) : (
                    <table className="data-table" style={{ fontSize: '0.75rem' }}>
                      <tbody>
                        {data.zonas.map((z, i) => (
                          <tr key={i}>
                            <td>{z.nombre}</td>
                            <td className="num-cell">{z.area_m2 != null ? `${z.area_m2.toLocaleString('es-EC')} m²` : '—'}</td>
                            <td style={muted}>{z.tipologia ? typologyName(z.tipologia) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div style={box}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem' }}>Multas y penalidades</h4>
                  {data.multas.length === 0 ? (
                    <p style={muted}>No se detectaron multas.</p>
                  ) : (
                    <ul style={{ fontSize: '0.76rem', color: '#334155', paddingLeft: '1.1rem', lineHeight: 1.5 }}>
                      {data.multas.map((m, i) => (
                        <li key={i}>
                          {m.descripcion} {m.pagina ? <span style={{ color: '#0284c7' }}>(pág. {m.pagina})</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setStep('upload');
                    setData(null);
                  }}
                >
                  Volver
                </button>
                <button className="btn-primary" onClick={apply} id="pliego-apply-btn">
                  <LucideIcon name="CheckCircle2" size={14} /> Aplicar al cotizador ({data.reviewFields.filter((f) => f.apply).length} parámetros)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PANEL DE CUMPLIMIENTO (se muestra en la pestaña de cotización)
   ═══════════════════════════════════════════════════════════════════════════ */
const STATUS_STYLE = {
  ok: { icon: 'CheckCircle2', color: '#059669' },
  warn: { icon: 'AlertTriangle', color: '#d97706' },
  fail: { icon: 'XCircle', color: '#dc2626' },
  info: { icon: 'Info', color: '#64748b' }
};

export function CompliancePanel({ compliance, pliego, onClear }) {
  if (!compliance || !pliego) return null;
  const { summary, checks } = compliance;
  return (
    <section className="glass-card" id="compliance-panel" style={{ borderLeft: `4px solid ${summary.fail ? '#dc2626' : summary.warn ? '#d97706' : '#059669'}` }}>
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon-badge" style={{ background: '#eef2ff', color: '#4f46e5' }}>
            <LucideIcon name="ListChecks" size={18} />
          </div>
          <div>
            <h2>Cumplimiento del Pliego</h2>
            <p className="card-subtitle">
              {pliego.meta?.fileName} • {pliego.normalized.entidad || 'Entidad no indicada'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <SourceBadge meta={pliego.meta} />
          <button className="btn-secondary" onClick={onClear} style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
            Quitar pliego
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
        <span style={{ color: '#059669', fontWeight: 700 }}>✔ {summary.ok} cumple</span>
        <span style={{ color: '#d97706', fontWeight: 700 }}>⚠ {summary.warn} revisar</span>
        <span style={{ color: '#dc2626', fontWeight: 700 }}>✖ {summary.fail} no cumple</span>
      </div>
      <table className="data-table" style={{ fontSize: '0.78rem' }}>
        <tbody>
          {checks.map((c, i) => (
            <tr key={i}>
              <td style={{ width: 28 }}>
                <LucideIcon name={STATUS_STYLE[c.status].icon} size={16} color={STATUS_STYLE[c.status].color} />
              </td>
              <td style={{ width: '24%' }}>
                <strong>{c.label}</strong>
              </td>
              <td>{c.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ ...muted, marginTop: '0.6rem' }}>
        La verificación la hace el sistema con reglas fijas a partir de los datos revisados por el analista; la IA no decide el cumplimiento ni el precio.
      </p>
    </section>
  );
}
