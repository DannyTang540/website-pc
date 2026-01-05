-- Migration: Add tags column to products table
-- This migration adds a tags column to store product tags as a JSON array

-- Add tags column with a JSON type and default empty array
ALTER TABLE products 
ADD COLUMN tags JSON DEFAULT (JSON_ARRAY()) COMMENT 'Array of tag strings' 
AFTER slug;

-- Create a generated column for full-text search on tags if needed
-- ALTER TABLE products
-- ADD COLUMN tags_search TEXT GENERATED ALWAYS AS (
--   JSON_UNQUOTE(JSON_EXTRACT(tags, '$'))
-- ) STORED;

-- Create an index for better performance when searching tags
-- CREATE INDEX idx_products_tags ON products((JSON_CONTAINS(tags, '[]')));
