import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const phoneNumber = '+447450308627';
    
    // Check if lead exists
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        *,
        organization:organizations(*),
        conversations(*)
      `)
      .eq('phone', phoneNumber);
    
    if (leadsError) {
      return NextResponse.json({ error: 'Database error', details: leadsError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      phoneNumber,
      leads: leads || [],
      leadCount: leads?.length || 0,
      message: leads?.length > 0 ? 'Lead found' : 'No leads found for this phone number'
    });
    
  } catch (error) {
    console.error('Error checking lead:', error);
    return NextResponse.json({
      error: 'Failed to check lead',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}