# Alerte Equine Science

A Node.js web application for equine health and injury tracking with Azure OAuth authentication.

## Features

This version focuses on **authentication** and includes the following capabilities:

- **Azure OAuth 2.0 Authentication** with PKCE (Proof Key for Code Exchange) for enhanced security
- **Session Management** with secure cookie handling
- **Protected Routes** requiring authentication
- **API Integration** ready for the Alerte Equine Dashboard API
- **Demo Mode** for testing without OAuth or API access
- **Responsive Design** that works on desktop and mobile devices

## Prerequisites

- **Node.js** (version 14 or higher)
- **npm** or **pnpm** package manager
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

Or using pnpm:

```bash
pnpm install
```

3. Configure environment variables:

Copy the `.env.example` file to `.env` and update the values as needed:

```bash
cp .env.example .env
```

The default configuration is already set up for the Alerte Equine Science project.

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
- `OAUTH_REDIRECT_URI`: Callback URL after authentication
- `OAUTH_POST_LOGOUT_REDIRECT_URI`: Redirect URL after logout
- `OAUTH_SCOPE`: OAuth scopes (space-separated)

### Demo Mode
- `DEMO_MODE`: Set to `true` to bypass OAuth and use mock data (default: false)

### Security
- `SESSION_SECRET`: Secret key for session encryption (change in production)

## Running the Application

### Development Mode

Start the server with auto-reload on file changes:

```bash
npm run dev
```

### Production Mode

Start the server:

```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Usage

### Normal Mode (OAuth Authentication)

1. Navigate to `http://localhost:3000`
2. Click "Login" or "Get Started"
3. You will be redirected to Azure OAuth login
4. After successful authentication, you will be redirected to the dashboard
5. The dashboard displays your authentication status and allows API testing

### Demo Mode

To test the application without OAuth:

1. Set `DEMO_MODE=true` in your `.env` file
2. Restart the server
3. Navigate to `http://localhost:3000`
4. Click "Login" - you will be automatically logged in as a demo user
5. Access the dashboard without OAuth authentication

## Application Structure

```
AES/
├── public/
│   └── css/
│       └── style.css          # Application styles
├── views/
│   ├── index.ejs              # Home page
│   ├── login.ejs              # Login page
│   ├── dashboard.ejs          # Dashboard (protected)
│   └── error.ejs              # Error page
├── .env                       # Environment configuration
├── .env.example               # Example environment configuration
├── .gitignore                 # Git ignore file
├── package.json               # Node.js dependencies
├── server.js                  # Main application server
└── README.md                  # This file
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
3. User is redirected to Azure OAuth authorization endpoint
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

- **PKCE (Proof Key for Code Exchange)** for OAuth flow
- **State parameter** validation to prevent CSRF attacks
- **Secure session management** with HTTP-only cookies
- **Access token storage** in server-side sessions (not exposed to client)
- **Session secret** for encrypting session data

## Future Development

This version focuses on authentication. Future versions will include:

- Horse management and tracking
- Injury recording and monitoring
- Document management
- User administration
- Data visualization and reporting
- Full integration with all API endpoints

## Troubleshooting

### OAuth Authentication Fails

- Verify that `OAUTH_CLIENT_ID` is correct
- Check that `OAUTH_REDIRECT_URI` matches the registered callback URL
- Ensure the OAuth authority is accessible

### API Calls Fail

- Verify that `API_BASE_URL` is correct
- Check that your access token has the required scopes
- Enable demo mode to test without API access

### Port Already in Use

Change the `PORT` in your `.env` file to a different value.

## License

See LICENSE file for details.

## Support

For issues and questions, please open an issue on the GitHub repository.
