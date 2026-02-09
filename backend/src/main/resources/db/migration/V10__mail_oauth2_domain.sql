-- V10: Mail OAuth2 Configuration Tables - Final consolidated state
-- Stores Microsoft Graph OAuth2 refresh tokens for in-app configuration.
-- Consolidated from V23-V25 (includes scale-out columns and token rotation).

-- =====================================================================
-- OAUTH2 STATE TABLE (CSRF Protection)
-- =====================================================================

CREATE TABLE mail_oauth2_state
(
    state      VARCHAR(64) PRIMARY KEY,
    user_id    BIGINT                   NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Index for state cleanup
CREATE INDEX idx_mail_oauth2_state_expires_at ON mail_oauth2_state (expires_at);

-- =====================================================================
-- MAIL OAUTH2 CONFIG TABLE (Final State)
-- =====================================================================

CREATE TABLE mail_oauth2_config
(
    id                       BIGSERIAL PRIMARY KEY,
    refresh_token            TEXT                     NOT NULL,
    sender_email             VARCHAR(255),
    connected_by_id          BIGINT                   NOT NULL REFERENCES users (id),
    connected_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Scale-out columns (from V24)
    access_token             TEXT,
    token_expires_at         TIMESTAMP WITH TIME ZONE,
    last_refresh_at          TIMESTAMP WITH TIME ZONE,
    config_key               VARCHAR(20)                       DEFAULT 'SINGLETON' NOT NULL,
    -- Token rotation tracking (from V25)
    refresh_token_rotated_at TIMESTAMP WITH TIME ZONE,
    -- Singleton constraint
    CONSTRAINT uq_mail_oauth2_config_singleton UNIQUE (config_key)
);

-- =====================================================================
-- INDEXES
-- =====================================================================

CREATE INDEX idx_mail_oauth2_config_connected_at ON mail_oauth2_config (connected_at DESC);
CREATE INDEX idx_mail_oauth2_config_token_expires_at ON mail_oauth2_config (token_expires_at);

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON TABLE mail_oauth2_config IS 'Stores Microsoft Graph OAuth2 refresh tokens for mail sending';
COMMENT ON TABLE mail_oauth2_state IS 'Temporary state storage for OAuth2 CSRF protection';
COMMENT ON COLUMN mail_oauth2_config.refresh_token IS 'Microsoft Graph refresh token (encrypted at rest by DB)';
COMMENT ON COLUMN mail_oauth2_config.sender_email IS 'Email address associated with this token';
COMMENT ON COLUMN mail_oauth2_config.access_token IS 'Cached access token for Graph API calls';
COMMENT ON COLUMN mail_oauth2_config.token_expires_at IS 'Access token expiry timestamp';
COMMENT ON COLUMN mail_oauth2_config.last_refresh_at IS 'Last token refresh timestamp';
COMMENT ON COLUMN mail_oauth2_config.config_key IS 'Singleton constraint key - always SINGLETON';
COMMENT ON COLUMN mail_oauth2_config.refresh_token_rotated_at IS 'Timestamp when refresh token was last rotated by Microsoft';
