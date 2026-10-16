import React, { useState, useMemo } from 'react';
import { LucideIcon } from './LucideIcon';
import { runValidationSuite, runScenarioCalibration } from '../utils/calculator.js';
import { formatUSD } from './ResultsDashboard';

const card = { background: '#ffffff', border: '1px solid #e2e8f0' };
const h4 = (color) => ({ color, marginBottom: '0.75rem', fontSize: '0.975rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' });
const p = { fontSize: '0.85rem', lineHeight: 1.6, color: '#334155' };
const todo = { background: '#fffbeb', border: '1px dashed #f59e0b', color: '#92400e', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' };

const SECTIONS = [
  ['problema', '1. Problema'],
  ['solucion', '2. Solución'],
  ['innovacion', '3. Innovación'],
  ['validacion', '4. Validación'],
  ['viabilidad', '5. Viabilidad'],
  ['negocio', '6. Modelo de negocio'],
  ['matriz', '7. Matriz y próximo paso']
];

export function HackathonDefenseTab({ onClose, params }) {
  const [activeSection, setActiveSection] = useState('problema');
  const validation = useMemo(() => runValidationSuite(params), [params]);
  const calibration = useMemo(() => runScenarioCalibration(), []);
  const critical = calibration.find((c) => c.id === 'critical_block');
  const office = calibration.find((c) => c.id === 'public_office');

  return (
    <div className="modal-overlay" id="defense-modal-overlay">
      <div className="modal-container" style={{ maxWidth: '1100px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="card-icon-badge" style={{ background: '#ecfdf5', color: '#059669', width: '32px', height: '32px' }}>
              <LucideIcon name="Award" size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>Ficha Técnica • Expo Clean Ecuador 2026 — Reto 2</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Gestión Inteligente de Procesos • Entregables según sección 9 y Anexo 5 del manual</p>
            </div>
          </div>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '0.5rem 0.85rem' }}>
            <LucideIcon name="X" size={15} /> Cerrar
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', background: '#f8fafc', padding: '0 1.5rem', borderBottom: '1px solid var(--border-subtle)', gap: '0.25rem' }}>
          {SECTIONS.map(([id, label]) => (
            <button key={id} className={`tab-btn ${activeSection === id ? 'active' : ''}`} onClick={() => setActiveSection(id)}>
              {label}
            </button>
          ))}
        </div>

        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {activeSection === 'problema' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-card" style={card}>
                <h4 style={h4('#059669')}>
                  <LucideIcon name="Target" size={16} /> Problema, usuario y contexto
                </h4>
                <div style={{ ...p, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <p>
                    <strong>Qué ocurre:</strong> el valor por m² de un servicio de limpieza no es estándar. Oficinas, patios de comida, hospitalización y áreas críticas requieren cálculos distintos de
                    rendimiento, personal e insumos (planteamiento oficial del Reto 2), pero es común cotizar con una tarifa única por m² o con reglas fijas de personal.
                  </p>
                  <p>
                    <strong>A quién afecta:</strong> a los analistas de costos y equipos comerciales de empresas de limpieza que preparan ofertas, y a los clientes públicos y privados que las reciben.
                  </p>
                  <p>
                    <strong>Consecuencia:</strong> ofertas con margen negativo cuando la operación es exigente (turnos 24/7, riesgo sanitario alto) o con sobreprecio cuando es sencilla.
                  </p>
                  <p>
                    <strong>Evidencia pública:</strong> los propios precios del Estado varían mucho según el tipo de servicio: catálogo SERCOP desde USD 0,64/m² (áreas externas) hasta USD 2,04/m²
                    (alta afluencia), y contratos hospitalarios IESS entre USD 1,84 y USD 3,03/m².
                  </p>
                  <p>
                    <strong>Evidencia del equipo:</strong> <span style={todo}>[completar: entrevistas o conversaciones con empresas del sector y lo que dijeron]</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'solucion' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-card" style={card}>
                <h4 style={h4('#059669')}>
                  <LucideIcon name="Cpu" size={16} /> Descripción y funcionamiento
                </h4>
                <p style={{ ...p, marginBottom: '0.75rem' }}>
                  CleanQuote Pro es un cotizador web que recibe las variables del reto (metraje, tráfico peatonal, riesgo sanitario, turnos y protocolo de desinfección, más frecuencia y
                  mecanización) y calcula personal, costos unitarios, margen y una oferta técnico-financiera exportable.
                </p>
                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '0.8rem', color: '#0f172a', lineHeight: 1.8 }}>
                  1. Cobertura por auxiliar/turno = (R_base × k_maq × k_protocolo) ÷ (k_riesgo × k_tráfico × k_frecuencia)
                  <br />
                  2. Puestos por turno = Área ÷ Cobertura, con la regla de redondeo de las fichas SERCOP
                  <br />
                  3. FTE = Σ (puestos × horas × días/semana) ÷ 40 h legales (× reemplazo de vacaciones si opera 7 días)
                  <br />
                  4. Mano de obra = FTE × costo empresa (SBU 2026 USD 482 + IESS + décimos + reservas + vacaciones) + recargo nocturno 25% + supervisión 1/25
                  <br />
                  5. Costo total = Mano de obra + insumos + EPP + maquinaria + indirectos
                  <br />
                  6. Precio = Costo total ÷ (1 − margen) — IVA 15% aparte
                </div>
              </div>
            </div>
          )}

          {activeSection === 'innovacion' && (
            <div className="glass-card" style={card}>
              <h4 style={h4('#059669')}>
                <LucideIcon name="Sparkles" size={16} /> ¿Qué la hace diferente?
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {[
                  ['Cálculo por turnos y puestos', 'No divide m² entre una tarifa: calcula cuántas personas deben estar presentes en cada turno y convierte eso en FTE legales.'],
                  ['Trazabilidad de cada dato', 'Cada parámetro muestra si es oficial, de contrato real, derivado o estimación del equipo, con enlace a la fuente.'],
                  ['Validación integrada', 'Pruebas automáticas de coherencia y análisis de sensibilidad dentro de la misma herramienta.'],
                  ['Comparación con precios públicos', 'Contrasta cada cotización con el catálogo SERCOP o contratos IESS y muestra el margen implícito.']
                ].map(([t, d]) => (
                  <div key={t} style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ color: '#0284c7', fontSize: '0.85rem' }}>{t}</strong>
                    <p style={{ fontSize: '0.785rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.4 }}>{d}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'validacion' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-card" style={card}>
                <h4 style={h4('#059669')}>
                  <LucideIcon name="ClipboardCheck" size={16} /> ¿Qué probamos?
                </h4>
                <ul style={{ ...p, paddingLeft: '1.2rem' }}>
                  <li>
                    <strong>{validation.passed}/{validation.total} pruebas automáticas de coherencia superadas</strong> (identidades contables, cumplimiento laboral, consistencia con fichas SERCOP y
                    dirección de cada variable). Detalle en la pestaña "Validación".
                  </li>
                  <li>
                    Con los parámetros de la ficha SERCOP de áreas internas, el modelo reproduce la regla oficial de 900 m² por auxiliar y su redondeo.
                  </li>
                  <li>
                    Calibración frente a referencias públicas: el escenario de oficinas da {office ? formatUSD(office.unitPricePerM2) : '—'}/m² frente a USD 1,58 del catálogo; el bloque crítico 24/7 da{' '}
                    {critical ? formatUSD(critical.unitPricePerM2) : '—'}/m², porque exige al menos un puesto en cada uno de los 3 turnos.
                  </li>
                </ul>
              </div>
              <div className="glass-card" style={card}>
                <h4 style={h4('#0284c7')}>
                  <LucideIcon name="Users" size={16} /> ¿Con quién? ¿Qué modificamos?
                </h4>
                <p style={p}>
                  <span style={todo}>[completar con las pruebas reales del equipo: empresa o cargo del entrevistado, fecha, escenario probado, comentario recibido y cambio realizado]</span>
                </p>
                <p style={{ ...p, marginTop: '0.5rem' }}>
                  Cambios ya realizados tras la revisión de fuentes: SBU actualizado a USD 482; reemplazo de "bandas" no verificables por precios de catálogo SERCOP y contratos IESS; regla de puestos
                  mínimos por turno para servicios 24/7.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'viabilidad' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <div className="glass-card" style={card}>
                <h4 style={h4('#059669')}>
                  <LucideIcon name="Cpu" size={16} /> Tecnología
                </h4>
                <p style={p}>
                  Aplicación web React + Vite que funciona en el navegador sin servidor ni base de datos. El motor de cálculo está separado de la interfaz (utils/calculator.js) y los parámetros en un
                  archivo de datos (data/parametricData.js), lo que permite actualizar SBU, precios o rendimientos sin reescribir la lógica.
                </p>
              </div>
              <div className="glass-card" style={card}>
                <h4 style={h4('#0284c7')}>
                  <LucideIcon name="Briefcase" size={16} /> Recursos e implementación
                </h4>
                <ul style={{ ...p, paddingLeft: '1.2rem' }}>
                  <li>Piloto con 1–2 empresas: cargar sus rendimientos y costos reales en lugar de las estimaciones.</li>
                  <li>Comparar cotizaciones del modelo con contratos ya ejecutados por la empresa.</li>
                  <li>Añadir usuarios, historial de cotizaciones y base de datos.</li>
                  <li>
                    Equipo mínimo: <span style={todo}>[completar]</span>
                  </li>
                </ul>
              </div>
              <div className="glass-card" style={card}>
                <h4 style={h4('#d97706')}>
                  <LucideIcon name="AlertTriangle" size={16} /> Riesgos y mitigación
                </h4>
                <ul style={{ ...p, paddingLeft: '1.2rem' }}>
                  <li>
                    <strong>Factores estimados</strong> (riesgo, tráfico, frecuencia): se calibran con datos de cada empresa en el piloto.
                  </li>
                  <li>
                    <strong>Precios públicos desactualizados</strong> (fichas 2023): actualización periódica desde el catálogo SERCOP.
                  </li>
                  <li>
                    <strong>Cambios normativos</strong> (SBU, recargos): parámetros editables y supuestos visibles.
                  </li>
                  <li>
                    <strong>Recargo de fin de semana no modelado</strong>: validar con asesoría laboral el esquema de descansos rotativos.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'negocio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-card" style={card}>
                <h4 style={h4('#059669')}>
                  <LucideIcon name="Wallet" size={16} /> Propuesta del equipo (por validar)
                </h4>
                <table className="data-table" style={{ fontSize: '0.82rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '28%' }}>
                        <strong>Cliente</strong>
                      </td>
                      <td>Empresas de limpieza y facility management que cotizan a clientes públicos y privados; áreas de compras que necesitan estimar presupuestos referenciales.</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Propuesta de valor</strong>
                      </td>
                      <td>Cotizaciones diferenciadas en minutos, con personal y costos legales explícitos, comparación con precios públicos y supuestos trazables.</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Ingresos / sostenibilidad</strong>
                      </td>
                      <td>
                        Suscripción mensual por empresa y servicio de calibración inicial con los datos del cliente. Precio: <span style={todo}>[definir y validar con empresas]</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Costos principales</strong>
                      </td>
                      <td>
                        Desarrollo y mantenimiento, actualización de parámetros normativos, alojamiento web y soporte. Estimación: <span style={todo}>[completar]</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'matriz' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-card" style={card}>
                <h4 style={h4('#059669')}>
                  <LucideIcon name="CheckSquare" size={16} /> Evidencia por criterio de la matriz oficial (Anexo 6)
                </h4>
                <table className="data-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Criterio</th>
                      <th style={{ width: '70px', textAlign: 'center' }}>Peso</th>
                      <th>Evidencia en CleanQuote Pro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Comprensión del problema', '15%', 'Variación real de precios públicos por tipo de servicio; variables oficiales del Reto 2 integradas.'],
                      ['Innovación de la solución', '15%', 'Cálculo por puestos y turnos, trazabilidad de fuentes y validación integrada.'],
                      ['Viabilidad técnica', '15%', 'App web funcional sin servidor; motor separado de los datos; parámetros legales editables.'],
                      ['Impacto potencial', '15%', 'Evita ofertas con margen negativo en servicios exigentes y sobreprecio en servicios simples (ver comparación).'],
                      ['Prototipo, demo o simulación', '20%', `Prototipo funcional con 6 escenarios, exportación PDF/CSV y ${validation.total} pruebas automáticas.`],
                      ['Calidad de la presentación', '10%', 'Demo en vivo de un caso, comparación y validación.'],
                      ['Proceso y trabajo en equipo', '10%', '[completar: roles de cada integrante]']
                    ].map(([c, w, e]) => (
                      <tr key={c}>
                        <td>
                          <strong>{c}</strong>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{w}</td>
                        <td>{e.startsWith('[') ? <span style={todo}>{e}</span> : e}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="glass-card" style={card}>
                <h4 style={h4('#0284c7')}>
                  <LucideIcon name="Rocket" size={16} /> Próximo paso
                </h4>
                <p style={p}>
                  Piloto con una empresa de limpieza para reemplazar las estimaciones por sus rendimientos y costos reales, contrastar con contratos ejecutados y medir el ahorro de tiempo por
                  cotización. <span style={todo}>[ajustar según conversaciones con mentores y empresas]</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
