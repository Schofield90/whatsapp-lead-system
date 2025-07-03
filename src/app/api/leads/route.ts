import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const userProfile = await getUserProfile();
    
    if (!userProfile?.profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, email } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    // Check if we need a default lead source
    let leadSourceId = null;
    
    // Try to find or create a "Manual" lead source
    const { data: existingSource } = await supabase
      .from('lead_sources')
      .select('id')
      .eq('organization_id', userProfile.profile.organization_id)
      .eq('name', 'Manual')
      .single();

    if (existingSource) {
      leadSourceId = existingSource.id;
    } else {
      // Create a default "Manual" lead source
      const { data: newSource, error: sourceError } = await supabase
        .from('lead_sources')
        .insert({
          organization_id: userProfile.profile.organization_id,
          name: 'Manual',
          source_type: 'manual',
          is_active: true
        })
        .select('id')
        .single();

      if (sourceError) {
        console.error('Error creating lead source:', sourceError);
        return NextResponse.json({ error: 'Failed to create lead source' }, { status: 500 });
      }
      
      leadSourceId = newSource.id;
    }

    // Create the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        organization_id: userProfile.profile.organization_id,
        lead_source_id: leadSourceId,
        name,
        phone,
        email: email || null,
        status: 'new'
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error('Error in POST /api/leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}