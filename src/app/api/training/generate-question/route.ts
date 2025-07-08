import { NextRequest, NextResponse } from 'next/server';
import getAnthropicClient from '@/lib/anthropic';

/**
 * Generate training questions for the gym owner to answer
 * This helps build domain-specific knowledge for the AI
 */
export async function POST(request: NextRequest) {
  try {
    const { previousQuestions = 0, focusArea = 'general' } = await request.json();
    
    console.log('Generating training question, focus area:', focusArea, 'previous questions:', previousQuestions);
    
    // Define sales-focused question categories
    const questionCategories = [
      'lead_qualification',
      'objection_handling', 
      'closing_techniques',
      'pricing_conversations',
      'membership_benefits',
      'trial_conversions',
      'referral_strategies',
      'retention_sales',
      'upselling_services',
      'competitor_positioning'
    ];
    
    // Select category (rotate through different areas)
    const categoryIndex = previousQuestions % questionCategories.length;
    const selectedCategory = questionCategories[categoryIndex];
    
    // Create prompt for Claude to generate sales-focused questions
    const questionPrompt = `You are helping train a gym sales AI by generating specific questions about gym sales and lead conversion. 
    
    Generate ONE specific, actionable sales question about: ${selectedCategory}
    
    The question should:
    - Be specific to gym sales and lead conversion
    - Help gather practical sales knowledge for WhatsApp conversations
    - Focus on real sales situations a gym owner faces
    - Be answerable with concrete sales techniques and scripts
    - Help the AI better convert leads and close sales via WhatsApp
    
    Sales categories to focus on:
    - lead_qualification: How to identify serious prospects, qualifying questions, budget discovery
    - objection_handling: Common objections (price, time, location) and how to overcome them
    - closing_techniques: How to ask for the sale, creating urgency, trial closes
    - pricing_conversations: How to present pricing, justify value, handle price objections
    - membership_benefits: How to articulate benefits that matter most to prospects
    - trial_conversions: Converting trial users to paying members, follow-up strategies
    - referral_strategies: Getting referrals from existing members, referral incentives
    - retention_sales: Preventing cancellations, win-back campaigns, upgrade conversations
    - upselling_services: Selling personal training, classes, additional services
    - competitor_positioning: How to handle competitor comparisons and differentiate
    
    Current focus: ${selectedCategory}
    
    Return ONLY the question - no additional text or formatting.
    Make it specific and sales-focused.`;

    // Generate question using Claude
    const anthropicClient = getAnthropicClient();
    const response = await anthropicClient.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0.8, // Higher temperature for more creative questions
      messages: [
        {
          role: 'user',
          content: questionPrompt
        }
      ]
    });

    // Extract the question from Claude's response
    const textContent = response.content.find(
      (content) => content.type === 'text'
    );

    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    const generatedQuestion = textContent.text.trim();
    
    // Create structured question object
    const trainingQuestion = {
      id: `train_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: generatedQuestion,
      category: selectedCategory,
      context: `This question helps the AI understand ${selectedCategory.replace('_', ' ')} in your gym business.`,
      timestamp: new Date().toISOString()
    };
    
    console.log('Generated training question:', trainingQuestion);
    
    return NextResponse.json({
      success: true,
      question: trainingQuestion,
      progress: {
        currentQuestion: previousQuestions + 1,
        category: selectedCategory,
        totalCategories: questionCategories.length
      }
    });
    
  } catch (error) {
    console.error('Error generating training question:', error);
    
    // Fallback sales questions if Claude fails
    const fallbackQuestions = [
      "How do you handle price objections when a prospect says your membership is too expensive?",
      "What's your best closing technique for converting trial members to paying members?", 
      "How do you qualify leads to identify serious prospects vs browsers?",
      "What benefits do you emphasize most when selling memberships via WhatsApp?",
      "How do you handle objections about not having enough time to work out?"
    ];
    
    const randomFallback = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
    
    return NextResponse.json({
      success: true,
      question: {
        id: `fallback_${Date.now()}`,
        question: randomFallback,
        category: 'general_operations',
        context: 'This is a general gym operations question.',
        timestamp: new Date().toISOString()
      },
      fallback: true
    });
  }
}