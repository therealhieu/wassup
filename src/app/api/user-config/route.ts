import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/user-config - Fetch user configuration
export async function GET(request: NextRequest) {
  try {
    // Get session from NextAuth
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - no session found' }, 
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const url = new URL(request.url);
    const storageKey = url.searchParams.get('key') || 'app-store-storage';

    console.log(`[API] Fetching config for user ${userId} with key ${storageKey}`);

    // Use service role key to bypass RLS (server-side only)
    const { data, error } = await supabase
      .from('user_configs')
      .select('config')
      .eq('user_id', userId)
      .eq('storage_key', storageKey);

    if (error) {
      console.error('[API] Error fetching user config from Supabase:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      return NextResponse.json(
        { error: 'Failed to fetch config', details: error.message }, 
        { status: 500 }
      );
    }

    // Check if we have any data
    if (!data || data.length === 0) {
      console.log(`[API] No config found in Supabase for user: ${userId}`);
      return NextResponse.json({ data: null });
    }

    console.log(`[API] Successfully loaded config from Supabase for user: ${userId}`);
    return NextResponse.json({ data: JSON.stringify(data[0].config) });

  } catch (e) {
    console.error('[API] Unexpected error in GET /api/user-config:', e);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST /api/user-config - Save user configuration
export async function POST(request: NextRequest) {
  try {
    // Get session from NextAuth
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - no session found' }, 
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { key: storageKey = 'app-store-storage', value } = body;

    if (!value) {
      return NextResponse.json(
        { error: 'Missing required field: value' }, 
        { status: 400 }
      );
    }

    console.log(`[API] Saving config for user ${userId} with key ${storageKey}`);

    let config;
    try {
      config = JSON.parse(value);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in value field' }, 
        { status: 400 }
      );
    }

    // Use service role key to bypass RLS (server-side only)
    const { error } = await supabase
      .from('user_configs')
      .upsert({
        user_id: userId,
        storage_key: storageKey,
        config,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,storage_key'
      });

    if (error) {
      console.error('[API] Error saving user config to Supabase:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      return NextResponse.json(
        { error: 'Failed to save config', details: error.message }, 
        { status: 500 }
      );
    }

    console.log(`[API] Successfully saved config to Supabase for user: ${userId}`);
    return NextResponse.json({ success: true });

  } catch (e) {
    console.error('[API] Unexpected error in POST /api/user-config:', e);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// DELETE /api/user-config - Remove user configuration
export async function DELETE(request: NextRequest) {
  try {
    // Get session from NextAuth
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - no session found' }, 
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const url = new URL(request.url);
    const storageKey = url.searchParams.get('key') || 'app-store-storage';

    console.log(`[API] Removing config for user ${userId} with key ${storageKey}`);

    // Use service role key to bypass RLS (server-side only)
    const { error } = await supabase
      .from('user_configs')
      .delete()
      .eq('user_id', userId)
      .eq('storage_key', storageKey);

    if (error) {
      console.error('[API] Error removing user config from Supabase:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      return NextResponse.json(
        { error: 'Failed to remove config', details: error.message }, 
        { status: 500 }
      );
    }

    console.log(`[API] Successfully removed config from Supabase for user: ${userId}`);
    return NextResponse.json({ success: true });

  } catch (e) {
    console.error('[API] Unexpected error in DELETE /api/user-config:', e);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}