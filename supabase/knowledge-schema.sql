-- Create the knowledge table for storing gym business information
-- This table will store various types of knowledge that the AI can reference

CREATE TABLE knowledge (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- e.g., 'sop', 'call', 'faq', 'style', 'pricing', 'schedule'
    content TEXT NOT NULL, -- The actual knowledge content
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the type column for faster queries
CREATE INDEX idx_knowledge_type ON knowledge(type);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at when a row is modified
CREATE TRIGGER update_knowledge_updated_at 
    BEFORE UPDATE ON knowledge 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
-- You can modify this later to restrict access based on user roles
CREATE POLICY "Enable all operations for knowledge table" ON knowledge
    FOR ALL USING (true);

-- Insert some sample gym business knowledge
INSERT INTO knowledge (type, content) VALUES
    ('style', 'Always respond in a friendly, professional tone. Use gym terminology appropriately. Keep responses concise and helpful.'),
    ('faq', 'Q: What are your opening hours? A: We are open Monday-Friday 6AM-10PM, Saturday-Sunday 8AM-8PM.'),
    ('faq', 'Q: Do you offer personal training? A: Yes, we have certified personal trainers available. Sessions can be booked through our app or by calling the gym.'),
    ('pricing', 'Monthly membership: £35/month. Annual membership: £350/year (save £70). Day pass: £12. Student discount: 20% off all memberships.'),
    ('sop', 'When someone asks about membership, always mention our free trial week and offer to book them a gym tour.'),
    ('sop', 'If someone asks about cancellation, explain our 30-day notice policy and offer to speak with a manager if they have concerns.');