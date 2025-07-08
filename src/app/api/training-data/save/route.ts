import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { data_type, content, category, question } = await request.json();
    
    if (!data_type || !content) {
      return NextResponse.json({
        error: 'Missing required fields: data_type and content'
      }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Save directly to unified knowledge base
    const { data: savedEntry, error: saveError } = await supabase
      .from('knowledge_base')
      .insert({
        type: data_type,
        category: category || 'general',
        question: question || null,
        content: content.trim(),
        source: 'training_form',
        metadata: {
          original_endpoint: 'training-data/save',
          timestamp: new Date().toISOString()
        },
        is_active: true,
        version: 1
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving to knowledge base:', saveError);
      return NextResponse.json({
        error: 'Failed to save knowledge',
        details: saveError.message,
        code: saveError.code
      }, { status: 500 });
    }

    // Get total count
    const { data: allEntries } = await supabase
      .from('knowledge_base')
      .select('id')
      .eq('is_active', true);

    const totalCount = allEntries?.length || 1;

    console.log('🎯 Training data saved to unified knowledge base:', {
      id: savedEntry.id,
      type: data_type,
      category,
      content: content.substring(0, 100) + '...',
      total_entries: totalCount
    });

    return NextResponse.json({
      success: true,
      message: `Training data saved to knowledge base! You now have ${totalCount} entries.`,
      data: {
        id: savedEntry.id,
        data_type,
        category: category || 'general',
        content: content,
        question: question || '',
        saved_at: savedEntry.created_at
      },
      total_count: totalCount
    });

  } catch (error) {
    console.error('Error in save training data:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}