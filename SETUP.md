# Complete Setup Guide for WhatsApp Lead System

This guide will walk you through setting up the WhatsApp Lead System on a new computer.

## 📋 Prerequisites

1. **Git** - [Download Git](https://git-scm.com/downloads)
2. **Node.js** (v18+) - [Download Node.js](https://nodejs.org/)
3. **A code editor** (VS Code recommended) - [Download VS Code](https://code.visualstudio.com/)

## 🚀 Step-by-Step Setup

### 1. Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/YOUR_USERNAME/whatsapp-lead-system.git
cd whatsapp-lead-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Now edit `.env.local` with your actual values:

```bash
# Open in your code editor
code .env.local
# or
nano .env.local
```

### 4. Set Up Required Services

You'll need accounts and API keys from:

#### Supabase (Database)
1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to Settings → API
4. Copy your `URL` and `anon public` key
5. Copy the `service_role` key (keep this secret!)

#### Twilio (WhatsApp Messaging)
1. Go to [twilio.com](https://twilio.com) and create an account
2. Set up WhatsApp in the Twilio Console
3. Get your Account SID and Auth Token
4. Get your WhatsApp-enabled phone number

#### Anthropic (AI)
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account and get your API key

#### Google Calendar (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/api/calendar`

### 5. Set Up the Database

Run the Supabase migrations:

```bash
# Copy the SQL files content and run in Supabase SQL editor:
# 1. Go to your Supabase dashboard
# 2. Navigate to SQL Editor
# 3. Run each file in order:
#    - supabase/knowledge-schema.sql
#    - supabase/calendar-schema.sql
#    - Any other .sql files
```

### 6. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

### 7. Set Up Twilio Webhook

1. Start your local server with ngrok (for testing):
   ```bash
   npx ngrok http 3000
   ```

2. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

3. In Twilio Console:
   - Go to your WhatsApp number settings
   - Set the webhook URL to: `https://abc123.ngrok.io/api/webhooks/twilio`
   - Method: POST

## 🧪 Testing

### Test WhatsApp Integration
1. Send a message to your Twilio WhatsApp number
2. Check the console logs in your terminal
3. The AI should respond automatically

### Test Knowledge Base
1. Go to [http://localhost:3000/train](http://localhost:3000/train)
2. Add some test knowledge entries
3. Test with WhatsApp messages

## 📦 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add all environment variables
5. Deploy!

### Update Twilio Webhook
After deployment, update your Twilio webhook to:
```
https://your-app.vercel.app/api/webhooks/twilio
```

## 🔧 Common Issues

### "Cannot find module" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Database connection issues
- Check your Supabase URL and keys
- Ensure RLS policies are set correctly
- Check Supabase dashboard for errors

### WhatsApp not receiving messages
- Verify Twilio webhook URL
- Check Twilio logs for errors
- Ensure phone number is WhatsApp-enabled

### Environment variables not loading
- Ensure `.env.local` file exists
- Restart the development server
- Check for typos in variable names

## 🔐 Security Notes

- Never commit `.env.local` to git
- Keep your service role key secret
- Use environment variables in production
- Enable RLS in Supabase
- Set up proper CORS policies

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Twilio WhatsApp Documentation](https://www.twilio.com/docs/whatsapp)
- [Anthropic API Documentation](https://docs.anthropic.com)

## 🆘 Need Help?

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review error logs in the console
- Check Supabase and Twilio dashboards
- Open an issue on GitHub