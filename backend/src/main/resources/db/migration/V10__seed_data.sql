-- V10: Consolidated seed data for development and testing
-- Contains all test users, roles, companies, products, projects, quotations, etc.

-- =====================================================================
-- ROLES (RBAC)
-- =====================================================================

INSERT INTO roles (name, description)
VALUES ('ADMIN', 'System administrator with full access to all features'),
       ('FINANCE', 'Finance team with access to quotations, invoices, and financial reports'),
       ('PRODUCTION', 'Production team with access to work progress tracking'),
       ('SALES', 'Sales team with customer-specific quotation access')
ON CONFLICT (name) DO NOTHING;

-- =====================================================================
-- USERS (Password: password123)
-- =====================================================================

INSERT INTO users (id, username, email, password_hash, full_name, is_active)
VALUES (1, 'admin', 'admin@wellkorea.com', '$2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6', 'Admin User', true),
       (2, 'finance', 'finance@wellkorea.com', '$2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6', 'Finance Manager', true),
       (3, 'production', 'production@wellkorea.com', '$2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6', 'Production Lead', true),
       (4, 'sales', 'sales@wellkorea.com', '$2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6', 'Sales Representative', true),
       (5, 'sales2', 'sales2@wellkorea.com', '$2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6', 'Sales Representative 2', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

INSERT INTO user_roles (user_id, role_name)
VALUES (1, 'ADMIN'), (1, 'FINANCE'), (1, 'PRODUCTION'), (1, 'SALES'),
       (2, 'FINANCE'), (3, 'PRODUCTION'), (4, 'SALES'), (5, 'SALES')
ON CONFLICT (user_id, role_name) DO NOTHING;

-- =====================================================================
-- COMPANIES
-- =====================================================================

INSERT INTO companies (id, name, registration_number, representative, business_type, business_category,
                       contact_person, phone, email, address, bank_account, payment_terms, is_active)
VALUES
    (1, 'Samsung Electronics', '124-81-00998', '이재용', '제조업', '전자제품', 'Kim Min-jun', '02-1234-5678', 'procurement@samsung.com', 'Seoul, Gangnam-gu, Teheran-ro 123', NULL, 'NET30', true),
    (2, 'Hyundai Motor Company', '101-81-15688', '정의선', '제조업', '자동차', 'Lee Soo-jin', '02-2345-6789', 'purchasing@hyundai.com', 'Seoul, Gangnam-gu, Yeoksam-ro 234', NULL, 'NET30', true),
    (3, 'LG Display', '107-81-86529', '정호영', '제조업', '디스플레이', 'Park Ji-hoon', '02-3456-7890', 'supply@lgdisplay.com', 'Seoul, Yeongdeungpo-gu, Yeoui-daero 456', NULL, 'NET30', true),
    (4, 'SK Hynix', '132-81-00498', '곽노정', '제조업', '반도체', 'Choi Yuna', '02-4567-8901', 'vendor@skhynix.com', 'Gyeonggi-do, Seongnam-si, Bundang-gu', NULL, 'NET30', true),
    (5, 'Doosan Heavy Industries', '101-81-30345', '박지원', '제조업', '중공업', 'Jung Tae-yang', '02-5678-9012', 'procurement@doosan.com', 'Seoul, Jung-gu, Sejong-daero 789', NULL, 'NET60', true),
    (6, 'POSCO', '102-81-45690', '최정우', '제조업', '철강', 'Kang Hye-won', '02-6789-0123', 'purchasing@posco.com', 'Gyeongbuk, Pohang-si, Jigok-dong 234', NULL, 'NET60', true),
    (7, 'Hanwha Aerospace', '131-81-00776', '손재일', '제조업', '항공우주', 'Yoon Dong-hyun', '02-7890-1234', 'supply@hanwha.com', 'Gyeongnam, Changwon-si, Seongsan-gu', NULL, 'NET30', true),
    (8, 'Korea Aerospace Industries', '609-81-47300', '강구영', '제조업', '항공기', 'Lim Eun-ji', '055-851-1234', 'vendor@koreaaero.com', 'Gyeongnam, Sacheon-si, Sanam-ro 78', NULL, 'NET45', true),
    (9, 'Laser Cutting Solutions', '131-82-00123', '송민호', '제조업', '금속가공', 'Song Min-ho', '031-123-4567', 'sales@lasercutting.kr', 'Gyeonggi-do, Siheung-si, Jeongwang-dong 123', '기업은행 123-456-7890', 'NET30', true),
    (10, 'Sheet Metal Fabricators', '131-82-00456', '배수지', '제조업', '금속가공', 'Bae Su-ji', '031-234-5678', 'info@sheetmetal.kr', 'Gyeonggi-do, Ansan-si, Danwon-gu 234', '신한은행 234-567-8901', 'NET30', true),
    (11, 'Precision Machining Co.', '120-81-78901', '한지성', '제조업', '정밀가공', 'Han Ji-sung', '032-345-6789', 'contact@precisionmachining.kr', 'Incheon, Namdong-gu, Guwol-dong 345', '국민은행 345-678-9012', 'NET30', true),
    (12, 'Industrial Coating Services', '131-82-56789', '오세훈', '서비스업', '도장', 'Oh Se-hoon', '031-456-7890', 'painting@coating.kr', 'Gyeonggi-do, Bucheon-si, Ojeong-gu 456', '우리은행 456-789-0123', 'NET30', true),
    (13, 'Samsung SDI', '306-81-00234', '최윤호', '제조업', '배터리', 'Kim Soo-young', '031-567-8901', 'contact@samsungsdi.com', 'Gyeonggi-do, Yongin-si, Giheung-gu', NULL, 'NET30', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));

INSERT INTO company_roles (company_id, role_type, credit_limit, default_payment_days, notes)
VALUES
    (1, 'CUSTOMER', 500000000.00, 30, '대기업 고객 - 삼성전자'),
    (2, 'CUSTOMER', 500000000.00, 30, '대기업 고객 - 현대자동차'),
    (3, 'CUSTOMER', 300000000.00, 30, '대기업 고객 - LG디스플레이'),
    (4, 'CUSTOMER', 300000000.00, 30, '대기업 고객 - SK하이닉스'),
    (5, 'CUSTOMER', 200000000.00, 60, '대기업 고객 - 두산중공업'),
    (6, 'CUSTOMER', 500000000.00, 60, '대기업 고객 - 포스코'),
    (7, 'CUSTOMER', 200000000.00, 30, '대기업 고객 - 한화에어로스페이스'),
    (8, 'CUSTOMER', 200000000.00, 45, '대기업 고객 - 한국항공우주산업'),
    (9, 'VENDOR', NULL, 30, '레이저 컷팅, CNC 가공 전문업체'),
    (10, 'VENDOR', NULL, 30, '판금, 용접 전문업체'),
    (11, 'VENDOR', NULL, 30, 'CNC 정밀가공 전문업체'),
    (12, 'OUTSOURCE', NULL, 30, '도장 외주업체'),
    (13, 'CUSTOMER', 300000000.00, 30, '삼성SDI - 고객사'),
    (13, 'VENDOR', NULL, 30, '삼성SDI - 배터리 소재 공급')
ON CONFLICT (company_id, role_type) DO NOTHING;

-- =====================================================================
-- SERVICE CATEGORIES & VENDOR OFFERINGS
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

SELECT setval('service_categories_id_seq', (SELECT MAX(id) FROM service_categories));

INSERT INTO vendor_service_offerings (vendor_company_id, service_category_id, vendor_service_code, vendor_service_name,
                                      unit_price, currency, lead_time_days, min_order_quantity, is_preferred, notes)
VALUES
    (9, 2, 'LC-001', '레이저 컷팅 (일반 철판)', 50.00, 'KRW', 3, 10, true, '기본 레이저 컷팅'),
    (9, 2, 'LC-002', '레이저 컷팅 (스테인리스)', 80.00, 'KRW', 3, 10, true, '스테인리스 레이저 컷팅'),
    (9, 1, 'CNC-001', 'CNC 밀링 가공', 50000.00, 'KRW', 5, 1, false, '시간당 가격'),
    (10, 5, 'BND-001', '절곡 가공', 1000.00, 'KRW', 2, 20, true, '1회 절곡당 가격'),
    (10, 6, 'WLD-001', '일반 용접', 30000.00, 'KRW', 3, 1, true, '시간당 가격'),
    (10, 6, 'WLD-002', 'TIG 용접', 50000.00, 'KRW', 3, 1, false, 'TIG 용접 시간당'),
    (11, 1, 'CNC-M01', 'CNC 밀링 정밀가공', 60000.00, 'KRW', 5, 1, true, '정밀 밀링 시간당'),
    (11, 1, 'CNC-T01', 'CNC 선반 가공', 45000.00, 'KRW', 4, 1, true, '선반 가공 시간당'),
    (12, 4, 'PNT-001', '분체도장', 5000.00, 'KRW', 5, 10, true, '제곱미터당 가격'),
    (12, 4, 'PNT-002', '액체도장', 8000.00, 'KRW', 7, 5, false, '고급 액체도장'),
    (13, 8, 'HT-001', '열처리 서비스', 30000.00, 'KRW', 7, 5, false, '배치당 가격')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- MATERIAL CATEGORIES
-- =====================================================================

INSERT INTO material_categories (name, description)
VALUES
    ('패스너', 'Fasteners - bolts, nuts, screws, washers'),
    ('원자재', 'Raw materials - steel, aluminum, copper sheets and bars'),
    ('공구', 'Tools - cutting tools, measuring instruments'),
    ('소모품', 'Consumables - lubricants, adhesives, abrasives'),
    ('전기부품', 'Electrical components - cables, connectors, switches'),
    ('기타', 'Other materials');

-- =====================================================================
-- PRODUCT TYPES & PRODUCTS
-- =====================================================================

INSERT INTO product_types (id, name, description)
VALUES (1, 'Sheet Metal Parts', 'Custom sheet metal fabrication and assembly'),
       (2, 'Machined Components', 'Precision CNC machined parts'),
       (3, 'Welded Assemblies', 'Welded structures and assemblies'),
       (4, 'Custom Enclosures', 'Electronic and industrial enclosures')
ON CONFLICT (id) DO NOTHING;

SELECT setval('product_types_id_seq', (SELECT MAX(id) FROM product_types));

INSERT INTO work_progress_step_templates (product_type_id, step_name, step_number, is_required, estimated_hours, is_outsourceable)
VALUES
    (1, 'Design', 1, true, 2.0, false), (1, 'Laser Cutting', 2, true, 1.0, true), (1, 'Sheet Metal Forming', 3, true, 1.5, true),
    (1, 'Welding', 4, false, 2.0, true), (1, 'Grinding', 5, false, 1.0, true), (1, 'Painting', 6, false, 3.0, true), (1, 'Packaging', 7, true, 0.5, false),
    (2, 'Design', 1, true, 3.0, false), (2, 'Material Preparation', 2, true, 1.0, false), (2, 'CNC Milling', 3, true, 4.0, true),
    (2, 'CNC Turning', 4, false, 3.0, true), (2, 'Grinding', 5, false, 1.5, true), (2, 'Surface Treatment', 6, false, 2.0, true),
    (2, 'Quality Inspection', 7, true, 1.0, false), (2, 'Packaging', 8, true, 0.5, false),
    (3, 'Design', 1, true, 4.0, false), (3, 'Laser Cutting', 2, true, 1.5, true), (3, 'Sheet Metal Forming', 3, true, 2.0, true),
    (3, 'Welding', 4, true, 6.0, true), (3, 'Grinding', 5, true, 2.0, true), (3, 'Painting', 6, false, 3.0, true),
    (3, 'Final Assembly', 7, true, 3.0, false), (3, 'Packaging', 8, true, 0.5, false),
    (4, 'Design', 1, true, 5.0, false), (4, 'Laser Cutting', 2, true, 2.0, true), (4, 'Sheet Metal Forming', 3, true, 2.0, true),
    (4, 'Welding', 4, true, 4.0, true), (4, 'Powder Coating', 5, true, 4.0, true), (4, 'Hardware Installation', 6, false, 2.0, false),
    (4, 'Final Assembly', 7, true, 2.0, false), (4, 'Packaging', 8, true, 0.5, false)
ON CONFLICT DO NOTHING;

INSERT INTO products (id, sku, name, description, product_type_id, base_unit_price, unit, is_active)
VALUES
    (1, 'SM-PANEL-001', 'Control Panel 300x400mm', 'Sheet metal control panel, 1.5mm thickness', 1, 45000.00, 'EA', true),
    (2, 'SM-BRACKET-001', 'L-Bracket 50x50x2mm', 'Steel L-bracket, galvanized', 1, 3500.00, 'EA', true),
    (3, 'SM-COVER-001', 'Equipment Cover 500x600mm', 'Protective cover, 2mm stainless steel', 1, 85000.00, 'EA', true),
    (4, 'MC-SHAFT-001', 'Drive Shaft Ø30x200mm', 'Precision turned shaft, hardened steel', 2, 65000.00, 'EA', true),
    (5, 'MC-FLANGE-001', 'Mounting Flange Ø150mm', 'CNC machined flange, aluminum', 2, 42000.00, 'EA', true),
    (6, 'MC-BLOCK-001', 'Support Block 80x80x40mm', 'Machined support block, cast iron', 2, 28000.00, 'EA', true),
    (7, 'WA-FRAME-001', 'Equipment Frame 1000x800mm', 'Welded steel frame structure', 3, 185000.00, 'EA', true),
    (8, 'WA-TABLE-001', 'Worktable 1200x600mm', 'Heavy-duty welded table', 3, 220000.00, 'EA', true),
    (9, 'CE-CABINET-001', 'Electrical Cabinet 600x800x300mm', 'Powder coated steel cabinet', 4, 350000.00, 'EA', true),
    (10, 'CE-BOX-001', 'Junction Box 200x200x150mm', 'Weatherproof electrical box', 4, 48000.00, 'EA', true),
    (11, 'CE-HOUSING-001', 'Motor Housing Ø200x300mm', 'Machined and welded motor housing', 4, 125000.00, 'EA', true),
    (12, 'SM-PLATE-001', 'Mounting Plate 400x400x5mm', 'Laser cut steel plate with holes', 1, 32000.00, 'EA', true),
    (13, 'MC-BUSHING-001', 'Sleeve Bushing Ø40/30x50mm', 'Bronze bushing', 2, 18000.00, 'EA', true),
    (14, 'WA-GUARD-001', 'Machine Guard 800x1200mm', 'Safety guard with mesh', 3, 95000.00, 'EA', true),
    (15, 'CE-PANEL-001', 'Instrument Panel 400x600x120mm', 'Front access panel', 4, 78000.00, 'EA', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- =====================================================================
-- APPROVAL CHAIN TEMPLATES
-- =====================================================================

INSERT INTO approval_chain_templates (entity_type, name, description, is_active)
VALUES ('QUOTATION', '견적서 결재', '견적서 승인을 위한 결재 라인', true),
       ('PURCHASE_ORDER', '발주서 결재', '발주서 승인을 위한 결재 라인', true);

-- =====================================================================
-- PROJECTS & QUOTATIONS
-- =====================================================================

INSERT INTO job_code_sequences (id, year, last_sequence)
VALUES (1, '25', 3)
ON CONFLICT (year) DO UPDATE SET last_sequence = 3;

SELECT setval('job_code_sequences_id_seq', (SELECT COALESCE(MAX(id), 1) FROM job_code_sequences));

INSERT INTO projects (id, job_code, customer_company_id, project_name, requester_name, due_date, internal_owner_id, status, created_by_id, created_at, updated_at)
VALUES
    (1, 'WK2K25-0001-0115', 1, 'Samsung HQ Control Panel Upgrade', 'Kim Min-jun', '2025-02-28', 1, 'ACTIVE', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 'WK2K25-0002-0118', 2, 'Hyundai Motor Assembly Line Equipment', 'Lee Soo-jin', '2025-03-15', 2, 'ACTIVE', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 'WK2K25-0003-0120', 3, 'LG Display Cleanroom Enclosures', 'Park Ji-hoon', '2025-04-01', 4, 'DRAFT', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

SELECT setval('projects_id_seq', (SELECT COALESCE(MAX(id), 1) FROM projects));

INSERT INTO quotations (id, project_id, version, status, quotation_date, validity_days, total_amount, notes, created_by_id, submitted_at, approved_at, approved_by_id, created_at, updated_at)
VALUES
    (1, 1, 1, 'DRAFT', '2025-01-15', 30, 682000.00, 'Initial quotation for Samsung HQ', 1, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 2, 1, 'PENDING', '2025-01-18', 30, 1255000.00, 'Quotation for Hyundai motor assembly line', 2, CURRENT_TIMESTAMP, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 3, 1, 'APPROVED', '2025-01-20', 30, 1295000.00, 'Approved quotation for LG Display', 4, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '1 day', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (project_id, version) DO NOTHING;

SELECT setval('quotations_id_seq', (SELECT COALESCE(MAX(id), 1) FROM quotations));

INSERT INTO quotation_line_items (id, quotation_id, product_id, sequence, quantity, unit_price, line_total, notes, created_at, updated_at)
VALUES
    (1, 1, 1, 1, 5, 45000.00, 225000.00, 'Control panels for server room', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (2, 1, 2, 2, 20, 3500.00, 70000.00, 'L-brackets for mounting', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (3, 1, 3, 3, 3, 85000.00, 255000.00, 'Equipment covers', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (4, 1, 12, 4, 4, 32000.00, 132000.00, 'Mounting plates', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (5, 2, 7, 1, 3, 185000.00, 555000.00, 'Main equipment frames', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (6, 2, 8, 2, 2, 220000.00, 440000.00, 'Heavy-duty worktables', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (7, 2, 4, 3, 4, 65000.00, 260000.00, 'Drive shafts', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (8, 3, 9, 1, 2, 350000.00, 700000.00, 'Electrical cabinets', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (9, 3, 10, 2, 5, 48000.00, 240000.00, 'Junction boxes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (10, 3, 15, 3, 3, 78000.00, 234000.00, 'Instrument panels', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (11, 3, 11, 4, 1, 125000.00, 125000.00, 'Motor housing (spare)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (quotation_id, sequence) DO NOTHING;

SELECT setval('quotation_line_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM quotation_line_items));

INSERT INTO approval_chain_levels (chain_template_id, level_order, level_name, approver_user_id, is_required)
VALUES (1, 1, '팀장 (Finance Manager)', 2, true),
       (1, 2, '사장 (CEO)', 1, true)
ON CONFLICT (chain_template_id, level_order) DO NOTHING;

-- =====================================================================
-- TASK FLOWS
-- =====================================================================

INSERT INTO task_flows (id, project_id, created_at, updated_at)
VALUES (1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (3, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (project_id) DO NOTHING;

INSERT INTO task_nodes (flow_id, node_id, title, assignee, deadline, progress, position_x, position_y)
VALUES
    (1, 'node-1-1', '설계', '김설계', CURRENT_DATE - INTERVAL '5 days', 100, 100, 100),
    (1, 'node-1-2', '개발', '박개발', CURRENT_DATE + INTERVAL '3 days', 75, 350, 100),
    (1, 'node-1-3', '테스트', '이품질', CURRENT_DATE + INTERVAL '10 days', 25, 600, 100),
    (1, 'node-1-4', '출하', '최출하', CURRENT_DATE + INTERVAL '15 days', 0, 850, 100),
    (2, 'node-2-1', '기획', 'Admin', CURRENT_DATE - INTERVAL '10 days', 100, 100, 200),
    (2, 'node-2-2a', '프레임 제작', '생산팀', CURRENT_DATE + INTERVAL '5 days', 50, 400, 50),
    (2, 'node-2-2b', '전장 작업', '생산팀', CURRENT_DATE + INTERVAL '5 days', 50, 400, 200),
    (2, 'node-2-2c', '유압 시스템', '외주업체', CURRENT_DATE + INTERVAL '7 days', 75, 400, 350),
    (2, 'node-2-3', '조립 및 통합', '생산팀', CURRENT_DATE + INTERVAL '14 days', 0, 700, 200),
    (3, 'node-3-1', '도면 설계', '김설계', CURRENT_DATE - INTERVAL '7 days', 100, 100, 100),
    (3, 'node-3-2', '자재 발주', '구매팀', CURRENT_DATE - INTERVAL '3 days', 100, 100, 300),
    (3, 'node-3-3', '레이저 가공', '생산팀', CURRENT_DATE, 80, 350, 50),
    (3, 'node-3-4', '기계 가공', '생산팀', CURRENT_DATE + INTERVAL '2 days', 60, 350, 200),
    (3, 'node-3-5', '외주 도장', '외주업체', CURRENT_DATE - INTERVAL '2 days', 40, 350, 350),
    (3, 'node-3-6', '용접 조립', '생산팀', CURRENT_DATE + INTERVAL '5 days', 20, 600, 100),
    (3, 'node-3-7', '전장 조립', '생산팀', CURRENT_DATE + INTERVAL '7 days', 0, 600, 300),
    (3, 'node-3-8', '최종 검사', '품질팀', CURRENT_DATE + INTERVAL '10 days', 0, 850, 150),
    (3, 'node-3-9', '포장 출하', '물류팀', CURRENT_DATE + INTERVAL '14 days', 0, 850, 300)
ON CONFLICT (flow_id, node_id) DO NOTHING;

INSERT INTO task_edges (flow_id, edge_id, source_node_id, target_node_id)
VALUES
    (1, 'edge-1-1', 'node-1-1', 'node-1-2'), (1, 'edge-1-2', 'node-1-2', 'node-1-3'), (1, 'edge-1-3', 'node-1-3', 'node-1-4'),
    (2, 'edge-2-1a', 'node-2-1', 'node-2-2a'), (2, 'edge-2-1b', 'node-2-1', 'node-2-2b'), (2, 'edge-2-1c', 'node-2-1', 'node-2-2c'),
    (2, 'edge-2-2a', 'node-2-2a', 'node-2-3'), (2, 'edge-2-2b', 'node-2-2b', 'node-2-3'), (2, 'edge-2-2c', 'node-2-2c', 'node-2-3'),
    (3, 'edge-3-1', 'node-3-1', 'node-3-3'), (3, 'edge-3-2', 'node-3-1', 'node-3-4'),
    (3, 'edge-3-3', 'node-3-2', 'node-3-3'), (3, 'edge-3-4', 'node-3-2', 'node-3-5'),
    (3, 'edge-3-5', 'node-3-3', 'node-3-6'), (3, 'edge-3-6', 'node-3-4', 'node-3-6'), (3, 'edge-3-7', 'node-3-5', 'node-3-7'),
    (3, 'edge-3-8', 'node-3-6', 'node-3-8'), (3, 'edge-3-9', 'node-3-7', 'node-3-8'), (3, 'edge-3-10', 'node-3-8', 'node-3-9')
ON CONFLICT (flow_id, edge_id) DO NOTHING;

SELECT setval('task_flows_id_seq', (SELECT COALESCE(MAX(id), 1) FROM task_flows));

-- =====================================================================
-- PURCHASE REQUESTS, RFQ, PO
-- =====================================================================

INSERT INTO purchase_requests (id, dtype, project_id, service_category_id, request_number, description, quantity, uom, required_date, status, created_by_id, created_at, updated_at)
VALUES
    (1, 'SERVICE', 1, 2, 'PR-2025-000001', 'Samsung HQ 레이저 컷팅 외주', 50.00, 'EA', '2025-02-15', 'VENDOR_SELECTED', 1, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP),
    (2, 'SERVICE', 2, 6, 'PR-2025-000002', '현대차 조립라인 프레임 용접 외주', 3.00, 'SET', '2025-03-01', 'RFQ_SENT', 3, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP),
    (3, 'SERVICE', 3, 4, 'PR-2025-000003', 'LG디스플레이 클린룸 캐비닛 도장 외주', 7.00, 'EA', '2025-03-20', 'DRAFT', 4, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP),
    (4, 'SERVICE', 1, 1, 'PR-2025-000004', 'Samsung HQ 정밀 CNC 가공 외주', 20.00, 'EA', '2025-01-30', 'CLOSED', 1, CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP),
    (5, 'SERVICE', 2, 5, 'PR-2025-000005', '(취소) 현대차 절곡 외주', 10.00, 'EA', '2025-02-20', 'CANCELED', 3, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

SELECT setval('purchase_requests_id_seq', (SELECT COALESCE(MAX(id), 1) FROM purchase_requests));

INSERT INTO rfq_items (id, purchase_request_id, vendor_company_id, vendor_offering_id, status, quoted_price, quoted_lead_time, notes, sent_at, replied_at, created_at, updated_at)
VALUES
    (1, 1, 9, 2, 'SELECTED', 4000000.00, 5, '스테인리스 레이저 컷팅 50EA - 특별가', CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP),
    (2, 1, 10, NULL, 'REJECTED', 4500000.00, 7, '외주 레이저 위탁 가능', CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP),
    (3, 2, 10, 5, 'REPLIED', 9500000.00, 10, 'TIG 용접 포함', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP),
    (4, 2, 11, NULL, 'SENT', NULL, NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '4 days', NULL, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP),
    (5, 4, 11, 7, 'SELECTED', 1200000.00, 7, 'CNC 정밀 밀링 - 20EA', CURRENT_TIMESTAMP - INTERVAL '18 days', CURRENT_TIMESTAMP - INTERVAL '16 days', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

SELECT setval('rfq_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM rfq_items));

INSERT INTO purchase_orders (id, rfq_item_id, project_id, vendor_company_id, po_number, order_date, expected_delivery_date, total_amount, currency, status, notes, created_by_id, created_at, updated_at)
VALUES
    (1, 1, 1, 9, 'PO-2025-000001', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '3 days', 4000000.00, 'KRW', 'CONFIRMED', '레이저 컷팅 솔루션 - 스테인리스 패널 50EA', 1, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP),
    (2, 5, 1, 11, 'PO-2025-000002', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE - INTERVAL '5 days', 1200000.00, 'KRW', 'RECEIVED', '정밀 가공 - CNC 밀링 20EA 수령 완료', 1, CURRENT_TIMESTAMP - INTERVAL '14 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

SELECT setval('purchase_orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM purchase_orders));
