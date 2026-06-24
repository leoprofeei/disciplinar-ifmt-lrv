// ============================================================
// AUTENTICAÇÃO — login, cadastro, sessão e papel do usuário
// ============================================================

let usuarioAtual = null; // { id, email, nome_completo, papel, curso_responsavel }

async function cadastrar(email, senha, nomeCompleto) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password: senha,
    options: { data: { nome_completo: nomeCompleto } }
  });
  return { data, error };
}

async function entrar(email, senha) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
  return { data, error };
}

async function sair() {
  await supabaseClient.auth.signOut();
  usuarioAtual = null;
  location.reload();
}

async function carregarPerfilAtual() {
  const { data: sessao } = await supabaseClient.auth.getSession();
  if (!sessao.session) return null;

  const userId = sessao.session.user.id;
  const { data: perfil, error } = await supabaseClient
    .from("perfis")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Erro ao carregar perfil:", error);
    return null;
  }

  usuarioAtual = perfil;
  return perfil;
}

function detectarFluxoDefinirSenha() {
  // O Supabase pode entregar essa informação de duas formas, dependendo
  // do fluxo configurado no projeto:
  // 1) Fluxo implícito (mais antigo): parâmetros depois de # na URL
  //    ex: #access_token=...&type=recovery
  // 2) Fluxo PKCE (mais novo/padrão): query string com "type" e "code"
  //    ex: ?type=recovery&code=...
  const hash = window.location.hash || "";
  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
  const tipoHash = hashParams.get("type");

  const queryParams = new URLSearchParams(window.location.search || "");
  const tipoQuery = queryParams.get("type");

  return tipoHash === "recovery" || tipoHash === "invite" || tipoQuery === "recovery" || tipoQuery === "invite";
}

async function definirNovaSenha(novaSenha) {
  const { data, error } = await supabaseClient.auth.updateUser({ password: novaSenha });
  return { data, error };
}
