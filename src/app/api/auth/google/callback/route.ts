/**
 * Google OAuth callback endpoint
 * Handles the authorization code exchange and token storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/google-calendar';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL('/auth/error?error=oauth_error', request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/auth/error?error=missing_code', request.url)
      );
    }

    // Exchange authorization code for tokens
    const tokens = await getTokens(code);

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Store tokens in Supabase (you may want to encrypt these)
    const supabase = createClient();
    
    // For this example, we'll store in a simple table
    // In production, consider encrypting tokens and associating with user
    const { error: dbError } = await supabase
      .from('google_tokens')
      .upsert({
        id: 'admin', // In production, use actual user ID
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date,
        updated_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Error storing tokens:', dbError);
      throw dbError;
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/auth/success', request.url)
    );

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/auth/error?error=token_exchange_failed', request.url)
    );
  }
}