import React from 'react';
import { LucideIcon } from './LucideIcon';
import {
  INFRASTRUCTURE_TYPES,
  TRAFFIC_LEVELS,
  SANITARY_RISK_LEVELS,
  DISINFECTION_PROTOCOLS,
  SHIFT_REGIMES,
  MACHINERY_OPTIONS
} from '../data/parametricData';

export function InputPanel({
  formState,
  onChangeField,
  onTypologySelect,
  // Individual props compatibility
  projectName: propProjectName,
  onProjectNameChange,
  selectedCategoryId: propSelectedCategoryId,
  onCategoryChange,
  categories: propCategories,
  areaM2: propAreaM2,
  onAreaChange,
  riskLevel: propRiskLevel,
  onRiskLevelChange,
  riskLevels: propRiskLevels,
  trafficLevel: propTrafficLevel,
  onTrafficLevelChange,
  trafficLevels: propTrafficLevels,
  shiftsCount: propShiftsCount,
  onShiftsCountChange,
  nightShift: propNightShift,
  onNightShiftChange,
  marginPercent: propMarginPercent,
  onMarginPercentChange,
}) {
  // Resolve state values from either pattern
  const currentProjectName = formState?.projectName ?? propProjectName ?? '';
  const handleProjectNameChange = (val) => {
    onChangeField?.('projectName', val);
    onProjectNameChange?.(val);
  };

  const currentTypologyId = formState?.infrastructureTypeId ?? propSelectedCategoryId ?? 'corporate_office';
  const handleTypologyChange = (id) => {
    if (onTypologySelect) {
      onTypologySelect(id);
    } else {
      onChangeField?.('infrastructureTypeId', id);
    }
    onCategoryChange?.(id);
  };

  const currentAreaM2 = formState?.areaM2 ?? propAreaM2 ?? 1000;
  const handleAreaChange = (val) => {
    onChangeField?.('areaM2', val);
    onAreaChange?.(val);
  };

  const currentRiskLevel = formState?.sanitaryRiskLevelNumber ?? propRiskLevel ?? 1;
  const handleRiskLevelChange = (val) => {
    onChangeField?.('sanitaryRiskLevelNumber', val);
    onRiskLevelChange?.(val);
  };

  const currentTrafficLevelId = formState?.trafficLevelId ?? propTrafficLevel ?? 'medium';
  const handleTrafficLevelChange = (val) => {
    onChangeField?.('trafficLevelId', val);
    onTrafficLevelChange?.(val);
  };

  const currentShiftRegimeId = formState?.shiftRegimeId ?? 'diurno_5d';
  const handleShiftRegimeChange = (val) => {
    onChangeField?.('shiftRegimeId', val);
    onShiftsCountChange?.(val);
  };

  const currentProtocolId = formState?.disinfectionProtocolId ?? 'standard';
  const handleProtocolChange = (val) => {
    onChangeField?.('disinfectionProtocolId', val);
  };

  const currentMachineryId = formState?.machineryOptionId ?? 'semi_mechanized';
  const handleMachineryChange = (val) => {
    onChangeField?.('machineryOptionId', val);
  };

  const currentTargetMargin = formState?.targetMargin ?? propMarginPercent ?? 18;
  const handleTargetMarginChange = (val) => {
    onChangeField?.('targetMargin', val);
    onMarginPercentChange?.(val);
  };

  const currentIndirectRate = formState?.indirectRate ?? 9;
  const handleIndirectRateChange = (val) => {
    onChangeField?.('indirectRate', val);
  };

  // Dynamic Risk Badge Color
  const getRiskBadgeDetails = (level) => {
    if (level >= 4) {
      return {
        className: 'badge-risk-critical',
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fecaca',
        label: `Nivel ${level} / 5 • Crítico`
      };
    }
    if (level === 3) {
      return {
        className: 'badge-risk-medium',
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
        label: `Nivel ${level} / 5 • Medio`
      };
    }
    return {
      className: 'badge-risk-low',
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      label: `Nivel ${level} / 5 • Mínimo`
    };
  };

  const riskBadge = getRiskBadgeDetails(currentRiskLevel);

  // Quick area jump presets
  const areaPresets = [500, 1000, 2000, 4500];

  return (
    <aside className="glass-card input-section" id="parameters-input-panel">
      {/* Panel Header */}
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon-badge">
            <LucideIcon name="SlidersHorizontal" size={17} />
          </div>
          <div>
            <h2>Variables Paramétricas</h2>
            <p className="card-subtitle">Configuración operativa multidimensional</p>
          </div>
        </div>
        <span className="live-tag">
          <span className="live-dot" />
          En Vivo
        </span>
      </div>

      {/* 1. Nombre del Proyecto / Cliente con ícono */}
      <div className="form-group">
        <label className="form-label" htmlFor="project-name-input">
          <span>Nombre del Proyecto / Cliente</span>
          <span className="field-optional-hint">Referencia licitación</span>
        </label>
        <div className="input-with-icon-wrapper">
          <div className="input-icon-box">
            <LucideIcon name="Briefcase" size={16} />
          </div>
          <input
            id="project-name-input"
            type="text"
            className="text-input modern-input"
            value={currentProjectName}
            onChange={(e) => handleProjectNameChange(e.target.value)}
            placeholder="Ej. Clínica Pichincha - Quirófanos / Edificio Corporativo..."
          />
        </div>
      </div>

      {/* 2. Grilla de Tipologías de Infraestructura */}
      <div className="form-group">
        <div className="form-label">
          <span>Tipología de Infraestructura</span>
          <span className="typology-category-badge">
            {INFRASTRUCTURE_TYPES[currentTypologyId]?.category || 'Infraestructura'}
          </span>
        </div>

        <div className="typology-grid">
          {Object.values(INFRASTRUCTURE_TYPES).map((item) => {
            const isSelected = currentTypologyId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`typology-option-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleTypologyChange(item.id)}
                id={`typology-card-${item.id}`}
              >
                <div className={`typology-icon-container ${isSelected ? 'active' : ''}`}>
                  <LucideIcon name={item.iconName || 'Building2'} size={16} />
                </div>
                <div className="typology-card-text">
                  <span className="typology-card-title">{item.name}</span>
                </div>
                {isSelected && (
                  <div className="typology-card-check">
                    <LucideIcon name="Check" size={14} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Metraje Cuadrado Total con Slider y Badge Estilizado */}
      <div className="form-group">
        <div className="form-label">
          <label htmlFor="area-number-input">Área a Cubrir (Metraje Total)</label>
          <span className="area-badge-highlight" id="area-display-badge">
            {Number(currentAreaM2).toLocaleString('es-EC')} m²
          </span>
        </div>

        <div className="range-slider-wrapper">
          {/* Custom Track Slider */}
          <input
            id="area-range-slider"
            type="range"
            min="100"
            max="12000"
            step="50"
            className="range-slider custom-range-slider"
            value={currentAreaM2}
            onChange={(e) => handleAreaChange(Number(e.target.value))}
          />

          <div className="area-inputs-row">
            <div className="input-with-unit-box">
              <input
                id="area-number-input"
                type="number"
                min="50"
                max="50000"
                className="text-input area-number-field"
                value={currentAreaM2}
                onChange={(e) => handleAreaChange(Math.max(50, Number(e.target.value)))}
              />
              <span className="unit-suffix-tag">m²</span>
            </div>

            {/* Quick Presets Pills */}
            <div className="area-quick-presets">
              {areaPresets.map((presetVal) => (
                <button
                  key={presetVal}
                  type="button"
                  className={`area-pill-btn ${currentAreaM2 === presetVal ? 'active' : ''}`}
                  onClick={() => handleAreaChange(presetVal)}
                >
                  {presetVal >= 1000 ? `${presetVal / 1000}k` : presetVal}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Selector de Riesgo Microbiológico con Badge Dinámico de Color */}
      <div className="form-group">
        <div className="form-label">
          <label htmlFor="risk-level-select">Riesgo Sanitario Microbiológico</label>
          <span
            className="risk-level-badge"
            style={{
              color: riskBadge.color,
              backgroundColor: riskBadge.bg,
              borderColor: riskBadge.border
            }}
          >
            {riskBadge.label}
          </span>
        </div>

        {/* 5-Step Visual Risk Bar Indicator */}
        <div className="risk-severity-bar" title={`Severidad de riesgo: Nivel ${currentRiskLevel} de 5`}>
          {[1, 2, 3, 4, 5].map((lvl) => {
            const isFilled = lvl <= currentRiskLevel;
            let barColor = '#e2e8f0';
            if (isFilled) {
              if (currentRiskLevel >= 4) barColor = '#dc2626';
              else if (currentRiskLevel === 3) barColor = '#d97706';
              else barColor = '#059669';
            }
            return (
              <div
                key={lvl}
                className="risk-bar-segment"
                style={{ backgroundColor: barColor }}
              />
            );
          })}
        </div>

        <select
          id="risk-level-select"
          className="select-input modern-select"
          value={currentRiskLevel}
          onChange={(e) => handleRiskLevelChange(Number(e.target.value))}
        >
          {Object.values(SANITARY_RISK_LEVELS).map((r) => (
            <option key={r.level} value={r.level}>
              {r.label}
            </option>
          ))}
        </select>
        <p className="field-hint-card">
          <LucideIcon name="ShieldAlert" size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{SANITARY_RISK_LEVELS[currentRiskLevel]?.description}</span>
        </p>
      </div>

      {/* 5. Tráfico Peatonal */}
      <div className="form-group">
        <label className="form-label" htmlFor="traffic-level-select">
          <span>Tráfico Peatonal y Flujo Humano</span>
          <span className="field-subtle-hint">Tasa de reensuciamiento</span>
        </label>
        <select
          id="traffic-level-select"
          className="select-input modern-select"
          value={currentTrafficLevelId}
          onChange={(e) => handleTrafficLevelChange(e.target.value)}
        >
          {Object.values(TRAFFIC_LEVELS).map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* 6. Régimen de Turnos (Código de Trabajo Ecuador) */}
      <div className="form-group">
        <div className="form-label">
          <label htmlFor="shift-regime-select">Régimen Operativo y Turnos</label>
          <span className="tag-labor-law">Código del Trabajo</span>
        </div>
        <select
          id="shift-regime-select"
          className="select-input modern-select"
          value={currentShiftRegimeId}
          onChange={(e) => handleShiftRegimeChange(e.target.value)}
        >
          {Object.values(SHIFT_REGIMES).map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <p className="field-hint">
          {SHIFT_REGIMES[currentShiftRegimeId]?.description}
        </p>
      </div>

      {/* 7. Normativa y Protocolo de Desinfección */}
      <div className="form-group">
        <label className="form-label" htmlFor="disinfection-protocol-select">
          <span>Normativa y Protocolo Químico</span>
          <span className="field-subtle-hint">Validación técnica</span>
        </label>
        <select
          id="disinfection-protocol-select"
          className="select-input modern-select"
          value={currentProtocolId}
          onChange={(e) => handleProtocolChange(e.target.value)}
        >
          {Object.values(DISINFECTION_PROTOCOLS).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="protocol-summary-card">
          <div className="protocol-row">
            <span className="protocol-label">Producto:</span>
            <span className="protocol-val">{DISINFECTION_PROTOCOLS[currentProtocolId]?.chemicalProduct}</span>
          </div>
          <div className="protocol-row">
            <span className="protocol-label">Contacto:</span>
            <span className="protocol-val">{DISINFECTION_PROTOCOLS[currentProtocolId]?.contactTimeMinutes} minutos requeridos</span>
          </div>
        </div>
      </div>

      {/* 8. Grado de Mecanización */}
      <div className="form-group">
        <label className="form-label" htmlFor="machinery-option-select">
          Equipamiento y Mecanización
        </label>
        <select
          id="machinery-option-select"
          className="select-input modern-select"
          value={currentMachineryId}
          onChange={(e) => handleMachineryChange(e.target.value)}
        >
          {Object.values(MACHINERY_OPTIONS).map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} (×{m.yieldMultiplier} rendimiento)
            </option>
          ))}
        </select>
      </div>

      {/* 9. Parámetros Financieros (Margen & Gastos Indirectos) */}
      <div className="financial-sliders-grid">
        <div className="form-group">
          <div className="form-label">
            <label htmlFor="target-margin-slider">Margen Deseado</label>
            <span className="label-value-badge">{currentTargetMargin}%</span>
          </div>
          <input
            id="target-margin-slider"
            type="range"
            min="5"
            max="40"
            step="1"
            className="range-slider custom-range-slider"
            value={currentTargetMargin}
            onChange={(e) => handleTargetMarginChange(Number(e.target.value))}
          />
        </div>

        <div className="form-group">
          <div className="form-label">
            <label htmlFor="indirect-rate-slider">Costos Indirectos</label>
            <span className="label-value-badge">{currentIndirectRate}%</span>
          </div>
          <input
            id="indirect-rate-slider"
            type="range"
            min="4"
            max="20"
            step="1"
            className="range-slider custom-range-slider"
            value={currentIndirectRate}
            onChange={(e) => handleIndirectRateChange(Number(e.target.value))}
          />
        </div>
      </div>
    </aside>
  );
}
