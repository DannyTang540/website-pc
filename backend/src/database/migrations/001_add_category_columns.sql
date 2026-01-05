-- Add missing columns to categories table
-- Migration: Add slug, parent_id, status, updated_at columns to categories table

ALTER TABLE categories 
ADD COLUMN slug VARCHAR(255) UNIQUE AFTER name,
ADD COLUMN parent_id VARCHAR(36) NULL AFTER description,
ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active' AFTER parent_id,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Add foreign key constraint for parent_id
ALTER TABLE categories 
ADD CONSTRAINT fk_category_parent 
FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Create index for slug
CREATE INDEX idx_categories_slug ON categories(slug);

-- Create index for parent_id
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Create index for status
CREATE INDEX idx_categories_status ON categories(status);

-- Update existing categories to have slugs and status
UPDATE categories 
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), 'đ', 'd')), 
    status = 'active' 
WHERE slug IS NULL;
