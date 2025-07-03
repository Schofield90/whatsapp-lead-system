import Anthropic from '@anthropic-ai/sdk';
import { Database } from '@/types/database';

export function getClaudeClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }
  
  return new Anthropic({
    apiKey: apiKey,
  });
}

export interface ConversationContext {
  lead: Database['public']['Tables']['leads']['Row'];
  conversation: Database['public']['Tables']['conversations']['Row'];
  messages: Database['public']['Tables']['messages']['Row'][];
  trainingData: Database['public']['Tables']['training_data']['Row'][];
  organization: Database['public']['Tables']['organizations']['Row'];
}

export async function processConversationWithClaude(
  context: ConversationContext,
  newMessage: string
): Promise<{
  response: string;
  shouldBookCall: boolean;
  leadQualified: boolean;
  suggestedActions: string[];
}> {
  const client = getClaudeClient();
  
  // Build the system prompt with organization-specific training data
  const systemPrompt = buildSystemPrompt(context);
  
  // Build conversation history
  const conversationHistory = context.messages
    .map(msg => `${msg.direction === 'inbound' ? 'Customer' : 'Agent'}: ${msg.content}`)
    .join('\n');
  
  const userPrompt = `
Previous conversation:
${conversationHistory}

New customer message: ${newMessage}

Respond as a helpful gym sales agent. Assess if the customer is ready to book a call and provide appropriate next steps.
`;

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : 'Unable to process response';

    // Simple logic to determine if customer is ready to book
    const shouldBookCall = responseText.toLowerCase().includes('book') || 
                          responseText.toLowerCase().includes('schedule') ||
                          responseText.toLowerCase().includes('appointment');

    const leadQualified = context.messages.length > 3 && 
                         responseText.toLowerCase().includes('qualified');

    return {
      response: responseText,
      shouldBookCall,
      leadQualified,
      suggestedActions: shouldBookCall ? ['book_call'] : ['continue_conversation'],
    };
  } catch (error) {
    console.error('Error processing with Claude:', error);
    throw error;
  }
}

function buildSystemPrompt(context: ConversationContext): string {
  const { organization, trainingData, lead } = context;
  
  let systemPrompt = `You are a professional gym sales agent for ${organization.name}. 
Your goal is to qualify leads and book consultations for potential gym members.

Lead Information:
- Name: ${lead.name}
- Phone: ${lead.phone}
- Email: ${lead.email || 'Not provided'}
- Status: ${lead.status}

`;

  // Add training data specific to the organization
  trainingData.forEach(data => {
    switch (data.data_type) {
      case 'sales_script':
        systemPrompt += `\nSales Script:\n${data.content}\n`;
        break;
      case 'objection_handling':
        systemPrompt += `\nObjection Handling:\n${data.content}\n`;
        break;
      case 'qualification_criteria':
        systemPrompt += `\nQualification Criteria:\n${data.content}\n`;
        break;
    }
  });

  systemPrompt += `
Guidelines:
- Be conversational and friendly
- Ask qualifying questions to understand their fitness goals
- Address objections professionally
- When the lead is qualified and interested, offer to book a consultation
- Keep responses concise and focused
- Always end with a question to keep the conversation flowing
`;

  return systemPrompt;
}