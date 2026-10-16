import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { ResultsDashboard, ValidationPanel, AssumptionsPanel } from './components/ResultsDashboard';
import { ComparativeAnalysis } from './components/ComparativeAnalysis';
import { ProposalPreviewModal } from './components/ProposalPreviewModal';
import { HackathonDefenseTab } from './components/HackathonDefenseTab';
import { PliegoImporter, CompliancePanel } from './components/PliegoImporter';
import { LucideIcon } from './components/LucideIcon';
import { calculateQuote, checkCompliance } from './utils/calculator.js';
import { REAL_PRESETS, INFRASTRUCTURE_TYPES, ECUADOR_LABOR_CONFIG } from './data/parametricData.js';

const DEFAULT_FLAT_RATE = 1.58; // Catálogo SERCOP — limpieza de áreas internas (2023)

function presetToFormState(preset, prev = {}) {
  return {
    projectName: preset.name,
    infrastructureTypeId: preset.infrastructureType,
    areaM2: preset.areaM2,
    sanitaryRiskLevelNumber: preset.sanitaryRiskLevel,
    trafficLevelId: preset.trafficLevel,
    disinfectionProtocolId: preset.disinfectionProtocol,
    shiftRegimeId: preset.shiftRegime,
    machineryOptionId: preset.machineryOption,
    dailyFrequency: preset.dailyFrequency,
    targetMargin: preset.targetMargin,
    indirectRate: preset.indirectRate,
    sbu: prev.sbu ?? ECUADOR_LABOR_CONFIG.sbuBase,
    includeFondoReserva: prev.includeFondoReserva ?? true,
    benchmarkFlatRatePerM2: prev.benchmarkFlatRatePerM2 ?? DEFAULT_FLAT_RATE
  };
}

export function App() {
  const initialPreset = REAL_PRESETS[0];

  const [selectedPresetId, setSelectedPresetId] = useState(initialPreset.id);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showDefenseModal, setShowDefenseModal] = useState(false);
  const [activeTab, setActiveTab] = useState('cotizador');
  const [formState, setFormState] = useState(() => presetToFormState(initialPreset));
  const [showPliegoModal, setShowPliegoModal] = useState(false);
  const [pliego, setPliego] = useState(null); // { normalized, extracted, meta, aiFields }

  const quoteResult = useMemo(() => calculateQuote(formState), [formState]);
  const compliance = useMemo(
    () => (pliego ? checkCompliance(quoteResult, pliego.normalized.requirements, pliego.extracted) : null),
    [pliego, quoteResult]
  );

  const handlePliegoApply = ({ patch, normalized, extracted, meta }) => {
    const name = [normalized.entidad, normalized.objeto ? normalized.objeto.slice(0, 80) : null].filter(Boolean).join(' — ');
    setFormState((prev) => ({ ...prev, ...patch, projectName: name || prev.projectName }));
    setSelectedPresetId('custom');
    setPliego({ normalized, extracted, meta, aiFields: Object.keys(patch) });
    setActiveTab('cotizador');
    setShowPliegoModal(false);
  };

  const handleFieldChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (!['benchmarkFlatRatePerM2', 'projectName', 'sbu', 'includeFondoReserva'].includes(field)) {
      setSelectedPresetId('custom');
    }
  };

  const handleTypologySelect = (typologyId) => {
    const t = INFRASTRUCTURE_TYPES[typologyId];
    if (!t) return;
    setFormState((prev) => ({
      ...prev,
      infrastructureTypeId: typologyId,
      sanitaryRiskLevelNumber: t.defaultRiskLevel,
      trafficLevelId: t.defaultTraffic,
      disinfectionProtocolId: t.defaultProtocol,
      shiftRegimeId: t.defaultShift,
      dailyFrequency: t.defaultFrequency
    }));
    setSelectedPresetId('custom');
  };

  const handlePresetSelect = (presetId) => {
    setSelectedPresetId(presetId);
    if (presetId === 'custom') return;
    const preset = REAL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setFormState((prev) => presetToFormState(preset, prev));
  };

  const tabs = [
    ['cotizador', 'BarChart3', 'Cotización & Comparativa'],
    ['validacion', 'ClipboardCheck', 'Validación del Modelo'],
    ['supuestos', 'BookOpen', 'Supuestos, Fuentes & Normativa']
  ];

  return (
    <div className="app-shell" id="app-root-shell">
      <Header
        selectedPresetId={selectedPresetId}
        onSelectPreset={handlePresetSelect}
        onOpenProposal={() => setShowProposalModal(true)}
        onOpenDefense={() => setShowDefenseModal(true)}
        onOpenPliego={() => setShowPliegoModal(true)}
      />

      <nav className="main-nav-tabs no-print">
        <div className="nav-tabs-container">
          {tabs.map(([id, icon, label]) => (
            <button key={id} className={`tab-btn ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)} id={`tab-btn-${id}`}>
              <LucideIcon name={icon} size={15} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="main-content">
        <div className="calc-grid">
          <InputPanel formState={formState} onChangeField={handleFieldChange} onTypologySelect={handleTypologySelect} aiFields={pliego?.aiFields} aiSource={pliego?.meta} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', minWidth: 0 }}>
            {activeTab === 'cotizador' && (
              <>
                <CompliancePanel compliance={compliance} pliego={pliego} onClear={() => setPliego(null)} />
                <ResultsDashboard result={quoteResult} />
                <ComparativeAnalysis result={quoteResult} onChangeBenchmarkRate={(rate) => handleFieldChange('benchmarkFlatRatePerM2', rate)} />
              </>
            )}
            {activeTab === 'validacion' && <ValidationPanel params={formState} />}
            {activeTab === 'supuestos' && <AssumptionsPanel />}
          </div>
        </div>
      </main>

      {showProposalModal && <ProposalPreviewModal result={quoteResult} projectName={formState.projectName} onClose={() => setShowProposalModal(false)} />}

      {showPliegoModal && <PliegoImporter onClose={() => setShowPliegoModal(false)} onApply={handlePliegoApply} />}

      {showDefenseModal && <HackathonDefenseTab params={formState} onClose={() => setShowDefenseModal(false)} />}
    </div>
  );
}

export default App;
