import React, { useState } from 'react';
import { LucideIcon } from './LucideIcon';
import { SOURCES, ECUADOR_LABOR_CONFIG } from '../data/parametricData.js';
import { formatUSD } from './ResultsDashboard';

export function ProposalPreviewModal({ result, projectName, onClose }) {
  const [providerName, setProviderName] = useState('');
  if (!result) return null;

  const { costBreakdown, unitEconomics, staffingMetrics, yieldMetrics, reference, inputs } = result;
  const provider = providerName.trim() || '[RAZÓN SOCIAL DEL PROVEEDOR]';

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    const rows = [
      ['PROPUESTA TECNICO-FINANCIERA (BORRADOR GENERADO CON CLEANQUOTE PRO)'],
      ['Proveedor', provider],
      ['Proyecto / Cliente', projectName],
      ['Tipologia', inputs.infrastructureType.name],
      ['CPC de referencia', reference.cpcCode],
      ['Referencia publica (USD/m2)', reference.kind === 'contratos' ? `${reference.minPriceM2.toFixed(2)} - ${reference.maxPriceM2.toFixed(2)}` : reference.priceM2.toFixed(2)],
      ['Fuente de referencia', reference.label],
      ['Area Total (m2)', inputs.areaM2],
      ['Riesgo Sanitario', `Nivel ${inputs.sanitaryRiskLevel.level}`],
      ['Trafico Peatonal', inputs.trafficLevel.label],
      ['Regimen de Turnos', inputs.shiftRegime.label],
      ['Protocolo Quimico', inputs.disinfectionProtocol.name],
      ['Frecuencia (pasadas/dia)', inputs.dailyFrequency],
      [''],
      ['METRICAS OPERATIVAS'],
      ['Cobertura por auxiliar/turno (m2)', yieldMetrics.coverageM2PerPost.toFixed(0)],
      ...staffingMetrics.shiftRows.map((r) => [`Puestos ${r.name}`, r.posts]),
      ['Personal Total (FTE)', staffingMetrics.assignedFTE.toFixed(2)],
      ['Supervisores', staffingMetrics.supervisors],
      ['Horas de cobertura mensuales', Math.round(yieldMetrics.monthlyRequiredHours)],
      ['Costo empresa por FTE diurno (USD/mes)', staffingMetrics.unitDayLaborCost.toFixed(2)],
      [''],
      ['ESTRUCTURA ECONOMICA (USD/mes)'],
      ['Mano de Obra Directa', costBreakdown.labor.amount.toFixed(2)],
      ['  de la cual recargo nocturno', costBreakdown.labor.nightSurcharge.toFixed(2)],
      ['  de la cual supervision', costBreakdown.labor.supervision.toFixed(2)],
      ['Insumos Quimicos', costBreakdown.chemicals.amount.toFixed(2)],
      ['EPP y Bioseguridad', costBreakdown.ppe.amount.toFixed(2)],
      ['Maquinaria y Equipos', costBreakdown.equipment.amount.toFixed(2)],
      ['Gastos Indirectos', costBreakdown.indirect.amount.toFixed(2)],
      ['Costo Tecnico Total', costBreakdown.totalCost.toFixed(2)],
      ['Margen (antes de participacion e impuestos)', costBreakdown.profit.amount.toFixed(2)],
      ['Margen (%)', costBreakdown.profit.percentage.toFixed(1)],
      ['PRECIO MENSUAL SIN IVA', costBreakdown.recommendedSellingPrice.toFixed(2)],
      [`IVA ${(ECUADOR_LABOR_CONFIG.ivaRate * 100).toFixed(0)}%`, costBreakdown.ivaAmount.toFixed(2)],
      ['PRECIO MENSUAL CON IVA', costBreakdown.priceWithIVA.toFixed(2)],
      ['PRECIO UNITARIO SIN IVA (USD/m2)', unitEconomics.unitPricePerM2.toFixed(3)]
    ];
    const csvContent = '﻿' + rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Cotizacion_${projectName.replace(/[^\wÁÉÍÓÚáéíóúñÑ-]+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const now = new Date();
  const currentDate = now.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });
  const quoteCode = `COT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="modal-overlay" id="proposal-modal-overlay">
      <div className="modal-container">
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="card-icon-badge" style={{ background: '#ecfdf5', color: '#059669', width: '32px', height: '32px' }}>
              <LucideIcon name="FileText" size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>Borrador de Oferta Técnico-Financiera</h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Plantilla generada por el modelo; debe ser revisada y firmada por el proveedor</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <input
              type="text"
              className="text-input"
              placeholder="Razón social del proveedor"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              style={{ width: '210px', padding: '0.45rem 0.6rem' }}
            />
            <button className="btn-secondary" onClick={handleExportCSV}>
              <LucideIcon name="Download" size={14} /> CSV
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
          <div className="tender-document" id="printable-tender-document">
            <div className="tender-header">
              <div className="tender-logo">
                <h2>{provider}</h2>
                <p>Servicio de limpieza y desinfección</p>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>RUC: [completar] • Certificaciones: [completar solo si el proveedor las posee]</p>
              </div>
              <div className="tender-meta">
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>PROPUESTA TÉCNICO-FINANCIERA</div>
                <div>
                  Código: <strong>{quoteCode}</strong>
                </div>
                <div>
                  CPC de referencia: <strong>{reference.cpcCode}</strong>
                </div>
                <div>
                  Fecha de emisión: <strong>{currentDate}</strong>
                </div>
                <div>
                  Validez de la oferta: <strong>30 días calendario</strong>
                </div>
              </div>
            </div>

            <div className="tender-section">
              <h3>1. Información General del Servicio</h3>
              <div className="tender-grid">
                <div>
                  <p>
                    <strong>Cliente / Proyecto:</strong> {projectName}
                  </p>
                  <p>
                    <strong>Tipología:</strong> {inputs.infrastructureType.name}
                  </p>
                  <p>
                    <strong>Área contratada:</strong> {Number(inputs.areaM2).toLocaleString('es-EC')} m²
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
                    <strong>Tráfico:</strong> {inputs.trafficLevel.label}
                  </p>
                </div>
              </div>
            </div>

            <div className="tender-section">
              <h3>2. Especificaciones Técnicas</h3>
              <table className="tender-table">
                <tbody>
                  <tr>
                    <td style={{ width: '35%', fontWeight: 600 }}>Protocolo aplicado:</td>
                    <td>{inputs.disinfectionProtocol.name}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Referencia normativa:</td>
                    <td>{inputs.disinfectionProtocol.normative}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Agentes y tiempo de contacto:</td>
                    <td>
                      {inputs.disinfectionProtocol.chemicalProduct} ({inputs.disinfectionProtocol.contactTimeMinutes} min)
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Frecuencia de desinfección:</td>
                    <td>{inputs.dailyFrequency} pasadas por día</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Cobertura por auxiliar y turno:</td>
                    <td>{Math.round(yieldMetrics.coverageM2PerPost).toLocaleString('es-EC')} m² (ajustada por riesgo, tráfico, protocolo, frecuencia y mecanización)</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Equipamiento:</td>
                    <td>{inputs.machineryOption.label}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="tender-section">
              <h3>3. Asignación de Personal</h3>
              <table className="tender-table">
                <thead>
                  <tr>
                    <th>Turno</th>
                    <th>Puestos</th>
                    <th>Horas nocturnas (Art. 49)</th>
                    <th>Horas/semana</th>
                  </tr>
                </thead>
                <tbody>
                  {staffingMetrics.shiftRows.map((r) => (
                    <tr key={r.name}>
                      <td>{r.name}</td>
                      <td>{r.posts}</td>
                      <td>{r.nocturnalHours} h/turno</td>
                      <td>{r.weeklyHours.toFixed(0)} h</td>
                    </tr>
                  ))}
                  <tr>
                    <td>Supervisión (1 por cada 25 auxiliares)</td>
                    <td>{staffingMetrics.supervisors > 0 ? staffingMetrics.supervisors : 'Asumida por un auxiliar'}</td>
                    <td colSpan="2">—</td>
                  </tr>
                  <tr style={{ fontWeight: 700, background: '#f8fafc' }}>
                    <td>TOTAL PERSONAL (40 h/semana por persona)</td>
                    <td colSpan="3">
                      {staffingMetrics.assignedFTE.toFixed(2)} FTE • {Math.round(yieldMetrics.monthlyRequiredHours)} horas de cobertura/mes
                    </td>
                  </tr>
                </tbody>
              </table>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                * Remuneración calculada sobre el SBU vigente (USD {inputs.sbu.toFixed(2)}) con aporte patronal IESS, décimos, {inputs.includeFondoReserva ? 'fondos de reserva, ' : ''}
                vacaciones y recargo nocturno del 25% para horas entre 19h00 y 06h00. Costo empresa diurno: {formatUSD(staffingMetrics.unitDayLaborCost)}/mes.
              </p>
            </div>

            <div className="tender-section">
              <h3>4. Propuesta Económica</h3>
              <table className="tender-table">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th style={{ textAlign: 'right' }}>Valor Mensual (USD)</th>
                    <th style={{ textAlign: 'right' }}>USD/m²</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Costos directos (mano de obra, insumos, EPP, equipos)</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(costBreakdown.totalDirectCost)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(costBreakdown.totalDirectCost / inputs.areaM2)}</td>
                  </tr>
                  <tr>
                    <td>Gastos indirectos ({inputs.indirectRate}%)</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(costBreakdown.indirect.amount)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(costBreakdown.indirect.amount / inputs.areaM2)}</td>
                  </tr>
                  <tr>
                    <td>Utilidad</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(costBreakdown.profit.amount)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(costBreakdown.profit.amount / inputs.areaM2)}</td>
                  </tr>
                  <tr style={{ background: '#ecfdf5', fontWeight: 800, color: '#065f46' }}>
                    <td>PRECIO MENSUAL SIN IVA</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(costBreakdown.recommendedSellingPrice)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(unitEconomics.unitPricePerM2)}</td>
                  </tr>
                  <tr>
                    <td>IVA {(ECUADOR_LABOR_CONFIG.ivaRate * 100).toFixed(0)}%</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(costBreakdown.ivaAmount)}</td>
                    <td></td>
                  </tr>
                  <tr style={{ fontWeight: 700 }}>
                    <td>PRECIO MENSUAL CON IVA</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatUSD(costBreakdown.priceWithIVA)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="tender-section" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ borderBottom: 'none', marginBottom: '0.5rem', color: '#0f172a', fontSize: '0.95rem' }}>5. Comparación referencial con precios públicos</h3>
              <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.5 }}>
                <p>
                  <strong>Referencia:</strong> {reference.label}
                </p>
                <p>
                  <strong>Resultado:</strong> el precio propuesto de {formatUSD(unitEconomics.unitPricePerM2)}/m² está {reference.statusLabel.charAt(0).toLowerCase() + reference.statusLabel.slice(1)}.
                </p>
                <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                  {reference.caveat} Esta comparación es informativa y no constituye una certificación del SERCOP.
                </p>
                <p style={{ marginTop: '0.25rem', fontSize: '0.72rem', color: '#64748b' }}>
                  Fuentes: {reference.sourceKeys.map((k) => SOURCES[k].label).join(' • ')}
                </p>
              </div>
            </div>

            <div className="tender-signatures">
              <div className="signature-box">
                <strong>Responsable de Costos</strong>
                <p>{provider}</p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Firma</p>
              </div>
              <div className="signature-box">
                <strong>Responsable de Operaciones</strong>
                <p>{provider}</p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Aprobación técnica</p>
              </div>
              <div className="signature-box">
                <strong>Cliente</strong>
                <p>{projectName}</p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Aceptación de la propuesta</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
