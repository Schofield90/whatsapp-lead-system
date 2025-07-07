import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';
import { getClaudeClient } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const { category, context } = await request.json();
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();

    // Get existing training data to understand what we already know
    const { data: trainingData } = await supabase
      .from('training_data')
      .select('*')
      .eq('organization_id', userProfile.profile.organization_id)
      .eq('is_active', true);

    const claude = getClaudeClient();

    // Create a system prompt for generating questions
    const systemPrompt = `You are an AI assistant helping to identify knowledge gaps for a gym/fitness business lead management system.

Current Training Data Available:
${trainingData?.map(item => `- ${item.data_type}: ${item.content.substring(0, 100)}...`).join('\n') || 'No training data available'}

Your task: Generate 3-5 specific, actionable questions that would help you better serve customers in the "${category}" category.

Context: ${context}

Guidelines:
- Ask specific questions that would help answer customer inquiries
- Focus on information that would be immediately useful for lead conversion
- Prioritize questions about pricing, services, policies, and procedures
- Make questions clear and actionable for a business owner to answer
- Format as a JSON array of objects with "question", "importance", and "why_needed" fields

Example format:
[
  {
    "question": "What are your current membership pricing tiers and what does each include?",
    "importance": "high",
    "why_needed": "Essential for answering the most common customer inquiry about pricing"
  }
]`;

    const response = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate specific questions for the category: "${category}"`
        }
      ]
    });

    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : 'Unable to generate questions';

    // Try to parse the JSON response
    let questions = [];
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: generate default questions
        questions = generateFallbackQuestions(category);
      }
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      questions = generateFallbackQuestions(category);
    }

    return NextResponse.json({
      success: true,
      category,
      questions,
      rawResponse: responseText,
      existingTrainingDataCount: trainingData?.length || 0
    });

  } catch (error) {
    console.error('AI question generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();

    // Analyze current training data to identify gaps
    const { data: trainingData } = await supabase
      .from('training_data')
      .select('data_type, content')
      .eq('organization_id', userProfile.profile.organization_id)
      .eq('is_active', true);

    const existingTypes = new Set(trainingData?.map(item => item.data_type) || []);
    
    // Define critical categories and check coverage
    const criticalCategories = [
      {
        category: 'Pricing Information',
        covered: existingTypes.has('pricing') || trainingData?.some(item => 
          item.content.toLowerCase().includes('price') || 
          item.content.toLowerCase().includes('cost') ||
          item.content.toLowerCase().includes('membership')
        ),
        importance: 'high'
      },
      {
        category: 'Services & Amenities',
        covered: existingTypes.has('services') || trainingData?.some(item => 
          item.content.toLowerCase().includes('service') || 
          item.content.toLowerCase().includes('class') ||
          item.content.toLowerCase().includes('equipment')
        ),
        importance: 'high'
      },
      {
        category: 'Location & Hours',
        covered: trainingData?.some(item => 
          item.content.toLowerCase().includes('hour') || 
          item.content.toLowerCase().includes('location') ||
          item.content.toLowerCase().includes('address')
        ),
        importance: 'high'
      },
      {
        category: 'Policies & Procedures',
        covered: existingTypes.has('sop') || trainingData?.some(item => 
          item.content.toLowerCase().includes('policy') || 
          item.content.toLowerCase().includes('cancel') ||
          item.content.toLowerCase().includes('procedure')
        ),
        importance: 'medium'
      },
      {
        category: 'Personal Training',
        covered: trainingData?.some(item => 
          item.content.toLowerCase().includes('personal training') || 
          item.content.toLowerCase().includes('trainer') ||
          item.content.toLowerCase().includes('pt ')
        ),
        importance: 'medium'
      }
    ];

    const gaps = criticalCategories.filter(cat => !cat.covered);

    return NextResponse.json({
      success: true,
      totalCategories: criticalCategories.length,
      coveredCategories: criticalCategories.filter(cat => cat.covered).length,
      identifiedGaps: gaps.length,
      gaps: gaps,
      suggestions: gaps.length > 0 
        ? 'Consider adding training data for the uncovered categories to improve AI responses'
        : 'Good coverage! Your AI has training data for all critical categories'
    });

  } catch (error) {
    console.error('Gap analysis error:', error);
    return NextResponse.json({
      error: 'Failed to analyze knowledge gaps',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateFallbackQuestions(category: string) {
  const questionMap: Record<string, any[]> = {
    'Pricing Information': [
      {
        question: "What are your current membership pricing tiers and what does each include?",
        importance: "high",
        why_needed: "Essential for answering the most common customer inquiry"
      },
      {
        question: "Do you offer any discounts, promotions, or family rates?",
        importance: "high",
        why_needed: "Helps overcome price objections and close more sales"
      },
      {
        question: "What are the joining fees, if any, and payment options available?",
        importance: "medium",
        why_needed: "Customers need complete pricing transparency"
      }
    ],
    'Services & Amenities': [
      {
        question: "What fitness equipment and amenities do you have available?",
        importance: "high",
        why_needed: "Customers want to know if you have what they need"
      },
      {
        question: "What group fitness classes do you offer and what's the schedule?",
        importance: "medium",
        why_needed: "Many customers are specifically interested in classes"
      },
      {
        question: "Do you have specialized areas like pools, saunas, or sports courts?",
        importance: "medium",
        why_needed: "Premium amenities can justify higher pricing"
      }
    ],
    'Location & Hours': [
      {
        question: "What are your operating hours for each day of the week?",
        importance: "high",
        why_needed: "Customers need to know if hours fit their schedule"
      },
      {
        question: "What is your exact address and parking situation?",
        importance: "high",
        why_needed: "Basic information customers need to visit"
      },
      {
        question: "Are there any holiday or special hour adjustments?",
        importance: "low",
        why_needed: "Helps set proper expectations year-round"
      }
    ]
  };

  return questionMap[category] || [
    {
      question: `What specific information should customers know about ${category.toLowerCase()}?`,
      importance: "medium",
      why_needed: "General information to help answer customer questions"
    }
  ];
}