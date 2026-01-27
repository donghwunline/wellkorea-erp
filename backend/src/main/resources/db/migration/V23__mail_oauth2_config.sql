-- Mail OAuth2 Configuration Tables
-- Stores Microsoft Graph OAuth2 refresh tokens for in-app configuration

-- OAuth2 state for CSRF protection during authorization flow
CREATE TABLE mail_oauth2_state (
    state           VARCHAR(64) PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Main configuration table storing the refresh token
CREATE TABLE mail_oauth2_config (
    id              BIGSERIAL PRIMARY KEY,
    refresh_token   TEXT NOT NULL,
    sender_email    VARCHAR(255),
    connected_by_id BIGINT NOT NULL REFERENCES users(id),
    connected_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mail_oauth2_config_user FOREIGN KEY (connected_by_id) REFERENCES users(id)
);

-- Index for efficient lookup of latest config
CREATE INDEX idx_mail_oauth2_config_connected_at ON mail_oauth2_config(connected_at DESC);

-- Index for state cleanup
CREATE INDEX idx_mail_oauth2_state_expires_at ON mail_oauth2_state(expires_at);

COMMENT ON TABLE mail_oauth2_config IS 'Stores Microsoft Graph OAuth2 refresh tokens for mail sending';
COMMENT ON TABLE mail_oauth2_state IS 'Temporary state storage for OAuth2 CSRF protection';
COMMENT ON COLUMN mail_oauth2_config.refresh_token IS 'Microsoft Graph refresh token (encrypted at rest by DB)';
COMMENT ON COLUMN mail_oauth2_config.sender_email IS 'Email address associated with this token';
