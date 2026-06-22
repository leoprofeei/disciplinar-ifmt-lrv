// ============================================================
// DADOS — leitura e gravação de ocorrências no Supabase
// ============================================================

async function registrarOcorrencia({ nomeDiscente, matricula, curso, dataFalta, inciso, descricao, menorIdade }) {
  const info = incisoInfo(inciso);
  const nivel = info[2];

  const { data, error } = await supabaseClient.from("ocorrencias").insert([
    {
      nome_discente: nomeDiscente,
      matricula,
      curso,
      data_falta: dataFalta,
      inciso,
      nivel,
      descricao,
      registrado_por: usuarioAtual ? usuarioAtual.id : null,
      registrado_por_nome: usuarioAtual ? usuarioAtual.nome_completo : null,
      menor_idade: menorIdade
    }
  ]);

  return { data, error, nivel };
}

async function listarTodasOcorrencias() {
  const { data, error } = await supabaseClient
    .from("ocorrencias")
    .select("*")
    .order("data_falta", { ascending: true });
  return { data: data || [], error };
}

async function listarOcorrenciasPorMatricula(matricula) {
  const { data, error } = await supabaseClient
    .from("ocorrencias")
    .select("*")
    .eq("matricula", matricula)
    .order("data_falta", { ascending: true });
  return { data: data || [], error };
}

function agruparPorDiscente(ocorrencias) {
  const mapa = new Map();
  ocorrencias.forEach((o) => {
    if (!mapa.has(o.matricula)) {
      mapa.set(o.matricula, { matricula: o.matricula, nome: o.nome_discente, curso: o.curso, ocorrencias: [] });
    }
    mapa.get(o.matricula).ocorrencias.push(o);
  });
  return [...mapa.values()];
}
