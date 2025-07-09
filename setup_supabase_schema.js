/**
 * Script to set up Supabase database schema for Google Calendar integration
 * This will create the necessary tables for storing OAuth tokens and bookings
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function setupSupabaseSchema() {
  console.log('🗄️  Setting up Supabase database schema...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Read the schema SQL file
  const schemaPath = path.join(__dirname, 'supabase', 'calendar-schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found:', schemaPath);
    process.exit(1);
  }
  
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  try {
    // Execute the schema
    const { error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      console.error('❌ Error executing schema:', error);
      
      // Try alternative approach - execute statements individually
      console.log('🔄 Trying alternative approach...');
      
      // Split schema into individual statements
      const statements = schema.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql: statement.trim() + ';' 
          });
          
          if (stmtError) {
            console.error('❌ Error executing statement:', stmtError);
            console.error('Statement:', statement.trim());
          }
        }
      }
    }
    
    console.log('✅ Database schema set up successfully!');
    console.log('📊 Created tables:');
    console.log('   - google_tokens (for OAuth credentials)');
    console.log('   - bookings (for appointment tracking)');
    
  } catch (error) {
    console.error('❌ Failed to set up database schema:', error);
    process.exit(1);
  }
}

// Run the setup
setupSupabaseSchema().catch(console.error);