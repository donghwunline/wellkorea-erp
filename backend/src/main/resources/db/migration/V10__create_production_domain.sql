-- V10__create_production_domain.sql
-- Adds columns to work_progress_step_templates and creates work progress tracking tables
-- Each WorkProgressSheet tracks production for one product in a project
-- Each WorkProgressStep tracks one manufacturing step within a sheet
-- Includes parent-child step dependencies (tree structure)

-- ============================================================================
-- Step Templates - Add/rename columns (table already exists from V2)
-- V2 created: id, product_type_id, step_name, step_order, is_required, created_at
-- Entity uses step_number, so rename step_order -> step_number
-- ============================================================================

-- Rename step_order to step_number (to match JPA entity)
ALTER TABLE work_progress_step_templates RENAME COLUMN step_order TO step_number;

-- Rename index to match new column name (V2 created idx_work_progress_step_templates_step_order)
ALTER INDEX IF EXISTS idx_work_progress_step_templates_step_order RENAME TO idx_work_progress_step_templates_step_number;

-- Add new columns including parent_template_id for tree dependencies
ALTER TABLE work_progress_step_templates
    ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS is_outsourceable BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS parent_template_id BIGINT REFERENCES work_progress_step_templates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_step_templates_parent ON work_progress_step_templates(parent_template_id);

COMMENT ON TABLE work_progress_step_templates IS 'Manufacturing step templates per product type';
COMMENT ON COLUMN work_progress_step_templates.step_number IS 'Execution order (1, 2, 3, ...)';
COMMENT ON COLUMN work_progress_step_templates.estimated_hours IS 'Baseline time estimate for this step';
COMMENT ON COLUMN work_progress_step_templates.is_outsourceable IS 'Whether this step can be outsourced to external vendor';
COMMENT ON COLUMN work_progress_step_templates.parent_template_id IS 'Parent template for dependency - child step cannot start until parent completes';

-- ============================================================================
-- Work Progress Sheet (one per project-product combination)
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_progress_sheets (
    id          BIGSERIAL PRIMARY KEY,
    project_id  BIGINT      NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    product_id  BIGINT      NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity    INTEGER     NOT NULL DEFAULT 1,
    sequence    INTEGER     NOT NULL DEFAULT 1,
    status      VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    started_at  TIMESTAMP,
    completed_at TIMESTAMP,
    notes       TEXT,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_work_progress_project_product UNIQUE (project_id, product_id),
    CONSTRAINT chk_work_progress_status CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'))
);

CREATE INDEX IF NOT EXISTS idx_work_progress_sheets_project ON work_progress_sheets(project_id);
CREATE INDEX IF NOT EXISTS idx_work_progress_sheets_product ON work_progress_sheets(product_id);
CREATE INDEX IF NOT EXISTS idx_work_progress_sheets_status ON work_progress_sheets(status);

COMMENT ON TABLE work_progress_sheets IS 'Tracks production progress for one product within a project';
COMMENT ON COLUMN work_progress_sheets.quantity IS 'Number of units being produced';
COMMENT ON COLUMN work_progress_sheets.sequence IS 'Display order within the project';
COMMENT ON COLUMN work_progress_sheets.status IS 'Overall sheet status: NOT_STARTED, IN_PROGRESS, COMPLETED';

-- ============================================================================
-- Work Progress Step (individual step instances within a sheet)
-- ============================================================================
CREATE TABLE IF NOT EXISTS work_progress_steps (
    id                  BIGSERIAL PRIMARY KEY,
    sheet_id            BIGINT       NOT NULL REFERENCES work_progress_sheets(id) ON DELETE CASCADE,
    step_template_id    BIGINT       NOT NULL REFERENCES work_progress_step_templates(id) ON DELETE RESTRICT,
    step_number         INTEGER      NOT NULL,
    step_name           VARCHAR(100) NOT NULL,
    status              VARCHAR(20)  NOT NULL DEFAULT 'NOT_STARTED',
    started_at          TIMESTAMP,
    completed_at        TIMESTAMP,
    completed_by_id     BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    estimated_hours     NUMERIC(5,2),
    actual_hours        NUMERIC(5,2),
    is_outsourced       BOOLEAN      NOT NULL DEFAULT false,
    outsource_vendor_id BIGINT       REFERENCES companies(id) ON DELETE SET NULL,
    outsource_eta       DATE,
    outsource_cost      NUMERIC(12,2),
    notes               TEXT,
    parent_step_id      BIGINT       REFERENCES work_progress_steps(id) ON DELETE SET NULL,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_work_step_sheet_number UNIQUE (sheet_id, step_number),
    CONSTRAINT chk_work_step_status CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')),
    CONSTRAINT chk_outsource_vendor CHECK (
        (is_outsourced = false) OR
        (is_outsourced = true AND outsource_vendor_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_work_progress_steps_sheet ON work_progress_steps(sheet_id);
CREATE INDEX IF NOT EXISTS idx_work_progress_steps_template ON work_progress_steps(step_template_id);
CREATE INDEX IF NOT EXISTS idx_work_progress_steps_status ON work_progress_steps(status);
CREATE INDEX IF NOT EXISTS idx_work_progress_steps_completed_by ON work_progress_steps(completed_by_id);
CREATE INDEX IF NOT EXISTS idx_work_progress_steps_outsource_vendor ON work_progress_steps(outsource_vendor_id) WHERE is_outsourced = true;
CREATE INDEX IF NOT EXISTS idx_steps_parent ON work_progress_steps(parent_step_id);

COMMENT ON TABLE work_progress_steps IS 'Individual work step instance within a work progress sheet';
COMMENT ON COLUMN work_progress_steps.step_name IS 'Copied from template at creation, can be customized';
COMMENT ON COLUMN work_progress_steps.status IS 'Step status: NOT_STARTED, IN_PROGRESS, COMPLETED, SKIPPED';
COMMENT ON COLUMN work_progress_steps.is_outsourced IS 'Whether this step is being done by external vendor';
COMMENT ON COLUMN work_progress_steps.outsource_vendor_id IS 'External vendor company (must have VENDOR or OUTSOURCE role)';
COMMENT ON COLUMN work_progress_steps.outsource_eta IS 'Expected completion date from vendor';
COMMENT ON COLUMN work_progress_steps.outsource_cost IS 'Cost charged by vendor for this step';
COMMENT ON COLUMN work_progress_steps.parent_step_id IS 'Parent step for dependency - this step cannot start until parent completes';

-- ============================================================================
-- Update existing step templates with estimated hours and outsource flag
-- ============================================================================
-- Sheet Metal Parts (product_type_id = 1)
UPDATE work_progress_step_templates SET estimated_hours = 2.0, is_outsourceable = false WHERE product_type_id = 1 AND step_name = 'Design';
UPDATE work_progress_step_templates SET estimated_hours = 1.0, is_outsourceable = true WHERE product_type_id = 1 AND step_name = 'Laser Cutting';
UPDATE work_progress_step_templates SET estimated_hours = 1.5, is_outsourceable = true WHERE product_type_id = 1 AND step_name = 'Sheet Metal Forming';
UPDATE work_progress_step_templates SET estimated_hours = 2.0, is_outsourceable = true WHERE product_type_id = 1 AND step_name = 'Welding';
UPDATE work_progress_step_templates SET estimated_hours = 1.0, is_outsourceable = true WHERE product_type_id = 1 AND step_name = 'Grinding';
UPDATE work_progress_step_templates SET estimated_hours = 3.0, is_outsourceable = true WHERE product_type_id = 1 AND step_name = 'Painting';
UPDATE work_progress_step_templates SET estimated_hours = 0.5, is_outsourceable = false WHERE product_type_id = 1 AND step_name = 'Packaging';

-- Machined Components (product_type_id = 2)
UPDATE work_progress_step_templates SET estimated_hours = 3.0, is_outsourceable = false WHERE product_type_id = 2 AND step_name = 'Design';
UPDATE work_progress_step_templates SET estimated_hours = 1.0, is_outsourceable = false WHERE product_type_id = 2 AND step_name = 'Material Preparation';
UPDATE work_progress_step_templates SET estimated_hours = 4.0, is_outsourceable = true WHERE product_type_id = 2 AND step_name = 'CNC Milling';
UPDATE work_progress_step_templates SET estimated_hours = 3.0, is_outsourceable = true WHERE product_type_id = 2 AND step_name = 'CNC Turning';
UPDATE work_progress_step_templates SET estimated_hours = 1.5, is_outsourceable = true WHERE product_type_id = 2 AND step_name = 'Grinding';
UPDATE work_progress_step_templates SET estimated_hours = 2.0, is_outsourceable = true WHERE product_type_id = 2 AND step_name = 'Surface Treatment';
UPDATE work_progress_step_templates SET estimated_hours = 1.0, is_outsourceable = false WHERE product_type_id = 2 AND step_name = 'Quality Inspection';
UPDATE work_progress_step_templates SET estimated_hours = 0.5, is_outsourceable = false WHERE product_type_id = 2 AND step_name = 'Packaging';

-- Welded Assemblies (product_type_id = 3)
UPDATE work_progress_step_templates SET estimated_hours = 4.0, is_outsourceable = false WHERE product_type_id = 3 AND step_name = 'Design';
UPDATE work_progress_step_templates SET estimated_hours = 1.5, is_outsourceable = true WHERE product_type_id = 3 AND step_name = 'Laser Cutting';
UPDATE work_progress_step_templates SET estimated_hours = 2.0, is_outsourceable = true WHERE product_type_id = 3 AND step_name = 'Sheet Metal Forming';
UPDATE work_progress_step_templates SET estimated_hours = 6.0, is_outsourceable = true WHERE product_type_id = 3 AND step_name = 'Welding';
UPDATE work_progress_step_templates SET estimated_hours = 2.0, is_outsourceable = true WHERE product_type_id = 3 AND step_name = 'Grinding';
UPDATE work_progress_step_templates SET estimated_hours = 3.0, is_outsourceable = true WHERE product_type_id = 3 AND step_name = 'Painting';
UPDATE work_progress_step_templates SET estimated_hours = 3.0, is_outsourceable = false WHERE product_type_id = 3 AND step_name = 'Final Assembly';
UPDATE work_progress_step_templates SET estimated_hours = 0.5, is_outsourceable = false WHERE product_type_id = 3 AND step_name = 'Packaging';

-- Custom Enclosures (product_type_id = 4)
UPDATE work_progress_step_templates SET estimated_hours = 5.0, is_outsourceable = false WHERE product_type_id = 4 AND step_name = 'Design';
UPDATE work_progress_step_templates SET estimated_hours = 2.0, is_outsourceable = true WHERE product_type_id = 4 AND step_name = 'Laser Cutting';
UPDATE work_progress_step_templates SET estimated_hours = 2.0, is_outsourceable = true WHERE product_type_id = 4 AND step_name = 'Sheet Metal Forming';
UPDATE work_progress_step_templates SET estimated_hours = 4.0, is_outsourceable = true WHERE product_type_id = 4 AND step_name = 'Welding';
UPDATE work_progress_step_templates SET estimated_hours = 4.0, is_outsourceable = true WHERE product_type_id = 4 AND step_name = 'Powder Coating';
UPDATE work_progress_step_templates SET estimated_hours = 2.0, is_outsourceable = false WHERE product_type_id = 4 AND step_name = 'Hardware Installation';
UPDATE work_progress_step_templates SET estimated_hours = 2.0, is_outsourceable = false WHERE product_type_id = 4 AND step_name = 'Final Assembly';
UPDATE work_progress_step_templates SET estimated_hours = 0.5, is_outsourceable = false WHERE product_type_id = 4 AND step_name = 'Packaging';

-- ============================================================================
-- Set up step template dependencies (parent_template_id)
-- Each step depends on the previous step in the workflow
-- ============================================================================

-- Sheet Metal Parts (product_type_id = 1): Design -> Laser Cutting -> Sheet Metal Forming -> Welding -> Grinding -> Painting -> Packaging
UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 1 AND step_name = 'Design')
WHERE t.product_type_id = 1 AND t.step_name = 'Laser Cutting';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 1 AND step_name = 'Laser Cutting')
WHERE t.product_type_id = 1 AND t.step_name = 'Sheet Metal Forming';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 1 AND step_name = 'Sheet Metal Forming')
WHERE t.product_type_id = 1 AND t.step_name = 'Welding';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 1 AND step_name = 'Welding')
WHERE t.product_type_id = 1 AND t.step_name = 'Grinding';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 1 AND step_name = 'Grinding')
WHERE t.product_type_id = 1 AND t.step_name = 'Painting';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 1 AND step_name = 'Painting')
WHERE t.product_type_id = 1 AND t.step_name = 'Packaging';

-- Machined Components (product_type_id = 2): Design -> Material Preparation -> CNC Milling -> CNC Turning -> Grinding -> Surface Treatment -> Quality Inspection -> Packaging
UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 2 AND step_name = 'Design')
WHERE t.product_type_id = 2 AND t.step_name = 'Material Preparation';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 2 AND step_name = 'Material Preparation')
WHERE t.product_type_id = 2 AND t.step_name = 'CNC Milling';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 2 AND step_name = 'CNC Milling')
WHERE t.product_type_id = 2 AND t.step_name = 'CNC Turning';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 2 AND step_name = 'CNC Turning')
WHERE t.product_type_id = 2 AND t.step_name = 'Grinding';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 2 AND step_name = 'Grinding')
WHERE t.product_type_id = 2 AND t.step_name = 'Surface Treatment';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 2 AND step_name = 'Surface Treatment')
WHERE t.product_type_id = 2 AND t.step_name = 'Quality Inspection';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 2 AND step_name = 'Quality Inspection')
WHERE t.product_type_id = 2 AND t.step_name = 'Packaging';

-- Welded Assemblies (product_type_id = 3): Design -> Laser Cutting -> Sheet Metal Forming -> Welding -> Grinding -> Painting -> Final Assembly -> Packaging
UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 3 AND step_name = 'Design')
WHERE t.product_type_id = 3 AND t.step_name = 'Laser Cutting';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 3 AND step_name = 'Laser Cutting')
WHERE t.product_type_id = 3 AND t.step_name = 'Sheet Metal Forming';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 3 AND step_name = 'Sheet Metal Forming')
WHERE t.product_type_id = 3 AND t.step_name = 'Welding';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 3 AND step_name = 'Welding')
WHERE t.product_type_id = 3 AND t.step_name = 'Grinding';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 3 AND step_name = 'Grinding')
WHERE t.product_type_id = 3 AND t.step_name = 'Painting';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 3 AND step_name = 'Painting')
WHERE t.product_type_id = 3 AND t.step_name = 'Final Assembly';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 3 AND step_name = 'Final Assembly')
WHERE t.product_type_id = 3 AND t.step_name = 'Packaging';

-- Custom Enclosures (product_type_id = 4): Design -> Laser Cutting -> Sheet Metal Forming -> Welding -> Powder Coating -> Hardware Installation -> Final Assembly -> Packaging
UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 4 AND step_name = 'Design')
WHERE t.product_type_id = 4 AND t.step_name = 'Laser Cutting';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 4 AND step_name = 'Laser Cutting')
WHERE t.product_type_id = 4 AND t.step_name = 'Sheet Metal Forming';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 4 AND step_name = 'Sheet Metal Forming')
WHERE t.product_type_id = 4 AND t.step_name = 'Welding';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 4 AND step_name = 'Welding')
WHERE t.product_type_id = 4 AND t.step_name = 'Powder Coating';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 4 AND step_name = 'Powder Coating')
WHERE t.product_type_id = 4 AND t.step_name = 'Hardware Installation';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 4 AND step_name = 'Hardware Installation')
WHERE t.product_type_id = 4 AND t.step_name = 'Final Assembly';

UPDATE work_progress_step_templates t
SET parent_template_id = (SELECT id FROM work_progress_step_templates WHERE product_type_id = 4 AND step_name = 'Final Assembly')
WHERE t.product_type_id = 4 AND t.step_name = 'Packaging';

-- ============================================================================
-- SEED DATA: Work Progress Sheets
-- Create sheets for approved quotation products (Project 3 - LG Display)
-- and active projects (Project 1 - Samsung, Project 2 - Hyundai)
-- ============================================================================

-- Sheet 1: Samsung project - Control Panel (Product 1, Sheet Metal type 1)
-- Status: IN_PROGRESS (some steps completed)
INSERT INTO work_progress_sheets (id, project_id, product_id, quantity, sequence, status, started_at, notes, created_at, updated_at)
VALUES (1, 1, 1, 5, 1, 'IN_PROGRESS', CURRENT_TIMESTAMP - INTERVAL '5 days',
        '삼성 HQ 프로젝트용 제어판 5개 생산', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (project_id, product_id) DO NOTHING;

-- Sheet 2: Samsung project - L-Bracket (Product 2, Sheet Metal type 1)
-- Status: COMPLETED
INSERT INTO work_progress_sheets (id, project_id, product_id, quantity, sequence, status, started_at, completed_at, notes, created_at, updated_at)
VALUES (2, 1, 2, 20, 2, 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '2 days',
        '삼성 HQ 프로젝트용 L-브라켓 20개 생산 완료', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (project_id, product_id) DO NOTHING;

-- Sheet 3: Hyundai project - Equipment Frame (Product 7, Welded Assemblies type 3)
-- Status: IN_PROGRESS
INSERT INTO work_progress_sheets (id, project_id, product_id, quantity, sequence, status, started_at, notes, created_at, updated_at)
VALUES (3, 2, 7, 3, 1, 'IN_PROGRESS', CURRENT_TIMESTAMP - INTERVAL '7 days',
        '현대 자동차 조립라인용 장비 프레임 3개 생산 중', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (project_id, product_id) DO NOTHING;

-- Sheet 4: Hyundai project - Worktable (Product 8, Welded Assemblies type 3)
-- Status: NOT_STARTED
INSERT INTO work_progress_sheets (id, project_id, product_id, quantity, sequence, status, notes, created_at, updated_at)
VALUES (4, 2, 8, 2, 2, 'NOT_STARTED',
        '현대 자동차 조립라인용 작업대 2개 - 프레임 완료 후 착수 예정', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (project_id, product_id) DO NOTHING;

-- Sheet 5: LG Display project - Electrical Cabinet (Product 9, Custom Enclosures type 4)
-- Status: IN_PROGRESS
INSERT INTO work_progress_sheets (id, project_id, product_id, quantity, sequence, status, started_at, notes, created_at, updated_at)
VALUES (5, 3, 9, 2, 1, 'IN_PROGRESS', CURRENT_TIMESTAMP - INTERVAL '3 days',
        'LG 디스플레이 클린룸용 전기 캐비닛 2개 생산', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (project_id, product_id) DO NOTHING;

-- Sheet 6: LG Display project - Junction Box (Product 10, Custom Enclosures type 4)
-- Status: NOT_STARTED
INSERT INTO work_progress_sheets (id, project_id, product_id, quantity, sequence, status, notes, created_at, updated_at)
VALUES (6, 3, 10, 5, 2, 'NOT_STARTED',
        'LG 디스플레이 클린룸용 접속함 5개 - 캐비닛 완료 후 착수', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (project_id, product_id) DO NOTHING;

-- Reset sequence for work_progress_sheets table
SELECT setval('work_progress_sheets_id_seq', (SELECT COALESCE(MAX(id), 1) FROM work_progress_sheets));

-- ============================================================================
-- SEED DATA: Work Progress Steps
-- Create steps for each sheet based on product type templates
-- Sheet 1: Samsung Control Panel (IN_PROGRESS - Design, Laser Cutting completed)
-- ============================================================================

-- Helper: Get template IDs for Sheet Metal Parts (type 1)
-- Template IDs for type 1: 1=Design, 2=Laser Cutting, 3=Sheet Metal Forming, 4=Welding, 5=Grinding, 6=Painting, 7=Packaging

-- Sheet 1 Steps (Samsung Control Panel - IN_PROGRESS)
INSERT INTO work_progress_steps (id, sheet_id, step_template_id, step_number, step_name, status, started_at, completed_at, completed_by_id, estimated_hours, actual_hours, notes, created_at, updated_at)
VALUES
    -- Design - COMPLETED
    (1, 1, 1, 1, 'Design', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days', 4, 2.0, 1.5, '설계 완료', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    -- Laser Cutting - COMPLETED
    (2, 1, 2, 2, 'Laser Cutting', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '3 days', 3, 1.0, 1.2, '레이저 가공 완료', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    -- Sheet Metal Forming - IN_PROGRESS
    (3, 1, 3, 3, 'Sheet Metal Forming', 'IN_PROGRESS', CURRENT_TIMESTAMP - INTERVAL '2 days', NULL, NULL, 1.5, NULL, '판금 성형 진행 중', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    -- Welding - NOT_STARTED
    (4, 1, 4, 4, 'Welding', 'NOT_STARTED', NULL, NULL, NULL, 2.0, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    -- Grinding - NOT_STARTED
    (5, 1, 5, 5, 'Grinding', 'NOT_STARTED', NULL, NULL, NULL, 1.0, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    -- Painting - NOT_STARTED
    (6, 1, 6, 6, 'Painting', 'NOT_STARTED', NULL, NULL, NULL, 3.0, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    -- Packaging - NOT_STARTED
    (7, 1, 7, 7, 'Packaging', 'NOT_STARTED', NULL, NULL, NULL, 0.5, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (sheet_id, step_number) DO NOTHING;

-- Sheet 2 Steps (Samsung L-Bracket - COMPLETED)
INSERT INTO work_progress_steps (id, sheet_id, step_template_id, step_number, step_name, status, started_at, completed_at, completed_by_id, estimated_hours, actual_hours, notes, created_at, updated_at)
VALUES
    (8, 2, 1, 1, 'Design', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '9 days', 4, 2.0, 1.0, '간단한 브라켓 설계', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (9, 2, 2, 2, 'Laser Cutting', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '8 days', 3, 1.0, 0.8, '레이저 커팅 완료', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (10, 2, 3, 3, 'Sheet Metal Forming', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '7 days', 3, 1.5, 1.5, '절곡 완료', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (11, 2, 4, 4, 'Welding', 'SKIPPED', NULL, CURRENT_TIMESTAMP - INTERVAL '7 days', NULL, 2.0, NULL, '용접 불필요', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (12, 2, 5, 5, 'Grinding', 'SKIPPED', NULL, CURRENT_TIMESTAMP - INTERVAL '7 days', NULL, 1.0, NULL, '그라인딩 불필요', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (13, 2, 6, 6, 'Painting', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '4 days', 3, 3.0, 2.5, '아연 도금 처리', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (14, 2, 7, 7, 'Packaging', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '2 days', 3, 0.5, 0.5, '포장 완료', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (sheet_id, step_number) DO NOTHING;

-- Sheet 3 Steps (Hyundai Equipment Frame - IN_PROGRESS, with outsourcing)
-- Template IDs for Welded Assemblies (type 3): 15=Design, 16=Laser Cutting, 17=Sheet Metal Forming, 18=Welding, 19=Grinding, 20=Painting, 21=Final Assembly, 22=Packaging
INSERT INTO work_progress_steps (id, sheet_id, step_template_id, step_number, step_name, status, started_at, completed_at, completed_by_id, estimated_hours, actual_hours, is_outsourced, outsource_vendor_id, outsource_eta, outsource_cost, notes, created_at, updated_at)
VALUES
    (15, 3, 15, 1, 'Design', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '5 days', 4, 4.0, 4.5, false, NULL, NULL, NULL, '대형 프레임 설계 완료', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (16, 3, 16, 2, 'Laser Cutting', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days', 3, 1.5, 2.0, false, NULL, NULL, NULL, '레이저 커팅 완료', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (17, 3, 17, 3, 'Sheet Metal Forming', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP - INTERVAL '3 days', 3, 2.0, 2.5, false, NULL, NULL, NULL, '성형 완료', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    -- Welding - OUTSOURCED to Steel Fabrication (company_id = 8)
    (18, 3, 18, 4, 'Welding', 'IN_PROGRESS', CURRENT_TIMESTAMP - INTERVAL '2 days', NULL, NULL, 6.0, NULL, true, 8, CURRENT_DATE + INTERVAL '3 days', 450000.00, '대형 용접 외주 - Steel Fabrication Co.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (19, 3, 19, 5, 'Grinding', 'NOT_STARTED', NULL, NULL, NULL, 2.0, NULL, false, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (20, 3, 20, 6, 'Painting', 'NOT_STARTED', NULL, NULL, NULL, 3.0, NULL, false, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (21, 3, 21, 7, 'Final Assembly', 'NOT_STARTED', NULL, NULL, NULL, 3.0, NULL, false, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (22, 3, 22, 8, 'Packaging', 'NOT_STARTED', NULL, NULL, NULL, 0.5, NULL, false, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (sheet_id, step_number) DO NOTHING;

-- Sheet 5 Steps (LG Display Electrical Cabinet - IN_PROGRESS)
-- Template IDs for Custom Enclosures (type 4): 23=Design, 24=Laser Cutting, 25=Sheet Metal Forming, 26=Welding, 27=Powder Coating, 28=Hardware Installation, 29=Final Assembly, 30=Packaging
INSERT INTO work_progress_steps (id, sheet_id, step_template_id, step_number, step_name, status, started_at, completed_at, completed_by_id, estimated_hours, actual_hours, is_outsourced, outsource_vendor_id, outsource_eta, outsource_cost, notes, created_at, updated_at)
VALUES
    (23, 5, 23, 1, 'Design', 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '2 days', 4, 5.0, 4.0, false, NULL, NULL, NULL, '클린룸 사양 전기 캐비닛 설계', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (24, 5, 24, 2, 'Laser Cutting', 'IN_PROGRESS', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL, NULL, 2.0, NULL, false, NULL, NULL, NULL, '레이저 가공 진행 중', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (25, 5, 25, 3, 'Sheet Metal Forming', 'NOT_STARTED', NULL, NULL, NULL, 2.0, NULL, false, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (26, 5, 26, 4, 'Welding', 'NOT_STARTED', NULL, NULL, NULL, 4.0, NULL, false, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    -- Powder Coating - planned to be outsourced
    (27, 5, 27, 5, 'Powder Coating', 'NOT_STARTED', NULL, NULL, NULL, 4.0, NULL, false, NULL, NULL, NULL, '분체도장 외주 예정 (Industrial Coating)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (28, 5, 28, 6, 'Hardware Installation', 'NOT_STARTED', NULL, NULL, NULL, 2.0, NULL, false, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (29, 5, 29, 7, 'Final Assembly', 'NOT_STARTED', NULL, NULL, NULL, 2.0, NULL, false, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (30, 5, 30, 8, 'Packaging', 'NOT_STARTED', NULL, NULL, NULL, 0.5, NULL, false, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (sheet_id, step_number) DO NOTHING;

-- Reset sequence for work_progress_steps table
SELECT setval('work_progress_steps_id_seq', (SELECT COALESCE(MAX(id), 1) FROM work_progress_steps));

-- ============================================================================
-- Set up step dependencies (parent_step_id)
-- Each step depends on the previous step in the workflow
-- ============================================================================

-- Sheet 1 step dependencies
UPDATE work_progress_steps SET parent_step_id = 1 WHERE id = 2;  -- Laser Cutting -> Design
UPDATE work_progress_steps SET parent_step_id = 2 WHERE id = 3;  -- Sheet Metal Forming -> Laser Cutting
UPDATE work_progress_steps SET parent_step_id = 3 WHERE id = 4;  -- Welding -> Sheet Metal Forming
UPDATE work_progress_steps SET parent_step_id = 4 WHERE id = 5;  -- Grinding -> Welding
UPDATE work_progress_steps SET parent_step_id = 5 WHERE id = 6;  -- Painting -> Grinding
UPDATE work_progress_steps SET parent_step_id = 6 WHERE id = 7;  -- Packaging -> Painting

-- Sheet 2 step dependencies
UPDATE work_progress_steps SET parent_step_id = 8 WHERE id = 9;   -- Laser Cutting -> Design
UPDATE work_progress_steps SET parent_step_id = 9 WHERE id = 10;  -- Sheet Metal Forming -> Laser Cutting
UPDATE work_progress_steps SET parent_step_id = 10 WHERE id = 11; -- Welding -> Sheet Metal Forming
UPDATE work_progress_steps SET parent_step_id = 11 WHERE id = 12; -- Grinding -> Welding
UPDATE work_progress_steps SET parent_step_id = 12 WHERE id = 13; -- Painting -> Grinding
UPDATE work_progress_steps SET parent_step_id = 13 WHERE id = 14; -- Packaging -> Painting

-- Sheet 3 step dependencies
UPDATE work_progress_steps SET parent_step_id = 15 WHERE id = 16; -- Laser Cutting -> Design
UPDATE work_progress_steps SET parent_step_id = 16 WHERE id = 17; -- Sheet Metal Forming -> Laser Cutting
UPDATE work_progress_steps SET parent_step_id = 17 WHERE id = 18; -- Welding -> Sheet Metal Forming
UPDATE work_progress_steps SET parent_step_id = 18 WHERE id = 19; -- Grinding -> Welding
UPDATE work_progress_steps SET parent_step_id = 19 WHERE id = 20; -- Painting -> Grinding
UPDATE work_progress_steps SET parent_step_id = 20 WHERE id = 21; -- Final Assembly -> Painting
UPDATE work_progress_steps SET parent_step_id = 21 WHERE id = 22; -- Packaging -> Final Assembly

-- Sheet 5 step dependencies
UPDATE work_progress_steps SET parent_step_id = 23 WHERE id = 24; -- Laser Cutting -> Design
UPDATE work_progress_steps SET parent_step_id = 24 WHERE id = 25; -- Sheet Metal Forming -> Laser Cutting
UPDATE work_progress_steps SET parent_step_id = 25 WHERE id = 26; -- Welding -> Sheet Metal Forming
UPDATE work_progress_steps SET parent_step_id = 26 WHERE id = 27; -- Powder Coating -> Welding
UPDATE work_progress_steps SET parent_step_id = 27 WHERE id = 28; -- Hardware Installation -> Powder Coating
UPDATE work_progress_steps SET parent_step_id = 28 WHERE id = 29; -- Final Assembly -> Hardware Installation
UPDATE work_progress_steps SET parent_step_id = 29 WHERE id = 30; -- Packaging -> Final Assembly

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE work_progress_sheets IS 'Work progress sheets with sample data for Samsung, Hyundai, and LG Display projects';
COMMENT ON TABLE work_progress_steps IS 'Work progress steps with parent-child dependencies and outsourcing examples';
