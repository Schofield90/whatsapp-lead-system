import Anthropic from '@anthropic-ai/sdk';
import { Database } from '@/types/database';
import { createServiceClient } from '@/lib/supabase/server';

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
  callTranscripts?: Array<{
    raw_transcript: string;
    sentiment?: string;
    sales_insights?: any;
    created_at: string;
  }>;
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
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
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
  const { organization, trainingData, lead, callTranscripts } = context;
  
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
      case 'sop':
        systemPrompt += `\nStandard Operating Procedures:\n${data.content}\n`;
        break;
    }
  });

  // Add insights from call transcripts
  if (callTranscripts && callTranscripts.length > 0) {
    systemPrompt += `\n=== CALL TRANSCRIPTION INSIGHTS ===\n`;
    systemPrompt += `Based on ${callTranscripts.length} sales calls (prioritizing successful ones), here are key insights:\n\n`;
    
    // Analyze sentiment patterns
    const sentiments = callTranscripts
      .filter(t => t.sentiment)
      .map(t => t.sentiment);
    
    if (sentiments.length > 0) {
      const positiveCalls = sentiments.filter(s => s === 'positive').length;
      const neutralCalls = sentiments.filter(s => s === 'neutral').length;
      const negativeCalls = sentiments.filter(s => s === 'negative').length;
      const percentPositive = Math.round((positiveCalls / sentiments.length) * 100);
      systemPrompt += `Call Performance Analysis: ${percentPositive}% positive (${positiveCalls} positive, ${neutralCalls} neutral, ${negativeCalls} negative)\n\n`;
    }
    
    // Add successful conversation patterns (from positive calls)
    const positiveCalls = callTranscripts.filter(t => t.sentiment === 'positive');
    if (positiveCalls.length > 0) {
      systemPrompt += `PROVEN SUCCESSFUL PATTERNS (from ${positiveCalls.length} positive calls):\n`;
      
      // Extract key phrases from positive calls with better summarization
      positiveCalls.slice(0, 2).forEach((call, index) => {
        const snippet = call.raw_transcript.substring(0, 75);
        const analysis = call.sales_insights?.analysis || 'High engagement call';
        systemPrompt += `${index + 1}. "${snippet}..." → ${analysis}\n`;
      });
      systemPrompt += `\n`;
    }
    
    // Add sales insights from all calls with sentiment analysis
    const callsWithInsights = callTranscripts.filter(t => t.sales_insights);
    if (callsWithInsights.length > 0) {
      systemPrompt += `ACTIONABLE INSIGHTS FROM CALLS:\n`;
      
      // Group insights by sentiment for better context
      const positiveInsights = callsWithInsights.filter(c => c.sentiment === 'positive');
      const neutralInsights = callsWithInsights.filter(c => c.sentiment === 'neutral');
      
      if (positiveInsights.length > 0) {
        systemPrompt += `✅ FROM SUCCESSFUL CALLS:\n`;
        positiveInsights.slice(0, 2).forEach(call => {
          if (call.sales_insights?.analysis) {
            systemPrompt += `- ${call.sales_insights.analysis}\n`;
          }
        });
      }
      
      if (neutralInsights.length > 0) {
        systemPrompt += `⚠️ AREAS FOR IMPROVEMENT:\n`;
        neutralInsights.slice(0, 1).forEach(call => {
          if (call.sales_insights?.analysis) {
            systemPrompt += `- ${call.sales_insights.analysis}\n`;
          }
        });
      }
      
      systemPrompt += `\n`;
    }
    
    systemPrompt += `Focus on replicating the successful patterns while avoiding the pitfalls identified in neutral/negative calls.\n`;
    systemPrompt += `=== END CALL INSIGHTS ===\n\n`;
  }

  systemPrompt += `
Guidelines:
- Be conversational and friendly
- Ask qualifying questions to understand their fitness goals
- Address objections professionally using proven responses from successful calls
- When the lead is qualified and interested, offer to book a consultation
- Keep responses concise and focused
- Always end with a question to keep the conversation flowing
- Apply learnings from recent call transcriptions to improve your approach
`;

  // Debug: Log system prompt info
  console.log('🎯 System prompt built:', {
    totalLength: systemPrompt.length,
    hasCallTranscripts: callTranscripts && callTranscripts.length > 0,
    callTranscriptsCount: callTranscripts?.length || 0,
    includesInsights: systemPrompt.includes('CALL TRANSCRIPTION INSIGHTS'),
    promptPreview: systemPrompt.substring(0, 300) + '...',
    fullPrompt: systemPrompt // Log full prompt for debugging
  });

  // Extra debug logging
  if (callTranscripts && callTranscripts.length > 0) {
    console.log('📝 Call transcripts in system prompt:', {
      totalTranscripts: callTranscripts.length,
      sentimentBreakdown: callTranscripts.reduce((acc, t) => {
        acc[t.sentiment || 'unknown'] = (acc[t.sentiment || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      sampleTranscripts: callTranscripts.slice(0, 3).map(t => ({
        sentiment: t.sentiment,
        hasInsights: !!t.sales_insights,
        length: t.raw_transcript.length
      }))
    });
  }

  return systemPrompt;
}

// Function to fetch recent call transcripts for an organization
export async function getCallTranscripts(organizationId: string): Promise<Array<{
  raw_transcript: string;
  sentiment?: string;
  sales_insights?: any;
  created_at: string;
}>> {
  try {
    const supabase = createServiceClient();
    
    const { data: transcripts, error } = await supabase
      .from('call_transcripts')
      .select('raw_transcript, sentiment, sales_insights, created_at')
      .eq('organization_id', organizationId)
      .not('sentiment', 'is', null) // Only include transcripts with sentiment analysis
      .order('created_at', { ascending: false })
      .limit(5); // Get last 5 transcripts
    
    if (error) {
      console.error('Error fetching call transcripts:', error);
      return [];
    }
    
    return transcripts || [];
  } catch (error) {
    console.error('Error in getCallTranscripts:', error);
    return [];
  }
}