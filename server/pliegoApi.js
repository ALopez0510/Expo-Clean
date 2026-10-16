/**
 * SERVIDOR LOCAL DE IA — CleanQuote Pro
 *
 * Plugin de Vite que agrega dos rutas al servidor local (npm run dev / npm run preview):
 *   GET  /api/pliego/status  → indica si hay clave configurada (nunca devuelve la clave)
 *   POST /api/pliego         → recibe un PDF en base64, lo envía a Gemini y devuelve los datos extraídos
 *
 * La clave se lee de .env.local (GEMINI_API_KEY). Ese archivo está en .gitignore (*.local).
 * No usa librerías externas: llama a la API REST de Gemini con fetch (Node 18+).
 */
import { RESPONSE_SCHEMA, buildPrompt } from '../src/ai/pliegoSchema.js';

const GEMINI_URL = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
const DEFAULT_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];
const MAX_BODY_BYTES = 30 * 1024 * 1024; // ~20 MB de PDF en base64
const TIMEOUT_MS = 120000;

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('El PDF supera el tamaño máximo permitido (≈20 MB).'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Solicitud inválida.'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function friendlyError(status, apiMessage = '') {
  const m = apiMessage.toLowerCase();
  if (status === 400 && (m.includes('api key') || m.includes('api_key'))) return 'La clave de Gemini no es válida. Revisa GEMINI_API_KEY en .env.local.';
  if (status === 400) return `Gemini rechazó la solicitud: ${apiMessage}`;
  if (status === 403) return 'La clave no tiene permiso para usar este modelo o la API no está habilitada en el proyecto.';
  if (status === 404) return 'El modelo indicado no está disponible.';
  if (status === 429) return 'Se alcanzó el límite gratuito de Gemini. Espera un momento o usa el modo demo.';
  if (status >= 500) return 'El servicio de Gemini no está disponible en este momento.';
  return `Error de Gemini (${status}).`;
}

async function callGemini({ apiKey, model, pdfBase64 }) {
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ inlineData: { mimeType: 'application/pdf', data: pdfBase64 } }, { text: buildPrompt() }]
      }
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA
    }
  };

  const resp = await fetch(GEMINI_URL(model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const err = new Error(friendlyError(resp.status, data?.error?.message || ''));
    err.status = resp.status;
    throw err;
  }

  const candidate = data?.candidates?.[0];
  const text = (candidate?.content?.parts || [])
    .filter((p) => typeof p.text === 'string' && !p.thought)
    .map((p) => p.text)
    .join('')
    .trim();
  if (!text) {
    const err = new Error(`Gemini no devolvió contenido (motivo: ${candidate?.finishReason || 'desconocido'}).`);
    err.status = 502;
    throw err;
  }
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  try {
    return { extraction: JSON.parse(cleaned), usage: data?.usageMetadata || null };
  } catch {
    const err = new Error('La respuesta de Gemini no tiene un formato JSON válido.');
    err.status = 502;
    throw err;
  }
}

export function pliegoApiPlugin(env = {}) {
  const apiKey = (env.GEMINI_API_KEY || '').trim();
  const models = [...new Set([env.GEMINI_MODEL?.trim(), ...DEFAULT_MODELS].filter(Boolean))];

  const handler = async (req, res, next) => {
    const url = (req.url || '').split('?')[0];

    if (url === '/api/pliego/status' && req.method === 'GET') {
      return send(res, 200, { provider: 'gemini', configured: Boolean(apiKey), models });
    }

    if (url !== '/api/pliego' || req.method !== 'POST') return next();

    if (!apiKey) {
      return send(res, 503, { error: 'No hay clave de Gemini configurada (GEMINI_API_KEY en .env.local). Puedes usar el modo demo.', code: 'NO_KEY' });
    }

    try {
      const { pdfBase64, fileName } = await readJsonBody(req);
      if (!pdfBase64 || typeof pdfBase64 !== 'string') return send(res, 400, { error: 'No se recibió el PDF.' });

      let lastError;
      for (const model of models) {
        try {
          const started = Date.now();
          const { extraction, usage } = await callGemini({ apiKey, model, pdfBase64 });
          return send(res, 200, { extraction, meta: { provider: 'gemini', model, fileName, ms: Date.now() - started, usage } });
        } catch (e) {
          lastError = e;
          // Probar el siguiente modelo solo si el error es del modelo (no existe, sin cuota o caída temporal)
          if (![404, 429, 500, 502, 503].includes(e.status) && e.name !== 'TimeoutError') break;
        }
      }
      const status = lastError?.status || 500;
      return send(res, status, {
        error: lastError?.name === 'TimeoutError' ? 'Gemini tardó demasiado en responder. Intenta de nuevo o usa el modo demo.' : lastError?.message || 'Error desconocido.',
        code: status === 429 ? 'QUOTA' : 'API_ERROR'
      });
    } catch (e) {
      return send(res, e.status || 500, { error: e.message || 'Error interno del servidor local.', code: 'SERVER_ERROR' });
    }
  };

  return {
    name: 'cleanquote-pliego-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}
