-- V25: Add refresh token rotation tracking
-- Microsoft may return a new refresh token during token refresh (token rotation)
-- This column tracks when the refresh token was last rotated for auditing

ALTER TABLE mail_oauth2_config
    ADD COLUMN refresh_token_rotated_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN mail_oauth2_config.refresh_token_rotated_at IS 'Timestamp when refresh token was last rotated by Microsoft';
