# HTTPS Setup Guide for Local Development

## Why HTTPS is Required

The Azure OAuth authentication provider requires HTTPS for security. This ensures that:

- Login credentials are encrypted during transmission
- OAuth tokens are securely exchanged
- The authentication flow meets security best practices
- The application matches production environment behavior

## Quick Setup

### 1. Generate SSL Certificates

Run this command in the project directory:

```bash
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -keyout localhost-key.pem -out localhost-cert.pem -days 365
```

This creates two files:
- `localhost-key.pem` - Private key (keep this secure)
- `localhost-cert.pem` - Self-signed certificate

### 2. Verify Configuration

Check your `.env` file contains:

```
USE_HTTPS=true
OAUTH_REDIRECT_URI=https://localhost:3000/auth-callback
OAUTH_POST_LOGOUT_REDIRECT_URI=https://localhost:3000/
```

### 3. Start the Server

```bash
npm start
```

You should see:

```
========================================
Alerte Equine Science
========================================
Server running on https://localhost:3000
Demo Mode: DISABLED
HTTPS: ENABLED
========================================
```

### 4. Access the Application

1. Open your browser to `https://localhost:3000`
2. Accept the security warning (see below)
3. Start using the application

## Accepting Self-Signed Certificates

### Google Chrome

1. Navigate to `https://localhost:3000`
2. You'll see "Your connection is not private"
3. Click **"Advanced"**
4. Click **"Proceed to localhost (unsafe)"**

### Mozilla Firefox

1. Navigate to `https://localhost:3000`
2. You'll see "Warning: Potential Security Risk Ahead"
3. Click **"Advanced"**
4. Click **"Accept the Risk and Continue"**

### Safari

1. Navigate to `https://localhost:3000`
2. You'll see "This Connection Is Not Private"
3. Click **"Show Details"**
4. Click **"visit this website"**
5. Enter your Mac password if prompted
6. Click **"Visit Website"**

### Microsoft Edge

1. Navigate to `https://localhost:3000`
2. You'll see "Your connection isn't private"
3. Click **"Advanced"**
4. Click **"Continue to localhost (unsafe)"**

## Understanding the Security Warning

### Why Does This Happen?

Browsers show a warning because:
- The certificate is self-signed (not from a trusted Certificate Authority)
- Browsers can't verify the certificate's authenticity
- This is standard for local development

### Is It Safe?

**Yes, for localhost development:**
- The certificate is on your own computer
- The connection is still encrypted
- No third party can intercept the traffic
- It's only accessible from your machine

**No, for public websites:**
- Never accept certificate warnings on public websites
- Only accept for `localhost` or `127.0.0.1`
- Production sites should use proper certificates

## Troubleshooting

### Certificate Files Not Found

**Error**: "HTTPS certificates not found"

**Solution**: Generate certificates using the command in step 1 above.

### Port Already in Use

**Error**: "EADDRINUSE: address already in use"

**Solution**: 
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change the port in .env
PORT=3001
```

### Browser Still Shows HTTP

**Problem**: Browser redirects to `http://` instead of `https://`

**Solution**:
- Clear browser cache
- Type `https://localhost:3000` explicitly
- Check that `USE_HTTPS=true` in `.env`

### OAuth Still Fails

**Problem**: "unauthorized_client" error persists

**Solutions**:
1. Verify redirect URI uses HTTPS:
   ```
   OAUTH_REDIRECT_URI=https://localhost:3000/auth-callback
   ```

2. Check server logs show:
   ```
   Redirect URI: https://localhost:3000/auth-callback
   ```

3. Contact OAuth administrator to verify client registration

### Certificate Expired

**Problem**: Certificate warning after 365 days

**Solution**: Regenerate certificates using the command in step 1.

## Advanced Configuration

### Custom Certificate Details

To create a certificate with more details:

```bash
openssl req -x509 -newkey rsa:2048 -nodes -sha256 \
  -days 365 \
  -keyout localhost-key.pem \
  -out localhost-cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### Longer Validity Period

For a 2-year certificate:

```bash
openssl req -x509 -newkey rsa:2048 -nodes -sha256 \
  -days 730 \
  -keyout localhost-key.pem \
  -out localhost-cert.pem \
  -subj "/CN=localhost"
```

### View Certificate Details

```bash
openssl x509 -in localhost-cert.pem -text -noout
```

### Verify Certificate and Key Match

```bash
# Get certificate modulus
openssl x509 -noout -modulus -in localhost-cert.pem | openssl md5

# Get key modulus
openssl rsa -noout -modulus -in localhost-key.pem | openssl md5

# The MD5 hashes should match
```

## Switching Between HTTP and HTTPS

### Enable HTTPS

1. Edit `.env`:
   ```
   USE_HTTPS=true
   OAUTH_REDIRECT_URI=https://localhost:3000/auth-callback
   OAUTH_POST_LOGOUT_REDIRECT_URI=https://localhost:3000/
   ```

2. Restart server
3. Access via `https://localhost:3000`

### Disable HTTPS (OAuth won't work)

1. Edit `.env`:
   ```
   USE_HTTPS=false
   OAUTH_REDIRECT_URI=http://localhost:3000/auth-callback
   OAUTH_POST_LOGOUT_REDIRECT_URI=http://localhost:3000/
   ```

2. Restart server
3. Access via `http://localhost:3000`

**Note**: OAuth authentication requires HTTPS and will fail with HTTP.

## Production Deployment

For production, replace self-signed certificates with proper ones:

### Option 1: Let's Encrypt (Free)

```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be in:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Option 2: Commercial Certificate

1. Purchase from Certificate Authority (DigiCert, GlobalSign, etc.)
2. Generate CSR (Certificate Signing Request)
3. Submit to CA for verification
4. Download and install certificate

### Update Production Configuration

```javascript
// server.js
const httpsOptions = {
  key: fs.readFileSync('/path/to/privkey.pem'),
  cert: fs.readFileSync('/path/to/fullchain.pem')
};
```

## Security Best Practices

### For Development

✅ Use self-signed certificates for localhost  
✅ Keep certificates out of version control (in `.gitignore`)  
✅ Regenerate certificates periodically  
✅ Only accept warnings for localhost  

### For Production

✅ Use certificates from trusted CA  
✅ Enable HTTPS redirect  
✅ Use HSTS (HTTP Strict Transport Security)  
✅ Keep certificates up to date  
✅ Monitor certificate expiration  

## File Security

The following files are automatically excluded from Git:

```
*.pem           # SSL certificates and keys
.env            # Environment configuration
```

**Never commit these files to version control!**

## Additional Resources

- [OpenSSL Documentation](https://www.openssl.org/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [MDN: Transport Layer Security](https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security)
- [OWASP TLS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)

## Summary

1. **Generate certificates**: `openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -keyout localhost-key.pem -out localhost-cert.pem -days 365`
2. **Enable HTTPS**: Set `USE_HTTPS=true` in `.env`
3. **Use HTTPS URLs**: Update OAuth redirect URIs to use `https://`
4. **Accept warning**: Click "Advanced" → "Proceed" in browser
5. **Start developing**: Application ready at `https://localhost:3000`

---

**Questions?** See README.md or OAUTH_TROUBLESHOOTING.md for more help.
