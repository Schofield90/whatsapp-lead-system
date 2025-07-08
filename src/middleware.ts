// MIDDLEWARE DISABLED FOR SIMPLE WHATSAPP BOT
// All routes are now public - no authentication required

import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Just pass through - no authentication, no redirects
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only match API routes to avoid interfering with static files
    '/api/:path*',
  ],
};