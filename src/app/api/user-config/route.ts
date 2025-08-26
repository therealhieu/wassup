import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware, AuthenticatedRequest } from '@/lib/api/middleware';
import { 
  handleSupabaseError, 
  createSuccessResponse, 
  parseRequestBody, 
  validateRequiredFields 
} from '@/lib/api/errors';
import { apiLogger } from '@/lib/logger';
import { STORAGE_KEYS } from '@/lib/http/constants';

// GET /api/user-config - Fetch user configuration
export const GET = withApiMiddleware(async (request: AuthenticatedRequest): Promise<NextResponse> => {
  const url = new URL(request.url);
  const storageKey = url.searchParams.get('key') || STORAGE_KEYS.APP_STORE;

  apiLogger.info(`Fetching config for user ${request.userId} with key ${storageKey}`);

  const { data, error } = await supabase
    .from('user_configs')
    .select('config')
    .eq('user_id', request.userId)
    .eq('storage_key', storageKey);

  if (error) {
    return handleSupabaseError(error, 'fetch config');
  }

  if (!data || data.length === 0) {
    apiLogger.info(`No config found in Supabase for user: ${request.userId}`);
    return createSuccessResponse({ data: null });
  }

  apiLogger.info(`Successfully loaded config from Supabase for user: ${request.userId}`);
  return createSuccessResponse({ data: JSON.stringify(data[0].config) });
});

// POST /api/user-config - Save user configuration
export const POST = withApiMiddleware(async (request: AuthenticatedRequest): Promise<NextResponse> => {
  const bodyResult = await parseRequestBody(request);
  if (!bodyResult.success) {
    return NextResponse.json(
      { error: bodyResult.error.message }, 
      { status: bodyResult.error.statusCode }
    );
  }

  const { key: storageKey = STORAGE_KEYS.APP_STORE, value } = bodyResult.data;
  
  const validation = validateRequiredFields(bodyResult.data, ['value']);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error!.message }, 
      { status: validation.error!.statusCode }
    );
  }

  apiLogger.info(`Saving config for user ${request.userId} with key ${storageKey}`);

  let config;
  try {
    config = JSON.parse(value);
  } catch (parseError) {
    apiLogger.warn('Invalid JSON in value field:', parseError);
    return NextResponse.json(
      { error: 'Invalid JSON in value field' }, 
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('user_configs')
    .upsert({
      user_id: request.userId,
      storage_key: storageKey,
      config,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,storage_key'
    });

  if (error) {
    return handleSupabaseError(error, 'save config');
  }

  apiLogger.info(`Successfully saved config to Supabase for user: ${request.userId}`);
  return createSuccessResponse();
});

// DELETE /api/user-config - Remove user configuration
export const DELETE = withApiMiddleware(async (request: AuthenticatedRequest): Promise<NextResponse> => {
  const url = new URL(request.url);
  const storageKey = url.searchParams.get('key') || STORAGE_KEYS.APP_STORE;

  apiLogger.info(`Removing config for user ${request.userId} with key ${storageKey}`);

  const { error } = await supabase
    .from('user_configs')
    .delete()
    .eq('user_id', request.userId)
    .eq('storage_key', storageKey);

  if (error) {
    return handleSupabaseError(error, 'remove config');
  }

  apiLogger.info(`Successfully removed config from Supabase for user: ${request.userId}`);
  return createSuccessResponse();
});