require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// OAuth Configuration
const oauthConfig = {
  authority: process.env.OAUTH_AUTHORITY,
  clientId: process.env.OAUTH_CLIENT_ID,
  redirectUri: process.env.OAUTH_REDIRECT_URI,
  postLogoutRedirectUri: process.env.OAUTH_POST_LOGOUT_REDIRECT_URI,
  scope: process.env.OAUTH_SCOPE,
  authorizationEndpoint: `${process.env.OAUTH_AUTHORITY}/connect/authorize`,
  tokenEndpoint: `${process.env.OAUTH_AUTHORITY}/connect/token`,
  userInfoEndpoint: `${process.env.OAUTH_AUTHORITY}/connect/userinfo`,
  endSessionEndpoint: `${process.env.OAUTH_AUTHORITY}/connect/endsession`
};

// API Configuration
const apiConfig = {
  baseUrl: process.env.API_BASE_URL
};

// Demo mode flag
const DEMO_MODE = process.env.DEMO_MODE === 'true';

// Middleware to check authentication
function requireAuth(req, res, next) {
  if (DEMO_MODE) {
    req.user = {
      name: 'Demo User',
      email: 'demo@example.com',
      sub: 'demo-user-id'
    };
    req.session.accessToken = 'demo-token';
    return next();
  }

  if (!req.session.user || !req.session.accessToken) {
    return res.redirect('/login');
  }
  req.user = req.session.user;
  next();
}

// Helper function to generate random string
function generateRandomString(length) {
  return crypto.randomBytes(length).toString('hex');
}

// Helper function to generate code verifier and challenge for PKCE
function generatePKCE() {
  const codeVerifier = generateRandomString(32);
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return { codeVerifier, codeChallenge };
}

// Routes

// Home page
app.get('/', (req, res) => {
  res.render('index', {
    user: req.session.user || null,
    appName: process.env.APP_NAME,
    demoMode: DEMO_MODE
  });
});

// Login page
app.get('/login', (req, res) => {
  if (DEMO_MODE) {
    req.session.user = {
      name: 'Demo User',
      email: 'demo@example.com',
      sub: 'demo-user-id'
    };
    req.session.accessToken = 'demo-token';
    return res.redirect('/dashboard');
  }

  res.render('login', {
    appName: process.env.APP_NAME
  });
});

// Initiate OAuth flow
app.get('/auth/login', (req, res) => {
  if (DEMO_MODE) {
    req.session.user = {
      name: 'Demo User',
      email: 'demo@example.com',
      sub: 'demo-user-id'
    };
    req.session.accessToken = 'demo-token';
    return res.redirect('/dashboard');
  }

  const state = generateRandomString(16);
  const nonce = generateRandomString(16);
  const { codeVerifier, codeChallenge } = generatePKCE();

  // Store state, nonce, and code verifier in session
  req.session.oauthState = state;
  req.session.oauthNonce = nonce;
  req.session.codeVerifier = codeVerifier;

  // Build authorization URL
  const authUrl = new URL(oauthConfig.authorizationEndpoint);
  authUrl.searchParams.append('client_id', oauthConfig.clientId);
  authUrl.searchParams.append('redirect_uri', oauthConfig.redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', oauthConfig.scope);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('nonce', nonce);
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');

  res.redirect(authUrl.toString());
});

// OAuth callback
app.get('/auth-callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description);
    return res.render('error', {
      appName: process.env.APP_NAME,
      error: 'Authentication failed',
      message: error_description || error
    });
  }

  // Verify state
  if (state !== req.session.oauthState) {
    return res.render('error', {
      appName: process.env.APP_NAME,
      error: 'Invalid state',
      message: 'State parameter mismatch. Possible CSRF attack.'
    });
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await axios.post(
      oauthConfig.tokenEndpoint,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: oauthConfig.redirectUri,
        client_id: oauthConfig.clientId,
        code_verifier: req.session.codeVerifier
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, id_token, refresh_token } = tokenResponse.data;

    // Get user info
    const userInfoResponse = await axios.get(oauthConfig.userInfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const userInfo = userInfoResponse.data;

    // Store user info and tokens in session
    req.session.user = {
      name: userInfo.name || userInfo.preferred_username || 'User',
      email: userInfo.email || '',
      sub: userInfo.sub
    };
    req.session.accessToken = access_token;
    req.session.idToken = id_token;
    req.session.refreshToken = refresh_token;

    // Clean up OAuth session data
    delete req.session.oauthState;
    delete req.session.oauthNonce;
    delete req.session.codeVerifier;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.render('error', {
      appName: process.env.APP_NAME,
      error: 'Authentication failed',
      message: 'Failed to exchange authorization code for tokens.'
    });
  }
});

// Dashboard (protected route)
app.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard', {
    user: req.user,
    appName: process.env.APP_NAME,
    demoMode: DEMO_MODE
  });
});

// Logout
app.get('/logout', (req, res) => {
  const idToken = req.session.idToken;
  
  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }

    if (DEMO_MODE || !idToken) {
      return res.redirect('/');
    }

    // Redirect to OAuth provider's logout endpoint
    const logoutUrl = new URL(oauthConfig.endSessionEndpoint);
    logoutUrl.searchParams.append('id_token_hint', idToken);
    logoutUrl.searchParams.append('post_logout_redirect_uri', oauthConfig.postLogoutRedirectUri);

    res.redirect(logoutUrl.toString());
  });
});

// API proxy endpoint (for authenticated API calls)
app.get('/api/*', requireAuth, async (req, res) => {
  if (DEMO_MODE) {
    return res.json({
      message: 'Demo mode - no real API data available',
      endpoint: req.params[0]
    });
  }

  try {
    const apiPath = req.params[0];
    const apiUrl = `${apiConfig.baseUrl}/api/${apiPath}`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${req.session.accessToken}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'API request failed',
      message: error.response?.data || error.message
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).render('error', {
    appName: process.env.APP_NAME,
    error: 'Server Error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    appName: process.env.APP_NAME,
    error: '404 - Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`${process.env.APP_NAME}`);
  console.log(`========================================`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Demo Mode: ${DEMO_MODE ? 'ENABLED' : 'DISABLED'}`);
  console.log(`========================================\n`);
});
