# Alerte Equine Science - User Guide

## Quick Start Guide

Welcome to the Alerte Equine Science authentication system. This guide will help you get started with the application.

## Important: HTTPS and Security Warnings

This application uses HTTPS (secure connection) for local development, which is required by the Azure OAuth authentication system. Because we use a self-signed certificate for local development, your browser will show a security warning the first time you visit the site.

**This is completely normal and expected for local development.**

## Accessing the Application

The application runs on your local machine at:

```
https://localhost:3000
```

Note the **https://** prefix - this is important!

## First-Time Setup

### Step 1: Accept the Security Certificate

When you first visit `https://localhost:3000`, your browser will show a security warning. Here's how to proceed safely:

#### Google Chrome
1. You'll see "Your connection is not private"
2. Click **"Advanced"**
3. Click **"Proceed to localhost (unsafe)"**
4. The application will load

#### Mozilla Firefox
1. You'll see "Warning: Potential Security Risk Ahead"
2. Click **"Advanced"**
3. Click **"Accept the Risk and Continue"**
4. The application will load

#### Safari
1. You'll see "This Connection Is Not Private"
2. Click **"Show Details"**
3. Click **"visit this website"**
4. Enter your Mac password if prompted
5. Click **"Visit Website"**
6. The application will load

#### Microsoft Edge
1. You'll see "Your connection isn't private"
2. Click **"Advanced"**
3. Click **"Continue to localhost (unsafe)"**
4. The application will load

**Why is this safe?**
- This warning appears because the SSL certificate is self-signed
- For local development on your own computer, this is perfectly safe
- The connection is still encrypted
- In production, a proper certificate from a trusted authority would be used

## Authentication Flow

### Step 1: Home Page

After accepting the certificate, you'll see the home page with:

- **Login** button in the header
- **Get Started** button in the main content area

Both buttons will take you to the login page.

### Step 2: Login Page

On the login page, you will see:

- Application title and branding
- A description explaining that you need to sign in with your Azure account
- **Sign in with Azure** button

Click the "Sign in with Azure" button to begin the authentication process.

### Step 3: Azure Authentication

After clicking the button, you will be redirected to the Azure OAuth authentication service where you will:

1. Enter your Azure credentials (username and password)
2. Grant permissions to the application (if prompted)
3. Complete any multi-factor authentication if required

**Important**: The authentication happens over HTTPS, ensuring your credentials are secure.

### Step 4: Dashboard Access

After successful authentication, you will be redirected back to the application dashboard where you can:

- View your authentication status
- See your user information (name, email, user ID)
- Test the API connection
- Access protected features

## Dashboard Features

### Authentication Status

The dashboard displays your current authentication information:

- **Status**: Shows whether you are authenticated (✓ Authenticated)
- **User**: Your display name
- **Email**: Your email address
- **User ID**: Your unique identifier

### API Integration

The dashboard includes an API testing feature:

1. Click the **Test API** button
2. The application will make a test call to the Alerte Equine API
3. Results will be displayed below the button

This feature verifies that:
- Your access token is valid
- The API connection is working
- You have the necessary permissions

### Navigation

From the dashboard, you can:

- Click **Home** to return to the home page
- Click **Logout** to sign out and end your session

## Logging Out

To log out of the application:

1. Click the **Logout** button in the header
2. Your session will be destroyed
3. You will be redirected to the Azure logout page
4. After logout, you will be returned to the home page

## Demo Mode

The application includes a demo mode for testing without Azure OAuth. This is useful for:
- Testing the user interface without authentication
- Demonstrating the application
- Development and debugging

### Enabling Demo Mode

**Note**: This requires access to the application configuration files.

1. Open the `.env` file in the application directory
2. Find the line `DEMO_MODE=false`
3. Change it to `DEMO_MODE=true`
4. Save the file
5. Restart the server

### Using Demo Mode

When demo mode is enabled:

- You will be automatically logged in as "Demo User"
- No Azure authentication is required
- API calls will return mock data
- A blue information banner will indicate that demo mode is active

### Disabling Demo Mode

1. Open the `.env` file
2. Change `DEMO_MODE=true` back to `DEMO_MODE=false`
3. Save the file
4. Restart the server

## Troubleshooting

### Cannot Access the Application

**Problem**: The page doesn't load at https://localhost:3000

**Solutions**:
- Verify the server is running (check the terminal/command prompt)
- Make sure you're using **https://** not http://
- Check that port 3000 is not being used by another application
- Try changing the PORT in the `.env` file

### Security Warning Won't Go Away

**Problem**: Browser keeps showing security warning

**Solutions**:
- Make sure you clicked "Advanced" and then "Proceed" (or equivalent)
- Try a different browser
- Clear your browser cache and try again
- Make sure the SSL certificates were generated correctly

### Authentication Fails

**Problem**: Error message appears after Azure login

**Solutions**:
- Verify your Azure credentials are correct
- Check that you're using HTTPS (not HTTP)
- Ensure the OAuth client is properly configured
- Contact your administrator for access permissions
- Check the `OAUTH_TROUBLESHOOTING.md` file for detailed help

### Session Expired

**Problem**: You are logged out unexpectedly

**Solutions**:
- Sessions expire after 24 hours of inactivity
- Simply log in again to create a new session
- Your data is preserved and will be available after re-authentication

### API Test Fails

**Problem**: The API test button returns an error

**Solutions**:
- Verify your access token has the required scopes
- Check that the API base URL is correct
- Ensure the API service is available
- Try logging out and logging in again to refresh your token

### HTTPS Not Working

**Problem**: Server won't start with HTTPS

**Solutions**:
- Make sure SSL certificates are generated (see README.md)
- Check that `USE_HTTPS=true` in the `.env` file
- Verify the certificate files exist: `localhost-cert.pem` and `localhost-key.pem`

## Security Best Practices

### Session Security

- Sessions are stored server-side with encrypted cookies
- Access tokens are never exposed to the browser
- Sessions automatically expire after 24 hours
- All communication uses HTTPS encryption

### Logout Properly

Always use the Logout button to end your session properly, especially on shared computers.

### Keep Credentials Private

Never share your Azure credentials or session information with others.

### Browser Security

- Keep your browser up to date
- Don't ignore security warnings on public websites (only accept for localhost development)
- Use a modern browser with good security features

## Understanding HTTPS for Local Development

### What is HTTPS?

HTTPS (Hypertext Transfer Protocol Secure) is the secure version of HTTP. It encrypts all communication between your browser and the server.

### Why Use HTTPS Locally?

- The Azure OAuth provider requires HTTPS for security
- It ensures your login credentials are encrypted
- It matches production environment behavior
- It's a best practice for modern web development

### Self-Signed vs. Trusted Certificates

**Self-Signed Certificate** (what we use locally):
- Generated on your computer
- Not verified by a trusted authority
- Causes browser warnings
- Perfect for local development
- Free

**Trusted Certificate** (used in production):
- Issued by a Certificate Authority (CA)
- Verified and trusted by browsers
- No browser warnings
- Required for public websites
- Usually costs money (or free with Let's Encrypt)

## Next Steps

This version focuses on authentication. Future versions will include:

- **Horse Management**: Add, edit, and track horses
- **Injury Recording**: Document and monitor injuries
- **Document Management**: Upload and organize documents
- **User Administration**: Manage users and permissions
- **Data Visualization**: View reports and analytics

## Support

For technical support or questions:

- Check the README.md file for detailed technical documentation
- Review the troubleshooting section above
- See OAUTH_TROUBLESHOOTING.md for authentication issues
- Contact your system administrator
- Open an issue on the GitHub repository

## System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Ability to accept self-signed certificates for localhost
- Internet connection for Azure authentication

## Privacy and Data

- Your authentication data is handled securely over HTTPS
- Access tokens are stored in encrypted server-side sessions
- No sensitive data is stored in browser cookies
- All communication with Azure uses secure HTTPS
- Self-signed certificate is only used for local development

## Tips for Best Experience

1. **Bookmark the URL**: Save `https://localhost:3000` as a bookmark
2. **Use Modern Browser**: Chrome, Firefox, or Edge work best
3. **Accept Certificate Once**: You only need to accept the security warning once per browser
4. **Keep Server Running**: Don't close the terminal/command prompt while using the app
5. **Logout When Done**: Always logout when finished, especially on shared computers

---

**Version**: 1.0.0 (Authentication Focus with HTTPS)  
**Last Updated**: October 2025  
**Security**: HTTPS Enabled with Self-Signed Certificate
