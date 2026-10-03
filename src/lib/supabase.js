import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !key) return null;

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, key);
    } catch (err) {
      console.error('Failed to init Supabase client:', err);
      return null;
    }
  }

  return supabaseClient;
}

export async function testSupabaseConnection(url, key) {
  try {
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await client.from('products').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST205') {
        // Connected to Supabase PostgREST, but tables not yet created in PostgreSQL
        return { success: true, tablesCreated: false, message: 'Supabase credentials valid. Run SQL schema to create tables.' };
      }
      return { success: false, tablesCreated: false, error: error.message };
    }
    return { success: true, tablesCreated: true, message: 'Connected and tables live!' };
  } catch (err) {
    return { success: false, tablesCreated: false, error: err.message };
  }
}
