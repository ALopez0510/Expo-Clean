/**
 * Cliente del importador de pliegos: envía el PDF al servidor local y valida la respuesta de la IA.
 * La IA solo PROPONE valores; aquí se verifican rangos y opciones válidas antes de mostrarlos.
 */
import { ENUMS, REVIEW_FIELDS, REQUIREMENT_FIELDS } from './pliegoSchema.js';
import { DEMO_PLIEGO_RESULT, DEMO_FILE_NAME } from './demoPliegoResult.js';
import { INFRASTRUCTURE_TYPES } from '../data/parametricData.js';

export async function getAiStatus() {
  try {
    const r = await fetch('/api/pliego/status');
    if (!r.ok) return { configured: false, available: false };
    return { ...(await r.json()), available: true };
  } catch {
    return { configured: false, available: false };
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

export async function analyzePliego(file) {
  if (!file) throw new Error('Selecciona un archivo PDF.');
  if (file.type && file.type !== 'application/pdf') throw new Error('El archivo debe ser un PDF.');
  if (file.size > 20 * 1024 * 1024) throw new Error('El PDF supera 20 MB. Sube solo las secciones relevantes (TDR, especificaciones y presupuesto).');

  const pdfBase64 = await fileToBase64(file);
  let resp;
  try {
    resp = await fetch('/api/pliego', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfBase64, fileName: file.name })
    });
  } catch {
    const e = new Error('No se pudo conectar con el servidor local. ¿Está corriendo "npm run dev"?');
    e.code = 'NETWORK';
    throw e;
  }
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const e = new Error(data.error || `Error ${resp.status}`);
    e.code = data.code;
    throw e;
  }
  return data; // { extraction, meta }
}

export function getDemoResult() {
  return { extraction: DEMO_PLIEGO_RESULT, meta: { provider: 'demo', model: 'resultado pregrabado', fileName: DEMO_FILE_NAME } };
}

// ── Validación y normalización ─────────────────────────────────────────────
const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.,-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const ev = (raw, key) => {
  const f = raw?.[key];
  if (f && typeof f === 'object' && 'valor' in f) return f;
  return { valor: f ?? null, pagina: null, cita: null };
};

const RULES = {
  area_total_m2: (v) => (num(v) !== null && num(v) >= 10 && num(v) <= 2000000 ? Math.round(num(v)) : null),
  frecuencia_diaria: (v) => (num(v) !== null ? Math.min(6, Math.max(1, Math.round(num(v)))) : null),
  riesgo_sanitario: (v) => (num(v) !== null ? Math.min(5, Math.max(1, Math.round(num(v)))) : null),
  personal_minimo_auxiliares: (v) => (num(v) !== null && num(v) >= 0 && num(v) < 5000 ? num(v) : null),
  supervisores_minimos: (v) => (num(v) !== null && num(v) >= 0 && num(v) < 500 ? num(v) : null),
  presupuesto_referencial_total: (v) => (num(v) !== null && num(v) > 0 ? num(v) : null),
  plazo_meses: (v) => (num(v) !== null && num(v) > 0 && num(v) <= 120 ? num(v) : null),
  presupuesto_incluye_iva: (v) => (typeof v === 'boolean' ? v : null)
};

export function normalizeExtraction(raw) {
  const warnings = Array.isArray(raw?.advertencias) ? raw.advertencias.filter((x) => typeof x === 'string') : [];

  const reviewFields = REVIEW_FIELDS.map((f) => {
    const e = ev(raw, f.key);
    let value = e.valor;
    let valid = true;
    if (f.kind === 'enum') {
      valid = ENUMS[f.options].includes(value);
      if (!valid && value !== null) warnings.push(`Valor no reconocido para "${f.label}": ${value}. Se mantiene el valor actual.`);
      if (!valid) value = null;
    } else if (RULES[f.key]) {
      const clean = RULES[f.key](value);
      if (clean === null && value !== null) warnings.push(`Valor fuera de rango para "${f.label}": ${value}. Se mantiene el valor actual.`);
      value = clean;
    }
    return { ...f, value, page: e.pagina ?? null, quote: e.cita ?? null, found: value !== null, apply: value !== null };
  });

  const requirements = {};
  const requirementFields = REQUIREMENT_FIELDS.map((f) => {
    const e = ev(raw, f.key);
    const value = RULES[f.key] ? RULES[f.key](e.valor) : typeof e.valor === 'string' && e.valor.trim() ? e.valor.trim() : null;
    requirements[f.key] = value;
    return { ...f, value, page: e.pagina ?? null, quote: e.cita ?? null, found: value !== null };
  });

  const zonas = (Array.isArray(raw?.zonas) ? raw.zonas : [])
    .filter((z) => z && z.nombre)
    .map((z) => ({ nombre: String(z.nombre), area_m2: num(z.area_m2), tipologia: ENUMS.tipologia.includes(z.tipologia) ? z.tipologia : null, pagina: z.pagina ?? null }));
  const multas = (Array.isArray(raw?.multas) ? raw.multas : []).filter((m) => m && m.descripcion).map((m) => ({ descripcion: String(m.descripcion), pagina: m.pagina ?? null }));

  // Coherencia: suma de zonas vs área total
  const area = reviewFields.find((f) => f.key === 'area_total_m2')?.value;
  const zonesSum = zonas.reduce((a, z) => a + (z.area_m2 || 0), 0);
  if (area && zonesSum > 0 && Math.abs(zonesSum - area) / area > 0.05) {
    warnings.push(`La suma de las zonas (${zonesSum.toLocaleString('es-EC')} m²) no coincide con el área total (${area.toLocaleString('es-EC')} m²).`);
  }
  const distinctTypes = new Set(zonas.map((z) => z.tipologia).filter(Boolean));
  if (distinctTypes.size > 1 && !warnings.some((w) => w.toLowerCase().includes('zonas'))) {
    warnings.push(`El pliego tiene zonas de ${distinctTypes.size} tipologías distintas; el cotizador usa una sola (la predominante).`);
  }

  // Presupuesto mensual (cálculo determinístico, no de la IA)
  const total = requirements.presupuesto_referencial_total;
  const months = requirements.plazo_meses;
  requirements.presupuesto_mensual = total && months ? total / months : null;

  return {
    isCleaningTender: raw?.es_pliego_de_limpieza !== false,
    entidad: raw?.entidad || null,
    objeto: raw?.objeto || null,
    codigo: raw?.codigo_proceso || null,
    reviewFields,
    requirementFields,
    requirements,
    zonas,
    multas,
    warnings
  };
}

/** Convierte los campos aprobados por el analista en cambios del formulario. */
export function buildFormPatch(reviewFields) {
  const patch = {};
  for (const f of reviewFields) if (f.apply && f.value !== null) patch[f.formKey] = f.value;
  return patch;
}

export const typologyName = (id) => INFRASTRUCTURE_TYPES[id]?.name || id;
