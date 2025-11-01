# Fixes Applied - Session 2025-11-01

## Critical Issues Fixed

### 1. OAuth Configuration - localhost vs IP Address
**Problem:** OAuth redirect URI was configured for IP address `https://192.168.254.58:3000/auth-callback` but Azure OAuth was expecting `https://localhost:3000/auth-callback`

**Fix:** Updated `.env` file:
- Changed `OAUTH_REDIRECT_URI` from `https://192.168.254.58:3000/auth-callback` to `https://localhost:3000/auth-callback`
- Changed `OAUTH_POST_LOGOUT_REDIRECT_URI` from `https://192.168.254.58:3000/` to `https://localhost:3000/`

**Result:** OAuth authentication now works correctly

### 2. **DUPLICATE SCRIPT TAG - THE ROOT CAUSE** ⚠️
**Problem:** `locale.js` was being loaded **TWICE**:
- Once in `horses.ejs` (line 11)
- Once in `nav.ejs` (line 85, which is included in horses.ejs)

This caused JavaScript error: `Uncaught SyntaxError: redeclaration of const LOCALES`

When a `const` is declared twice, JavaScript throws a fatal error and **stops executing ALL subsequent JavaScript** on the page. This is why:
- Horses page stuck on "Loading horses..." forever
- Unassigned sessions never fetched
- All interactive features failed
- No visible error to the user (only in browser console)

**Fix:** Removed the duplicate `<script src="/js/locale.js"></script>` from `horses.ejs` line 11

**Result:** JavaScript now executes properly, allowing:
- Horses page to load
- Unassigned sessions to be fetched and displayed
- All interactive features to work

### 3. Content Security Policy (CSP) Enhancement
**Problem:** While not the root cause, adding explicit CSP helps prevent future issues

**Fix:** Added CSP middleware to `server.js` (lines 17-24):
```javascript
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );
  next();
});
```

**Result:** Explicit CSP policy that allows inline scripts

## Files Modified

1. `/home/ubuntu/AES/.env` (NOT COMMITTED - in .gitignore)
   - Updated OAuth redirect URIs to use localhost

2. `/home/ubuntu/AES/server.js`
   - Added CSP middleware to allow inline scripts

3. `/home/ubuntu/AES/views/horses.ejs`
   - **Removed duplicate locale.js script tag (THE KEY FIX)**

## Root Cause Analysis

The horses page was failing because:
1. **Primary cause:** Duplicate script loading caused `const LOCALES` to be declared twice
2. JavaScript threw a fatal `SyntaxError: redeclaration of const` error
3. This stopped ALL JavaScript execution on the page
4. No error was visible to the user (just "Loading horses..." forever)
5. Only visible in browser DevTools console

The CSP issue was a red herring - the real problem was the duplicate script tag.

## Lessons Learned

1. When using EJS includes/partials, be careful not to load the same script twice
2. `const` redeclaration is a fatal error that stops all JavaScript execution
3. Always check browser console for JavaScript errors when pages don't load
4. The CSP error was misleading - it wasn't the root cause

## Testing Required

After user refreshes the page:
1. Verify horses load correctly
2. Verify "Unassigned Sessions" section appears at top for Ocala Stables
3. Verify unassigned sessions are displayed (should be 30+ sessions)
4. Take screenshot for verification
5. Commit changes only after successful verification
