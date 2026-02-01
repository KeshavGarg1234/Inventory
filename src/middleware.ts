
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware function will be removed as client-side auth handling is more reliable
// with Firebase's onAuthStateChanged listener. The logic is now in AuthProvider.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // We're keeping the matcher to potentially add other middleware logic later,
  // but for now, it does nothing for authentication.
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
