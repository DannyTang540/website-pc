-- Migration: 005_add_status_to_products.sql
-- Ensure products table has a `status` column (active/inactive) and index

CREATE DATABASE IF NOT EXISTS pc_store;
USE pc_store;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS status ENUM('active','inactive') DEFAULT 'active' AFTER featured;

-- Ensure index exists for status
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Backfill existing rows to active if NULL
UPDATE products SET status = 'active' WHERE status IS NULL;
