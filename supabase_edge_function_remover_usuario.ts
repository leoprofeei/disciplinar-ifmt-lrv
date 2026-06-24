// Edge Function: remover-usuario
// Recebe { user_id } e usa a service role key para:
// 1. Verificar se quem está chamando é admin
// 2. Impedir que o admin remova a própria conta (trava de segurança)
// 3. Remover o usuário do Auth (e, em cascata, da tabela perfis)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: perfilQuemChama } = await supabaseAdmin
      .from("perfis")
      .select("papel")
      .eq("id", userData.user.id)
      .single();

    if (!perfilQuemChama || perfilQuemChama.papel !== "admin") {
      return new Response(JSON.stringify({ error: "Apenas administradores podem remover usuários." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "ID do usuário não informado." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (user_id === userData.user.id) {
      return new Response(JSON.stringify({ error: "Você não pode remover sua própria conta." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { error: erroRemocao } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (erroRemocao) {
      return new Response(JSON.stringify({ error: erroRemocao.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ sucesso: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
