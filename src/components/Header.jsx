import React from 'react';
import { LucideIcon } from './LucideIcon';
import { REAL_PRESETS } from '../data/parametricData.js';

export function Header({
  selectedPresetId,
  onSelectPreset,
  onOpenProposal,
  onOpenDefense
}) {
  return (
    <header className="top-header" id="app-top-header">
      <div className="header-content">
        <div className="brand-wrapper">
          <div className="brand-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="brand-titles">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ margin: 0 }}>CleanQuote Pro</h1>
              <span className="hackathon-badge">EXPO CLEAN ECUADOR • FACILITY SUITE</span>
            </div>
            <p>Sistema Dinámico de Cotización y Costos Unitarios según Tipología de Infraestructura (SERCOP CPC 85330)</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Preset Selector */}
          <div className="preset-selector-box" title="Cargar casos reales del sector de Facility Management y SERCOP">
            <label htmlFor="preset-select" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <LucideIcon name="FolderOpen" size={14} />
              <span>Caso Real:</span>
            </label>
            <select
              id="preset-select"
              className="preset-dropdown"
              value={selectedPresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
            >
              <option value="custom">-- Parámetros Personalizados --</option>
              {REAL_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-defense-modal"
            className="btn-secondary"
            onClick={onOpenDefense}
            title="Ver sustentación técnica y respuestas oficiales para el Comité Evaluador"
          >
            <LucideIcon name="Award" size={14} />
            <span>Ficha Técnica</span>
          </button>

          <button
            id="btn-open-proposal-modal"
            className="btn-primary"
            onClick={onOpenProposal}
            title="Generar oferta formal técnico-financiera lista para cliente, SERCOP o jurado"
          >
            <LucideIcon name="FileCheck" size={14} />
            <span>Generar Oferta PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
}
