// ============================================================
// ADMINISTRAÇÃO — gestão de usuários (aprovar, alterar papel)
// ============================================================

async function listarUsuariosPendentes() {
  const { data, error } = await supabaseClient.rpc("listar_usuarios_pendentes");
  return { data: data || [], error };
}

async function listarTodosUsuarios() {
  const { data, error } = await supabaseClient.rpc("listar_todos_usuarios");
  return { data: data || [], error };
}

async function alterarPapelUsuario(userId, novoPapel) {
  const { data, error } = await supabaseClient.rpc("alterar_papel_usuario", {
    p_user_id: userId,
    p_novo_papel: novoPapel
  });
  return { data, error };
}

const PAPEL_LABEL = {
  pendente: "Pendente",
  coordenacao: "Coordenação de Curso",
  chefia: "Chefia do Departamento de Ensino",
  admin: "Administrador"
};

async function convidarUsuario({ nomeCompleto, email, papel }) {
  const { data: sessao } = await supabaseClient.auth.getSession();
  const token = sessao.session ? sessao.session.access_token : "";

  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/convidar-usuario`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ nome_completo: nomeCompleto, email, papel })
    });
    const resultado = await resp.json();
    if (!resp.ok) {
      return { data: null, error: { message: resultado.error || "Não foi possível enviar o convite." } };
    }
    return { data: resultado, error: null };
  } catch (e) {
    return { data: null, error: { message: "Erro de conexão ao enviar convite: " + e.message } };
  }
}
