-- Call recordings and transcripts schema

-- Table for storing call recordings metadata
CREATE TABLE call_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  original_filename TEXT NOT NULL,
  file_url TEXT, -- URL to stored audio file (could be Supabase Storage)
  file_size INTEGER,
  duration_seconds INTEGER,
  upload_date TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'uploaded', -- 'uploaded', 'transcribing', 'transcribed', 'processed', 'error'
  transcription_status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table for storing transcriptions
CREATE TABLE call_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_recording_id UUID REFERENCES call_recordings(id),
  organization_id UUID REFERENCES organizations(id),
  raw_transcript TEXT, -- Full transcription from Whisper
  processed_transcript TEXT, -- Cleaned/formatted version
  speaker_labels JSONB, -- Speaker identification if available
  transcript_segments JSONB, -- Timestamped segments
  confidence_score DECIMAL(3,2), -- Overall transcription confidence
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table for extracted sales training data
CREATE TABLE sales_training_extracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_transcript_id UUID REFERENCES call_transcripts(id),
  organization_id UUID REFERENCES organizations(id),
  extract_type TEXT NOT NULL, -- 'objection_handling', 'closing_technique', 'qualification_questions', 'rapport_building'
  content TEXT NOT NULL, -- The actual extracted text/technique
  context TEXT, -- Surrounding context from the call
  effectiveness_rating INTEGER, -- 1-5 rating of how effective this was
  tags TEXT[], -- Tags for categorization
  is_approved BOOLEAN DEFAULT false, -- Whether this should be used for training
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_training_extracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Call recordings are organization-scoped" ON call_recordings
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE organization_id = call_recordings.organization_id)
  );

CREATE POLICY "Call transcripts are organization-scoped" ON call_transcripts
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE organization_id = call_transcripts.organization_id)
  );

CREATE POLICY "Sales training extracts are organization-scoped" ON sales_training_extracts
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE organization_id = sales_training_extracts.organization_id)
  );

-- Indexes
CREATE INDEX idx_call_recordings_organization_id ON call_recordings(organization_id);
CREATE INDEX idx_call_recordings_status ON call_recordings(status);
CREATE INDEX idx_call_transcripts_recording_id ON call_transcripts(call_recording_id);
CREATE INDEX idx_sales_training_extracts_organization_id ON sales_training_extracts(organization_id);
CREATE INDEX idx_sales_training_extracts_type ON sales_training_extracts(extract_type);
CREATE INDEX idx_sales_training_extracts_approved ON sales_training_extracts(is_approved, is_active);

-- Update trigger for updated_at
CREATE TRIGGER update_call_recordings_updated_at BEFORE UPDATE ON call_recordings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_training_extracts_updated_at BEFORE UPDATE ON sales_training_extracts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();