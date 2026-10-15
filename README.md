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

Todas las fórmulas y matrices de rendimiento del sistema están estrictamente calibradas con datos del **Servicio Nacional de Contratación Pública (SERCOP)** bajo el **CPC 85330** (*Servicios de limpieza general de edificios e inmuebles y servicios de limpieza hospitalaria*) y la normativa laboral del **Ministerio del Trabajo (MDT)** de Ecuador (SBU 2026 = $482). Las cifras de contratos son referenciales: verificar el código de proceso en compraspublicas.gob.ec antes de citarlas:

| Sector / Tipología | Código CPC SERCOP | Banda Referencial SERCOP ($/m² mes) | Tarifa Privada (FEDELIMP) | Contrato / Pliego Oficial de Referencia |
| :--- | :---: | :---: | :---: | :--- |
| **Salud Crítica (Quirófanos / UCI 24/7)** | `85330.01.1` | **$4.50 — $5.25** | $4.50 — $5.50 | Ficha Técnica Base SERCOP 24h / MSP Ecuador |
| **Hospitales Generales (IESS / MSP)** | `85330.01.2` | **$1.84 — $3.21** | $2.50 — $3.40 | Contratos de referencia (verificar código de proceso): Hospital Teodoro Maldonado Carbo ($3,12), Verdi Cevallos ($2,86), HCAM ($1,84) |
| **Retail & Patios de Comida** | `85330.02.1` | **$2.04 — $2.85** | $2.10 — $2.90 | Pliegos FISP-SERCOP Áreas de Alto Tráfico y Terminales |
| **Oficinas Administrativas & Edificios Públicos** | `85330.00.1` | **$0.91 — $1.21** | $1.15 — $1.45 | Ficha Técnica Catálogo Dinámico Inclusivo (CDI FISP-SERCOP) |
| **Industria Pesada & Bodegas Logísticas** | `85330.03.1` | **$0.65 — $0.92** | $0.70 — $0.95 | Pliegos CELEC EP / EP Petroecuador Naves Industriales |
| **Educación & Universidades Públicas** | `85330.00.2` | **$0.85 — $1.18** | $0.95 — $1.25 | Licitaciones UCE, EPN, UNACH Campus Universitarios |

### Estructura Laboral de Ley (SBU 2026 y normativa MDT)
- **SBU Base (2026):** $482.00 USD
- **Aporte Patronal IESS (12.15%):** $58.56 USD
- **Décimo Tercero (8.33%):** $40.17 USD
- **Décimo Cuarto mensualizado:** $40.17 USD
- **Fondos de Reserva IESS (8.33%):** $40.15 USD
- **Vacaciones (4.16%) & Desahucio (2.08%):** $30.08 USD
- **Uniformes y EPP reglamentario:** $26.00 USD
- **Seguro y medicina ocupacional:** $14.00 USD
- **Costo Empresa Total Diurno (1 FTE):** **$731.12 USD / mes**
- **Costo Empresa Nocturno (+25% Art. 49 Código del Trabajo):** **$851.62 USD / mes**

---

## ⚙️ Tecnologías Utilizadas

- **Framework:** React 19 + Vite 6
- **Iconografía:** Lucide React (vectorial)
- **Estilos:** Vanilla CSS con paleta Apple Light Theme y tipografía San Francisco
- **Exportación:** Generación interactiva de propuestas ejecutivas en PDF y exportación directa a formato CSV

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

3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Compilar para producción:
   ```bash
   npm run build
   ```

---

## 📄 Licencia

Desarrollado para el **Hackathon Expo Clean Ecuador 2026**.

## Interfaz y panel de validación (actualización)

- **Regla de precio:** el precio por m² se muestra sobre una regla con la banda SERCOP, el mercado privado y el promedio. Los detalles (código CPC, fuente, rendimiento normativo, base salarial) están en "Referencia SERCOP en detalle".
- **Pestañas:** Desglose del precio · Frente a tarifa plana · Validación · Cumplimiento.
- **Validación:** 9 pruebas de coherencia en vivo, sensibilidad (qué supuesto mueve más el precio), contraste de los casos de referencia contra la banda y matriz por sector.
- **Límite honesto:** el contraste con la banda SERCOP no es una validación independiente (los coeficientes se calibraron con esas mismas bandas). El factor de protocolo (2 % por minuto de contacto sobre 2 min) es un supuesto a validar con una empresa del sector.
- Tipografías autoalojadas (`@fontsource-variable`): tras actualizar ejecuta `npm install`.
- Respaldo del estado previo al rediseño: `_backup_fase1/`. Original: `_backup_original/`.
