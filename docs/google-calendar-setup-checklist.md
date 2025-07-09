# Google Calendar API Setup Checklist for AI Sales Agent

## Prerequisites
- [ ] Active Google account with Google Calendar
- [ ] Access to Google Cloud Console (console.cloud.google.com)

## Step 1: Create Google Cloud Project

1. **Navigate to Google Cloud Console**
   - [ ] Go to https://console.cloud.google.com
   - [ ] Sign in with your Google account

2. **Create New Project**
   - [ ] Click "Select a project" dropdown → "New Project"
   - [ ] Name: "WhatsApp-AI-Calendar" (or similar)
   - [ ] Note the Project ID for later use
   - [ ] Click "Create"

## Step 2: Enable Google Calendar API

1. **Enable the API**
   - [ ] In Google Cloud Console, go to "APIs & Services" → "Library"
   - [ ] Search for "Google Calendar API"
   - [ ] Click on it and press "ENABLE"
   - [ ] Wait for activation (usually instant)

## Step 3: Choose Authentication Method

### Option A: Service Account (Recommended for Server-Side Apps)

1. **Create Service Account**
   - [ ] Go to "APIs & Services" → "Credentials"
   - [ ] Click "Create Credentials" → "Service Account"
   - [ ] Name: "whatsapp-ai-calendar-service"
   - [ ] Description: "Service account for WhatsApp AI calendar bookings"
   - [ ] Click "Create and Continue"

2. **Set Permissions**
   - [ ] Skip the optional "Grant this service account access" step
   - [ ] Click "Done"

3. **Generate Key**
   - [ ] Click on the created service account
   - [ ] Go to "Keys" tab
   - [ ] Click "Add Key" → "Create new key"
   - [ ] Choose JSON format
   - [ ] Download and securely store the JSON key file
   - [ ] ⚠️ **IMPORTANT**: Never commit this file to version control

4. **Note Service Account Email**
   - [ ] Copy the service account email (looks like: service-account@project-id.iam.gserviceaccount.com)
   - [ ] You'll need this for calendar sharing

### Option B: OAuth 2.0 (For User-Specific Access)

1. **Configure OAuth Consent Screen**
   - [ ] Go to "APIs & Services" → "OAuth consent screen"
   - [ ] Choose "External" (unless using Google Workspace)
   - [ ] Fill in required fields:
     - App name: "WhatsApp AI Calendar Integration"
     - User support email: Your email
     - Developer contact: Your email
   - [ ] Add scopes: `https://www.googleapis.com/auth/calendar`
   - [ ] Save and continue

2. **Create OAuth Credentials**
   - [ ] Go to "APIs & Services" → "Credentials"
   - [ ] Click "Create Credentials" → "OAuth client ID"
   - [ ] Application type: "Web application"
   - [ ] Add authorized redirect URIs for your app
   - [ ] Download the OAuth 2.0 credentials JSON

## Step 4: Calendar Configuration

1. **Identify Target Calendar**
   - [ ] Open Google Calendar (calendar.google.com)
   - [ ] Decide which calendar to use (primary or create new)
   - [ ] If creating new: Settings → Add calendar → Create new calendar
   - [ ] Name it something like "AI Bookings" or "Sales Calls"

2. **Share Calendar with Service Account** (If using Service Account)
   - [ ] In Google Calendar, click the 3 dots next to your calendar
   - [ ] Select "Settings and sharing"
   - [ ] Under "Share with specific people", click "Add people"
   - [ ] Add the service account email
   - [ ] Set permission to "Make changes to events"
   - [ ] Click "Send"

3. **Get Calendar ID**
   - [ ] In calendar settings, scroll to "Integrate calendar"
   - [ ] Copy the Calendar ID (looks like: your-email@gmail.com or long-string@group.calendar.google.com)
   - [ ] Save this for your application

## Step 5: Security Best Practices

### Environment Variables
- [ ] Store credentials in environment variables, never in code
- [ ] Add to `.env.local`:
  ```
  GOOGLE_CALENDAR_ID=your-calendar-id@gmail.com
  GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
  GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...} # Full JSON
  ```

### Permission Scoping
- [ ] Only request necessary scopes (calendar.events for booking)
- [ ] Use read-only scopes where possible
- [ ] Implement proper error handling for permission failures

### Key Management
- [ ] Rotate service account keys periodically
- [ ] Use Google Secret Manager for production
- [ ] Monitor API usage in Google Cloud Console
- [ ] Set up alerts for unusual activity

### API Quotas
- [ ] Check default quotas (usually 1,000,000 requests/day)
- [ ] Implement rate limiting in your application
- [ ] Add exponential backoff for retries

## Step 6: Testing Access

1. **Test Authentication**
   - [ ] Use Google's API Explorer to test access
   - [ ] Verify you can list calendars
   - [ ] Test creating a test event
   - [ ] Confirm event appears in Google Calendar

2. **Verify Permissions**
   - [ ] Can create events
   - [ ] Can update events
   - [ ] Can delete events
   - [ ] Can check availability/free-busy

## Step 7: Integration Preparation

### Required Information for Your App
- [ ] Project ID
- [ ] Calendar ID
- [ ] Service Account Email (if using)
- [ ] Service Account JSON Key (if using)
- [ ] OAuth Client ID & Secret (if using OAuth)

### Recommended Google Calendar Settings
- [ ] Set appropriate working hours in Google Calendar
- [ ] Configure time zone correctly
- [ ] Set up calendar notifications as needed
- [ ] Consider creating event types/colors for AI bookings

## Next Steps

Once all items are checked:
1. Store credentials securely in your application
2. Install Google Calendar API client library: `npm install googleapis`
3. Implement calendar integration in your WhatsApp AI system
4. Test with sandbox/test calendar first
5. Deploy to production with monitoring

## Troubleshooting Checklist

If issues arise:
- [ ] Verify API is enabled in Google Cloud Console
- [ ] Check service account has calendar access
- [ ] Confirm calendar ID is correct
- [ ] Verify credentials JSON is properly formatted
- [ ] Check API quotas haven't been exceeded
- [ ] Review error logs for specific permission issues

## Security Reminders

⚠️ **Never expose**:
- Service account private keys
- OAuth client secrets
- Calendar IDs in public repositories
- API keys in client-side code

✅ **Always**:
- Use environment variables
- Implement proper authentication
- Monitor API usage
- Keep credentials encrypted
- Follow principle of least privilege