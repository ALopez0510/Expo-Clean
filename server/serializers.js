function snakeToCamel(value) {
  if (typeof value !== "string" || !value.includes("_")) return value;
  return value.replace(/_([a-zA-Z0-9])/g, (_match, character) => character.toUpperCase());
}

function toJsonable(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return Number(value);
  if (Buffer.isBuffer(value)) return value.toString("base64");
  if (Array.isArray(value)) return value.map(toJsonable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [snakeToCamel(key), toJsonable(item)]));
  }
  return value;
}

export function serializeRow(row) {
  return toJsonable(row || {});
}
