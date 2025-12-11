-- V3: Performance-critical indexes for optimized queries
-- Migration Date: 2025-12-03
-- Purpose: Additional indexes for common query patterns and performance optimization

-- =====================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- =====================================================================

-- Project queries: Filter by customer and status
CREATE INDEX idx_projects_customer_status ON projects (customer_id, status) WHERE is_deleted = false;

-- Project queries: Filter by owner and status
CREATE INDEX idx_projects_owner_status ON projects (internal_owner_id, status) WHERE is_deleted = false;

-- Project queries: Recent projects with due dates
CREATE INDEX idx_projects_recent_due_date ON projects (created_at DESC, due_date) WHERE is_deleted = false;

-- Customer queries: Active customers with names (for autocomplete)
CREATE INDEX idx_customers_active_name ON customers (name) WHERE is_deleted = false;

-- User queries: Active users for assignment
CREATE INDEX idx_users_active_fullname ON users (full_name) WHERE is_active = true;

-- Product queries: Active products by type (for quotation product selection)
CREATE INDEX idx_products_type_active ON products (product_type_id, name) WHERE is_active = true;

-- =====================================================================
-- TEXT SEARCH INDEXES (Pattern Matching)
-- =====================================================================
-- Note: Full-text search with to_tsvector() requires generated columns
-- For now, using B-tree indexes for LIKE queries and pattern matching
-- Can be upgraded to GIN/tsvector in a future migration if needed

-- Text search for project names (supports LIKE queries)
CREATE INDEX idx_projects_name_search ON projects (LOWER(project_name) text_pattern_ops);

-- Text search for product names (supports LIKE queries)
CREATE INDEX idx_products_name_search ON products (LOWER(name) text_pattern_ops);

-- Text search for customer names (supports LIKE queries)
CREATE INDEX idx_customers_name_search ON customers (LOWER(name) text_pattern_ops);

-- =====================================================================
-- PARTIAL INDEXES FOR FILTERED QUERIES
-- =====================================================================

-- Active projects only (most common query)
CREATE INDEX idx_projects_active_only ON projects (created_at DESC) WHERE status = 'ACTIVE' AND is_deleted = false;

-- Draft projects for in-progress work
CREATE INDEX idx_projects_draft_only ON projects (created_at DESC) WHERE status = 'DRAFT' AND is_deleted = false;

-- Overdue projects - removed WHERE clause with CURRENT_DATE (not immutable)
-- Query performance is still good with partial index on status and is_deleted
CREATE INDEX idx_projects_by_due_date ON projects (due_date) WHERE status IN ('DRAFT', 'ACTIVE') AND is_deleted = false;

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT
    ON INDEX idx_projects_customer_status IS 'Optimize queries filtering by customer and status';
COMMENT
    ON INDEX idx_projects_owner_status IS 'Optimize queries filtering by internal owner and status';
COMMENT
    ON INDEX idx_projects_name_search IS 'Text pattern search for project names (LIKE queries)';
COMMENT
    ON INDEX idx_products_name_search IS 'Text pattern search for product catalog (LIKE queries)';
COMMENT
    ON INDEX idx_customers_name_search IS 'Text pattern search for customer names (LIKE queries)';
COMMENT
    ON INDEX idx_projects_by_due_date IS 'Quick lookup for projects by due date (overdue check done in application layer)';
