import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = new Set(['/', '/login', '/signup']);
const AUTHENTICATED_ROUTES = {
  '/dashboard': ['Assure', 'Agent', 'Expert', 'Admin'],
  '/contrats': ['Assure', 'Agent', 'Expert', 'Admin'],
  '/personnes': ['Agent', 'Expert', 'Admin'],
  '/sparql': ['Expert', 'Admin'],
  '/sparql-explorer': ['Admin'],
  '/semantic-web': ['Assure', 'Agent', 'Expert', 'Admin'],
} as const;

// Helper to get user role from request cookies
function getUserRoleFromRequest(request: NextRequest): string | undefined {
  // Check for auth token in cookies (set by login flow)
  const token = request.cookies.get('hestia-token')?.value;
  const role = request.cookies.get('hestia-role')?.value;

  if (!token) {
    return undefined;
  }

  // Return role from cookie if available, otherwise default to 'Assure'
  return role || 'Assure';
}

// Helper to check if route requires authentication
function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function requiresAuth(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return false;
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return false;
  }
  return true;
}

// Helper to check if user has required role
function hasRequiredRole(
  userRole: string,
  requiredRoles: readonly string[]
): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

// Helper to get redirect target based on role mismatch
function getRedirectTarget(
  userRole: string,
  requiredRoles: readonly string[]
): string | undefined {
  if (!userRole) return '/login';

  // If user has a role that's in the allowed list, allow access
  if (hasRequiredRole(userRole, requiredRoles)) {
    return undefined;
  }

  // Role mismatch - redirect based on user's role
  // Admin trying to access non-admin route -> dashboard
  // Non-admin trying to access admin-only route -> appropriate dashboard
  if (userRole === 'Admin') {
    return '/dashboard';
  }
  if (userRole === 'Assure') {
    return '/dashboard';
  }
  if (userRole === 'Agent') {
    return '/dashboard';
  }
  if (userRole === 'Expert') {
    return '/dashboard';
  }
  return '/login';
}

// Middleware function that runs on each request
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip if no auth required (public routes or API/next internals)
  if (!requiresAuth(pathname)) {
    return NextResponse.next();
  }

  // Get user role from request cookies
  const userRole = getUserRoleFromRequest(request);

  // Find which route config applies
  let requiredRoles: readonly string[] = [];

  for (const [route, roles] of Object.entries(AUTHENTICATED_ROUTES)) {
    if (matchesRoute(pathname, route)) {
      requiredRoles = roles;
      break;
    }
  }

  // Routes not listed above remain public application pages.
  if (requiredRoles.length === 0) {
    return NextResponse.next();
  }

  // If user has no token/role, redirect to login.
  if (!userRole) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user has the required role
  if (hasRequiredRole(userRole, requiredRoles)) {
    return NextResponse.next();
  }

  // Role mismatch - redirect user appropriately
  const redirectTarget = getRedirectTarget(userRole, requiredRoles);
  if (redirectTarget) {
    const redirectUrl = new URL(redirectTarget, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*[.].*).*)'],
};
