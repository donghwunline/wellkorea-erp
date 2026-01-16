-- V20: Seed purchasing data for development and testing
-- Migration Date: 2026-01-16
-- Purpose: Populate database with test purchase requests, RFQ items, and purchase orders
-- for US8 (Purchasing & Vendor Service Management) verification

-- =====================================================================
-- PURCHASE REQUESTS (Linked to existing projects)
-- =====================================================================

-- Purchase Request 1: Samsung project - VENDOR_SELECTED status (ready for PO)
INSERT INTO purchase_requests (id, project_id, service_category_id, request_number, description, quantity, uom,
                               required_date, status, created_by_id, created_at, updated_at)
VALUES (1, 1, 2, 'PR-2025-000001', 'Samsung HQ 프로젝트용 레이저 컷팅 외주 (스테인리스 패널)', 50.00, 'EA',
        '2025-02-15', 'VENDOR_SELECTED', 1, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Purchase Request 2: Hyundai project - RFQ_SENT status (awaiting vendor response)
INSERT INTO purchase_requests (id, project_id, service_category_id, request_number, description, quantity, uom,
                               required_date, status, created_by_id, created_at, updated_at)
VALUES (2, 2, 6, 'PR-2025-000002', '현대차 조립라인 프레임 용접 외주', 3.00, 'SET',
        '2025-03-01', 'RFQ_SENT', 3, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Purchase Request 3: LG Display project - DRAFT status (not yet sent)
INSERT INTO purchase_requests (id, project_id, service_category_id, request_number, description, quantity, uom,
                               required_date, status, created_by_id, created_at, updated_at)
VALUES (3, 3, 4, 'PR-2025-000003', 'LG디스플레이 클린룸 캐비닛 도장 외주', 7.00, 'EA',
        '2025-03-20', 'DRAFT', 4, CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Purchase Request 4: Samsung project - CLOSED status (completed)
INSERT INTO purchase_requests (id, project_id, service_category_id, request_number, description, quantity, uom,
                               required_date, status, created_by_id, created_at, updated_at)
VALUES (4, 1, 1, 'PR-2025-000004', 'Samsung HQ 정밀 CNC 가공 외주', 20.00, 'EA',
        '2025-01-30', 'CLOSED', 1, CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Purchase Request 5: Hyundai project - CANCELED status
INSERT INTO purchase_requests (id, project_id, service_category_id, request_number, description, quantity, uom,
                               required_date, status, created_by_id, created_at, updated_at)
VALUES (5, 2, 5, 'PR-2025-000005', '(취소) 현대차 절곡 외주 - 내부 처리로 변경', 10.00, 'EA',
        '2025-02-20', 'CANCELED', 3, CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for purchase_requests table
SELECT setval('purchase_requests_id_seq', (SELECT COALESCE(MAX(id), 1) FROM purchase_requests));

-- =====================================================================
-- RFQ ITEMS (Vendor quotes for purchase requests)
-- =====================================================================

-- RFQ Items for PR-1 (Samsung Laser Cutting - VENDOR_SELECTED)
-- Sent to Laser Cutting Solutions (ID: 9) - SELECTED
INSERT INTO rfq_items (id, purchase_request_id, vendor_company_id, vendor_offering_id, status,
                       quoted_price, quoted_lead_time, notes, sent_at, replied_at, created_at, updated_at)
VALUES (1, 1, 9, 2, 'SELECTED',
        4000000.00, 5, '스테인리스 레이저 컷팅 50EA - 특별가 적용',
        CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '7 days',
        CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Sent to Sheet Metal Fabricators (ID: 10) - REJECTED (higher price)
INSERT INTO rfq_items (id, purchase_request_id, vendor_company_id, vendor_offering_id, status,
                       quoted_price, quoted_lead_time, notes, sent_at, replied_at, created_at, updated_at)
VALUES (2, 1, 10, NULL, 'REJECTED',
        4500000.00, 7, '외주 레이저 위탁 가능, 추가 납기 소요',
        CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '6 days',
        CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- RFQ Items for PR-2 (Hyundai Welding - RFQ_SENT)
-- Sent to Sheet Metal Fabricators (ID: 10) - REPLIED
INSERT INTO rfq_items (id, purchase_request_id, vendor_company_id, vendor_offering_id, status,
                       quoted_price, quoted_lead_time, notes, sent_at, replied_at, created_at, updated_at)
VALUES (3, 2, 10, 5, 'REPLIED',
        9500000.00, 10, 'TIG 용접 포함, 품질보증 가능',
        CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '2 days',
        CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Sent to Precision Machining Co. (ID: 11) - SENT (no response yet)
INSERT INTO rfq_items (id, purchase_request_id, vendor_company_id, vendor_offering_id, status,
                       quoted_price, quoted_lead_time, notes, sent_at, replied_at, created_at, updated_at)
VALUES (4, 2, 11, NULL, 'SENT',
        NULL, NULL, NULL,
        CURRENT_TIMESTAMP - INTERVAL '4 days', NULL,
        CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- RFQ Items for PR-4 (Samsung CNC - CLOSED, has completed PO)
-- Sent to Precision Machining Co. (ID: 11) - SELECTED
INSERT INTO rfq_items (id, purchase_request_id, vendor_company_id, vendor_offering_id, status,
                       quoted_price, quoted_lead_time, notes, sent_at, replied_at, created_at, updated_at)
VALUES (5, 4, 11, 7, 'SELECTED',
        1200000.00, 7, 'CNC 정밀 밀링 - 20EA 일괄 납품',
        CURRENT_TIMESTAMP - INTERVAL '18 days', CURRENT_TIMESTAMP - INTERVAL '16 days',
        CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for rfq_items table
SELECT setval('rfq_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM rfq_items));

-- =====================================================================
-- PURCHASE ORDERS (Orders to vendors)
-- =====================================================================

-- PO-1: Samsung Laser Cutting - CONFIRMED (awaiting delivery)
INSERT INTO purchase_orders (id, rfq_item_id, project_id, vendor_company_id, po_number,
                             order_date, expected_delivery_date, total_amount, currency, status, notes,
                             created_by_id, created_at, updated_at)
VALUES (1, 1, 1, 9, 'PO-2025-000001',
        CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '3 days',
        4000000.00, 'KRW', 'CONFIRMED',
        '레이저 컷팅 솔루션 - 스테인리스 패널 50EA 발주 확정',
        1, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- PO-2: Samsung CNC Machining - RECEIVED (completed delivery)
INSERT INTO purchase_orders (id, rfq_item_id, project_id, vendor_company_id, po_number,
                             order_date, expected_delivery_date, total_amount, currency, status, notes,
                             created_by_id, created_at, updated_at)
VALUES (2, 5, 1, 11, 'PO-2025-000002',
        CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE - INTERVAL '5 days',
        1200000.00, 'KRW', 'RECEIVED',
        '정밀 가공 - CNC 밀링 20EA 수령 완료',
        1, CURRENT_TIMESTAMP - INTERVAL '14 days', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for purchase_orders table
SELECT setval('purchase_orders_id_seq', (SELECT COALESCE(MAX(id), 1) FROM purchase_orders));

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE purchase_requests IS 'Sample purchase requests in various states for testing';
COMMENT ON TABLE rfq_items IS 'Sample RFQ items showing vendor quotation workflow';
COMMENT ON TABLE purchase_orders IS 'Sample purchase orders from approved vendor selections';
