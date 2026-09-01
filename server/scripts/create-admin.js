import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const [, , name, email, password] = process.argv;
if (!name || !email || !password) {
  console.error("Uso: node scripts/create-admin.js \"Nome\" email@exemplo.com SenhaTemp123");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name, role: "admin" },
});

if (error) {
  console.error("Erro:", error.message);
  process.exit(1);
}

console.log("Usuário admin criado:", data.user.id, data.user.email);
