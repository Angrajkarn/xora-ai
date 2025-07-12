
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const requestUrl = request.nextUrl.clone();

  // If there's no session cookie, redirect to login immediately.
  if (!sessionCookie) {
    requestUrl.pathname = '/login';
    requestUrl.searchParams.set('continue', request.nextUrl.pathname);
    return NextResponse.redirect(requestUrl);
  }

  try {
    // The verification URL must be absolute for fetch in middleware.
    const verificationUrl = new URL('/api/auth/verify', request.url);

    // Call the internal API route to verify the session.
    const response = await fetch(verificationUrl.toString(), {
      method: 'POST',
      headers: {
        'Cookie': `session=${sessionCookie}`
      }
    });

    // If the session is valid, allow the request to proceed.
    if (response.ok) {
        const data = await response.json();
        if (data.isAuthenticated) {
            return NextResponse.next();
        }
    }

    // If verification fails for any reason (e.g., expired cookie, invalid response),
    // redirect to the login page.
    requestUrl.pathname = '/login';
    return NextResponse.redirect(requestUrl);

  } catch (error) {
    console.error('Middleware error during session verification:', error);
    requestUrl.pathname = '/login';
    return NextResponse.redirect(requestUrl);
  }
}

// Define the paths that the middleware should apply to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (the root landing page)
     * - /login
     * - /signup
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|signup|$).*)',
  ],
};
