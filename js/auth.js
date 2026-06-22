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
