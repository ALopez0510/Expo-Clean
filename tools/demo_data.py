"""Create, inspect, and remove controlled demo data in the real PostgreSQL schema.

This script is deliberately separate from the Node/Express runtime.  It does not
create schema, users, roles, passwords, workflow records, or application files.
It uses psql through subprocess and passes the database password only through
the PGPASSWORD environment variable of that subprocess.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env"
PSQL_FALLBACK = Path(r"C:\Program Files\PostgreSQL\18\bin\psql.exe")

DATABASE_NAME = "al_bd"
DATABASE_USER = "al_app"

CONTROLLED_CLIENT_ID = "CLI-DEMO-001"
CONTROLLED_PROJECT_ID = "PRJ-DEMO-001"
CONTROLLED_BUDGET_ID = "BUD-001"
CONTROLLED_APU_IDS = tuple(f"APU-DEMO-{index:03d}" for index in range(1, 13))
CONTROLLED_ITEM_IDS = tuple(f"BI-DEMO-{index:03d}" for index in range(1, 11))
CONTROLLED_PRODUCT_IDS = tuple(f"PRD-DEMO-{index:03d}" for index in range(1, 16))
CONTROLLED_RELATION_IDS = tuple(f"ACP-DEMO-{index:03d}" for index in range(1, 19))

BASE_REQUIRED_COLUMNS = {
    "clients": {"id", "name", "tax_id", "contact_name", "email"},
    "projects": {"id", "client_id", "name", "location", "currency", "status"},
    "apus": {"id", "code", "name", "category", "unit", "unit_price", "components"},
    "budgets": {"id", "project_id", "name", "version", "status", "totals", "settings"},
    "budget_items": {"id", "budget_id", "apu_id", "quantity", "unit_price", "subtotal"},
}
PRODUCT_REQUIRED_COLUMNS = {
    "cleaning_products": {
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
        "created_at",
        "updated_at",
    },
    "apu_cleaning_products": {
        "id",
        "apu_id",
        "product_id",
        "consumption_per_unit",
        "unit",
        "waste_factor",
        "unit_price_snapshot",
        "metadata",
        "created_at",
        "updated_at",
    },
}
REQUIRED_COLUMNS = {**BASE_REQUIRED_COLUMNS, **PRODUCT_REQUIRED_COLUMNS}


class DemoDataError(RuntimeError):
    """Expected operational error that can be displayed without secrets."""


def load_root_env() -> dict[str, str]:
    """Load only simple KEY=VALUE entries from the root .env file."""

    if not ENV_FILE.is_file():
        raise DemoDataError(f"No existe {ENV_FILE}. Crea el .env de la raíz antes de continuar.")

    values: dict[str, str] = {}
    for raw_line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        values[key] = value

    required = ("DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD")
    missing = [key for key in required if not values.get(key)]
    if missing:
        raise DemoDataError(f"Faltan variables requeridas en .env: {', '.join(missing)}")
    return values


def resolve_psql() -> str:
    path = shutil.which("psql")
    if path:
        return path
    if PSQL_FALLBACK.is_file():
        return str(PSQL_FALLBACK)
    raise DemoDataError(
        "No se encontró psql en PATH ni en C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe."
    )


def run_psql(sql: str, *, tuples_only: bool = False) -> str:
    """Run SQL without putting DB_PASSWORD in command arguments or output."""

    env_values = load_root_env()
    psql = resolve_psql()
    command = [
        psql,
        "--no-psqlrc",
        "--no-password",
        "--host",
        env_values["DB_HOST"],
        "--port",
        env_values["DB_PORT"],
        "--username",
        env_values["DB_USER"],
        "--dbname",
        env_values["DB_NAME"],
        "--set=ON_ERROR_STOP=1",
        "--quiet",
    ]
    if tuples_only:
        command.extend(["--tuples-only", "--no-align"])

    child_env = os.environ.copy()
    child_env["PGPASSWORD"] = env_values["DB_PASSWORD"]
    try:
        completed = subprocess.run(
            command,
            input=sql,
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
            env=child_env,
            cwd=ROOT,
            check=False,
            timeout=30,
        )
    except OSError as error:
        raise DemoDataError(f"No fue posible ejecutar psql: {error}") from error
    except subprocess.TimeoutExpired as error:
        raise DemoDataError("psql excedió el tiempo máximo de 30 segundos.") from error

    if completed.returncode != 0:
        # Do not echo stderr: PostgreSQL diagnostics can include connection
        # details, and the tool's contract is to keep output secret-free.
        raise DemoDataError("psql terminó con error; verifica la conexión local a PostgreSQL por Tailscale.")
    return completed.stdout.strip()


def sql_string(value: str) -> str:
    return "'" + str(value).replace("'", "''") + "'"


def sql_json(value: object) -> str:
    payload = json.dumps(json_numbers(value), ensure_ascii=False, separators=(",", ":"))
    return f"{sql_string(payload)}::jsonb"


def sql_number(value: Decimal | int | float | str) -> str:
    decimal_value = Decimal(str(value))
    return format(decimal_value, "f")


def sql_nullable_string(value: object) -> str:
    return "NULL" if value is None else sql_string(str(value))


def sql_nullable_number(value: object) -> str:
    return "NULL" if value is None else sql_number(value)


def schema_columns(table_names: Iterable[str] | None = None) -> dict[str, set[str]]:
    tables = tuple(table_names or REQUIRED_COLUMNS)
    table_list = ", ".join(sql_string(table_name) for table_name in tables)
    rows = run_psql(
        f"""
        SELECT table_name || '|' || column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN ({table_list})
        ORDER BY table_name, ordinal_position;
        """,
        tuples_only=True,
    )
    found: dict[str, set[str]] = {}
    for line in rows.splitlines():
        table, column = line.strip().split("|", 1)
        found.setdefault(table, set()).add(column)
    return found


def validate_schema(required_columns: dict[str, set[str]] = BASE_REQUIRED_COLUMNS) -> None:
    found = schema_columns(required_columns)
    missing_tables = sorted(set(required_columns) - set(found))
    missing_columns = {
        table: sorted(required - found.get(table, set()))
        for table, required in required_columns.items()
        if required - found.get(table, set())
    }
    if missing_tables or missing_columns:
        details: list[str] = []
        if missing_tables:
            details.append("tablas ausentes: " + ", ".join(missing_tables))
        if missing_columns:
            details.extend(f"columnas ausentes en {table}: {', '.join(columns)}" for table, columns in missing_columns.items())
        raise DemoDataError("El esquema real no coincide con el contrato consumido: " + "; ".join(details))


def product_schema_state(found: dict[str, set[str]] | None = None) -> str:
    """Return absent, complete, or raise for a partially applied product schema."""

    found = found if found is not None else schema_columns(PRODUCT_REQUIRED_COLUMNS)
    product_tables = set(PRODUCT_REQUIRED_COLUMNS)
    found_product_tables = product_tables & set(found)
    if not found_product_tables:
        return "absent"
    missing_tables = sorted(product_tables - set(found))
    missing_columns = {
        table: sorted(required - found.get(table, set()))
        for table, required in PRODUCT_REQUIRED_COLUMNS.items()
        if required - found.get(table, set())
    }
    if missing_tables or missing_columns:
        details: list[str] = []
        if missing_tables:
            details.append("tablas ausentes: " + ", ".join(missing_tables))
        if missing_columns:
            details.extend(f"columnas ausentes en {table}: {', '.join(columns)}" for table, columns in missing_columns.items())
        raise DemoDataError("El esquema de productos está incompleto: " + "; ".join(details))
    return "complete"


def validate_product_schema(found: dict[str, set[str]] | None = None) -> None:
    if product_schema_state(found) != "complete":
        raise DemoDataError(
            "Faltan las tablas de productos demo. Aplica server/migrations/003_add_cleaning_products.sql antes de ejecutar start."
        )


def validate_connection() -> None:
    identity = run_psql("SELECT current_database() || '|' || current_user;", tuples_only=True)
    database, user = identity.strip().split("|", 1)
    if database != DATABASE_NAME or user != DATABASE_USER:
        raise DemoDataError(
            f"La conexión apunta a {database}/{user}; se esperaba {DATABASE_NAME}/{DATABASE_USER}."
        )


def demo_apus() -> list[dict[str, object]]:
    """Return 12 APUs in the actual `apus` table shape."""

    source = [
        ("MT-DEMO-001", "Excavación manual en suelo natural", "Movimiento de tierras", "m3", "12.50", {"labor": "5.00", "materials": "1.50", "equipment": "4.00", "transport": "1.00", "other": "1.00"}),
        ("MT-DEMO-002", "Relleno compactado con material seleccionado", "Movimiento de tierras", "m3", "24.80", {"labor": "4.80", "materials": "9.50", "equipment": "7.50", "transport": "2.20", "other": "0.80"}),
        ("HO-DEMO-001", "Hormigón estructural f'c=240 kg/cm²", "Hormigón", "m3", "148.60", {"labor": "22.60", "materials": "107.50", "equipment": "10.50", "transport": "6.00", "other": "2.00"}),
        ("HO-DEMO-002", "Encofrado metálico para columnas", "Hormigón", "m2", "28.40", {"labor": "15.40", "materials": "5.00", "equipment": "5.00", "transport": "1.50", "other": "1.50"}),
        ("AC-DEMO-001", "Acero de refuerzo fy=4200 kg/cm²", "Acero", "kg", "2.18", {"labor": "0.62", "materials": "1.25", "equipment": "0.18", "transport": "0.08", "other": "0.05"}),
        ("AC-DEMO-002", "Estructura metálica ASTM A36 fabricada", "Acero", "kg", "4.95", {"labor": "1.55", "materials": "2.55", "equipment": "0.45", "transport": "0.25", "other": "0.15"}),
        ("MA-DEMO-001", "Mampostería de bloque de hormigón 15 cm", "Mampostería", "m2", "22.75", {"labor": "9.50", "materials": "10.80", "equipment": "0.75", "transport": "1.20", "other": "0.50"}),
        ("MA-DEMO-002", "Tabique de gypsum con aislamiento acústico", "Mampostería", "m2", "31.90", {"labor": "11.50", "materials": "17.80", "equipment": "0.50", "transport": "1.40", "other": "0.70"}),
        ("EN-DEMO-001", "Enlucido vertical con mortero 1:4", "Enlucidos / acabados", "m2", "9.85", {"labor": "5.20", "materials": "3.40", "equipment": "0.40", "transport": "0.45", "other": "0.40"}),
        ("EN-DEMO-002", "Pintura látex interior dos manos", "Enlucidos / acabados", "m2", "6.75", {"labor": "2.80", "materials": "3.20", "equipment": "0.25", "transport": "0.25", "other": "0.25"}),
        ("HS-DEMO-001", "Punto de agua potable en tubería PVC", "Instalaciones hidrosanitarias", "punto", "42.30", {"labor": "17.50", "materials": "21.00", "equipment": "1.50", "transport": "1.30", "other": "1.00"}),
        ("HS-DEMO-002", "Punto de desagüe sanitario PVC 110 mm", "Instalaciones hidrosanitarias", "punto", "58.60", {"labor": "21.80", "materials": "31.20", "equipment": "2.00", "transport": "2.40", "other": "1.20"}),
    ]
    return [
        {
            "id": CONTROLLED_APU_IDS[index],
            "code": code,
            "name": name,
            "category": category,
            "unit": unit,
            "unit_price": Decimal(price),
            "components": {key: Decimal(value) for key, value in components.items()},
        }
        for index, (code, name, category, unit, price, components) in enumerate(source)
    ]


def demo_items() -> list[dict[str, object]]:
    quantities = ["120.50", "80.25", "45.75", "310.50", "2500.75", "185.50", "420.25", "160.75", "625.50", "980.25"]
    apus = demo_apus()[:10]
    return [
        {
            "id": CONTROLLED_ITEM_IDS[index],
            "budget_id": CONTROLLED_BUDGET_ID,
            "apu_id": apu["id"],
            "quantity": Decimal(quantity),
            "unit_price": apu["unit_price"],
            "subtotal": Decimal(quantity) * apu["unit_price"],
        }
        for index, (quantity, apu) in enumerate(zip(quantities, apus, strict=True))
    ]


def demo_cleaning_products() -> list[dict[str, object]]:
    """Return fictitious products with prices that are only for this demo."""

    demo_metadata = {"demo": True, "source": "tools/demo_data.py", "marketPriceClaim": False}
    source = [
        ("CLN-DEMO-001", "Detergente neutro biodegradable", "Detergentes", "DemoClean", "Detergente para limpieza general; precio ficticio de demo.", "L", "Bidón de 5 L", "5", "L", "12.50", "14.00", "Proveedora Demo Andina", None),
        ("CLN-DEMO-002", "Detergente alcalino concentrado", "Detergentes", "DemoClean", "Detergente concentrado para superficies lavables; precio ficticio de demo.", "L", "Galón de 3.8 L", "3.8", "L", "18.40", "20.50", "Químicos Ficticios del Pacífico", None),
        ("CLN-DEMO-003", "Desinfectante de superficies", "Desinfectantes", "DemoClean", "Desinfectante de uso institucional; precio ficticio de demo.", "L", "Bidón de 5 L", "5", "L", "15.20", "17.00", "Proveedora Demo Andina", "DEMO-SAN-001"),
        ("CLN-DEMO-004", "Amonio cuaternario quinta generación", "Desinfectantes", "DemoClean", "Concentrado desinfectante para la demo; precio ficticio de demo.", "L", "Bidón de 5 L", "5", "L", "22.80", "25.00", "Químicos Ficticios del Pacífico", "DEMO-SAN-002"),
        ("CLN-DEMO-005", "Hipoclorito de sodio 1000 ppm", "Desinfectantes", "DemoClean", "Solución clorada de referencia para la demo; precio ficticio de demo.", "L", "Bidón de 5 L", "5", "L", "8.90", "10.00", "Higiene Controlada Demo", "DEMO-SAN-003"),
        ("CLN-DEMO-006", "Desengrasante industrial", "Desengrasantes", "DemoClean", "Desengrasante para limpieza de superficies; precio ficticio de demo.", "L", "Bidón de 5 L", "5", "L", "19.75", "22.00", "Higiene Controlada Demo", None),
        ("CLN-DEMO-007", "Limpiador multiuso neutro", "Desengrasantes", "DemoClean", "Limpiador multiuso para terminaciones; precio ficticio de demo.", "L", "Bidón de 5 L", "5", "L", "11.30", "13.00", "Proveedora Demo Andina", None),
        ("CLN-DEMO-008", "Paño de microfibra", "Consumibles", "DemoClean", "Paño reutilizable de demostración; precio ficticio de demo.", "unidad", "Paquete de 12 unidades", "12", "unidad", "9.60", "11.00", "Insumos Demo Costa", None),
        ("CLN-DEMO-009", "Esponja abrasiva", "Consumibles", "DemoClean", "Esponja para limpieza manual; precio ficticio de demo.", "unidad", "Paquete de 10 unidades", "10", "unidad", "4.20", "5.00", "Insumos Demo Costa", None),
        ("CLN-DEMO-010", "Bolsa industrial reforzada 90x120 cm", "Desechables", "DemoClean", "Bolsa para residuos de obra y limpieza; precio ficticio de demo.", "unidad", "Rollo de 10 unidades", "10", "unidad", "7.50", "8.50", "Insumos Demo Costa", None),
        ("CLN-DEMO-011", "Toalla de papel interdoblada", "Desechables", "DemoClean", "Toalla de papel institucional; precio ficticio de demo.", "unidad", "Caja de 2000 hojas", "2000", "hojas", "28.00", "31.00", "Higiene Controlada Demo", None),
        ("CLN-DEMO-012", "Papel higiénico institucional", "Higiene", "DemoClean", "Papel higiénico institucional; precio ficticio de demo.", "rollo", "Fardo de 12 rollos", "12", "rollo", "18.00", "20.00", "Higiene Controlada Demo", None),
        ("CLN-DEMO-013", "Jabón líquido para manos", "Higiene", "DemoClean", "Jabón líquido para higiene de manos; precio ficticio de demo.", "L", "Bidón de 5 L", "5", "L", "14.80", "16.50", "Proveedora Demo Andina", "DEMO-SAN-004"),
        ("CLN-DEMO-014", "Guantes de nitrilo", "EPP", "DemoClean", "Guantes de protección para la demo; precio ficticio de demo.", "unidad", "Caja de 100 unidades", "100", "unidad", "24.00", "27.00", "EPP Ficticio Andino", None),
        ("CLN-DEMO-015", "Mascarilla quirúrgica", "EPP", "DemoClean", "Mascarilla de protección para la demo; precio ficticio de demo.", "unidad", "Caja de 50 unidades", "50", "unidad", "6.80", "8.00", "EPP Ficticio Andino", "DEMO-SAN-005"),
    ]
    return [
        {
            "id": CONTROLLED_PRODUCT_IDS[index],
            "sku": sku,
            "name": name,
            "category": category,
            "brand": brand,
            "description": description,
            "unit": unit,
            "presentation": presentation,
            "content_quantity": Decimal(content_quantity),
            "content_unit": content_unit,
            "purchase_price": Decimal(purchase_price),
            "sale_price": Decimal(sale_price),
            "supplier": supplier,
            "sanitary_registration": sanitary_registration,
            "active": True,
            "metadata": dict(demo_metadata),
        }
        for index, (sku, name, category, brand, description, unit, presentation, content_quantity, content_unit, purchase_price, sale_price, supplier, sanitary_registration) in enumerate(source)
    ]


def demo_apu_cleaning_products() -> list[dict[str, object]]:
    """Relate products only to existing APUs used by the controlled demo."""

    source = [
        ("APU-DEMO-004", "PRD-DEMO-006", "0.020", "0.05"),
        ("APU-DEMO-004", "PRD-DEMO-008", "0.010", "0.05"),
        ("APU-DEMO-004", "PRD-DEMO-010", "0.030", "0.10"),
        ("APU-DEMO-007", "PRD-DEMO-001", "0.030", "0.05"),
        ("APU-DEMO-007", "PRD-DEMO-008", "0.010", "0.05"),
        ("APU-DEMO-007", "PRD-DEMO-010", "0.020", "0.10"),
        ("APU-DEMO-009", "PRD-DEMO-001", "0.040", "0.05"),
        ("APU-DEMO-009", "PRD-DEMO-008", "0.015", "0.05"),
        ("APU-DEMO-009", "PRD-DEMO-010", "0.020", "0.10"),
        ("APU-DEMO-010", "PRD-DEMO-007", "0.020", "0.05"),
        ("APU-DEMO-010", "PRD-DEMO-008", "0.020", "0.05"),
        ("APU-DEMO-010", "PRD-DEMO-010", "0.020", "0.10"),
        ("APU-DEMO-011", "PRD-DEMO-003", "0.010", "0.05"),
        ("APU-DEMO-011", "PRD-DEMO-005", "0.005", "0.05"),
        ("APU-DEMO-011", "PRD-DEMO-008", "0.005", "0.05"),
        ("APU-DEMO-012", "PRD-DEMO-005", "0.020", "0.05"),
        ("APU-DEMO-012", "PRD-DEMO-003", "0.010", "0.05"),
        ("APU-DEMO-012", "PRD-DEMO-010", "0.030", "0.10"),
    ]
    products = {product["id"]: product for product in demo_cleaning_products()}
    return [
        {
            "id": CONTROLLED_RELATION_IDS[index],
            "apu_id": apu_id,
            "product_id": product_id,
            "consumption_per_unit": Decimal(consumption),
            "unit": products[product_id]["unit"],
            "waste_factor": Decimal(waste_factor),
            "unit_price_snapshot": products[product_id]["purchase_price"],
            "metadata": {"demo": True, "source": "tools/demo_data.py", "marketPriceClaim": False},
        }
        for index, (apu_id, product_id, consumption, waste_factor) in enumerate(source)
    ]


def validate_demo_seed_data() -> None:
    """Validate IDs, positive consumption, prices, and in-seed FK targets."""

    apus = demo_apus()
    products = demo_cleaning_products()
    relations = demo_apu_cleaning_products()
    apu_ids = {apu["id"] for apu in apus}
    product_ids = {product["id"] for product in products}
    if apu_ids != set(CONTROLLED_APU_IDS):
        raise ValueError("La lista de APUs demo no coincide con sus IDs controlados.")
    if product_ids != set(CONTROLLED_PRODUCT_IDS) or len(products) != len(CONTROLLED_PRODUCT_IDS):
        raise ValueError("La lista de productos demo no coincide con sus IDs controlados.")
    if len(relations) != len(CONTROLLED_RELATION_IDS):
        raise ValueError("La lista de relaciones APU-producto no coincide con sus IDs controlados.")

    for product in products:
        if not product["id"] or not product["sku"] or not product["name"]:
            raise ValueError("Cada producto demo debe tener id, sku y nombre.")
        if Decimal(str(product["purchase_price"])) < 0 or Decimal(str(product["sale_price"])) < 0:
            raise ValueError(f"El producto {product['id']} tiene un precio negativo.")
        if Decimal(str(product["content_quantity"])) <= 0:
            raise ValueError(f"El producto {product['id']} tiene contenido no positivo.")
        if not isinstance(product["metadata"], dict) or product["metadata"].get("demo") is not True:
            raise ValueError(f"El producto {product['id']} no está marcado como demo.")

    seen_pairs: set[tuple[str, str]] = set()
    for relation in relations:
        pair = (relation["apu_id"], relation["product_id"])
        if relation["apu_id"] not in apu_ids:
            raise ValueError(f"La relación {relation['id']} apunta a un APU inexistente en el seed.")
        if relation["product_id"] not in product_ids:
            raise ValueError(f"La relación {relation['id']} apunta a un producto inexistente en el seed.")
        if Decimal(str(relation["consumption_per_unit"])) <= 0:
            raise ValueError(f"La relación {relation['id']} tiene consumo no positivo.")
        if not 0 <= Decimal(str(relation["waste_factor"])) <= 1:
            raise ValueError(f"La relación {relation['id']} tiene desperdicio fuera de rango.")
        product = next(item for item in products if item["id"] == relation["product_id"])
        if relation["unit"] != product["unit"]:
            raise ValueError(f"La relación {relation['id']} no coincide con la unidad del producto.")
        if relation["unit_price_snapshot"] != product["purchase_price"]:
            raise ValueError(f"La relación {relation['id']} no coincide con el precio de compra demo.")
        if pair in seen_pairs:
            raise ValueError(f"La relación APU-producto está duplicada: {pair[0]} / {pair[1]}.")
        seen_pairs.add(pair)


def rounded(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_totals(items: Iterable[dict[str, object]]) -> dict[str, Decimal]:
    direct_cost = sum((Decimal(str(item["subtotal"])) for item in items), Decimal("0"))
    overhead = direct_cost * Decimal("0.08")
    contingency = direct_cost * Decimal("0.03")
    profit = direct_cost * Decimal("0.10")
    subtotal = direct_cost + overhead + contingency + profit
    tax = subtotal * Decimal("0.15")
    return {
        "directCost": rounded(direct_cost),
        "overhead": rounded(overhead),
        "contingency": rounded(contingency),
        "profit": rounded(profit),
        "subtotal": rounded(subtotal),
        "tax": rounded(tax),
        "grandTotal": rounded(subtotal + tax),
    }


def json_numbers(value: object) -> object:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, dict):
        return {key: json_numbers(item) for key, item in value.items()}
    if isinstance(value, list):
        return [json_numbers(item) for item in value]
    return value


def build_start_sql() -> str:
    validate_demo_seed_data()
    client = {
        "id": CONTROLLED_CLIENT_ID,
        "name": "Constructora Andina Demo",
        "tax_id": "DEMO-RUC-001",
        "contact_name": "Lucía Montalvo",
        "email": "lucia.montalvo@demo.buildcost.local",
    }
    project = {
        "id": CONTROLLED_PROJECT_ID,
        "client_id": CONTROLLED_CLIENT_ID,
        "name": "Centro Logístico Andino - Datos Demo",
        "location": "Quito, Ecuador",
        "currency": "USD",
        "status": "ACTIVE",
    }
    items = demo_items()
    totals = calculate_totals(items)
    settings = {
        "currency": "USD",
        "overheadPercent": 8,
        "contingencyPercent": 3,
        "profitPercent": 10,
        "taxPercent": 15,
    }
    budget = {
        "id": CONTROLLED_BUDGET_ID,
        "project_id": CONTROLLED_PROJECT_ID,
        "name": "Presupuesto Demo Rev. 01",
        "version": 1,
        "status": "DRAFT",
        "totals": json_numbers(totals),
        "settings": settings,
    }
    products = demo_cleaning_products()
    relations = demo_apu_cleaning_products()

    statements = ["BEGIN;"]
    statements.append(
        "INSERT INTO clients (id, name, tax_id, contact_name, email) VALUES "
        f"({sql_string(client['id'])}, {sql_string(client['name'])}, {sql_string(client['tax_id'])}, {sql_string(client['contact_name'])}, {sql_string(client['email'])}) "
        "ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, tax_id = EXCLUDED.tax_id, contact_name = EXCLUDED.contact_name, email = EXCLUDED.email;"
    )
    statements.append(
        "INSERT INTO projects (id, client_id, name, location, currency, status) VALUES "
        f"({sql_string(project['id'])}, {sql_string(project['client_id'])}, {sql_string(project['name'])}, {sql_string(project['location'])}, {sql_string(project['currency'])}, {sql_string(project['status'])}) "
        "ON CONFLICT (id) DO UPDATE SET client_id = EXCLUDED.client_id, name = EXCLUDED.name, location = EXCLUDED.location, currency = EXCLUDED.currency, status = EXCLUDED.status;"
    )
    for apu in demo_apus():
        statements.append(
            "INSERT INTO apus (id, code, name, category, unit, unit_price, components) VALUES "
            f"({sql_string(apu['id'])}, {sql_string(apu['code'])}, {sql_string(apu['name'])}, {sql_string(apu['category'])}, {sql_string(apu['unit'])}, {sql_number(apu['unit_price'])}, {sql_json(apu['components'])}) "
            "ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, category = EXCLUDED.category, unit = EXCLUDED.unit, unit_price = EXCLUDED.unit_price, components = EXCLUDED.components;"
        )
    for product in products:
        statements.append(
            "INSERT INTO cleaning_products (id, sku, name, category, brand, description, unit, presentation, content_quantity, content_unit, purchase_price, sale_price, supplier, sanitary_registration, active, metadata) VALUES "
            f"({sql_string(product['id'])}, {sql_string(product['sku'])}, {sql_string(product['name'])}, {sql_string(product['category'])}, {sql_nullable_string(product['brand'])}, {sql_nullable_string(product['description'])}, {sql_string(product['unit'])}, {sql_nullable_string(product['presentation'])}, {sql_nullable_number(product['content_quantity'])}, {sql_nullable_string(product['content_unit'])}, {sql_number(product['purchase_price'])}, {sql_nullable_number(product['sale_price'])}, {sql_nullable_string(product['supplier'])}, {sql_nullable_string(product['sanitary_registration'])}, {'TRUE' if product['active'] else 'FALSE'}, {sql_json(product['metadata'])}) "
            "ON CONFLICT (id) DO UPDATE SET sku = EXCLUDED.sku, name = EXCLUDED.name, category = EXCLUDED.category, brand = EXCLUDED.brand, description = EXCLUDED.description, unit = EXCLUDED.unit, presentation = EXCLUDED.presentation, content_quantity = EXCLUDED.content_quantity, content_unit = EXCLUDED.content_unit, purchase_price = EXCLUDED.purchase_price, sale_price = EXCLUDED.sale_price, supplier = EXCLUDED.supplier, sanitary_registration = EXCLUDED.sanitary_registration, active = EXCLUDED.active, metadata = EXCLUDED.metadata, updated_at = NOW();"
        )
    for relation in relations:
        statements.append(
            "INSERT INTO apu_cleaning_products (id, apu_id, product_id, consumption_per_unit, unit, waste_factor, unit_price_snapshot, metadata) VALUES "
            f"({sql_string(relation['id'])}, {sql_string(relation['apu_id'])}, {sql_string(relation['product_id'])}, {sql_number(relation['consumption_per_unit'])}, {sql_string(relation['unit'])}, {sql_number(relation['waste_factor'])}, {sql_number(relation['unit_price_snapshot'])}, {sql_json(relation['metadata'])}) "
            "ON CONFLICT (id) DO UPDATE SET apu_id = EXCLUDED.apu_id, product_id = EXCLUDED.product_id, consumption_per_unit = EXCLUDED.consumption_per_unit, unit = EXCLUDED.unit, waste_factor = EXCLUDED.waste_factor, unit_price_snapshot = EXCLUDED.unit_price_snapshot, metadata = EXCLUDED.metadata, updated_at = NOW();"
        )
    statements.append(
        "INSERT INTO budgets (id, project_id, name, version, status, totals, settings) VALUES "
        f"({sql_string(budget['id'])}, {sql_string(budget['project_id'])}, {sql_string(budget['name'])}, {budget['version']}, {sql_string(budget['status'])}, {sql_json(budget['totals'])}, {sql_json(budget['settings'])}) "
        "ON CONFLICT (id) DO UPDATE SET project_id = EXCLUDED.project_id, name = EXCLUDED.name, version = EXCLUDED.version, status = EXCLUDED.status, totals = EXCLUDED.totals, settings = EXCLUDED.settings;"
    )
    for item in items:
        statements.append(
            "INSERT INTO budget_items (id, budget_id, apu_id, quantity, unit_price, subtotal) VALUES "
            f"({sql_string(item['id'])}, {sql_string(item['budget_id'])}, {sql_string(item['apu_id'])}, {sql_number(item['quantity'])}, {sql_number(item['unit_price'])}, {sql_number(item['subtotal'])}) "
            "ON CONFLICT (id) DO UPDATE SET budget_id = EXCLUDED.budget_id, apu_id = EXCLUDED.apu_id, quantity = EXCLUDED.quantity, unit_price = EXCLUDED.unit_price, subtotal = EXCLUDED.subtotal;"
        )
    statements.append("COMMIT;")
    return "\n".join(statements) + "\n"


def build_cleanup_sql(*, include_products: bool = True) -> str:
    item_ids = ", ".join(sql_string(item_id) for item_id in CONTROLLED_ITEM_IDS)
    apu_ids = ", ".join(sql_string(apu_id) for apu_id in CONTROLLED_APU_IDS)
    statements = ["BEGIN;"]
    if include_products:
        relation_ids = ", ".join(sql_string(relation_id) for relation_id in CONTROLLED_RELATION_IDS)
        product_ids = ", ".join(sql_string(product_id) for product_id in CONTROLLED_PRODUCT_IDS)
        statements.append(f"DELETE FROM apu_cleaning_products WHERE id IN ({relation_ids});")
    statements.append(f"DELETE FROM budget_items WHERE id IN ({item_ids});")
    statements.append(
        f"DELETE FROM budgets WHERE id = {sql_string(CONTROLLED_BUDGET_ID)} "
        f"AND NOT EXISTS (SELECT 1 FROM budget_items WHERE budget_id = {sql_string(CONTROLLED_BUDGET_ID)});"
    )
    if include_products:
        statements.append(
            f"DELETE FROM apus WHERE id IN ({apu_ids}) "
            "AND NOT EXISTS (SELECT 1 FROM budget_items WHERE budget_items.apu_id = apus.id) "
            "AND NOT EXISTS (SELECT 1 FROM apu_cleaning_products WHERE apu_cleaning_products.apu_id = apus.id);"
        )
    else:
        statements.append(
            f"DELETE FROM apus WHERE id IN ({apu_ids}) "
            "AND NOT EXISTS (SELECT 1 FROM budget_items WHERE budget_items.apu_id = apus.id);"
        )
    if include_products:
        statements.append(
            f"DELETE FROM cleaning_products WHERE id IN ({product_ids}) "
            "AND NOT EXISTS (SELECT 1 FROM apu_cleaning_products WHERE apu_cleaning_products.product_id = cleaning_products.id);"
        )
    statements.extend(
        [
            f"DELETE FROM projects WHERE id = {sql_string(CONTROLLED_PROJECT_ID)} "
            f"AND NOT EXISTS (SELECT 1 FROM budgets WHERE project_id = {sql_string(CONTROLLED_PROJECT_ID)});",
            f"DELETE FROM clients WHERE id = {sql_string(CONTROLLED_CLIENT_ID)} "
            f"AND NOT EXISTS (SELECT 1 FROM projects WHERE client_id = {sql_string(CONTROLLED_CLIENT_ID)});",
            "COMMIT;",
        ]
    )
    return "\n".join(statements) + "\n"


def status() -> None:
    validate_connection()
    validate_schema()
    result = run_psql(
        f"""
        SELECT current_database(),
          EXISTS (SELECT 1 FROM clients WHERE id = {sql_string(CONTROLLED_CLIENT_ID)}),
          EXISTS (SELECT 1 FROM projects WHERE id = {sql_string(CONTROLLED_PROJECT_ID)}),
          EXISTS (SELECT 1 FROM budgets WHERE id = {sql_string(CONTROLLED_BUDGET_ID)}),
          (SELECT COUNT(*) FROM apus WHERE id IN ({', '.join(sql_string(value) for value in CONTROLLED_APU_IDS)})),
          (SELECT COUNT(*) FROM budget_items WHERE id IN ({', '.join(sql_string(value) for value in CONTROLLED_ITEM_IDS)})),
          COALESCE((SELECT SUM(subtotal) FROM budget_items WHERE budget_id = {sql_string(CONTROLLED_BUDGET_ID)}), 0),
          COALESCE((SELECT (totals->>'grandTotal')::numeric FROM budgets WHERE id = {sql_string(CONTROLLED_BUDGET_ID)}), 0);
        """,
        tuples_only=True,
    )
    fields = [field.strip() for field in result.split("|")]
    if len(fields) != 8:
        raise DemoDataError("La consulta de status devolvió un formato inesperado.")
    database, client, project, budget, apu_count, item_count, direct_total, grand_total = fields
    print(f"database: {database}")
    print(f"client {CONTROLLED_CLIENT_ID}: {'present' if client == 't' else 'absent'}")
    print(f"project {CONTROLLED_PROJECT_ID}: {'present' if project == 't' else 'absent'}")
    print(f"budget {CONTROLLED_BUDGET_ID}: {'present' if budget == 't' else 'absent'}")
    print(f"controlled APUs: {apu_count}/{len(CONTROLLED_APU_IDS)}")
    print(f"controlled budget items: {item_count}/{len(CONTROLLED_ITEM_IDS)}")
    print(f"direct total: USD {direct_total}")
    print(f"stored grand total: USD {grand_total}")
    product_state = product_schema_state()
    if product_state == "complete":
        product_result = run_psql(
            f"""
            SELECT
              (SELECT COUNT(*) FROM cleaning_products WHERE id IN ({', '.join(sql_string(value) for value in CONTROLLED_PRODUCT_IDS)})),
              (SELECT COUNT(*) FROM apu_cleaning_products WHERE id IN ({', '.join(sql_string(value) for value in CONTROLLED_RELATION_IDS)}));
            """,
            tuples_only=True,
        )
        product_fields = [field.strip() for field in product_result.split("|")]
        if len(product_fields) != 2:
            raise DemoDataError("La consulta de productos demo devolvió un formato inesperado.")
        print(f"Productos demo: {product_fields[0]}")
        print(f"Relaciones APU-producto: {product_fields[1]}")
    else:
        print("Productos demo: esquema no aplicado (migración 003 pendiente)")
        print("Relaciones APU-producto: esquema no aplicado (migración 003 pendiente)")


def start() -> None:
    validate_connection()
    validate_schema()
    validate_product_schema()
    run_psql(build_start_sql())
    print("Demo data created/updated in a single transaction.")
    status()


def cleanup() -> None:
    validate_connection()
    validate_schema()
    product_state = product_schema_state()
    run_psql(build_cleanup_sql(include_products=product_state == "complete"))
    print("Controlled demo data removed; users, roles, and unrelated rows were not targeted.")
    status()


def run_lifecycle() -> None:
    start()
    print("Demo data is active. Press Ctrl+C to clean only the controlled demo IDs.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping demo lifecycle...")
        cleanup()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Gestiona datos demo controlados para PostgreSQL.")
    parser.add_argument("command", choices=("start", "status", "cleanup", "run"))
    return parser.parse_args()


def main() -> int:
    try:
        args = parse_args()
        if args.command == "start":
            start()
        elif args.command == "status":
            status()
        elif args.command == "cleanup":
            cleanup()
        else:
            run_lifecycle()
        return 0
    except (DemoDataError, ValueError, subprocess.SubprocessError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
