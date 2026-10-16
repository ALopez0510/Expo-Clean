# CleanQuote Pro — Expo Clean Ecuador 2026

**Sistema Dinámico de Cotización y Estructuración de Costos Unitarios según Tipología de Infraestructura**
*Área Estratégica: Gestión Inteligente de Procesos • Reto 2 • Hackathon Expo Clean Ecuador 2026*

---

## Descripción

CleanQuote Pro reemplaza la cotización con tarifa única por m² por un **modelo paramétrico** que recibe las variables del Reto 2 (metraje, tráfico peatonal, riesgo sanitario, turnos y protocolo de desinfección, más frecuencia y mecanización) y calcula:

- Puestos de trabajo por turno y personal equivalente (**FTE**, 40 h/semana)
- Horas de cobertura mensuales, incluidas las horas nocturnas (Art. 49 Código del Trabajo)
- Costo de mano de obra con beneficios de ley, recargo nocturno y supervisión
- Insumos químicos, EPP y maquinaria
- Costos indirectos, margen, precio sin IVA, IVA y precio por m²
- Comparación con referencias públicas (catálogo SERCOP y contratos IESS)

Incluye una pestaña de **Validación** (pruebas automáticas de coherencia, análisis de sensibilidad y calibración) y una pestaña de **Supuestos y fuentes**, donde cada valor indica si es *oficial*, *de contrato real*, *derivado* o *estimación del equipo*.

---

## Modelo de cálculo

1. Cobertura por auxiliar y turno = (R_base × k_maquinaria × k_protocolo) ÷ (k_riesgo × k_tráfico × k_frecuencia). Los factores son relativos a los valores por defecto de cada tipología.
2. Puestos por turno = Área ÷ Cobertura, redondeado con la regla de las fichas SERCOP (fracción < 0,50 se descarta; 0,50–0,80 = medio tiempo; > 0,80 = tiempo completo). Los servicios de varios turnos tienen al menos 1 puesto por turno.
3. FTE = Σ (puestos × horas × días/semana) ÷ 40 h (× 365/350 de reemplazo de vacaciones en servicios de 7 días).
4. Mano de obra = FTE × costo empresa + recargo nocturno 25% + supervisión (1 cada 25 auxiliares).
5. Precio = (Costos directos + indirectos) ÷ (1 − margen). El IVA del 15% se muestra aparte.

---

## Referencias públicas utilizadas (precios sin IVA)

| Tipología | CPC | Referencia | Rendimiento | Tipo | Fuente |
| :--- | :---: | :---: | :---: | :---: | :--- |
| Oficinas / edificios públicos | 853300013 | $1,58/m² | 900 m²/aux | Catálogo SERCOP | [Ficha áreas internas (2023)](https://portal.compraspublicas.gob.ec/sercop/wp-content/uploads/2023/03/3_LIMPIEZA-AREA-INTERNA.pdf) |
| Alta afluencia de usuarios (análogo para patios de comida) | 853300012 | $2,04/m² | 650 m²/aux | Catálogo SERCOP | [Ficha alta afluencia (2023)](https://portal.compraspublicas.gob.ec/sercop/wp-content/uploads/2023/03/2_ALTA-AFLUENCIA-USUARIO.pdf) |
| Instituciones educativas | 853300011 | $1,19/m² | 1.000 m²/aux | Catálogo SERCOP | [Ficha unidades educativas (2023)](https://portal.compraspublicas.gob.ec/sercop/wp-content/uploads/2023/03/1_UNIDADES-EDUCATIVAS.pdf) |
| Áreas externas (análogo para industria y bodegas) | 853300013 | $0,64/m² | 2.500 m²/aux | Catálogo SERCOP | [Ficha áreas externas (2023)](https://portal.compraspublicas.gob.ec/sercop/wp-content/uploads/2023/03/4_LIMPIEZA-AREA-EXTERNA.pdf) |
| Hospitalización general | 853300311 | $1,84 – $3,03/m² | 1.000 m²/aux (estimación) | Contratos IESS | [Primicias, 29-dic-2025](https://www.primicias.ec/sociedad/contrato-limpieza-hospital-iess-teodoro-maldonado-carbo-costo-quito-portoviejo-guayaquil-112602/): HCAM $1,84 (2025), Verdi Cevallos $2,86 (2024), Teodoro Maldonado Carbo $3,03 (2025) |
| Áreas críticas 24/7 | 853300311 | ≈ $6,18/m² | 500 m²/aux (estimación) | Derivado | [Ficha hospitalaria 8h](https://portal.compraspublicas.gob.ec/sercop/wp-content/uploads/2017/01/limpieza_hospitalaria_8_horas1.pdf): $2,06/m² por turno × 3 turnos (ficha sin fecha, aprox. 2016-2017) |

> Las fichas SERCOP son de 2023 (Convenio Marco FISP-SERCOP-002-2022). Verificar el precio vigente en el Catálogo Dinámico Inclusivo antes de usarlo en una oferta real. SERCOP no publica "bandas" de precio: maneja precios fijos por ficha.

---

## Estructura laboral 2026 (1 auxiliar, jornada diurna)

| Rubro | Valor | Fuente |
| :--- | ---: | :--- |
| SBU 2026 | $482,00 | [MDT, dic-2025](https://www.vistazo.com/2025-12-15-salario-basico-usd-482-2026-ecuador-incremento-dolares-IC10565269) |
| Aporte patronal (11,15% IESS + 0,5% SECAP + 0,5% IECE = 12,15%) | $58,56 | [IESS 2026](https://www.vistazo.com/actualidad/nacional/2025-12-17-aportes-iess-suben-2026-incremento-sueldo-basico-unificado-usd-482-ED10575274) |
| Décimo tercero (1/12) | $40,17 | Código del Trabajo |
| Décimo cuarto (1 SBU/12) | $40,17 | Código del Trabajo |
| Fondos de reserva (8,33%, desde el 2º año) | $40,15 | Ley de Seguridad Social |
| Vacaciones (15 días/año) | $20,08 | Código del Trabajo |
| Provisión desahucio | $10,03 | Estimación del equipo |
| Uniformes y calzado | $26,00 | Estimación del equipo |
| Exámenes ocupacionales y capacitación | $14,00 | Estimación del equipo |
| **Costo empresa mensual** | **$731,16** | |

- Recargo nocturno: 25% sobre las horas entre 19h00 y 06h00 ([Art. 49](https://www.eldiario.ec/ecuador/esto-deben-pagarte-por-cumplir-jornada-de-trabajo-nocturna-en-ecuador-segun-el-codigo-del-trabajo-25022026/)).
- No incluido: recargo del 100% por trabajo en fines de semana y feriados (se asumen descansos rotativos; validar con asesoría laboral).
- El margen es utilidad antes de participación de trabajadores (15%) e impuesto a la renta.

---

## Importador de pliegos con IA (Google Gemini)

El botón **"Importar pliego (IA)"** lee un pliego o términos de referencia en PDF y propone los parámetros del cotizador, cada uno con la **página y la cita** del documento. El analista revisa, corrige y aplica; luego el sistema verifica el **cumplimiento** (personal mínimo, presupuesto referencial, turnos, área y maquinaria) con reglas fijas. **La IA no calcula precios ni decide el cumplimiento.**

### Configuración

1. Crear una clave gratuita en [Google AI Studio](https://aistudio.google.com) → *Get API key*.
2. Crear el archivo `.env.local` en la raíz del proyecto (ya está excluido por `.gitignore`):
   ```
   GEMINI_API_KEY=tu_clave
   # Opcional: forzar un modelo
   # GEMINI_MODEL=gemini-3.5-flash-lite
   ```
3. Reiniciar `npm run dev` después de crear o cambiar el archivo.

### Cómo funciona

- El navegador envía el PDF al servidor local de Vite (`/api/pliego`, archivo `server/pliegoApi.js`), que lo reenvía a Gemini con la clave. La clave nunca llega al navegador.
- Se pide a Gemini una respuesta en formato JSON fijo (`src/ai/pliegoSchema.js`), que luego se valida (`src/ai/pliegoParser.js`).
- Si un modelo no está disponible o no tiene cuota, se prueba automáticamente el siguiente.
- **Modo demo:** si no hay clave, no hay internet o se alcanza el límite gratuito, se puede cargar un resultado pregrabado del pliego de ejemplo **ficticio** `public/demo/pliego_ejemplo_limpieza_hospital.pdf`.
- En el plan gratuito, Google puede usar el contenido enviado para mejorar sus servicios: usar solo pliegos públicos.

---

## Tecnologías

- **Framework:** React 19 + Vite 6
- **Iconografía:** Lucide React
- **Estilos:** CSS propio, tipografías Outfit / Plus Jakarta Sans / JetBrains Mono
- **Exportación:** impresión a PDF desde el navegador y CSV

---

## Ejecución local

```bash
npm install
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run build    # compilación de producción
```

---

## Licencia

Desarrollado para el **Hackathon Expo Clean Ecuador 2026**.
