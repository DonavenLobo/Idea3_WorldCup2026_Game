import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*"
};

// Storage buckets that store objects under a `${userId}/...` prefix. Database
// rows cascade automatically (profiles -> auth.users, everything -> profiles),
// but storage objects must be removed explicitly.
const USER_STORAGE_BUCKETS = ["card-uploads", "card-generated", "card-final"];
const STORAGE_LIST_LIMIT = 1000;

function createAdminClient(url: string, serviceRoleKey: string) {
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

type AdminClient = ReturnType<typeof createAdminClient>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    },
    status
  });
}

/**
 * Recursively collect every object path under `prefix` in `bucket`. Supabase
 * storage returns folders as entries with a null `id`; files carry an `id` and
 * `metadata`. We recurse into folders and accumulate file paths.
 */
async function collectObjectPaths(
  admin: AdminClient,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const paths: string[] = [];
  const { data, error } = await admin.storage
    .from(bucket)
    .list(prefix, { limit: STORAGE_LIST_LIMIT });

  if (error) {
    console.error(`delete-account: list failed for ${bucket}/${prefix}:`, error.message);
    return paths;
  }

  for (const entry of data ?? []) {
    const entryPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const isFolder = entry.id === null;

    if (isFolder) {
      paths.push(...(await collectObjectPaths(admin, bucket, entryPath)));
    } else {
      paths.push(entryPath);
    }
  }

  return paths;
}

async function removeUserStorage(
  admin: AdminClient,
  userId: string
): Promise<void> {
  for (const bucket of USER_STORAGE_BUCKETS) {
    const paths = await collectObjectPaths(admin, bucket, userId);

    if (paths.length === 0) {
      continue;
    }

    const { error } = await admin.storage.from(bucket).remove(paths);

    if (error) {
      // Best-effort: a storage failure must not block account deletion. The
      // critical, compliance-relevant step is removing the auth user + rows.
      console.error(`delete-account: remove failed for ${bucket}:`, error.message);
    }
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonResponse({ error: "Supabase environment is not configured." }, 500);
  }

  const authorization = request.headers.get("Authorization");

  if (!authorization) {
    return jsonResponse({ error: "Missing Authorization header." }, 401);
  }

  // Identify the caller from their JWT. A user can only ever delete themselves.
  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authorization } }
  });
  const { data: userData, error: userError } = await supabaseUser.auth.getUser();

  if (userError || !userData.user) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  const userId = userData.user.id;
  const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceRoleKey);

  // Remove user-owned storage objects first (no FK cascade for storage).
  await removeUserStorage(supabaseAdmin, userId);

  // Hard-delete the auth user. This cascades to profiles and every
  // user-owned table via `on delete cascade`.
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteError) {
    return jsonResponse({ error: deleteError.message }, 500);
  }

  return jsonResponse({ status: "deleted" });
});
