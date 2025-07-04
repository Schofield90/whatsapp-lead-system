-- Add GHL integration fields to existing tables

-- Add GHL fields to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS ghl_contact_id TEXT,
ADD COLUMN IF NOT EXISTS ghl_opportunity_id TEXT,
ADD COLUMN IF NOT EXISTS ghl_sync_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ghl_last_sync TIMESTAMP,
ADD COLUMN IF NOT EXISTS sync_direction TEXT DEFAULT 'bidirectional'; -- 'inbound', 'outbound', 'bidirectional'

-- Add GHL fields to bookings table  
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS ghl_appointment_id TEXT,
ADD COLUMN IF NOT EXISTS ghl_calendar_id TEXT,
ADD COLUMN IF NOT EXISTS ghl_sync_status TEXT DEFAULT 'pending';

-- Add GHL fields to organizations table for API credentials
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS ghl_location_id TEXT,
ADD COLUMN IF NOT EXISTS ghl_api_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS ghl_webhook_secret TEXT,
ADD COLUMN IF NOT EXISTS ghl_integration_enabled BOOLEAN DEFAULT FALSE;

-- Create GHL sync log table
CREATE TABLE IF NOT EXISTS ghl_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  lead_id UUID REFERENCES leads(id),
  sync_type TEXT NOT NULL, -- 'inbound', 'outbound'
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  ghl_object_type TEXT NOT NULL, -- 'contact', 'opportunity', 'appointment'
  ghl_object_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed'
  error_message TEXT,
  request_data JSONB,
  response_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_ghl_contact_id ON leads(ghl_contact_id);
CREATE INDEX IF NOT EXISTS idx_leads_ghl_sync_status ON leads(ghl_sync_status);
CREATE INDEX IF NOT EXISTS idx_bookings_ghl_appointment_id ON bookings(ghl_appointment_id);
CREATE INDEX IF NOT EXISTS idx_ghl_sync_logs_organization_id ON ghl_sync_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ghl_sync_logs_created_at ON ghl_sync_logs(created_at);

-- Enable RLS
ALTER TABLE ghl_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for sync logs
CREATE POLICY "GHL sync logs are organization-scoped" ON ghl_sync_logs
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE organization_id = ghl_sync_logs.organization_id)
  );

-- Create function to sync lead status to GHL
CREATE OR REPLACE FUNCTION sync_lead_to_ghl(lead_uuid UUID, sync_action TEXT)
RETURNS VOID AS $$
DECLARE
  lead_record RECORD;
BEGIN
  -- Get lead with organization info
  SELECT l.*, o.ghl_location_id, o.ghl_integration_enabled
  INTO lead_record
  FROM leads l
  JOIN organizations o ON l.organization_id = o.id
  WHERE l.id = lead_uuid;
  
  -- Only sync if GHL integration is enabled and lead has GHL contact ID
  IF lead_record.ghl_integration_enabled AND lead_record.ghl_contact_id IS NOT NULL THEN
    -- Log the sync attempt
    INSERT INTO ghl_sync_logs (
      organization_id,
      lead_id,
      sync_type,
      action,
      ghl_object_type,
      ghl_object_id,
      status
    ) VALUES (
      lead_record.organization_id,
      lead_uuid,
      'outbound',
      sync_action,
      'contact',
      lead_record.ghl_contact_id,
      'pending'
    );
    
    -- TODO: Trigger actual API call to GHL
    -- This would be handled by a background job or webhook
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-sync lead updates to GHL
CREATE OR REPLACE FUNCTION trigger_ghl_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync on status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM sync_lead_to_ghl(NEW.id, 'update');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to leads table
DROP TRIGGER IF EXISTS ghl_sync_trigger ON leads;
CREATE TRIGGER ghl_sync_trigger
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ghl_sync();

-- Create view for GHL integration status
CREATE OR REPLACE VIEW ghl_integration_status AS
SELECT 
  l.id as lead_id,
  l.name,
  l.email,
  l.phone,
  l.status,
  l.ghl_contact_id,
  l.ghl_sync_status,
  l.ghl_last_sync,
  o.ghl_integration_enabled,
  o.ghl_location_id,
  COUNT(gsl.id) as sync_attempts,
  MAX(gsl.created_at) as last_sync_attempt,
  SUM(CASE WHEN gsl.status = 'success' THEN 1 ELSE 0 END) as successful_syncs,
  SUM(CASE WHEN gsl.status = 'failed' THEN 1 ELSE 0 END) as failed_syncs
FROM leads l
JOIN organizations o ON l.organization_id = o.id
LEFT JOIN ghl_sync_logs gsl ON l.id = gsl.lead_id
WHERE o.ghl_integration_enabled = TRUE
GROUP BY l.id, l.name, l.email, l.phone, l.status, l.ghl_contact_id, 
         l.ghl_sync_status, l.ghl_last_sync, o.ghl_integration_enabled, o.ghl_location_id;