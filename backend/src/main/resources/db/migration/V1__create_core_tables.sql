-- V1: Core tables for users, roles, customers, and suppliers
-- Migration Date: 2025-12-03
-- Purpose: Foundation tables for authentication, authorization, and business entities

-- Enable UUID extension
CREATE
EXTENSION IF NOT EXISTS "uuid-ossp";

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
CREATE TABLE user_roles
(
    user_id     BIGINT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_id     BIGINT    NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Customer assignment for Sales role (FR-062)
CREATE TABLE customer_assignments
(
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    customer_id BIGINT, -- Will reference customers table (created later in this migration)
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, customer_id)
);

-- =====================================================================
-- BUSINESS ENTITIES
-- =====================================================================

-- Customers table (external parties receiving quotations and invoices)
CREATE TABLE customers
(
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    registration_number VARCHAR(20) UNIQUE,                    -- 사업자등록번호
    tax_id              VARCHAR(20),
    contact_person      VARCHAR(100),
    phone               VARCHAR(20),
    email               VARCHAR(255),
    address             TEXT,
    payment_terms       VARCHAR(50)           DEFAULT 'NET30', -- NET30, NET60, COD, etc.
    is_deleted          BOOLEAN      NOT NULL DEFAULT false,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table (vendors for purchasing and RFQ)
CREATE TABLE suppliers
(
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    registration_number VARCHAR(20) UNIQUE,
    contact_person      VARCHAR(100),
    phone               VARCHAR(20),
    email               VARCHAR(255),
    address             TEXT,
    service_categories  TEXT[], -- Array of service categories for vendor suggestions
    is_active           BOOLEAN      NOT NULL DEFAULT true,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint for customer_assignments after customers table is created
ALTER TABLE customer_assignments
    ADD CONSTRAINT fk_customer_assignments_customer
        FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE;

-- =====================================================================
-- INDEXES
-- =====================================================================

-- Users indexes
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_is_active ON users (is_active);

-- Customers indexes
CREATE INDEX idx_customers_name ON customers (name);
CREATE INDEX idx_customers_registration_number ON customers (registration_number) WHERE registration_number IS NOT NULL;
CREATE INDEX idx_customers_is_deleted ON customers (is_deleted);

-- Suppliers indexes
CREATE INDEX idx_suppliers_name ON suppliers (name);
CREATE INDEX idx_suppliers_service_categories ON suppliers USING GIN(service_categories);
CREATE INDEX idx_suppliers_is_active ON suppliers (is_active);

-- Customer assignments indexes
CREATE INDEX idx_customer_assignments_user_id ON customer_assignments (user_id);
CREATE INDEX idx_customer_assignments_customer_id ON customer_assignments (customer_id);

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT
ON TABLE users IS 'User accounts for authentication and authorization';
COMMENT
ON TABLE roles IS 'RBAC roles: ADMIN, FINANCE, PRODUCTION, SALES';
COMMENT
ON TABLE user_roles IS 'Many-to-many mapping between users and roles';
COMMENT
ON TABLE customer_assignments IS 'Sales role customer filtering per FR-062';
COMMENT
ON TABLE customers IS 'External parties receiving quotations and invoices';
COMMENT
ON TABLE suppliers IS 'Vendors for purchasing and RFQ workflows';
