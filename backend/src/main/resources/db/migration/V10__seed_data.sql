-- V10: Consolidated seed data for development and testing
-- Contains all test users, roles, companies, products, projects, quotations, etc.

-- =====================================================================
-- ROLES (RBAC)
-- =====================================================================

INSERT INTO roles (name, description)
VALUES ('ADMIN', '시스템 관리자 - 모든 기능에 대한 전체 접근 권한'),
       ('FINANCE', '재무팀 - 견적서, 청구서, 재무 보고서 접근 권한'),
       ('PRODUCTION', '생산팀 - 작업 진행 추적 접근 권한'),
       ('SALES', '영업팀 - 고객별 견적서 접근 권한')
ON CONFLICT (name) DO NOTHING;

-- =====================================================================
-- USERS (Password: password123)
-- =====================================================================

INSERT INTO users (id, username, email, password_hash, full_name, is_active)
VALUES (1, 'admin', 'admin@wellkorea.com', '$2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6', '관리자', true),
       (2, 'finance', 'finance@wellkorea.com', '$2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6', '김재무',
        true),
       (3, 'production', 'production@wellkorea.com', '$2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6',
        '이생산', true),
       (4, 'sales', 'sales@wellkorea.com', '$2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6', '박영업', true),
       (5, 'sales2', 'sales2@wellkorea.com', '$2a$10$iILF.Jz64XwbA5epmf3cg.BjFigBnCSq6kNZMFyksQTCn7dCqhMs6', '최영업',
        true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

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
-- COMPANIES
-- =====================================================================

INSERT INTO companies (id, name, registration_number, representative, business_type, business_category,
                       contact_person, phone, email, address, bank_account, payment_terms, is_active)
VALUES (1, '삼성전자', '124-81-00998', '이재용', '제조업', '전자제품', '김민준', '02-1234-5678', 'procurement@samsung.com',
        '서울특별시 강남구 테헤란로 123', NULL, 'NET30', true),
       (2, '현대자동차', '101-81-15688', '정의선', '제조업', '자동차', '이수진', '02-2345-6789', 'purchasing@hyundai.com',
        '서울특별시 강남구 역삼로 234', NULL, 'NET30', true),
       (3, 'LG디스플레이', '107-81-86529', '정호영', '제조업', '디스플레이', '박지훈', '02-3456-7890', 'supply@lgdisplay.com',
        '서울특별시 영등포구 여의대로 456', NULL, 'NET30', true),
       (4, 'SK하이닉스', '132-81-00498', '곽노정', '제조업', '반도체', '최유나', '02-4567-8901', 'vendor@skhynix.com',
        '경기도 성남시 분당구 판교로 123', NULL, 'NET30', true),
       (5, '두산중공업', '101-81-30345', '박지원', '제조업', '중공업', '정태양', '02-5678-9012', 'procurement@doosan.com',
        '서울특별시 중구 세종대로 789', NULL, 'NET60', true),
       (6, '포스코', '102-81-45690', '최정우', '제조업', '철강', '강혜원', '02-6789-0123', 'purchasing@posco.com', '경상북도 포항시 지곡동 234',
        NULL, 'NET60', true),
       (7, '한화에어로스페이스', '131-81-00776', '손재일', '제조업', '항공우주', '윤동현', '02-7890-1234', 'supply@hanwha.com',
        '경상남도 창원시 성산구 중앙대로 567', NULL, 'NET30', true),
       (8, '한국항공우주산업', '609-81-47300', '강구영', '제조업', '항공기', '임은지', '055-851-1234', 'vendor@koreaaero.com',
        '경상남도 사천시 사남로 78', NULL, 'NET45', true),
       (9, '레이저컷팅솔루션', '131-82-00123', '송민호', '제조업', '금속가공', '송민호', '031-123-4567', 'sales@lasercutting.kr',
        '경기도 시흥시 정왕동 123', '기업은행 123-456-7890', 'NET30', true),
       (10, '판금제작소', '131-82-00456', '배수지', '제조업', '금속가공', '배수지', '031-234-5678', 'info@sheetmetal.kr',
        '경기도 안산시 단원구 234', '신한은행 234-567-8901', 'NET30', true),
       (11, '정밀기계가공', '120-81-78901', '한지성', '제조업', '정밀가공', '한지성', '032-345-6789', 'contact@precisionmachining.kr',
        '인천광역시 남동구 구월동 345', '국민은행 345-678-9012', 'NET30', true),
       (12, '산업도장서비스', '131-82-56789', '오세훈', '서비스업', '도장', '오세훈', '031-456-7890', 'painting@coating.kr',
        '경기도 부천시 오정구 456', '우리은행 456-789-0123', 'NET30', true),
       (13, '삼성SDI', '306-81-00234', '최윤호', '제조업', '배터리', '김수영', '031-567-8901', 'contact@samsungsdi.com',
        '경기도 용인시 기흥구 삼성로 890', NULL, 'NET30', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));

INSERT INTO company_roles (company_id, role_type, credit_limit, default_payment_days, notes)
VALUES (1, 'CUSTOMER', 500000000.00, 30, '대기업 고객 - 삼성전자'),
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
VALUES (1, 'CNC 가공', 'CNC 밀링, 선반 등 정밀 기계가공 서비스', true),
       (2, '레이저 컷팅', '레이저를 이용한 금속 절단 서비스', true),
       (3, '에칭', '화학적 부식을 이용한 금속 가공 서비스', true),
       (4, '도장', '분체도장, 액체도장 등 표면 코팅 서비스', true),
       (5, '절곡', '프레스 브레이크를 이용한 금속 절곡 서비스', true),
       (6, '용접', 'TIG, MIG 등 금속 용접 서비스', true),
       (7, '도금', '전기도금, 무전해도금 등 표면 처리 서비스', true),
       (8, '열처리', '담금질, 뜨임 등 금속 열처리 서비스', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('service_categories_id_seq', (SELECT MAX(id) FROM service_categories));

INSERT INTO vendor_service_offerings (vendor_company_id, service_category_id, vendor_service_code, vendor_service_name,
                                      unit_price, currency, lead_time_days, min_order_quantity, is_preferred, notes)
VALUES (9, 2, 'LC-001', '레이저 컷팅 (일반 철판)', 50.00, 'KRW', 3, 10, true, '기본 레이저 컷팅'),
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

INSERT INTO material_categories (id, name, description)
VALUES (1, '패스너', '볼트, 너트, 나사, 와셔 등 체결부품'),
       (2, '원자재', '철판, 알루미늄, 동판 등 판재 및 봉재'),
       (3, '공구', '절삭공구, 측정기기 등 가공 도구'),
       (4, '소모품', '윤활유, 접착제, 연마재 등 소모성 자재'),
       (5, '전기부품', '케이블, 커넥터, 스위치 등 전기 부품'),
       (6, '기타', '기타 자재')
ON CONFLICT (id) DO NOTHING;

SELECT setval('material_categories_id_seq', (SELECT MAX(id) FROM material_categories));

-- =====================================================================
-- MATERIALS
-- =====================================================================

INSERT INTO materials (id, sku, name, description, category_id, unit, standard_price, preferred_vendor_id)
VALUES
    -- 패스너 (Fasteners)
    (1, 'FST-BOLT-M8X30', '육각볼트 M8x30', '육각볼트 M8x30mm, 강도등급 8.8, 아연도금', 1, 'EA', 150.00, NULL),
    (2, 'FST-BOLT-M10X40', '육각볼트 M10x40', '육각볼트 M10x40mm, 강도등급 8.8, 아연도금', 1, 'EA', 250.00, NULL),
    (3, 'FST-BOLT-M12X50', '육각볼트 M12x50', '육각볼트 M12x50mm, 강도등급 10.9, 흑색산화피막', 1, 'EA', 450.00, NULL),
    (4, 'FST-NUT-M8', '육각너트 M8', '육각너트 M8, 강도등급 8, 아연도금', 1, 'EA', 50.00, NULL),
    (5, 'FST-NUT-M10', '육각너트 M10', '육각너트 M10, 강도등급 8, 아연도금', 1, 'EA', 80.00, NULL),
    (6, 'FST-NUT-M12', '육각너트 M12', '육각너트 M12, 강도등급 10, 흑색산화피막', 1, 'EA', 120.00, NULL),
    (7, 'FST-WSHR-M8', '평와셔 M8', '평와셔 M8, 아연도금', 1, 'EA', 30.00, NULL),
    (8, 'FST-WSHR-M10', '평와셔 M10', '평와셔 M10, 아연도금', 1, 'EA', 40.00, NULL),
    (9, 'FST-SCRW-M4X10', '접시머리 나사 M4x10', '접시머리 나사 M4x10mm, 스테인리스', 1, 'EA', 80.00, NULL),
    (10, 'FST-SCRW-M5X15', '접시머리 나사 M5x15', '접시머리 나사 M5x15mm, 스테인리스', 1, 'EA', 100.00, NULL),

    -- 원자재 (Raw Materials)
    (11, 'RAW-SS304-1.0T', 'SUS304 판재 1.0T', 'SUS304 스테인리스 판재, 두께 1.0mm, 4x8 사이즈', 2, 'SHEET', 85000.00, 13),
    (12, 'RAW-SS304-1.5T', 'SUS304 판재 1.5T', 'SUS304 스테인리스 판재, 두께 1.5mm, 4x8 사이즈', 2, 'SHEET', 125000.00, 13),
    (13, 'RAW-SS304-2.0T', 'SUS304 판재 2.0T', 'SUS304 스테인리스 판재, 두께 2.0mm, 4x8 사이즈', 2, 'SHEET', 165000.00, 13),
    (14, 'RAW-SPCC-1.0T', 'SPCC 냉연강판 1.0T', 'SPCC 냉연강판, 두께 1.0mm, 4x8 사이즈', 2, 'SHEET', 45000.00, NULL),
    (15, 'RAW-SPCC-1.6T', 'SPCC 냉연강판 1.6T', 'SPCC 냉연강판, 두께 1.6mm, 4x8 사이즈', 2, 'SHEET', 72000.00, NULL),
    (16, 'RAW-SPCC-2.0T', 'SPCC 냉연강판 2.0T', 'SPCC 냉연강판, 두께 2.0mm, 4x8 사이즈', 2, 'SHEET', 90000.00, NULL),
    (17, 'RAW-AL5052-1.5T', '알루미늄 5052 판재 1.5T', '알루미늄 5052-H32 판재, 두께 1.5mm, 4x8 사이즈', 2, 'SHEET', 95000.00, NULL),
    (18, 'RAW-AL5052-2.0T', '알루미늄 5052 판재 2.0T', '알루미늄 5052-H32 판재, 두께 2.0mm, 4x8 사이즈', 2, 'SHEET', 125000.00, NULL),
    (19, 'RAW-PIPE-25A', '배관 파이프 25A', '탄소강 배관 25A, SCH40, 6m', 2, 'EA', 28000.00, NULL),
    (20, 'RAW-PIPE-50A', '배관 파이프 50A', '탄소강 배관 50A, SCH40, 6m', 2, 'EA', 55000.00, NULL),

    -- 공구 (Tools)
    (21, 'TL-DRILL-6.0', '드릴비트 6.0mm', 'HSS 드릴비트 6.0mm, 금속용', 3, 'EA', 3500.00, NULL),
    (22, 'TL-DRILL-8.0', '드릴비트 8.0mm', 'HSS 드릴비트 8.0mm, 금속용', 3, 'EA', 4500.00, NULL),
    (23, 'TL-DRILL-10.0', '드릴비트 10.0mm', 'HSS 드릴비트 10.0mm, 금속용', 3, 'EA', 5500.00, NULL),
    (24, 'TL-TAP-M8', '탭 M8x1.25', '핸드탭 M8x1.25, HSS, 3개 세트', 3, 'SET', 15000.00, NULL),
    (25, 'TL-TAP-M10', '탭 M10x1.5', '핸드탭 M10x1.5, HSS, 3개 세트', 3, 'SET', 18000.00, NULL),
    (26, 'TL-ENDMILL-10', '엔드밀 10mm', '초경 엔드밀 10mm, 4날', 3, 'EA', 35000.00, NULL),
    (27, 'TL-ENDMILL-12', '엔드밀 12mm', '초경 엔드밀 12mm, 4날', 3, 'EA', 42000.00, NULL),
    (28, 'TL-INSERT-CNMG', '인서트 CNMG120408', '초경 선삭 인서트 CNMG120408, 코팅', 3, 'EA', 8500.00, NULL),

    -- 소모품 (Consumables)
    (29, 'CON-WELD-1.2', '용접봉 1.2mm', 'MIG 용접 와이어 1.2mm, 15kg, ER70S-6', 4, 'SPOOL', 85000.00, NULL),
    (30, 'CON-WELD-1.0', '용접봉 1.0mm', 'MIG 용접 와이어 1.0mm, 15kg, ER70S-6', 4, 'SPOOL', 82000.00, NULL),
    (31, 'CON-GRIND-125', '연마디스크 125mm', '연마디스크 125mm, 앵글그라인더용', 4, 'EA', 2500.00, NULL),
    (32, 'CON-CUTOFF-125', '절단석 125mm', '절단석 125mm, 금속용', 4, 'EA', 1800.00, NULL),
    (33, 'CON-SANDPAPER-120', '사포 #120', '사포 #120 입도, 230x280mm', 4, 'SHEET', 500.00, NULL),
    (34, 'CON-SANDPAPER-240', '사포 #240', '사포 #240 입도, 230x280mm', 4, 'SHEET', 500.00, NULL),
    (35, 'CON-LUBRICANT', '절삭유 20L', '수용성 절삭유, 20L', 4, 'CAN', 65000.00, NULL),
    (36, 'CON-THINNER', '신나 18L', '페인트 신나, 18L', 4, 'CAN', 45000.00, NULL),

    -- 전기부품 (Electrical Components)
    (37, 'ELC-CABLE-2.5', '전선 2.5sq', '전선 2.5sq mm, 100m 롤, 흑색', 5, 'ROLL', 75000.00, NULL),
    (38, 'ELC-CABLE-4.0', '전선 4.0sq', '전선 4.0sq mm, 100m 롤, 흑색', 5, 'ROLL', 120000.00, NULL),
    (39, 'ELC-TERM-4', '압착단자 4sq', '압착단자 4sq용, 링타입', 5, 'PK', 8000.00, NULL),
    (40, 'ELC-CONN-4P', '커넥터 4핀', '4핀 커넥터, 방수, 하우징 포함', 5, 'SET', 3500.00, NULL),
    (41, 'ELC-SWITCH-20A', '토글스위치 20A', '토글스위치 20A, SPST, 패널마운트', 5, 'EA', 4500.00, NULL),
    (42, 'ELC-RELAY-24V', '릴레이 24V 10A', '릴레이 24VDC 코일, 10A 접점, 소켓 포함', 5, 'EA', 12000.00, NULL),
    (43, 'ELC-FUSE-10A', '퓨즈 10A', '블레이드 퓨즈 10A, 자동차용', 5, 'EA', 300.00, NULL),
    (44, 'ELC-LED-24V', 'LED 표시등 24V', 'LED 표시등 24V, 패널마운트, 녹색', 5, 'EA', 2500.00, NULL),

    -- 기타 (Other)
    (45, 'ETC-GASKET-NBR', '가스켓 NBR', 'NBR 고무 가스켓 시트, 3mm, 1mx1m', 6, 'SHEET', 45000.00, NULL),
    (46, 'ETC-TAPE-TEFLON', '테프론 테이프', 'PTFE 테이프, 배관 실링용, 12mm x 10m', 6, 'EA', 1500.00, NULL),
    (47, 'ETC-SILICONE', '실리콘 실란트', 'RTV 실리콘 실란트, 300ml 카트리지', 6, 'EA', 8500.00, NULL),
    (48, 'ETC-LABEL', '라벨 스티커', '경고 라벨 스티커, 종합 팩', 6, 'PK', 12000.00, NULL)
ON CONFLICT (id) DO NOTHING;

SELECT setval('materials_id_seq', (SELECT MAX(id) FROM materials));

-- =====================================================================
-- PRODUCT TYPES & PRODUCTS
-- =====================================================================

INSERT INTO product_types (id, name, description)
VALUES (1, '판금 부품', '맞춤형 판금 제작 및 조립'),
       (2, '기계 가공품', '정밀 CNC 기계 가공 부품'),
       (3, '용접 조립품', '용접 구조물 및 조립품'),
       (4, '맞춤형 함체', '전자 및 산업용 함체')
ON CONFLICT (id) DO NOTHING;

SELECT setval('product_types_id_seq', (SELECT MAX(id) FROM product_types));

INSERT INTO work_progress_step_templates (product_type_id, step_name, step_number, is_required, estimated_hours,
                                          is_outsourceable)
VALUES (1, '설계', 1, true, 2.0, false),
       (1, '레이저 컷팅', 2, true, 1.0, true),
       (1, '판금 성형', 3, true, 1.5, true),
       (1, '용접', 4, false, 2.0, true),
       (1, '연마', 5, false, 1.0, true),
       (1, '도장', 6, false, 3.0, true),
       (1, '포장', 7, true, 0.5, false),
       (2, '설계', 1, true, 3.0, false),
       (2, '자재 준비', 2, true, 1.0, false),
       (2, 'CNC 밀링', 3, true, 4.0, true),
       (2, 'CNC 선반', 4, false, 3.0, true),
       (2, '연마', 5, false, 1.5, true),
       (2, '표면 처리', 6, false, 2.0, true),
       (2, '품질 검사', 7, true, 1.0, false),
       (2, '포장', 8, true, 0.5, false),
       (3, '설계', 1, true, 4.0, false),
       (3, '레이저 컷팅', 2, true, 1.5, true),
       (3, '판금 성형', 3, true, 2.0, true),
       (3, '용접', 4, true, 6.0, true),
       (3, '연마', 5, true, 2.0, true),
       (3, '도장', 6, false, 3.0, true),
       (3, '최종 조립', 7, true, 3.0, false),
       (3, '포장', 8, true, 0.5, false),
       (4, '설계', 1, true, 5.0, false),
       (4, '레이저 컷팅', 2, true, 2.0, true),
       (4, '판금 성형', 3, true, 2.0, true),
       (4, '용접', 4, true, 4.0, true),
       (4, '분체 도장', 5, true, 4.0, true),
       (4, '하드웨어 설치', 6, false, 2.0, false),
       (4, '최종 조립', 7, true, 2.0, false),
       (4, '포장', 8, true, 0.5, false)
ON CONFLICT DO NOTHING;

INSERT INTO products (id, sku, name, description, product_type_id, base_unit_price, unit, is_active)
VALUES (1, 'SM-PANEL-001', '제어 패널 300x400mm', '판금 제어 패널, 두께 1.5mm', 1, 45000.00, 'EA', true),
       (2, 'SM-BRACKET-001', 'L-브라켓 50x50x2mm', '스틸 L-브라켓, 아연도금', 1, 3500.00, 'EA', true),
       (3, 'SM-COVER-001', '장비 커버 500x600mm', '보호 커버, 스테인리스 2mm', 1, 85000.00, 'EA', true),
       (4, 'MC-SHAFT-001', '구동 샤프트 Ø30x200mm', '정밀 선삭 샤프트, 경화강', 2, 65000.00, 'EA', true),
       (5, 'MC-FLANGE-001', '마운팅 플랜지 Ø150mm', 'CNC 가공 플랜지, 알루미늄', 2, 42000.00, 'EA', true),
       (6, 'MC-BLOCK-001', '지지 블록 80x80x40mm', '가공 지지 블록, 주철', 2, 28000.00, 'EA', true),
       (7, 'WA-FRAME-001', '장비 프레임 1000x800mm', '용접 스틸 프레임 구조물', 3, 185000.00, 'EA', true),
       (8, 'WA-TABLE-001', '작업대 1200x600mm', '중량 용접 테이블', 3, 220000.00, 'EA', true),
       (9, 'CE-CABINET-001', '전기 캐비닛 600x800x300mm', '분체도장 스틸 캐비닛', 4, 350000.00, 'EA', true),
       (10, 'CE-BOX-001', '정션박스 200x200x150mm', '방수 전기 박스', 4, 48000.00, 'EA', true),
       (11, 'CE-HOUSING-001', '모터 하우징 Ø200x300mm', '가공 및 용접 모터 하우징', 4, 125000.00, 'EA', true),
       (12, 'SM-PLATE-001', '마운팅 플레이트 400x400x5mm', '레이저 컷팅 스틸 플레이트, 홀가공', 1, 32000.00, 'EA', true),
       (13, 'MC-BUSHING-001', '슬리브 부싱 Ø40/30x50mm', '청동 부싱', 2, 18000.00, 'EA', true),
       (14, 'WA-GUARD-001', '기계 가드 800x1200mm', '메쉬 안전 가드', 3, 95000.00, 'EA', true),
       (15, 'CE-PANEL-001', '계기 패널 400x600x120mm', '전면 접근 패널', 4, 78000.00, 'EA', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- =====================================================================
-- APPROVAL CHAIN TEMPLATES
-- =====================================================================

INSERT INTO approval_chain_templates (entity_type, name, description, is_active)
VALUES ('QUOTATION', '견적서 결재', '견적서 승인을 위한 결재 라인', true);

-- =====================================================================
-- PROJECTS & QUOTATIONS
-- =====================================================================

INSERT INTO job_code_sequences (id, year, last_sequence)
VALUES (1, '25', 3)
ON CONFLICT (year) DO UPDATE SET last_sequence = 3;

SELECT setval('job_code_sequences_id_seq', (SELECT COALESCE(MAX(id), 1) FROM job_code_sequences));

INSERT INTO projects (id, job_code, customer_company_id, project_name, requester_name, due_date, internal_owner_id,
                      status, created_by_id, created_at, updated_at)
VALUES (1, 'WK2K25-0001-0115', 1, '삼성전자 본사 제어 패널 업그레이드', '김민준', '2025-02-28', 1, 'ACTIVE', 1, CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       (2, 'WK2K25-0002-0118', 2, '현대자동차 조립라인 장비', '이수진', '2025-03-15', 2, 'ACTIVE', 2, CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       (3, 'WK2K25-0003-0120', 3, 'LG디스플레이 클린룸 함체', '박지훈', '2025-04-01', 4, 'DRAFT', 4, CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

SELECT setval('projects_id_seq', (SELECT COALESCE(MAX(id), 1) FROM projects));

INSERT INTO quotations (id, project_id, version, status, quotation_date, validity_days, total_amount, notes,
                        created_by_id, submitted_at, approved_at, approved_by_id, created_at, updated_at)
VALUES (1, 1, 1, 'DRAFT', '2025-01-15', 30, 682000.00, '삼성전자 본사 초기 견적', 1, NULL, NULL, NULL, CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       (2, 2, 1, 'PENDING', '2025-01-18', 30, 1255000.00, '현대자동차 조립라인 장비 견적', 2, CURRENT_TIMESTAMP, NULL, NULL,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (3, 3, 1, 'APPROVED', '2025-01-20', 30, 1295000.00, 'LG디스플레이 승인 견적', 4, CURRENT_TIMESTAMP - INTERVAL '2 days',
        CURRENT_TIMESTAMP - INTERVAL '1 day', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (project_id, version) DO NOTHING;

SELECT setval('quotations_id_seq', (SELECT COALESCE(MAX(id), 1) FROM quotations));

INSERT INTO quotation_line_items (id, quotation_id, product_id, sequence, quantity, unit_price, line_total, notes,
                                  created_at, updated_at)
VALUES (1, 1, 1, 1, 5, 45000.00, 225000.00, '서버실용 제어 패널', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (2, 1, 2, 2, 20, 3500.00, 70000.00, '마운팅용 L-브라켓', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (3, 1, 3, 3, 3, 85000.00, 255000.00, '장비 커버', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (4, 1, 12, 4, 4, 32000.00, 132000.00, '마운팅 플레이트', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (5, 2, 7, 1, 3, 185000.00, 555000.00, '메인 장비 프레임', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6, 2, 8, 2, 2, 220000.00, 440000.00, '중량 작업대', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (7, 2, 4, 3, 4, 65000.00, 260000.00, '구동 샤프트', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (8, 3, 9, 1, 2, 350000.00, 700000.00, '전기 캐비닛', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (9, 3, 10, 2, 5, 48000.00, 240000.00, '정션박스', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (10, 3, 15, 3, 3, 78000.00, 234000.00, '계기 패널', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (11, 3, 11, 4, 1, 125000.00, 125000.00, '모터 하우징 (예비품)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
VALUES (1, 'node-1-1', '설계', '김설계', CURRENT_DATE - INTERVAL '5 days', 100, 100, 100),
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
VALUES (1, 'edge-1-1', 'node-1-1', 'node-1-2'),
       (1, 'edge-1-2', 'node-1-2', 'node-1-3'),
       (1, 'edge-1-3', 'node-1-3', 'node-1-4'),
       (2, 'edge-2-1a', 'node-2-1', 'node-2-2a'),
       (2, 'edge-2-1b', 'node-2-1', 'node-2-2b'),
       (2, 'edge-2-1c', 'node-2-1', 'node-2-2c'),
       (2, 'edge-2-2a', 'node-2-2a', 'node-2-3'),
       (2, 'edge-2-2b', 'node-2-2b', 'node-2-3'),
       (2, 'edge-2-2c', 'node-2-2c', 'node-2-3'),
       (3, 'edge-3-1', 'node-3-1', 'node-3-3'),
       (3, 'edge-3-2', 'node-3-1', 'node-3-4'),
       (3, 'edge-3-3', 'node-3-2', 'node-3-3'),
       (3, 'edge-3-4', 'node-3-2', 'node-3-5'),
       (3, 'edge-3-5', 'node-3-3', 'node-3-6'),
       (3, 'edge-3-6', 'node-3-4', 'node-3-6'),
       (3, 'edge-3-7', 'node-3-5', 'node-3-7'),
       (3, 'edge-3-8', 'node-3-6', 'node-3-8'),
       (3, 'edge-3-9', 'node-3-7', 'node-3-8'),
       (3, 'edge-3-10', 'node-3-8', 'node-3-9')
ON CONFLICT (flow_id, edge_id) DO NOTHING;

SELECT setval('task_flows_id_seq', (SELECT COALESCE(MAX(id), 1) FROM task_flows));

-- =====================================================================
-- PURCHASE REQUESTS, RFQ, PO
-- =====================================================================

INSERT INTO purchase_requests (id, dtype, project_id, service_category_id, request_number, description, quantity, uom,
                               required_date, status, created_by_id, created_at, updated_at)
VALUES (1, 'SERVICE', 1, 2, 'PR-2025-000001', 'Samsung HQ 레이저 컷팅 외주', 50.00, 'EA', '2025-02-15', 'VENDOR_SELECTED', 1,
        CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP),
       (2, 'SERVICE', 2, 6, 'PR-2025-000002', '현대차 조립라인 프레임 용접 외주', 3.00, 'SET', '2025-03-01', 'RFQ_SENT', 3,
        CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP),
       (3, 'SERVICE', 3, 4, 'PR-2025-000003', 'LG디스플레이 클린룸 캐비닛 도장 외주', 7.00, 'EA', '2025-03-20', 'DRAFT', 4,
        CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP),
       (4, 'SERVICE', 1, 1, 'PR-2025-000004', 'Samsung HQ 정밀 CNC 가공 외주', 20.00, 'EA', '2025-01-30', 'CLOSED', 1,
        CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP),
       (5, 'SERVICE', 2, 5, 'PR-2025-000005', '(취소) 현대차 절곡 외주', 10.00, 'EA', '2025-02-20', 'CANCELED', 3,
        CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

SELECT setval('purchase_requests_id_seq', (SELECT COALESCE(MAX(id), 1) FROM purchase_requests));

-- RFQ Items (Embeddable collection - composite PK: purchase_request_id + item_id)
INSERT INTO rfq_items (purchase_request_id, item_id, vendor_company_id, vendor_offering_id, status, quoted_price,
                       quoted_lead_time, notes, sent_at, replied_at)
VALUES (1, '550e8400-e29b-41d4-a716-446655440001', 9, 2, 'SELECTED', 4000000.00, 5, '스테인리스 레이저 컷팅 50EA - 특별가',
        CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '7 days'),
       (1, '550e8400-e29b-41d4-a716-446655440002', 10, NULL, 'REJECTED', 4500000.00, 7, '외주 레이저 위탁 가능',
        CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '6 days'),
       (2, '550e8400-e29b-41d4-a716-446655440003', 10, 5, 'REPLIED', 9500000.00, 10, 'TIG 용접 포함',
        CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '2 days'),
       (2, '550e8400-e29b-41d4-a716-446655440004', 11, NULL, 'SENT', NULL, NULL, NULL,
        CURRENT_TIMESTAMP - INTERVAL '4 days', NULL),
       (4, '550e8400-e29b-41d4-a716-446655440005', 11, 7, 'SELECTED', 1200000.00, 7, 'CNC 정밀 밀링 - 20EA',
        CURRENT_TIMESTAMP - INTERVAL '18 days', CURRENT_TIMESTAMP - INTERVAL '16 days')
ON CONFLICT (purchase_request_id, item_id) DO NOTHING;

-- Purchase Orders (references purchase_request_id + rfq_item_id UUID)
INSERT INTO purchase_orders (id, purchase_request_id, rfq_item_id, project_id, vendor_company_id, po_number, order_date,
                             expected_delivery_date, total_amount, currency, status, notes, created_by_id, created_at,
                             updated_at)
VALUES (1, 1, '550e8400-e29b-41d4-a716-446655440001', 1, 9, 'PO-2025-000001', CURRENT_DATE - INTERVAL '5 days',
        CURRENT_DATE + INTERVAL '3 days', 4000000.00, 'KRW', 'CONFIRMED', '레이저컷팅솔루션 - 스테인리스 패널 50EA', 1,
        CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP),
       (2, 4, '550e8400-e29b-41d4-a716-446655440005', 1, 11, 'PO-2025-000002', CURRENT_DATE - INTERVAL '14 days',
        CURRENT_DATE - INTERVAL '5 days', 1200000.00, 'KRW', 'RECEIVED', '정밀기계가공 - CNC 밀링 20EA 수령 완료', 1,
        CURRENT_TIMESTAMP - INTERVAL '14 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

SELECT setval('purchase_orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM purchase_orders));
