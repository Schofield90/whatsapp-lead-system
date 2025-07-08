import Anthropic from '@anthropic-ai/sdk';

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
    // System prompt for the WhatsApp chatbot
    const systemPrompt = `You are a helpful WhatsApp chatbot assistant. 
    Keep responses concise and friendly, suitable for WhatsApp messaging.
    The user is messaging from phone number: ${phoneNumber}
    
    Guidelines:
    - Keep responses under 300 characters when possible
    - Use a conversational, friendly tone
    - Ask clarifying questions if needed
    - Provide helpful and accurate information
    - If you don't know something, say so politely`;

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