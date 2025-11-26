-- WellKorea ERP Initial Schema
-- Core entities: JobCode, Customer, Product, ProductType, User, Role, AuditLog

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(active);

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User-Role mapping (many-to-many)
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'Full system access including user management'),
    ('FINANCE', 'Access to quotations, invoices, AR/AP, and financial reports'),
    ('SALES', 'Read-only access to quotations and customer data'),
    ('PRODUCTION', 'Access to work progress, deliveries, and production documents');

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    site_location VARCHAR(255),
    department VARCHAR(255),
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    billing_address TEXT,
    payment_terms VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_customers_company_name ON customers(company_name);
CREATE INDEX idx_customers_active ON customers(active);
CREATE INDEX idx_customers_created_by ON customers(created_by);

-- Product Types table
CREATE TABLE product_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_types_name ON product_types(name);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    category VARCHAR(100),
    product_type_id UUID REFERENCES product_types(id),
    base_unit_price DECIMAL(15, 2),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_type_id ON products(product_type_id);
CREATE INDEX idx_products_active ON products(active);

-- JobCode sequence table (for generating unique sequence numbers)
CREATE TABLE jobcode_sequences (
    year INT PRIMARY KEY,
    last_sequence INT DEFAULT 0
);

-- JobCodes table (aggregate root)
CREATE TABLE jobcodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jobcode VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    project_name VARCHAR(255) NOT NULL,
    requester VARCHAR(255),
    internal_owner_id UUID REFERENCES users(id),
    requested_due_date DATE,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_jobcode_status CHECK (status IN ('DRAFT', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

CREATE UNIQUE INDEX idx_jobcodes_jobcode ON jobcodes(jobcode);
CREATE INDEX idx_jobcodes_customer_id ON jobcodes(customer_id);
CREATE INDEX idx_jobcodes_owner_id ON jobcodes(internal_owner_id);
CREATE INDEX idx_jobcodes_status ON jobcodes(status);
CREATE INDEX idx_jobcodes_created_at ON jobcodes(created_at);
CREATE INDEX idx_jobcodes_deleted_at ON jobcodes(deleted_at);

-- Audit Log table (immutable)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address VARCHAR(50),
    details JSONB,
    CONSTRAINT chk_audit_action CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'DOWNLOAD'))
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_types_updated_at BEFORE UPDATE ON product_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobcodes_updated_at BEFORE UPDATE ON jobcodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'System users with authentication credentials';
COMMENT ON TABLE roles IS 'User roles for RBAC (Admin, Finance, Sales, Production)';
COMMENT ON TABLE customers IS 'Customer companies and contact information';
COMMENT ON TABLE product_types IS 'Product type categories with manufacturing step templates';
COMMENT ON TABLE products IS 'Product catalog with SKU and pricing';
COMMENT ON TABLE jobcodes IS 'Job codes (aggregate root) - single source of truth for projects';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for sensitive operations';
COMMENT ON COLUMN jobcodes.jobcode IS 'Auto-generated unique code format: WK2{year}-{sequence}-{date}';
