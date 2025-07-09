#!/bin/bash

echo "🚀 Deploying Google Calendar Integration to Vercel"
echo "================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel if needed
echo "🔐 Logging into Vercel..."
vercel login

# Deploy the project
echo "🚀 Deploying to Vercel..."
vercel --prod

# Get the deployment URL
echo "🌐 Getting deployment URL..."
VERCEL_URL=$(vercel ls | grep whatsapp-lead-system | head -1 | awk '{print $2}')

if [[ -z "$VERCEL_URL" ]]; then
    echo "❌ Could not get Vercel URL. Please check your deployment."
    exit 1
fi

echo "✅ Deployed to: https://$VERCEL_URL"

# Set environment variables in Vercel
echo "⚙️  Setting up environment variables in Vercel..."

# Read current environment variables
GOOGLE_CLIENT_ID=$(grep "^GOOGLE_CLIENT_ID=" .env.local | cut -d'=' -f2)
GOOGLE_CLIENT_SECRET=$(grep "^GOOGLE_CLIENT_SECRET=" .env.local | cut -d'=' -f2)
NEXTAUTH_SECRET=$(grep "^NEXTAUTH_SECRET=" .env.local | cut -d'=' -f2)
SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d'=' -f2)
SUPABASE_ANON_KEY=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local | cut -d'=' -f2)
ANTHROPIC_API_KEY=$(grep "^ANTHROPIC_API_KEY=" .env.local | cut -d'=' -f2)
TWILIO_ACCOUNT_SID=$(grep "^TWILIO_ACCOUNT_SID=" .env.local | cut -d'=' -f2)
TWILIO_AUTH_TOKEN=$(grep "^TWILIO_AUTH_TOKEN=" .env.local | cut -d'=' -f2)
TWILIO_WHATSAPP_NUMBER=$(grep "^TWILIO_WHATSAPP_NUMBER=" .env.local | cut -d'=' -f2)

# Set environment variables in Vercel
echo "Setting NEXTAUTH_URL..."
vercel env add NEXTAUTH_URL production <<< "https://$VERCEL_URL"

echo "Setting NEXTAUTH_SECRET..."
if [[ "$NEXTAUTH_SECRET" != "your_nextauth_secret" ]]; then
    vercel env add NEXTAUTH_SECRET production <<< "$NEXTAUTH_SECRET"
else
    # Generate a random secret
    SECRET=$(openssl rand -base64 32)
    vercel env add NEXTAUTH_SECRET production <<< "$SECRET"
fi

echo "Setting GOOGLE_REDIRECT_URI..."
vercel env add GOOGLE_REDIRECT_URI production <<< "https://$VERCEL_URL/api/auth/google/callback"

# Set other environment variables if they exist
if [[ "$GOOGLE_CLIENT_ID" != "your_google_client_id" ]]; then
    echo "Setting GOOGLE_CLIENT_ID..."
    vercel env add GOOGLE_CLIENT_ID production <<< "$GOOGLE_CLIENT_ID"
fi

if [[ "$GOOGLE_CLIENT_SECRET" != "your_google_client_secret" ]]; then
    echo "Setting GOOGLE_CLIENT_SECRET..."
    vercel env add GOOGLE_CLIENT_SECRET production <<< "$GOOGLE_CLIENT_SECRET"
fi

if [[ "$SUPABASE_URL" != "your_supabase_url" ]]; then
    echo "Setting NEXT_PUBLIC_SUPABASE_URL..."
    vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "$SUPABASE_URL"
fi

if [[ "$SUPABASE_ANON_KEY" != "your_supabase_anon_key" ]]; then
    echo "Setting NEXT_PUBLIC_SUPABASE_ANON_KEY..."
    vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$SUPABASE_ANON_KEY"
fi

if [[ "$ANTHROPIC_API_KEY" != "your_anthropic_api_key" ]]; then
    echo "Setting ANTHROPIC_API_KEY..."
    vercel env add ANTHROPIC_API_KEY production <<< "$ANTHROPIC_API_KEY"
fi

if [[ "$TWILIO_ACCOUNT_SID" != "your_twilio_account_sid" ]]; then
    echo "Setting TWILIO_ACCOUNT_SID..."
    vercel env add TWILIO_ACCOUNT_SID production <<< "$TWILIO_ACCOUNT_SID"
fi

if [[ "$TWILIO_AUTH_TOKEN" != "your_twilio_auth_token" ]]; then
    echo "Setting TWILIO_AUTH_TOKEN..."
    vercel env add TWILIO_AUTH_TOKEN production <<< "$TWILIO_AUTH_TOKEN"
fi

if [[ "$TWILIO_WHATSAPP_NUMBER" != "your_twilio_whatsapp_number" ]]; then
    echo "Setting TWILIO_WHATSAPP_NUMBER..."
    vercel env add TWILIO_WHATSAPP_NUMBER production <<< "$TWILIO_WHATSAPP_NUMBER"
fi

echo ""
echo "✅ Environment variables set in Vercel!"
echo ""
echo "🎉 Your Google Calendar integration is now live!"
echo "📍 URL: https://$VERCEL_URL"
echo ""
echo "Next steps:"
echo "1. Visit https://$VERCEL_URL/calendar-setup to connect your Google Calendar"
echo "2. Update your Google Cloud Console OAuth settings with the production redirect URI:"
echo "   https://$VERCEL_URL/api/auth/google/callback"
echo "3. Test your WhatsApp AI with booking messages!"
echo ""
echo "🔧 Google Cloud Console setup:"
echo "1. Go to: https://console.cloud.google.com/"
echo "2. Select your project"
echo "3. Go to APIs & Services > Credentials"
echo "4. Edit your OAuth 2.0 Client ID"
echo "5. Add this redirect URI: https://$VERCEL_URL/api/auth/google/callback"