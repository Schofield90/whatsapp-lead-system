// MIDDLEWARE COMPLETELY DISABLED
// No middleware at all - everything is public

// Commenting out everything to disable middleware completely
/*
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
*/