# Alerte Equine Science - User Guide

## Quick Start Guide

Welcome to the Alerte Equine Science authentication system. This guide will help you get started with the application.

## Accessing the Application

The application runs on your local machine at:

```
http://localhost:3000
```

## Authentication Flow

### Step 1: Home Page

When you first visit the application, you will see the home page with the following options:

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

### Step 4: Dashboard Access

After successful authentication, you will be redirected back to the application dashboard where you can:

- View your authentication status
- See your user information (name, email, user ID)
- Test the API connection
- Access protected features

## Dashboard Features

### Authentication Status

The dashboard displays your current authentication information:

- **Status**: Shows whether you are authenticated
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

The application includes a demo mode for testing without Azure OAuth:

### Enabling Demo Mode

1. Open the `.env` file in the application directory
2. Set `DEMO_MODE=true`
3. Restart the server

### Using Demo Mode

When demo mode is enabled:

- You will be automatically logged in as "Demo User"
- No Azure authentication is required
- API calls will return mock data
- A blue banner will indicate that demo mode is active

### Disabling Demo Mode

1. Open the `.env` file
2. Set `DEMO_MODE=false`
3. Restart the server

## Troubleshooting

### Cannot Access the Application

**Problem**: The page doesn't load at http://localhost:3000

**Solutions**:
- Verify the server is running (check the terminal)
- Check that port 3000 is not being used by another application
- Try changing the PORT in the `.env` file

### Authentication Fails

**Problem**: Error message appears after Azure login

**Solutions**:
- Verify your Azure credentials are correct
- Check that the OAuth client ID is properly configured
- Ensure the redirect URI matches the registered callback URL
- Contact your administrator for access permissions

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

## Security Best Practices

### Session Security

- Sessions are stored server-side with encrypted cookies
- Access tokens are never exposed to the browser
- Sessions automatically expire after 24 hours

### Logout Properly

Always use the Logout button to end your session properly, especially on shared computers.

### Keep Credentials Private

Never share your Azure credentials or session information with others.

## Next Steps

This version focuses on authentication. Future versions will include:

- **Horse Management**: Add, edit, and track horses
- **Injury Recording**: Document and monitor injuries
- **Document Management**: Upload and organize documents
- **User Administration**: Manage users and permissions
- **Data Visualization**: View reports and analytics

## Support

For technical support or questions:

- Check the README.md file for detailed documentation
- Review the troubleshooting section above
- Contact your system administrator
- Open an issue on the GitHub repository

## System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for Azure authentication
- JavaScript enabled

## Privacy and Data

- Your authentication data is handled securely
- Access tokens are stored in encrypted server-side sessions
- No sensitive data is stored in browser cookies
- All communication with Azure uses secure HTTPS

---

**Version**: 1.0.0 (Authentication Focus)  
**Last Updated**: October 2025
