-- V1: Core infrastructure - users, roles, companies, service categories
-- This migration creates the foundational tables for authentication, authorization,
-- and business partner management.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- USERS AND ROLES
-- =====================================================================

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

CREATE TABLE roles
(
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles
(
    user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_name   VARCHAR(50) NOT NULL REFERENCES roles (name) ON DELETE CASCADE,
    assigned_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_name)
);

CREATE INDEX idx_user_roles_role_name ON user_roles (role_name);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_is_active ON users (is_active);
CREATE INDEX idx_users_active_fullname ON users (full_name) WHERE is_active = true;

-- =====================================================================
-- COMPANY DOMAIN (Unified Trading Partner)
-- =====================================================================

CREATE TABLE companies
(
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    registration_number VARCHAR(20),
    representative      VARCHAR(100),
    business_type       VARCHAR(100),
    business_category   VARCHAR(100),
    contact_person      VARCHAR(100),
    phone               VARCHAR(20),
    email               VARCHAR(255),
    address             TEXT,
    bank_account        VARCHAR(100),
    payment_terms       VARCHAR(50)           DEFAULT 'NET30',
    is_active           BOOLEAN      NOT NULL DEFAULT true,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_companies_registration_number_unique
    ON companies (registration_number)
    WHERE registration_number IS NOT NULL AND is_active = true;

CREATE TABLE company_roles
(
    company_id           BIGINT      NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
    role_type            VARCHAR(20) NOT NULL,
    credit_limit         DECIMAL(15, 2),
    default_payment_days INTEGER,
    notes                TEXT,
    created_at           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, role_type),
    CONSTRAINT chk_role_type CHECK (role_type IN ('CUSTOMER', 'VENDOR', 'OUTSOURCE'))
);

CREATE TABLE customer_assignments
(
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    company_id  BIGINT    NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, company_id)
);

CREATE INDEX idx_companies_name ON companies (name);
CREATE INDEX idx_companies_is_active ON companies (is_active);
CREATE INDEX idx_companies_active_name ON companies (name) WHERE is_active = true;
CREATE INDEX idx_companies_name_search ON companies (LOWER(name) text_pattern_ops);
CREATE INDEX idx_company_roles_role_type ON company_roles (role_type);
CREATE INDEX idx_customer_assignments_user_id ON customer_assignments (user_id);
CREATE INDEX idx_customer_assignments_company_id ON customer_assignments (company_id);

-- =====================================================================
-- SERVICE CATEGORY & VENDOR OFFERINGS
-- =====================================================================

CREATE TABLE service_categories
(
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendor_service_offerings
(
    id                   BIGSERIAL PRIMARY KEY,
    vendor_company_id    BIGINT         NOT NULL REFERENCES companies (id) ON DELETE RESTRICT,
    service_category_id  BIGINT         NOT NULL REFERENCES service_categories (id) ON DELETE RESTRICT,
    vendor_service_code  VARCHAR(50),
    vendor_service_name  VARCHAR(255),
    unit_price           DECIMAL(15, 2),
    currency             VARCHAR(3)              DEFAULT 'KRW',
    lead_time_days       INTEGER,
    min_order_quantity   INTEGER,
    effective_from       DATE,
    effective_to         DATE,
    is_preferred         BOOLEAN        NOT NULL DEFAULT false,
    notes                TEXT,
    created_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_price_positive CHECK (unit_price IS NULL OR unit_price >= 0),
    CONSTRAINT chk_lead_time_positive CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
    CONSTRAINT chk_min_order_positive CHECK (min_order_quantity IS NULL OR min_order_quantity >= 1),
    CONSTRAINT chk_effective_dates CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from)
);

CREATE UNIQUE INDEX idx_vendor_offering_unique
    ON vendor_service_offerings (vendor_company_id, service_category_id, effective_from)
    WHERE effective_from IS NOT NULL;

CREATE INDEX idx_service_categories_name ON service_categories (name);
CREATE INDEX idx_service_categories_is_active ON service_categories (is_active);
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
COMMENT ON TABLE company_roles IS 'Business relationship type with a company';
COMMENT ON TABLE customer_assignments IS 'Sales role customer filtering';
COMMENT ON TABLE service_categories IS 'Purchase/outsource service types for vendor-service mapping';
COMMENT ON TABLE vendor_service_offerings IS 'Maps vendors to service categories with pricing';
