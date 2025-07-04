import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();
    
    console.log('🔗 GHL Webhook received:', body);
    
    // Verify webhook signature if provided
    const signature = request.headers.get('x-ghl-signature');
    const webhookSecret = process.env.GHL_WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      // Add signature verification here if needed
      console.log('📝 Webhook signature verification needed');
    }
    
    // Handle different GHL webhook types
    const eventType = body.type || body.event_type;
    
    switch (eventType) {
      case 'ContactCreate':
      case 'contact.created':
        await handleNewContact(body, supabase);
        break;
        
      case 'AppointmentCreate':
      case 'appointment.created':
        await handleNewAppointment(body, supabase);
        break;
        
      case 'OpportunityStatusUpdate':
      case 'opportunity.updated':
        await handleOpportunityUpdate(body, supabase);
        break;
        
      default:
        console.log('📄 Unknown webhook type:', eventType);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });
    
  } catch (error) {
    console.error('❌ GHL webhook error:', error);
    return NextResponse.json({
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleNewContact(data: any, supabase: any) {
  console.log('👤 Processing new GHL contact:', data.contact?.email);
  
  try {
    // Extract contact information from GHL webhook
    const contact = data.contact || data;
    const ghlContactId = contact.id;
    const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    const email = contact.email;
    const phone = contact.phone;
    
    if (!phone || !email) {
      console.log('⚠️ Missing phone or email, skipping contact');
      return;
    }
    
    // Check if we already have this contact
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .or(`email.eq.${email},phone.eq.${phone}`)
      .single();
    
    if (existingLead) {
      console.log('📱 Contact already exists, updating GHL ID');
      await supabase
        .from('leads')
        .update({ 
          ghl_contact_id: ghlContactId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLead.id);
      return;
    }
    
    // Create new lead in our system
    const { data: newLead, error } = await supabase
      .from('leads')
      .insert({
        name: name || 'Unknown',
        email: email,
        phone: phone,
        source: 'ghl_webhook',
        status: 'new',
        ghl_contact_id: ghlContactId,
        metadata: {
          ghl_data: contact,
          imported_from: 'ghl_webhook'
        }
      })
      .select()
      .single();
    
    if (error) {
      throw new Error('Failed to create lead: ' + error.message);
    }
    
    console.log('✅ Created new lead from GHL:', newLead.id);
    
    // TODO: Trigger initial WhatsApp message
    // This would call your WhatsApp API to send the first message
    
  } catch (error) {
    console.error('❌ Error processing contact:', error);
  }
}

async function handleNewAppointment(data: any, supabase: any) {
  console.log('📅 Processing new GHL appointment:', data);
  
  try {
    const appointment = data.appointment || data;
    const ghlContactId = appointment.contactId;
    const appointmentId = appointment.id;
    
    // Find the lead in our system
    const { data: lead } = await supabase
      .from('leads')
      .select('id, organization_id')
      .eq('ghl_contact_id', ghlContactId)
      .single();
    
    if (!lead) {
      console.log('⚠️ Lead not found for appointment, skipping');
      return;
    }
    
    // Create booking record
    const { error } = await supabase
      .from('bookings')
      .insert({
        lead_id: lead.id,
        organization_id: lead.organization_id,
        scheduled_at: appointment.startTime,
        title: appointment.title || 'GHL Appointment',
        status: 'scheduled',
        ghl_appointment_id: appointmentId,
        meeting_link: appointment.meetingLink,
        metadata: {
          ghl_data: appointment,
          source: 'ghl_webhook'
        }
      });
    
    if (error) {
      throw new Error('Failed to create booking: ' + error.message);
    }
    
    console.log('✅ Created booking from GHL appointment');
    
    // TODO: Send WhatsApp confirmation message
    
  } catch (error) {
    console.error('❌ Error processing appointment:', error);
  }
}

async function handleOpportunityUpdate(data: any, supabase: any) {
  console.log('💼 Processing GHL opportunity update:', data);
  
  try {
    const opportunity = data.opportunity || data;
    const ghlContactId = opportunity.contactId;
    const status = opportunity.status;
    
    // Update lead status in our system
    const { error } = await supabase
      .from('leads')
      .update({
        status: mapGHLStatusToOurStatus(status),
        updated_at: new Date().toISOString()
      })
      .eq('ghl_contact_id', ghlContactId);
    
    if (error) {
      throw new Error('Failed to update lead status: ' + error.message);
    }
    
    console.log('✅ Updated lead status from GHL opportunity');
    
  } catch (error) {
    console.error('❌ Error processing opportunity:', error);
  }
}

function mapGHLStatusToOurStatus(ghlStatus: string): string {
  // Map GHL opportunity statuses to our lead statuses
  const statusMap: { [key: string]: string } = {
    'new': 'new',
    'contacted': 'contacted',
    'qualified': 'qualified',
    'proposal': 'proposal_sent',
    'negotiation': 'negotiating',
    'closed_won': 'converted',
    'closed_lost': 'lost',
    'follow_up': 'follow_up'
  };
  
  return statusMap[ghlStatus.toLowerCase()] || 'new';
}