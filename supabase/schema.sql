-- Enable RLS on all tables
ALTER DATABASE postgres SET "app.jwt_secret" TO 'super-secret-jwt-token-with-at-least-32-characters-long';

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations (gym owners)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users (gym owners and admins)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  email TEXT NOT NULL,
  role TEXT DEFAULT 'owner',
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Lead sources and tracking
CREATE TABLE lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  source_type TEXT, -- 'facebook', 'manual', etc.
  webhook_token TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;

-- Leads from Facebook
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  lead_source_id UUID REFERENCES lead_sources(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  facebook_lead_id TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'booked', 'completed', 'lost'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- WhatsApp conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  lead_id UUID REFERENCES leads(id),
  twilio_conversation_sid TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused'
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Individual messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  content TEXT NOT NULL,
  twilio_message_sid TEXT,
  claude_response_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Calendar bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  lead_id UUID REFERENCES leads(id),
  conversation_id UUID REFERENCES conversations(id),
  google_calendar_event_id TEXT,
  google_meet_link TEXT,
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'no_show', 'cancelled'
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Organization settings for Claude training
CREATE TABLE training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  data_type TEXT NOT NULL, -- 'sales_script', 'objection_handling', 'qualification_criteria'
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;

-- API keys and secrets per organization
CREATE TABLE organization_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  service_name TEXT NOT NULL, -- 'twilio', 'google_calendar', 'claude', 'email'
  encrypted_credentials JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organization_secrets ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- Organizations  
CREATE POLICY "Organizations can only see their own data" ON organizations
  FOR ALL USING (true);

-- Users
CREATE POLICY "Users can only see users in their organization" ON users
  FOR ALL USING (auth.uid() = id);

-- Lead sources
CREATE POLICY "Lead sources are organization-scoped" ON lead_sources
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE organization_id = lead_sources.organization_id)
  );

-- Leads
CREATE POLICY "Leads are organization-scoped" ON leads
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE organization_id = leads.organization_id)
  );

-- Conversations
CREATE POLICY "Conversations are organization-scoped" ON conversations
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE organization_id = conversations.organization_id)
  );

-- Messages
CREATE POLICY "Messages are organization-scoped via conversations" ON messages
  FOR ALL USING (
    auth.uid() IN (
      SELECT u.id FROM users u
      JOIN conversations c ON u.organization_id = c.organization_id
      WHERE c.id = messages.conversation_id
    )
  );

-- Bookings
CREATE POLICY "Bookings are organization-scoped" ON bookings
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE organization_id = bookings.organization_id)
  );

-- Training data
CREATE POLICY "Training data is organization-scoped" ON training_data
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE organization_id = training_data.organization_id)
  );

-- Organization secrets
CREATE POLICY "Organization secrets are organization-scoped" ON organization_secrets
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE organization_id = organization_secrets.organization_id)
  );

-- Create indexes for better performance
CREATE INDEX idx_leads_organization_id ON leads(organization_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_bookings_organization_id ON bookings(organization_id);
CREATE INDEX idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX idx_training_data_organization_id ON training_data(organization_id);
CREATE INDEX idx_training_data_data_type ON training_data(data_type);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for leads table
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();