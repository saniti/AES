# Alerte Equine Science

A Node.js web application for equine health and injury tracking with Azure OAuth authentication.

## Features

This version focuses on **authentication** and includes the following capabilities:

- **Azure OAuth 2.0 Authentication** with PKCE (Proof Key for Code Exchange) for enhanced security
- **HTTPS Support** for secure local development (required by OAuth provider)
- **Secure Session Management** with encrypted cookies
- **Protected Routes** requiring authentication
- **API Integration** ready for the Alerte Equine Dashboard API
- **Demo Mode** for testing without OAuth or API access
- **Responsive Design** that works on desktop and mobile devices

## Prerequisites

- **Node.js** (version 14 or higher)
- **npm** or **pnpm** package manager
- **OpenSSL** (for generating SSL certificates)
- Access to Azure OAuth service (or use demo mode)

## Installation

1. Clone the repository and navigate to the develop branch:

```bash
git clone https://github.com/saniti/AES.git
cd AES
git checkout develop
```

2. Install dependencies:

```bash
npm install
```

3. Generate SSL certificates for HTTPS (required for OAuth):

```bash
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' -keyout localhost-key.pem -out localhost-cert.pem -days 365
```

This creates two files:
- `localhost-key.pem` - Private key
- `localhost-cert.pem` - Self-signed certificate

4. Configure environment variables:

The `.env` file is already configured with the correct settings. No changes needed unless you want to customize the configuration.

## Configuration

The application uses the following environment variables (configured in `.env`):

### Application Settings
- `APP_NAME`: Application name (default: "Alerte Equine Science")
- `PORT`: Server port (default: 3000)

### API Configuration
- `API_BASE_URL`: Base URL for the Alerte Equine API

### OAuth Configuration
- `OAUTH_AUTHORITY`: OAuth authority URL
- `OAUTH_CLIENT_ID`: OAuth client ID
- `OAUTH_REDIRECT_URI`: Callback URL after authentication (HTTPS required)
- `OAUTH_POST_LOGOUT_REDIRECT_URI`: Redirect URL after logout (HTTPS required)
- `OAUTH_SCOPE`: OAuth scopes (space-separated)

### HTTPS Configuration
- `USE_HTTPS`: Set to `true` to enable HTTPS (required for OAuth)

### Demo Mode
- `DEMO_MODE`: Set to `true` to bypass OAuth and use mock data (default: false)

### Security
- `SESSION_SECRET`: Secret key for session encryption (change in production)

## Running the Application

### Production Mode with HTTPS (Recommended)

Start the server with HTTPS enabled:

```bash
npm start
```

The application will be available at `https://localhost:3000`.

**Important**: Your browser will show a security warning because the certificate is self-signed. This is normal for local development.

#### Accepting the Self-Signed Certificate

**Chrome:**
1. Click "Advanced"
2. Click "Proceed to localhost (unsafe)"

**Firefox:**
1. Click "Advanced"
2. Click "Accept the Risk and Continue"

**Safari:**
1. Click "Show Details"
2. Click "visit this website"

**Edge:**
1. Click "Advanced"
2. Click "Continue to localhost (unsafe)"

### Development Mode with Auto-Reload

Start the server with auto-reload on file changes:

```bash
npm run dev
```

### Running without HTTPS (Not Recommended)

If you need to run without HTTPS (OAuth will not work):

1. Edit `.env` and set `USE_HTTPS=false`
2. Update `OAUTH_REDIRECT_URI` to use `http://` instead of `https://`
3. Restart the server

**Note**: The OAuth provider requires HTTPS, so authentication will fail without it.

## Usage

### Normal Mode (OAuth Authentication)

1. Navigate to `https://localhost:3000`
2. Accept the self-signed certificate warning
3. Click "Login" or "Get Started"
4. You will be redirected to Azure OAuth login
5. After successful authentication, you will be redirected to the dashboard
6. The dashboard displays your authentication status and allows API testing

### Demo Mode

To test the application without OAuth:

1. Set `DEMO_MODE=true` in your `.env` file
2. Restart the server
3. Navigate to `https://localhost:3000`
4. Click "Login" - you will be automatically logged in as a demo user
5. Access the dashboard without OAuth authentication

## Application Structure

```
AES/
├── public/
│   └── css/
│       └── style.css              # Application styles
├── views/
│   ├── index.ejs                  # Home page
│   ├── login.ejs                  # Login page
│   ├── dashboard.ejs              # Dashboard (protected)
│   └── error.ejs                  # Error page
├── localhost-cert.pem             # SSL certificate (generated, not in repo)
├── localhost-key.pem              # SSL private key (generated, not in repo)
├── .env                           # Environment configuration (not in repo)
├── .env.example                   # Example environment configuration
├── .gitignore                     # Git ignore file
├── package.json                   # Node.js dependencies
├── server.js                      # Main application server
├── README.md                      # This file
├── USER_GUIDE.md                  # End-user guide
├── OAUTH_TROUBLESHOOTING.md       # OAuth troubleshooting guide
└── DEPLOYMENT_SUMMARY.md          # Deployment overview
```

## Routes

- `GET /` - Home page
- `GET /login` - Login page
- `GET /auth/login` - Initiate OAuth flow
- `GET /auth-callback` - OAuth callback handler
- `GET /dashboard` - Protected dashboard (requires authentication)
- `GET /logout` - Logout and end session
- `GET /api/*` - Proxy to Alerte Equine API (requires authentication)

## OAuth Flow

The application implements the OAuth 2.0 Authorization Code flow with PKCE:

1. User clicks "Sign in with Azure"
2. Application generates state, nonce, and PKCE parameters
3. User is redirected to Azure OAuth authorization endpoint (HTTPS)
4. User authenticates and grants permissions
5. Azure redirects back to `/auth-callback` with authorization code
6. Application exchanges code for access token using PKCE verifier
7. Application retrieves user information
8. User is logged in and redirected to dashboard

## API Integration

The application includes a proxy endpoint for making authenticated API calls:

```javascript
// Example: Get gender dropdown options
fetch('/api/Dropdowns/gender')
  .then(response => response.json())
  .then(data => console.log(data));
```

All API requests automatically include the OAuth access token in the Authorization header.

## Security Features

- **HTTPS/TLS** for encrypted communication
- **PKCE (Proof Key for Code Exchange)** for OAuth flow
- **State parameter** validation to prevent CSRF attacks
- **Secure session management** with HTTP-only cookies
- **Access token storage** in server-side sessions (not exposed to client)
- **Session secret** for encrypting session data
- **Self-signed certificates** for local development (use proper certificates in production)

## Troubleshooting

### SSL Certificate Warnings

**Problem**: Browser shows security warning about certificate

**Solution**: This is normal for self-signed certificates. Click "Advanced" and proceed to localhost. For production, use a proper SSL certificate from a trusted Certificate Authority.

### OAuth Authentication Fails

**Problem**: "unauthorized_client" error after Azure login

**Solutions**:
- Verify that HTTPS is enabled (`USE_HTTPS=true`)
- Check that `OAUTH_REDIRECT_URI` uses `https://` not `http://`
- Ensure SSL certificates are generated
- Verify the OAuth client is registered with `https://localhost:3000/auth-callback`
- See `OAUTH_TROUBLESHOOTING.md` for detailed troubleshooting steps

### API Calls Fail

**Problem**: API test button returns an error

**Solutions**:
- Verify that `API_BASE_URL` is correct
- Check that your access token has the required scopes
- Ensure the API service is available
- Try logging out and logging in again to refresh your token

### Port Already in Use

**Problem**: Error "EADDRINUSE: address already in use"

**Solutions**:
- Kill the process using port 3000: `lsof -ti:3000 | xargs kill -9`
- Change the `PORT` in your `.env` file to a different value

### Certificate Files Not Found

**Problem**: Server fails to start with "HTTPS certificates not found"

**Solution**: Generate SSL certificates using the command in the Installation section.

## Production Deployment

For production deployment, you will need to:

1. **Use Proper SSL Certificates**:
   - Obtain certificates from a trusted Certificate Authority (Let's Encrypt, DigiCert, etc.)
   - Replace `localhost-cert.pem` and `localhost-key.pem` with production certificates

2. **Update OAuth Configuration**:
   - Register a new OAuth client for the production domain
   - Update `OAUTH_REDIRECT_URI` to match production URL
   - Update `OAUTH_POST_LOGOUT_REDIRECT_URI` for production

3. **Security Enhancements**:
   - Generate a strong random `SESSION_SECRET`
   - Configure proper CORS settings
   - Add rate limiting for authentication endpoints
   - Use environment-specific configuration files

4. **Hosting Options**:
   - Azure App Service (recommended for Azure OAuth integration)
   - AWS Elastic Beanstalk
   - Heroku
   - DigitalOcean App Platform
   - Any Node.js hosting provider with HTTPS support

## Future Development

This version focuses on authentication. Future versions will include:

- Horse management (CRUD operations)
- Injury tracking and recording
- Document upload and management
- User administration
- Data visualization and reporting
- Full integration with all API endpoints

## Dependencies

- **Runtime**: Node.js 22.13.0
- **Framework**: Express.js 4.18.2
- **Template Engine**: EJS 3.1.9
- **Session Management**: express-session 1.17.3
- **HTTP Client**: axios 1.6.0
- **OAuth Client**: openid-client 5.6.1
- **Environment Config**: dotenv 16.3.1

## License

See LICENSE file for details.

## Support

For issues and questions:
- Review the troubleshooting sections in this README
- Check `USER_GUIDE.md` for usage instructions
- See `OAUTH_TROUBLESHOOTING.md` for OAuth-specific issues
- Open an issue on the GitHub repository

## Repository

- **GitHub**: https://github.com/saniti/AES
- **Branch**: develop
