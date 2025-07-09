#!/bin/bash

echo "🚀 Setting up Google Calendar Integration"
echo "========================================"

# Function to check if a command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        return 1
    fi
    return 0
}

# Function to prompt for input
prompt_for_value() {
    local var_name=$1
    local description=$2
    local current_value=$(grep "^$var_name=" .env.local | cut -d'=' -f2)
    
    if [[ "$current_value" != "your_"* && "$current_value" != "" ]]; then
        echo "✅ $var_name is already set"
        return 0
    fi
    
    echo "📝 Please enter your $description:"
    read -r value
    
    if [[ -z "$value" ]]; then
        echo "❌ Value cannot be empty"
        return 1
    fi
    
    # Update the .env.local file
    sed -i '' "s/^$var_name=.*/$var_name=$value/" .env.local
    echo "✅ $var_name updated"
    return 0
}

echo ""
echo "Step 1: Setting up environment variables"
echo "---------------------------------------"

# Check if .env.local exists
if [[ ! -f ".env.local" ]]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

# Get Google Calendar credentials
echo "🔧 Setting up Google Calendar credentials..."
echo "To get these, visit: https://console.cloud.google.com/"
echo "1. Create a new project or select existing"
echo "2. Enable Google Calendar API"
echo "3. Create OAuth 2.0 credentials"
echo "4. Add redirect URI: http://localhost:3000/api/auth/google/callback"
echo ""

prompt_for_value "GOOGLE_CLIENT_ID" "Google Client ID" || exit 1
prompt_for_value "GOOGLE_CLIENT_SECRET" "Google Client Secret" || exit 1

# Generate NEXTAUTH_SECRET if needed
current_secret=$(grep "^NEXTAUTH_SECRET=" .env.local | cut -d'=' -f2)
if [[ "$current_secret" == "your_nextauth_secret" ]]; then
    echo "🔐 Generating NEXTAUTH_SECRET..."
    if check_command "openssl"; then
        new_secret=$(openssl rand -base64 32)
        sed -i '' "s/^NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$new_secret/" .env.local
        echo "✅ NEXTAUTH_SECRET generated"
    else
        echo "⚠️  Please set NEXTAUTH_SECRET manually with a random string"
    fi
fi

echo ""
echo "Step 2: Setting up Supabase database"
echo "------------------------------------"

# Check Supabase credentials
supabase_url=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d'=' -f2)
supabase_key=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local | cut -d'=' -f2)

if [[ "$supabase_url" == "your_supabase_url" || "$supabase_key" == "your_supabase_anon_key" ]]; then
    echo "⚠️  Supabase credentials need to be set up first"
    echo "Please update your .env.local file with your Supabase URL and keys"
    echo "You can find these in your Supabase project dashboard"
    exit 1
fi

echo "📊 Creating database tables..."
echo "Please run this SQL in your Supabase dashboard:"
echo ""
echo "-- Copy and paste this into your Supabase SQL editor:"
cat supabase/calendar-schema.sql
echo ""
echo "Or visit: https://supabase.com/dashboard/project/$(echo $supabase_url | sed 's/.*\/\/\([^.]*\).*/\1/')/sql"

echo ""
echo "Step 3: Installing dependencies"
echo "------------------------------"

if check_command "npm"; then
    echo "📦 Installing required packages..."
    npm install googleapis next-auth
    echo "✅ Dependencies installed"
else
    echo "❌ npm not found. Please install Node.js first."
    exit 1
fi

echo ""
echo "Step 4: Testing the setup"
echo "------------------------"

echo "🧪 Starting development server..."
echo "You can now:"
echo "1. Run: npm run dev"
echo "2. Visit: http://localhost:3000/calendar-setup"
echo "3. Connect your Google Calendar"
echo "4. Test WhatsApp messages like: 'I want to book a call tomorrow at 2pm'"

echo ""
echo "🎉 Setup complete! Your WhatsApp AI can now book Google Calendar appointments!"
echo ""
echo "Next steps:"
echo "1. Make sure you've run the SQL schema in Supabase"
echo "2. Start your dev server: npm run dev"
echo "3. Visit /calendar-setup to connect your Google Calendar"
echo "4. Test with WhatsApp booking messages"