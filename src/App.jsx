import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { ResultsDashboard } from './components/ResultsDashboard';
import { ComparativeAnalysis } from './components/ComparativeAnalysis';
import { ProposalPreviewModal } from './components/ProposalPreviewModal';
import { HackathonDefenseTab } from './components/HackathonDefenseTab';
import { LucideIcon } from './components/LucideIcon';
import { calculateQuote } from './utils/calculator.js';
import { REAL_PRESETS, INFRASTRUCTURE_TYPES } from './data/parametricData.js';

export function App() {
  const initialPreset = REAL_PRESETS[0];

  const [selectedPresetId, setSelectedPresetId] = useState(initialPreset.id);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showDefenseModal, setShowDefenseModal] = useState(false);
  const [activeTab, setActiveTab] = useState('cotizador');

  const [formState, setFormState] = useState({
    projectName: initialPreset.name,
    infrastructureTypeId: initialPreset.infrastructureType,
    areaM2: initialPreset.areaM2,
    sanitaryRiskLevelNumber: initialPreset.sanitaryRiskLevel,
    trafficLevelId: initialPreset.trafficLevel,
    disinfectionProtocolId: initialPreset.disinfectionProtocol,
    shiftRegimeId: initialPreset.shiftRegime,
    machineryOptionId: initialPreset.machineryOption,
    targetMargin: initialPreset.targetMargin,
    indirectRate: initialPreset.indirectRate,
    benchmarkFlatRatePerM2: 1.25 // Tarifa plana tradicional común en Ecuador
  });

  const quoteResult = useMemo(() => {
    return calculateQuote(formState);
  }, [formState]);

  const handleFieldChange = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value
    }));
    if (field !== 'benchmarkFlatRatePerM2') {
      setSelectedPresetId('custom');
    }
  };

  const handleTypologySelect = (typologyId) => {
    const defaultData = INFRASTRUCTURE_TYPES[typologyId];
    if (!defaultData) return;

    setFormState((prev) => ({
      ...prev,
      infrastructureTypeId: typologyId,
      sanitaryRiskLevelNumber: defaultData.defaultRiskLevel,
      trafficLevelId: defaultData.defaultTraffic,
      disinfectionProtocolId: defaultData.defaultProtocol
    }));
    setSelectedPresetId('custom');
  };

  const handlePresetSelect = (presetId) => {
    setSelectedPresetId(presetId);
    if (presetId === 'custom') return;

    const preset = REAL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setFormState({
      projectName: preset.name,
      infrastructureTypeId: preset.infrastructureType,
      areaM2: preset.areaM2,
      sanitaryRiskLevelNumber: preset.sanitaryRiskLevel,
      trafficLevelId: preset.trafficLevel,
      disinfectionProtocolId: preset.disinfectionProtocol,
      shiftRegimeId: preset.shiftRegime,
      machineryOptionId: preset.machineryOption,
      targetMargin: preset.targetMargin,
      indirectRate: preset.indirectRate,
      benchmarkFlatRatePerM2: 1.25
    });
  };

  return (
    <div className="app-shell" id="app-root-shell">
      {/* Top Header Bar */}
      <Header
        selectedPresetId={selectedPresetId}
        onSelectPreset={handlePresetSelect}
        onOpenProposal={() => setShowProposalModal(true)}
        onOpenDefense={() => setShowDefenseModal(true)}
      />

      {/* Main Tabs Navigation */}
      <nav className="main-nav-tabs no-print">
        <div className="nav-tabs-container">
          <button
            className={`tab-btn ${activeTab === 'cotizador' ? 'active' : ''}`}
            onClick={() => setActiveTab('cotizador')}
            id="tab-btn-cotizador"
          >
            <LucideIcon name="BarChart3" size={15} />
            <span>Estructuración de Costos & Cotización</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'comparativa' ? 'active' : ''}`}
            onClick={() => setActiveTab('comparativa')}
            id="tab-btn-comparativa"
          >
            <LucideIcon name="Scale" size={15} />
            <span>Comparativa vs. Método Tradicional</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'auditoria' ? 'active' : ''}`}
            onClick={() => setActiveTab('auditoria')}
            id="tab-btn-auditoria"
          >
            <LucideIcon name="ShieldCheck" size={15} />
            <span>Blindaje Operativo & Bioseguridad</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="calc-grid">
          {/* Left Column: Interactive Parametric Input Panel */}
          <InputPanel
            formState={formState}
            onChangeField={handleFieldChange}
            onTypologySelect={handleTypologySelect}
          />

          {/* Right Column: Dynamic Results, Dashboards & Comparative */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {activeTab === 'cotizador' && (
              <>
                <ResultsDashboard result={quoteResult} />
                <ComparativeAnalysis
                  result={quoteResult}
                  onChangeBenchmarkRate={(rate) => handleFieldChange('benchmarkFlatRatePerM2', rate)}
                />
              </>
            )}

            {activeTab === 'comparativa' && (
              <>
                <ComparativeAnalysis
                  result={quoteResult}
                  onChangeBenchmarkRate={(rate) => handleFieldChange('benchmarkFlatRatePerM2', rate)}
                />
                <ResultsDashboard result={quoteResult} />
              </>
            )}

            {activeTab === 'auditoria' && (
              <div className="glass-card">
                <div className="card-header">
                  <div className="card-title-group">
                    <div className="card-icon-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
                      <LucideIcon name="ShieldCheck" size={18} />
                    </div>
                    <div>
                      <h2>Auditoría de Cumplimiento Sanitario y Viabilidad Laboral</h2>
                      <p className="card-subtitle">
                        Validación estricta de normativas laborales del MDT y bioseguridad del MSP
                      </p>
                    </div>
                  </div>
                  <span className="hackathon-badge">Normativa Ecuador 2026</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>CÓDIGO DEL TRABAJO ECUADOR</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7', marginTop: '0.25rem' }}>
                      40h / semana
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.4 }}>
                      Asignación legal con factor de relevo del {((quoteResult.staffingMetrics.reliefFactor - 1) * 100).toFixed(0)}% para cubrir descansos obligatorios de 48h.
                    </p>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>RECARGO NOCTURNO ART. 49</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>
                      +25% Por Ley
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.4 }}>
                      {quoteResult.staffingMetrics.nightFTE > 0
                        ? `${quoteResult.staffingMetrics.nightFTE.toFixed(1)} operarios nocturnos calculados con salario diferenciado ($${quoteResult.staffingMetrics.unitNightLaborCost.toFixed(2)}/mes).`
                        : 'Jornada diurna sin recargo nocturno.'}
                    </p>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>TIEMPO DE CONTACTO QUÍMICO</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>
                      {quoteResult.inputs.disinfectionProtocol.contactTimeMinutes} Minutos
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.4 }}>
                      Garantía de inactivación de patógenos según ficha técnica ({quoteResult.inputs.disinfectionProtocol.chemicalProduct}).
                    </p>
                  </div>
                </div>

                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '1.25rem', borderRadius: '10px' }}>
                  <h4 style={{ color: '#065f46', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <LucideIcon name="CheckCircle2" size={17} /> Dictamen de Auditoría Paramétrica & Cumplimiento SERCOP:
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#166534', lineHeight: 1.6 }}>
                    La oferta generada para <strong>{formState.projectName}</strong> cuenta con un respaldo matemático que blinda el margen de rentabilidad de la empresa al {quoteResult.costBreakdown.profit.percentage.toFixed(1)}% (sin peligro de subcotización ni pérdidas imprevistas) y garantiza que el cliente final reciba {Math.round(quoteResult.yieldMetrics.monthlyRequiredHours)} horas/hombre mensuales certificadas bajo la norma <em>{quoteResult.inputs.disinfectionProtocol.normative}</em>, cumpliendo estrictamente con la banda referencial SERCOP de <strong>${quoteResult.sercopBenchmark?.minRateM2?.toFixed(2)} a ${quoteResult.sercopBenchmark?.maxRateM2?.toFixed(2)} /m²</strong> (CPC {quoteResult.sercopBenchmark?.cpcCode}).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal 1: Formal Technical-Financial Proposal Document */}
      {showProposalModal && (
        <ProposalPreviewModal
          result={quoteResult}
          projectName={formState.projectName}
          onClose={() => setShowProposalModal(false)}
        />
      )}

      {/* Modal 2: Hackathon Defense & Official Evaluation Matrix */}
      {showDefenseModal && (
        <HackathonDefenseTab onClose={() => setShowDefenseModal(false)} />
      )}
    </div>
  );
}

export default App;
