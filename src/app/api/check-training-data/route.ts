import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();

    // Get all training data for the organization
    const { data: trainingData, error } = await supabase
      .from('training_data')
      .select('*')
      .eq('organization_id', userProfile.profile.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching training data:', error);
      return NextResponse.json({
        error: 'Failed to fetch training data',
        details: error.message
      }, { status: 500 });
    }

    // Group by data type
    const groupedData = (trainingData || []).reduce((acc, item) => {
      if (!acc[item.data_type]) {
        acc[item.data_type] = [];
      }
      acc[item.data_type].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      success: true,
      totalItems: trainingData?.length || 0,
      dataTypes: Object.keys(groupedData),
      breakdown: Object.keys(groupedData).map(type => ({
        type,
        count: groupedData[type].length,
        activeCount: groupedData[type].filter(item => item.is_active).length,
        items: groupedData[type].map(item => ({
          id: item.id,
          version: item.version,
          is_active: item.is_active,
          created_at: item.created_at,
          contentPreview: item.content.substring(0, 100) + '...'
        }))
      })),
      rawData: trainingData
    });

  } catch (error) {
    console.error('Check training data error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}