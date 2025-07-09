/**
 * Calendar connection status endpoint
 * Checks if Google Calendar is connected and tokens are valid
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  try {
    // Check if we have stored Google tokens
    const supabase = createClient();
    const { data: tokenData, error } = await supabase
      .from('google_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('id', 'admin') // In production, use actual user ID
      .single();

    if (error || !tokenData) {
      return NextResponse.json({ 
        connected: false, 
        message: 'No Google Calendar connection found' 
      });
    }

    // Check if tokens exist and are not expired
    const now = Date.now();
    const isExpired = tokenData.expires_at && (tokenData.expires_at as number) < now;

    if (!tokenData.access_token || isExpired) {
      return NextResponse.json({ 
        connected: false, 
        message: 'Google Calendar tokens are expired or invalid' 
      });
    }

    return NextResponse.json({ 
      connected: true, 
      message: 'Google Calendar is connected and ready' 
    });

  } catch (error) {
    console.error('Error checking calendar status:', error);
    return NextResponse.json({ 
      connected: false, 
      message: 'Error checking calendar connection' 
    }, { status: 500 });
  }
}