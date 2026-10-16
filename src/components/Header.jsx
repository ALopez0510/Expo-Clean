import React, { useState, useRef, useEffect } from 'react';
import { LucideIcon } from './LucideIcon';
import { REAL_PRESETS } from '../data/parametricData.js';

export function Header({
  selectedPresetId,
  selectedPresetIndex,
  presetCases = REAL_PRESETS,
  onSelectPreset,
  onOpenDefense,
  onOpenProposal,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  // Determine current preset selection
  const presetsList = presetCases && presetCases.length > 0 ? presetCases : REAL_PRESETS;
  
  let activePreset = null;
  let isCustom = false;

  if (selectedPresetId !== undefined) {
    if (selectedPresetId === 'custom') {
      isCustom = true;
    } else {
      activePreset = presetsList.find((p) => p.id === selectedPresetId) || null;
    }
  } else if (selectedPresetIndex !== undefined && presetsList[selectedPresetIndex]) {
    activePreset = presetsList[selectedPresetIndex];
  } else {
    activePreset = presetsList[0];
  }

  const handleSelect = (preset, idx) => {
    if (selectedPresetIndex !== undefined && selectedPresetId === undefined) {
      onSelectPreset?.(idx);
    } else {
      onSelectPreset?.(preset ? preset.id : 'custom');
    }
    setIsDropdownOpen(false);
  };

  const currentDisplayName = isCustom 
    ? 'Parámetros Personalizados' 
    : (activePreset ? activePreset.name : 'Seleccionar Caso');

  return (
    <header className="top-header" id="app-top-header">
      <div className="header-content">
        {/* Brand & Modern Isotype */}
        <div className="brand-wrapper">
          <div className="brand-logo-icon" title="CleanQuote Pro • Facility Management Intelligent Suite">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3.5 19.5L12 3.5L20.5 19.5H3.5Z"
                fill="white"
                fillOpacity="0.15"
                stroke="white"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d="M12 8.5V15M12 15L14.5 12.5M12 15L9.5 12.5"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="18.5" r="1.1" fill="white" />
            </svg>
          </div>

          <div className="brand-titles">
            <div className="brand-header-row">
              <h1 className="brand-title">CleanQuote Pro</h1>
              <span className="brand-badge">
                <LucideIcon name="Sparkles" size={11} />
                EXPO CLEAN 2026
              </span>
            </div>

            <div className="brand-subtitle-row">
              <p className="brand-subtitle">
                Sistema Dinámico de Cotización y Estructuración de Costos Unitarios
              </p>

              {/* Informative Tooltip for SERCOP Legal Compliance */}
              <div className="legal-tooltip-container" tabIndex={0} aria-label="Información de homologación SERCOP">
                <span className="legal-pill-trigger">
                  <LucideIcon name="ShieldCheck" size={12} color="#059669" />
                  <span>SERCOP CPC 85330</span>
                  <LucideIcon name="Info" size={11} color="#64748b" />
                </span>

                <div className="legal-tooltip-popover" role="tooltip">
                  <div className="legal-tooltip-title">
                    <LucideIcon name="ShieldCheck" size={14} color="#059669" />
                    <span>Homologación Oficial SERCOP & MDT</span>
                  </div>
                  <p className="legal-tooltip-text">
                    Fórmulas paramétricas, matrices de rendimiento y bandas de costo unitario calibradas estrictamente con el <strong>CPC 85330</strong> (Compras Públicas Ecuador) y la <strong>Comisión Sectorial No. 19</strong> del Ministerio del Trabajo.
                  </p>
                  <div className="legal-tooltip-footer">
                    <span>✓ Salarios de ley IESS garantizados ($721.09/mes)</span>
                    <span>✓ Bandas referenciales públicas y privadas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="header-actions">
          {/* Custom Pill Dropdown for Presets */}
          <div className="preset-pill-dropdown" ref={dropdownRef}>
            <button
              type="button"
              id="preset-select-btn"
              className={`preset-pill-trigger ${isDropdownOpen ? 'active' : ''}`}
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              title="Cargar casos reales del sector de Facility Management y SERCOP"
            >
              <div className="preset-pill-icon-box">
                <LucideIcon name="FolderKanban" size={15} />
              </div>

              <div className="preset-pill-text-group">
                <span className="preset-pill-label">Caso Real:</span>
                <span className="preset-pill-value">{currentDisplayName}</span>
              </div>

              <LucideIcon
                name="ChevronDown"
                size={14}
                className={`preset-pill-chevron ${isDropdownOpen ? 'open' : ''}`}
              />
            </button>

            {/* Floating Dropdown Menu */}
            {isDropdownOpen && (
              <div className="preset-menu-popover" role="listbox">
                <div className="preset-menu-header">
                  <span className="preset-menu-title">Casos Reales Preconfigurados</span>
                  <span className="preset-menu-badge">SERCOP & Privado</span>
                </div>

                <div className="preset-menu-list">
                  {/* Custom Option */}
                  <button
                    type="button"
                    className={`preset-menu-item ${isCustom ? 'selected' : ''}`}
                    onClick={() => handleSelect(null, 'custom')}
                    role="option"
                    aria-selected={isCustom}
                  >
                    <div className="preset-item-info">
                      <span className="preset-item-name">-- Parámetros Personalizados --</span>
                      <span className="preset-item-sub">Ajuste libre de variables en el panel lateral</span>
                    </div>
                    {isCustom && <LucideIcon name="Check" size={15} className="preset-item-check" />}
                  </button>

                  {/* Preset Items */}
                  {presetsList.map((preset, idx) => {
                    const isSelected = !isCustom && activePreset?.id === preset.id;
                    return (
                      <button
                        key={preset.id || idx}
                        type="button"
                        className={`preset-menu-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelect(preset, idx)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="preset-item-info">
                          <span className="preset-item-name">{preset.name}</span>
                          <span className="preset-item-sub">{preset.subtitle}</span>
                        </div>
                        {isSelected && <LucideIcon name="Check" size={15} className="preset-item-check" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Button 1: Ficha Técnica (Secondary Ghost/Outline) */}
          <button
            id="btn-defense-modal"
            className="btn-header-secondary"
            onClick={onOpenDefense}
            title="Ver sustentación técnica y respuestas oficiales para el Comité Evaluador"
          >
            <LucideIcon name="FileText" size={15} />
            <span>Ficha Técnica</span>
          </button>

          {/* Action Button 2: Generar Oferta PDF (Primary Hero CTA) */}
          <button
            id="btn-open-proposal-modal"
            className="btn-header-primary"
            onClick={onOpenProposal}
            title="Generar oferta formal técnico-financiera lista para cliente, SERCOP o jurado"
          >
            <LucideIcon name="Sparkles" size={15} />
            <span>Generar Oferta PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
}
