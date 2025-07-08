import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Get all knowledge from the unified knowledge base directly
    const { data: knowledgeEntries, error: fetchError } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching knowledge base:', fetchError);
      
      // If knowledge_base table doesn't exist yet, return empty
      if (fetchError.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: [],
          count: 0,
          message: 'Knowledge base not yet created'
        });
      }
      
      return NextResponse.json({
        error: 'Failed to fetch knowledge base',
        details: fetchError.message,
        code: fetchError.code
      }, { status: 500 });
    }

    // Format the data for backward compatibility with the training data view
    const formattedData = (knowledgeEntries || []).map((entry: any) => ({
      id: entry.id,
      data_type: entry.type,
      category: entry.category || 'general',
      content: entry.content,
      question: entry.question || '',
      saved_at: entry.created_at
    }));

    const count = formattedData.length;
    
    console.log(`📖 Fetching training data from unified knowledge base: ${count} entries found`);
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      count: count,
      message: `Found ${count} training data entries in knowledge base`
    });
  } catch (error) {
    console.error('Error viewing training data:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}