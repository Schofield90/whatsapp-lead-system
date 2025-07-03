import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/api/webhooks'];
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  
  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If user is authenticated but trying to access auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Check if user has an organization setup
  if (user && !isPublicRoute && request.nextUrl.pathname !== '/onboarding') {
    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    
    if (!profile?.organization_id) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|.*\\.png$).*)',
  ],
};