import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireOrganization } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userProfile = await requireOrganization();
    const supabase = createServiceClient();

    // Mark ALL pending reminders as failed to stop spam
    const { data, error } = await supabase
      .from('booking_reminders')
      .update({
        status: 'failed',
        error_message: 'Emergency stop - manual intervention',
        sent_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .select();

    if (error) {
      console.error('Error stopping reminders:', error);
      return NextResponse.json({
        error: 'Failed to stop reminders'
      }, { status: 500 });
    }

    console.log(`🛑 Emergency stop: Marked ${data?.length || 0} pending reminders as failed`);

    return NextResponse.json({
      success: true,
      message: `Stopped ${data?.length || 0} pending reminders`,
      stopped_count: data?.length || 0
    });

  } catch (error) {
    console.error('Error in emergency stop:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}