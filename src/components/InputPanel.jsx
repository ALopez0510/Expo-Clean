import React from 'react';
import {
  INFRASTRUCTURE_TYPES,
  TRAFFIC_LEVELS,
  SANITARY_RISK_LEVELS,
  DISINFECTION_PROTOCOLS,
  SHIFT_REGIMES,
  MACHINERY_OPTIONS,
  ECUADOR_LABOR_CONFIG
} from '../data/parametricData';

const hintStyle = { fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' };

export function InputPanel({ formState, onChangeField, onTypologySelect, aiFields = [], aiSource = null }) {
  const infra = INFRASTRUCTURE_TYPES[formState.infrastructureTypeId];
  const protocol = DISINFECTION_PROTOCOLS[formState.disinfectionProtocolId];

  return (
    <aside className="glass-card input-section" id="parameters-input-panel">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon-badge">⚙️</div>
          <h2>Variables Paramétricas</h2>
        </div>
        <span className="hackathon-badge">Entrada Dinámica</span>
      </div>

      {aiFields && aiFields.length > 0 && (
        <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', color: '#3730a3', padding: '0.55rem 0.7rem', borderRadius: '8px', fontSize: '0.75rem', lineHeight: 1.5 }}>
          <strong>✦ {aiFields.length} parámetros completados desde el pliego</strong>
          {aiSource?.provider === 'demo' ? ' (modo demo)' : aiSource?.model ? ` (Gemini ${aiSource.model})` : ''} y revisados por el analista. Puede ajustarlos libremente.
        </div>
      )}

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
          placeholder="Ej. Clínica - Pabellón Quirúrgico"
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Tipología de Infraestructura
          <span className="label-value-badge">{infra?.category}</span>
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
        <p style={hintStyle}>
          Rendimiento base: <strong>{infra?.baseYieldM2PerPost.toLocaleString('es-EC')} m² por auxiliar/turno</strong> — {infra?.yieldNote}
        </p>
      </div>

      {/* 2. Metraje */}
      <div className="form-group">
        <div className="form-label">
          <label htmlFor="area-number-input">Área a Cubrir (Metraje Total)</label>
          <span className="label-value-badge" id="area-display-badge">
            {Number(formState.areaM2).toLocaleString('es-EC')} m²
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
            value={Math.min(12000, formState.areaM2)}
            onChange={(e) => onChangeField('areaM2', Number(e.target.value))}
          />
          <input
            id="area-number-input"
            type="number"
            min="50"
            max="200000"
            className="text-input"
            value={formState.areaM2}
            onChange={(e) => onChangeField('areaM2', Math.max(50, Number(e.target.value)))}
          />
        </div>
      </div>

      {/* 3. Riesgo sanitario */}
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
        <p style={hintStyle}>{SANITARY_RISK_LEVELS[formState.sanitaryRiskLevelNumber]?.description}</p>
      </div>

      {/* 4. Tráfico */}
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

      {/* 5. Turnos */}
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
        <p style={hintStyle}>{SHIFT_REGIMES[formState.shiftRegimeId]?.description}</p>
      </div>

      {/* 6. Protocolo y frecuencia */}
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
        <div style={{ background: '#f8fafc', border: '1px solid var(--border-subtle)', padding: '0.5rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', color: '#334155', lineHeight: 1.5 }}>
          <strong>Producto:</strong> {protocol?.chemicalProduct}
          <br />
          <strong>Referencia normativa:</strong> {protocol?.normative}
          <br />
          <strong>Tiempo de contacto:</strong> {protocol?.contactTimeMinutes} min (reduce el rendimiento ×{protocol?.yieldFactor.toFixed(2)})
        </div>
      </div>

      <div className="form-group">
        <div className="form-label">
          <label htmlFor="frequency-input">Frecuencia de desinfección (pasadas/día)</label>
          <span className="label-value-badge">{formState.dailyFrequency} / día</span>
        </div>
        <input
          id="frequency-input"
          type="range"
          min="1"
          max="6"
          step="1"
          className="range-slider"
          value={formState.dailyFrequency}
          onChange={(e) => onChangeField('dailyFrequency', Number(e.target.value))}
        />
        <p style={hintStyle}>
          Por defecto para esta tipología: {infra?.defaultFrequency}. Cada pasada adicional suma ~20% de carga de trabajo (estimación del equipo).
        </p>
      </div>

      {/* 7. Mecanización */}
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
              {m.label} (×{m.yieldMultiplier.toFixed(2)} rendimiento)
            </option>
          ))}
        </select>
      </div>

      {/* 8. Parámetros financieros */}
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
            <label htmlFor="indirect-rate-slider">Gastos Indirectos</label>
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

      {/* 9. Parámetros legales editables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="sbu-input">
            SBU vigente (USD)
          </label>
          <input
            id="sbu-input"
            type="number"
            min="300"
            max="2000"
            step="1"
            className="text-input"
            value={formState.sbu}
            onChange={(e) => onChangeField('sbu', Math.max(300, Number(e.target.value)))}
          />
        </div>
        <label className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#334155', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formState.includeFondoReserva}
            onChange={(e) => onChangeField('includeFondoReserva', e.target.checked)}
          />
          Incluir fondos de reserva (contrato &gt; 1 año)
        </label>
      </div>
      <p style={hintStyle}>
        SBU 2026 oficial: USD {ECUADOR_LABOR_CONFIG.sbuBase.toFixed(2)}. Editable para actualizar el modelo cada año sin cambiar código.
      </p>
    </aside>
  );
}
