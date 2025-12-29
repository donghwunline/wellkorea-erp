-- V8: Seed quotation data for development and testing
-- Migration Date: 2025-12-20
-- Purpose: Populate database with test projects and quotations for US2 verification

-- =====================================================================
-- PROJECTS (Required for quotations)
-- =====================================================================

-- First, seed the job_code_sequences table for year 2025
-- Format: year is 2-digit (e.g., "25" for 2025)
INSERT INTO job_code_sequences (id, year, last_sequence)
VALUES (1, '25', 3)
ON CONFLICT (year) DO UPDATE SET last_sequence = 3;

-- Reset sequence
SELECT setval('job_code_sequences_id_seq', (SELECT COALESCE(MAX(id), 1) FROM job_code_sequences));

-- Create sample projects with JobCodes
-- Format: WK2K{YY}-{SSSS}-{MMDD} (e.g., WK2K25-0001-0115)
-- Schema: id, job_code, customer_company_id, project_name, requester_name, due_date, internal_owner_id, status, created_by_id
INSERT INTO projects (id, job_code, customer_company_id, project_name, requester_name, due_date, internal_owner_id, status,
                      created_by_id, created_at, updated_at)
VALUES
    -- Samsung project
    (1, 'WK2K25-0001-0115', 1, 'Samsung HQ Control Panel Upgrade',
     'Kim Min-jun', '2025-02-28', 1, 'ACTIVE', 1,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- Hyundai project
    (2, 'WK2K25-0002-0118', 2, 'Hyundai Motor Assembly Line Equipment',
     'Lee Soo-jin', '2025-03-15', 2, 'ACTIVE', 2,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    -- LG Display project
    (3, 'WK2K25-0003-0120', 3, 'LG Display Cleanroom Enclosures',
     'Park Ji-hoon', '2025-04-01', 4, 'DRAFT', 4,
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for projects table
SELECT setval('projects_id_seq', (SELECT COALESCE(MAX(id), 1) FROM projects));

-- =====================================================================
-- QUOTATIONS
-- =====================================================================

-- Quotation 1: Samsung - DRAFT status (can be edited)
INSERT INTO quotations (id, project_id, version, status, quotation_date, validity_days, total_amount, notes,
                        created_by_id, created_at, updated_at)
VALUES (1, 1, 1, 'DRAFT', '2025-01-15', 30, 682000.00,
        'Initial quotation for Samsung HQ control panel upgrade project', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (project_id, version) DO NOTHING;

-- Quotation 2: Hyundai - PENDING status (awaiting approval)
INSERT INTO quotations (id, project_id, version, status, quotation_date, validity_days, total_amount, notes,
                        created_by_id, submitted_at, created_at, updated_at)
VALUES (2, 2, 1, 'PENDING', '2025-01-18', 30, 1255000.00,
        'Quotation for Hyundai motor assembly line equipment - includes heavy-duty worktable and welded frame', 2,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (project_id, version) DO NOTHING;

-- Quotation 3: LG Display - APPROVED status
INSERT INTO quotations (id, project_id, version, status, quotation_date, validity_days, total_amount, notes,
                        created_by_id, submitted_at, approved_at, approved_by_id, created_at, updated_at)
VALUES (3, 3, 1, 'APPROVED', '2025-01-20', 30, 1295000.00,
        'Approved quotation for LG Display cleanroom enclosures', 4, CURRENT_TIMESTAMP - INTERVAL '2 days',
        CURRENT_TIMESTAMP - INTERVAL '1 day', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (project_id, version) DO NOTHING;

-- Reset sequence for quotations table
SELECT setval('quotations_id_seq', (SELECT COALESCE(MAX(id), 1) FROM quotations));

-- =====================================================================
-- QUOTATION LINE ITEMS
-- =====================================================================

-- Line items for Quotation 1 (Samsung - DRAFT)
INSERT INTO quotation_line_items (id, quotation_id, product_id, sequence, quantity, unit_price, line_total, notes,
                                  created_at, updated_at)
VALUES (1, 1, 1, 1, 5, 45000.00, 225000.00, 'Control panels for server room', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (2, 1, 2, 2, 20, 3500.00, 70000.00, 'L-brackets for mounting', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (3, 1, 3, 3, 3, 85000.00, 255000.00, 'Equipment covers', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (4, 1, 12, 4, 4, 32000.00, 132000.00, 'Mounting plates', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (quotation_id, sequence) DO NOTHING;

-- Line items for Quotation 2 (Hyundai - PENDING)
INSERT INTO quotation_line_items (id, quotation_id, product_id, sequence, quantity, unit_price, line_total, notes,
                                  created_at, updated_at)
VALUES (5, 2, 7, 1, 3, 185000.00, 555000.00, 'Main equipment frames', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (6, 2, 8, 2, 2, 220000.00, 440000.00, 'Heavy-duty worktables', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (7, 2, 4, 3, 4, 65000.00, 260000.00, 'Drive shafts for conveyor system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (quotation_id, sequence) DO NOTHING;

-- Line items for Quotation 3 (LG Display - APPROVED)
INSERT INTO quotation_line_items (id, quotation_id, product_id, sequence, quantity, unit_price, line_total, notes,
                                  created_at, updated_at)
VALUES (8, 3, 9, 1, 2, 350000.00, 700000.00, 'Electrical cabinets for cleanroom', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (9, 3, 10, 2, 5, 48000.00, 240000.00, 'Junction boxes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (10, 3, 15, 3, 3, 78000.00, 234000.00, 'Instrument panels', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       (11, 3, 11, 4, 1, 125000.00, 125000.00, 'Motor housing (spare)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (quotation_id, sequence) DO NOTHING;

-- Reset sequence for quotation_line_items table
SELECT setval('quotation_line_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM quotation_line_items));

-- =====================================================================
-- APPROVAL CHAIN LEVELS (Configure multi-level approval)
-- =====================================================================

-- Update QUOTATION approval chain with actual approvers (uses users from V5)
-- Level 1: Finance Manager (user ID 2) - 팀장
-- Level 2: Admin (user ID 1) - 사장 (CEO)
-- Note: No id column - this is now an @ElementCollection (composite PK: chain_template_id, level_order)
INSERT INTO approval_chain_levels (chain_template_id, level_order, level_name, approver_user_id, is_required)
VALUES (1, 1, '팀장 (Finance Manager)', 2, true),
       (1, 2, '사장 (CEO)', 1, true)
ON CONFLICT (chain_template_id, level_order) DO NOTHING;

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE quotations IS 'Sample quotations in DRAFT, PENDING, and APPROVED states for testing';
