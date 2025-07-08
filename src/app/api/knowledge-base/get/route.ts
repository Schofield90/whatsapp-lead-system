import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Get all active knowledge from the unified knowledge base
    const { data: knowledgeEntries, error: fetchError } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching knowledge base:', fetchError);
      
      // If knowledge_base table doesn't exist, create it
      if (fetchError.code === '42P01') {
        return NextResponse.json({
          error: 'Knowledge base table does not exist',
          details: 'Will be created on first save',
          create_table_needed: true,
          data: [],
          count: 0
        }, { status: 200 });
      }
      
      return NextResponse.json({
        error: 'Failed to fetch knowledge base',
        details: fetchError.message,
        code: fetchError.code
      }, { status: 500 });
    }

    const count = knowledgeEntries?.length || 0;
    
    console.log(`🧠 Fetching unified knowledge base: ${count} entries found`);
    
    // Group by type for statistics
    const typeBreakdown = (knowledgeEntries || []).reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by category for better organization
    const categoryBreakdown = (knowledgeEntries || []).reduce((acc, entry) => {
      const category = entry.category || 'general';
      if (!acc[category]) acc[category] = [];
      acc[category].push(entry);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      success: true,
      data: knowledgeEntries || [],
      count: count,
      statistics: {
        total_entries: count,
        type_breakdown: typeBreakdown,
        category_breakdown: Object.keys(categoryBreakdown).reduce((acc, cat) => {
          acc[cat] = categoryBreakdown[cat].length;
          return acc;
        }, {} as Record<string, number>)
      },
      message: `Found ${count} knowledge entries in unified knowledge base`
    });
  } catch (error) {
    console.error('Error getting knowledge base:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}