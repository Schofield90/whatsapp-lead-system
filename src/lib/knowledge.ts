import { supabaseAdmin } from '@/lib/supabase';

// Define the knowledge entry type
export interface KnowledgeEntry {
  id: string;
  type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Define knowledge types for better organization
export const KNOWLEDGE_TYPES = {
  SOP: 'sop',           // Standard Operating Procedures
  CALL: 'call',         // Call scripts and examples
  FAQ: 'faq',           // Frequently Asked Questions
  STYLE: 'style',       // Communication style guidelines
  PRICING: 'pricing',   // Pricing information
  SCHEDULE: 'schedule', // Schedule and hours
  SERVICES: 'services', // Services offered
  POLICIES: 'policies', // Gym policies
  QUIZ: 'quiz'          // Interactive quiz questions and answers
} as const;

/**
 * Fetch knowledge entries from Supabase based on type
 * @param types - Array of knowledge types to fetch (optional, fetches all if not specified)
 * @returns Promise with array of knowledge entries
 */
export async function getKnowledgeByType(types?: string[]): Promise<KnowledgeEntry[]> {
  try {
    console.log('Fetching knowledge entries from Supabase...');
    
    // Build the query
    let query = supabaseAdmin()
      .from('knowledge')
      .select('*');
    
    // Filter by types if specified
    if (types && types.length > 0) {
      query = query.in('type', types);
    }
    
    // Execute the query
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching knowledge entries:', error);
      return [];
    }
    
    console.log(`Fetched ${data?.length || 0} knowledge entries`);
    return (data as unknown as KnowledgeEntry[]) || [];
    
  } catch (error) {
    console.error('Error in getKnowledgeByType:', error);
    return [];
  }
}

/**
 * Get relevant knowledge entries based on user message content
 * Uses keyword matching to find relevant knowledge
 * @param message - User's message
 * @returns Promise with array of relevant knowledge entries
 */
export async function getRelevantKnowledge(message: string): Promise<KnowledgeEntry[]> {
  try {
    console.log('Finding relevant knowledge for message:', message);
    
    // Convert message to lowercase for matching
    const lowerMessage = message.toLowerCase();
    
    // Define keywords that map to knowledge types
    const keywordMap = {
      [KNOWLEDGE_TYPES.PRICING]: ['price', 'cost', 'membership', 'fee', 'payment', 'monthly', 'annual', 'discount'],
      [KNOWLEDGE_TYPES.SCHEDULE]: ['hours', 'open', 'close', 'schedule', 'time', 'when'],
      [KNOWLEDGE_TYPES.SERVICES]: ['personal', 'training', 'classes', 'service', 'offer'],
      [KNOWLEDGE_TYPES.POLICIES]: ['cancel', 'cancellation', 'policy', 'refund', 'terms'],
      [KNOWLEDGE_TYPES.FAQ]: ['help', 'question', 'how', 'what', 'where', 'why'],
      [KNOWLEDGE_TYPES.SOP]: ['process', 'procedure', 'how to', 'step', 'guide', 'protocol', 'onboard', 'qualification', 'complaint', 'consultation'],
      [KNOWLEDGE_TYPES.QUIZ]: ['quiz', 'test', 'question', 'challenge', 'game', 'exercise', 'workout', 'fitness', 'form', 'safety']
    };
    
    // Find matching knowledge types based on keywords
    const relevantTypes: string[] = [];
    
    for (const [type, keywords] of Object.entries(keywordMap)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        relevantTypes.push(type);
      }
    }
    
    // Always include style guidelines
    relevantTypes.push(KNOWLEDGE_TYPES.STYLE);
    
    // If no specific types found, get a broader set
    if (relevantTypes.length === 1) { // Only style
      relevantTypes.push(KNOWLEDGE_TYPES.SOP, KNOWLEDGE_TYPES.FAQ);
    }
    
    console.log('Relevant knowledge types:', relevantTypes);
    
    // Fetch the relevant knowledge entries
    const knowledgeEntries = await getKnowledgeByType(relevantTypes);
    
    // Limit to most recent 10 entries to avoid overwhelming the AI
    return knowledgeEntries.slice(0, 10);
    
  } catch (error) {
    console.error('Error in getRelevantKnowledge:', error);
    return [];
  }
}

/**
 * Add a new knowledge entry to the database
 * @param type - Knowledge type
 * @param content - Knowledge content
 * @returns Promise with the created knowledge entry
 */
export async function addKnowledgeEntry(type: string, content: string): Promise<KnowledgeEntry | null> {
  try {
    console.log('Adding new knowledge entry:', { type, content: content.substring(0, 100) + '...' });
    
    const { data, error } = await supabaseAdmin()
      .from('knowledge')
      .insert([{ type, content }])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding knowledge entry:', error);
      return null;
    }
    
    console.log('Knowledge entry added successfully:', data.id);
    return data as unknown as KnowledgeEntry;
    
  } catch (error) {
    console.error('Error in addKnowledgeEntry:', error);
    return null;
  }
}

/**
 * Parse quiz content from JSON format
 * @param quizContent - JSON string containing quiz data
 * @returns Parsed quiz object or null if invalid
 */
function parseQuizContent(quizContent: string): any {
  try {
    return JSON.parse(quizContent);
  } catch (error) {
    console.error('Error parsing quiz content:', error);
    return null;
  }
}

/**
 * Format knowledge entries for use in AI prompt
 * @param entries - Array of knowledge entries
 * @returns Formatted string for AI context
 */
export function formatKnowledgeForAI(entries: KnowledgeEntry[]): string {
  if (entries.length === 0) {
    return '';
  }
  
  // Group entries by type for better organization
  const groupedEntries: { [key: string]: KnowledgeEntry[] } = {};
  
  entries.forEach(entry => {
    if (!groupedEntries[entry.type]) {
      groupedEntries[entry.type] = [];
    }
    groupedEntries[entry.type].push(entry);
  });
  
  // Format the knowledge for the AI prompt
  let formattedKnowledge = '\n=== GYM BUSINESS KNOWLEDGE ===\n';
  
  for (const [type, typeEntries] of Object.entries(groupedEntries)) {
    formattedKnowledge += `\n${type.toUpperCase()}:\n`;
    
    typeEntries.forEach(entry => {
      // Special formatting for quiz content
      if (type === KNOWLEDGE_TYPES.QUIZ) {
        const quizData = parseQuizContent(entry.content);
        if (quizData) {
          formattedKnowledge += `- QUIZ Q: ${quizData.question}\n`;
          formattedKnowledge += `  A: ${quizData.answer}\n`;
          if (quizData.category) {
            formattedKnowledge += `  Category: ${quizData.category} | Difficulty: ${quizData.difficulty || 'beginner'}\n`;
          }
        } else {
          formattedKnowledge += `- ${entry.content}\n`;
        }
      }
      // Special formatting for SOPs (Standard Operating Procedures)
      else if (type === KNOWLEDGE_TYPES.SOP) {
        formattedKnowledge += `- SOP: ${entry.content}\n`;
      }
      // Standard formatting for other content types
      else {
        formattedKnowledge += `- ${entry.content}\n`;
      }
    });
  }
  
  formattedKnowledge += '\n=== END KNOWLEDGE ===\n';
  
  return formattedKnowledge;
}

/**
 * Get a random quiz question from the knowledge base
 * @param category - Optional category filter (e.g., 'fitness_guidelines', 'safety')
 * @returns Promise with a random quiz question or null
 */
export async function getRandomQuizQuestion(category?: string): Promise<any> {
  try {
    console.log('Fetching random quiz question...');
    
    // Get all quiz entries
    const quizEntries = await getKnowledgeByType([KNOWLEDGE_TYPES.QUIZ]);
    
    if (quizEntries.length === 0) {
      return null;
    }
    
    // Filter by category if specified
    let filteredQuizzes = quizEntries;
    if (category) {
      filteredQuizzes = quizEntries.filter(entry => {
        const quizData = parseQuizContent(entry.content);
        return quizData && quizData.category === category;
      });
    }
    
    if (filteredQuizzes.length === 0) {
      return null;
    }
    
    // Select random quiz
    const randomIndex = Math.floor(Math.random() * filteredQuizzes.length);
    const selectedQuiz = filteredQuizzes[randomIndex];
    
    return parseQuizContent(selectedQuiz.content);
    
  } catch (error) {
    console.error('Error getting random quiz question:', error);
    return null;
  }
}