import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const userProfile = await getUserProfile();
    
    if (!userProfile?.profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json({ error: 'Phone and message are required' }, { status: 400 });
    }

    // For now, we'll simulate sending a manual message
    // In production, this would integrate with Twilio WhatsApp API
    
    console.log(`Manual message to ${phone}: ${message}`);
    
    // You could add logic here to:
    // 1. Actually send via Twilio WhatsApp API
    // 2. Create/find a conversation record
    // 3. Log the message in the database
    // 4. Trigger AI response if needed

    return NextResponse.json({ 
      success: true, 
      message: 'Manual message sent successfully',
      note: 'This is a simulated send. In production, this would be sent via WhatsApp Business API.'
    });
  } catch (error) {
    console.error('Error in POST /api/messages/manual:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}