# WhatsApp Lead Conversion & Booking System

A complete multi-tenant Next.js application that automates lead conversion from Facebook Lead Ads to booked Google Meet calls via WhatsApp conversations powered by Claude AI.

## 🚀 Features

### Core Functionality
- **Multi-tenant architecture** - Support multiple gym owners with complete data isolation
- **Facebook Lead Ads integration** - Automatic lead capture via webhooks
- **WhatsApp automation** - Powered by Twilio and Claude AI for intelligent conversations
- **Google Calendar integration** - Automatic booking and Meet link generation
- **Real-time dashboard** - Lead tracking, analytics, and conversation monitoring
- **Automated follow-ups** - Smart sequences to nurture leads and reduce no-shows
- **Training data management** - Customize Claude's behavior per organization

### Key Integrations
- **Supabase** - Database with Row Level Security and authentication
- **Anthropic Claude** - AI-powered conversations with custom training
- **Twilio** - WhatsApp Business API for messaging
- **Google Calendar** - Meeting scheduling and Google Meet integration
- **Resend** - Email notifications and confirmations
- **Facebook Lead Ads** - Lead capture webhooks

## 🛠 Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth
- **Deployment**: Vercel with automated deployments
- **APIs**: RESTful API routes with webhook endpoints

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js 18+** installed
2. **npm** or **yarn** package manager
3. A **Supabase** project
4. **Twilio** account with WhatsApp Business API
5. **Anthropic** API key
6. **Google Cloud** project with Calendar API enabled
7. **Resend** account for emails
8. **Facebook** app for Lead Ads webhooks

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/whatsapp-lead-system.git
cd whatsapp-lead-system
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic Claude
ANTHROPIC_API_KEY=your_anthropic_api_key

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=your_whatsapp_number

# Google Calendar
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri

# Email Service
RESEND_API_KEY=your_resend_api_key

# Security
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
CRON_SECRET=your_cron_secret
```

### 4. Set up the database
Run the SQL schema from `supabase/schema.sql` in your Supabase project.

### 5. Run the development server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📚 Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Main dashboard
│   │   ├── leads/          # Lead management
│   │   ├── conversations/  # WhatsApp conversations
│   │   ├── bookings/       # Calendar & bookings
│   │   ├── training/       # Claude training data
│   │   ├── analytics/      # Performance analytics
│   │   └── integrations/   # API integrations
│   ├── api/
│   │   ├── webhooks/       # Facebook & Twilio webhooks
│   │   └── cron/           # Automated tasks
│   └── onboarding/         # Organization setup
├── components/             # Reusable components
├── lib/                    # Utilities & integrations
└── types/                  # TypeScript definitions
```

## 🔧 Configuration

### Webhook URLs

After deployment, configure these webhooks:

- **Twilio WhatsApp**: `https://yourdomain.com/api/webhooks/twilio`
- **Facebook Lead Ads**: `https://yourdomain.com/api/webhooks/facebook/[token]`

### Cron Jobs

Automated follow-ups run every 2 hours via Vercel Cron:
- Schedule: `0 */2 * * *`
- Endpoint: `/api/cron/follow-ups`

## 📱 How It Works

1. **Lead Capture** - Facebook Lead Ads sends new leads to webhook
2. **Instant Contact** - WhatsApp message sent immediately
3. **AI Conversation** - Claude processes responses using org-specific training
4. **Smart Qualification** - AI detects when leads are ready to book
5. **Auto-Booking** - Calendar integration schedules meetings
6. **Confirmations** - Email and WhatsApp confirmations sent
7. **Follow-ups** - Automated sequences for engagement

## 🚀 Deployment

This project is configured for easy deployment on Vercel:

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🔒 Security

- Row Level Security (RLS) on all database tables
- Multi-tenant data isolation
- Encrypted credential storage
- Webhook validation
- Secure authentication flow

## 📊 Features Overview

### Lead Management
- Real-time lead tracking
- Status updates and pipeline view
- Lead source attribution
- Conversion analytics

### WhatsApp Automation
- Two-way messaging
- AI-powered responses
- Conversation history
- Message templates

### Booking System
- Calendar availability checking
- Google Meet integration
- Automated reminders
- No-show management

### Analytics Dashboard
- Conversion rates
- Response times
- Revenue tracking
- Performance metrics

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using Next.js, Supabase, and Claude AI