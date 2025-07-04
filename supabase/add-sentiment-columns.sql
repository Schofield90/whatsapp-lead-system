-- Add sentiment analysis columns to call_transcripts table
-- Run this in your Supabase SQL editor if the automatic schema check doesn't work

ALTER TABLE call_transcripts 
ADD COLUMN IF NOT EXISTS sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
ADD COLUMN IF NOT EXISTS sales_insights JSONB;

-- Add index for faster sentiment queries
CREATE INDEX IF NOT EXISTS idx_call_transcripts_sentiment ON call_transcripts(sentiment);

-- Update existing transcripts to have NULL sentiment (will be filled by backfill process)
-- No action needed - new columns will be NULL by default

-- Verify the schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'call_transcripts' 
ORDER BY ordinal_position;