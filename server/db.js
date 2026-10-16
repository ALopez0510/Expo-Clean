import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";
import { ApiError, DatabasePasswordNotConfigured, DatabaseUnavailable } from "./errors.js";

const { Pool } = pg;
const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SERVER_DIR, "..");

dotenv.config({ path: path.join(PROJECT_ROOT, ".env") });

export const DB_CONFIG = {
  host: process.env.DB_HOST || "desktop-o7rhpvg.taila61603.ts.net",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "al_bd",
  user: process.env.DB_USER || "al_app",
  password: process.env.DB_PASSWORD || undefined,
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 1500),
};

export const pool = new Pool(DB_CONFIG);

export function assertDatabasePasswordConfigured() {
  if (typeof DB_CONFIG.password !== "string" || DB_CONFIG.password.trim() === "") {
    throw new DatabasePasswordNotConfigured();
  }
}

function sanitizeDatabaseError(error) {
  if (error instanceof ApiError) return error;
  return new DatabaseUnavailable();
}

export async function query(text, values = []) {
  assertDatabasePasswordConfigured();
  try {
    return await pool.query(text, values);
  } catch (error) {
    throw sanitizeDatabaseError(error);
  }
}

export async function withTransaction(work) {
  assertDatabasePasswordConfigured();
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    if (client) {
      try { await client.query("ROLLBACK"); } catch (_rollbackError) { /* ignore rollback failure */ }
    }
    throw sanitizeDatabaseError(error);
  } finally {
    client?.release();
  }
}

export async function databaseIdentity() {
  const result = await query("SELECT current_database() AS database_name, current_user AS user_name");
  const row = result.rows[0];
  return { database: row?.database_name, user: row?.user_name };
}

export function quoteIdentifier(identifier) {
  if (typeof identifier !== "string" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new ApiError("Identificador de esquema no válido.", 500, "INVALID_SCHEMA_IDENTIFIER");
  }
  return `"${identifier}"`;
}

export function coerceIdentifier(value) {
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return value;
}

export async function tableColumns(executor, tableName) {
  const result = await executor.query(
    `SELECT column_name, data_type, udt_name
       FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = $1
      ORDER BY ordinal_position`,
    [tableName],
  );
  return Object.fromEntries(result.rows.map(row => [row.column_name, row]));
}

export function firstColumn(columns, candidates, required = true) {
  const found = candidates.find(candidate => Object.prototype.hasOwnProperty.call(columns, candidate));
  if (!found && required) throw new ApiError("La estructura de PostgreSQL no contiene una columna compatible.", 500, "SCHEMA_UNSUPPORTED");
  return found || null;
}

export function jsonValue(value) {
  if (value && typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_error) {
      return {};
    }
  }
  return {};
}
