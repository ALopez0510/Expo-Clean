import React from 'react';
import { LucideIcon } from './LucideIcon';
import { REAL_PRESETS } from '../data/parametricData.js';

export function Header({ selectedPresetId, onSelectPreset, onOpenProposal, onOpenDefense }) {
  return (
    <header className="topbar" id="app-top-header">
      <div className="topbar-inner">
        <div className="brand">
          <h1 className="brand-name">CleanQuote</h1>
          <span className="brand-tag">Expo Clean Ecuador 2026</span>
        </div>

        <div className="case-picker">
          <label htmlFor="preset-select">Caso de referencia</label>
          <select
            id="preset-select"
            className="select-input"
            value={selectedPresetId}
            onChange={(e) => onSelectPreset(e.target.value)}
          >
            <option value="custom">Parámetros propios</option>
            {REAL_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <button id="btn-defense-modal" className="btn" onClick={onOpenDefense}>
          <LucideIcon name="Award" />
          <span>Ficha técnica</span>
        </button>

        <button id="btn-open-proposal-modal" className="btn btn-primary" onClick={onOpenProposal}>
          <LucideIcon name="FileCheck" />
          <span>Generar oferta</span>
        </button>
      </div>
    </header>
  );
}
