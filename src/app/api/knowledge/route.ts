import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeByType, addKnowledgeEntry, KNOWLEDGE_TYPES } from '@/lib/knowledge';

/**
 * GET /api/knowledge - Fetch knowledge entries
 * Query params: ?type=faq,sop (optional, comma-separated types)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type');
    
    // Parse types from query parameter
    const types = typeParam ? typeParam.split(',').map(t => t.trim()) : undefined;
    
    console.log('Fetching knowledge entries, types:', types);
    
    // Fetch knowledge entries from Supabase
    const knowledge = await getKnowledgeByType(types);
    
    return NextResponse.json({
      success: true,
      data: knowledge,
      count: knowledge.length,
      availableTypes: Object.values(KNOWLEDGE_TYPES)
    });
    
  } catch (error) {
    console.error('Error fetching knowledge:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch knowledge entries'
    }, { status: 500 });
  }
}

/**
 * POST /api/knowledge - Add new knowledge entry
 * Body: { type: string, content: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { type, content } = await request.json();
    
    // Validate required fields
    if (!type || !content) {
      return NextResponse.json({
        success: false,
        error: 'Type and content are required'
      }, { status: 400 });
    }
    
    // Validate type
    if (!Object.values(KNOWLEDGE_TYPES).includes(type)) {
      return NextResponse.json({
        success: false,
        error: `Invalid type. Must be one of: ${Object.values(KNOWLEDGE_TYPES).join(', ')}`
      }, { status: 400 });
    }
    
    console.log('Adding new knowledge entry:', { type, content: content.substring(0, 100) + '...' });
    
    // Add knowledge entry to Supabase
    const newEntry = await addKnowledgeEntry(type, content);
    
    if (!newEntry) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create knowledge entry'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: newEntry,
      message: 'Knowledge entry created successfully'
    });
    
  } catch (error) {
    console.error('Error adding knowledge:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add knowledge entry'
    }, { status: 500 });
  }
}