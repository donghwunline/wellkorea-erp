#!/bin/bash
# Script to exchange authorization code for refresh token
# Usage: ./scripts/get-outlook-refresh-token.sh

echo "=== Microsoft Graph Refresh Token Generator ==="
echo ""

# Prompt for values
read -p "Enter Client ID: " CLIENT_ID
read -p "Enter Client Secret: " CLIENT_SECRET
echo ""
echo "Now paste the authorization code from the URL (the value after 'code=' and before '&session_state'):"
read -p "Authorization Code: " AUTH_CODE

echo ""
echo "Exchanging code for tokens..."
echo ""

# Exchange code for tokens
RESPONSE=$(curl -s -X POST "https://login.microsoftonline.com/consumers/oauth2/v2.0/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "code=${AUTH_CODE}" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "grant_type=authorization_code" \
  -d "scope=offline_access Mail.Send")

# Check if response contains refresh_token
if echo "$RESPONSE" | grep -q "refresh_token"; then
  REFRESH_TOKEN=$(echo "$RESPONSE" | grep -o '"refresh_token":"[^"]*"' | cut -d'"' -f4)

  echo "=== SUCCESS ==="
  echo ""
  echo "Add these to your .env file:"
  echo ""
  echo "MAIL_PROVIDER=graph"
  echo "MICROSOFT_GRAPH_CLIENT_ID=${CLIENT_ID}"
  echo "MICROSOFT_GRAPH_CLIENT_SECRET=${CLIENT_SECRET}"
  echo "MICROSOFT_GRAPH_REFRESH_TOKEN=${REFRESH_TOKEN}"
  echo ""
else
  echo "=== ERROR ==="
  echo ""
  echo "Response from Microsoft:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  echo ""
  echo "Common issues:"
  echo "- Code already used (codes are single-use, get a new one)"
  echo "- Code expired (codes expire in 10 minutes)"
  echo "- Wrong redirect_uri (must match exactly)"
fi
