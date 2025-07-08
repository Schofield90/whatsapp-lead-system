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
    
    // Define question categories and templates
    const questionCategories = [
      'membership_policies',
      'pricing_strategies', 
      'equipment_management',
      'class_scheduling',
      'customer_service',
      'safety_protocols',
      'staff_management',
      'marketing_approach',
      'facility_operations',
      'member_retention'
    ];
    
    // Select category (rotate through different areas)
    const categoryIndex = previousQuestions % questionCategories.length;
    const selectedCategory = questionCategories[categoryIndex];
    
    // Create prompt for Claude to generate relevant questions
    const questionPrompt = `You are helping train a gym business AI by generating specific questions about gym operations. 
    
    Generate ONE specific, actionable question about: ${selectedCategory}
    
    The question should:
    - Be specific to gym business operations
    - Help gather practical knowledge that would help an AI assistant
    - Focus on real situations a gym owner faces
    - Be answerable with concrete, actionable information
    - Help the AI better serve gym customers and members
    
    Categories to focus on:
    - membership_policies: Membership rules, cancellation policies, payment terms
    - pricing_strategies: How pricing is structured, discounts, promotions
    - equipment_management: Maintenance schedules, replacement policies, safety checks
    - class_scheduling: How classes are planned, instructor management, capacity limits
    - customer_service: Handling complaints, member satisfaction, communication style
    - safety_protocols: Emergency procedures, injury protocols, equipment safety
    - staff_management: Hiring, training, scheduling, performance management
    - marketing_approach: How you attract new members, retention strategies
    - facility_operations: Opening/closing procedures, cleaning protocols, space management
    - member_retention: How you keep members engaged and reduce churn
    
    Current focus: ${selectedCategory}
    
    Return ONLY the question - no additional text or formatting.
    Make it specific and practical.`;

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
    
    // Fallback question if Claude fails
    const fallbackQuestions = [
      "How do you handle member complaints about overcrowded classes?",
      "What's your process for onboarding new personal trainers?", 
      "How do you determine when gym equipment needs maintenance or replacement?",
      "What's your approach to handling membership cancellation requests?",
      "How do you manage peak hours when the gym gets very busy?"
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