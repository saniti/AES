# OAuth Troubleshooting - "unauthorized_client" Error

## Problem

The application is receiving an "unauthorized_client" error when attempting to authenticate with the Azure OAuth server.

## Root Cause Analysis

The "unauthorized_client" error typically occurs when:

1. **Client Not Registered**: The client ID `equinedashboard_manus_ai` is not registered on the OAuth server
2. **Redirect URI Mismatch**: The redirect URI in the request doesn't match what's registered
3. **Client Configuration**: The client is not configured to allow the authorization code flow
4. **Protocol Mismatch**: HTTP vs HTTPS mismatch in redirect URIs

## Current Configuration

- **Client ID**: `equinedashboard_manus_ai`
- **Redirect URI**: `http://localhost:3000/auth-callback`
- **OAuth Authority**: `https://app-is-prod.azurewebsites.net`
- **Response Type**: `code`
- **Token Auth Method**: `none` (public client)

## Working Configuration Reference

From the provided working configuration:
```javascript
redirect_uri: "https://localhost:3000/auth-callback"  // Note: HTTPS
```

## Possible Solutions

### Solution 1: Update Redirect URI to HTTPS

The working configuration uses HTTPS for localhost. This might be required by the OAuth server.

**Action Required**:
1. Set up HTTPS for local development
2. Update `.env` to use `https://localhost:3000/auth-callback`
3. Restart the server

### Solution 2: Verify Client Registration

The client needs to be registered on the OAuth server with the correct settings.

**Action Required**:
Contact the OAuth server administrator to verify:
- Client ID `equinedashboard_manus_ai` is registered
- Redirect URI `http://localhost:3000/auth-callback` (or `https://localhost:3000/auth-callback`) is whitelisted
- Client is configured as a "public client" (no client secret)
- Authorization code flow is enabled
- PKCE is enabled/allowed

### Solution 3: Use Demo Mode for Testing

While resolving the OAuth issue, you can use demo mode to test the application.

**Steps**:
1. Edit `.env` file
2. Set `DEMO_MODE=true`
3. Restart the server
4. You'll be automatically logged in without OAuth

## Recommended Next Steps

1. **Verify with Administrator**: Contact the OAuth server administrator to confirm:
   - Is `equinedashboard_manus_ai` registered?
   - What is the exact registered redirect URI?
   - Is it configured as a public client?
   - Are there any IP or domain restrictions?

2. **Check Redirect URI**: The working config uses HTTPS. Try:
   - Setting up HTTPS locally with a self-signed certificate
   - Or ask the administrator to add `http://localhost:3000/auth-callback` to allowed redirect URIs

3. **Review Client Settings**: Ask the administrator to verify:
   - Grant types: Should include "authorization_code"
   - Response types: Should include "code"
   - PKCE: Should be enabled or optional
   - Token endpoint auth method: Should be "none" for public clients

## Testing OAuth Configuration

To test if the OAuth server is accessible and properly configured:

```bash
# Test the discovery endpoint
curl https://app-is-prod.azurewebsites.net/.well-known/openid-configuration

# Check if the client can be authorized (will return error but shows if endpoint is reachable)
curl "https://app-is-prod.azurewebsites.net/connect/authorize?client_id=equinedashboard_manus_ai&response_type=code&redirect_uri=http://localhost:3000/auth-callback&scope=openid"
```

## Alternative: Use HTTPS Locally

If HTTPS is required, you can set up a local HTTPS server:

1. Generate self-signed certificate:
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

2. Update `server.js` to use HTTPS:
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});
```

3. Update `.env`:
```
OAUTH_REDIRECT_URI=https://localhost:3000/auth-callback
OAUTH_POST_LOGOUT_REDIRECT_URI=https://localhost:3000/
```

## Contact Information

To resolve this issue, you'll need to contact the OAuth server administrator with:
- Client ID: `equinedashboard_manus_ai`
- Requested redirect URI: `http://localhost:3000/auth-callback` or `https://localhost:3000/auth-callback`
- Error: "unauthorized_client"
- Request ID from error page (if available)

## Current Status

❌ OAuth authentication failing with "unauthorized_client"  
✅ OIDC client initialization successful  
✅ Discovery endpoint accessible  
✅ Demo mode working  
⚠️ Requires OAuth server administrator assistance
