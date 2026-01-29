-- V24: Scale-out ready mail OAuth2 configuration
-- Adds access token storage and singleton constraint for distributed deployment

-- Add access token columns for caching
ALTER TABLE mail_oauth2_config ADD COLUMN access_token TEXT;
ALTER TABLE mail_oauth2_config ADD COLUMN token_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE mail_oauth2_config ADD COLUMN last_refresh_at TIMESTAMP WITH TIME ZONE;

-- Add singleton constraint to ensure only one config exists
ALTER TABLE mail_oauth2_config
    ADD COLUMN config_key VARCHAR(20) DEFAULT 'SINGLETON' NOT NULL;
ALTER TABLE mail_oauth2_config
    ADD CONSTRAINT uq_mail_oauth2_config_singleton UNIQUE (config_key);

-- Index for token expiry checks
CREATE INDEX idx_mail_oauth2_config_token_expires_at
ON mail_oauth2_config(token_expires_at);

COMMENT ON COLUMN mail_oauth2_config.access_token IS 'Cached access token for Graph API calls';
COMMENT ON COLUMN mail_oauth2_config.token_expires_at IS 'Access token expiry timestamp';
COMMENT ON COLUMN mail_oauth2_config.last_refresh_at IS 'Last token refresh timestamp';
COMMENT ON COLUMN mail_oauth2_config.config_key IS 'Singleton constraint key - always SINGLETON';
