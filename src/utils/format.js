const usd = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export const formatUSD = (value) => usd.format(value);

/** Entero con separador de miles: 12.480 */
export const formatInt = (value) =>
  new Intl.NumberFormat('es-EC', { maximumFractionDigits: 0 }).format(value);

/** Un decimal: 4,5 */
export const formatOne = (value) =>
  new Intl.NumberFormat('es-EC', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);

export const formatPct = (value, digits = 1) =>
  `${new Intl.NumberFormat('es-EC', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)} %`;

export const formatSigned = (value, digits = 0) => {
  const n = new Intl.NumberFormat('es-EC', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(value));
  if (Math.abs(value) < 0.5 * Math.pow(10, -digits)) return `${n} %`;
  return `${value > 0 ? '+' : '−'}${n} %`;
};

/** Decimal con la coma del formato es-EC: 0,490 */
export const formatDec = (value, digits = 2) =>
  new Intl.NumberFormat('es-EC', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
