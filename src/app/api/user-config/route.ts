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
    .select('config, version')
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
  return createSuccessResponse({ 
    data: JSON.stringify(data[0].config),
    version: data[0].version 
  });
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

  const { key: storageKey = STORAGE_KEYS.APP_STORE, value, version } = bodyResult.data;
  
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

  // Implement optimistic locking with retry
  const MAX_RETRIES = 3;
  let attempt = 0;
  
  while (attempt < MAX_RETRIES) {
    attempt++;
    
    try {
      if (version) {
        // Update existing record with version check
        const { data, error } = await supabase
          .from('user_configs')
          .update({
            config,
            version: version + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', request.userId)
          .eq('storage_key', storageKey)
          .eq('version', version)
          .select('version');

        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          // Version mismatch or record doesn't exist, retry
          apiLogger.warn(`Version mismatch for user ${request.userId}, attempt ${attempt}`);
          if (attempt >= MAX_RETRIES) {
            return NextResponse.json(
              { error: 'Conflict: Configuration was modified by another request' },
              { status: 409 }
            );
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          continue;
        }

        apiLogger.info(`Successfully updated config to Supabase for user: ${request.userId}`);
        return createSuccessResponse({ version: data[0].version });
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('user_configs')
          .insert({
            user_id: request.userId,
            storage_key: storageKey,
            config,
            version: 1,
            updated_at: new Date().toISOString()
          })
          .select('version');

        if (error) {
          // Check if it's a unique constraint violation
          if (error.code === '23505') {
            // Record was created by another request, retry with update
            apiLogger.warn(`Unique constraint violation for user ${request.userId}, attempt ${attempt}`);
            if (attempt >= MAX_RETRIES) {
              return NextResponse.json(
                { error: 'Conflict: Configuration was created by another request' },
                { status: 409 }
              );
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 100 * attempt));
            continue;
          }
          throw error;
        }

        apiLogger.info(`Successfully inserted config to Supabase for user: ${request.userId}`);
        return createSuccessResponse({ version: data[0].version });
      }
    } catch (error) {
      if (attempt >= MAX_RETRIES) {
        return handleSupabaseError(error, 'save config');
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 100 * attempt));
    }
  }

  return NextResponse.json(
    { error: 'Failed to save configuration after multiple attempts' },
    { status: 500 }
  );
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