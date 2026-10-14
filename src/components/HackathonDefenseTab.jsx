import React, { useState } from 'react';
import { LucideIcon } from './LucideIcon';

export function HackathonDefenseTab({ onClose }) {
  const [activeSection, setActiveSection] = useState('problema');

  return (
    <div className="modal-overlay" id="defense-modal-overlay">
      <div className="modal-container" style={{ maxWidth: '1100px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="card-icon-badge" style={{ background: '#ecfdf5', color: '#059669', width: '32px', height: '32px' }}>
              <LucideIcon name="Award" size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>
                Ficha Técnica & Sustentación Oficial • Expo Clean Ecuador 2026
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Gestión Inteligente de Procesos: Sistema dinámico de cotización calibrado con compras públicas (SERCOP) y criterios de evaluación (Anexo 5 y Anexo 6)
              </p>
            </div>
          </div>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '0.5rem 0.85rem' }}>
            <LucideIcon name="X" size={15} /> Cerrar
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div style={{ display: 'flex', background: '#f8fafc', padding: '0 1.5rem', borderBottom: '1px solid var(--border-subtle)', gap: '0.5rem' }}>
          <button
            className={`tab-btn ${activeSection === 'problema' ? 'active' : ''}`}
            onClick={() => setActiveSection('problema')}
          >
            1. Problema & Justificación
          </button>
          <button
            className={`tab-btn ${activeSection === 'solucion' ? 'active' : ''}`}
            onClick={() => setActiveSection('solucion')}
          >
            2. Solución & Algoritmo SERCOP
          </button>
          <button
            className={`tab-btn ${activeSection === 'innovacion' ? 'active' : ''}`}
            onClick={() => setActiveSection('innovacion')}
          >
            3. Innovación & Diferenciación
          </button>
          <button
            className={`tab-btn ${activeSection === 'matriz' ? 'active' : ''}`}
            onClick={() => setActiveSection('matriz')}
          >
            4. Matriz de Evaluación (Anexo 6)
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {activeSection === 'problema' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <h4 style={{ color: '#059669', marginBottom: '0.75rem', fontSize: '0.975rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <LucideIcon name="Target" size={16} /> ¿Qué problema concreto busca resolver su equipo? (Respuesta Oficial)
                </h4>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.65, color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <p>
                    <strong>Qué ocurre actualmente:</strong> Se carece de un modelo paramétrico de cotización que diferencie exigencias operativas y microbiológicas. Se usan valores genéricos sin integrar variables críticas (riesgo sanitario, tráfico, turnos, normativas) para calcular rendimientos, insumos y personal.
                  </p>
                  <p>
                    <strong>Dónde ocurre:</strong> En departamentos comerciales y operativos de empresas de facility management al elaborar propuestas para infraestructuras heterogéneas (áreas hospitalarias, patios de comida, oficinas, campus universitarios e industrias).
                  </p>
                  <p>
                    <strong>A quién afecta:</strong> A analistas de costos y equipos de ventas que no tienen herramientas para estructurar ofertas verídicas, y a clientes (públicos y privados) que reciben propuestas desajustadas a su realidad operativa.
                  </p>
                  <p>
                    <strong>Principal consecuencia:</strong> Estimación imprecisa de costos que erosiona la rentabilidad del proveedor, genera ofertas poco competitivas o inviables, y eleva el riesgo de incumplir protocolos de bioseguridad por subestimar el personal necesario.
                  </p>
                </div>
              </div>

              <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <h4 style={{ color: '#0284c7', marginBottom: '0.75rem', fontSize: '0.975rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <LucideIcon name="Lightbulb" size={16} /> Origen de la Idea & Evidencia del Mercado
                </h4>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#334155' }}>
                  La idea surge al identificar la enorme brecha entre las exigencias operativas reales de diferentes infraestructuras y los métodos manuales de cotización utilizados en facility management. Notamos que aplicar tarifas planas genéricas (ej. $1.25/m²) a espacios con necesidades sanitarias tan dispares (ej. áreas hospitalarias críticas 24/7 frente a oficinas) provoca distorsiones severas: en salud se pierde dinero y se vulnera la vida por falta de personal, mientras que en oficinas se pierde la licitación por sobreprecio. Reconociendo el potencial de los sistemas paramétricos, la idea nace de la necesidad de desarrollar un algoritmo dinámico que integre las bandas referenciales del <strong>SERCOP (CPC 85330)</strong> y los salarios de ley del <strong>Ministerio del Trabajo</strong>.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'solucion' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <h4 style={{ color: '#059669', marginBottom: '0.75rem', fontSize: '0.975rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <LucideIcon name="Cpu" size={16} /> Descripción de la Solución (CleanQuote Pro)
                </h4>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#334155', marginBottom: '0.75rem' }}>
                  Nuestro equipo desarrolló una plataforma de software sustentada en un motor paramétrico multidimensional que automatiza la estructuración de costos unitarios en facility management. La herramienta reemplaza las cotizaciones empíricas por un modelo determinístico calibrado con los contratos y pliegos reales del Servicio Nacional de Contratación Pública (SERCOP) de Ecuador.
                </p>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#334155' }}>
                  El usuario ingresa las variables operativas (metraje, tráfico, nivel de riesgo sanitario, turnos y grado de mecanización). El motor algorítmico cruza estos parámetros con matrices normadas de rendimiento y determina el personal exacto (FTE), horas efectivas, dotación de EPP, químicos especializados y margen garantizado.
                </p>
              </div>

              <div className="glass-card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                <h4 style={{ color: '#d97706', marginBottom: '0.75rem', fontSize: '0.975rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <LucideIcon name="FileCode" size={16} /> Motor Algorítmico Paramétrico & Calibración SERCOP
                </h4>
                <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '0.8rem', color: '#0f172a', lineHeight: 1.8 }}>
                  1. Cobertura Efectiva = (Cobertura_Normada_SERCOP × k_maquinaria) ÷ (k_riesgo × k_tráfico)<br />
                  2. Personal Requerido (FTE) = (Área ÷ Cobertura_Efectiva) × Factor_Turno_Relevo_Legal<br />
                  3. Rendimiento Operativo: R_efectivo = (R_base × k_maquinaria) ÷ (k_riesgo × k_tráfico) (m²/hora)<br />
                  4. Mano de Obra: Salario Sectorial Comisión No. 19 ($475) + IESS 12.15% + 13º + 14º + Fondos + EPP = $721.09/mes<br />
                  5. Costos Directos = Mano de Obra + Químicos Certificados + EPP Biológico + Maquinaria<br />
                  6. Precio Sugerido = (Costos_Directos + Indirectos) ÷ (1 - Margen_Deseado)
                </div>
              </div>

              <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <h4 style={{ color: '#0284c7', marginBottom: '0.65rem', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <LucideIcon name="Landmark" size={16} /> Fuentes Oficiales de Verificación de Datos
                </h4>
                <ul style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.6, paddingLeft: '1.25rem' }}>
                  <li><strong>SERCOP - Catálogo Dinámico Inclusivo (CPC 85330):</strong> Ficha Técnica Oficial para limpieza de inmuebles (Precio base $0.91/m², rendimiento 900 m²/operario).</li>
                  <li><strong>Contratos Adjudicados IESS / MSP:</strong> Hospital Teodoro Maldonado Carbo ($3.03-$3.21/m²), Hospital Verdi Cevallos ($2.86/m²), HCAM ($1.84/m²), Ficha Nacional Quirúrgica 24h ($4.50-$5.25/m²).</li>
                  <li><strong>Ministerio del Trabajo de Ecuador (MDT):</strong> Salarios Mínimos Sectoriales Comisión No. 19 (Personal de Limpieza) y Art. 49 del Código del Trabajo (Recargo 25% nocturno).</li>
                  <li><strong>Sector Privado Corporativo:</strong> Encuestas de precios de referencia de la Federación Ecuatoriana de Empresas de Limpieza (FEDELIMP).</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'innovacion' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <h4 style={{ color: '#059669', marginBottom: '0.75rem', fontSize: '0.975rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <LucideIcon name="Sparkles" size={16} /> ¿Qué diferencia a su solución de otras soluciones existentes?
                </h4>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#334155', marginBottom: '1rem' }}>
                  A diferencia de las hojas de cálculo tradicionales o software genérico de facturación, CleanQuote Pro incorpora la física operativa de la desinfección y la regulación laboral ecuatoriana en un solo algoritmo unificado.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ color: '#0284c7', fontSize: '0.85rem' }}>1. Cálculo Multidimensional</strong>
                    <p style={{ fontSize: '0.785rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.4 }}>
                      No asume que 1 m² hospitalario equivale a 1 m² de oficina. Cruza riesgo microbiológico, tráfico y turnos 24/7.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ color: '#059669', fontSize: '0.85rem' }}>2. Acreditación SERCOP</strong>
                    <p style={{ fontSize: '0.785rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.4 }}>
                      Verifica instantáneamente si la tarifa calculada está dentro de los rangos oficiales de contratación pública del Estado.
                    </p>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ color: '#7c3aed', fontSize: '0.85rem' }}>3. Blindaje Legal y Bioseguridad</strong>
                    <p style={{ fontSize: '0.785rem', color: '#64748b', marginTop: '0.25rem', lineHeight: 1.4 }}>
                      Garantiza sueldos completos con IESS y previene déficits de operarios que comprometan la desinfección de quirófanos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <h4 style={{ color: '#059669', marginBottom: '0.75rem', fontSize: '0.975rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <LucideIcon name="Zap" size={16} /> Elemento Más Innovador
                </h4>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#334155' }}>
                  El elemento más innovador es la <strong>conversión de normas sanitarias y pliegos de compras públicas en coeficientes algorítmicos dinámicos</strong>. Transformamos pliegos estáticos de contratación en un motor interactivo que calcula en milisegundos la oferta técnico-financiera exacta, permitiendo simular escenarios en tiempo real y exportar licitaciones ejecutivas con valor legal.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'matriz' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <h4 style={{ color: '#059669', marginBottom: '0.75rem', fontSize: '0.975rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <LucideIcon name="CheckSquare" size={16} /> Alineación con la Matriz Oficial de Evaluación del Hackathon (Anexo 6)
                </h4>
                <table className="data-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Criterio Oficial</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>Peso</th>
                      <th>Evidencia Implementada en CleanQuote Pro</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Prototipo, demo o simulación práctica</strong></td>
                      <td style={{ textAlign: 'center', color: '#059669', fontWeight: 700 }}>20%</td>
                      <td>Software 100% interactivo y reactivo en tiempo real con 6 casos reales ecuatorianos calibrados y exportador formal en PDF/CSV.</td>
                    </tr>
                    <tr>
                      <td><strong>Comprensión del problema</strong></td>
                      <td style={{ textAlign: 'center', color: '#0284c7', fontWeight: 700 }}>15%</td>
                      <td>Demuestra el impacto de la dispersión de rendimientos entre quirófanos ($5.22/m²) y oficinas ($1.09/m²), sustentado en contratos SERCOP reales.</td>
                    </tr>
                    <tr>
                      <td><strong>Innovación de la solución</strong></td>
                      <td style={{ textAlign: 'center', color: '#0284c7', fontWeight: 700 }}>15%</td>
                      <td>Módulo comparativo en vivo entre Método Tradicional (Tarifa Plana) vs Modelo Paramétrico con Matriz Oficial Multi-Sector.</td>
                    </tr>
                    <tr>
                      <td><strong>Viabilidad técnica</strong></td>
                      <td style={{ textAlign: 'center', color: '#0284c7', fontWeight: 700 }}>15%</td>
                      <td>Estructura laboral ecuatoriana real (SBU $475, IESS patronal 12.15%, 13º, 14º, fondos de reserva, recargo nocturno Art. 49).</td>
                    </tr>
                    <tr>
                      <td><strong>Impacto potencial</strong></td>
                      <td style={{ textAlign: 'center', color: '#0284c7', fontWeight: 700 }}>15%</td>
                      <td>Elimina pérdidas operativas de hasta -$2,500/mes por contrato y previene infecciones asociadas a la atención en salud (IAAS).</td>
                    </tr>
                    <tr>
                      <td><strong>Calidad de la presentación</strong></td>
                      <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 700 }}>10%</td>
                      <td>Diseño premium Apple Light Theme, tipografía San Francisco, iconografía vectorial nítida y reporte ejecutivo imprimible.</td>
                    </tr>
                    <tr>
                      <td><strong>Proceso y trabajo en equipo</strong></td>
                      <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 700 }}>10%</td>
                      <td>Solución interdisciplinaria que une ingeniería comercial, bioseguridad hospitalaria y desarrollo de software de vanguardia.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
