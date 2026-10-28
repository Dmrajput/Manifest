const { createClient } = require("@supabase/supabase-js");

let client = null;
let clientKey = null;

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  const nextKey = `${url}::${key}`;
  if (!client || clientKey !== nextKey) {
    client = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    clientKey = nextKey;
  }

  return client;
}

function resetSupabaseAdminForTests() {
  client = null;
  clientKey = null;
}

module.exports = { getSupabaseAdmin, resetSupabaseAdminForTests };
