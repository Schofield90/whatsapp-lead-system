import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    // Test 1: Can we read organizations?
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);

    // Test 2: Can we read leads?
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name, phone')
      .limit(1);

    // Test 3: Can we read lead_sources?
    const { data: leadSources, error: sourcesError } = await supabase
      .from('lead_sources')
      .select('id, name, source_type')
      .limit(1);

    // Test 4: Try to create a test lead source
    const testOrgId = organizations?.[0]?.id;
    let createSourceResult = null;
    let createSourceError = null;
    
    if (testOrgId) {
      const { data, error } = await supabase
        .from('lead_sources')
        .insert({
          organization_id: testOrgId,
          name: 'Test Source ' + Date.now(),
          source_type: 'test'
        })
        .select()
        .single();
      
      createSourceResult = data;
      createSourceError = error;
      
      // Clean up - delete the test record
      if (data) {
        await supabase
          .from('lead_sources')
          .delete()
          .eq('id', data.id);
      }
    }

    return NextResponse.json({
      success: true,
      tests: {
        organizations: {
          success: !orgError,
          error: orgError?.message,
          count: organizations?.length || 0
        },
        leads: {
          success: !leadsError,
          error: leadsError?.message,
          count: leads?.length || 0
        },
        leadSources: {
          success: !sourcesError,
          error: sourcesError?.message,
          count: leadSources?.length || 0
        },
        createLeadSource: {
          success: !createSourceError && !!createSourceResult,
          error: createSourceError?.message,
          created: !!createSourceResult
        }
      },
      summary: {
        canRead: !orgError && !leadsError && !sourcesError,
        canWrite: !createSourceError && !!createSourceResult,
        readyForWebhook: !orgError && !leadsError && !sourcesError && !createSourceError && !!createSourceResult
      }
    });

  } catch (error) {
    console.error('Database access test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}