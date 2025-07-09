# Google Cloud Setup Guide for Calendar Integration

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create a New Project**
   - Click the project dropdown at the top
   - Click "New Project"
   - Name: `WhatsApp Calendar Integration`
   - Click "Create"

## Step 2: Enable Google Calendar API

1. **Navigate to APIs & Services**
   - In the left sidebar, click "APIs & Services" → "Library"
   
2. **Search for Calendar API**
   - Search for "Google Calendar API"
   - Click on "Google Calendar API"
   - Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen**
   - In the left sidebar, click "APIs & Services" → "OAuth consent screen"

2. **Choose User Type**
   - Select "External" (unless you have a Google Workspace account)
   - Click "Create"

3. **Fill Required Information**
   - **App name**: `WhatsApp AI Calendar Integration`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
   - Click "Save and Continue"

4. **Add Scopes**
   - Click "Add or Remove Scopes"
   - Search for and add: `https://www.googleapis.com/auth/calendar`
   - Click "Update" then "Save and Continue"

5. **Add Test Users** (if needed)
   - Add your email address as a test user
   - Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. **Go to Credentials**
   - In the left sidebar, click "APIs & Services" → "Credentials"

2. **Create OAuth 2.0 Client ID**
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: `WhatsApp AI Calendar`

3. **Configure Redirect URIs**
   - **Authorized redirect URIs**:
     - Development: `http://localhost:3000/api/auth/google/callback`
     - Production: `https://your-vercel-app.vercel.app/api/auth/google/callback`
   - Click "Create"

4. **Save Your Credentials**
   - Copy the **Client ID** and **Client Secret**
   - You'll need these for your environment variables

## Step 5: Environment Variables Setup

### Local Development (.env.local)
```env
# Google Calendar API
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key_here
```

### Production (Vercel)
1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add these variables:
   - `GOOGLE_CLIENT_ID`: Your Google Client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google Client Secret
   - `GOOGLE_REDIRECT_URI`: `https://your-app.vercel.app/api/auth/google/callback`
   - `NEXTAUTH_URL`: `https://your-app.vercel.app`
   - `NEXTAUTH_SECRET`: A random secret key

## Step 6: Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

## Step 7: Update Google Cloud for Production

When deploying to production:

1. **Update OAuth Redirect URIs**
   - Go back to Google Cloud Console → Credentials
   - Edit your OAuth 2.0 Client ID
   - Add your production redirect URI
   - Remove localhost URI for security

2. **Publish OAuth Consent Screen** (if needed)
   - Go to OAuth consent screen
   - Click "Publish App" if you want public access
   - Otherwise, keep it in testing mode and add users manually

## Step 8: Test the Setup

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Visit the setup page**
   - Go to `http://localhost:3000/calendar-setup`
   - Click "Connect Google Calendar"
   - Complete the OAuth flow

3. **Verify connection**
   - You should see "Google Calendar Connected!" message
   - Check your Supabase database for stored tokens

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Double-check your redirect URIs in Google Cloud Console
   - Ensure they match exactly (including http/https)

2. **"access_denied" error**
   - Make sure you've added the correct Calendar API scope
   - Check that the user is authorized (add as test user if needed)

3. **"invalid_client" error**
   - Verify your Client ID and Secret are correct
   - Check that they're properly set in environment variables

4. **Tokens not saving**
   - Ensure your Supabase database has the `google_tokens` table
   - Run the SQL schema from `supabase/calendar-schema.sql`

### Debug Steps

1. **Check environment variables**
   ```bash
   echo $GOOGLE_CLIENT_ID
   echo $GOOGLE_CLIENT_SECRET
   ```

2. **Verify database connection**
   - Check Supabase dashboard
   - Ensure `google_tokens` table exists

3. **Test API endpoints**
   - Visit `/api/calendar/status` to check connection
   - Check browser console for errors

## Security Notes

- **Never commit credentials to Git**
- **Use environment variables for all secrets**
- **Regularly rotate OAuth tokens**
- **Enable 2FA on your Google account**
- **Monitor API usage in Google Cloud Console**

## Support

If you encounter issues:
1. Check the Google Cloud Console logs
2. Review the Next.js application logs
3. Verify all environment variables are set correctly
4. Test with a fresh OAuth flow

Your Google Calendar integration should now be ready! 🎉