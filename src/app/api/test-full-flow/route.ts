import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendWhatsAppMessage } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    
    // Step 1: Find the test lead directly
    const { data: lead } = await supabase
      .from('leads')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('phone', '+447450308627')
      .single();
    
    if (!lead) {
      return NextResponse.json({ error: 'Test lead not found' }, { status: 404 });
    }
    
    // Step 2: Get the conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('lead_id', lead.id)
      .eq('status', 'active')
      .single();
    
    if (!conversation) {
      return NextResponse.json({ error: 'No active conversation' }, { status: 404 });
    }
    
    // Step 3: Store incoming message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        direction: 'inbound',
        content: 'Test message from API',
        twilio_message_sid: 'test-' + Date.now(),
      });
    
    // Step 4: Send a simple response (bypass Claude for now)
    const responseMessage = "🎉 SUCCESS! Your WhatsApp system is working! This is an automated response from your lead conversion system.";
    
    // Step 5: Send response via WhatsApp to your personal number
    const twilioMessage = await sendWhatsAppMessage('+447490253471', responseMessage);
    
    // Step 6: Store outbound message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        direction: 'outbound',
        content: responseMessage,
        twilio_message_sid: twilioMessage.sid,
      });
    
    return NextResponse.json({
      success: true,
      message: 'Full flow test completed successfully',
      twilioMessageSid: twilioMessage.sid,
      leadId: lead.id,
      conversationId: conversation.id
    });
    
  } catch (error) {
    console.error('Full flow test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}