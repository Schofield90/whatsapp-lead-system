-- Gym Business Knowledge Expansion: SOPs and Interactive Quiz
-- This script adds comprehensive Standard Operating Procedures and Quiz content
-- to enhance the AI chatbot's knowledge base

-- =================================
-- STANDARD OPERATING PROCEDURES (SOPs)
-- =================================

INSERT INTO knowledge (type, content) VALUES

-- Lead Qualification SOPs
('sop', 'Lead Qualification Process: 1) Ask about fitness goals and experience level. 2) Inquire about current activity level and any injuries. 3) Discuss budget and time availability. 4) Offer free consultation or trial session. 5) Book gym tour within 48 hours. 6) Follow up within 24 hours if no immediate booking.'),

('sop', 'New Member Onboarding: 1) Welcome new member and introduce yourself. 2) Complete gym tour highlighting key areas (weights, cardio, classes, changing rooms). 3) Demonstrate equipment safety and proper form. 4) Set up their first workout plan. 5) Introduce them to staff and other members. 6) Schedule first personal training session within 1 week. 7) Follow up after 3 days to check on their experience.'),

('sop', 'Membership Sales Process: 1) Listen to customer needs and goals. 2) Explain membership options that match their requirements. 3) Highlight benefits: unlimited access, classes, personal training discounts. 4) Mention current promotions (free trial week, student discount). 5) Address objections with benefits. 6) Close by asking "Which membership works best for your goals?" 7) Process payment and schedule orientation.'),

('sop', 'Customer Complaint Resolution: 1) Listen actively without interrupting. 2) Acknowledge their concern and apologize for any inconvenience. 3) Ask clarifying questions to understand the issue fully. 4) Offer immediate solutions within your authority. 5) If unable to resolve, escalate to manager within 30 minutes. 6) Follow up within 24 hours to ensure satisfaction. 7) Document the issue and resolution in customer notes.'),

('sop', 'Equipment Maintenance Protocol: 1) Conduct daily safety checks before opening. 2) Clean and sanitize equipment after each use. 3) Report any malfunctions immediately to maintenance team. 4) Place "Out of Order" signs on broken equipment. 5) Log all maintenance issues with date, time, and description. 6) Weekly deep cleaning of all equipment. 7) Monthly professional maintenance inspections.'),

('sop', 'Personal Training Consultation: 1) Conduct fitness assessment and goal setting. 2) Discuss medical history and current fitness level. 3) Explain personal training packages and benefits. 4) Design sample workout plan tailored to their goals. 5) Demonstrate 2-3 exercises with proper form. 6) Discuss nutrition basics and lifestyle factors. 7) Book first session within 1 week if interested.'),

('sop', 'Class Booking and Management: 1) Explain class schedules and difficulty levels. 2) Help book appropriate classes for fitness level. 3) Advise arriving 10 minutes early for setup. 4) Introduce new members to instructors. 5) Follow up after first class for feedback. 6) Suggest progression to more challenging classes when ready. 7) Handle cancellations with 2-hour minimum notice.'),

('sop', 'Membership Cancellation Process: 1) Understand reason for cancellation (price, moving, injury, etc.). 2) Offer alternatives: membership freeze, downgrade, or shorter term. 3) If proceeding with cancellation, explain 30-day notice policy. 4) Complete cancellation form with member signature. 5) Confirm final billing date and any outstanding fees. 6) Offer re-joining incentives for future. 7) Request feedback for improvement.'),

-- =================================
-- INTERACTIVE QUIZ CONTENT
-- =================================

-- Fitness Knowledge Quiz
('quiz', '{"question": "What is the recommended amount of weekly exercise for adults according to health guidelines?", "answer": "At least 150 minutes of moderate-intensity aerobic activity or 75 minutes of vigorous-intensity aerobic activity per week, plus muscle-strengthening activities on 2 or more days.", "category": "fitness_guidelines", "difficulty": "beginner"}'),

('quiz', '{"question": "Which muscle group should you work before smaller muscle groups in a workout?", "answer": "Large muscle groups should be worked before smaller ones. For example, work your chest and back before your biceps and triceps, as the smaller muscles assist the larger ones.", "category": "workout_order", "difficulty": "intermediate"}'),

('quiz', '{"question": "How long should you rest between sets when strength training?", "answer": "For strength training: 2-5 minutes between sets. For muscle building: 1-3 minutes. For endurance: 30-90 seconds. Adjust based on the weight and your fitness level.", "category": "rest_periods", "difficulty": "intermediate"}'),

('quiz', '{"question": "What should you eat within 30 minutes after a workout?", "answer": "A combination of protein and carbohydrates. Good options include a protein shake with banana, Greek yogurt with berries, or chocolate milk. This helps with muscle recovery and glycogen replenishment.", "category": "nutrition", "difficulty": "beginner"}'),

('quiz', '{"question": "What is the proper form for a squat?", "answer": "Feet shoulder-width apart, weight in heels, chest up, core engaged. Lower by pushing hips back and bending knees until thighs are parallel to floor. Drive through heels to return to starting position.", "category": "exercise_form", "difficulty": "beginner"}'),

-- Gym Etiquette Quiz
('quiz', '{"question": "How long is it acceptable to rest on equipment between sets?", "answer": "Generally 1-3 minutes maximum. If resting longer, allow others to work in or move to a different exercise. Always be mindful of others waiting.", "category": "gym_etiquette", "difficulty": "beginner"}'),

('quiz', '{"question": "What should you do after using gym equipment?", "answer": "Wipe down the equipment with provided sanitizing wipes or spray, return weights to their proper location, and ensure the area is clean for the next person.", "category": "gym_etiquette", "difficulty": "beginner"}'),

('quiz', '{"question": "When is it appropriate to give unsolicited advice to another gym member?", "answer": "Generally, it is not appropriate unless someone is in immediate danger or specifically asks for help. Focus on your own workout and respect others space and autonomy.", "category": "gym_etiquette", "difficulty": "intermediate"}'),

-- Safety Quiz
('quiz', '{"question": "What should you do if you feel dizzy or lightheaded during a workout?", "answer": "Stop exercising immediately, sit or lie down, drink water slowly, and rest until you feel better. If symptoms persist, seek medical attention. Never continue working out when feeling unwell.", "category": "safety", "difficulty": "beginner"}'),

('quiz', '{"question": "How should you approach lifting a weight that is close to your maximum?", "answer": "Always use a spotter, warm up thoroughly, use proper form, have a clear path to rack the weight, and never attempt a true 1-rep max without supervision from a qualified trainer.", "category": "safety", "difficulty": "advanced"}'),

-- Motivation and Goal Setting Quiz
('quiz', '{"question": "What is the SMART criteria for setting fitness goals?", "answer": "Specific, Measurable, Achievable, Relevant, and Time-bound. For example: I will lose 10 pounds in 8 weeks by exercising 4 times per week and following a balanced diet plan.", "category": "goal_setting", "difficulty": "intermediate"}'),

('quiz', '{"question": "How often should you reassess and adjust your fitness goals?", "answer": "Every 4-6 weeks. This allows enough time to see progress while staying flexible enough to adjust based on results, life changes, or new interests.", "category": "goal_setting", "difficulty": "intermediate"}'),

-- Membership and Services Quiz
('quiz', '{"question": "What are the benefits of having a personal trainer?", "answer": "Personalized workout plans, proper form instruction, motivation and accountability, goal setting and tracking, injury prevention, and faster results through expert guidance.", "category": "services", "difficulty": "beginner"}'),

('quiz', '{"question": "How can group fitness classes benefit your workout routine?", "answer": "They provide motivation through community support, structured workouts led by professionals, variety to prevent boredom, accountability, and the opportunity to learn new exercises and techniques.", "category": "services", "difficulty": "beginner"}');

-- =================================
-- UPDATE KNOWLEDGE TYPES
-- =================================

-- Add the quiz type to our existing knowledge types for better organization
-- This helps the AI system categorize and retrieve quiz content appropriately