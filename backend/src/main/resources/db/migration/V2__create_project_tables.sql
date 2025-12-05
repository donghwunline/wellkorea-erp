-- V2: Project (JobCode), Product, and ProductType tables
-- Migration Date: 2025-12-03
-- Purpose: Core domain entities for project tracking and product catalog

-- =====================================================================
-- PROJECT DOMAIN (JobCode as unique business identifier)
-- =====================================================================

-- JobCode sequences table (thread-safe sequence generation per year)
CREATE TABLE job_code_sequences
(
    id            BIGSERIAL PRIMARY KEY,
    year          VARCHAR(2) NOT NULL UNIQUE, -- 2-digit year (e.g., "25" for 2025)
    last_sequence INT        NOT NULL DEFAULT 0,
    updated_at    TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_year_format CHECK (year ~ '^\d{2}$'
        ),
    CONSTRAINT chk_last_sequence_positive CHECK (last_sequence >= 0)
);

-- Project table (aggregate root - JobCode is the unique business identifier)
CREATE TABLE projects
(
    id                BIGSERIAL PRIMARY KEY,
    job_code          VARCHAR(20)  NOT NULL UNIQUE,          -- WK2K{YY}-{SSSS}-{MMDD} format
    customer_id       BIGINT       NOT NULL REFERENCES customers (id),
    project_name      VARCHAR(255) NOT NULL,
    requester_name    VARCHAR(100),
    due_date          DATE         NOT NULL,
    internal_owner_id BIGINT       NOT NULL REFERENCES users (id),
    status            VARCHAR(50)  NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, COMPLETED, ARCHIVED
    created_by_id     BIGINT       NOT NULL REFERENCES users (id),
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted        BOOLEAN      NOT NULL DEFAULT false,

    CONSTRAINT chk_project_status CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED')),
    CONSTRAINT chk_job_code_format CHECK (job_code ~ '^WK2K\d{2}-\d{4}-\d{4}$'
        )
);

-- =====================================================================
-- PRODUCT CATALOG DOMAIN
-- =====================================================================

-- Product types (categories with manufacturing step templates)
CREATE TABLE product_types
(
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Products (catalog items for quotations, production, and invoicing)
CREATE TABLE products
(
    id              BIGSERIAL PRIMARY KEY,
    sku             VARCHAR(50)  NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    product_type_id BIGINT       NOT NULL REFERENCES product_types (id),
    base_unit_price DECIMAL(10, 2),                     -- Optional catalog price (overrideable per quote)
    unit            VARCHAR(20)           DEFAULT 'EA', -- EA, M, KG, etc.
    is_active       BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_base_unit_price CHECK (base_unit_price IS NULL OR base_unit_price >= 0),
    CONSTRAINT uq_products_sku_active UNIQUE (sku, is_active)
);

-- Work progress step templates (manufacturing steps per product type)
CREATE TABLE work_progress_step_templates
(
    id              BIGSERIAL PRIMARY KEY,
    product_type_id BIGINT       NOT NULL REFERENCES product_types (id) ON DELETE CASCADE,
    step_name       VARCHAR(100) NOT NULL, -- Design, Laser, Sheet Metal, Machining, Assembly, Welding, Painting, Packaging
    step_order      INT          NOT NULL, -- Execution order
    is_required     BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (product_type_id, step_name),
    UNIQUE (product_type_id, step_order)
);

-- =====================================================================
-- INDEXES
-- =====================================================================

-- JobCode sequences indexes
CREATE INDEX idx_job_code_sequences_year ON job_code_sequences (year);

-- Projects indexes
CREATE INDEX idx_projects_job_code ON projects (job_code);
CREATE INDEX idx_projects_customer_id ON projects (customer_id);
CREATE INDEX idx_projects_internal_owner_id ON projects (internal_owner_id);
CREATE INDEX idx_projects_status ON projects (status);
CREATE INDEX idx_projects_created_at ON projects (created_at);
CREATE INDEX idx_projects_due_date ON projects (due_date);
CREATE INDEX idx_projects_is_deleted ON projects (is_deleted);

-- Products indexes
CREATE INDEX idx_products_sku ON products (sku);
CREATE INDEX idx_products_name ON products (name);
CREATE INDEX idx_products_product_type_id ON products (product_type_id);
CREATE INDEX idx_products_is_active ON products (is_active);

-- Product types indexes
CREATE INDEX idx_product_types_name ON product_types (name);

-- Work progress step templates indexes
CREATE INDEX idx_work_progress_step_templates_product_type_id ON work_progress_step_templates (product_type_id);
CREATE INDEX idx_work_progress_step_templates_step_order ON work_progress_step_templates (product_type_id, step_order);

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT
    ON TABLE job_code_sequences IS 'Stores last used sequence number per year for thread-safe JobCode generation';
COMMENT
    ON COLUMN job_code_sequences.year IS '2-digit year (e.g., "25" for 2025)';
COMMENT
    ON COLUMN job_code_sequences.last_sequence IS 'Last sequence number used for this year (0-based, actual JobCodes start at 1)';

COMMENT
    ON TABLE projects IS 'Core domain entity representing customer work requests. JobCode is the unique business identifier.';
COMMENT
    ON COLUMN projects.job_code IS 'Unique business identifier: WK2K{YY}-{SSSS}-{MMDD} (e.g. WK2K25-0001-0104)';
COMMENT
    ON COLUMN projects.status IS 'Project lifecycle status: DRAFT, ACTIVE, COMPLETED, ARCHIVED';

COMMENT
    ON TABLE products IS 'Product catalog for quotations, production, and invoicing';
COMMENT
    ON COLUMN products.sku IS 'Product code (unique when active)';
COMMENT
    ON COLUMN products.base_unit_price IS 'Optional catalog price - can be overridden per quotation';

COMMENT
    ON TABLE product_types IS 'Product categories with manufacturing step templates';
COMMENT
    ON TABLE work_progress_step_templates IS 'Manufacturing step templates per product type (e.g., Design → Laser → Sheet Metal → Assembly)';
