-- Create calendar_config table for storing Google Calendar API credentials
CREATE TABLE IF NOT EXISTS calendar_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    google_client_id TEXT NOT NULL,
    google_client_secret TEXT NOT NULL,
    google_refresh_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE calendar_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their organization's calendar config"
    ON calendar_config FOR SELECT
    USING (
        organization_id IN (
            SELECT p.organization_id 
            FROM profiles p 
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their organization's calendar config"
    ON calendar_config FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT p.organization_id 
            FROM profiles p 
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "Users can update their organization's calendar config"
    ON calendar_config FOR UPDATE
    USING (
        organization_id IN (
            SELECT p.organization_id 
            FROM profiles p 
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their organization's calendar config"
    ON calendar_config FOR DELETE
    USING (
        organization_id IN (
            SELECT p.organization_id 
            FROM profiles p 
            WHERE p.id = auth.uid()
        )
    );