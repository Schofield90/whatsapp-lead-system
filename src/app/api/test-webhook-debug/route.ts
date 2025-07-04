import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const rawFrom = params.get('From') || '';
    const from = rawFrom.replace('whatsapp:', '');
    
    const supabase = await createClient();
    
    // Check what's in the database
    const { data: allLeads } = await supabase.from('leads').select('phone');
    const phoneNumbers = allLeads?.map(l => l.phone) || [];
    
    // Try to find the lead
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', from)
      .single();
    
    return NextResponse.json({
      receivedPhone: from,
      rawFrom,
      allPhonesInDB: phoneNumbers,
      leadFound: !!lead,
      lead: lead || null,
      message: 'Debug info for webhook phone matching'
    });
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Error in webhook debug'
    }, { status: 500 });
  }
}