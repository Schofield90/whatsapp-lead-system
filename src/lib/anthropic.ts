import Anthropic from '@anthropic-ai/sdk';
import { getRelevantKnowledge, formatKnowledgeForAI, getRandomQuizQuestion, getKnowledgeByType, KNOWLEDGE_TYPES } from '@/lib/knowledge';
import { bookCalendarAppointment, checkAvailableSlots, parseDateTime, formatBookingConfirmation, BookingRequest } from '@/lib/calendar-booking';

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
    // Step 1: Always fetch ALL SOPs and quiz content for every incoming message
    console.log('Fetching all SOPs and quiz knowledge for WhatsApp message...');
    const sopAndQuizKnowledge = await getKnowledgeByType([KNOWLEDGE_TYPES.SOP, KNOWLEDGE_TYPES.QUIZ]);
    
    // Step 2: Also fetch contextually relevant knowledge based on message content
    console.log('Fetching contextually relevant knowledge for user message...');
    const contextualKnowledge = await getRelevantKnowledge(message);
    
    // Step 3: Combine ALL knowledge sources for comprehensive AI context
    const allKnowledge = [...sopAndQuizKnowledge, ...contextualKnowledge];
    
    // Step 4: Remove duplicates by ID to avoid redundant information
    const uniqueKnowledge = allKnowledge.filter((knowledge, index, self) => 
      index === self.findIndex(k => k.id === knowledge.id)
    );
    
    // Step 5: Format all knowledge entries for AI context
    const knowledgeContext = formatKnowledgeForAI(uniqueKnowledge);
    
    // Step 6: Check if user is requesting a quiz or asking quiz-related questions
    const isQuizRequest = message.toLowerCase().includes('quiz') || 
                         message.toLowerCase().includes('test') || 
                         message.toLowerCase().includes('challenge');
    
    // Step 7: Create enhanced system prompt with comprehensive gym business knowledge
    const systemPrompt = `You are a professional gym business WhatsApp sales assistant. 
    You represent a fitness gym and your primary goal is to help convert leads into paying members while providing excellent customer service.
    Keep responses concise and friendly, suitable for WhatsApp messaging.
    The user is messaging from phone number: ${phoneNumber}
    
    CRITICAL: You have access to comprehensive gym business knowledge below. ALWAYS use this knowledge to inform your responses.
    ${knowledgeContext}
    
    MANDATORY BEHAVIOR:
    - SOPs (Standard Operating Procedures): Follow these step-by-step processes EXACTLY when handling specific situations
    - Sales Processes: Use the sales techniques and scripts provided in your knowledge base
    - Quiz Content: Use fitness knowledge for educational conversations and engagement
    - Pricing Information: Always use the exact pricing from your knowledge base
    - Policies: Follow all gym policies and procedures as specified
    
    CALENDAR BOOKING CAPABILITIES:
    - You can book appointments and consultations directly in my calendar
    - When someone wants to schedule a call, meeting, or appointment, proactively offer to book it
    - Ask for their preferred date and time if not provided
    - Common booking phrases: "book a call", "schedule appointment", "set up meeting"
    - Always confirm booking details before proceeding
    - If booking fails, offer alternative times or manual booking options
    
    SALES-FOCUSED GUIDELINES:
    - Keep responses under 300 characters when possible for WhatsApp
    - Use a conversational, friendly tone that builds rapport
    - ALWAYS refer to your knowledge base before answering questions
    - Follow SOPs precisely for lead qualification, objection handling, and closing
    - Use proven sales techniques from your training when appropriate
    - Create urgency and value when discussing memberships
    - Ask qualifying questions to understand prospect needs
    - Offer trials, tours, and consultations when relevant
    - Handle objections using the scripts in your knowledge base
    - If specific information isn't available, offer to connect them with a team member
    - Focus on benefits that matter to the prospect
    - When appropriate, engage with fitness tips or quiz questions to build interest
    - PROACTIVELY suggest booking a consultation or call when appropriate`;

    // Step 8: Check if this is a calendar booking request
    const isBookingRequest = message.toLowerCase().includes('book') || 
                            message.toLowerCase().includes('schedule') || 
                            message.toLowerCase().includes('appointment') ||
                            message.toLowerCase().includes('meeting') ||
                            message.toLowerCase().includes('call');

    // Step 9: Handle calendar booking requests
    if (isBookingRequest) {
      console.log('Detected potential booking request, checking for date/time...');
      
      const dateTime = parseDateTime(message);
      if (dateTime) {
        console.log('Parsed date/time from message:', dateTime);
        
        // Try to extract customer name from previous context or ask for it
        // For now, we'll use a placeholder approach
        const customerName = extractCustomerName(message) || 'Customer';
        
        const bookingData: BookingRequest = {
          date: dateTime.date,
          time: dateTime.time,
          duration: 30, // Default 30 minutes
          customerName: customerName,
          customerPhone: phoneNumber,
          notes: `Booking request from WhatsApp: ${message}`,
          timeZone: 'America/New_York'
        };
        
        console.log('Attempting to book calendar appointment:', bookingData);
        
        const bookingResult = await bookCalendarAppointment(bookingData);
        
        if (bookingResult.success) {
          console.log('Calendar booking successful');
          return formatBookingConfirmation(bookingResult, customerName);
        } else {
          console.log('Calendar booking failed:', bookingResult.error);
          // Fall through to regular AI response with booking context
        }
      }
    }

    // Step 10: Log comprehensive knowledge context for debugging
    console.log(`Generating AI response with comprehensive knowledge context:
    - Total knowledge entries: ${uniqueKnowledge.length}
    - SOPs included: ${uniqueKnowledge.filter(k => k.type === KNOWLEDGE_TYPES.SOP).length}
    - Quiz entries included: ${uniqueKnowledge.filter(k => k.type === KNOWLEDGE_TYPES.QUIZ).length}
    - Other knowledge types: ${uniqueKnowledge.filter(k => k.type !== KNOWLEDGE_TYPES.SOP && k.type !== KNOWLEDGE_TYPES.QUIZ).length}
    `);
    
    console.log('Generating AI response with comprehensive gym business knowledge...');
    
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

/**
 * Extract customer name from message
 * @param message - User's message
 * @returns Extracted name or null
 */
function extractCustomerName(message: string): string | null {
  // Simple name extraction patterns
  const patterns = [
    /my name is (\w+)/i,
    /i'm (\w+)/i,
    /this is (\w+)/i,
    /call me (\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export default getAnthropicClient;