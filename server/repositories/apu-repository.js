import { coerceIdentifier, firstColumn, query, quoteIdentifier, tableColumns } from "../db.js";
import { ResourceNotFound, SchemaUnsupported } from "../errors.js";
import { serializeRow } from "../serializers.js";

const TABLE = "apus";

export async function listApus() {
  const columns = await tableColumns({ query }, TABLE);
  if (!Object.keys(columns).length) throw new SchemaUnsupported(TABLE);
  const result = await query(`SELECT * FROM ${quoteIdentifier(TABLE)}`);
  return result.rows.map(serializeRow);
}

export async function getApu(apuId) {
  const columns = await tableColumns({ query }, TABLE);
  if (!Object.keys(columns).length) throw new SchemaUnsupported(TABLE);
  const idColumn = firstColumn(columns, ["id", "apu_id"]);
  const result = await query(`SELECT * FROM ${quoteIdentifier(TABLE)} WHERE ${quoteIdentifier(idColumn)} = $1 LIMIT 1`, [coerceIdentifier(apuId)]);
  if (!result.rows[0]) throw new ResourceNotFound(`APU ${apuId}`);
  return serializeRow(result.rows[0]);
}
