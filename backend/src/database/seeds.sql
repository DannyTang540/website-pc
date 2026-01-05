USE pc_store;

-- CLEAN SEEDS: remove sample data
-- This file intentionally clears sample/test data without inserting defaults.
-- Run this to delete previously seeded demo data. No admin/user accounts are created here.

DELETE FROM order_items;
DELETE FROM reviews;
DELETE FROM wishlists;
DELETE FROM orders;
DELETE FROM banners;
DELETE FROM products;
DELETE FROM components;
DELETE FROM categories;
DELETE FROM users;

-- NOTES:
-- If you need to create an initial admin account, run a secure script or create the user via the admin UI.
-- To restore sample data for testing, keep a separate seed file (do not run this file).