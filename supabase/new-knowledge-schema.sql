-- Create the knowledge table in the new Supabase database
-- This table stores all gym business knowledge including SOPs, quiz Q&A, and other content

CREATE TABLE IF NOT EXISTS knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on type column for faster queries
CREATE INDEX IF NOT EXISTS idx_knowledge_type ON knowledge(type);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_knowledge_created_at ON knowledge(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on knowledge" ON knowledge
  FOR ALL USING (true);

-- Insert SOPs
INSERT INTO knowledge (type, content) VALUES
('sop', 'How to handle membership cancellations

Always thank the member for their time, ask for feedback, and offer a special rejoin rate if appropriate.

This SOP ensures we maintain positive relationships even when members leave and creates opportunities for future re-engagement.'),

('sop', 'How to greet new leads

Respond within 2 minutes, use their first name, and ask what their main fitness goal is.

Fast response times and personalization create strong first impressions and help qualify prospects immediately.'),

('sop', 'How to upsell personal training

Highlight client success stories, explain the benefits of 1-on-1 coaching, and offer a free first session.

Personal training upsells are most effective when prospects can see real results and experience the value firsthand.'),

('sop', 'How to handle late payments

Politely remind the member, offer flexible payment options, and suspend access only as a last resort.

Maintaining good member relationships during payment issues helps preserve long-term retention and reduces churn.');

-- Insert Quiz Q&A pairs
INSERT INTO knowledge (type, content) VALUES
('quiz', 'Q: What is our process for booking a free trial?
A: Ask for the prospect''s preferred date and time, then confirm availability and send a calendar invite.

This streamlined booking process reduces friction and increases trial conversion rates.'),

('quiz', 'Q: How do we handle price objections?
A: Emphasize the value of our services, mention success stories, and offer a payment plan if needed.

Price objections are often value objections in disguise. Focus on benefits and provide flexible payment options.'),

('quiz', 'Q: What should you do if a member is unhappy with a class?
A: Listen to their feedback, thank them for sharing, and offer a free class or alternative solution.

Member feedback is valuable for improving services, and quick resolution maintains member satisfaction.'),

('quiz', 'Q: How do we follow up with new leads?
A: Send a welcome message within 24 hours, offer a free trial, and schedule a follow-up call.

Consistent follow-up within 24 hours dramatically improves lead conversion rates and shows professionalism.');