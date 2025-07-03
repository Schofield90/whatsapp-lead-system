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

    // For now, we'll simulate sending a test message
    // In production, this would integrate with Twilio
    
    console.log(`Test message to ${phone}: ${message}`);
    
    // You could add logic here to:
    // 1. Create a test conversation
    // 2. Log the test message
    // 3. Actually send via Twilio if configured

    return NextResponse.json({ 
      success: true, 
      message: 'Test message sent successfully',
      note: 'This is a test message. In production, this would be sent via WhatsApp.'
    });
  } catch (error) {
    console.error('Error in POST /api/messages/test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}