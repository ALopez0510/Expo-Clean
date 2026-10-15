import React, { useEffect } from 'react';
import { LucideIcon } from './LucideIcon';
import { bandPosition } from '../utils/analysis';
import { formatUSD, formatInt, formatOne, formatDec } from '../utils/format';

export function ProposalPreviewModal({ result, projectName, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!result) return null;

  const { costBreakdown, unitEconomics, staffingMetrics, yieldMetrics, sercopBenchmark, inputs } = result;
  const position = bandPosition(unitEconomics.unitPricePerM2, sercopBenchmark);

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    const csvContent = [
      ['PROPUESTA TECNICO-FINANCIERA DE FACILITY MANAGEMENT - EXPO CLEAN 2026'],
      ['Proyecto / Cliente', projectName],
      ['Tipologia', inputs.infrastructureType.name],
      ['Codigo CPC SERCOP', inputs.infrastructureType.cpcCode || '85330'],
      ['Banda Referencial SERCOP (USD/m2)', `$${sercopBenchmark?.minRateM2?.toFixed(2)} - $${sercopBenchmark?.maxRateM2?.toFixed(2)}`],
      ['Area Total (m2)', inputs.areaM2],
      ['Riesgo Sanitario', `Nivel ${inputs.sanitaryRiskLevel.level}`],
      ['Trafico Peatonal', inputs.trafficLevel.label],
      ['Regimen de Turnos', inputs.shiftRegime.label],
      ['Protocolo Quimico', inputs.disinfectionProtocol.name],
      ['Normativa Aplicable', inputs.disinfectionProtocol.normative],
      [''],
      ['METRICAS OPERATIVAS Y RECURSOS'],
      ['Rendimiento Efectivo (m2/h)', yieldMetrics.effectiveYieldM2H.toFixed(2)],
      ['Horas Mensuales Requeridas', Math.round(yieldMetrics.monthlyRequiredHours)],
      ['Personal Total (FTE)', staffingMetrics.assignedFTE.toFixed(1)],
      ['Operarios Diurnos', staffingMetrics.dayFTE.toFixed(1)],
      ['Operarios Nocturnos', staffingMetrics.nightFTE.toFixed(1)],
      ['Costo Laboral Unitario FTE (USD/mes)', staffingMetrics.unitDayLaborCost.toFixed(2)],
      [''],
      ['ESTRUCTURA ECONOMICA Y COSTOS UNITARIOS'],
      ['Mano de Obra Directa (USD)', costBreakdown.labor.amount.toFixed(2)],
      ['Insumos Quimicos (USD)', costBreakdown.chemicals.amount.toFixed(2)],
      ['EPP y Bioseguridad (USD)', costBreakdown.ppe.amount.toFixed(2)],
      ['Maquinaria y Equipos (USD)', costBreakdown.equipment.amount.toFixed(2)],
      ['Costos Indirectos (USD)', costBreakdown.indirect.amount.toFixed(2)],
      ['Costo Tecnico Total (USD)', costBreakdown.totalCost.toFixed(2)],
      ['Margen de Rentabilidad (USD)', costBreakdown.profit.amount.toFixed(2)],
      ['Margen Porcentual (%)', `${costBreakdown.profit.percentage.toFixed(1)}%`],
      ['PRECIO TOTAL MENSUAL (USD)', costBreakdown.recommendedSellingPrice.toFixed(2)],
      ['PRECIO UNITARIO POR M2 (USD/m2)', unitEconomics.unitPricePerM2.toFixed(3)],
      ['PRECIO POR HORA OPERARIA (USD/h)', unitEconomics.pricePerHour.toFixed(2)]
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Cotizacion_${projectName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentDate = new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="modal-overlay" id="proposal-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="proposal-title">
        <div className="modal-head no-print">
          <h2 id="proposal-title">Oferta técnico-financiera</h2>
          <div className="modal-actions">
            <button className="btn" onClick={handleExportCSV}>
              <LucideIcon name="Download" />
              <span>Exportar CSV</span>
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <LucideIcon name="Printer" />
              <span>Imprimir o guardar PDF</span>
            </button>
            <button className="btn btn-icon" onClick={onClose} aria-label="Cerrar">
              <LucideIcon name="X" />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="tender-document" id="printable-tender-document">
            <div className="tender-header">
              <div>
                <h2>[Nombre de la empresa]</h2>
                <p className="muted">Propuesta generada con CleanQuote. Documento de demostración: completa los datos de tu empresa.</p>
              </div>
              <div className="tender-meta">
                <div>
                  <strong>Propuesta técnico-financiera</strong>
                </div>
                <div>Código: COT-2026-EC-{(inputs.areaM2 * 7).toString().slice(0, 5)}</div>
                <div>CPC de referencia: {inputs.infrastructureType.cpcCode || '85330.00.1'}</div>
                <div>Emitida el {currentDate}</div>
                <div>Validez: 30 días calendario</div>
              </div>
            </div>

            <div className="tender-section">
              <h3>1. Información del servicio</h3>
              <div className="tender-grid">
                <div>
                  <p>
                    <strong>Cliente o proyecto:</strong> {projectName}
                  </p>
                  <p>
                    <strong>Tipo de infraestructura:</strong> {inputs.infrastructureType.name}
                  </p>
                  <p>
                    <strong>Área contratada:</strong> {formatInt(inputs.areaM2)} m²
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Riesgo sanitario:</strong> {inputs.sanitaryRiskLevel.label}
                  </p>
                  <p>
                    <strong>Régimen operativo:</strong> {inputs.shiftRegime.label}
                  </p>
                  <p>
                    <strong>Tráfico peatonal:</strong> {inputs.trafficLevel.label}
                  </p>
                </div>
              </div>
            </div>

            <div className="tender-section">
              <h3>2. Especificaciones técnicas y bioseguridad</h3>
              <p style={{ marginBottom: '0.6rem' }}>
                El servicio se dimensionó con un modelo paramétrico que toma como referencia las bandas del SERCOP y los protocolos del
                Ministerio de Salud Pública.
              </p>
              <table className="tender-table">
                <tbody>
                  <tr>
                    <td style={{ width: '35%', fontWeight: 600 }}>Protocolo químico</td>
                    <td>{inputs.disinfectionProtocol.name}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Normativa</td>
                    <td>{inputs.disinfectionProtocol.normative}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Agentes activos</td>
                    <td>
                      {inputs.disinfectionProtocol.chemicalProduct}. Tiempo de contacto: {inputs.disinfectionProtocol.contactTimeMinutes} min.
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Rendimiento</td>
                    <td>
                      {formatDec(yieldMetrics.effectiveYieldM2H, 1)} m² por hora, ajustado por riesgo, tráfico, protocolo y mecanización
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Equipamiento</td>
                    <td>{inputs.machineryOption.label}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="tender-section">
              <h3>3. Personal asignado</h3>
              <table className="tender-table">
                <thead>
                  <tr>
                    <th>Perfil</th>
                    <th>Jornada</th>
                    <th>Personal</th>
                    <th>Carga mensual</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Operario de limpieza diurno</td>
                    <td>Turno matutino y vespertino</td>
                    <td>{formatOne(staffingMetrics.dayFTE)} FTE</td>
                    <td>{formatInt(staffingMetrics.dayFTE * staffingMetrics.effectiveHoursPerFTE)} horas</td>
                  </tr>
                  {staffingMetrics.nightFTE > 0 && (
                    <tr>
                      <td>Operario nocturno (recargo 25 %, Art. 49)</td>
                      <td>Turno nocturno</td>
                      <td>{formatOne(staffingMetrics.nightFTE)} FTE</td>
                      <td>{formatInt(staffingMetrics.nightFTE * staffingMetrics.effectiveHoursPerFTE)} horas</td>
                    </tr>
                  )}
                  <tr>
                    <td>Supervisión técnica y relevos</td>
                    <td>Según Código del Trabajo</td>
                    <td colSpan="2">Incluidos en la estructura de costos</td>
                  </tr>
                  <tr className="strong">
                    <td colSpan="2">Total</td>
                    <td>{formatOne(staffingMetrics.assignedFTE)} FTE</td>
                    <td>{formatInt(yieldMetrics.monthlyRequiredHours)} horas al mes</td>
                  </tr>
                </tbody>
              </table>
              <p className="note" style={{ marginTop: '0.5rem' }}>
                Remuneración calculada sobre el SBU 2026 y la normativa del Ministerio del Trabajo: {formatUSD(staffingMetrics.unitDayLaborCost)} al mes
                por operario diurno (costo empresa), con IESS, décimos mensualizados, fondos de reserva, seguro ocupacional y EPP.
              </p>
            </div>

            <div className="tender-section">
              <h3>4. Propuesta económica</h3>
              <table className="tender-table">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th className="num">Mensual (USD)</th>
                    <th className="num">Por m² (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Costos directos (mano de obra, insumos, EPP y equipamiento)</td>
                    <td className="num">{formatUSD(costBreakdown.totalDirectCost)}</td>
                    <td className="num">{formatUSD(costBreakdown.totalDirectCost / inputs.areaM2)}</td>
                  </tr>
                  <tr>
                    <td>Gastos indirectos, logística y supervisión ({inputs.indirectRate} %)</td>
                    <td className="num">{formatUSD(costBreakdown.indirect.amount)}</td>
                    <td className="num">{formatUSD(costBreakdown.indirect.amount / inputs.areaM2)}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Costo técnico operativo</strong>
                    </td>
                    <td className="num">
                      <strong>{formatUSD(costBreakdown.totalCost)}</strong>
                    </td>
                    <td className="num">
                      <strong>{formatUSD(unitEconomics.unitCostPerM2)}</strong>
                    </td>
                  </tr>
                  <tr className="strong">
                    <td>Precio final mensual (sin IVA)</td>
                    <td className="num">{formatUSD(costBreakdown.recommendedSellingPrice)}</td>
                    <td className="num">{formatUSD(unitEconomics.unitPricePerM2)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="note" style={{ marginTop: '0.5rem' }}>
                Valores en dólares de los Estados Unidos. No incluyen IVA. Costo por hora efectiva operaria: {formatUSD(unitEconomics.pricePerHour)}.
              </p>
            </div>

            <div className="tender-section">
              <h3>5. Contraste con la banda referencial SERCOP</h3>
              <p>
                <strong>CPC:</strong> {sercopBenchmark?.cpcCode || '85330'}, {inputs.infrastructureType.name}.
              </p>
              <p>
                <strong>Banda referencial:</strong> {formatUSD(sercopBenchmark?.minRateM2)} a {formatUSD(sercopBenchmark?.maxRateM2)} por m² al mes
                (promedio {formatUSD(sercopBenchmark?.avgRateM2)}).
              </p>
              <p>
                <strong>Resultado:</strong> la tarifa propuesta de {formatUSD(unitEconomics.unitPricePerM2)} por m²{' '}
                {position.id === 'inside'
                  ? 'queda dentro de la banda referencial.'
                  : position.id === 'near'
                    ? 'queda apenas fuera de la banda referencial.'
                    : 'queda fuera de la banda referencial y se fundamenta en las condiciones de alta exigencia del servicio.'}
              </p>
              <p className="note" style={{ marginTop: '0.5rem' }}>
                Referencias: Ley Orgánica del Sistema Nacional de Contratación Pública, resoluciones del SERCOP vigentes y normativa
                laboral vigente del Ministerio del Trabajo de Ecuador.
              </p>
            </div>

            <div className="tender-signatures">
              <div className="signature-box">
                <strong>Analista de costos y licitaciones</strong>
                <p>Firma y sello comercial</p>
              </div>
              <div className="signature-box">
                <strong>Dirección de operaciones y calidad</strong>
                <p>Aprobación técnica</p>
              </div>
              <div className="signature-box">
                <strong>Representante legal o cliente</strong>
                <p>{projectName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
