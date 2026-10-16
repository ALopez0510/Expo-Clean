import { randomUUID } from "node:crypto";
import { coerceIdentifier, firstColumn, query, quoteIdentifier, tableColumns } from "../db.js";
import { ApiError, ResourceNotFound, SchemaUnsupported } from "../errors.js";
import { serializeRow } from "../serializers.js";

const PRODUCTS_TABLE = "cleaning_products";
const RELATIONS_TABLE = "apu_cleaning_products";
const APUS_TABLE = "apus";
const PRODUCT_COLUMNS = [
  "id",
  "sku",
  "name",
  "category",
  "brand",
  "description",
  "unit",
  "presentation",
  "content_quantity",
  "content_unit",
  "purchase_price",
  "sale_price",
  "supplier",
  "sanitary_registration",
  "active",
  "metadata",
];

const RELATION_COLUMNS = [
  "id",
  "apu_id",
  "product_id",
  "consumption_per_unit",
  "unit",
  "waste_factor",
  "unit_price_snapshot",
  "metadata",
];

function assertColumns(columns, tableName, requiredColumns) {
  if (!Object.keys(columns).length) throw new SchemaUnsupported(tableName);
  for (const column of requiredColumns) firstColumn(columns, [column]);
}

async function getProductColumns() {
  const columns = await tableColumns({ query }, PRODUCTS_TABLE);
  assertColumns(columns, PRODUCTS_TABLE, PRODUCT_COLUMNS);
  return columns;
}

async function getRelationColumns() {
  const columns = await tableColumns({ query }, RELATIONS_TABLE);
  assertColumns(columns, RELATIONS_TABLE, RELATION_COLUMNS);
  return columns;
}

async function getApuColumns() {
  const columns = await tableColumns({ query }, APUS_TABLE);
  assertColumns(columns, APUS_TABLE, ["id"]);
  return columns;
}

function stringFilter(value, field) {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) throw new ApiError(`${field} debe enviarse una sola vez.`, 400, "INVALID_FILTER");
  const normalized = String(value).trim();
  return normalized || null;
}

function activeFilter(value) {
  const normalized = stringFilter(value, "active");
  if (normalized === null) return null;
  if (normalized !== "true" && normalized !== "false") {
    throw new ApiError("active debe ser true o false.", 400, "INVALID_FILTER");
  }
  return normalized === "true";
}

function bodyValue(body, camelName, snakeName = camelName) {
  return body[camelName] !== undefined ? body[camelName] : body[snakeName];
}

function bodyOrCurrent(body, camelName, current, snakeName = camelName) {
  const value = bodyValue(body, camelName, snakeName);
  return value === undefined ? current : value;
}

function textValue(value, field, { required = false, maxLength = 255 } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new ApiError(`${field} es obligatorio.`, 400, "INVALID_PRODUCT");
    return null;
  }
  if (typeof value !== "string") throw new ApiError(`${field} debe ser texto.`, 400, "INVALID_PRODUCT");
  const normalized = value.trim();
  if (!normalized && required) throw new ApiError(`${field} es obligatorio.`, 400, "INVALID_PRODUCT");
  if (normalized.length > maxLength) throw new ApiError(`${field} no puede superar ${maxLength} caracteres.`, 400, "INVALID_PRODUCT");
  return normalized || null;
}

function decimalValue(value, field, { required = false, positive = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new ApiError(`${field} es obligatorio.`, 400, "INVALID_PRODUCT");
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || (positive && number === 0)) {
    throw new ApiError(`${field} debe ser un número válido${positive ? " mayor que cero" : " no negativo"}.`, 400, "INVALID_PRODUCT");
  }
  return number;
}

function booleanValue(value, field) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw new ApiError(`${field} debe ser booleano.`, 400, "INVALID_PRODUCT");
}

function metadataValue(value) {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError("metadata debe ser un objeto JSON.", 400, "INVALID_PRODUCT");
  }
  return value;
}

function demoMetadata(metadata) {
  return {
    ...metadata,
    demo: true,
    marketPriceClaim: false,
    source: metadata.source || "CleanQuote Pro demo CRUD",
  };
}

function validateProductPayload(body, existing = null) {
  const source = body || {};
  const current = existing || {};
  const product = {
    sku: textValue(bodyOrCurrent(source, "sku", current.sku), "sku", { required: true, maxLength: 120 }),
    name: textValue(bodyOrCurrent(source, "name", current.name), "name", { required: true }),
    category: textValue(bodyOrCurrent(source, "category", current.category), "category", { required: true }),
    brand: textValue(bodyOrCurrent(source, "brand", current.brand), "brand"),
    description: textValue(bodyOrCurrent(source, "description", current.description), "description", { maxLength: 2000 }),
    unit: textValue(bodyOrCurrent(source, "unit", current.unit), "unit", { required: true, maxLength: 40 }),
    presentation: textValue(bodyOrCurrent(source, "presentation", current.presentation), "presentation", { maxLength: 255 }),
    contentQuantity: decimalValue(bodyOrCurrent(source, "contentQuantity", current.content_quantity, "content_quantity"), "contentQuantity", { positive: true }),
    contentUnit: textValue(bodyOrCurrent(source, "contentUnit", current.content_unit, "content_unit"), "contentUnit", { maxLength: 40 }),
    purchasePrice: decimalValue(bodyOrCurrent(source, "purchasePrice", current.purchase_price, "purchase_price"), "purchasePrice", { required: true }),
    salePrice: decimalValue(bodyOrCurrent(source, "salePrice", current.sale_price, "sale_price"), "salePrice"),
    supplier: textValue(bodyOrCurrent(source, "supplier", current.supplier), "supplier"),
    sanitaryRegistration: textValue(bodyOrCurrent(source, "sanitaryRegistration", current.sanitary_registration, "sanitary_registration"), "sanitaryRegistration"),
    active: bodyValue(source, "active") !== undefined ? booleanValue(bodyValue(source, "active"), "active") : (current.active === undefined ? true : Boolean(current.active)),
    metadata: demoMetadata(metadataValue(bodyOrCurrent(source, "metadata", current.metadata))),
  };
  if ((product.contentQuantity === null) !== (product.contentUnit === null)) {
    throw new ApiError("contentQuantity y contentUnit deben enviarse juntos.", 400, "INVALID_PRODUCT");
  }
  return product;
}

function productInput(row) {
  return {
    ...row,
    content_quantity: row.content_quantity,
    content_unit: row.content_unit,
    purchase_price: row.purchase_price,
    sale_price: row.sale_price,
    sanitary_registration: row.sanitary_registration,
  };
}

async function findProductRow(productId) {
  const columns = await getProductColumns();
  const idColumn = firstColumn(columns, ["id"]);
  const result = await query(
    `SELECT * FROM ${quoteIdentifier(PRODUCTS_TABLE)} WHERE ${quoteIdentifier(idColumn)} = $1 LIMIT 1`,
    [coerceIdentifier(productId)],
  );
  if (!result.rows[0]) throw new ResourceNotFound(`producto de limpieza ${productId}`);
  return result.rows[0];
}

async function assertSkuAvailable(sku, productId = null) {
  const result = await query(
    `SELECT "id" FROM ${quoteIdentifier(PRODUCTS_TABLE)} WHERE LOWER("sku") = LOWER($1)${productId === null ? "" : ' AND "id" <> $2'} LIMIT 1`,
    productId === null ? [sku] : [sku, coerceIdentifier(productId)],
  );
  if (result.rows[0]) throw new ApiError("El SKU ya está registrado.", 409, "SKU_EXISTS");
}

function productId() {
  return `PRD-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

export async function listCleaningProducts(filters = {}) {
  await getProductColumns();
  const conditions = [];
  const values = [];

  const category = stringFilter(filters.category, "category");
  if (category !== null) {
    values.push(category);
    conditions.push(`LOWER("category") = LOWER($${values.length})`);
  }

  const active = activeFilter(filters.active);
  if (active !== null) {
    values.push(active);
    conditions.push(`"active" = $${values.length}`);
  }

  const search = stringFilter(filters.q, "q");
  if (search !== null) {
    values.push(`%${search}%`);
    const placeholder = `$${values.length}`;
    conditions.push(`("name" ILIKE ${placeholder} OR "sku" ILIKE ${placeholder} OR "brand" ILIKE ${placeholder})`);
  }

  const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
  const result = await query(
    `SELECT * FROM ${quoteIdentifier(PRODUCTS_TABLE)}${where} ORDER BY "category" ASC, "name" ASC, "id" ASC`,
    values,
  );
  return result.rows.map(serializeRow);
}

export async function getCleaningProduct(productId) {
  return serializeRow(await findProductRow(productId));
}

export async function createCleaningProduct(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ApiError("El cuerpo debe ser un objeto JSON.", 400, "INVALID_JSON");
  }
  await getProductColumns();
  const product = validateProductPayload(payload);
  await assertSkuAvailable(product.sku);
  const id = productId();
  const result = await query(
    `INSERT INTO ${quoteIdentifier(PRODUCTS_TABLE)}
      ("id", "sku", "name", "category", "brand", "description", "unit", "presentation", "content_quantity", "content_unit", "purchase_price", "sale_price", "supplier", "sanitary_registration", "active", "metadata")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb)
     RETURNING *`,
    [id, product.sku, product.name, product.category, product.brand, product.description, product.unit, product.presentation, product.contentQuantity, product.contentUnit, product.purchasePrice, product.salePrice, product.supplier, product.sanitaryRegistration, product.active, JSON.stringify(product.metadata)],
  );
  return serializeRow(result.rows[0]);
}

export async function updateCleaningProduct(productIdValue, payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ApiError("El cuerpo debe ser un objeto JSON.", 400, "INVALID_JSON");
  }
  const current = await findProductRow(productIdValue);
  const product = validateProductPayload(payload, productInput(current));
  await assertSkuAvailable(product.sku, productIdValue);
  const fields = [
    ["sku", product.sku],
    ["name", product.name],
    ["category", product.category],
    ["brand", product.brand],
    ["description", product.description],
    ["unit", product.unit],
    ["presentation", product.presentation],
    ["content_quantity", product.contentQuantity],
    ["content_unit", product.contentUnit],
    ["purchase_price", product.purchasePrice],
    ["sale_price", product.salePrice],
    ["supplier", product.supplier],
    ["sanitary_registration", product.sanitaryRegistration],
    ["active", product.active],
    ["metadata", JSON.stringify(product.metadata)],
  ];
  const values = fields.map(([, value]) => value);
  const assignments = fields.map(([field], index) => `${quoteIdentifier(field)} = ${field === "metadata" ? `$${index + 1}::jsonb` : `$${index + 1}`}`).join(", ");
  values.push(coerceIdentifier(productIdValue));
  const result = await query(
    `UPDATE ${quoteIdentifier(PRODUCTS_TABLE)} SET ${assignments}, "updated_at" = NOW() WHERE "id" = $${values.length} RETURNING *`,
    values,
  );
  if (!result.rows[0]) throw new ResourceNotFound(`producto de limpieza ${productIdValue}`);
  return serializeRow(result.rows[0]);
}

export async function deactivateCleaningProduct(productIdValue) {
  const current = await findProductRow(productIdValue);
  if (current.active === false) return serializeRow(current);
  const result = await query(
    `UPDATE ${quoteIdentifier(PRODUCTS_TABLE)} SET "active" = FALSE, "updated_at" = NOW() WHERE "id" = $1 RETURNING *`,
    [coerceIdentifier(productIdValue)],
  );
  return serializeRow(result.rows[0]);
}

export async function listCleaningProductsForApu(apuId) {
  const apuColumns = await getApuColumns();
  const relationColumns = await getRelationColumns();
  await getProductColumns();

  const apuIdColumn = firstColumn(apuColumns, ["id"]);
  const relationApuColumn = firstColumn(relationColumns, ["apu_id"]);
  const apuResult = await query(
    `SELECT 1 FROM ${quoteIdentifier(APUS_TABLE)} WHERE ${quoteIdentifier(apuIdColumn)} = $1 LIMIT 1`,
    [coerceIdentifier(apuId)],
  );
  if (!apuResult.rows[0]) throw new ResourceNotFound(`APU ${apuId}`);

  const result = await query(
    `SELECT
       cp.*,
       acp."id" AS apu_cleaning_product_id,
       acp."apu_id" AS linked_apu_id,
       acp."product_id" AS linked_product_id,
       acp."consumption_per_unit",
       acp."unit" AS consumption_unit,
       acp."waste_factor",
       acp."unit_price_snapshot",
       acp."metadata" AS relation_metadata
     FROM ${quoteIdentifier(RELATIONS_TABLE)} AS acp
     INNER JOIN ${quoteIdentifier(PRODUCTS_TABLE)} AS cp ON cp."id" = acp."product_id"
     WHERE acp.${quoteIdentifier(relationApuColumn)} = $1
     ORDER BY cp."category" ASC, cp."name" ASC, cp."id" ASC`,
    [coerceIdentifier(apuId)],
  );
  return result.rows.map(serializeRow);
}
