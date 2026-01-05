-- Migration 001: Thêm bảng giỏ hàng và cập nhật bảng đơn hàng
-- Sửa cho tương thích với MySQL 5.7 (không dùng DEFAULT (UUID()))

-- Đảm bảo sử dụng database đúng
USE pc_store;

-- Thêm bảng carts nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS carts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    total DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_cart (user_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- Thêm bảng cart_items nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS cart_items (
    id VARCHAR(36) PRIMARY KEY,
    cart_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    name VARCHAR(255) NOT NULL,
    image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_cart_product (cart_id, product_id),
    
    INDEX idx_cart_id (cart_id),
    INDEX idx_product_id (product_id)
);

-- Cập nhật bảng orders (nếu tồn tại)
SET @orders_exists = (SELECT COUNT(*) FROM information_schema.tables 
                     WHERE table_schema = 'pc_store' AND table_name = 'orders');

SET @alter_sql = '';

-- Chỉ thêm cột nếu bảng orders tồn tại
IF @orders_exists > 0 THEN
    -- Cập nhật bảng orders nếu cần thêm cột mới
    SET @alter_sql = CONCAT(@alter_sql, 
        'ALTER TABLE orders ',
        'ADD COLUMN IF NOT EXISTS city VARCHAR(100), ',
        'ADD COLUMN IF NOT EXISTS district VARCHAR(100), ',
        'ADD COLUMN IF NOT EXISTS ward VARCHAR(100), ',
        'ADD COLUMN IF NOT EXISTS email VARCHAR(255), ',
        'ADD COLUMN IF NOT EXISTS full_name VARCHAR(255), ',
        'ADD COLUMN IF NOT EXISTS payment_status ENUM(\'pending\', \'paid\', \'failed\', \'refunded\') DEFAULT \'pending\', ',
        'ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE, ',
        'ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP NULL, ',
        'ADD COLUMN IF NOT EXISTS is_delivered BOOLEAN DEFAULT FALSE, ',
        'ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP NULL, ',
        'ADD COLUMN IF NOT EXISTS order_number VARCHAR(50); '
    );
END IF;

-- Thực thi câu lệnh ALTER nếu có
IF LENGTH(@alter_sql) > 0 THEN
    PREPARE stmt FROM @alter_sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END IF;

-- Tạo order_number nếu chưa có (nếu bảng orders tồn tại)
IF @orders_exists > 0 THEN
    -- Đếm số lượng orders chưa có order_number
    SET @count_null = (SELECT COUNT(*) FROM orders WHERE order_number IS NULL);
    
    IF @count_null > 0 THEN
        -- Tạo order_number cho các đơn hàng chưa có
        UPDATE orders 
        SET order_number = CONCAT('ORD-', DATE_FORMAT(created_at, '%Y%m%d'), '-', LPAD(SUBSTRING(id, 1, 8), 8, '0'))
        WHERE order_number IS NULL;
    END IF;
    
    -- Thêm unique constraint cho order_number nếu chưa có
    IF NOT EXISTS (SELECT * FROM information_schema.table_constraints 
                   WHERE table_schema = 'pc_store' 
                   AND table_name = 'orders' 
                   AND constraint_name = 'idx_order_number_unique') THEN
        ALTER TABLE orders 
        ADD UNIQUE INDEX idx_order_number_unique (order_number);
    END IF;
    
    -- Thêm các index cần thiết nếu chưa có
    IF NOT EXISTS (SELECT * FROM information_schema.statistics 
                   WHERE table_schema = 'pc_store' 
                   AND table_name = 'orders' 
                   AND index_name = 'idx_payment_status') THEN
        ALTER TABLE orders ADD INDEX idx_payment_status (payment_status);
    END IF;
    
    IF NOT EXISTS (SELECT * FROM information_schema.statistics 
                   WHERE table_schema = 'pc_store' 
                   AND table_name = 'orders' 
                   AND index_name = 'idx_order_number') THEN
        ALTER TABLE orders ADD INDEX idx_order_number (order_number);
    END IF;
    
    IF NOT EXISTS (SELECT * FROM information_schema.statistics 
                   WHERE table_schema = 'pc_store' 
                   AND table_name = 'orders' 
                   AND index_name = 'idx_is_delivered') THEN
        ALTER TABLE orders ADD INDEX idx_is_delivered (is_delivered);
    END IF;
END IF;

-- Cập nhật bảng order_items (nếu tồn tại)
SET @order_items_exists = (SELECT COUNT(*) FROM information_schema.tables 
                          WHERE table_schema = 'pc_store' AND table_name = 'order_items');

IF @order_items_exists > 0 THEN
    -- Thêm cột name và image nếu chưa có
    IF NOT EXISTS (SELECT * FROM information_schema.columns 
                   WHERE table_schema = 'pc_store' 
                   AND table_name = 'order_items' 
                   AND column_name = 'name') THEN
        ALTER TABLE order_items 
        ADD COLUMN name VARCHAR(255) NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT * FROM information_schema.columns 
                   WHERE table_schema = 'pc_store' 
                   AND table_name = 'order_items' 
                   AND column_name = 'image') THEN
        ALTER TABLE order_items 
        ADD COLUMN image VARCHAR(500);
    END IF;
END IF;

-- Thêm trigger để tự động tạo UUID cho các bảng (MySQL 5.7 không hỗ trợ DEFAULT (UUID()))
DELIMITER $$

-- Trigger cho bảng carts
CREATE TRIGGER IF NOT EXISTS before_insert_carts
BEFORE INSERT ON carts
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END$$

-- Trigger cho bảng cart_items
CREATE TRIGGER IF NOT EXISTS before_insert_cart_items
BEFORE INSERT ON cart_items
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = UUID();
    END IF;
END$$

DELIMITER ;

-- Tạo bảng migration_history nếu chưa tồn tại (để theo dõi các migration đã chạy)
CREATE TABLE IF NOT EXISTS migration_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_migration (migration_name)
);

-- Ghi lại migration này đã chạy
INSERT IGNORE INTO migration_history (migration_name) VALUES ('001_add_cart_tables.sql');