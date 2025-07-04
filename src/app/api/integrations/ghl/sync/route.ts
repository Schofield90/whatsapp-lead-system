import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { action, leadId, data } = await request.json();
    
    console.log('🔄 GHL sync request:', { action, leadId });
    
    const supabase = createServiceClient();
    
    // Get lead with GHL contact ID
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*, ghl_contact_id')
      .eq('id', leadId)
      .single();
    
    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    
    if (!lead.ghl_contact_id) {
      return NextResponse.json({ error: 'Lead not linked to GHL contact' }, { status: 400 });
    }
    
    const ghlApiKey = process.env.GHL_API_KEY;
    const ghlLocation = process.env.GHL_LOCATION_ID;
    
    if (!ghlApiKey) {
      return NextResponse.json({ error: 'GHL API key not configured' }, { status: 501 });
    }
    
    switch (action) {
      case 'updateStatus':
        await updateGHLContactStatus(lead, data.status, ghlApiKey, ghlLocation);
        break;
        
      case 'addNote':
        await addGHLNote(lead, data.note, ghlApiKey, ghlLocation);
        break;
        
      case 'updateCustomField':
        await updateGHLCustomField(lead, data.field, data.value, ghlApiKey, ghlLocation);
        break;
        
      case 'createTask':
        await createGHLTask(lead, data.task, ghlApiKey, ghlLocation);
        break;
        
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ GHL sync error:', error);
    return NextResponse.json({
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function updateGHLContactStatus(lead: any, status: string, apiKey: string, locationId: string) {
  const ghlApiUrl = `https://services.leadconnectorhq.com/contacts/${lead.ghl_contact_id}`;
  
  const response = await fetch(ghlApiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    },
    body: JSON.stringify({
      tags: [status],
      customFields: {
        whatsapp_status: status,
        last_whatsapp_contact: new Date().toISOString()
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`GHL API error: ${response.status}`);
  }
  
  console.log('✅ Updated GHL contact status');
}

async function addGHLNote(lead: any, note: string, apiKey: string, locationId: string) {
  const ghlApiUrl = `https://services.leadconnectorhq.com/contacts/${lead.ghl_contact_id}/notes`;
  
  const response = await fetch(ghlApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    },
    body: JSON.stringify({
      body: `[WhatsApp AI] ${note}`,
      userId: 'whatsapp-ai-system'
    })
  });
  
  if (!response.ok) {
    throw new Error(`GHL API error: ${response.status}`);
  }
  
  console.log('✅ Added note to GHL contact');
}

async function updateGHLCustomField(lead: any, field: string, value: string, apiKey: string, locationId: string) {
  const ghlApiUrl = `https://services.leadconnectorhq.com/contacts/${lead.ghl_contact_id}`;
  
  const response = await fetch(ghlApiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    },
    body: JSON.stringify({
      customFields: {
        [field]: value
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`GHL API error: ${response.status}`);
  }
  
  console.log('✅ Updated GHL custom field');
}

async function createGHLTask(lead: any, task: any, apiKey: string, locationId: string) {
  const ghlApiUrl = `https://services.leadconnectorhq.com/contacts/${lead.ghl_contact_id}/tasks`;
  
  const response = await fetch(ghlApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    },
    body: JSON.stringify({
      title: task.title,
      body: task.description,
      dueDate: task.dueDate,
      assignedTo: task.assignedTo
    })
  });
  
  if (!response.ok) {
    throw new Error(`GHL API error: ${response.status}`);
  }
  
  console.log('✅ Created GHL task');
}