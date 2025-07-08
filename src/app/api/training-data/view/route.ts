import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Get all training data entries from training_data table using service role
    // Only select columns that exist in the actual table
    const { data: trainingEntries, error: fetchError } = await supabase
      .from('training_data')
      .select('id, data_type, content, created_at, is_active, version')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching training data:', fetchError);
      
      // If training_data table doesn't exist, log that we need to create it
      if (fetchError.code === '42P01') { // Table doesn't exist
        return NextResponse.json({
          error: 'Training data table does not exist',
          details: 'Need to create training_data table in Supabase',
          create_table_needed: true
        }, { status: 400 });
      }
      
      return NextResponse.json({
        error: 'Failed to fetch training data',
        details: fetchError.message,
        code: fetchError.code
      }, { status: 500 });
    }

    // Format the data for the frontend
    const formattedData = (trainingEntries || []).map(entry => {
      // Parse category and question from content if they're embedded
      const content = entry.content || '';
      const categoryMatch = content.match(/Category: ([^\n]+)/);
      const questionMatch = content.match(/Question: ([^\n]+)/);
      const answerMatch = content.match(/Answer: ([\s\S]+)$/);
      
      return {
        id: entry.id,
        data_type: entry.data_type,
        category: categoryMatch ? categoryMatch[1] : 'general',
        content: answerMatch ? answerMatch[1] : content,
        question: questionMatch ? questionMatch[1] : '',
        saved_at: entry.created_at
      };
    });

    const count = formattedData.length;
    
    console.log(`📖 Fetching training data from database: ${count} entries found`);
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      count: count,
      message: `Found ${count} training data entries in database`
    });
  } catch (error) {
    console.error('Error viewing training data:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}