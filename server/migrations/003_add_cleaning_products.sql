BEGIN;

CREATE TABLE IF NOT EXISTS cleaning_products (
  id VARCHAR NOT NULL,
  sku VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  brand VARCHAR,
  description TEXT,
  unit VARCHAR NOT NULL,
  presentation VARCHAR,
  content_quantity NUMERIC,
  content_unit VARCHAR,
  purchase_price NUMERIC NOT NULL,
  sale_price NUMERIC,
  supplier VARCHAR,
  sanitary_registration VARCHAR,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cleaning_products_pkey PRIMARY KEY (id),
  CONSTRAINT cleaning_products_sku_key UNIQUE (sku),
  CONSTRAINT cleaning_products_id_not_blank CHECK (btrim(id) <> ''),
  CONSTRAINT cleaning_products_sku_not_blank CHECK (btrim(sku) <> ''),
  CONSTRAINT cleaning_products_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT cleaning_products_category_not_blank CHECK (btrim(category) <> ''),
  CONSTRAINT cleaning_products_unit_not_blank CHECK (btrim(unit) <> ''),
  CONSTRAINT chk_cleaning_products_content_quantity_positive
    CHECK (content_quantity IS NULL OR content_quantity > 0),
  CONSTRAINT chk_cleaning_products_content_unit_not_blank
    CHECK (content_unit IS NULL OR btrim(content_unit) <> ''),
  CONSTRAINT chk_cleaning_products_content_pair
    CHECK ((content_quantity IS NULL AND content_unit IS NULL)
      OR (content_quantity IS NOT NULL AND content_unit IS NOT NULL)),
  CONSTRAINT chk_cleaning_products_purchase_price_nonnegative
    CHECK (purchase_price >= 0),
  CONSTRAINT chk_cleaning_products_sale_price_nonnegative
    CHECK (sale_price IS NULL OR sale_price >= 0),
  CONSTRAINT chk_cleaning_products_metadata_object
    CHECK (jsonb_typeof(metadata) = 'object')
);

-- Keeps this migration compatible with an earlier unexecuted/applied draft
-- that did not yet include the optional catalogue reference price.
ALTER TABLE cleaning_products
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_cleaning_products_sale_price_nonnegative'
      AND conrelid = 'public.cleaning_products'::regclass
  ) THEN
    ALTER TABLE cleaning_products
      ADD CONSTRAINT chk_cleaning_products_sale_price_nonnegative
      CHECK (sale_price IS NULL OR sale_price >= 0);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS apu_cleaning_products (
  id VARCHAR NOT NULL,
  apu_id VARCHAR NOT NULL,
  product_id VARCHAR NOT NULL,
  consumption_per_unit NUMERIC NOT NULL,
  unit VARCHAR NOT NULL,
  waste_factor NUMERIC NOT NULL DEFAULT 0,
  unit_price_snapshot NUMERIC NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT apu_cleaning_products_pkey PRIMARY KEY (id),
  CONSTRAINT fk_apu_cleaning_products_apu
    FOREIGN KEY (apu_id)
    REFERENCES apus (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_apu_cleaning_products_product
    FOREIGN KEY (product_id)
    REFERENCES cleaning_products (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT uq_apu_cleaning_products_apu_product UNIQUE (apu_id, product_id),
  CONSTRAINT apu_cleaning_products_id_not_blank CHECK (btrim(id) <> ''),
  CONSTRAINT apu_cleaning_products_unit_not_blank CHECK (btrim(unit) <> ''),
  CONSTRAINT chk_apu_cleaning_products_consumption_nonnegative
    CHECK (consumption_per_unit >= 0),
  CONSTRAINT chk_apu_cleaning_products_waste_factor_range
    CHECK (waste_factor >= 0 AND waste_factor <= 1),
  CONSTRAINT chk_apu_cleaning_products_unit_price_nonnegative
    CHECK (unit_price_snapshot >= 0),
  CONSTRAINT chk_apu_cleaning_products_metadata_object
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS cleaning_products_active_category_idx
  ON cleaning_products (active, category);

CREATE INDEX IF NOT EXISTS cleaning_products_name_idx
  ON cleaning_products (LOWER(name));

CREATE INDEX IF NOT EXISTS apu_cleaning_products_product_id_idx
  ON apu_cleaning_products (product_id);

COMMIT;
