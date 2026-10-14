import React from 'react';
import { LucideIcon } from './LucideIcon';

export function ProposalPreviewModal({ result, projectName, onClose }) {
  if (!result) return null;

  const {
    costBreakdown,
    unitEconomics,
    staffingMetrics,
    yieldMetrics,
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

  const handlePrint = () => {
    window.print();
  };

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

  const currentDate = new Date().toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="modal-overlay" id="proposal-modal-overlay">
      <div className="modal-container">
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="card-icon-badge" style={{ background: '#ecfdf5', color: '#059669', width: '32px', height: '32px' }}>
              <LucideIcon name="FileText" size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>Oferta Técnico-Financiera Oficial</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Documento ejecutivo listo para licitación, auditoría SERCOP y comité técnico
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button className="btn-secondary" onClick={handleExportCSV}>
              <LucideIcon name="Download" size={14} /> Exportar CSV
            </button>
            <button className="btn-primary" onClick={handlePrint}>
              <LucideIcon name="Printer" size={14} /> Imprimir / PDF
            </button>
            <button className="btn-secondary" onClick={onClose} style={{ padding: '0.5rem 0.75rem' }}>
              <LucideIcon name="X" size={16} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* THE TENDER DOCUMENT (Formatted for Screen & Print) */}
          <div className="tender-document" id="printable-tender-document">
            {/* Header */}
            <div className="tender-header">
              <div className="tender-logo">
                <h2>CLEANSERVICES FACILITY MANAGEMENT</h2>
                <p>Soluciones Integrales de Higiene, Desinfección y Mantenimiento Corporativo</p>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Miembro de FEDELIMP • Proveedor Calificado SERCOP CPC 85330 • ISO 9001 / ISO 45001 / BPM
                </p>
              </div>
              <div className="tender-meta">
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                  PROPUESTA TÉCNICO-FINANCIERA
                </div>
                <div>Código: <strong>COT-2026-EC-{(inputs.areaM2 * 7).toString().slice(0, 5)}</strong></div>
                <div>Código CPC SERCOP: <strong>{inputs.infrastructureType.cpcCode || '85330.00.1'}</strong></div>
                <div>Fecha de Emisión: <strong>{currentDate}</strong></div>
                <div>Validez de la Oferta: <strong>30 días calendario</strong></div>
              </div>
            </div>

            {/* Customer & Scope */}
            <div className="tender-section">
              <h3>1. Información General del Servicio</h3>
              <div className="tender-grid">
                <div>
                  <p><strong>Cliente / Proyecto:</strong> {projectName}</p>
                  <p><strong>Tipología Evaluada:</strong> {inputs.infrastructureType.name}</p>
                  <p><strong>Área Contratada:</strong> {Number(inputs.areaM2).toLocaleString()} m²</p>
                </div>
                <div>
                  <p><strong>Nivel de Riesgo Sanitario:</strong> Nivel {inputs.sanitaryRiskLevel.level} ({inputs.sanitaryRiskLevel.label})</p>
                  <p><strong>Régimen Operativo:</strong> {inputs.shiftRegime.label}</p>
                  <p><strong>Intensidad de Tráfico:</strong> {inputs.trafficLevel.label}</p>
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="tender-section">
              <h3>2. Especificaciones Técnicas y Bioseguridad</h3>
              <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                El servicio ha sido dimensionado bajo un <strong>modelo algorítmico paramétrico</strong> calibrado con las normativas del SERCOP y los protocolos del Ministerio de Salud Pública (MSP):
              </p>
              <table className="tender-table">
                <tbody>
                  <tr>
                    <td style={{ width: '35%', fontWeight: 600 }}>Protocolo Químico Aplicado:</td>
                    <td>{inputs.disinfectionProtocol.name}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Normativa Regulatoria:</td>
                    <td>{inputs.disinfectionProtocol.normative}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Agentes Activos & Dilución:</td>
                    <td>{inputs.disinfectionProtocol.chemicalProduct} (Tiempo de contacto: {inputs.disinfectionProtocol.contactTimeMinutes} min.)</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Rendimiento Paramétrico:</td>
                    <td>{yieldMetrics.effectiveYieldM2H.toFixed(1)} m²/hora (ajustado por riesgo microbiológico, tráfico y grado de mecanización)</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Equipamiento Tecnológico:</td>
                    <td>{inputs.machineryOption.label}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Staffing */}
            <div className="tender-section">
              <h3>3. Cuadro de Asignación de Recursos Humanos (FTE)</h3>
              <table className="tender-table">
                <thead>
                  <tr>
                    <th>Perfil Operativo</th>
                    <th>Jornada / Horario</th>
                    <th>Personal Asignado</th>
                    <th>Carga Mensual</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Operario de Limpieza Diurno</td>
                    <td>Turno Matutino / Vespertino</td>
                    <td>{staffingMetrics.dayFTE.toFixed(1)} FTE</td>
                    <td>{Math.round(staffingMetrics.dayFTE * staffingMetrics.effectiveHoursPerFTE)} horas</td>
                  </tr>
                  {staffingMetrics.nightFTE > 0 && (
                    <tr>
                      <td>Operario Técnico Nocturno (Recargo 25% Art. 49)</td>
                      <td>Turno Nocturno / Madrugada</td>
                      <td>{staffingMetrics.nightFTE.toFixed(1)} FTE</td>
                      <td>{Math.round(staffingMetrics.nightFTE * staffingMetrics.effectiveHoursPerFTE)} horas</td>
                    </tr>
                  )}
                  <tr>
                    <td>Supervisión Técnica & Relevos Legales</td>
                    <td>Continuidad 100% Código de Trabajo</td>
                    <td>Incluido en estructura</td>
                    <td>Garantía de descanso semanal 48h</td>
                  </tr>
                  <tr style={{ fontWeight: 700, background: '#f8fafc' }}>
                    <td colSpan="2">TOTAL FUERZA LABORAL CALIFICADA</td>
                    <td>{staffingMetrics.assignedFTE.toFixed(1)} FTE</td>
                    <td>{Math.round(yieldMetrics.monthlyRequiredHours)} horas/mes</td>
                  </tr>
                </tbody>
              </table>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                * Todo el personal cuenta con remuneración acorde a la Tabla Sectorial No. 19 del Ministerio del Trabajo ($721.09/mes diurno), afiliación inmediata al IESS, décimos mensualizados, fondos de reserva, seguro ocupacional y EPP certificado.
              </p>
            </div>

            {/* Pricing Summary */}
            <div className="tender-section">
              <h3>4. Propuesta Económica y Costos Unitarios</h3>
              <table className="tender-table">
                <thead>
                  <tr>
                    <th>Concepto Económico</th>
                    <th style={{ textAlign: 'right' }}>Valor Mensual (USD)</th>
                    <th style={{ textAlign: 'right' }}>Valor Unitario (USD/m²)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Costos Directos (Mano de Obra + Insumos Químicos + EPP + Equipamiento)</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(costBreakdown.totalDirectCost)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(costBreakdown.totalDirectCost / inputs.areaM2)}</td>
                  </tr>
                  <tr>
                    <td>Gastos Indirectos, Logística y Supervisión Central ({inputs.indirectRate}%)</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(costBreakdown.indirect.amount)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(costBreakdown.indirect.amount / inputs.areaM2)}</td>
                  </tr>
                  <tr style={{ background: '#f1f5f9', fontWeight: 600 }}>
                    <td>Costo Técnico Operativo Total</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(costBreakdown.totalCost)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(unitEconomics.unitCostPerM2)}</td>
                  </tr>
                  <tr style={{ background: '#ecfdf5', fontWeight: 800, color: '#065f46', fontSize: '1rem' }}>
                    <td>PRECIO FINAL MENSUAL (Sin IVA)</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(costBreakdown.recommendedSellingPrice)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(unitEconomics.unitPricePerM2)}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#475569', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span>* Valores expresados en Dólares de los Estados Unidos de América (USD). No incluye IVA (15%).</span>
                <span>Costo Hora Efectiva Operaria: <strong>{formatUSD(unitEconomics.pricePerHour)} /h</strong></span>
              </div>
            </div>

            {/* SERCOP Compliance Certificate */}
            <div className="tender-section" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ borderBottom: 'none', marginBottom: '0.5rem', color: '#0f172a', fontSize: '0.95rem' }}>
                5. Certificación de Conformidad SERCOP (LOSNCP) & Tabla MDT
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.5 }}>
                <p>
                  <strong>Clasificador Central de Productos (CPC):</strong> {sercopBenchmark?.cpcCode || '85330'} • <em>{inputs.infrastructureType.name}</em>
                </p>
                <p>
                  <strong>Banda Oficial de Referencia SERCOP:</strong> ${sercopBenchmark?.minRateM2?.toFixed(2)} a ${sercopBenchmark?.maxRateM2?.toFixed(2)} USD/m² mes (Promedio Oficial: ${sercopBenchmark?.avgRateM2?.toFixed(2)}/m²).
                </p>
                <p>
                  <strong>Evaluación de Conformidad:</strong> La tarifa propuesta de <strong>{formatUSD(unitEconomics.unitPricePerM2)}/m²</strong> se encuentra {sercopBenchmark?.isInOfficialBand ? '100% dentro de la banda oficial acreditada en el portal de Compras Públicas del Ecuador' : 'técnicamente fundamentada bajo especificaciones de alta exigencia'}.
                </p>
                <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                  Base legal: Ley Orgánica del Sistema Nacional de Contratación Pública (LOSNCP), Resoluciones SERCOP vigentes y Tabla Sectorial No. 19 del Ministerio del Trabajo de Ecuador.
                </p>
              </div>
            </div>

            {/* Signatures */}
            <div className="tender-signatures">
              <div className="signature-box">
                <strong>Ing. Analista de Costos y Licitaciones</strong>
                <p>CleanServices Facility Management</p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Firma y Sello Comercial</p>
              </div>

              <div className="signature-box">
                <strong>Dirección de Operaciones y Calidad</strong>
                <p>Auditoría Microbiológica y Bioseguridad</p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Aprobación Técnica</p>
              </div>

              <div className="signature-box">
                <strong>Representante Legal / Cliente</strong>
                <p>{projectName}</p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Aceptación de la Propuesta</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
