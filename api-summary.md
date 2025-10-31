# Alerte Equine API Summary

## Base URL
https://alerteequinedashboard.azurewebsites.net

## Authentication
The API uses OAuth 2.0 authentication with Azure AD.

## Key Endpoints

### Docs
- GET /api/Docs/all/{horseId}
- GET /api/Docs/doc/{parent}/{docId}
- POST /api/Docs/horsedocument
- POST /api/Docs/injurydocument
- DELETE /api/Docs/{parent}/{docId}

### Dropdowns
- GET /api/Dropdowns/gender
- GET /api/Dropdowns/status
- GET /api/Dropdowns/severity
- GET /api/Dropdowns/structure
- GET /api/Dropdowns/location
- GET /api/Dropdowns/mechanism
- GET /api/Dropdowns/userRole

### Horses
- GET /api/Horses
- GET /api/Horses/{id}
- POST /api/Horses
- PUT /api/Horses
- DELETE /api/Horses/{id}
- POST /api/Horses/import

### Injuries
- GET /api/Injuries/{horseId}
- GET /api/Injuries/injury/{id}
- POST /api/Injuries
- PUT /api/Injuries
- DELETE /api/Injuries/{id}

### Users
- GET /api/Users
- GET /api/Users/{id}
- POST /api/Users
- PUT /api/Users
- DELETE /api/Users/{id}

## Security Scheme
OAuth2 with implicit flow
Authorization URL: https://app-is-prod.azurewebsites.net/connect/authorize
Scopes: equineapi, openid, profile, email, offline_access
