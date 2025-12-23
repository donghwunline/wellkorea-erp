-- V5: Seed initial data for development and testing
-- Migration Date: 2025-12-05 (Updated: 2025-12-23)
-- Purpose: Populate database with test users, roles, companies, products for Phase 2+ development
-- Update: Replaced customers/suppliers with unified companies + company_roles

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
-- USERS (Development seed data)
-- =====================================================================
-- Password for all test users: "password123"
-- BCrypt hash: $2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6
--
-- WARNING: These are development users only. In production:
-- - Users should be created through the application UI
-- - Use secure password management practices

INSERT INTO users (id, username, email, password_hash, full_name, is_active)
VALUES (1, 'admin', 'admin@wellkorea.com', '$2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6', 'Admin User',
        true),
       (2, 'finance', 'finance@wellkorea.com', '$2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6',
        'Finance Manager', true),
       (3, 'production', 'production@wellkorea.com', '$2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6',
        'Production Lead', true),
       (4, 'sales', 'sales@wellkorea.com', '$2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6',
        'Sales Representative', true),
       (5, 'sales2', 'sales2@wellkorea.com', '$2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6',
        'Sales Representative 2', true)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for users table
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- =====================================================================
-- USER-ROLE ASSIGNMENTS
-- =====================================================================
-- admin (ID: 1) - All roles (ADMIN, FINANCE, PRODUCTION, SALES)
-- finance (ID: 2) - FINANCE role
-- production (ID: 3) - PRODUCTION role
-- sales (ID: 4) - SALES role
-- sales2 (ID: 5) - SALES role

INSERT INTO user_roles (user_id, role_name)
VALUES (1, 'ADMIN'),
       (1, 'FINANCE'),
       (1, 'PRODUCTION'),
       (1, 'SALES'),
       (2, 'FINANCE'),
       (3, 'PRODUCTION'),
       (4, 'SALES'),
       (5, 'SALES')
ON CONFLICT (user_id, role_name) DO NOTHING;

-- =====================================================================
-- COMPANIES (Unified Customer/Vendor/Outsource)
-- =====================================================================
-- Companies with CUSTOMER role (former customers)

INSERT INTO companies (id, name, registration_number, representative, business_type, business_category,
                       contact_person, phone, email, address, bank_account, payment_terms, is_active)
VALUES
    -- Customer companies
    (1, 'Samsung Electronics', '124-81-00998', '이재용', '제조업', '전자제품',
     'Kim Min-jun', '02-1234-5678', 'procurement@samsung.com', 'Seoul, Gangnam-gu, Teheran-ro 123', NULL, 'NET30', true),
    (2, 'Hyundai Motor Company', '101-81-15688', '정의선', '제조업', '자동차',
     'Lee Soo-jin', '02-2345-6789', 'purchasing@hyundai.com', 'Seoul, Gangnam-gu, Yeoksam-ro 234', NULL, 'NET30', true),
    (3, 'LG Display', '107-81-86529', '정호영', '제조업', '디스플레이',
     'Park Ji-hoon', '02-3456-7890', 'supply@lgdisplay.com', 'Seoul, Yeongdeungpo-gu, Yeoui-daero 456', NULL, 'NET30', true),
    (4, 'SK Hynix', '132-81-00498', '곽노정', '제조업', '반도체',
     'Choi Yuna', '02-4567-8901', 'vendor@skhynix.com', 'Gyeonggi-do, Seongnam-si, Bundang-gu', NULL, 'NET30', true),
    (5, 'Doosan Heavy Industries', '101-81-30345', '박지원', '제조업', '중공업',
     'Jung Tae-yang', '02-5678-9012', 'procurement@doosan.com', 'Seoul, Jung-gu, Sejong-daero 789', NULL, 'NET60', true),
    (6, 'POSCO', '102-81-45690', '최정우', '제조업', '철강',
     'Kang Hye-won', '02-6789-0123', 'purchasing@posco.com', 'Gyeongbuk, Pohang-si, Jigok-dong 234', NULL, 'NET60', true),
    (7, 'Hanwha Aerospace', '131-81-00776', '손재일', '제조업', '항공우주',
     'Yoon Dong-hyun', '02-7890-1234', 'supply@hanwha.com', 'Gyeongnam, Changwon-si, Seongsan-gu', NULL, 'NET30', true),
    (8, 'Korea Aerospace Industries', '609-81-47300', '강구영', '제조업', '항공기',
     'Lim Eun-ji', '055-851-1234', 'vendor@koreaaero.com', 'Gyeongnam, Sacheon-si, Sanam-ro 78', NULL, 'NET45', true),
    -- Vendor companies (former suppliers)
    (9, 'Laser Cutting Solutions', '131-82-00123', '송민호', '제조업', '금속가공',
     'Song Min-ho', '031-123-4567', 'sales@lasercutting.kr', 'Gyeonggi-do, Siheung-si, Jeongwang-dong 123', '기업은행 123-456-7890', 'NET30', true),
    (10, 'Sheet Metal Fabricators', '131-82-00456', '배수지', '제조업', '금속가공',
     'Bae Su-ji', '031-234-5678', 'info@sheetmetal.kr', 'Gyeonggi-do, Ansan-si, Danwon-gu 234', '신한은행 234-567-8901', 'NET30', true),
    (11, 'Precision Machining Co.', '120-81-78901', '한지성', '제조업', '정밀가공',
     'Han Ji-sung', '032-345-6789', 'contact@precisionmachining.kr', 'Incheon, Namdong-gu, Guwol-dong 345', '국민은행 345-678-9012', 'NET30', true),
    (12, 'Industrial Coating Services', '131-82-56789', '오세훈', '서비스업', '도장',
     'Oh Se-hoon', '031-456-7890', 'painting@coating.kr', 'Gyeonggi-do, Bucheon-si, Ojeong-gu 456', '우리은행 456-789-0123', 'NET30', true),
    -- Dual-role company (both customer and vendor)
    (13, 'Samsung SDI', '306-81-00234', '최윤호', '제조업', '배터리',
     'Kim Soo-young', '031-567-8901', 'contact@samsungsdi.com', 'Gyeonggi-do, Yongin-si, Giheung-gu', NULL, 'NET30', true)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for companies table
SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));

-- =====================================================================
-- COMPANY ROLES
-- =====================================================================
-- Assign roles to companies (CUSTOMER, VENDOR, OUTSOURCE)

INSERT INTO company_roles (company_id, role_type, credit_limit, default_payment_days, notes)
VALUES
    -- Customer roles
    (1, 'CUSTOMER', 500000000.00, 30, '대기업 고객 - 삼성전자'),
    (2, 'CUSTOMER', 500000000.00, 30, '대기업 고객 - 현대자동차'),
    (3, 'CUSTOMER', 300000000.00, 30, '대기업 고객 - LG디스플레이'),
    (4, 'CUSTOMER', 300000000.00, 30, '대기업 고객 - SK하이닉스'),
    (5, 'CUSTOMER', 200000000.00, 60, '대기업 고객 - 두산중공업'),
    (6, 'CUSTOMER', 500000000.00, 60, '대기업 고객 - 포스코'),
    (7, 'CUSTOMER', 200000000.00, 30, '대기업 고객 - 한화에어로스페이스'),
    (8, 'CUSTOMER', 200000000.00, 45, '대기업 고객 - 한국항공우주산업'),
    -- Vendor roles
    (9, 'VENDOR', NULL, 30, '레이저 컷팅, CNC 가공 전문업체'),
    (10, 'VENDOR', NULL, 30, '판금, 용접 전문업체'),
    (11, 'VENDOR', NULL, 30, 'CNC 정밀가공 전문업체'),
    (12, 'OUTSOURCE', NULL, 30, '도장 외주업체'),
    -- Dual-role: Samsung SDI is both customer (buys from us) and vendor (supplies materials)
    (13, 'CUSTOMER', 300000000.00, 30, '삼성SDI - 고객사'),
    (13, 'VENDOR', NULL, 30, '삼성SDI - 배터리 소재 공급')
ON CONFLICT (company_id, role_type) DO NOTHING;

-- =====================================================================
-- CUSTOMER ASSIGNMENTS (FR-062: Sales role customer filtering)
-- =====================================================================
-- Customer assignments have been moved to DatabaseTestHelper for test-only usage.
-- In production, customer assignments should be managed through the application UI.

-- =====================================================================
-- SERVICE CATEGORIES (FR-053)
-- =====================================================================

INSERT INTO service_categories (id, name, description, is_active)
VALUES
    (1, 'CNC 가공', 'CNC machining services', true),
    (2, '레이저 컷팅', 'Laser cutting services', true),
    (3, '에칭', 'Etching services', true),
    (4, '도장', 'Painting/coating services', true),
    (5, '절곡', 'Bending services', true),
    (6, '용접', 'Welding services', true),
    (7, '도금', 'Plating services', true),
    (8, '열처리', 'Heat treatment services', true)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for service_categories table
SELECT setval('service_categories_id_seq', (SELECT MAX(id) FROM service_categories));

-- =====================================================================
-- VENDOR SERVICE OFFERINGS (FR-053)
-- =====================================================================

INSERT INTO vendor_service_offerings (vendor_company_id, service_category_id, vendor_service_code, vendor_service_name,
                                      unit_price, currency, lead_time_days, min_order_quantity, is_preferred, notes)
VALUES
    -- Laser Cutting Solutions (ID: 9)
    (9, 2, 'LC-001', '레이저 컷팅 (일반 철판)', 50.00, 'KRW', 3, 10, true, '기본 레이저 컷팅 - mm당 가격'),
    (9, 2, 'LC-002', '레이저 컷팅 (스테인리스)', 80.00, 'KRW', 3, 10, true, '스테인리스 레이저 컷팅'),
    (9, 1, 'CNC-001', 'CNC 밀링 가공', 50000.00, 'KRW', 5, 1, false, '시간당 가격'),
    -- Sheet Metal Fabricators (ID: 10)
    (10, 5, 'BND-001', '절곡 가공', 1000.00, 'KRW', 2, 20, true, '1회 절곡당 가격'),
    (10, 6, 'WLD-001', '일반 용접', 30000.00, 'KRW', 3, 1, true, '시간당 가격'),
    (10, 6, 'WLD-002', 'TIG 용접', 50000.00, 'KRW', 3, 1, false, 'TIG 용접 시간당'),
    -- Precision Machining Co. (ID: 11)
    (11, 1, 'CNC-M01', 'CNC 밀링 정밀가공', 60000.00, 'KRW', 5, 1, true, '정밀 밀링 시간당'),
    (11, 1, 'CNC-T01', 'CNC 선반 가공', 45000.00, 'KRW', 4, 1, true, '선반 가공 시간당'),
    -- Industrial Coating Services (ID: 12)
    (12, 4, 'PNT-001', '분체도장', 5000.00, 'KRW', 5, 10, true, '제곱미터당 가격'),
    (12, 4, 'PNT-002', '액체도장', 8000.00, 'KRW', 7, 5, false, '고급 액체도장'),
    -- Samsung SDI as vendor (ID: 13)
    (13, 8, 'HT-001', '열처리 서비스', 30000.00, 'KRW', 7, 5, false, '배치당 가격')
ON CONFLICT DO NOTHING;

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

COMMENT ON TABLE users IS 'Test users for development (password: password123)';
COMMENT ON TABLE roles IS 'RBAC roles: ADMIN, FINANCE, PRODUCTION, SALES';
COMMENT ON TABLE companies IS 'Test companies - customers, vendors, and outsource partners';
COMMENT ON TABLE company_roles IS 'Role assignments for companies (CUSTOMER, VENDOR, OUTSOURCE)';
COMMENT ON TABLE service_categories IS 'Service categories for vendor-service mapping per FR-053';
COMMENT ON TABLE vendor_service_offerings IS 'Vendor pricing and lead times per service category';
COMMENT ON TABLE products IS 'Product catalog with realistic pricing and specifications';
COMMENT ON TABLE work_progress_step_templates IS 'Manufacturing workflow templates per product type';
