import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Get existing training data from old table
    const { data: oldTrainingData, error: fetchError } = await supabase
      .from('training_data')
      .select('*')
      .eq('is_active', true);

    if (fetchError) {
      console.log('No old training data to migrate:', fetchError.message);
      return NextResponse.json({
        success: true,
        message: 'No old training data found to migrate',
        migrated: 0
      });
    }

    if (!oldTrainingData || oldTrainingData.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No training data to migrate',
        migrated: 0
      });
    }

    // Migrate each entry to the unified knowledge base
    const migratedEntries = [];
    
    for (const entry of oldTrainingData) {
      // Parse the old format
      const content = entry.content || '';
      const categoryMatch = content.match(/Category: ([^\n]+)/);
      const questionMatch = content.match(/Question: ([^\n]+)/);
      const answerMatch = content.match(/Answer: ([\s\S]+)$/);
      
      const category = categoryMatch ? categoryMatch[1] : 'general';
      const question = questionMatch ? questionMatch[1] : null;
      const answer = answerMatch ? answerMatch[1] : content;

      // Save to unified knowledge base via API
      const knowledgeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/knowledge-base/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: entry.data_type || 'sop',
          category: category,
          question: question,
          content: answer.trim(),
          source: 'migration_from_training_data',
          metadata: {
            original_id: entry.id,
            original_created_at: entry.created_at,
            migrated_at: new Date().toISOString()
          }
        }),
      });

      if (knowledgeResponse.ok) {
        const result = await knowledgeResponse.json();
        migratedEntries.push(result.data);
        console.log(`✅ Migrated entry ${entry.id} -> ${result.data?.id}`);
      } else {
        console.error(`❌ Failed to migrate entry ${entry.id}`);
      }
    }

    console.log(`🔄 Migration complete: ${migratedEntries.length}/${oldTrainingData.length} entries migrated`);

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${migratedEntries.length} training data entries to unified knowledge base`,
      migrated: migratedEntries.length,
      total_attempted: oldTrainingData.length,
      migrated_entries: migratedEntries
    });

  } catch (error) {
    console.error('Error in migration:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}