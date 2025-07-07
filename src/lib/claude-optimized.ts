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
  callTranscripts?: Array<{
    raw_transcript: string;
    sentiment?: string;
    sales_insights?: any;
    created_at: string;
  }>;
}

// Token counting utility
function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English
  return Math.ceil(text.length / 4);
}

// Cost tracking
interface CostTracker {
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  conversationId: string;
  timestamp: string;
}

let costLog: CostTracker[] = [];

export function logCostUsage(usage: CostTracker) {
  costLog.push(usage);
  
  // Calculate costs (Claude 3 Haiku pricing)
  const inputCost = (usage.inputTokens / 1000000) * 0.25;  // $0.25 per million input tokens
  const outputCost = (usage.outputTokens / 1000000) * 1.25; // $1.25 per million output tokens
  const totalCost = inputCost + outputCost;
  
  console.log(`💰 Claude API Cost:`, {
    conversation: usage.conversationId,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    inputCost: `$${inputCost.toFixed(6)}`,
    outputCost: `$${outputCost.toFixed(6)}`,
    totalCost: `$${totalCost.toFixed(6)}`,
    timestamp: usage.timestamp
  });
  
  // Alert if single call is expensive
  if (totalCost > 0.01) {
    console.warn(`⚠️ HIGH COST ALERT: Single API call cost $${totalCost.toFixed(4)}`);
  }
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
  
  // OPTIMIZATION 1: Trim conversation history to last 10 messages only
  const recentMessages = context.messages
    .slice(-10) // Only last 10 messages
    .map(msg => `${msg.direction === 'inbound' ? 'Customer' : 'Agent'}: ${msg.content}`)
    .join('\n');
  
  // OPTIMIZATION 2: Build minimal system prompt
  const systemPrompt = buildOptimizedSystemPrompt(context);
  
  // OPTIMIZATION 3: Concise user prompt
  const userPrompt = `Previous context:\n${recentMessages}\n\nNew message: ${newMessage}\n\nRespond concisely as a gym sales agent.`;
  
  // OPTIMIZATION 4: Estimate tokens before API call
  const estimatedInputTokens = estimateTokens(systemPrompt + userPrompt);
  
  console.log(`🔢 Token estimation:`, {
    conversationId: context.conversation.id,
    systemPromptLength: systemPrompt.length,
    systemPromptTokens: estimateTokens(systemPrompt),
    userPromptTokens: estimateTokens(userPrompt),
    totalInputTokens: estimatedInputTokens,
    recentMessagesCount: context.messages.slice(-10).length
  });
  
  // ALERT if prompt is too large
  if (estimatedInputTokens > 5000) {
    console.warn(`⚠️ LARGE PROMPT WARNING: ${estimatedInputTokens} tokens estimated. Consider reducing context.`);
  }

  try {
    const startTime = Date.now();
    
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307', // Cheapest model
      max_tokens: 300, // Reduced from 500
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const endTime = Date.now();
    
    // OPTIMIZATION 5: Extract and log actual token usage
    const inputTokens = response.usage?.input_tokens || estimatedInputTokens;
    const outputTokens = response.usage?.output_tokens || 0;
    
    logCostUsage({
      inputTokens,
      outputTokens,
      estimatedCost: 0, // Will be calculated in logCostUsage
      conversationId: context.conversation.id,
      timestamp: new Date().toISOString()
    });

    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : 'Unable to process response';

    console.log(`⚡ API Performance:`, {
      duration: `${endTime - startTime}ms`,
      actualInputTokens: inputTokens,
      actualOutputTokens: outputTokens,
      responseLength: responseText.length
    });

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
    
    // Log failed call
    logCostUsage({
      inputTokens: estimatedInputTokens,
      outputTokens: 0,
      estimatedCost: 0,
      conversationId: context.conversation.id,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}

function buildOptimizedSystemPrompt(context: ConversationContext): string {
  const { organization, trainingData, lead } = context;
  
  // OPTIMIZATION 6: Minimal system prompt
  let systemPrompt = `You are a gym sales agent for ${organization.name}. 
Lead: ${lead.name} (${lead.status})

Your goal: Qualify leads and book consultations. Be conversational and concise.

`;

  // OPTIMIZATION 7: Summarize training data instead of including full content
  const trainingTypes = trainingData.map(d => d.data_type).join(', ');
  if (trainingTypes) {
    systemPrompt += `Training available: ${trainingTypes}\n`;
  }

  // OPTIMIZATION 8: Only include successful call insights summary (not full transcripts)
  const { callTranscripts } = context;
  if (callTranscripts && callTranscripts.length > 0) {
    const positiveCallsCount = callTranscripts.filter(t => t.sentiment === 'positive').length;
    const totalCalls = callTranscripts.length;
    const successRate = Math.round((positiveCallsCount / totalCalls) * 100);
    
    systemPrompt += `Call insights: ${successRate}% success rate from ${totalCalls} calls. Focus on proven successful patterns.\n`;
    
    // Include only one key insight
    const bestCall = callTranscripts.find(t => t.sentiment === 'positive' && t.sales_insights?.analysis);
    if (bestCall) {
      systemPrompt += `Key insight: ${bestCall.sales_insights.analysis.substring(0, 100)}\n`;
    }
  }

  systemPrompt += `
Guidelines:
- Keep responses under 50 words
- Ask one qualifying question per message  
- When qualified, offer to book consultation
- End with a question`;

  // OPTIMIZATION 9: Remove debugging logs that waste tokens
  console.log(`📝 Optimized prompt: ${systemPrompt.length} chars (${estimateTokens(systemPrompt)} tokens)`);

  return systemPrompt;
}

// Cost monitoring functions
export function getCostReport(): { 
  totalCalls: number; 
  totalInputTokens: number; 
  totalOutputTokens: number; 
  estimatedTotalCost: number;
  averageCostPerCall: number;
  last24Hours: number;
} {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recent = costLog.filter(log => new Date(log.timestamp) > yesterday);
  const totalInputTokens = costLog.reduce((sum, log) => sum + log.inputTokens, 0);
  const totalOutputTokens = costLog.reduce((sum, log) => sum + log.outputTokens, 0);
  
  // Claude 3 Haiku pricing
  const inputCost = (totalInputTokens / 1000000) * 0.25;
  const outputCost = (totalOutputTokens / 1000000) * 1.25;
  const totalCost = inputCost + outputCost;
  
  return {
    totalCalls: costLog.length,
    totalInputTokens,
    totalOutputTokens,
    estimatedTotalCost: totalCost,
    averageCostPerCall: costLog.length > 0 ? totalCost / costLog.length : 0,
    last24Hours: recent.length
  };
}

export function alertIfHighCosts() {
  const report = getCostReport();
  
  if (report.averageCostPerCall > 0.005) { // Alert if average > $0.005 per call
    console.error(`🚨 HIGH COST ALERT: Average cost per call is $${report.averageCostPerCall.toFixed(6)}`);
  }
  
  if (report.estimatedTotalCost > 10) { // Alert if total > $10
    console.error(`🚨 TOTAL COST ALERT: Total costs reached $${report.estimatedTotalCost.toFixed(2)}`);
  }
}