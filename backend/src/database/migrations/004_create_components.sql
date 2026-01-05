-- Migration: 004_create_components.sql
-- Tạo bảng components nếu chưa tồn tại
CREATE DATABASE IF NOT EXISTS pc_store;
USE pc_store;

CREATE TABLE IF NOT EXISTS components (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    attributes JSON,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
