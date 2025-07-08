import Anthropic from '@anthropic-ai/sdk';
import { getRelevantKnowledge, formatKnowledgeForAI, getRandomQuizQuestion } from '@/lib/knowledge';

// Lazy initialization of Anthropic client to avoid build-time errors
let anthropic: Anthropic | null = null;

function getAnthropicClient() {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY must be set in environment variables');
    }
    
    anthropic = new Anthropic({
      apiKey: apiKey,
    });
  }
  return anthropic;
}

/**
 * Get AI response from Anthropic Claude
 * @param message - User's message
 * @param phoneNumber - User's phone number for context
 * @returns Promise with Claude's response
 */
export async function getClaudeResponse(
  message: string,
  phoneNumber: string
): Promise<string> {
  try {
    // Step 1: Fetch relevant knowledge from Supabase based on user message
    console.log('Fetching relevant knowledge for user message...');
    const relevantKnowledge = await getRelevantKnowledge(message);
    
    // Step 2: Format knowledge entries for AI context
    const knowledgeContext = formatKnowledgeForAI(relevantKnowledge);
    
    // Step 3: Check if user is requesting a quiz or asking quiz-related questions
    const isQuizRequest = message.toLowerCase().includes('quiz') || 
                         message.toLowerCase().includes('test') || 
                         message.toLowerCase().includes('challenge');
    
    // Step 4: Create enhanced system prompt with gym business knowledge
    const systemPrompt = `You are a gym business WhatsApp chatbot assistant. 
    You represent a fitness gym and help customers with inquiries about memberships, services, and general gym information.
    Keep responses concise and friendly, suitable for WhatsApp messaging.
    The user is messaging from phone number: ${phoneNumber}
    
    IMPORTANT: Use the gym business knowledge provided below to answer questions accurately.
    ${knowledgeContext}
    
    Special Instructions:
    - SOPs (Standard Operating Procedures): Follow these step-by-step processes when handling specific situations
    - Quiz Content: Use this fitness knowledge for educational conversations and to create engaging interactions
    - If user asks for a quiz or fitness challenge, you can reference the quiz questions to create an interactive experience
    
    Guidelines:
    - Keep responses under 300 characters when possible
    - Use a conversational, friendly tone appropriate for a gym
    - Always refer to the gym business knowledge above when answering questions
    - Follow SOPs precisely when handling membership inquiries, complaints, or onboarding
    - If information isn't in the knowledge base, say you'll get back to them
    - Focus on being helpful and encouraging about fitness goals
    - Offer to book appointments or tours when appropriate
    - Ask clarifying questions if needed
    - When appropriate, engage users with fitness tips or quiz questions to keep them interested`;

    console.log('Generating AI response with gym business context...');
    
    const anthropicClient = getAnthropicClient();
    const response = await anthropicClient.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
    });

    // Extract the text content from Claude's response
    const textContent = response.content.find(
      (content) => content.type === 'text'
    );

    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    console.log('Claude response generated successfully');
    return textContent.text;

  } catch (error) {
    console.error('Error getting Claude response:', error);
    
    // Return a fallback message if Claude fails
    return "I'm sorry, I'm having trouble processing your message right now. Please try again later.";
  }
}

export default getAnthropicClient;