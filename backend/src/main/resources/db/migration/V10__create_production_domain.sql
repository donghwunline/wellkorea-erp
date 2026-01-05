-- V10__create_production_domain.sql
-- Adds columns to work_progress_step_templates and creates work progress tracking tables
-- Each WorkProgressSheet tracks production for one product in a project
-- Each WorkProgressStep tracks one manufacturing step within a sheet

-- ============================================================================
-- Step Templates - Add/rename columns (table already exists from V2)
-- V2 created: id, product_type_id, step_name, step_order, is_required, created_at
-- Entity uses step_number, so rename step_order -> step_number
-- ============================================================================

-- Rename step_order to step_number (to match JPA entity)
ALTER TABLE work_progress_step_templates RENAME COLUMN step_order TO step_number;

-- Rename index to match new column name (V2 created idx_work_progress_step_templates_step_order)
ALTER INDEX IF EXISTS idx_work_progress_step_templates_step_order RENAME TO idx_work_progress_step_templates_step_number;

-- Add new columns
ALTER TABLE work_progress_step_templates
    ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS is_outsourceable BOOLEAN NOT NULL DEFAULT false;

COMMENT ON TABLE work_progress_step_templates IS 'Manufacturing step templates per product type';
COMMENT ON COLUMN work_progress_step_templates.step_number IS 'Execution order (1, 2, 3, ...)';
COMMENT ON COLUMN work_progress_step_templates.estimated_hours IS 'Baseline time estimate for this step';
COMMENT ON COLUMN work_progress_step_templates.is_outsourceable IS 'Whether this step can be outsourced to external vendor';

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

COMMENT ON TABLE work_progress_steps IS 'Individual work step instance within a work progress sheet';
COMMENT ON COLUMN work_progress_steps.step_name IS 'Copied from template at creation, can be customized';
COMMENT ON COLUMN work_progress_steps.status IS 'Step status: NOT_STARTED, IN_PROGRESS, COMPLETED, SKIPPED';
COMMENT ON COLUMN work_progress_steps.is_outsourced IS 'Whether this step is being done by external vendor';
COMMENT ON COLUMN work_progress_steps.outsource_vendor_id IS 'External vendor company (must have VENDOR or OUTSOURCE role)';
COMMENT ON COLUMN work_progress_steps.outsource_eta IS 'Expected completion date from vendor';
COMMENT ON COLUMN work_progress_steps.outsource_cost IS 'Cost charged by vendor for this step';

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
