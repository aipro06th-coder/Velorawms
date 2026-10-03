-- =========================================================================
-- WAREHOUSE INVENTORY MANAGEMENT SYSTEM (WMS)
-- Database Schema for Supabase PostgreSQL
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FINISHED PRODUCTS TABLE
-- Strictly 4 fields as requested: Product ID, Product Name, Category, Status
-- Removed: SKU, Brand, Description, Created_at, Updated_at
DROP TABLE IF EXISTS stock_adjustments CASCADE;
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS product_sizes CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS raw_materials CASCADE;
DROP TABLE IF EXISTS stickers CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Discontinued'))
);

-- 2. PRODUCT SIZES TABLE (Small, Medium, Large)
-- Manages bottle configurations, packing, pricing, and reorder levels per size
CREATE TABLE product_sizes (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size_name VARCHAR(50) NOT NULL CHECK (size_name IN ('Small', 'Medium', 'Large')),
    bottles_per_carton INT NOT NULL DEFAULT 24 CHECK (bottles_per_carton > 0),
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (purchase_price >= 0),
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= 0),
    minimum_stock INT NOT NULL DEFAULT 50 CHECK (minimum_stock >= 0),
    reorder_level INT NOT NULL DEFAULT 100 CHECK (reorder_level >= 0),
    CONSTRAINT unique_product_size UNIQUE (product_id, size_name)
);

-- 3. INVENTORY TABLE
-- Tracks real-time stock of bottles, cartons, stickers, damages, and returns
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_size_id INT NOT NULL UNIQUE REFERENCES product_sizes(id) ON DELETE CASCADE,
    available_bottles INT NOT NULL DEFAULT 0 CHECK (available_bottles >= 0),
    cartons INT NOT NULL DEFAULT 0 CHECK (cartons >= 0),
    stickers INT NOT NULL DEFAULT 0 CHECK (stickers >= 0),
    damaged_bottles INT NOT NULL DEFAULT 0 CHECK (damaged_bottles >= 0),
    damaged_cartons INT NOT NULL DEFAULT 0 CHECK (damaged_cartons >= 0),
    damaged_stickers INT NOT NULL DEFAULT 0 CHECK (damaged_stickers >= 0),
    total_sold INT NOT NULL DEFAULT 0 CHECK (total_sold >= 0),
    total_returned INT NOT NULL DEFAULT 0 CHECK (total_returned >= 0),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RAW MATERIALS TABLE
-- Supports liquid materials (Liters) and TSP (Bori + KG at 25 KG per Bori)
CREATE TABLE raw_materials (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL CHECK (unit IN ('Liters', 'Bori + KG')),
    current_liters NUMERIC(12, 2) DEFAULT 0.00 CHECK (current_liters >= 0),
    bori_count INT DEFAULT 0 CHECK (bori_count >= 0),
    loose_kg NUMERIC(12, 2) DEFAULT 0.00 CHECK (loose_kg >= 0),
    kg_per_bori NUMERIC(12, 2) DEFAULT 25.00 CHECK (kg_per_bori > 0),
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    minimum_stock NUMERIC(12, 2) NOT NULL DEFAULT 100.00 CHECK (minimum_stock >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Adequate' CHECK (status IN ('Adequate', 'Low Stock', 'Critical'))
);

-- 5. STICKERS & LABELS INVENTORY TABLE (Independent category)
CREATE TABLE stickers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    size VARCHAR(50),
    unit VARCHAR(50) NOT NULL DEFAULT 'Pcs',
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    damaged_quantity INT NOT NULL DEFAULT 0 CHECK (damaged_quantity >= 0),
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (purchase_price >= 0),
    minimum_stock INT NOT NULL DEFAULT 100 CHECK (minimum_stock >= 0),
    supplier VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'In Stock' CHECK (status IN ('In Stock', 'Low Stock', 'Out of Stock'))
);

-- 6. SUPPLIERS DIRECTORY
CREATE TABLE suppliers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(100),
    material_supplied VARCHAR(255),
    rating NUMERIC(3, 1) DEFAULT 4.5
);

-- 7. INVENTORY TRANSACTIONS AUDIT LEDGER
CREATE TABLE inventory_transactions (
    id VARCHAR(50) PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('Stock In', 'Stock Out', 'Adjustment', 'Damage', 'Return')),
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('Finished Product', 'Raw Material', 'Stickers')),
    item_name VARCHAR(255) NOT NULL,
    size_name VARCHAR(50),
    quantity NUMERIC(12, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    reference_no VARCHAR(100),
    notes TEXT,
    performed_by VARCHAR(100) DEFAULT 'Warehouse Admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- DATABASE SECURITY POLICIES (RLS)
-- =========================================================================

-- RLS (Row Level Security) - Enable and allow read/write for demo/anon
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on products" ON products FOR ALL USING (true);

CREATE POLICY "Allow public read on product_sizes" ON product_sizes FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on product_sizes" ON product_sizes FOR ALL USING (true);

CREATE POLICY "Allow public read on inventory" ON inventory FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on inventory" ON inventory FOR ALL USING (true);

CREATE POLICY "Allow public read on raw_materials" ON raw_materials FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on raw_materials" ON raw_materials FOR ALL USING (true);

CREATE POLICY "Allow public read on stickers" ON stickers FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on stickers" ON stickers FOR ALL USING (true);
CREATE POLICY "Allow public delete on stickers" ON stickers FOR DELETE USING (true);

CREATE POLICY "Allow public read on suppliers" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on suppliers" ON suppliers FOR ALL USING (true);

CREATE POLICY "Allow public read on inventory_transactions" ON inventory_transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on inventory_transactions" ON inventory_transactions FOR ALL USING (true);

