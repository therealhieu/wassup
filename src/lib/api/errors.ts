import { NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logger';

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  statusCode: number;
}

export class ApiErrorResponse extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiErrorResponse';
  }
}

/**
 * Create standardized error responses
 */
export const createErrorResponse = (error: ApiError): NextResponse => {
  const response = {
    error: error.message,
    ...(error.code && { code: error.code }),
    ...(error.details && { details: error.details })
  };

  return NextResponse.json(response, { status: error.statusCode });
};

/**
 * Handle Supabase errors and convert to API errors
 */
export const handleSupabaseError = (error: any, operation: string): NextResponse => {
  const errorInfo = {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code
  };

  apiLogger.error(`Supabase error during ${operation}:`, errorInfo);

  return createErrorResponse({
    message: `Failed to ${operation}`,
    details: error.message,
    statusCode: 500
  });
};

/**
 * Common API error types
 */
export const ApiErrors = {
  unauthorized: () => new ApiErrorResponse('Unauthorized - no session found', 401),
  forbidden: (message = 'Access denied') => new ApiErrorResponse(message, 403),
  notFound: (resource = 'Resource') => new ApiErrorResponse(`${resource} not found`, 404),
  badRequest: (message = 'Invalid request') => new ApiErrorResponse(message, 400),
  conflict: (message = 'Resource conflict') => new ApiErrorResponse(message, 409),
  internalServer: (message = 'Internal server error') => new ApiErrorResponse(message, 500),
  validationError: (details: any) => new ApiErrorResponse('Validation failed', 400, 'VALIDATION_ERROR', details),
  jsonParseError: () => new ApiErrorResponse('Invalid JSON format', 400, 'JSON_PARSE_ERROR'),
  missingField: (field: string) => new ApiErrorResponse(`Missing required field: ${field}`, 400, 'MISSING_FIELD')
};

/**
 * Success response helper
 */
export const createSuccessResponse = (data?: any, status = 200): NextResponse => {
  const response = data === undefined ? { success: true } : data;
  return NextResponse.json(response, { status });
};

/**
 * Validate request body and parse JSON
 */
export const parseRequestBody = async (request: Request): Promise<any> => {
  try {
    const body = await request.json();
    return { success: true, data: body };
  } catch (error) {
    apiLogger.warn('JSON parse error in request body:', error);
    return { success: false, error: ApiErrors.jsonParseError() };
  }
};

/**
 * Validate required fields in request body
 */
export const validateRequiredFields = (body: any, fields: string[]): { success: boolean; error?: ApiErrorResponse } => {
  const missingFields = fields.filter(field => !body[field]);
  
  if (missingFields.length > 0) {
    return {
      success: false,
      error: new ApiErrorResponse(
        `Missing required fields: ${missingFields.join(', ')}`,
        400,
        'MISSING_FIELDS',
        { missingFields }
      )
    };
  }
  
  return { success: true };
};