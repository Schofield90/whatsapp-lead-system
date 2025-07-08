import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    
    // Check if knowledge_base table exists and get all data
    const { data: knowledgeBase, error: kbError } = await supabase
      .from('knowledge_base')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Also check training_data table for comparison
    const { data: trainingData, error: tdError } = await supabase
      .from('training_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    const response = {
      timestamp: new Date().toISOString(),
      knowledge_base: {
        exists: !kbError || kbError.code !== '42P01',
        error: kbError?.message || null,
        count: knowledgeBase?.length || 0,
        active_count: knowledgeBase?.filter(item => item.is_active)?.length || 0,
        entries: knowledgeBase || [],
        types: knowledgeBase ? [...new Set(knowledgeBase.map(item => item.type))] : [],
        categories: knowledgeBase ? [...new Set(knowledgeBase.map(item => item.category))] : []
      },
      training_data: {
        exists: !tdError || tdError.code !== '42P01',
        error: tdError?.message || null,
        count: trainingData?.length || 0,
        sample_entries: trainingData?.slice(0, 3) || []
      },
      summary: {
        has_business_data: (knowledgeBase?.length || 0) > 0,
        ai_will_work: (knowledgeBase?.filter(item => item.is_active)?.length || 0) > 0
      }
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to debug knowledge base',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}