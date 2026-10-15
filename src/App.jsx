import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { PriceHero } from './components/PriceHero';
import { ResultsDashboard } from './components/ResultsDashboard';
import { ComparativeAnalysis } from './components/ComparativeAnalysis';
import { ValidationPanel } from './components/ValidationPanel';
import { CompliancePanel } from './components/CompliancePanel';
import { ProposalPreviewModal } from './components/ProposalPreviewModal';
import { HackathonDefenseTab } from './components/HackathonDefenseTab';
import { calculateQuote } from './utils/calculator.js';
import { presetToState, bandPosition } from './utils/analysis.js';
import { formatUSD } from './utils/format.js';
import { REAL_PRESETS, INFRASTRUCTURE_TYPES } from './data/parametricData.js';

const TABS = [
  { id: 'desglose', label: 'Desglose del precio' },
  { id: 'tarifa-plana', label: 'Frente a tarifa plana' },
  { id: 'validacion', label: 'Validación' },
  { id: 'cumplimiento', label: 'Cumplimiento' }
];

export function App() {
  const initialPreset = REAL_PRESETS[0];

  const [selectedPresetId, setSelectedPresetId] = useState(initialPreset.id);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showDefenseModal, setShowDefenseModal] = useState(false);
  const [activeTab, setActiveTab] = useState('desglose');
  const [formState, setFormState] = useState(presetToState(initialPreset));

  const quoteResult = useMemo(() => calculateQuote(formState), [formState]);
  const position = bandPosition(quoteResult.unitEconomics.unitPricePerM2, quoteResult.sercopBenchmark);

  const handleFieldChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (field !== 'benchmarkFlatRatePerM2') setSelectedPresetId('custom');
  };

  const handleTypologySelect = (typologyId) => {
    const defaults = INFRASTRUCTURE_TYPES[typologyId];
    if (!defaults) return;
    setFormState((prev) => ({
      ...prev,
      infrastructureTypeId: typologyId,
      sanitaryRiskLevelNumber: defaults.defaultRiskLevel,
      trafficLevelId: defaults.defaultTraffic,
      disinfectionProtocolId: defaults.defaultProtocol
    }));
    setSelectedPresetId('custom');
  };

  const handlePresetSelect = (presetId) => {
    setSelectedPresetId(presetId);
    if (presetId === 'custom') return;
    const preset = REAL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setFormState(presetToState(preset));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onKeyTabs = (e) => {
    const i = TABS.findIndex((t) => t.id === activeTab);
    if (e.key === 'ArrowRight') setActiveTab(TABS[(i + 1) % TABS.length].id);
    if (e.key === 'ArrowLeft') setActiveTab(TABS[(i - 1 + TABS.length) % TABS.length].id);
  };

  return (
    <div className="app-shell" id="app-root-shell">
      <Header
        selectedPresetId={selectedPresetId}
        onSelectPreset={handlePresetSelect}
        onOpenProposal={() => setShowProposalModal(true)}
        onOpenDefense={() => setShowDefenseModal(true)}
      />

      <div className="mini-price" aria-hidden="true">
        <span>
          <strong>{formatUSD(quoteResult.unitEconomics.unitPricePerM2)}</strong> por m²
        </span>
        <span>{position.label}</span>
      </div>

      <main className="layout">
        <InputPanel formState={formState} onChangeField={handleFieldChange} onTypologySelect={handleTypologySelect} />

        <div className="main">
          <div className="hero-block">
            <PriceHero result={quoteResult} projectName={formState.projectName} />
          </div>

          <div className="tabs-block">
            <div className="tabs" role="tablist" aria-label="Análisis de la oferta" onKeyDown={onKeyTabs}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  id={`tab-btn-${t.id}`}
                  className="tab"
                  role="tab"
                  aria-selected={activeTab === t.id}
                  aria-controls={`panel-${t.id}`}
                  tabIndex={activeTab === t.id ? 0 : -1}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="panel" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-btn-${activeTab}`}>
              {activeTab === 'desglose' && <ResultsDashboard result={quoteResult} />}

              {activeTab === 'tarifa-plana' && (
                <ComparativeAnalysis
                  result={quoteResult}
                  onChangeBenchmarkRate={(rate) => handleFieldChange('benchmarkFlatRatePerM2', rate)}
                />
              )}

              {activeTab === 'validacion' && (
                <ValidationPanel formState={formState} result={quoteResult} onSelectPreset={handlePresetSelect} />
              )}

              {activeTab === 'cumplimiento' && <CompliancePanel result={quoteResult} projectName={formState.projectName} />}
            </div>
          </div>
        </div>
      </main>

      {showProposalModal && (
        <ProposalPreviewModal
          result={quoteResult}
          projectName={formState.projectName}
          onClose={() => setShowProposalModal(false)}
        />
      )}

      {showDefenseModal && <HackathonDefenseTab onClose={() => setShowDefenseModal(false)} />}
    </div>
  );
}

export default App;
