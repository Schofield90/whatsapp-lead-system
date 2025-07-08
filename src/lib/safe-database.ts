/**
 * Safe Database Client - Wraps Supabase with failsafes
 * Prevents database errors from causing infinite loops
 */

import { createServiceClient } from '@/lib/supabase/server';
import { circuitBreakers } from '@/lib/circuit-breaker';

interface SafeQueryResult<T> {
  data: T | null;
  error: Error | null;
  success: boolean;
  fromFallback: boolean;
}

class SafeDatabase {
  private supabase = createServiceClient();

  async safeQuery<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    fallbackData: T | null = null,
    tableName: string = 'unknown'
  ): Promise<SafeQueryResult<T>> {
    const fallback = () => ({
      data: fallbackData,
      error: null,
      success: true,
      fromFallback: true
    });

    try {
      const result = await circuitBreakers.supabase.execute(async () => {
        const { data, error } = await operation();
        
        if (error) {
          // Handle specific error types
          if (error.code === '42P01') {
            console.warn(`⚠️ Table ${tableName} does not exist, using fallback`);
            throw new Error(`Table ${tableName} does not exist`);
          }
          
          if (error.code === '42703') {
            console.warn(`⚠️ Column does not exist in ${tableName}, using fallback`);
            throw new Error(`Column does not exist in ${tableName}`);
          }
          
          console.error(`❌ Database error in ${tableName}:`, error);
          throw new Error(`Database error: ${error.message}`);
        }
        
        return { data, error: null, success: true, fromFallback: false };
      }, fallback);

      return result;
    } catch (error) {
      console.error(`❌ Safe database query failed for ${tableName}:`, error);
      return fallback();
    }
  }

  // Safe knowledge base query with automatic fallbacks
  async getKnowledgeBase(): Promise<SafeQueryResult<any[]>> {
    return this.safeQuery(
      () => this.supabase
        .from('knowledge_base')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      [], // Fallback to empty array
      'knowledge_base'
    );
  }

  // Safe training data query with automatic fallbacks
  async getTrainingData(): Promise<SafeQueryResult<any[]>> {
    return this.safeQuery(
      () => this.supabase
        .from('training_data')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      [], // Fallback to empty array
      'training_data'
    );
  }

  // Safe insert with retry logic
  async safeInsert<T>(
    tableName: string,
    data: any,
    select: string = '*'
  ): Promise<SafeQueryResult<T>> {
    return this.safeQuery(
      () => this.supabase
        .from(tableName)
        .insert(data)
        .select(select)
        .single(),
      null,
      tableName
    );
  }

  // Check if table exists before querying
  async tableExists(tableName: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(tableName)
        .select('count')
        .limit(1);
      
      return !error || error.code !== '42P01';
    } catch {
      return false;
    }
  }

  // Create knowledge base table if it doesn't exist
  async ensureKnowledgeBaseExists(): Promise<boolean> {
    const exists = await this.tableExists('knowledge_base');
    
    if (!exists) {
      console.log('📦 Creating knowledge_base table...');
      try {
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS knowledge_base (
            id SERIAL PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            category VARCHAR(100),
            question TEXT,
            content TEXT NOT NULL,
            source VARCHAR(100),
            metadata JSONB,
            is_active BOOLEAN DEFAULT true,
            version INTEGER DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_knowledge_base_type ON knowledge_base(type);
          CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
          CREATE INDEX IF NOT EXISTS idx_knowledge_base_active ON knowledge_base(is_active);
        `;

        const { error } = await this.supabase.rpc('exec_sql', { sql: createTableQuery });
        
        if (error) {
          console.error('❌ Failed to create knowledge_base table:', error);
          return false;
        }
        
        console.log('✅ Knowledge base table created successfully');
        return true;
      } catch (error) {
        console.error('❌ Error creating knowledge_base table:', error);
        return false;
      }
    }
    
    return true;
  }
}

export const safeDatabase = new SafeDatabase();
export { SafeDatabase };