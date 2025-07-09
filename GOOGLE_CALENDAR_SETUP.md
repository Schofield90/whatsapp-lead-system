# Google Calendar API Setup Guide

## Step 1: Create Google Cloud Project and Enable Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen first if prompted:
   - Choose "External" for user type
   - Fill in required fields (App name, User support email, Developer contact)
   - Add scopes: `https://www.googleapis.com/auth/calendar`
   - Add test users if needed
4. Create OAuth 2.0 Client ID:
   - Application type: "Web application"
   - Name: "WhatsApp Calendar Integration"
   - Authorized redirect URIs: 
     - `http://localhost:3000/api/auth/google/callback` (for development)
     - `https://your-domain.vercel.app/api/auth/google/callback` (for production)

## Step 3: Add Environment Variables

Add these to your `.env.local` file:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key
```

## Step 4: Add to Vercel Environment Variables

In your Vercel dashboard:
1. Go to your project settings
2. Add the same environment variables but update the redirect URI to your production domain

## Required Dependencies

The following packages will be installed automatically:
- `googleapis` - Google APIs client library
- `next-auth` - Authentication for Next.js
- `@next-auth/prisma-adapter` - Database adapter (optional)

## Security Notes

- Keep your client secret secure
- Use HTTPS in production
- Consider implementing refresh token rotation
- Regularly audit calendar permissions