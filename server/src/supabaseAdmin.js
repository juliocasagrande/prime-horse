import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Cliente com service role: usado só no backend, nunca exposto ao browser.
// Ele ignora RLS — as checagens de perfil/permissão são feitas em middleware/auth.js
// e em cada rota antes de qualquer leitura/escrita.
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
