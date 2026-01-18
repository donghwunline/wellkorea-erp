-- ============================================================================
-- V12: Seed Data for Vendor Material Offerings
-- ============================================================================
-- Populates vendor_material_offerings table with sample data for RFQ testing.
-- Maps vendors (companies with VENDOR role) to materials with pricing.
-- ============================================================================

-- Vendor IDs from V10:
--   9  = Laser Cutting Solutions (금속가공)
--   10 = Sheet Metal Fabricators (금속가공)
--   11 = Precision Machining Co. (정밀가공)
--   12 = Industrial Coating Services (도장)
--   13 = Samsung SDI (배터리)

-- Material IDs from V10:
--   1-10  = Fasteners (패스너)
--   11-15 = Raw Materials (원자재)
--   16-20 = Tools (공구)
--   21-25 = Consumables (소모품)

INSERT INTO vendor_material_offerings (vendor_company_id, material_id, vendor_material_code, vendor_material_name,
                                       unit_price, currency, lead_time_days, min_order_quantity, is_preferred, notes)
VALUES
    -- Vendor 9 (Laser Cutting Solutions) - Supplies raw materials (steel sheets)
    (9, 11, 'LCS-SS304-1.0', 'SUS304 1.0T 판재 (LC)', 82000.00, 'KRW', 3, 5, true, '대량 구매시 할인 가능'),
    (9, 12, 'LCS-SS304-1.5', 'SUS304 1.5T 판재 (LC)', 95000.00, 'KRW', 3, 5, true, '대량 구매시 할인 가능'),
    (9, 13, 'LCS-AL5052-2.0', '알루미늄 5052 2.0T (LC)', 48000.00, 'KRW', 2, 10, false, '재고 상시 보유'),

    -- Vendor 10 (Sheet Metal Fabricators) - Supplies fasteners and raw materials
    (10, 1, 'SMF-BOLT-M8', '육각볼트 M8x30 (SMF)', 140.00, 'KRW', 2, 100, true, '100개 단위 판매'),
    (10, 2, 'SMF-BOLT-M10', '육각볼트 M10x40 (SMF)', 230.00, 'KRW', 2, 100, true, '100개 단위 판매'),
    (10, 4, 'SMF-NUT-M8', '육각너트 M8 (SMF)', 45.00, 'KRW', 2, 100, true, '100개 단위 판매'),
    (10, 5, 'SMF-NUT-M10', '육각너트 M10 (SMF)', 75.00, 'KRW', 2, 100, true, '100개 단위 판매'),
    (10, 11, 'SMF-SS304-1.0', 'SUS304 1.0T 판재 (SMF)', 84000.00, 'KRW', 4, 3, false, '소량 주문 가능'),
    (10, 14, 'SMF-SPCC-1.6', 'SPCC 1.6T 철판 (SMF)', 42000.00, 'KRW', 3, 5, true, '가격 경쟁력 우수'),

    -- Vendor 11 (Precision Machining Co.) - Supplies tools and fasteners
    (11, 1, 'PMC-BOLT-M8', '육각볼트 M8x30 (PMC)', 145.00, 'KRW', 3, 50, false, '50개 단위 판매'),
    (11, 3, 'PMC-BOLT-M12', '육각볼트 M12x50 (PMC)', 430.00, 'KRW', 3, 50, true, '고강도 볼트 전문'),
    (11, 6, 'PMC-NUT-M12', '육각너트 M12 (PMC)', 115.00, 'KRW', 3, 50, true, '고강도 너트 전문'),
    (11, 16, 'PMC-ENDMILL-6', '엔드밀 Ø6 (PMC)', 12000.00, 'KRW', 1, 5, true, '공구 전문'),
    (11, 17, 'PMC-ENDMILL-8', '엔드밀 Ø8 (PMC)', 15000.00, 'KRW', 1, 5, true, '공구 전문'),
    (11, 18, 'PMC-ENDMILL-10', '엔드밀 Ø10 (PMC)', 18000.00, 'KRW', 1, 5, true, '공구 전문'),

    -- Vendor 12 (Industrial Coating Services) - Supplies consumables (paint, chemicals)
    (12, 21, 'ICS-LUBRICANT', '산업용 윤활유 (ICS)', 28000.00, 'KRW', 2, 5, true, '도장 작업 전용'),
    (12, 22, 'ICS-ADHESIVE', '산업용 접착제 (ICS)', 15000.00, 'KRW', 2, 10, true, '내열성 접착제'),
    (12, 23, 'ICS-ABRASIVE', '연마재 (ICS)', 8500.00, 'KRW', 2, 20, false, '도장 전처리용'),

    -- Vendor 13 (Samsung SDI) - Supplies electrical components
    (13, 11, 'SSDI-SS304-1.0', 'SUS304 1.0T 판재 (SDI)', 88000.00, 'KRW', 5, 10, false, '품질 보증'),
    (13, 12, 'SSDI-SS304-1.5', 'SUS304 1.5T 판재 (SDI)', 98000.00, 'KRW', 5, 10, false, '품질 보증'),
    (13, 15, 'SSDI-SS316-2.0', 'SUS316 2.0T 판재 (SDI)', 145000.00, 'KRW', 7, 5, true, '프리미엄 스테인리스')
ON CONFLICT DO NOTHING;
