require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const { Issuer, generators } = require('openid-client');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: USE_HTTPS, // Set to true when using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Configuration
const apiConfig = {
  baseUrl: process.env.API_BASE_URL
};

// Demo mode flag
const DEMO_MODE = process.env.DEMO_MODE === 'true';

// OAuth client - will be initialized asynchronously
let oidcClient = null;

// Initialize OIDC client
async function initializeOIDC() {
  try {
    const issuer = await Issuer.discover(process.env.OAUTH_AUTHORITY);
    console.log('Discovered issuer:', issuer.metadata.issuer);
    
    oidcClient = new issuer.Client({
      client_id: process.env.OAUTH_CLIENT_ID,
      redirect_uris: [process.env.OAUTH_REDIRECT_URI],
      response_types: ['code'],
      token_endpoint_auth_method: 'none' // Public client - no client secret
    });
    
    console.log('OIDC client initialized successfully');
    console.log('Redirect URI:', process.env.OAUTH_REDIRECT_URI);
  } catch (error) {
    console.error('Failed to initialize OIDC client:', error);
    if (!DEMO_MODE) {
      throw error;
    }
  }
}

// Initialize OIDC on startup (unless in demo mode)
if (!DEMO_MODE) {
  initializeOIDC().catch(err => {
    console.error('OIDC initialization failed:', err);
    process.exit(1);
  });
}

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
app.get('/auth/login', async (req, res) => {
  if (DEMO_MODE) {
    req.session.user = {
      name: 'Demo User',
      email: 'demo@example.com',
      sub: 'demo-user-id'
    };
    req.session.accessToken = 'demo-token';
    return res.redirect('/dashboard');
  }

  if (!oidcClient) {
    return res.render('error', {
      appName: process.env.APP_NAME,
      error: 'Configuration Error',
      message: 'OIDC client not initialized. Please try again later.'
    });
  }

  try {
    // Generate PKCE parameters
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);
    const state = generators.state();
    const nonce = generators.nonce();

    // Store in session
    req.session.codeVerifier = codeVerifier;
    req.session.oauthState = state;
    req.session.oauthNonce = nonce;

    // Build authorization URL
    const authUrl = oidcClient.authorizationUrl({
      scope: process.env.OAUTH_SCOPE,
      state: state,
      nonce: nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    console.log('Redirecting to:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating OAuth flow:', error);
    res.render('error', {
      appName: process.env.APP_NAME,
      error: 'Authentication Error',
      message: 'Failed to initiate authentication flow.'
    });
  }
});

// OAuth callback
app.get('/auth-callback', async (req, res) => {
  const params = oidcClient.callbackParams(req);
  
  // Handle OAuth errors
  if (params.error) {
    console.error('OAuth error:', params.error, params.error_description);
    return res.render('error', {
      appName: process.env.APP_NAME,
      error: 'Authentication failed',
      message: params.error_description || params.error
    });
  }

  // Verify state
  if (params.state !== req.session.oauthState) {
    return res.render('error', {
      appName: process.env.APP_NAME,
      error: 'Invalid state',
      message: 'State parameter mismatch. Possible CSRF attack.'
    });
  }

  try {
    console.log('Exchanging code for tokens...');
    
    // Exchange authorization code for tokens
    const tokenSet = await oidcClient.callback(
      process.env.OAUTH_REDIRECT_URI,
      params,
      {
        code_verifier: req.session.codeVerifier,
        state: req.session.oauthState,
        nonce: req.session.oauthNonce
      }
    );

    console.log('Token exchange successful');

    // Get user info
    const userInfo = await oidcClient.userinfo(tokenSet.access_token);
    console.log('User info retrieved:', userInfo.email);

    // Store user info and tokens in session
    req.session.user = {
      name: userInfo.name || userInfo.preferred_username || userInfo.email || 'User',
      email: userInfo.email || '',
      sub: userInfo.sub
    };
    req.session.accessToken = tokenSet.access_token;
    req.session.idToken = tokenSet.id_token;
    req.session.refreshToken = tokenSet.refresh_token;

    // Clean up OAuth session data
    delete req.session.oauthState;
    delete req.session.oauthNonce;
    delete req.session.codeVerifier;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Token exchange error:', error);
    res.render('error', {
      appName: process.env.APP_NAME,
      error: 'Authentication failed',
      message: error.message || 'Failed to exchange authorization code for tokens.'
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

// Horses page
app.get('/horses', requireAuth, (req, res) => {
  res.render('horses', {
    user: req.user,
    appName: process.env.APP_NAME,
    demoMode: DEMO_MODE
  });
});

// Sessions page
app.get('/sessions', requireAuth, (req, res) => {
  res.render('sessions', {
    user: req.user,
    appName: process.env.APP_NAME,
    demoMode: DEMO_MODE
  });
});

// Update horse
app.put('/api/user/horses/:horseId', requireAuth, async (req, res) => {
  const { horseId } = req.params;
  
  if (DEMO_MODE) {
    return res.json({ success: true, message: 'Demo mode - horse not actually updated' });
  }

  try {
    const response = await axios.put(
      `${apiConfig.baseUrl}/api/Horses`,
      { id: horseId, ...req.body },
      {
        headers: {
          'Authorization': `Bearer ${req.session.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Update horse error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to update horse',
      message: error.response?.data || error.message
    });
  }
});

// Logout
app.get('/logout', async (req, res) => {
  const idToken = req.session.idToken;
  
  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }

    if (DEMO_MODE || !idToken || !oidcClient) {
      return res.redirect('/');
    }

    try {
      // Build logout URL
      const logoutUrl = oidcClient.endSessionUrl({
        id_token_hint: idToken,
        post_logout_redirect_uri: process.env.OAUTH_POST_LOGOUT_REDIRECT_URI
      });

      res.redirect(logoutUrl);
    } catch (error) {
      console.error('Logout error:', error);
      res.redirect('/');
    }
  });
});

// Get sessions/recordings by stable with days filter
app.get('/api/user/sessions/:stableId/:days', requireAuth, async (req, res) => {
  const { stableId, days } = req.params;
  
  if (DEMO_MODE) {
    const now = new Date();
    return res.json([
      {
        id: 'rec1',
        horseId: '1',
        horseName: 'Thunder',
        startTime: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        stopTime: new Date(now - 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
        rider: 'John Smith',
        track: 'Dirt',
        trafficLight: 'Green'
      },
      {
        id: 'rec2',
        horseId: '2',
        horseName: 'Lightning',
        startTime: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
        stopTime: new Date(now - 5 * 24 * 60 * 60 * 1000 + 4500000).toISOString(),
        rider: 'Jane Doe',
        track: 'Turf',
        trafficLight: 'Yellow'
      }
    ]);
  }

  try {
    const response = await axios.get(
      `${apiConfig.baseUrl}/api/Recordings/stableId/${stableId}/${days}`,
      {
        headers: {
          'Authorization': `Bearer ${req.session.accessToken}`
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Sessions API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch sessions',
      message: error.response?.data || error.message
    });
  }
});

// Get horses by stable
app.get('/api/user/horses/:stableId', requireAuth, async (req, res) => {
  const { stableId } = req.params;
  
  if (DEMO_MODE) {
    return res.json([
      {
        id: '1',
        name: 'Thunder',
        dateOfBirth: '2018-03-15',
        gender: 'Gelding',
        status: 'Active',
        lastSession: '2025-10-30T14:30:00',
        traffic: 'Green',
        brand: 'TB123',
        stableId: stableId
      },
      {
        id: '2',
        name: 'Lightning',
        dateOfBirth: '2019-05-20',
        gender: 'Mare',
        status: 'Active',
        lastSession: '2025-10-29T10:15:00',
        traffic: 'Yellow',
        brand: 'TB456',
        stableId: stableId
      }
    ]);
  }

  try {
    const response = await axios.get(
      `${apiConfig.baseUrl}/api/Horses/session/stableId/${stableId}`,
      {
        headers: {
          'Authorization': `Bearer ${req.session.accessToken}`
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Horses API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch horses',
      message: error.response?.data || error.message
    });
  }
});

// Get user's stables
app.get('/api/user/stables', requireAuth, async (req, res) => {
  if (DEMO_MODE) {
    return res.json([
      { id: '1', name: 'Demo Stable 1', location: 'Sydney' },
      { id: '2', name: 'Demo Stable 2', location: 'Melbourne' }
    ]);
  }

  try {
    const response = await axios.get(`${apiConfig.baseUrl}/api/Stables`, {
      headers: {
        'Authorization': `Bearer ${req.session.accessToken}`
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Stables API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch stables',
      message: error.response?.data || error.message
    });
  }
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

// Start server with HTTPS or HTTP
if (USE_HTTPS) {
  const certPath = path.join(__dirname, 'localhost-cert.pem');
  const keyPath = path.join(__dirname, 'localhost-key.pem');
  
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    
    https.createServer(httpsOptions, app).listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`${process.env.APP_NAME}`);
      console.log(`========================================`);
      console.log(`Server running on https://localhost:${PORT}`);
      console.log(`Demo Mode: ${DEMO_MODE ? 'ENABLED' : 'DISABLED'}`);
      console.log(`HTTPS: ENABLED`);
      console.log(`========================================\n`);
    });
  } else {
    console.error('HTTPS certificates not found. Please run:');
    console.error('openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj \'/CN=localhost\' -keyout localhost-key.pem -out localhost-cert.pem -days 365');
    process.exit(1);
  }
} else {
  http.createServer(app).listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`${process.env.APP_NAME}`);
    console.log(`========================================`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Demo Mode: ${DEMO_MODE ? 'ENABLED' : 'DISABLED'}`);
    console.log(`HTTPS: DISABLED`);
    console.log(`========================================\n`);
  });
}
