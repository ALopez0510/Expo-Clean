import {
  coerceIdentifier,
  firstColumn,
  jsonValue,
  query,
  quoteIdentifier,
  tableColumns,
  withTransaction,
} from "../db.js";
import { ApiError, ResourceNotFound, SchemaUnsupported } from "../errors.js";
import { serializeRow } from "../serializers.js";

const BUDGETS_TABLE = "budgets";
const ITEMS_TABLE = "budget_items";
const APUS_TABLE = "apus";

function decimalValue(value, field, allowZero = true) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || (!allowZero && number === 0)) {
    throw new ApiError(`${field} debe ser un número válido y no negativo.`, 400, "INVALID_NUMBER");
  }
  return number;
}

function jsonParameter(value) {
  return JSON.stringify(value);
}

async function getBudgetSchema(executor) {
  const columns = await tableColumns(executor, BUDGETS_TABLE);
  if (!Object.keys(columns).length) throw new SchemaUnsupported(BUDGETS_TABLE);
  return columns;
}

async function getItemSchema(executor) {
  const columns = await tableColumns(executor, ITEMS_TABLE);
  if (!Object.keys(columns).length) throw new SchemaUnsupported(ITEMS_TABLE);
  return columns;
}

async function getApuSchema(executor) {
  const columns = await tableColumns(executor, APUS_TABLE);
  if (!Object.keys(columns).length) throw new SchemaUnsupported(APUS_TABLE);
  return columns;
}

async function getBudget(executor, budgetId, columns) {
  const idColumn = firstColumn(columns, ["id", "budget_id"]);
  const result = await executor.query(
    `SELECT * FROM ${quoteIdentifier(BUDGETS_TABLE)} WHERE ${quoteIdentifier(idColumn)} = $1 LIMIT 1`,
    [coerceIdentifier(budgetId)],
  );
  if (!result.rows[0]) throw new ResourceNotFound(`presupuesto ${budgetId}`);
  return { row: result.rows[0], idColumn };
}

async function getItems(executor, budgetId, columns) {
  const budgetColumn = firstColumn(columns, ["budget_id", "budgetId"]);
  const result = await executor.query(
    `SELECT * FROM ${quoteIdentifier(ITEMS_TABLE)} WHERE ${quoteIdentifier(budgetColumn)} = $1`,
    [coerceIdentifier(budgetId)],
  );
  return { rows: result.rows, budgetColumn };
}

export async function getBudgetWithItems(budgetId) {
  const budgetColumns = await getBudgetSchema({ query });
  const itemColumns = await getItemSchema({ query });
  const budgetResult = await getBudget({ query }, budgetId, budgetColumns);
  const itemsResult = await getItems({ query }, budgetId, itemColumns);
  return {
    budget: serializeRow(budgetResult.row),
    items: itemsResult.rows.map(serializeRow),
    totals: "totals" in budgetColumns ? jsonValue(budgetResult.row.totals) : {},
    settings: "settings" in budgetColumns ? jsonValue(budgetResult.row.settings) : {},
  };
}

async function refreshBudgetSnapshot(executor, budgetId, budgetColumns, payload) {
  const updates = [];
  if (payload && payload.totals && typeof payload.totals === "object" && "totals" in budgetColumns) {
    updates.push(["totals", jsonParameter(payload.totals)]);
  }
  if (payload && payload.settings && typeof payload.settings === "object" && "settings" in budgetColumns) {
    updates.push(["settings", jsonParameter(payload.settings)]);
  }
  if (!updates.length) return;
  const idColumn = firstColumn(budgetColumns, ["id", "budget_id"]);
  const values = updates.map(([, value]) => value);
  const assignments = updates.map(([column], index) => `${quoteIdentifier(column)} = $${index + 1}`).join(", ");
  values.push(coerceIdentifier(budgetId));
  await executor.query(
    `UPDATE ${quoteIdentifier(BUDGETS_TABLE)} SET ${assignments} WHERE ${quoteIdentifier(idColumn)} = $${values.length}`,
    values,
  );
}

async function getApu(executor, apuId, columns) {
  const idColumn = firstColumn(columns, ["id", "apu_id"]);
  const result = await executor.query(
    `SELECT * FROM ${quoteIdentifier(APUS_TABLE)} WHERE ${quoteIdentifier(idColumn)} = $1 LIMIT 1`,
    [coerceIdentifier(apuId)],
  );
  if (!result.rows[0]) throw new ResourceNotFound(`APU ${apuId}`);
  return result.rows[0];
}

export async function addBudgetItem(budgetId, payload) {
  if (!payload || typeof payload !== "object") throw new ApiError("El cuerpo JSON es obligatorio.", 400, "INVALID_JSON");
  const apuId = payload.apuId ?? payload.apu_id;
  if (apuId === undefined || apuId === null || apuId === "") throw new ApiError("apuId es obligatorio.", 400, "INVALID_APU_ID");
  const quantity = decimalValue(payload.quantity ?? 1, "quantity");

  return withTransaction(async client => {
    const budgetColumns = await getBudgetSchema(client);
    const itemColumns = await getItemSchema(client);
    const apuColumns = await getApuSchema(client);
    await getBudget(client, budgetId, budgetColumns);
    const budgetColumn = firstColumn(itemColumns, ["budget_id", "budgetId"]);
    const apuColumn = firstColumn(itemColumns, ["apu_id", "apuId"]);
    const quantityColumn = firstColumn(itemColumns, ["quantity", "qty"]);
    const unitPriceColumn = firstColumn(itemColumns, ["unit_price", "unitPrice"]);
    const subtotalColumn = firstColumn(itemColumns, ["subtotal", "line_total"], false);
    const apu = await getApu(client, apuId, apuColumns);
    const apuPriceColumn = firstColumn(apuColumns, ["unit_price", "unitPrice", "price"]);
    const unitPrice = decimalValue(apu[apuPriceColumn], "unit_price");
    if (payload.unitPrice !== undefined && decimalValue(payload.unitPrice, "unit_price") !== unitPrice) {
      throw new ApiError("unit_price no coincide con el catálogo de APUs.", 400, "INVALID_UNIT_PRICE");
    }

    const existingResult = await client.query(
      `SELECT * FROM ${quoteIdentifier(ITEMS_TABLE)} WHERE ${quoteIdentifier(budgetColumn)} = $1 AND ${quoteIdentifier(apuColumn)} = $2 LIMIT 1`,
      [coerceIdentifier(budgetId), coerceIdentifier(apuId)],
    );
    let item;
    if (existingResult.rows[0]) {
      const existing = existingResult.rows[0];
      const idColumn = firstColumn(itemColumns, ["id", "budget_item_id"]);
      const nextQuantity = decimalValue(existing[quantityColumn] ?? 0, "quantity") + quantity;
      const updates = [[quantityColumn, nextQuantity]];
      if (subtotalColumn) updates.push([subtotalColumn, nextQuantity * unitPrice]);
      const values = updates.map(([, value]) => value);
      const assignments = updates.map(([column], index) => `${quoteIdentifier(column)} = $${index + 1}`).join(", ");
      values.push(existing[idColumn]);
      const result = await client.query(
        `UPDATE ${quoteIdentifier(ITEMS_TABLE)} SET ${assignments} WHERE ${quoteIdentifier(idColumn)} = $${values.length} RETURNING *`,
        values,
      );
      item = result.rows[0];
    } else {
      const valuesByColumn = new Map([
        [budgetColumn, coerceIdentifier(budgetId)],
        [apuColumn, coerceIdentifier(apuId)],
        [quantityColumn, quantity],
        [unitPriceColumn, unitPrice],
      ]);
      if (subtotalColumn) valuesByColumn.set(subtotalColumn, quantity * unitPrice);
      for (const field of ["code", "name", "unit"]) {
        if (itemColumns[field] && apu[field] !== undefined) valuesByColumn.set(field, apu[field]);
      }
      const fields = [...valuesByColumn.keys()];
      const values = [...valuesByColumn.values()];
      const placeholders = fields.map((_field, index) => `$${index + 1}`).join(", ");
      const result = await client.query(
        `INSERT INTO ${quoteIdentifier(ITEMS_TABLE)} (${fields.map(quoteIdentifier).join(", ")}) VALUES (${placeholders}) RETURNING *`,
        values,
      );
      item = result.rows[0];
    }
    await refreshBudgetSnapshot(client, budgetId, budgetColumns, payload);
    return serializeRow(item);
  });
}

async function getItem(executor, itemId, itemColumns) {
  const idColumn = firstColumn(itemColumns, ["id", "budget_item_id"]);
  const result = await executor.query(
    `SELECT * FROM ${quoteIdentifier(ITEMS_TABLE)} WHERE ${quoteIdentifier(idColumn)} = $1 LIMIT 1`,
    [coerceIdentifier(itemId)],
  );
  if (!result.rows[0]) throw new ResourceNotFound(`partida ${itemId}`);
  return { row: result.rows[0], idColumn };
}

export async function updateBudgetItem(itemId, payload) {
  if (!payload || typeof payload !== "object" || payload.quantity === undefined) {
    throw new ApiError("quantity es obligatorio.", 400, "INVALID_QUANTITY");
  }
  const quantity = decimalValue(payload.quantity, "quantity");
  return withTransaction(async client => {
    const budgetColumns = await getBudgetSchema(client);
    const itemColumns = await getItemSchema(client);
    const { row: item, idColumn } = await getItem(client, itemId, itemColumns);
    const quantityColumn = firstColumn(itemColumns, ["quantity", "qty"]);
    const unitPriceColumn = firstColumn(itemColumns, ["unit_price", "unitPrice"]);
    const subtotalColumn = firstColumn(itemColumns, ["subtotal", "line_total"], false);
    const unitPrice = decimalValue(item[unitPriceColumn], "unit_price");
    const updates = [[quantityColumn, quantity]];
    if (subtotalColumn) updates.push([subtotalColumn, quantity * unitPrice]);
    const values = updates.map(([, value]) => value);
    const assignments = updates.map(([column], index) => `${quoteIdentifier(column)} = $${index + 1}`).join(", ");
    values.push(item[idColumn]);
    const result = await client.query(
      `UPDATE ${quoteIdentifier(ITEMS_TABLE)} SET ${assignments} WHERE ${quoteIdentifier(idColumn)} = $${values.length} RETURNING *`,
      values,
    );
    const budgetColumn = firstColumn(itemColumns, ["budget_id", "budgetId"]);
    await refreshBudgetSnapshot(client, item[budgetColumn], budgetColumns, payload);
    return serializeRow(result.rows[0]);
  });
}

export async function deleteBudgetItem(itemId, payload = {}) {
  return withTransaction(async client => {
    const budgetColumns = await getBudgetSchema(client);
    const itemColumns = await getItemSchema(client);
    const { row: item, idColumn } = await getItem(client, itemId, itemColumns);
    await client.query(`DELETE FROM ${quoteIdentifier(ITEMS_TABLE)} WHERE ${quoteIdentifier(idColumn)} = $1`, [item[idColumn]]);
    const budgetColumn = firstColumn(itemColumns, ["budget_id", "budgetId"]);
    await refreshBudgetSnapshot(client, item[budgetColumn], budgetColumns, payload);
    return { id: item[idColumn], deleted: true };
  });
}

export async function updateBudgetSnapshot(budgetId, payload) {
  if (!payload || typeof payload !== "object") throw new ApiError("El cuerpo JSON es obligatorio.", 400, "INVALID_JSON");
  return withTransaction(async client => {
    const budgetColumns = await getBudgetSchema(client);
    await getBudget(client, budgetId, budgetColumns);
    await refreshBudgetSnapshot(client, budgetId, budgetColumns, payload);
    const refreshed = await getBudget(client, budgetId, budgetColumns);
    return serializeRow(refreshed.row);
  });
}
