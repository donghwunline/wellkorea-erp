# Microsoft Graph Mail Configuration

This document explains how to configure Microsoft Graph API for sending emails from the WellKorea ERP system.

## Overview

The application supports sending emails via Microsoft Graph API using OAuth2 delegated permissions. This is useful for personal Microsoft accounts (hotmail.com, outlook.com) where SMTP access may be restricted.

**Two configuration methods are available:**

1. **In-App OAuth2** (Recommended) - Admin connects via the UI, tokens stored in database
2. **Environment Variable** (Fallback) - Refresh token provided via `MICROSOFT_GRAPH_REFRESH_TOKEN`

## Prerequisites

### 1. Azure AD App Registration

1. Go to [Azure Portal](https://portal.azure.com) > Azure Active Directory > App registrations
2. Click "New registration"
3. Configure:
   - **Name**: `WellKorea ERP Mail`
   - **Supported account types**: "Personal Microsoft accounts only" (for hotmail/outlook)
   - **Redirect URI**: Web platform with your callback URL (see below)
4. Click "Register"

### 2. Configure Redirect URIs

Add the following redirect URIs based on your environment:

| Environment | Redirect URI |
|-------------|--------------|
| Development | `http://localhost:8080/api/admin/mail/oauth2/callback` |
| Production  | `https://your-api-domain.com/api/admin/mail/oauth2/callback` |

### 3. Create Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Add a description and expiration
4. **Copy the secret value immediately** (it won't be shown again)

### 4. Configure API Permissions

1. Go to "API permissions"
2. Click "Add a permission" > "Microsoft Graph" > "Delegated permissions"
3. Add:
   - `Mail.Send` - Send mail as the user
   - `offline_access` - Maintain access (for refresh tokens)
4. Click "Add permissions"

> **Note**: For personal Microsoft accounts, admin consent is not required.

### 5. Note Your App Credentials

You'll need:
- **Application (client) ID** - Found on the Overview page
- **Client secret** - Created in step 3

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Enable Microsoft Graph mail provider
MAIL_PROVIDER=graph

# Azure AD App credentials
MICROSOFT_GRAPH_CLIENT_ID=your-client-id-here
MICROSOFT_GRAPH_CLIENT_SECRET=your-client-secret-here

# App URLs (required for OAuth2 redirect)
APP_BASE_URL=http://localhost:8080          # Backend URL
APP_FRONTEND_URL=http://localhost:5173      # Frontend URL

# Optional: Fallback refresh token (if not using in-app OAuth2)
# MICROSOFT_GRAPH_REFRESH_TOKEN=your-refresh-token-here
```

### Production Configuration

```bash
MAIL_PROVIDER=graph
MICROSOFT_GRAPH_CLIENT_ID=your-client-id
MICROSOFT_GRAPH_CLIENT_SECRET=your-client-secret
APP_BASE_URL=https://api.your-domain.com
APP_FRONTEND_URL=https://your-domain.com
```

## In-App OAuth2 Flow

### User Flow

1. Admin navigates to **Admin Settings > Mail** (`/admin/settings/mail`)
2. Clicks "Connect Microsoft Account"
3. Redirected to Microsoft login
4. Authorizes the application
5. Redirected back to settings page with success message
6. Mail is now configured and ready to send

### Technical Flow

```
┌─────────┐     ┌─────────┐     ┌───────────┐     ┌──────────┐
│  Admin  │     │ Frontend│     │  Backend  │     │Microsoft │
└────┬────┘     └────┬────┘     └─────┬─────┘     └────┬─────┘
     │               │                │                 │
     │ Click Connect │                │                 │
     │──────────────>│                │                 │
     │               │                │                 │
     │               │ GET /authorize │                 │
     │               │───────────────>│                 │
     │               │                │                 │
     │               │  {authUrl}     │ Generate state  │
     │               │<───────────────│ Store in DB     │
     │               │                │                 │
     │  Redirect to Microsoft         │                 │
     │<───────────────────────────────────────────────>│
     │               │                │                 │
     │         Login & Authorize      │                 │
     │────────────────────────────────────────────────>│
     │               │                │                 │
     │  Redirect to /callback?code=X&state=Y           │
     │<────────────────────────────────────────────────│
     │               │                │                 │
     │               │                │ GET /callback   │
     │               │                │<────────────────│
     │               │                │                 │
     │               │                │ Validate state  │
     │               │                │ Exchange code   │
     │               │                │────────────────>│
     │               │                │                 │
     │               │                │ {refresh_token} │
     │               │                │<────────────────│
     │               │                │                 │
     │               │                │ Store in DB     │
     │               │                │ Delete state    │
     │               │                │                 │
     │  Redirect to /admin/settings/mail?success=true  │
     │<───────────────────────────────│                 │
     │               │                │                 │
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/mail/oauth2/status` | Get connection status |
| GET | `/api/admin/mail/oauth2/authorize` | Get Microsoft auth URL |
| GET | `/api/admin/mail/oauth2/callback` | Handle Microsoft redirect |
| DELETE | `/api/admin/mail/oauth2` | Disconnect (remove config) |

### Database Tables

**mail_oauth2_config** - Stores the refresh token
```sql
CREATE TABLE mail_oauth2_config (
    id              BIGSERIAL PRIMARY KEY,
    refresh_token   TEXT NOT NULL,
    sender_email    VARCHAR(255),
    connected_by_id BIGINT NOT NULL REFERENCES users(id),
    connected_at    TIMESTAMP WITH TIME ZONE NOT NULL
);
```

**mail_oauth2_state** - Temporary state for CSRF protection
```sql
CREATE TABLE mail_oauth2_state (
    state       VARCHAR(64) PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL
);
```

## Token Priority

The `GraphMailSender` uses tokens in this order:

1. **Database** - Token stored via in-app OAuth2 (takes priority)
2. **Environment Variable** - `MICROSOFT_GRAPH_REFRESH_TOKEN` (fallback)

This allows:
- Initial setup via environment variable
- Seamless transition to in-app configuration
- No app restart required when token is updated via UI

## Troubleshooting

### "Microsoft Graph is not configured"

**Cause**: `MICROSOFT_GRAPH_CLIENT_ID` or `MICROSOFT_GRAPH_CLIENT_SECRET` not set.

**Solution**: Add the credentials to your `.env` file and restart the application.

### "Invalid OAuth2 state parameter"

**Cause**: The state parameter from Microsoft doesn't match any stored state.

**Possible reasons**:
- User took too long to authorize (state expired after 10 minutes)
- Browser back/forward navigation issues
- State already consumed

**Solution**: Click "Connect" again to start a fresh authorization flow.

### "Failed to exchange authorization code"

**Cause**: Code exchange with Microsoft failed.

**Possible reasons**:
- Authorization code already used (codes are single-use)
- Code expired (codes expire in ~10 minutes)
- Redirect URI mismatch
- Invalid client credentials

**Solution**:
1. Verify redirect URI in Azure AD matches exactly
2. Verify client ID and secret are correct
3. Try connecting again

### "No refresh token available"

**Cause**: Neither database nor environment variable has a refresh token.

**Solution**: Either:
- Connect via Admin Settings > Mail
- Set `MICROSOFT_GRAPH_REFRESH_TOKEN` environment variable

### Emails not sending after token refresh

**Cause**: Microsoft may have revoked the refresh token.

**Possible reasons**:
- User changed password
- Token expired (typically 90 days of inactivity)
- Admin revoked app access

**Solution**: Disconnect and reconnect via Admin Settings > Mail.

## Security Considerations

1. **Refresh tokens are sensitive** - They're stored in the database and should be protected
2. **State parameter prevents CSRF** - Each authorization flow uses a unique, time-limited state
3. **Callback endpoint is public** - But protected by state validation
4. **Admin-only access** - Only users with ADMIN role can configure mail

## Manual Token Generation (Legacy)

If you need to generate a refresh token manually (without the in-app flow), use the provided script:

```bash
# 1. Get authorization URL
# Visit: https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?
#   client_id=YOUR_CLIENT_ID&
#   response_type=code&
#   redirect_uri=http://localhost:3000/callback&
#   scope=offline_access%20Mail.Send&
#   response_mode=query

# 2. After authorization, copy the code from the redirect URL

# 3. Run the script
./scripts/get-outlook-refresh-token.sh

# 4. Copy the refresh token to your .env file
```

> **Note**: The in-app OAuth2 flow is recommended over manual token generation.

## Related Documentation

- [Deployment Guide](deployment.md) - Full deployment instructions
- [CI/CD Setup](ci-cd-setup.md) - Environment configuration for CI/CD
