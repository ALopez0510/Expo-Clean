import { query } from "../db.js";
import { ResourceNotFound } from "../errors.js";
import { safeUserRow } from "../auth.js";
import { serializeRow } from "../serializers.js";

const TABLES = Object.freeze({ roles: "roles", clients: "clients", projects: "projects" });

export async function listCore(resource) {
  if (resource === "users") {
    const result = await query("SELECT id, name, role_id, email, active FROM users");
    return result.rows.map(safeUserRow);
  }
  const table = TABLES[resource];
  if (!table) throw new ResourceNotFound(resource);
  const result = await query(`SELECT * FROM "${table}"`);
  return result.rows.map(serializeRow);
}
