import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const ATLAS_TRAINING_DATA = {
  business_info: {
    data_type: 'business_info',
    content: `Atlas Fitness Business Information:

LOCATIONS:
- York: Clifton Moor location  
- Harrogate: Second location

PRICING STRUCTURE:
- Harrogate: 6 weeks for £249, then monthly at £129
- York: 6 weeks for £199, then monthly at £110

BUSINESS MODEL:
- Personal training focused gym
- Small group sessions
- Weight loss programs
- Consultation-based approach
- Professional fitness coaching

BRAND POSITIONING:
- Results-driven fitness coaching
- Supportive, non-judgmental environment
- Personalized approach to fitness
- Focus on sustainable lifestyle changes`
  },

  sales_script: {
    data_type: 'sales_script',
    content: `Atlas Fitness Sales Scripts:

OPENING APPROACH:
"Hi! Thanks for reaching out about Atlas Fitness. I'm excited to help you with your fitness goals. Could you tell me a bit about what you're looking to achieve?"

QUALIFICATION QUESTIONS:
1. "What are your main fitness goals? (weight loss, muscle gain, general health)"
2. "What's your current fitness background?"
3. "When are you looking to get started?"
4. "How many days per week can you realistically commit to training?"

PRICING RESPONSE:
"Our membership options are designed to fit different needs and budgets. I'd love to understand your goals first so I can recommend the best option for you. What are you hoping to achieve with your fitness journey?"

BOOKING APPROACH:
"Based on what you've told me, I think you'd be a great fit for our program. I'd love to schedule a consultation where we can discuss your goals in detail and show you exactly how we can help. When would work best for you this week?"

CONSULTATION CONFIRMATION:
"Perfect! I've scheduled your consultation for [DAY] at [TIME]. You'll receive a reminder before your appointment. I'm looking forward to meeting you and helping you start your fitness journey!"

BRAND VOICE:
- Encouraging and professional
- Solution-focused approach
- Use "we" and "you" to create connection
- Lead with benefits, not features
- Show empathy for concerns and barriers`
  },

  objection_handling: {
    data_type: 'objection_handling',
    content: `Atlas Fitness Objection Handling:

FRAMEWORK: Acknowledge → Empathize → Redirect → Benefit

PRICING CONCERNS:
"I understand budget is important. Many of our most successful members initially had the same concern. What if I told you that our program is designed to give you the exact roadmap and support you need to reach your goals? This means you'd save time, avoid frustration, and get results faster than trying to figure it out alone."

INTIMIDATION/BEGINNER CONCERNS:
"I completely understand that starting can feel overwhelming. That's exactly why we focus on creating a supportive, non-judgmental environment. Many of our most successful members started exactly where you are now, and our coaches are experts at meeting you where you are."

TIME CONSTRAINTS:
"I hear this concern a lot! The good news is that even 30 minutes, 3 times a week can create amazing results when you have the right plan. Let's talk about what schedule would work for your lifestyle - we're very flexible with our approach."

NOT READY/NEED TO THINK:
"I completely understand wanting to make the right decision. What specific concerns do you have? I'd rather address them now than have you wonder about them later."

PAST BAD EXPERIENCES:
"I'm sorry you had that experience. That's actually one of the main reasons people choose Atlas Fitness - we focus on creating a completely different experience. What would need to be different for you to feel confident this time?"

TOO BUSY/NO TIME:
"I get it - life is hectic! That's exactly why our members love our approach. We work with your schedule, not against it. Even our busiest members see amazing results. What if we could show you how to get better results in less time than you're spending now?"

GENERAL FRAMEWORK:
1. Listen completely
2. Acknowledge their concern
3. Share how others felt the same way
4. Redirect to benefits
5. Ask for the next step`
  },

  qualification_criteria: {
    data_type: 'qualification_criteria',
    content: `Atlas Fitness Lead Qualification Criteria:

QUALIFIED LEAD INDICATORS:
✅ Specific fitness goals mentioned
✅ Realistic timeline (starting within 1-4 weeks)
✅ Acknowledges need for help/guidance
✅ Shows interest in consultation
✅ Asks about process or next steps
✅ Responds promptly to messages
✅ Located in York or Harrogate area

QUALIFICATION QUESTIONS:
1. Goals: "What are your main fitness goals?"
2. Timeline: "When are you looking to get started?"
3. Experience: "What's your current fitness background?"
4. Commitment: "How many days per week can you commit?"
5. Location: "Are you based in York or Harrogate?"

LEAD SCORING:
HIGH PRIORITY (Book Immediately):
- Specific goals + Ready to start soon + Previous gym experience + High commitment

MEDIUM PRIORITY (Nurture):
- General goals + Flexible timeline + Some barriers to address

LOW PRIORITY (Long-term follow-up):
- Vague goals + No clear timeline + Significant objections

DISQUALIFICATION CRITERIA:
❌ Outside service area
❌ Looking for free/very cheap options only
❌ Not willing to commit to any schedule
❌ Unrealistic expectations
❌ Rude or inappropriate behavior

BOOKING TRIGGERS:
- Asks about pricing and doesn't object
- Mentions previous unsuccessful attempts
- Shows urgency ("I want to start ASAP")
- Asks about availability
- References specific results they want`
  },

  sop: {
    data_type: 'sop',
    content: `Atlas Fitness Standard Operating Procedures:

RESPONSE TIMES:
- Initial WhatsApp response: Within 5 minutes during business hours
- Follow-up messages: Within 2 hours during business hours
- Booking confirmations: Immediate
- After-hours: Next business day morning

CONVERSATION FLOW:
1. Warm greeting and thank them for reaching out
2. Ask about their fitness goals
3. Qualify their needs and timeline
4. Address any concerns or objections
5. Explain our approach and benefits
6. Offer consultation booking
7. Confirm booking details
8. Send reminder before consultation

CONSULTATION BOOKING:
- Default: 10 AM time slots
- Duration: 30 minutes
- Confirm: Day, time, location
- Send calendar invite if email provided
- Set reminders: 24 hours and 1 hour before

MESSAGE TONE:
- Professional but friendly
- Encouraging and supportive
- Focus on their goals and benefits
- Use their name when known
- End with questions to keep conversation flowing

FOLLOW-UP SEQUENCE:
- No response after 24 hours: Send value-driven follow-up
- No response after 72 hours: Share success story
- No response after 1 week: Send special offer
- Monthly check-in for long-term nurturing

LEAD STATUS MANAGEMENT:
New → Contacted → Engaged → Qualified → Booked → Attended → Member

QUALITY STANDARDS:
- Every message adds value
- Personalized responses (not templates)
- Address specific concerns mentioned
- Always include next step or question
- Professional grammar and spelling

DATA TRACKING:
- Source of lead
- Response times
- Conversion rates
- Objections encountered
- Booking success rate`
  }
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get user's organization
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      return NextResponse.json({
        error: 'User profile not found'
      }, { status: 404 });
    }

    // Clear existing training data for this organization
    const { error: deleteError } = await supabase
      .from('training_data')
      .delete()
      .eq('organization_id', userProfile.organization_id);

    if (deleteError) {
      console.error('Error clearing existing training data:', deleteError);
    }

    // Insert all Atlas Fitness training data
    const insertPromises = Object.values(ATLAS_TRAINING_DATA).map(async (trainingItem, index) => {
      return supabase
        .from('training_data')
        .insert({
          organization_id: userProfile.organization_id,
          data_type: trainingItem.data_type,
          content: trainingItem.content,
          version: 1,
          is_active: true
        });
    });

    const results = await Promise.all(insertPromises);
    
    // Check for any errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Some training data failed to insert:', errors);
      return NextResponse.json({
        error: 'Some training data failed to restore',
        details: errors.map(e => e.error?.message),
        partialSuccess: true,
        restoredCount: results.length - errors.length,
        totalCount: results.length
      }, { status: 207 });
    }

    console.log('✅ Atlas Fitness training data restored successfully');

    return NextResponse.json({
      success: true,
      message: 'Atlas Fitness training data restored successfully',
      restoredCount: results.length,
      dataTypes: Object.keys(ATLAS_TRAINING_DATA),
      details: {
        business_info: 'Atlas Fitness business information and pricing',
        sales_script: 'Sales scripts and conversation frameworks',
        objection_handling: 'Objection handling responses',
        qualification_criteria: 'Lead qualification framework',
        sop: 'Standard operating procedures'
      }
    });

  } catch (error) {
    console.error('Error restoring training data:', error);
    return NextResponse.json({
      error: 'Failed to restore training data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Atlas Fitness Training Data Restoration Endpoint',
    description: 'POST to this endpoint to restore all Atlas Fitness training data',
    dataTypes: Object.keys(ATLAS_TRAINING_DATA),
    timestamp: new Date().toISOString()
  });
}