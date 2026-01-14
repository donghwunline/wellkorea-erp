-- =====================================================
-- V15: Create Distributed Lock Table
-- =====================================================
-- Spring Integration JDBC Lock Registry table for distributed locking.
-- Used by ProjectLockService to prevent race conditions during
-- concurrent delivery creation.
--
-- See: https://docs.spring.io/spring-integration/reference/jdbc.html#jdbc-lock-registry
-- =====================================================

-- INT_LOCK table required by Spring Integration JdbcLockRegistry
-- Default table name and schema as per Spring Integration documentation
CREATE TABLE IF NOT EXISTS INT_LOCK (
    LOCK_KEY     VARCHAR(255) NOT NULL,
    REGION       VARCHAR(100) NOT NULL,
    CLIENT_ID    VARCHAR(255) NOT NULL,
    CREATED_DATE TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT INT_LOCK_PK PRIMARY KEY (LOCK_KEY, REGION)
);

-- Index for efficient lock lookups by region
CREATE INDEX IF NOT EXISTS idx_int_lock_region ON INT_LOCK (REGION);

-- Comment for documentation
COMMENT ON TABLE INT_LOCK IS 'Spring Integration distributed lock table for preventing race conditions';
COMMENT ON COLUMN INT_LOCK.LOCK_KEY IS 'Lock identifier (e.g., project:123)';
COMMENT ON COLUMN INT_LOCK.REGION IS 'Lock region for namespace isolation';
COMMENT ON COLUMN INT_LOCK.CLIENT_ID IS 'UUID of the client holding the lock';
COMMENT ON COLUMN INT_LOCK.CREATED_DATE IS 'Timestamp when lock was acquired';
