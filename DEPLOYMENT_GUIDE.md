# 🚀 WhatsApp Lead System - Deployment Guide

This guide will help you deploy your multi-tenant WhatsApp lead conversion system to production.

## 📋 Pre-Deployment Checklist

### 1. Required Accounts & Services
- [ ] **Supabase** account and project
- [ ] **Vercel** account for deployment
- [ ] **Twilio** account with WhatsApp Business API access
- [ ] **Anthropic** account with Claude API access
- [ ] **Google Cloud** project with Calendar API enabled
- [ ] **Resend** account for email services
- [ ] **Facebook** app for Lead Ads integration

### 2. Service Configuration

#### Supabase Setup
1. Create a new Supabase project
2. Run the SQL schema from `supabase/schema.sql`
3. Enable Row Level Security on all tables
4. Get your project URL and API keys

#### Twilio WhatsApp Setup
1. Set up WhatsApp Business API in Twilio Console
2. Get Account SID, Auth Token, and WhatsApp number
3. Configure webhook URL (will be set after deployment)

#### Google Calendar API
1. Create OAuth 2.0 credentials in Google Cloud Console
2. Enable Google Calendar API
3. Configure authorized redirect URIs

#### Facebook Lead Ads
1. Create Facebook app in Meta for Developers
2. Set up Lead Ads API access
3. Configure webhook (will be set after deployment)

## 🌐 Deployment Steps

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy the project
vercel

# Follow the prompts to configure your project
```

### 2. Configure Environment Variables

In your Vercel dashboard, add these environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Anthropic Claude
ANTHROPIC_API_KEY=your_anthropic_api_key

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=your_whatsapp_business_number

# Google Calendar
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/callback/google

# Email Service
RESEND_API_KEY=your_resend_api_key

# Security
NEXTAUTH_SECRET=your_secure_random_string
NEXTAUTH_URL=https://yourdomain.com
CRON_SECRET=your_secure_cron_token
```

### 3. Configure Webhooks

After deployment, configure these webhook URLs:

#### Twilio WhatsApp Webhook
- URL: `https://yourdomain.com/api/webhooks/twilio`
- Method: POST
- Set this in your Twilio Console for incoming WhatsApp messages

#### Facebook Lead Ads Webhook
- URL: `https://yourdomain.com/api/webhooks/facebook/[token]`
- The `[token]` is generated per organization in the app
- Set this in your Facebook app settings

### 4. Set Up Cron Jobs

The system includes automated follow-ups that run every 2 hours:
- Vercel will automatically handle this with the `vercel.json` configuration
- The cron job runs at: `0 */2 * * *` (every 2 hours)

## ⚙️ Post-Deployment Configuration

### 1. Create Your First Organization

1. Visit your deployed app
2. Sign up for an account
3. Complete the onboarding flow
4. Set up your organization

### 2. Configure Integrations

1. Go to the Integrations page
2. Add your service credentials:
   - Twilio WhatsApp API
   - Google Calendar OAuth
   - Email service
   - Claude AI (if not using global key)

### 3. Set Up Lead Sources

1. Create a Facebook Lead Ads source
2. Copy the webhook URL and verification token
3. Configure these in your Facebook app

### 4. Add Training Data

1. Go to the Training page
2. Add your gym-specific content:
   - Sales scripts
   - Objection handling responses
   - Lead qualification criteria

## 🔧 Custom Domain Setup (Optional)

### Multi-Tenant Domains

If you want custom domains per organization:

1. In Vercel, add your custom domains
2. Configure DNS records
3. Update the organization settings in your database

Example:
- Main app: `app.yourcompany.com`
- Gym A: `gymA.yourcompany.com`
- Gym B: `gymB.yourcompany.com`

## 📊 Monitoring & Maintenance

### 1. Monitor System Health

- Check Vercel function logs for errors
- Monitor Supabase usage and performance
- Track webhook success rates

### 2. Database Maintenance

```sql
-- Monitor table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Clean up old messages (optional)
DELETE FROM messages 
WHERE created_at < NOW() - INTERVAL '6 months';
```

### 3. Regular Backups

- Supabase automatically backs up your database
- Consider additional backups for critical data
- Test restore procedures periodically

## 🚨 Troubleshooting

### Common Issues

1. **Webhook Not Receiving Data**
   - Check URL configuration
   - Verify webhook tokens
   - Check Vercel function logs

2. **Authentication Issues**
   - Verify environment variables
   - Check Supabase RLS policies
   - Ensure NEXTAUTH_URL is correct

3. **WhatsApp Messages Not Sending**
   - Verify Twilio credentials
   - Check WhatsApp number configuration
   - Review Twilio logs

4. **Claude API Errors**
   - Check API key validity
   - Monitor usage limits
   - Review error logs

### Debug Mode

Enable debug logging by adding:
```env
DEBUG=true
```

## 📈 Scaling Considerations

### Database Optimization
- Monitor query performance
- Add indexes for heavy queries
- Consider read replicas for analytics

### Function Optimization
- Monitor Vercel function execution times
- Optimize database queries
- Implement caching where appropriate

### Rate Limiting
- Implement rate limiting for webhooks
- Monitor API usage across services
- Set up alerts for quota limits

## 🔒 Security Best Practices

1. **Regular Security Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Update API keys regularly

2. **Access Control**
   - Use least privilege principle
   - Regular access reviews
   - Monitor unusual activity

3. **Data Protection**
   - Encrypt sensitive data
   - Regular security audits
   - Compliance with data regulations

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review Vercel function logs
3. Check Supabase logs
4. Create an issue in the repository

---

🎉 **Congratulations!** Your WhatsApp lead conversion system is now live and ready to transform your business!