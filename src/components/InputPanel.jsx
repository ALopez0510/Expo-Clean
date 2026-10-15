import React from 'react';
import {
  INFRASTRUCTURE_TYPES,
  TRAFFIC_LEVELS,
  SANITARY_RISK_LEVELS,
  DISINFECTION_PROTOCOLS,
  SHIFT_REGIMES,
  MACHINERY_OPTIONS
} from '../data/parametricData';
import { formatInt } from '../utils/format';

export function InputPanel({ formState, onChangeField, onTypologySelect }) {
  const infra = INFRASTRUCTURE_TYPES[formState.infrastructureTypeId];
  const risk = SANITARY_RISK_LEVELS[formState.sanitaryRiskLevelNumber];
  const protocol = DISINFECTION_PROTOCOLS[formState.disinfectionProtocolId];
  const shift = SHIFT_REGIMES[formState.shiftRegimeId];
  const traffic = TRAFFIC_LEVELS[formState.trafficLevelId];

  const categories = Object.values(INFRASTRUCTURE_TYPES).reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  return (
    <aside className="rail" id="parameters-input-panel" aria-label="Datos del servicio">
      <fieldset className="rail-group">
        <legend>El espacio</legend>

        <div className="field">
          <div className="field-head">
            <label className="field-label" htmlFor="project-name-input">Cliente o proyecto</label>
          </div>
          <input
            id="project-name-input"
            type="text"
            className="text-input"
            value={formState.projectName}
            onChange={(e) => onChangeField('projectName', e.target.value)}
            placeholder="Clínica Pichincha, pabellón quirúrgico"
          />
        </div>

        <div className="field">
          <div className="field-head">
            <label className="field-label" htmlFor="typology-select">Tipo de infraestructura</label>
          </div>
          <select
            id="typology-select"
            className="select-input"
            value={formState.infrastructureTypeId}
            onChange={(e) => onTypologySelect(e.target.value)}
          >
            {Object.entries(categories).map(([category, items]) => (
              <optgroup key={category} label={category}>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          {infra?.description && <p className="field-hint">{infra.description}</p>}
        </div>

        <div className="field">
          <div className="field-head">
            <label className="field-label" htmlFor="area-number-input">Metraje total</label>
            <span className="field-value" id="area-display-badge">{formatInt(formState.areaM2)} m²</span>
          </div>
          <div className="slider-row">
            <input
              id="area-range-slider"
              type="range"
              min="100"
              max="12000"
              step="50"
              value={formState.areaM2}
              onChange={(e) => onChangeField('areaM2', Number(e.target.value))}
              aria-label="Metraje total, control deslizante"
            />
            <input
              id="area-number-input"
              type="number"
              min="50"
              max="50000"
              className="number-input"
              value={formState.areaM2}
              onChange={(e) => onChangeField('areaM2', Math.max(50, Number(e.target.value)))}
            />
          </div>
        </div>

        <div className="field">
          <div className="field-head">
            <label className="field-label" htmlFor="risk-level-select">Riesgo sanitario</label>
            <span className="field-value">
              <span className="risk-dot" style={{ background: risk?.color }} />
              Nivel {formState.sanitaryRiskLevelNumber} de 5
            </span>
          </div>
          <select
            id="risk-level-select"
            className="select-input"
            value={formState.sanitaryRiskLevelNumber}
            onChange={(e) => onChangeField('sanitaryRiskLevelNumber', Number(e.target.value))}
          >
            {Object.values(SANITARY_RISK_LEVELS).map((r) => (
              <option key={r.level} value={r.level}>{r.label}</option>
            ))}
          </select>
          <p className="field-hint">{risk?.description}</p>
        </div>

        <div className="field">
          <div className="field-head">
            <label className="field-label" htmlFor="traffic-level-select">Tráfico peatonal</label>
          </div>
          <select
            id="traffic-level-select"
            className="select-input"
            value={formState.trafficLevelId}
            onChange={(e) => onChangeField('trafficLevelId', e.target.value)}
          >
            {Object.values(TRAFFIC_LEVELS).map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <p className="field-hint">{traffic?.description}</p>
        </div>
      </fieldset>

      <fieldset className="rail-group">
        <legend>La operación</legend>

        <div className="field">
          <div className="field-head">
            <label className="field-label" htmlFor="shift-regime-select">Turnos</label>
          </div>
          <select
            id="shift-regime-select"
            className="select-input"
            value={formState.shiftRegimeId}
            onChange={(e) => onChangeField('shiftRegimeId', e.target.value)}
          >
            {Object.values(SHIFT_REGIMES).map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <p className="field-hint">{shift?.description}</p>
        </div>

        <div className="field">
          <div className="field-head">
            <label className="field-label" htmlFor="disinfection-protocol-select">Protocolo de desinfección</label>
          </div>
          <select
            id="disinfection-protocol-select"
            className="select-input"
            value={formState.disinfectionProtocolId}
            onChange={(e) => onChangeField('disinfectionProtocolId', e.target.value)}
          >
            {Object.values(DISINFECTION_PROTOCOLS).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <p className="field-hint">
            {protocol?.chemicalProduct}. Tiempo de contacto: {protocol?.contactTimeMinutes} min.
          </p>
        </div>

        <div className="field">
          <div className="field-head">
            <label className="field-label" htmlFor="machinery-option-select">Equipamiento</label>
          </div>
          <select
            id="machinery-option-select"
            className="select-input"
            value={formState.machineryOptionId}
            onChange={(e) => onChangeField('machineryOptionId', e.target.value)}
          >
            {Object.values(MACHINERY_OPTIONS).map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} (rendimiento ×{m.yieldMultiplier})
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className="rail-group">
        <legend>El precio</legend>

        <div className="field">
          <div className="field-head">
            <label className="field-label" htmlFor="target-margin-slider">Margen deseado</label>
            <span className="field-value">{formState.targetMargin} %</span>
          </div>
          <input
            id="target-margin-slider"
            type="range"
            min="5"
            max="40"
            step="1"
            value={formState.targetMargin}
            onChange={(e) => onChangeField('targetMargin', Number(e.target.value))}
          />
        </div>

        <div className="field">
          <div className="field-head">
            <label className="field-label" htmlFor="indirect-rate-slider">Costos indirectos</label>
            <span className="field-value">{formState.indirectRate} %</span>
          </div>
          <input
            id="indirect-rate-slider"
            type="range"
            min="4"
            max="20"
            step="1"
            value={formState.indirectRate}
            onChange={(e) => onChangeField('indirectRate', Number(e.target.value))}
          />
        </div>
      </fieldset>
    </aside>
  );
}
