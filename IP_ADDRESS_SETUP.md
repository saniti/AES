# IP Address Configuration Guide

## Using a Specific IP Address Instead of Localhost

If you're running the server on a specific IP address (e.g., `192.168.254.58`) instead of `localhost`, you need to update the configuration and SSL certificates.

## Current Configuration

The application is configured for:
- **IP Address**: `192.168.254.58`
- **Port**: `3000`
- **Full URL**: `https://192.168.254.58:3000`

## Setup Steps

### 1. Update Environment Configuration

The `.env` file has been updated with:

```env
OAUTH_REDIRECT_URI=https://192.168.254.58:3000/auth-callback
OAUTH_POST_LOGOUT_REDIRECT_URI=https://192.168.254.58:3000/
```

### 2. Generate SSL Certificate for IP Address

Generate a certificate that includes the IP address:

```bash
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
  -keyout localhost-key.pem \
  -out localhost-cert.pem \
  -subj "/CN=192.168.254.58" \
  -addext "subjectAltName=IP:192.168.254.58,DNS:localhost"
```

This creates a certificate that works for both:
- `https://192.168.254.58:3000`
- `https://localhost:3000`

### 3. Update OAuth Client Registration

**IMPORTANT**: You must update the OAuth client registration on the Azure OAuth server.

Contact your OAuth administrator to add the new redirect URI:
- **New Redirect URI**: `https://192.168.254.58:3000/auth-callback`
- **New Logout URI**: `https://192.168.254.58:3000/`

The OAuth server must whitelist these URIs for the client `equinedashboard_manus_ai`.

### 4. Start the Server

```bash
npm start
```

The server will show:

```
========================================
Alerte Equine Science
========================================
Server running on https://localhost:3000
Demo Mode: DISABLED
HTTPS: ENABLED
========================================
Redirect URI: https://192.168.254.58:3000/auth-callback
```

Note: The server listens on all interfaces (0.0.0.0), so it's accessible via:
- `https://localhost:3000`
- `https://192.168.254.58:3000`
- `https://127.0.0.1:3000`

### 5. Access the Application

Open your browser to:

```
https://192.168.254.58:3000
```

Accept the security warning (self-signed certificate).

## Accessing from Other Devices

If you want to access the application from other devices on your network:

1. **Firewall**: Ensure port 3000 is open on the server
   ```bash
   # Ubuntu/Debian
   sudo ufw allow 3000/tcp
   
   # CentOS/RHEL
   sudo firewall-cmd --add-port=3000/tcp --permanent
   sudo firewall-cmd --reload
   ```

2. **Access from other devices**: Use the IP address
   ```
   https://192.168.254.58:3000
   ```

3. **Accept certificate**: Each device will need to accept the self-signed certificate

## Troubleshooting

### OAuth Still Fails with "unauthorized_client"

**Cause**: The OAuth server hasn't been updated with the new redirect URI.

**Solution**: Contact the OAuth administrator to add `https://192.168.254.58:3000/auth-callback` to the allowed redirect URIs for client `equinedashboard_manus_ai`.

### Certificate Warning Shows Wrong Address

**Cause**: The certificate was generated for a different address.

**Solution**: Regenerate the certificate with the correct IP address (see step 2 above).

### Can't Access from Other Devices

**Possible causes**:
1. Firewall blocking port 3000
2. Server not binding to all interfaces
3. Network routing issues

**Solutions**:
- Check firewall rules
- Verify server is listening on 0.0.0.0 (not just 127.0.0.1)
- Check network connectivity with `ping 192.168.254.58`

### Different IP Address Needed

If your IP address is different (e.g., `192.168.1.100`):

1. Edit `.env`:
   ```env
   OAUTH_REDIRECT_URI=https://192.168.1.100:3000/auth-callback
   OAUTH_POST_LOGOUT_REDIRECT_URI=https://192.168.1.100:3000/
   ```

2. Regenerate certificate:
   ```bash
   openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
     -keyout localhost-key.pem \
     -out localhost-cert.pem \
     -subj "/CN=192.168.1.100" \
     -addext "subjectAltName=IP:192.168.1.100,DNS:localhost"
   ```

3. Update OAuth client registration with new redirect URI

4. Restart server

## Using a Domain Name

If you have a domain name (e.g., `aes.local`):

1. Update `.env`:
   ```env
   OAUTH_REDIRECT_URI=https://aes.local:3000/auth-callback
   OAUTH_POST_LOGOUT_REDIRECT_URI=https://aes.local:3000/
   ```

2. Generate certificate for domain:
   ```bash
   openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
     -keyout localhost-key.pem \
     -out localhost-cert.pem \
     -subj "/CN=aes.local" \
     -addext "subjectAltName=DNS:aes.local,DNS:localhost,IP:192.168.254.58"
   ```

3. Update OAuth client registration

4. Add to hosts file (on client machines):
   ```
   192.168.254.58  aes.local
   ```

5. Restart server and access via `https://aes.local:3000`

## Production Deployment

For production with a public IP or domain:

1. **Use proper SSL certificate** from a trusted CA (Let's Encrypt, etc.)
2. **Update OAuth client** with production redirect URIs
3. **Configure DNS** to point to your server
4. **Set up reverse proxy** (nginx, Apache) for better security
5. **Use standard HTTPS port** (443) instead of 3000

## Security Notes

- Self-signed certificates are only for development
- Always use proper certificates in production
- Keep the private key (`localhost-key.pem`) secure
- Don't commit certificates to version control
- Regenerate certificates if compromised

## Current Status

✅ Configured for IP: `192.168.254.58`  
✅ SSL certificate generated with IP SAN  
✅ OAuth redirect URIs updated in `.env`  
⚠️ OAuth server must be updated by administrator  

## Next Steps

1. **Test locally**: Access `https://192.168.254.58:3000`
2. **Contact OAuth admin**: Request redirect URI update
3. **Test OAuth**: Try logging in after admin updates
4. **Document**: Note the IP address for team members

---

**Need Help?** See README.md or OAUTH_TROUBLESHOOTING.md for more assistance.
