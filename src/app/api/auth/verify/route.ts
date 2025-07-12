
import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * API route to verify a user's session cookie.
 * This route is called by the middleware to offload server-only logic.
 */
export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }

  try {
    // Verify the cookie using the Firebase Admin SDK.
    await adminAuth.verifySessionCookie(sessionCookie, true);
    // If verification is successful, return a positive response.
    return NextResponse.json({ isAuthenticated: true }, { status: 200 });
  } catch (error) {
    // If verification fails (e.g., cookie expired, invalid), return an error response.
    console.log('Session verification failed in API route:', error);
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }
}
