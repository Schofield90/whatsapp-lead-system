import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get or create an organization first
    const { data: orgs } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    let organizationId;
    if (orgs && orgs.length > 0) {
      organizationId = orgs[0].id;
    } else {
      // Create a test organization
      const { data: newOrg } = await supabase
        .from('organizations')
        .insert({
          name: 'Test Organization',
          domain: 'test.com',
          settings: {}
        })
        .select()
        .single();
      
      organizationId = newOrg?.id;
    }
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Could not create/find organization' }, { status: 500 });
    }
    
    // Create test lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        organization_id: organizationId,
        name: 'Test Lead',
        phone: '+447450308627', // Your phone number
        email: 'test@example.com',
        status: 'new'
      })
      .select()
      .single();
    
    if (leadError) {
      return NextResponse.json({ error: 'Failed to create lead', details: leadError.message }, { status: 500 });
    }
    
    // Create active conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        organization_id: organizationId,
        lead_id: lead.id,
        status: 'active',
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (convError) {
      return NextResponse.json({ error: 'Failed to create conversation', details: convError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        status: lead.status
      },
      conversation: {
        id: conversation.id,
        status: conversation.status
      }
    });
    
  } catch (error) {
    console.error('Error creating test lead:', error);
    return NextResponse.json({
      error: 'Failed to create test lead',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Create Test Lead Endpoint',
    usage: 'POST to create a test lead for phone +447450308627'
  });
}