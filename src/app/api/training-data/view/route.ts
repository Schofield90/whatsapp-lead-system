import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Redirect to unified knowledge base API
    const knowledgeBaseResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/knowledge-base/get`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await knowledgeBaseResponse.json();

    if (!knowledgeBaseResponse.ok) {
      return NextResponse.json({
        error: 'Failed to fetch from knowledge base',
        details: result.error || 'Unknown error'
      }, { status: knowledgeBaseResponse.status });
    }

    // Format the data for backward compatibility with the training data view
    const formattedData = (result.data || []).map((entry: any) => ({
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