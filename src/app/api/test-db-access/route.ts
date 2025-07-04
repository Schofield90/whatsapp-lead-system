import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServiceClient();
    
    // Test 1: Check if service client works
    const { data: allLeads, error: allLeadsError } = await supabase
      .from('leads')
      .select('phone, name, id');
    
    if (allLeadsError) {
      return NextResponse.json({ 
        error: 'Service client failed', 
        details: allLeadsError.message 
      }, { status: 500 });
    }
    
    // Test 2: Try to find the specific lead
    const testPhone = '+447450308627';
    const { data: specificLead, error: specificError } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', testPhone)
      .single();
    
    return NextResponse.json({
      serviceClientWorks: true,
      allLeads: allLeads || [],
      testPhone,
      specificLead: specificLead || null,
      specificError: specificError?.message || null,
      message: 'Database access test results'
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}