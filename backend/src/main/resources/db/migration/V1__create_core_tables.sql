-- V1: Core tables for users, roles, companies (unified customer/vendor)
-- Migration Date: 2025-12-03 (Updated: 2025-12-23)
-- Purpose: Foundation tables for authentication, authorization, and business entities
-- Update: Replaced separate customers/suppliers with unified Company + CompanyRole

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- USERS AND ROLES
-- =====================================================================

-- Users table (authentication and user management)
CREATE TABLE users
(
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(100) NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT true,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- Roles table (RBAC: Admin, Finance, Production, Sales)
CREATE TABLE roles
(
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User-Role mapping (many-to-many)
-- Stores role names directly for @ElementCollection JPA mapping
CREATE TABLE user_roles
(
    user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_name   VARCHAR(50) NOT NULL REFERENCES roles (name) ON DELETE CASCADE,
    assigned_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_name)
);

-- Index for efficient role-based queries
CREATE INDEX idx_user_roles_role_name ON user_roles (role_name);

-- =====================================================================
-- COMPANY DOMAIN (Unified Trading Partner)
-- =====================================================================

-- Companies table (unified customer/vendor/outsource)
-- Replaces separate customers and suppliers tables
CREATE TABLE companies
(
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    registration_number VARCHAR(20),                                    -- 사업자등록번호 (unique if provided)
    representative      VARCHAR(100),                                   -- 대표자명
    business_type       VARCHAR(100),                                   -- 업태
    business_category   VARCHAR(100),                                   -- 업종
    contact_person      VARCHAR(100),
    phone               VARCHAR(20),
    email               VARCHAR(255),
    address             TEXT,
    bank_account        VARCHAR(100),                                   -- Bank account info for payments
    payment_terms       VARCHAR(50)           DEFAULT 'NET30',          -- NET30, NET60, COD, etc.
    is_active           BOOLEAN      NOT NULL DEFAULT true,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint on registration_number for active companies only
CREATE UNIQUE INDEX idx_companies_registration_number_unique
    ON companies (registration_number)
    WHERE registration_number IS NOT NULL AND is_active = true;

-- Company roles table (CUSTOMER, VENDOR, OUTSOURCE)
-- A company can have multiple roles (e.g., same company is both customer and vendor)
-- Uses composite primary key (company_id, role_type) - embeddable value object pattern
CREATE TABLE company_roles
(
    company_id           BIGINT      NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
    role_type            VARCHAR(20) NOT NULL,                          -- CUSTOMER, VENDOR, OUTSOURCE
    credit_limit         DECIMAL(15, 2),                                -- 여신한도 (role-specific)
    default_payment_days INTEGER,                                       -- Default payment terms in days
    notes                TEXT,                                          -- Role-specific notes
    created_at           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (company_id, role_type),
    CONSTRAINT chk_role_type CHECK (role_type IN ('CUSTOMER', 'VENDOR', 'OUTSOURCE'))
);

-- Customer assignment for Sales role (FR-062)
-- References companies table with CUSTOMER role
CREATE TABLE customer_assignments
(
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    company_id  BIGINT    NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, company_id)
);

-- =====================================================================
-- SERVICE CATEGORY & VENDOR OFFERING (FR-053)
-- =====================================================================

-- Service categories for purchase/outsource (CNC, etching, painting, etc.)
CREATE TABLE service_categories
(
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,                           -- "CNC 가공", "에칭", "도장", "레이저 컷팅"
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Vendor service offerings (maps vendors to service categories with pricing)
-- Enables "select service → get vendor/price list" functionality per FR-053
CREATE TABLE vendor_service_offerings
(
    id                   BIGSERIAL PRIMARY KEY,
    vendor_company_id    BIGINT         NOT NULL REFERENCES companies (id) ON DELETE RESTRICT,
    service_category_id  BIGINT         NOT NULL REFERENCES service_categories (id) ON DELETE RESTRICT,
    vendor_service_code  VARCHAR(50),                                   -- Vendor's internal service code
    vendor_service_name  VARCHAR(255),                                  -- Vendor's service name
    unit_price           DECIMAL(15, 2),                                -- Price per unit
    currency             VARCHAR(3)              DEFAULT 'KRW',
    lead_time_days       INTEGER,                                       -- Expected delivery time in days
    min_order_quantity   INTEGER,                                       -- Minimum order quantity
    effective_from       DATE,                                          -- Price effective start date
    effective_to         DATE,                                          -- Price effective end date (null = no expiry)
    is_preferred         BOOLEAN        NOT NULL DEFAULT false,         -- Preferred vendor flag
    notes                TEXT,
    created_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_price_positive CHECK (unit_price IS NULL OR unit_price >= 0),
    CONSTRAINT chk_lead_time_positive CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
    CONSTRAINT chk_min_order_positive CHECK (min_order_quantity IS NULL OR min_order_quantity >= 1),
    CONSTRAINT chk_effective_dates CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from)
);

-- Unique constraint to prevent duplicate pricing periods for same vendor+service
CREATE UNIQUE INDEX idx_vendor_offering_unique
    ON vendor_service_offerings (vendor_company_id, service_category_id, effective_from)
    WHERE effective_from IS NOT NULL;

-- =====================================================================
-- INDEXES
-- =====================================================================

-- Users indexes
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_is_active ON users (is_active);

-- Companies indexes
CREATE INDEX idx_companies_name ON companies (name);
CREATE INDEX idx_companies_is_active ON companies (is_active);

-- Company roles indexes (company_id covered by PK)
CREATE INDEX idx_company_roles_role_type ON company_roles (role_type);

-- Customer assignments indexes
CREATE INDEX idx_customer_assignments_user_id ON customer_assignments (user_id);
CREATE INDEX idx_customer_assignments_company_id ON customer_assignments (company_id);

-- Service categories indexes
CREATE INDEX idx_service_categories_name ON service_categories (name);
CREATE INDEX idx_service_categories_is_active ON service_categories (is_active);

-- Vendor service offerings indexes (FR-053: select service → get vendors)
CREATE INDEX idx_vendor_offering_service ON vendor_service_offerings (service_category_id, is_preferred, unit_price);
CREATE INDEX idx_vendor_offering_vendor ON vendor_service_offerings (vendor_company_id);
CREATE INDEX idx_vendor_offering_dates ON vendor_service_offerings (effective_from, effective_to);

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE users IS 'User accounts for authentication and authorization';
COMMENT ON TABLE roles IS 'RBAC roles: ADMIN, FINANCE, PRODUCTION, SALES';
COMMENT ON TABLE user_roles IS 'Many-to-many mapping between users and roles';

COMMENT ON TABLE companies IS 'Unified trading partner - can be customer, vendor, and/or outsource partner';
COMMENT ON COLUMN companies.registration_number IS '사업자등록번호 - Korean business registration number (unique if provided)';
COMMENT ON COLUMN companies.representative IS '대표자명 - Company representative name';
COMMENT ON COLUMN companies.business_type IS '업태 - Business type';
COMMENT ON COLUMN companies.business_category IS '업종 - Business category';

COMMENT ON TABLE company_roles IS 'Business relationship type with a company - supports dual-role (same company as customer AND vendor)';
COMMENT ON COLUMN company_roles.role_type IS 'CUSTOMER: 고객사, VENDOR: 공급업체, OUTSOURCE: 외주업체';
COMMENT ON COLUMN company_roles.credit_limit IS '여신한도 - Credit limit specific to role';

COMMENT ON TABLE customer_assignments IS 'Sales role customer filtering per FR-062';

COMMENT ON TABLE service_categories IS 'Purchase/outsource service types for vendor-service mapping per FR-053';
COMMENT ON COLUMN service_categories.name IS 'Service name: CNC 가공, 에칭, 도장, 레이저 컷팅, etc.';

COMMENT ON TABLE vendor_service_offerings IS 'Maps vendors to service categories with pricing (FR-053: select service → get vendors)';
COMMENT ON COLUMN vendor_service_offerings.is_preferred IS 'Preferred vendor flag - shown first in selection';
COMMENT ON COLUMN vendor_service_offerings.effective_from IS 'Price effective start date';
COMMENT ON COLUMN vendor_service_offerings.effective_to IS 'Price effective end date (null = no expiry)';
