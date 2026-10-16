import bcrypt from "bcrypt";
import { query } from "./db.js";
import { serializeRow } from "./serializers.js";

const USER_SELECT = `
  SELECT
    u.id,
    u.name,
    u.email,
    u.active,
    u.password_hash,
    r.id AS role_id,
    r.name AS role_name,
    r.permissions AS role_permissions
  FROM users AS u
  JOIN roles AS r ON r.id = u.role_id
`;

function normalizePermissions(value) {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
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

export function safeUser(row) {
  const serialized = serializeRow(row);
  return {
    id: serialized.id,
    name: serialized.name,
    email: serialized.email,
    role: {
      id: serialized.roleId,
      name: serialized.roleName,
      permissions: normalizePermissions(serialized.rolePermissions),
    },
  };
}

export async function findUserByEmail(email) {
  const result = await query(`${USER_SELECT} WHERE LOWER(u.email) = LOWER($1) LIMIT 1`, [email]);
  return result.rows[0] || null;
}

export async function findUserById(userId) {
  const result = await query(`${USER_SELECT} WHERE u.id = $1 LIMIT 1`, [userId]);
  const row = result.rows[0];
  return row && row.active ? safeUser(row) : null;
}

export async function authenticate(email, password) {
  const row = await findUserByEmail(email);
  if (!row || !row.active || !row.password_hash) return null;
  let valid = false;
  try {
    valid = await bcrypt.compare(password, row.password_hash);
  } catch (_error) {
    valid = false;
  }
  return valid ? safeUser(row) : null;
}

export function safeUserRow(row) {
  const serialized = serializeRow(row);
  delete serialized.passwordHash;
  delete serialized.password;
  delete serialized.password_hash;
  return serialized;
}
