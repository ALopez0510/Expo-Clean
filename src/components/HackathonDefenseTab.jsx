import React, { useEffect, useMemo, useState } from 'react';
import { LucideIcon } from './LucideIcon';
import { ECUADOR_LABOR_CONFIG } from '../data/parametricData.js';
import { presetContrast } from '../utils/analysis';
import { formatUSD } from '../utils/format';

const SECTIONS = [
  { id: 'problema', label: 'Problema' },
  { id: 'solucion', label: 'Solución' },
  { id: 'innovacion', label: 'Innovación' },
  { id: 'matriz', label: 'Matriz de evaluación' }
];

export function HackathonDefenseTab({ onClose }) {
  const [active, setActive] = useState('problema');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Cifras de la matriz calculadas con el motor, para que nunca queden desactualizadas.
  const figures = useMemo(() => {
    const rows = presetContrast();
    const critical = rows.find((r) => r.id === 'hospital_quito');
    const office = rows.find((r) => r.id === 'corporate_tower');
    const worstFlatLoss = Math.abs(Math.min(...rows.map((r) => r.flatLoss)));
    return { critical, office, worstFlatLoss: Math.round(worstFlatLoss / 100) * 100 };
  }, []);

  const matrix = [
    {
      criterion: 'Prototipo, demo o simulación práctica',
      weight: '20 %',
      evidence:
        'Aplicación interactiva con 6 casos de referencia del mercado ecuatoriano, propuesta exportable en PDF y CSV, y pruebas de coherencia que se ejecutan en vivo.'
    },
    {
      criterion: 'Comprensión del problema',
      weight: '15 %',
      evidence: `Muestra la dispersión del precio entre un quirófano o UCI 24/7 de ${figures.critical.areaM2} m² (${formatUSD(figures.critical.price)} por m²) y unas oficinas (${formatUSD(figures.office.price)} por m²), con bandas referenciales SERCOP.`
    },
    {
      criterion: 'Innovación de la solución',
      weight: '15 %',
      evidence:
        'Comparación en vivo con la tarifa plana, análisis de sensibilidad por variable y piso de cobertura para operación continua.'
    },
    {
      criterion: 'Viabilidad técnica',
      weight: '15 %',
      evidence: `Estructura laboral ecuatoriana (SBU 2026 de ${formatUSD(ECUADOR_LABOR_CONFIG.sbuBase)}, IESS patronal 12,15 %, 13º, 14º, fondos de reserva y recargo nocturno del Art. 49).`
    },
    {
      criterion: 'Impacto potencial',
      weight: '15 %',
      evidence: `Evita pérdidas de hasta unos ${formatUSD(figures.worstFlatLoss)} al mes por contrato frente a una tarifa plana de $1,25 por m² (caso hospitalario crítico del simulador).`
    },
    {
      criterion: 'Calidad de la presentación',
      weight: '10 %',
      evidence: 'Resumen primero y detalle plegable, con la oferta lista para imprimir.'
    },
    {
      criterion: 'Proceso y trabajo en equipo',
      weight: '10 %',
      evidence: 'Solución interdisciplinaria que une ingeniería comercial, bioseguridad hospitalaria y desarrollo de software.'
    }
  ];

  return (
    <div className="modal-overlay" id="defense-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="defense-title">
        <div className="modal-head">
          <h2 id="defense-title">Ficha técnica</h2>
          <span className="muted">Expo Clean Ecuador 2026, Gestión Inteligente de Procesos, Reto 2</span>
          <button className="btn btn-icon" onClick={onClose} aria-label="Cerrar">
            <LucideIcon name="X" />
          </button>
        </div>

        <div className="doc-tabs" role="tablist" aria-label="Secciones de la ficha">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              role="tab"
              className="tab"
              aria-selected={active === s.id}
              onClick={() => setActive(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {active === 'problema' && (
            <div className="doc-section">
              <h3>¿Qué problema concreto busca resolver el equipo?</h3>
              <p>
                <strong>Qué ocurre hoy.</strong> Se carece de un modelo paramétrico de cotización que diferencie exigencias operativas y
                microbiológicas. Se usan valores genéricos sin integrar variables críticas (riesgo sanitario, tráfico, turnos,
                normativas) para calcular rendimientos, insumos y personal.
              </p>
              <p>
                <strong>Dónde ocurre.</strong> En los departamentos comerciales y operativos de las empresas de facility management al
                elaborar propuestas para infraestructuras heterogéneas: áreas hospitalarias, patios de comida, oficinas, campus
                universitarios e industrias.
              </p>
              <p>
                <strong>A quién afecta.</strong> A los analistas de costos y equipos de ventas que no tienen herramientas para
                estructurar ofertas verídicas, y a los clientes, públicos y privados, que reciben propuestas desajustadas a su
                realidad operativa.
              </p>
              <p>
                <strong>Consecuencia principal.</strong> Una estimación imprecisa de costos que erosiona la rentabilidad del proveedor,
                genera ofertas poco competitivas o inviables, y eleva el riesgo de incumplir protocolos de bioseguridad por
                subestimar el personal necesario.
              </p>

              <h3>Origen de la idea y evidencia del mercado</h3>
              <p>
                La idea surge al identificar la brecha entre las exigencias operativas reales de distintas infraestructuras y los
                métodos manuales de cotización de facility management. Aplicar tarifas planas genéricas (por ejemplo, $1,25 por m²) a
                espacios con necesidades sanitarias tan dispares, como un área hospitalaria crítica 24/7 frente a unas oficinas,
                provoca distorsiones: en salud se pierde dinero y se arriesga la bioseguridad por falta de personal, mientras que en
                oficinas se pierde la licitación por sobreprecio. De ahí nace la necesidad de un algoritmo dinámico que integre las
                bandas referenciales del SERCOP (CPC 85330) y los salarios de ley del Ministerio del Trabajo.
              </p>
            </div>
          )}

          {active === 'solucion' && (
            <div className="doc-section">
              <h3>Descripción de la solución</h3>
              <p>
                CleanQuote es una plataforma de software con un motor paramétrico multidimensional que automatiza la estructuración
                de costos unitarios en facility management. Reemplaza las cotizaciones empíricas por un modelo determinístico que
                toma como referencia las bandas de contratación pública del SERCOP.
              </p>
              <p>
                El usuario ingresa las variables operativas (metraje, tráfico, nivel de riesgo sanitario, turnos, protocolo y grado de
                mecanización). El motor las cruza con matrices de rendimiento y determina el personal (FTE), las horas efectivas, la
                dotación de EPP, los químicos y el margen.
              </p>

              <h3>Motor paramétrico</h3>
              <div className="doc-formulas">
                1. Cobertura efectiva = (cobertura normada × k_maquinaria) ÷ (k_riesgo × k_tráfico × k_protocolo)
                <br />
                2. Personal (FTE) = (área ÷ cobertura efectiva) × factor de turno y relevo. En operación continua, mínimo = horas de
                operación ÷ 160 h
                <br />
                3. Rendimiento operativo = (R_base × k_maquinaria) ÷ (k_riesgo × k_tráfico × k_protocolo), en m²/hora
                <br />
                4. Mano de obra = SBU 2026 ({formatUSD(ECUADOR_LABOR_CONFIG.sbuBase)}) + IESS 12,15 % + 13º + 14º + fondos + EPP =
                $731,12 al mes (diurno)
                <br />
                5. Costos directos = mano de obra + químicos + EPP + maquinaria
                <br />
                6. Precio sugerido = (costos directos + indirectos) ÷ (1 − margen deseado)
              </div>

              <h3>Fuentes de verificación</h3>
              <ul>
                <li>
                  <strong>SERCOP, Catálogo Dinámico Inclusivo (CPC 85330):</strong> ficha técnica para limpieza de inmuebles (precio
                  base $0,91 por m², rendimiento 900 m² por operario).
                </li>
                <li>
                  <strong>Contratos adjudicados IESS y MSP:</strong> Hospital Teodoro Maldonado Carbo ($3,03 a $3,21 por m²), Hospital
                  Verdi Cevallos ($2,86), HCAM ($1,84) y ficha de áreas quirúrgicas 24 h ($4,50 a $5,25). Cifras referenciales:
                  verificar el código de proceso antes de citarlas.
                </li>
                <li>
                  <strong>Ministerio del Trabajo:</strong> SBU 2026 de $482 (tabla sectorial por verificar) y Art. 49 del Código del
                  Trabajo (recargo nocturno de 25 %).
                </li>
                <li>
                  <strong>Sector privado:</strong> precios de referencia del mercado corporativo (FEDELIMP), por confirmar con la
                  federación.
                </li>
              </ul>
            </div>
          )}

          {active === 'innovacion' && (
            <div className="doc-section">
              <h3>¿Qué diferencia a la solución de las existentes?</h3>
              <p>
                A diferencia de las hojas de cálculo tradicionales o del software genérico de facturación, CleanQuote incorpora en un
                solo algoritmo la lógica operativa de la desinfección y la regulación laboral ecuatoriana.
              </p>
              <ul>
                <li>
                  <strong>Cálculo multidimensional.</strong> No asume que 1 m² hospitalario equivale a 1 m² de oficina: cruza riesgo
                  microbiológico, tráfico, protocolo y turnos 24/7.
                </li>
                <li>
                  <strong>Contraste con bandas referenciales.</strong> Muestra al instante si la tarifa calculada cae dentro de los
                  rangos de contratación pública.
                </li>
                <li>
                  <strong>Piso de cobertura y marco laboral.</strong> Calcula salarios completos con IESS y evita déficits de
                  operarios que comprometan la desinfección de áreas críticas.
                </li>
                <li>
                  <strong>Pruebas de coherencia y sensibilidad.</strong> El propio modelo muestra qué variable mueve más el precio y
                  comprueba su comportamiento.
                </li>
              </ul>

              <h3>Elemento más innovador</h3>
              <p>
                La conversión de normas sanitarias y pliegos de compras públicas en coeficientes algorítmicos dinámicos. Los pliegos
                estáticos se vuelven un motor interactivo que calcula la oferta técnico-financiera, permite simular escenarios en
                tiempo real y exportar propuestas técnico-financieras en PDF o CSV.
              </p>
            </div>
          )}

          {active === 'matriz' && (
            <div className="doc-section" style={{ maxWidth: 'none' }}>
              <h3>Alineación con la matriz oficial de evaluación (Anexo 6)</h3>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Criterio</th>
                      <th className="num">Peso</th>
                      <th>Evidencia en la solución</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((m) => (
                      <tr key={m.criterion}>
                        <td>{m.criterion}</td>
                        <td className="num">{m.weight}</td>
                        <td>{m.evidence}</td>
                      </tr>
                    ))}
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
