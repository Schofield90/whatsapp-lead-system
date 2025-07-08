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

    // Try to use the training_data table directly with service role (bypasses RLS)
    // Only use columns that exist in the actual table
    const { data: savedEntry, error: saveError } = await supabase
      .from('training_data')
      .insert({
        organization_id: '00000000-0000-0000-0000-000000000000', // Use a default org ID for now
        data_type,
        content: `Category: ${category || 'general'}\nQuestion: ${question || ''}\nAnswer: ${content}`,
        is_active: true,
        version: 1
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving to training_data table:', saveError);
      
      // If training_data table doesn't exist, log that we need to create it
      if (saveError.code === '42P01') { // Table doesn't exist
        return NextResponse.json({
          error: 'Training data table does not exist',
          details: 'Need to create training_data table in Supabase',
          create_table_needed: true
        }, { status: 400 });
      }
      
      return NextResponse.json({
        error: 'Failed to save training data',
        details: saveError.message,
        code: saveError.code
      }, { status: 500 });
    }

    // Get count of all training data entries
    const { data: allTrainingEntries } = await supabase
      .from('training_data')
      .select('id')
      .eq('is_active', true);

    const totalCount = allTrainingEntries?.length || 1;

    console.log('🎯 Training data saved to database:', {
      id: savedEntry.id,
      data_type,
      category,
      content: content.substring(0, 100) + '...',
      total_entries: totalCount
    });

    return NextResponse.json({
      success: true,
      message: `Training data saved to database! You now have ${totalCount} entries.`,
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