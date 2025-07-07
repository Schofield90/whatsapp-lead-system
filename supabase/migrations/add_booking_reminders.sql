-- Create booking_reminders table
CREATE TABLE IF NOT EXISTS booking_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('confirmation', 'one_hour_before', 'owner_notification')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  recipient_phone TEXT NOT NULL,
  message_template TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  twilio_message_sid TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_booking_reminders_booking_id ON booking_reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_status_scheduled ON booking_reminders(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_type ON booking_reminders(reminder_type);

-- Add RLS policy
ALTER TABLE booking_reminders ENABLE ROW LEVEL SECURITY;

-- Policy for organization access
CREATE POLICY "Users can manage their organization's booking reminders" ON booking_reminders
  FOR ALL USING (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_booking_reminders_updated_at 
  BEFORE UPDATE ON booking_reminders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();