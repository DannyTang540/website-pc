-- Migration: Add product variants, attributes, and related tables
-- Created: 2024-12-31

-- 1. First, add new columns to products table
ALTER TABLE products 
ADD COLUMN sku VARCHAR(100) UNIQUE NULL AFTER id,
ADD COLUMN is_virtual BOOLEAN DEFAULT FALSE,
ADD COLUMN is_downloadable BOOLEAN DEFAULT FALSE,
ADD COLUMN weight DECIMAL(10,3) NULL,
ADD COLUMN length DECIMAL(10,2) NULL,
ADD COLUMN width DECIMAL(10,2) NULL,
ADD COLUMN height DECIMAL(10,2) NULL,
ADD INDEX idx_products_sku (sku);

-- 2. Create product_attributes table
CREATE TABLE IF NOT EXISTS product_attributes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('text', 'number', 'select', 'multiselect', 'boolean') NOT NULL,
    is_filterable BOOLEAN DEFAULT FALSE,
    is_required BOOLEAN DEFAULT FALSE,
    is_variant_attribute BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_attribute_code (code),
    INDEX idx_attribute_filterable (is_filterable)
);

-- 3. Create attribute_values table
CREATE TABLE IF NOT EXISTS attribute_values (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    attribute_id VARCHAR(36) NOT NULL,
    value VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (attribute_id) REFERENCES product_attributes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attribute_value (attribute_id, value),
    INDEX idx_attribute_value (attribute_id, value)
);

-- 4. Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id VARCHAR(36) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100) NULL,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2) NULL,
    cost_price DECIMAL(10,2) NULL,
    stock_quantity INT DEFAULT 0,
    stock_status ENUM('in_stock', 'out_of_stock', 'preorder') DEFAULT 'in_stock',
    weight DECIMAL(10,3) NULL,
    length DECIMAL(10,2) NULL,
    width DECIMAL(10,2) NULL,
    height DECIMAL(10,2) NULL,
    image VARCHAR(255) NULL,
    is_default BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_variant_product (product_id),
    INDEX idx_variant_sku (sku),
    INDEX idx_variant_stock (stock_status, stock_quantity)
);

-- 5. Create product_variant_attributes table
CREATE TABLE IF NOT EXISTS product_variant_attributes (
    variant_id VARCHAR(36) NOT NULL,
    attribute_id VARCHAR(36) NOT NULL,
    attribute_value_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (variant_id, attribute_id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES product_attributes(id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_value_id) REFERENCES attribute_values(id) ON DELETE CASCADE,
    INDEX idx_pva_variant (variant_id),
    INDEX idx_pva_attribute (attribute_id, attribute_value_id)
);

-- 6. Create product_attributes_mapping table
CREATE TABLE IF NOT EXISTS product_attributes_mapping (
    product_id VARCHAR(36) NOT NULL,
    attribute_id VARCHAR(36) NOT NULL,
    attribute_value_id VARCHAR(36) NULL,
    custom_value TEXT NULL,
    is_variant_attribute BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, attribute_id, COALESCE(attribute_value_id, '')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES product_attributes(id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_value_id) REFERENCES attribute_values(id) ON DELETE CASCADE,
    INDEX idx_pam_product (product_id),
    INDEX idx_pam_attribute (attribute_id)
);

-- 7. Create inventory_logs table
CREATE TABLE IF NOT EXISTS inventory_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    product_id VARCHAR(36) NULL,
    variant_id VARCHAR(36) NULL,
    order_id VARCHAR(36) NULL,
    quantity_change INT NOT NULL COMMENT 'Số lượng thay đổi (dương là nhập, âm là xuất)',
    stock_after INT NOT NULL COMMENT 'Số lượng tồn sau thay đổi',
    type ENUM('purchase', 'sale', 'return', 'adjustment', 'damaged', 'other') NOT NULL,
    reference_id VARCHAR(36) NULL COMMENT 'ID tham chiếu (đơn hàng, phiếu nhập, ...)',
    reference_type VARCHAR(50) NULL COMMENT 'Loại tham chiếu',
    notes TEXT NULL,
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_invlog_product (product_id),
    INDEX idx_invlog_variant (variant_id),
    INDEX idx_invlog_date (created_at),
    INDEX idx_invlog_reference (reference_type, reference_id)
);

-- 8. Update order_items table to support variants
ALTER TABLE order_items 
ADD COLUMN variant_id VARCHAR(36) NULL AFTER product_id,
ADD COLUMN variant_attributes JSON NULL,
ADD FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
ADD INDEX idx_order_item_variant (variant_id);

-- 9. Create triggers for SKU generation
DELIMITER //
CREATE TRIGGER IF NOT EXISTS before_product_insert
BEFORE INSERT ON products
FOR EACH ROW
BEGIN
    IF NEW.sku IS NULL THEN
        SET NEW.sku = CONCAT('PROD-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0'));
    END IF;
END//

CREATE TRIGGER IF NOT EXISTS before_variant_insert
BEFORE INSERT ON product_variants
FOR EACH ROW
BEGIN
    DECLARE product_sku VARCHAR(100);
    
    IF NEW.sku IS NULL THEN
        -- Lấy SKU của sản phẩm gốc
        SELECT COALESCE(sku, CONCAT('PROD-', id)) INTO product_sku FROM products WHERE id = NEW.product_id;
        SET NEW.sku = CONCAT(product_sku, '-', DATE_FORMAT(NOW(), '%H%i%s'), FLOOR(RAND() * 100));
    END IF;
END//
DELIMITER ;

-- 10. Create view for product variants
CREATE OR REPLACE VIEW vw_product_variants AS
SELECT 
    pv.*,
    p.name AS product_name,
    p.slug AS product_slug,
    p.description AS product_description,
    p.category_id,
    c.name AS category_name,
    p.brand,
    pv.stock_quantity AS variant_stock,
    pv.price AS variant_price,
    pv.original_price AS variant_original_price,
    pv.sku AS variant_sku,
    pv.is_default,
    pv.status AS variant_status,
    p.status AS product_status
FROM 
    product_variants pv
JOIN 
    products p ON pv.product_id = p.id
LEFT JOIN 
    categories c ON p.category_id = c.id;

-- 11. Create view for product attributes
CREATE OR REPLACE VIEW vw_product_attributes AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    pa.id AS attribute_id,
    pa.name AS attribute_name,
    pa.code AS attribute_code,
    pa.type AS attribute_type,
    av.id AS value_id,
    COALESCE(av.value, pam.custom_value) AS attribute_value,
    pam.is_variant_attribute
FROM 
    products p
JOIN 
    product_attributes_mapping pam ON p.id = pam.product_id
JOIN 
    product_attributes pa ON pam.attribute_id = pa.id
LEFT JOIN 
    attribute_values av ON pam.attribute_value_id = av.id
ORDER BY 
    p.id, pa.display_order, av.display_order;

-- 12. Create view for inventory status
CREATE OR REPLACE VIEW vw_inventory_status AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.sku AS product_sku,
    pv.id AS variant_id,
    pv.sku AS variant_sku,
    pv.stock_quantity,
    pv.stock_status,
    pv.price,
    pv.cost_price,
    (SELECT SUM(quantity_change) 
     FROM inventory_logs 
     WHERE variant_id = pv.id 
     AND type = 'purchase' 
     AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS purchased_last_30_days,
    (SELECT SUM(quantity_change) 
     FROM inventory_logs 
     WHERE variant_id = pv.id 
     AND type = 'sale' 
     AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS sold_last_30_days
FROM 
    products p
LEFT JOIN 
    product_variants pv ON p.id = pv.product_id
WHERE 
    pv.id IS NOT NULL
ORDER BY 
    p.name, pv.sku;

-- 13. Insert default attributes for PC components
INSERT INTO product_attributes (id, name, code, type, is_filterable, is_required, is_variant_attribute, display_order) VALUES
(UUID(), 'CPU', 'cpu', 'select', TRUE, TRUE, TRUE, 1),
(UUID(), 'RAM', 'ram', 'select', TRUE, TRUE, TRUE, 2),
(UUID(), 'Ổ cứng', 'storage', 'select', TRUE, TRUE, TRUE, 3),
(UUID(), 'Card đồ họa', 'gpu', 'select', TRUE, FALSE, TRUE, 4),
(UUID(), 'Màu sắc', 'color', 'select', TRUE, FALSE, TRUE, 5),
(UUID(), 'Kích thước màn hình', 'screen_size', 'select', TRUE, FALSE, TRUE, 6),
(UUID(), 'Hệ điều hành', 'os', 'select', TRUE, FALSE, FALSE, 7),
(UUID(), 'Thương hiệu', 'brand', 'select', TRUE, TRUE, FALSE, 8),
(UUID(), 'Bảo hành', 'warranty', 'text', FALSE, FALSE, FALSE, 9);

-- 14. Create a procedure to update product stock based on variants
DELIMITER //
CREATE PROCEDURE update_product_stock(IN p_product_id VARCHAR(36))
BEGIN
    DECLARE total_stock INT;
    DECLARE has_variants BOOLEAN;
    
    -- Check if product has variants
    SELECT COUNT(*) > 0 INTO has_variants 
    FROM product_variants 
    WHERE product_id = p_product_id;
    
    IF has_variants THEN
        -- Update product stock based on variants
        SELECT COALESCE(SUM(stock_quantity), 0) INTO total_stock
        FROM product_variants
        WHERE product_id = p_product_id
        AND status = 'active';
        
        UPDATE products
        SET 
            stock_quantity = total_stock,
            in_stock = (total_stock > 0),
            updated_at = NOW()
        WHERE id = p_product_id;
    END IF;
END//
DELIMITER ;

-- 15. Create a trigger to update product stock when variant stock changes
DELIMITER //
CREATE TRIGGER after_variant_stock_update
AFTER UPDATE ON product_variants
FOR EACH ROW
BEGIN
    IF OLD.stock_quantity != NEW.stock_quantity OR OLD.status != NEW.status THEN
        CALL update_product_stock(NEW.product_id);
    END IF;
END//
DELIMITER ;

-- 16. Create a trigger to update product stock when variant is inserted
DELIMITER //
CREATE TRIGGER after_variant_insert
AFTER INSERT ON product_variants
FOR EACH ROW
BEGIN
    CALL update_product_stock(NEW.product_id);
END//
DELIMITER ;

-- 17. Create a trigger to update product stock when variant is deleted
DELIMITER //
CREATE TRIGGER after_variant_delete
AFTER DELETE ON product_variants
FOR EACH ROW
BEGIN
    CALL update_product_stock(OLD.product_id);
END//
DELIMITER ;
