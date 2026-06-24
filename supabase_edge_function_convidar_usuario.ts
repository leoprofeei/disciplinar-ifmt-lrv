// Edge Function: convidar-usuario
// Recebe { nome_completo, email, papel } e usa a service role key
// (guardada nos Secrets do Supabase, nunca exposta no site) para:
// 1. Verificar se quem está chamando é admin
// 2. Enviar o convite por e-mail via auth.admin.inviteUserByEmail
// 3. Criar o perfil já com o papel definido (em vez de "pendente")

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
      return new Response(JSON.stringify({ error: "Apenas administradores podem convidar usuários." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { nome_completo, email, papel } = await req.json();

    if (!nome_completo || !email || !papel) {
      return new Response(JSON.stringify({ error: "Dados incompletos." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!["coordenacao", "chefia", "admin"].includes(papel)) {
      return new Response(JSON.stringify({ error: "Papel inválido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: convite, error: erroConvite } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { nome_completo }
    });

    if (erroConvite) {
      return new Response(JSON.stringify({ error: erroConvite.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    await supabaseAdmin
      .from("perfis")
      .update({ papel, nome_completo })
      .eq("id", convite.user.id);

    return new Response(JSON.stringify({ sucesso: true, user_id: convite.user.id }), {
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
