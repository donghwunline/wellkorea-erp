-- V5: Seed initial data for development and testing
-- Migration Date: 2025-12-05
-- Purpose: Populate database with test users, roles, customers, products for Phase 2+ development

-- =====================================================================
-- ROLES (RBAC: Admin, Finance, Production, Sales)
-- =====================================================================

INSERT INTO roles (name, description)
VALUES ('ADMIN', 'System administrator with full access to all features'),
       ('FINANCE', 'Finance team with access to quotations, invoices, and financial reports'),
       ('PRODUCTION', 'Production team with access to work progress tracking'),
       ('SALES', 'Sales team with customer-specific quotation access')
ON CONFLICT (name) DO NOTHING;

-- =====================================================================
-- USERS
-- =====================================================================
-- Test users have been moved to DatabaseTestHelper for test-only usage.
-- In production environments, users should be created through the application UI
-- or via separate administrative scripts with secure password management.

-- =====================================================================
-- CUSTOMERS
-- =====================================================================

INSERT INTO customers (id, name, contact_person, phone, email, address, is_deleted)
VALUES (1, 'Samsung Electronics', 'Kim Min-jun', '02-1234-5678', 'procurement@samsung.com',
        'Seoul, Gangnam-gu, Teheran-ro 123', false),
       (2, 'Hyundai Motor Company', 'Lee Soo-jin', '02-2345-6789', 'purchasing@hyundai.com',
        'Seoul, Gangnam-gu, Yeoksam-ro 234', false),
       (3, 'LG Display', 'Park Ji-hoon', '02-3456-7890', 'supply@lgdisplay.com',
        'Seoul, Yeongdeungpo-gu, Yeoui-daero 456', false),
       (4, 'SK Hynix', 'Choi Yuna', '02-4567-8901', 'vendor@skhynix.com', 'Gyeonggi-do, Seongnam-si, Bundang-gu',
        false),
       (5, 'Doosan Heavy Industries', 'Jung Tae-yang', '02-5678-9012', 'procurement@doosan.com',
        'Seoul, Jung-gu, Sejong-daero 789', false),
       (6, 'POSCO', 'Kang Hye-won', '02-6789-0123', 'purchasing@posco.com',
        'Gyeongbuk, Pohang-si, Jigok-dong 234', false),
       (7, 'Hanwha Aerospace', 'Yoon Dong-hyun', '02-7890-1234', 'supply@hanwha.com',
        'Gyeongnam, Changwon-si, Seongsan-gu', false),
       (8, 'Korea Aerospace Industries', 'Lim Eun-ji', '055-851-1234', 'vendor@koreaaero.com',
        'Gyeongnam, Sacheon-si, Sanam-ro 78', false)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for customers table
SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));

-- =====================================================================
-- CUSTOMER ASSIGNMENTS (FR-062: Sales role customer filtering)
-- =====================================================================
-- Customer assignments have been moved to DatabaseTestHelper for test-only usage.
-- In production, customer assignments should be managed through the application UI.

-- =====================================================================
-- SUPPLIERS
-- =====================================================================

INSERT INTO suppliers (id, name, contact_person, phone, email, address, service_categories, is_active)
VALUES (1, 'Laser Cutting Solutions', 'Song Min-ho', '031-123-4567', 'sales@lasercutting.kr',
        'Gyeonggi-do, Siheung-si, Jeongwang-dong 123', ARRAY ['Laser Cutting', 'CNC Machining'], true),
       (2, 'Sheet Metal Fabricators', 'Bae Su-ji', '031-234-5678', 'info@sheetmetal.kr',
        'Gyeonggi-do, Ansan-si, Danwon-gu 234', ARRAY ['Sheet Metal', 'Welding'], true),
       (3, 'Precision Machining Co.', 'Han Ji-sung', '032-345-6789', 'contact@precisionmachining.kr',
        'Incheon, Namdong-gu, Guwol-dong 345', ARRAY ['CNC Machining', 'Milling'], true),
       (4, 'Industrial Coating Services', 'Oh Se-hoon', '031-456-7890', 'painting@coating.kr',
        'Gyeonggi-do, Bucheon-si, Ojeong-gu 456', ARRAY ['Painting', 'Surface Treatment'], true)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for suppliers table
SELECT setval('suppliers_id_seq', (SELECT MAX(id) FROM suppliers));

-- =====================================================================
-- PRODUCT TYPES
-- =====================================================================

INSERT INTO product_types (id, name, description)
VALUES (1, 'Sheet Metal Parts', 'Custom sheet metal fabrication and assembly'),
       (2, 'Machined Components', 'Precision CNC machined parts'),
       (3, 'Welded Assemblies', 'Welded structures and assemblies'),
       (4, 'Custom Enclosures', 'Electronic and industrial enclosures')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for product_types table
SELECT setval('product_types_id_seq', (SELECT MAX(id) FROM product_types));

-- =====================================================================
-- WORK PROGRESS STEP TEMPLATES
-- =====================================================================
-- Define manufacturing steps for each product type

-- Sheet Metal Parts workflow
INSERT INTO work_progress_step_templates (product_type_id, step_name, step_order, is_required)
VALUES (1, 'Design', 1, true),
       (1, 'Laser Cutting', 2, true),
       (1, 'Sheet Metal Forming', 3, true),
       (1, 'Welding', 4, false),
       (1, 'Grinding', 5, false),
       (1, 'Painting', 6, false),
       (1, 'Packaging', 7, true)
ON CONFLICT DO NOTHING;

-- Machined Components workflow
INSERT INTO work_progress_step_templates (product_type_id, step_name, step_order, is_required)
VALUES (2, 'Design', 1, true),
       (2, 'Material Preparation', 2, true),
       (2, 'CNC Milling', 3, true),
       (2, 'CNC Turning', 4, false),
       (2, 'Grinding', 5, false),
       (2, 'Surface Treatment', 6, false),
       (2, 'Quality Inspection', 7, true),
       (2, 'Packaging', 8, true)
ON CONFLICT DO NOTHING;

-- Welded Assemblies workflow
INSERT INTO work_progress_step_templates (product_type_id, step_name, step_order, is_required)
VALUES (3, 'Design', 1, true),
       (3, 'Laser Cutting', 2, true),
       (3, 'Sheet Metal Forming', 3, true),
       (3, 'Welding', 4, true),
       (3, 'Grinding', 5, true),
       (3, 'Painting', 6, false),
       (3, 'Final Assembly', 7, true),
       (3, 'Packaging', 8, true)
ON CONFLICT DO NOTHING;

-- Custom Enclosures workflow
INSERT INTO work_progress_step_templates (product_type_id, step_name, step_order, is_required)
VALUES (4, 'Design', 1, true),
       (4, 'Laser Cutting', 2, true),
       (4, 'Sheet Metal Forming', 3, true),
       (4, 'Welding', 4, true),
       (4, 'Powder Coating', 5, true),
       (4, 'Hardware Installation', 6, false),
       (4, 'Final Assembly', 7, true),
       (4, 'Packaging', 8, true)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- PRODUCTS (Catalog)
-- =====================================================================

INSERT INTO products (id, sku, name, description, product_type_id, base_unit_price, unit, is_active)
VALUES
    -- Sheet Metal Parts
    (1, 'SM-PANEL-001', 'Control Panel 300x400mm', 'Sheet metal control panel, 1.5mm thickness', 1, 45000.00, 'EA',
     true),
    (2, 'SM-BRACKET-001', 'L-Bracket 50x50x2mm', 'Steel L-bracket, galvanized', 1, 3500.00, 'EA', true),
    (3, 'SM-COVER-001', 'Equipment Cover 500x600mm', 'Protective cover, 2mm stainless steel', 1, 85000.00, 'EA',
     true),

    -- Machined Components
    (4, 'MC-SHAFT-001', 'Drive Shaft Ø30x200mm', 'Precision turned shaft, hardened steel', 2, 65000.00, 'EA', true),
    (5, 'MC-FLANGE-001', 'Mounting Flange Ø150mm', 'CNC machined flange, aluminum', 2, 42000.00, 'EA', true),
    (6, 'MC-BLOCK-001', 'Support Block 80x80x40mm', 'Machined support block, cast iron', 2, 28000.00, 'EA', true),

    -- Welded Assemblies
    (7, 'WA-FRAME-001', 'Equipment Frame 1000x800mm', 'Welded steel frame structure', 3, 185000.00, 'EA', true),
    (8, 'WA-TABLE-001', 'Worktable 1200x600mm', 'Heavy-duty welded table', 3, 220000.00, 'EA', true),

    -- Custom Enclosures
    (9, 'CE-CABINET-001', 'Electrical Cabinet 600x800x300mm', 'Powder coated steel cabinet', 4, 350000.00, 'EA',
     true),
    (10, 'CE-BOX-001', 'Junction Box 200x200x150mm', 'Weatherproof electrical box', 4, 48000.00, 'EA', true),
    (11, 'CE-HOUSING-001', 'Motor Housing Ø200x300mm', 'Machined and welded motor housing', 4, 125000.00, 'EA', true),

    -- Additional common items
    (12, 'SM-PLATE-001', 'Mounting Plate 400x400x5mm', 'Laser cut steel plate with holes', 1, 32000.00, 'EA', true),
    (13, 'MC-BUSHING-001', 'Sleeve Bushing Ø40/30x50mm', 'Bronze bushing', 2, 18000.00, 'EA', true),
    (14, 'WA-GUARD-001', 'Machine Guard 800x1200mm', 'Safety guard with mesh', 3, 95000.00, 'EA', true),
    (15, 'CE-PANEL-001', 'Instrument Panel 400x600x120mm', 'Front access panel', 4, 78000.00, 'EA', true)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for products table
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT
    ON TABLE users IS 'Test users for development (password: password123)';
COMMENT
    ON TABLE roles IS 'RBAC roles: ADMIN, FINANCE, PRODUCTION, SALES';
COMMENT
    ON TABLE customers IS 'Test customers representing major Korean industrial companies';
COMMENT
    ON TABLE suppliers IS 'Test suppliers for outsourced manufacturing processes';
COMMENT
    ON TABLE products IS 'Product catalog with realistic pricing and specifications';
COMMENT
    ON TABLE work_progress_step_templates IS 'Manufacturing workflow templates per product type';
