import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logger';

export interface AuthenticatedRequest extends NextRequest {
  userId: string;
}

/**
 * Creates an AuthenticatedRequest wrapper without mutating the original request
 */
function createAuthenticatedRequest(request: NextRequest, userId: string): AuthenticatedRequest {
  // Create a new object that delegates to the original request
  const authenticatedRequest = Object.create(request);
  
  // Add userId property
  authenticatedRequest.userId = userId;
  
  return authenticatedRequest as AuthenticatedRequest;
}

/**
 * Middleware to validate authentication
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      apiLogger.warn('Unauthorized request - no session found');
      return NextResponse.json(
        { error: 'Unauthorized - no session found' }, 
        { status: 401 }
      );
    }

    const authenticatedRequest = createAuthenticatedRequest(request, session.user.id);

    return await handler(authenticatedRequest);
  } catch (error) {
    apiLogger.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' }, 
      { status: 500 }
    );
  }
}

/**
 * Middleware to handle errors and provide consistent error responses
 */
export function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      apiLogger.error('Unhandled API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}


/**
 * Combined middleware for authenticated API routes
 */
export function withApiMiddleware(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withErrorHandler(async (request: NextRequest) => {
    return withAuth(request, handler);
  });
}