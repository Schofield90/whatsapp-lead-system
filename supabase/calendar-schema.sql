-- Create calendar_bookings table
CREATE TABLE IF NOT EXISTS calendar_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_calendar_bookings_date ON calendar_bookings(date);
CREATE INDEX idx_calendar_bookings_status ON calendar_bookings(status);

-- Enable Row Level Security
ALTER TABLE calendar_bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow anonymous read for checking availability
CREATE POLICY "Allow anonymous read for availability check" ON calendar_bookings
  FOR SELECT
  USING (true);

-- Allow service role full access
CREATE POLICY "Service role has full access to calendar_bookings" ON calendar_bookings
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_calendar_bookings_updated_at 
  BEFORE UPDATE ON calendar_bookings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();