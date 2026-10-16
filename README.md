# CleanQuote Pro — Expo Clean Ecuador 2026

**Sistema Dinámico de Cotización y Estructuración de Costos Unitarios según Tipología de Infraestructura**  
*Área Estratégica: Gestión Inteligente de Procesos • Hackathon Expo Clean Ecuador 2026*

---

## 🌟 Descripción General

**CleanQuote Pro** es una plataforma tecnológica de Facility Management diseñada para reemplazar la tradicional estimación empírica y la tarifa plana por metro cuadrado (incurriendo en sobrecostos o pérdidas operativas severas) mediante un **motor algorítmico paramétrico multidimensional**.

El sistema calcula de manera exacta:
- Personal operativo requerido (**FTE - Full Time Equivalent**)
- Horas hombre mensuales efectivas
- Costo de insumos químicos certificados y frecuencias de desinfección
- Equipos de Protección Personal (**EPP**) y bioseguridad ocupacional
- Amortización de maquinaria industrial y costos indirectos
- Margen bruto garantizado y precio final de venta por $m^2$

---

## 🏛️ Calibración Oficial con SERCOP y MDT (Ecuador)

Todas las fórmulas y matrices de rendimiento del sistema están estrictamente calibradas con datos del **Servicio Nacional de Contratación Pública (SERCOP)** bajo el **CPC 85330** (*Servicios de limpieza general de edificios e inmuebles y servicios de limpieza hospitalaria*) y la **Comisión Sectorial No. 19 del Ministerio del Trabajo (MDT)** de Ecuador:

| Sector / Tipología | Código CPC SERCOP | Banda Referencial SERCOP ($/m² mes) | Tarifa Privada (FEDELIMP) | Contrato / Pliego Oficial de Referencia |
| :--- | :---: | :---: | :---: | :--- |
| **Salud Crítica (Quirófanos / UCI 24/7)** | `85330.01.1` | **$4.50 — $5.25** | $4.50 — $5.50 | Ficha Técnica Base SERCOP 24h / MSP Ecuador |
| **Hospitales Generales (IESS / MSP)** | `85330.01.2` | **$1.84 — $3.21** | $2.50 — $3.40 | Contratos Reales: Hospital Teodoro Maldonado Carbo ($3,12), Verdi Cevallos ($2,86), HCAM ($1,84) |
| **Retail & Patios de Comida** | `85330.02.1` | **$2.04 — $2.85** | $2.10 — $2.90 | Pliegos FISP-SERCOP Áreas de Alto Tráfico y Terminales |
| **Oficinas Administrativas & Edificios Públicos** | `85330.00.1` | **$0.91 — $1.21** | $1.15 — $1.45 | Ficha Técnica Catálogo Dinámico Inclusivo (CDI FISP-SERCOP) |
| **Industria Pesada & Bodegas Logísticas** | `85330.03.1` | **$0.65 — $0.92** | $0.70 — $0.95 | Pliegos CELEC EP / EP Petroecuador Naves Industriales |
| **Educación & Universidades Públicas** | `85330.00.2` | **$0.85 — $1.18** | $0.95 — $1.25 | Licitaciones UCE, EPN, UNACH Campus Universitarios |

### Estructura Laboral de Ley (MDT Comisión No. 19)
- **SBU Base (2026):** $475.00 USD
- **Aporte Patronal IESS (12.15%):** $57.71 USD
- **Décimo Tercero (8.33%):** $39.58 USD
- **Décimo Cuarto mensualizado:** $39.58 USD
- **Fondos de Reserva IESS (8.33%):** $39.58 USD
- **Vacaciones (4.16%) & Desahucio (2.08%):** $29.67 USD
- **Uniformes y EPP reglamentario:** $26.00 USD
- **Seguro y medicina ocupacional:** $14.00 USD
- **Costo Empresa Total Diurno (1 FTE):** **$721.09 USD / mes**
- **Costo Empresa Nocturno (+25% Art. 49 Código del Trabajo):** **$839.87 USD / mes**

---

## ⚙️ Tecnologías Utilizadas

- **Frontend:** SPA Vanilla JavaScript en `index.html`
- **Estilos:** Tailwind CSS vía CDN y CSS inline del runtime existente
- **Visualización:** Chart.js vía CDN, con fallback textual cuando no carga
- **Backend:** Node.js + Express
- **Persistencia:** PostgreSQL mediante `pg`, accesible al servidor por Tailscale
- **Autenticación:** `express-session` + `bcrypt`; el navegador nunca recibe credenciales de base de datos

---

## 🚀 Instalación y Ejecución Local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/ALopez0510/Expo-Clean.git
   cd Expo-Clean
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Iniciar el servidor completo (SPA + API en `127.0.0.1:8000`):
   ```bash
   npm start
   ```

4. Abrir en el navegador:
   ```bash
   http://127.0.0.1:8000/
   ```

La contraseña de PostgreSQL solo se proporciona mediante `DB_PASSWORD` en un `.env` local basado en `.env.example`. La migración SQL está en `server/migrations/001_add_password_hash.sql` y las cuentas existentes se consultan directamente desde PostgreSQL; no existe un paso de seed en el runtime.

---

## 📄 Licencia

Desarrollado para el **Hackathon Expo Clean Ecuador 2026**.
