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

// Risk mapping configuration
const riskMapping = {
  green: process.env.RISK_MAPPING_GREEN || 'Low Risk',
  yellow: process.env.RISK_MAPPING_YELLOW || 'Medium Risk',
  red: process.env.RISK_MAPPING_RED || 'High Risk',
  default: process.env.RISK_MAPPING_DEFAULT || 'Low Risk'
};

// Helper function to get risk label
function getRiskLabel(trafficLight) {
  const key = String(trafficLight || 'green').toLowerCase();
  return riskMapping[key] || riskMapping.default;
}

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

// Dashboard // Dashboard page
app.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard', {
    user: req.user,
    appName: process.env.APP_NAME,
    demoMode: DEMO_MODE,
    riskMapping: riskMapping
  });
});

// Horses page
app.get('/horses', requireAuth, (req, res) => {
  res.render('horses', {
    user: req.user,
    appName: process.env.APP_NAME,
    demoMode: DEMO_MODE,
    riskMapping: riskMapping
  });
});

// Sessions page
app.get('/sessions', requireAuth, (req, res) => {
  res.render('sessions', {
    user: req.user,
    appName: process.env.APP_NAME,
    demoMode: DEMO_MODE,
    riskMapping: riskMapping
  });
});

// Injuries page
app.get('/injuries', requireAuth, (req, res) => {
  res.render('injuries', {
    user: req.user,
    appName: process.env.APP_NAME,
    demoMode: DEMO_MODE,
    riskMapping: riskMapping
  });
});

// Performance page
app.get('/performance/:recordingId', requireAuth, (req, res) => {
  res.render('performance', {
    user: req.session.user,
    demoMode: DEMO_MODE,
    recordingId: req.params.recordingId,
    riskMapping: riskMapping
  });
});

// Session detail page
app.get('/session/:recordingId', requireAuth, (req, res) => {
  res.render('session-detail', {
    user: req.user,
    appName: process.env.APP_NAME,
    demoMode: DEMO_MODE,
    recordingId: req.params.recordingId
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
  const idToken = req.session?.idToken;
  
  // Destroy session
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.redirect('/');
      }

      // Clear cookie
      res.clearCookie('connect.sid');

      if (DEMO_MODE || !idToken || !oidcClient) {
        return res.redirect('/');
      }

      try {
        // Build logout URL
        const logoutUrl = oidcClient.endSessionUrl({
          id_token_hint: idToken,
          post_logout_redirect_uri: process.env.OAUTH_POST_LOGOUT_REDIRECT_URI
        });

        return res.redirect(logoutUrl);
      } catch (error) {
        console.error('Logout error:', error);
        return res.redirect('/');
      }
    });
  } else {
    res.redirect('/');
  }
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
    console.log(`[Sessions API] Request: stableId=${stableId}, days=${days}, type=${typeof days}`);
    
    // Determine API endpoint based on days parameter
    const apiEndpoint = days === 'all' 
      ? `${apiConfig.baseUrl}/api/Recordings/sessionMeta/stable/${stableId}`
      : `${apiConfig.baseUrl}/api/Recordings/stableId/${stableId}/${days}`;
    
    console.log(`[Sessions API] Using endpoint: ${apiEndpoint}`);

    // Fetch both recordings and horses to map names
    const [recordingsResponse, horsesResponse] = await Promise.all([
      axios.get(
        apiEndpoint,
        {
          headers: {
            'Authorization': `Bearer ${req.session.accessToken}`
          }
        }
      ),
      axios.get(
        `${apiConfig.baseUrl}/api/Horses/session/stableId/${stableId}`,
        {
          headers: {
            'Authorization': `Bearer ${req.session.accessToken}`
          }
        }
      )
    ]);

    const recordings = recordingsResponse.data;
    const horses = horsesResponse.data;

    console.log(`[Sessions API] Received ${Array.isArray(recordings) ? recordings.length : 'non-array'} recordings`);
    
    // Ensure we have arrays
    const recordingsArray = Array.isArray(recordings) ? recordings : [];
    const horsesArray = Array.isArray(horses) ? horses : [];

    // Create horse lookup map
    const horseMap = {};
    horsesArray.forEach(horse => {
      horseMap[horse.id] = horse.name;
    });

    // Add horse names to recordings
    const enrichedRecordings = recordingsArray.map(recording => ({
      ...recording,
      horseName: recording.horseId ? horseMap[recording.horseId] : null
    }));

    res.json(enrichedRecordings);
  } catch (error) {
    console.error('Sessions API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch sessions',
      message: error.response?.data || error.message
    });
  }
});

// Get unassigned sessions
app.get('/api/user/sessions/unassigned/:stableId', requireAuth, async (req, res) => {
  const { stableId } = req.params;
  
  if (DEMO_MODE) {
    const now = new Date();
    return res.json([
      {
        id: 'unrec1',
        horseId: null,
        horseName: null,
        startTime: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
        stopTime: new Date(now - 1 * 24 * 60 * 60 * 1000 + 2700000).toISOString(),
        rider: 'Unknown',
        track: 'Dirt',
        trafficLight: 'Green'
      }
    ]);
  }

  try {
    const response = await axios.get(
      `${apiConfig.baseUrl}/api/Recordings/unassigned/session/stable/${stableId}`,
      {
        headers: {
          'Authorization': `Bearer ${req.session.accessToken}`
        }
      }
    );
    const sessions = response.data;
    const sessionsArray = Array.isArray(sessions) ? sessions : [];
    console.log(`Unassigned sessions for stable ${stableId}:`, sessionsArray.length);
    res.json(sessionsArray);
  } catch (error) {
    console.error('Unassigned sessions API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch unassigned sessions',
      message: error.response?.data || error.message
    });
  }
});

// Get performance metrics (pdfStats)
app.get('/api/user/performance/:recordingId', requireAuth, async (req, res) => {
  const { recordingId } = req.params;
  
  if (DEMO_MODE) {
    return res.json({
      speedHeartRate: {
        speedHeartRateChart: [
          { speed: 10.5, heartRate: 120, distance: 100 },
          { speed: 12.0, heartRate: 150, distance: 200 },
          { speed: 13.3, heartRate: 180, distance: 300 },
          { speed: 14.5, heartRate: 200, distance: 400 }
        ],
        maxHR: 205,
        hR13Point3: 180,
        bpM200Speed: 14.5,
        maxBPMSpeed: 15.2
      },
      intervals: {},
      preWorkTime: 15.5,
      preWorkoutDistance: { distance: 500 }
    });
  }

  try {
    // Fetch performance data
    const perfResponse = await axios.get(
      `${apiConfig.baseUrl}/api/Recordings/pdfStats/${recordingId}`,
      {
        headers: {
          'Authorization': `Bearer ${req.session.accessToken}`
        }
      }
    );

    const perfData = perfResponse.data;

    // Fetch session metadata to get horse info
    try {
      const sessionResponse = await axios.get(
        `${apiConfig.baseUrl}/api/Recordings/sessionMeta/recording/${recordingId}`,
        {
          headers: {
            'Authorization': `Bearer ${req.session.accessToken}`
          }
        }
      );

      const session = sessionResponse.data;

      // If session has horseId but no horseName, fetch it
      console.log('Session data:', { horseId: session.horseId, horseName: session.horseName });
      
      if (session.horseId && !session.horseName) {
        try {
          console.log(`Fetching horse name for horseId: ${session.horseId}`);
          const horseResponse = await axios.get(
            `${apiConfig.baseUrl}/api/Horses/${session.horseId}`,
            {
              headers: {
                'Authorization': `Bearer ${req.session.accessToken}`
              }
            }
          );
          session.horseName = horseResponse.data.name;
          console.log(`Horse name fetched: ${session.horseName}`);
        } catch (horseError) {
          console.error('Failed to fetch horse name:', horseError.message);
          session.horseName = 'Unknown';
        }
      } else if (!session.horseId) {
        console.log('No horseId in session data');
        session.horseName = 'Unknown Horse';
      }

      // Combine performance data with session info
      res.json({
        ...perfData,
        sessionInfo: session
      });
    } catch (sessionError) {
      console.error('Failed to fetch session info:', sessionError.message);
      // Return performance data without session info
      res.json(perfData);
    }
  } catch (error) {
    console.error('Performance metrics API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch performance metrics',
      message: error.response?.data || error.message
    });
  }
});

// Get session detail
app.get('/api/user/session/:recordingId', requireAuth, async (req, res) => {
  const { recordingId } = req.params;
  
  if (DEMO_MODE) {
    return res.json({
      id: recordingId,
      horseId: '1',
      horseName: 'Thunder',
      startTime: '2025-10-29T10:00:00',
      stopTime: '2025-10-29T11:00:00',
      rider: 'John Smith',
      track: 'Dirt',
      trafficLight: 'Green',
      duration: 3600
    });
  }

  try {
    const response = await axios.get(
      `${apiConfig.baseUrl}/api/Recordings/sessionMeta/recording/${recordingId}`,
      {
        headers: {
          'Authorization': `Bearer ${req.session.accessToken}`
        }
      }
    );
    
    const session = response.data;
    
    // If session has horseId but no horseName, fetch it
    if (session.horseId && !session.horseName) {
      try {
        const horseResponse = await axios.get(
          `${apiConfig.baseUrl}/api/Horses/${session.horseId}`,
          {
            headers: {
              'Authorization': `Bearer ${req.session.accessToken}`
            }
          }
        );
        session.horseName = horseResponse.data.name;
      } catch (horseError) {
        console.error('Failed to fetch horse name:', horseError.message);
        session.horseName = 'Unknown';
      }
    }
    
    res.json(session);
  } catch (error) {
    console.error('Session detail API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch session detail',
      message: error.response?.data || error.message
    });
  }
});

// Assign horse to session
app.post('/api/user/sessions/assign/:stableId/:recordingId/:horseId', requireAuth, async (req, res) => {
  const { stableId, recordingId, horseId } = req.params;
  
  if (DEMO_MODE) {
    return res.json({ success: true, message: 'Demo mode - session not actually assigned' });
  }

  try {
    const response = await axios.post(
      `${apiConfig.baseUrl}/api/Recordings/reassign/${stableId}/${recordingId}/${horseId}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${req.session.accessToken}`
        }
      }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Assign session error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to assign session',
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
    // Just fetch horses - duration calculation was causing timeouts
    const horsesResponse = await axios.get(
      `${apiConfig.baseUrl}/api/Horses/session/stableId/${stableId}`,
      {
        headers: {
          'Authorization': `Bearer ${req.session.accessToken}`
        }
      }
    );

    const horses = horsesResponse.data;
    
    // Return horses directly without duration calculation to avoid timeouts
    res.json(Array.isArray(horses) ? horses : []);
  } catch (error) {
    console.error('Horses API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch horses',
      message: error.response?.data || error.message
    });
  }
});

// Dashboard API
app.get('/api/user/dashboard/:stableId', requireAuth, async (req, res) => {
  try {
    const { stableId } = req.params;
    const accessToken = req.session.accessToken;

    if (DEMO_MODE) {
      // Demo data
      return res.json({
        totalHorses: 12,
        activeHorses: 10,
        recentSessions: 8,
        injuryAlerts: {
          high: 2,
          medium: 3,
          low: 5
        },
        recentSessionsList: [
          { id: 1, horseName: 'Thunder', horseId: '1', startTime: new Date().toISOString(), injuryLevel: 'Green', duration: 60 },
          { id: 2, horseName: 'Lightning', horseId: '2', startTime: new Date(Date.now() - 86400000).toISOString(), injuryLevel: 'Yellow', duration: 75 }
        ]
      });
    }

    // Fetch horses and sessions in parallel
    const [horsesResponse, sessionsResponse] = await Promise.all([
      axios.get(`${apiConfig.baseUrl}/api/Horses/session/stableId/${stableId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }),
      axios.get(`${apiConfig.baseUrl}/api/Recordings/stableId/${stableId}/7`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
    ]);

    const horses = horsesResponse.data;
    const sessions = sessionsResponse.data;

    // Calculate metrics
    const totalHorses = horses.length;
    const activeHorses = horses.filter(h => String(h.status) === 'Active').length;
    
    // Get sessions from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSessions = sessions.filter(s => new Date(s.startTime) > sevenDaysAgo);
    
    // Count injury alerts
    const injuryAlerts = {
      high: horses.filter(h => String(h.traffic) === 'Red').length,
      medium: horses.filter(h => String(h.traffic) === 'Yellow').length,
      low: horses.filter(h => String(h.traffic) === 'Green').length
    };

    // Get recent sessions with horse names
    const horseMap = {};
    horses.forEach(h => horseMap[h.id] = h.name);
    
    const recentSessionsList = recentSessions
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        horseName: horseMap[s.horseId] || 'Unknown',
        horseId: s.horseId,
        startTime: s.startTime,
        injuryLevel: String(s.trafficLight || s.injuryLevel || 'Green'),
        duration: s.stopTime ? Math.floor((new Date(s.stopTime) - new Date(s.startTime)) / 60000) : 0
      }));

    res.json({
      totalHorses,
      activeHorses,
      recentSessions: recentSessions.length,
      injuryAlerts,
      recentSessionsList
    });
  } catch (error) {
    console.error('Dashboard API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

// Get status dropdown values
app.get('/api/user/dropdowns/status', requireAuth, async (req, res) => {
  if (DEMO_MODE) {
    return res.json(['Active', 'Inactive', 'Retired', 'Training']);
  }

  try {
    const response = await axios.get(`${apiConfig.baseUrl}/api/Dropdowns/status`, {
      headers: {
        'Authorization': `Bearer ${req.session.accessToken}`
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Status dropdown API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch status values',
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
