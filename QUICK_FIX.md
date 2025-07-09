# 🚨 Quick Fix for SOP Creation Issue

## Problem Found
Your local `.env.local` file still has placeholder values like `your_supabase_url` instead of actual Supabase credentials.

## Solution

### Step 1: Update Local Environment Variables
Replace the content of your `.env.local` file with your actual Supabase credentials:

```env
# Supabase Configuration - Use your actual values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here  
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here

# Other variables (update as needed)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=+447450308627
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### Step 2: Find Your Supabase Credentials
Go to your Supabase project dashboard:
1. **Project URL**: Settings → API → Project URL
2. **Anon Key**: Settings → API → Project API keys → `anon` `public`
3. **Service Role Key**: Settings → API → Project API keys → `service_role` `secret`

### Step 3: Test the Fix
1. Update your `.env.local` file with real values
2. Restart your development server:
   ```bash
   npm run dev
   ```
3. Test the debug endpoint:
   ```bash
   curl http://localhost:3000/api/test-supabase
   ```
4. Try adding a SOP through the web interface at: http://localhost:3000/sops

### Step 4: Verify Deployment
Make sure your Vercel environment variables are also set correctly:
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Ensure all three Supabase variables are set with the correct values
3. Redeploy if needed

## Quick Test Commands

```bash
# 1. Test debug endpoint
curl http://localhost:3000/api/test-supabase

# 2. Test SOP creation (after updating env vars)
node test-sop-creation.js
```

## Expected Success Response
After fixing the environment variables, the debug endpoint should show:
- ✅ All clients connected successfully
- ✅ Table structure verified
- ✅ No error recommendations

The SOP creation should then work in both local development and production.