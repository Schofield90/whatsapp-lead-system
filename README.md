# WhatsApp Lead System

AI-powered WhatsApp lead qualification system using Supabase, Twilio, and Anthropic Claude.

## 🚀 Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Messaging**: Twilio WhatsApp API
- **AI**: Anthropic Claude
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Supabase account** - [supabase.com](https://supabase.com)
4. **Twilio account** - [twilio.com](https://twilio.com)
5. **Anthropic API key** - [console.anthropic.com](https://console.anthropic.com)

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
git clone https://github.com/Schofield90/whatsapp-lead-system.git
cd whatsapp-lead-system
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_whatsapp_number

# Anthropic Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the database migrations (to be created)
3. Set up Row Level Security (RLS) policies

### 4. Twilio WhatsApp Setup

1. Set up Twilio WhatsApp Sandbox or get approved for production
2. Configure webhook URL: `https://yourdomain.com/api/webhooks/twilio`
3. Set up phone number in Twilio console

### 5. Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🚢 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables in Vercel

Add all the environment variables from your `.env.local` file to the Vercel dashboard under:
`Project Settings > Environment Variables`

## 📁 Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
├── lib/               # Utility functions
│   ├── supabase.ts    # Supabase client
│   ├── twilio.ts      # Twilio client
│   └── anthropic.ts   # Anthropic client
└── types/             # TypeScript types
```

## 🔧 Key Features (To Implement)

- [ ] WhatsApp message receiving and sending
- [ ] AI-powered conversation handling
- [ ] Lead qualification workflow
- [ ] Database storage for conversations and leads
- [ ] Real-time dashboard
- [ ] Analytics and reporting
- [ ] Multi-user support
- [ ] Integration with CRM systems

## 🛡️ Security Considerations

- Environment variables are not committed to git
- Use Row Level Security (RLS) in Supabase
- Implement proper authentication
- Validate all incoming webhook data
- Rate limiting on API endpoints

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [Anthropic Claude API](https://docs.anthropic.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Note**: This is a fresh Next.js 15 project ready for development. Start by implementing the core WhatsApp webhook handling and AI conversation logic.