BEGIN;

DROP INDEX IF EXISTS apu_cleaning_products_product_id_idx;
DROP INDEX IF EXISTS cleaning_products_name_idx;
DROP INDEX IF EXISTS cleaning_products_active_category_idx;

DROP TABLE IF EXISTS apu_cleaning_products;
DROP TABLE IF EXISTS cleaning_products;

COMMIT;
