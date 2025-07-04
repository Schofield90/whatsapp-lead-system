# WhatsApp Lead Conversion & Booking System

A complete multi-tenant Next.js application that automates lead conversion from Facebook Lead Ads to booked Google Meet calls via WhatsApp conversations powered by Claude AI.

## 🎯 **Current Status: CALL RECORDING TRAINING SYSTEM IN DEVELOPMENT** 🚧

**Live Demo**: [whatsapp-lead-system.vercel.app](https://whatsapp-lead-system.vercel.app)

### ✅ **What's Working:**
- **Complete authentication flow** - Sign up, login, organization setup
- **Functional dashboard** - Leads, conversations, analytics, integrations
- **Manual lead creation** - Add test leads via UI forms
- **Message testing** - Send test WhatsApp messages (simulated)
- **Lead management** - View lead details, send messages to specific leads
- **Database integration** - Supabase with RLS policies working correctly
- **API endpoints** - All core functionality accessible via REST APIs
- **WhatsApp Integration** - Two-way messaging with production WhatsApp Business number via Twilio
- **Call Recording Upload** - Direct Supabase Storage upload bypassing Vercel file size limits (up to 100MB+ files)

### 🔧 **Recently Completed (July 2024):**
- **Fixed WhatsApp Integration** - Production WhatsApp Business messaging working end-to-end
- **Implemented Direct File Upload** - Bypass Vercel 4.5MB limit using direct Supabase Storage upload
- **Call Recording System** - Complete upload interface for training Claude on sales calls
- **Debug Infrastructure** - Comprehensive debugging tools for troubleshooting issues

### 🚧 **Current Issue Being Debugged:**
**Call Recording Database Visibility Problem**
- ✅ Files upload successfully to Supabase Storage (17MB+ files working)
- ✅ Metadata API endpoints exist and functional
- ❌ Uploaded recordings not appearing in UI despite being in database
- 🔍 Debugging organization_id filtering and RLS policies

**Debug Status:**
- Created enhanced debug endpoints with detailed logging
- Identified potential RLS or organization filtering issue  
- Files physically exist in Supabase Storage bucket
- Need to resolve metadata display and transcription trigger

## 🚀 Features

### ✅ **Implemented & Working**
- **Manual lead creation** - Add test leads through the dashboard
- **Lead management dashboard** - View, track, and manage all leads
- **Message testing system** - Send test messages to verify functionality
- **Lead-specific actions** - Send WhatsApp messages to individual leads
- **Organization onboarding** - Complete multi-tenant setup flow
- **Authentication system** - Secure login/signup with Supabase Auth
- **Real-time dashboard** - Lead tracking and conversation monitoring

### 🔄 **Next Phase (Ready for Implementation)**
- **Real WhatsApp integration** - Connect to Twilio for actual message sending
- **Facebook Lead Ads webhooks** - Automatic lead capture from Facebook
- **Google Calendar booking** - Real meeting scheduling with Google Meet
- **Claude AI conversations** - Intelligent lead qualification and responses
- **Automated follow-ups** - Smart sequences to nurture leads

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

### **Testing the Live System**
1. Visit [whatsapp-lead-system.vercel.app](https://whatsapp-lead-system.vercel.app)
2. Sign up with your email
3. Complete organization setup (use any gym name)
4. Test the features:
   - **Leads page**: Click "Add Lead" to create test leads
   - **Conversations page**: Click "Manual Message" or "Send Test Message"
   - **Lead actions**: Use message and view buttons in the leads table

### **Local Development Setup**

### 1. Clone the repository
```bash
git clone https://github.com/Schofield90/whatsapp-lead-system.git
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

### **Current Testing Flow:**
1. **Manual Lead Creation** - Add test leads through the dashboard
2. **Lead Management** - View and track leads in real-time
3. **Message Testing** - Send test messages to verify system functionality
4. **Lead Actions** - Message specific leads and view detailed information

### **Full Production Flow (Next Phase):**
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

## 🎯 **Next Steps & Current Priorities**

### **IMMEDIATE - Call Recording Debug (In Progress)**
- [ ] **CRITICAL**: Fix call recording metadata visibility in UI
  - Debug organization_id filtering issue
  - Verify RLS policies for call_recordings table  
  - Check if records exist but filtering fails
  - Test enhanced debug endpoint with detailed logging
- [ ] **NEXT**: Build comprehensive call recordings management interface
  - Upload tab: File upload status and progress
  - Transcripts tab: Review and edit transcripts
  - Training tab: Approve content for Claude training
  - Analytics tab: Show processing pipeline status

### **Phase 1: Complete Call Recording Training System**
- [ ] Fix transcription pipeline (OpenAI Whisper integration)
- [ ] Implement sales training data extraction from transcripts
- [ ] Create transcript review and approval workflow
- [ ] Integrate processed training data into Claude's context
- [ ] Build training data management interface

### **Phase 2: Enhanced WhatsApp & Automation**
- [ ] Set up Facebook Lead Ads webhook integration  
- [ ] Implement Google Calendar booking system
- [ ] Add advanced Claude AI conversation flows
- [ ] Automated follow-up sequences with training data

### **Phase 3: Scale & Optimize**
- [ ] Performance optimization for large file handling
- [ ] Advanced caching strategies
- [ ] Multi-language support
- [ ] White-label customization

---

## 🐛 **Current Debugging Session Notes**

### **Issue**: Call recordings upload but don't appear in UI
**Location**: Training Data → Call Recordings tab
**Debug Tools Available**: 
- "Debug Database" button - shows raw database count
- "Force Load All Recordings" button - attempts to load all records
- Enhanced debug endpoint at `/api/debug-recordings` with console logging

### **Symptoms**:
1. Files upload successfully to Supabase Storage (confirmed in bucket)
2. Upload shows "success" message in UI
3. No recordings appear in the recordings list
4. Debug shows count mismatch (54 vs 0 records)

### **Investigation Steps**:
1. ✅ Confirmed files exist in Supabase Storage bucket
2. ✅ Created debug endpoints to check database state
3. 🔍 **IN PROGRESS**: Enhanced debug endpoint with detailed error logging
4. ❓ **NEXT**: Check Vercel function logs for database query details
5. ❓ **NEXT**: Verify organization_id matching between user and recordings

### **Key Files**:
- `/src/components/training/call-recording-upload.tsx` - Upload component 
- `/src/app/api/call-recordings/route.ts` - Metadata storage API
- `/src/app/api/debug-recordings/route.ts` - Debug endpoint
- `/src/app/(dashboard)/dashboard/training/page.tsx` - Main UI page

### **Debug Commands for Next Session**:
```bash
# Check Vercel function logs
# Go to Vercel Dashboard → Functions → /api/debug-recordings
# Look for console.log output with 🔍 🚧 ❌ emojis

# Test database directly in Supabase
# SQL Editor: SELECT * FROM call_recordings ORDER BY created_at DESC;

# Check RLS policies
# Supabase Dashboard → Authentication → Policies → call_recordings table
```

---

## 📞 **Contact & Support**

**Project Status**: Functional testing system ready for production integration  
**Last Updated**: December 2024  
**Environment**: Production-ready on Vercel  

Built with ❤️ using Next.js, Supabase, and Claude AI