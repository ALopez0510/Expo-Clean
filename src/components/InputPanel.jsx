import React from 'react';
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
  onTypologySelect
}) {
  return (
    <aside className="glass-card input-section" id="parameters-input-panel">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon-badge">⚙️</div>
          <h2>Variables Paramétricas</h2>
        </div>
        <span className="hackathon-badge">Entrada Dinámica</span>
      </div>

      {/* 1. Nombre de Proyecto & Tipología */}
      <div className="form-group">
        <label className="form-label" htmlFor="project-name-input">
          Nombre del Proyecto / Cliente
        </label>
        <input
          id="project-name-input"
          type="text"
          className="text-input"
          value={formState.projectName}
          onChange={(e) => onChangeField('projectName', e.target.value)}
          placeholder="Ej. Clínica Pichincha - Pabellón Quirúrgico"
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Tipología de Infraestructura
          <span className="label-value-badge">
            {INFRASTRUCTURE_TYPES[formState.infrastructureTypeId]?.category}
          </span>
        </label>
        <div className="typology-grid">
          {Object.values(INFRASTRUCTURE_TYPES).map((item) => {
            const isSelected = formState.infrastructureTypeId === item.id;
            return (
              <div
                key={item.id}
                className={`typology-option-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onTypologySelect(item.id)}
                id={`typology-card-${item.id}`}
              >
                <span className="typology-card-cat">{item.category}</span>
                <span className="typology-card-title">{item.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Metraje Cuadrado Total */}
      <div className="form-group">
        <div className="form-label">
          <label htmlFor="area-number-input">Área a Cubrir (Metraje Total)</label>
          <span className="label-value-badge" id="area-display-badge">
            {Number(formState.areaM2).toLocaleString()} m²
          </span>
        </div>
        <div className="range-slider-wrapper">
          <input
            id="area-range-slider"
            type="range"
            min="100"
            max="12000"
            step="50"
            className="range-slider"
            value={formState.areaM2}
            onChange={(e) => onChangeField('areaM2', Number(e.target.value))}
          />
          <input
            id="area-number-input"
            type="number"
            min="50"
            max="50000"
            className="text-input"
            value={formState.areaM2}
            onChange={(e) => onChangeField('areaM2', Math.max(50, Number(e.target.value)))}
          />
        </div>
      </div>

      {/* 3. Nivel de Riesgo Sanitario / Microbiológico */}
      <div className="form-group">
        <div className="form-label">
          <label htmlFor="risk-level-select">Riesgo Sanitario Microbiológico</label>
          <span
            className="label-value-badge"
            style={{
              color: SANITARY_RISK_LEVELS[formState.sanitaryRiskLevelNumber]?.color,
              borderColor: SANITARY_RISK_LEVELS[formState.sanitaryRiskLevelNumber]?.color
            }}
          >
            Nivel {formState.sanitaryRiskLevelNumber} / 5
          </span>
        </div>
        <select
          id="risk-level-select"
          className="select-input"
          value={formState.sanitaryRiskLevelNumber}
          onChange={(e) => onChangeField('sanitaryRiskLevelNumber', Number(e.target.value))}
        >
          {Object.values(SANITARY_RISK_LEVELS).map((r) => (
            <option key={r.level} value={r.level}>
              {r.label}
            </option>
          ))}
        </select>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          {SANITARY_RISK_LEVELS[formState.sanitaryRiskLevelNumber]?.description}
        </p>
      </div>

      {/* 4. Tráfico Peatonal */}
      <div className="form-group">
        <label className="form-label" htmlFor="traffic-level-select">
          Tráfico Peatonal y Flujo Humano
        </label>
        <select
          id="traffic-level-select"
          className="select-input"
          value={formState.trafficLevelId}
          onChange={(e) => onChangeField('trafficLevelId', e.target.value)}
        >
          {Object.values(TRAFFIC_LEVELS).map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* 5. Régimen de Turnos (Código de Trabajo Ecuador) */}
      <div className="form-group">
        <label className="form-label" htmlFor="shift-regime-select">
          Régimen Operativo y Turnos
        </label>
        <select
          id="shift-regime-select"
          className="select-input"
          value={formState.shiftRegimeId}
          onChange={(e) => onChangeField('shiftRegimeId', e.target.value)}
        >
          {Object.values(SHIFT_REGIMES).map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          {SHIFT_REGIMES[formState.shiftRegimeId]?.description}
        </p>
      </div>

      {/* 6. Normativa y Protocolo de Desinfección */}
      <div className="form-group">
        <label className="form-label" htmlFor="disinfection-protocol-select">
          Normativa y Protocolo Químico
        </label>
        <select
          id="disinfection-protocol-select"
          className="select-input"
          value={formState.disinfectionProtocolId}
          onChange={(e) => onChangeField('disinfectionProtocolId', e.target.value)}
        >
          {Object.values(DISINFECTION_PROTOCOLS).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: '#cbd5e1' }}>
          <strong>Producto:</strong> {DISINFECTION_PROTOCOLS[formState.disinfectionProtocolId]?.chemicalProduct}
          <br />
          <strong>Tiempo contacto:</strong> {DISINFECTION_PROTOCOLS[formState.disinfectionProtocolId]?.contactTimeMinutes} min.
        </div>
      </div>

      {/* 7. Grado de Mecanización */}
      <div className="form-group">
        <label className="form-label" htmlFor="machinery-option-select">
          Equipamiento y Mecanización
        </label>
        <select
          id="machinery-option-select"
          className="select-input"
          value={formState.machineryOptionId}
          onChange={(e) => onChangeField('machineryOptionId', e.target.value)}
        >
          {Object.values(MACHINERY_OPTIONS).map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} (x{m.yieldMultiplier} rendimiento)
            </option>
          ))}
        </select>
      </div>

      {/* 8. Parámetros Financieros (Margen & Gastos Indirectos) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="form-group">
          <div className="form-label">
            <label htmlFor="target-margin-slider">Margen Deseado</label>
            <span className="label-value-badge">{formState.targetMargin}%</span>
          </div>
          <input
            id="target-margin-slider"
            type="range"
            min="5"
            max="40"
            step="1"
            className="range-slider"
            value={formState.targetMargin}
            onChange={(e) => onChangeField('targetMargin', Number(e.target.value))}
          />
        </div>

        <div className="form-group">
          <div className="form-label">
            <label htmlFor="indirect-rate-slider">Costos Indirectos</label>
            <span className="label-value-badge">{formState.indirectRate}%</span>
          </div>
          <input
            id="indirect-rate-slider"
            type="range"
            min="4"
            max="20"
            step="1"
            className="range-slider"
            value={formState.indirectRate}
            onChange={(e) => onChangeField('indirectRate', Number(e.target.value))}
          />
        </div>
      </div>
    </aside>
  );
}
