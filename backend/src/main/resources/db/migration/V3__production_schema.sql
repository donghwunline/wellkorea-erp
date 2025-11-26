-- WellKorea ERP Production Schema
-- Entities: WorkProgressSheet, WorkProgressStepTemplate, WorkProgressStep

-- Work Progress Step Templates (per product type)
CREATE TABLE work_progress_step_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_type_id UUID NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
    step_name VARCHAR(100) NOT NULL,
    step_order INT NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_type_id, step_name)
);

CREATE INDEX idx_work_step_templates_product_type ON work_progress_step_templates(product_type_id);
CREATE INDEX idx_work_step_templates_order ON work_progress_step_templates(product_type_id, step_order);

-- Work Progress Sheets (one per product per jobcode)
CREATE TABLE work_progress_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jobcode_id UUID NOT NULL REFERENCES jobcodes(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_type_id UUID REFERENCES product_types(id),
    quantity DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    CONSTRAINT chk_work_sheet_quantity CHECK (quantity > 0),
    UNIQUE (jobcode_id, product_id)
);

CREATE INDEX idx_work_progress_sheets_jobcode ON work_progress_sheets(jobcode_id);
CREATE INDEX idx_work_progress_sheets_product ON work_progress_sheets(product_id);

-- Work Progress Steps (actual manufacturing steps for a product)
CREATE TABLE work_progress_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_progress_sheet_id UUID NOT NULL REFERENCES work_progress_sheets(id) ON DELETE CASCADE,
    step_name VARCHAR(100) NOT NULL,
    step_order INT NOT NULL,
    status VARCHAR(50) DEFAULT 'NOT_STARTED',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    is_outsourced BOOLEAN DEFAULT false,
    vendor_name VARCHAR(255),
    vendor_eta DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    CONSTRAINT chk_work_step_status CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'))
);

CREATE INDEX idx_work_progress_steps_sheet ON work_progress_steps(work_progress_sheet_id);
CREATE INDEX idx_work_progress_steps_status ON work_progress_steps(status);
CREATE INDEX idx_work_progress_steps_order ON work_progress_steps(work_progress_sheet_id, step_order);

-- Triggers
CREATE TRIGGER update_work_step_templates_updated_at BEFORE UPDATE ON work_progress_step_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_progress_sheets_updated_at BEFORE UPDATE ON work_progress_sheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_progress_steps_updated_at BEFORE UPDATE ON work_progress_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate work progress sheet completion percentage
CREATE OR REPLACE FUNCTION calculate_work_sheet_completion(sheet_uuid UUID)
RETURNS INT AS $$
DECLARE
    total_steps INT;
    completed_steps INT;
    percentage INT;
BEGIN
    SELECT COUNT(*) INTO total_steps
    FROM work_progress_steps
    WHERE work_progress_sheet_id = sheet_uuid AND status != 'SKIPPED';

    IF total_steps = 0 THEN
        RETURN 0;
    END IF;

    SELECT COUNT(*) INTO completed_steps
    FROM work_progress_steps
    WHERE work_progress_sheet_id = sheet_uuid AND status = 'COMPLETED';

    percentage := (completed_steps * 100) / total_steps;
    RETURN percentage;
END;
$$ LANGUAGE plpgsql;

-- Insert default step templates for common product types
INSERT INTO product_types (name, description) VALUES
    ('Sheet Metal', 'Standard sheet metal fabrication'),
    ('Custom Component', 'Custom manufactured components'),
    ('Assembly', 'Multi-part assembly')
ON CONFLICT (name) DO NOTHING;

-- Default steps for Sheet Metal
INSERT INTO work_progress_step_templates (product_type_id, step_name, step_order, is_required)
SELECT id, 'Design', 1, true FROM product_types WHERE name = 'Sheet Metal'
UNION ALL
SELECT id, 'Laser Cutting', 2, true FROM product_types WHERE name = 'Sheet Metal'
UNION ALL
SELECT id, 'Bending', 3, false FROM product_types WHERE name = 'Sheet Metal'
UNION ALL
SELECT id, 'Welding', 4, false FROM product_types WHERE name = 'Sheet Metal'
UNION ALL
SELECT id, 'Finishing', 5, true FROM product_types WHERE name = 'Sheet Metal'
UNION ALL
SELECT id, 'Quality Check', 6, true FROM product_types WHERE name = 'Sheet Metal'
UNION ALL
SELECT id, 'Packaging', 7, true FROM product_types WHERE name = 'Sheet Metal';

-- Comments
COMMENT ON TABLE work_progress_step_templates IS 'Manufacturing step templates per product type';
COMMENT ON TABLE work_progress_sheets IS 'Work progress tracking per product per jobcode';
COMMENT ON TABLE work_progress_steps IS 'Individual manufacturing steps with status and outsourcing info';
COMMENT ON COLUMN work_progress_steps.is_outsourced IS 'Whether this step is outsourced to vendor';
COMMENT ON COLUMN work_progress_steps.vendor_eta IS 'Expected completion date for outsourced work';
