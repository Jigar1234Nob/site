// Deploy with: supabase functions deploy admin-users
// Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as Edge Function secrets.
// The service-role key must never be exposed to the browser.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://jigar.au",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin"
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" }
});
Deno.serve(async (req) => {
  const origin = req.headers.get("Origin") || "https://jigar.au";\n  if (req.method === "OPTIONS") return new Response("ok", { headers: corsFor(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Sign-in required" }, 401, origin);
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return json({ error: "Server function is not configured" }, 503, origin);
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "Invalid or expired session" }, 401, origin);
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: roles, error: roleError } = await admin.from("user_roles").select("role").eq("user_id", user.id);
  if (roleError) return json({ error: "Could not verify staff permissions" }, 500, origin);
  if (!(roles || []).some((r) => r.role === "admin")) return json({ error: "Administrator access required" }, 403, origin);
  let payload: { action?: string; user_id?: string; disabled?: boolean };
  try { payload = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400, origin); }
  if (payload.action === "list") {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return json({ error: error.message }, 500, origin);
    return json({ users: data.users.map((u) => ({
      id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at, banned_until: u.banned_until,
      app_metadata: u.app_metadata, user_metadata: u.user_metadata
    })) }, 200, origin);
  }
  if (!payload.user_id || payload.user_id === user.id) return json({ error: "A different target user is required" }, 400, origin);
  if (payload.action === "set_disabled") {
    const { data, error } = await admin.auth.admin.updateUserById(payload.user_id, {
      ban_duration: payload.disabled ? "876000h" : "none"
    });
    if (error) return json({ error: error.message }, 400, origin);
    await admin.from("audit_logs").insert({
      actor_id: user.id, action: payload.disabled ? "auth_user_disabled" : "auth_user_enabled",
      resource_type: "auth_user", resource_id: payload.user_id, details: {}
    });
    return json({ user_id: data.user.id, disabled: Boolean(payload.disabled) }, 200, origin);
  }
  if (payload.action === "delete") {
    const { error } = await admin.auth.admin.deleteUser(payload.user_id);
    if (error) return json({ error: error.message }, 400, origin);
    await admin.from("audit_logs").insert({
      actor_id: user.id, action: "auth_user_deleted", resource_type: "auth_user",
      resource_id: payload.user_id, details: {}
    });
    return json({ user_id: payload.user_id, deleted: true }, 200, origin);
  }
  return json({ error: "Unsupported action" }, 400, origin);
});
