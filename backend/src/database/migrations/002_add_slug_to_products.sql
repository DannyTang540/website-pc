-- Migration: Add slug column to products table
-- This migration adds a slug column to the products table for SEO-friendly URLs

-- Add slug column with a unique constraint
ALTER TABLE products 
ADD COLUMN slug VARCHAR(255) UNIQUE AFTER name;

-- Create an index on the slug column for faster lookups
CREATE INDEX idx_products_slug ON products(slug);

-- If you have existing products, you can generate slugs for them
-- This is a simple example - adjust the slug generation as needed
-- UPDATE products 
-- SET slug = LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '--', '-'), '--', '-'))
-- WHERE slug IS NULL;
