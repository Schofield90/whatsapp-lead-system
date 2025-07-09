/**
 * Google OAuth initiation endpoint
 * Redirects user to Google's authorization page
 */

import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-calendar';

export async function GET() {
  try {
    const authUrl = getAuthUrl();
    
    // Redirect to Google's authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Google auth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google authentication' },
      { status: 500 }
    );
  }
}