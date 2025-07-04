-- Add call recordings and transcriptions tables to existing schema

-- Call recordings metadata
CREATE TABLE call_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  lead_id UUID REFERENCES leads(id),
  booking_id UUID REFERENCES bookings(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size BIGINT,
  duration_seconds INTEGER,
  call_date TIMESTAMP NOT NULL,
  call_type TEXT DEFAULT 'consultation', -- 'consultation', 'follow_up', 'sales'
  status TEXT DEFAULT 'recorded', -- 'recorded', 'transcribing', 'transcribed', 'processed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;

-- Call transcriptions
CREATE TABLE call_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_recording_id UUID REFERENCES call_recordings(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  transcription_text TEXT NOT NULL,
  confidence_score FLOAT,
  language TEXT DEFAULT 'en',
  segments JSONB, -- Detailed whisper segments with timestamps
  summary TEXT, -- Claude-generated summary
  key_points JSONB, -- Claude-extracted key points
  sentiment TEXT, -- 'positive', 'neutral', 'negative'
  action_items JSONB, -- Claude-extracted action items
  transcribed_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP, -- When Claude processed it
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE call_transcriptions ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
CREATE POLICY "Call recordings are organization-scoped" ON call_recordings
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE organization_id = call_recordings.organization_id)
  );

CREATE POLICY "Call transcriptions are organization-scoped" ON call_transcriptions
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE organization_id = call_transcriptions.organization_id)
  );

-- Indexes for performance
CREATE INDEX idx_call_recordings_organization_id ON call_recordings(organization_id);
CREATE INDEX idx_call_recordings_lead_id ON call_recordings(lead_id);
CREATE INDEX idx_call_recordings_call_date ON call_recordings(call_date);
CREATE INDEX idx_call_recordings_status ON call_recordings(status);
CREATE INDEX idx_call_transcriptions_call_recording_id ON call_transcriptions(call_recording_id);
CREATE INDEX idx_call_transcriptions_organization_id ON call_transcriptions(organization_id);

-- Trigger for updating timestamps
CREATE TRIGGER update_call_recordings_updated_at BEFORE UPDATE ON call_recordings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get call recordings with transcriptions
CREATE OR REPLACE FUNCTION get_call_recordings_with_transcriptions(org_id UUID)
RETURNS TABLE (
  recording_id UUID,
  file_name TEXT,
  file_path TEXT,
  call_date TIMESTAMP,
  duration_seconds INTEGER,
  call_type TEXT,
  status TEXT,
  lead_name TEXT,
  lead_phone TEXT,
  transcription_text TEXT,
  summary TEXT,
  key_points JSONB,
  sentiment TEXT,
  action_items JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id as recording_id,
    cr.file_name,
    cr.file_path,
    cr.call_date,
    cr.duration_seconds,
    cr.call_type,
    cr.status,
    l.name as lead_name,
    l.phone as lead_phone,
    ct.transcription_text,
    ct.summary,
    ct.key_points,
    ct.sentiment,
    ct.action_items
  FROM call_recordings cr
  LEFT JOIN leads l ON cr.lead_id = l.id
  LEFT JOIN call_transcriptions ct ON cr.id = ct.call_recording_id
  WHERE cr.organization_id = org_id
  ORDER BY cr.call_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;