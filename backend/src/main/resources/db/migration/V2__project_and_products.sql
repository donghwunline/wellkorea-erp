-- V2: Project (JobCode), Product, and ProductType tables
-- Core domain entities for project tracking and product catalog.

-- =====================================================================
-- PROJECT DOMAIN
-- =====================================================================

CREATE TABLE job_code_sequences
(
    id            BIGSERIAL PRIMARY KEY,
    year          VARCHAR(2) NOT NULL UNIQUE,
    last_sequence INT        NOT NULL DEFAULT 0,
    updated_at    TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_year_format CHECK (year ~ '^\d{2}$'),
    CONSTRAINT chk_last_sequence_positive CHECK (last_sequence >= 0)
);

CREATE TABLE projects
(
    id                    BIGSERIAL PRIMARY KEY,
    job_code              VARCHAR(20)  NOT NULL UNIQUE,
    customer_company_id   BIGINT       NOT NULL REFERENCES companies (id),
    project_name          VARCHAR(255) NOT NULL,
    requester_name        VARCHAR(100),
    due_date              DATE         NOT NULL,
    internal_owner_id     BIGINT       NOT NULL REFERENCES users (id),
    status                VARCHAR(50)  NOT NULL DEFAULT 'DRAFT',
    created_by_id         BIGINT       NOT NULL REFERENCES users (id),
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted            BOOLEAN      NOT NULL DEFAULT false,
    CONSTRAINT chk_project_status CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED')),
    CONSTRAINT chk_job_code_format CHECK (job_code ~ '^WK2K\d{2}-\d{4}-\d{4}$')
);

-- =====================================================================
-- PRODUCT CATALOG DOMAIN
-- =====================================================================

CREATE TABLE product_types
(
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products
(
    id              BIGSERIAL PRIMARY KEY,
    sku             VARCHAR(50)  NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    product_type_id BIGINT       NOT NULL REFERENCES product_types (id),
    base_unit_price DECIMAL(10, 2),
    unit            VARCHAR(20)           DEFAULT 'EA',
    is_active       BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_base_unit_price CHECK (base_unit_price IS NULL OR base_unit_price >= 0),
    CONSTRAINT uq_products_sku_active UNIQUE (sku, is_active)
);

CREATE TABLE work_progress_step_templates
(
    id                 BIGSERIAL PRIMARY KEY,
    product_type_id    BIGINT       NOT NULL REFERENCES product_types (id) ON DELETE CASCADE,
    step_name          VARCHAR(100) NOT NULL,
    step_number        INT          NOT NULL,
    is_required        BOOLEAN      NOT NULL DEFAULT true,
    estimated_hours    NUMERIC(5,2),
    is_outsourceable   BOOLEAN      NOT NULL DEFAULT false,
    parent_template_id BIGINT REFERENCES work_progress_step_templates(id) ON DELETE SET NULL,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (product_type_id, step_name),
    UNIQUE (product_type_id, step_number)
);

-- =====================================================================
-- INDEXES
-- =====================================================================

CREATE INDEX idx_job_code_sequences_year ON job_code_sequences (year);
CREATE INDEX idx_projects_job_code ON projects (job_code);
CREATE INDEX idx_projects_customer_company_id ON projects (customer_company_id);
CREATE INDEX idx_projects_internal_owner_id ON projects (internal_owner_id);
CREATE INDEX idx_projects_status ON projects (status);
CREATE INDEX idx_projects_created_at ON projects (created_at);
CREATE INDEX idx_projects_due_date ON projects (due_date);
CREATE INDEX idx_projects_is_deleted ON projects (is_deleted);
CREATE INDEX idx_projects_customer_status ON projects (customer_company_id, status) WHERE is_deleted = false;
CREATE INDEX idx_projects_owner_status ON projects (internal_owner_id, status) WHERE is_deleted = false;
CREATE INDEX idx_projects_recent_due_date ON projects (created_at DESC, due_date) WHERE is_deleted = false;
CREATE INDEX idx_projects_active_only ON projects (created_at DESC) WHERE status = 'ACTIVE' AND is_deleted = false;
CREATE INDEX idx_projects_draft_only ON projects (created_at DESC) WHERE status = 'DRAFT' AND is_deleted = false;
CREATE INDEX idx_projects_by_due_date ON projects (due_date) WHERE status IN ('DRAFT', 'ACTIVE') AND is_deleted = false;
CREATE INDEX idx_projects_name_search ON projects (LOWER(project_name) text_pattern_ops);

CREATE INDEX idx_products_sku ON products (sku);
CREATE INDEX idx_products_name ON products (name);
CREATE INDEX idx_products_product_type_id ON products (product_type_id);
CREATE INDEX idx_products_is_active ON products (is_active);
CREATE INDEX idx_products_type_active ON products (product_type_id, name) WHERE is_active = true;
CREATE INDEX idx_products_name_search ON products (LOWER(name) text_pattern_ops);

CREATE INDEX idx_product_types_name ON product_types (name);
CREATE INDEX idx_work_progress_step_templates_product_type_id ON work_progress_step_templates (product_type_id);
CREATE INDEX idx_work_progress_step_templates_step_number ON work_progress_step_templates (product_type_id, step_number);
CREATE INDEX idx_step_templates_parent ON work_progress_step_templates(parent_template_id);

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE job_code_sequences IS 'Stores last used sequence number per year for thread-safe JobCode generation';
COMMENT ON TABLE projects IS 'Core domain entity representing customer work requests. JobCode is the unique business identifier.';
COMMENT ON COLUMN projects.job_code IS 'Unique business identifier: WK2K{YY}-{SSSS}-{MMDD}';
COMMENT ON TABLE products IS 'Product catalog for quotations, production, and invoicing';
COMMENT ON TABLE product_types IS 'Product categories with manufacturing step templates';
COMMENT ON TABLE work_progress_step_templates IS 'Manufacturing step templates per product type';
COMMENT ON COLUMN work_progress_step_templates.step_number IS 'Execution order (1, 2, 3, ...)';
COMMENT ON COLUMN work_progress_step_templates.is_outsourceable IS 'Whether this step can be outsourced to external vendor';
COMMENT ON COLUMN work_progress_step_templates.parent_template_id IS 'Parent template for dependency';
