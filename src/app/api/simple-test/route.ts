import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Step 1: Try to read an organization directly
    console.log('Step 1: Reading organizations...');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    if (orgError) {
      return NextResponse.json({
        step: 1,
        error: 'Failed to read organizations',
        details: orgError.message
      }, { status: 500 });
    }

    if (!orgs || orgs.length === 0) {
      return NextResponse.json({
        step: 1,
        error: 'No organizations found'
      }, { status: 404 });
    }

    const org = orgs[0];
    console.log('Found organization:', org.id);

    // Step 2: Try to insert a simple lead
    console.log('Step 2: Creating test lead...');
    const testLead = {
      organization_id: org.id,
      name: 'Test Lead ' + Date.now(),
      phone: '+1999' + Date.now().toString().slice(-6),
      status: 'new'
    };

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert(testLead)
      .select()
      .single();
    
    if (leadError) {
      return NextResponse.json({
        step: 2,
        error: 'Failed to create lead',
        details: leadError.message,
        attempted: testLead
      }, { status: 500 });
    }

    console.log('Created lead:', lead.id);

    // Step 3: Try to create a conversation
    console.log('Step 3: Creating conversation...');
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({
        organization_id: org.id,
        lead_id: lead.id,
        status: 'active',
        channel: 'test'
      })
      .select()
      .single();

    if (convError) {
      return NextResponse.json({
        step: 3,
        error: 'Failed to create conversation',
        details: convError.message,
        leadId: lead.id
      }, { status: 500 });
    }

    // Clean up - delete test data
    await supabase.from('conversations').delete().eq('id', conv.id);
    await supabase.from('leads').delete().eq('id', lead.id);

    return NextResponse.json({
      success: true,
      message: 'All steps completed successfully',
      organizationId: org.id,
      leadId: lead.id,
      conversationId: conv.id
    });

  } catch (error) {
    console.error('Simple test error:', error);
    return NextResponse.json({
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}