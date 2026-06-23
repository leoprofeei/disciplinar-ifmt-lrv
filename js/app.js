// ============================================================
// APP — controla telas, navegação e interações da interface
// ============================================================

const el = (id) => document.getElementById(id);

function badge(nivel) {
  const n = NIVEIS[nivel];
  return `<span class="badge badge-${nivel}">${n.label}</span>`;
}

function formatarData(iso) {
  return iso.split("-").reverse().join("/");
}

// -------------------- Telas --------------------

function mostrarTela(tela) {
  const exibicao = { "tela-login": "flex", "tela-pendente": "flex", "tela-app": "block" };
  ["tela-login", "tela-pendente", "tela-app"].forEach((id) => {
    el(id).style.display = id === tela ? exibicao[id] : "none";
  });
}

function mostrarAba(aba) {
  ["lanc", "painel", "todos"].forEach((a) => {
    el("view-" + a).style.display = a === aba ? "block" : "none";
    el("tab-" + a).classList.toggle("active", a === aba);
  });
  if (aba === "painel") preencherSelectAlunos();
  if (aba === "todos") renderizarVisaoGeral();
}

// -------------------- Login / Cadastro --------------------

function configurarTelaLogin() {
  el("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = el("login-email").value.trim();
    const senha = el("login-senha").value;
    const msg = el("login-msg");
    msg.textContent = "Entrando...";
    const { error } = await entrar(email, senha);
    if (error) {
      msg.textContent = "Erro: " + error.message;
      msg.className = "msg msg-erro";
      return;
    }
    await iniciarAposLogin();
  });

  el("form-cadastro").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = el("cad-nome").value.trim();
    const email = el("cad-email").value.trim();
    const senha = el("cad-senha").value;
    const msg = el("cadastro-msg");
    msg.textContent = "Criando conta...";
    const { error } = await cadastrar(email, senha, nome);
    if (error) {
      msg.textContent = "Erro: " + error.message;
      msg.className = "msg msg-erro";
      return;
    }
    msg.textContent = "Conta criada! Verifique seu e-mail para confirmar, depois faça login. Seu acesso ficará pendente de aprovação.";
    msg.className = "msg msg-sucesso";
    el("form-cadastro").reset();
  });

  el("btn-mostrar-cadastro").addEventListener("click", () => {
    el("bloco-login").style.display = "none";
    el("bloco-cadastro").style.display = "block";
  });
  el("btn-mostrar-login").addEventListener("click", () => {
    el("bloco-cadastro").style.display = "none";
    el("bloco-login").style.display = "block";
  });
}

async function iniciarAposLogin() {
  const perfil = await carregarPerfilAtual();
  if (!perfil) {
    mostrarTela("tela-login");
    return;
  }
  if (perfil.papel === "pendente") {
    mostrarTela("tela-pendente");
    return;
  }
  el("usuario-nome").textContent = perfil.nome_completo;
  el("usuario-papel").textContent = perfil.papel === "coordenacao" ? "Coordenação de Curso" : perfil.papel === "chefia" ? "Chefia do Departamento de Ensino" : "Administrador";
  mostrarTela("tela-app");
  mostrarAba("lanc");
}

// -------------------- Lançamento --------------------

function preencherSelectCursos() {
  el("f-curso").innerHTML =
    '<option value="">Selecione o curso...</option>' +
    CURSOS.map((g) => `<optgroup label="${g.grupo}">` + g.opcoes.map((c) => `<option value="${c}">${c}</option>`).join("") + `</optgroup>`).join("");
}

function preencherSelectIncisos() {
  el("f-inciso").innerHTML =
    '<option value="">Selecione o inciso...</option>' +
    INCISOS.map((i) => `<option value="${i[0]}">Art. 11, inciso ${i[0]} — ${i[1]}</option>`).join("");
}

function atualizarPreviewNivel() {
  const val = el("f-inciso").value;
  if (!val) {
    el("f-nivel-preview").innerHTML = "";
    return;
  }
  const info = incisoInfo(val);
  const n = NIVEIS[info[2]];
  el("f-nivel-preview").innerHTML = `
    <div class="preview-nivel">
      <span>Classificação automática: ${badge(info[2])}</span>
      <span class="muted">Medida prevista: ${n.medida}</span>
    </div>`;
}

function configurarFormularioLancamento() {
  el("form-lancamento").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = el("msg-salvo");
    msg.textContent = "Salvando...";
    msg.className = "msg";

    const payload = {
      nomeDiscente: el("f-nome").value.trim(),
      matricula: el("f-matricula").value.trim(),
      curso: el("f-curso").value,
      dataFalta: el("f-data").value,
      inciso: el("f-inciso").value,
      descricao: el("f-desc").value.trim(),
      menorIdade: el("f-menor").value === "sim"
    };

    if (!payload.nomeDiscente || !payload.matricula || !payload.curso || !payload.dataFalta || !payload.inciso) {
      msg.textContent = "Preencha nome, matrícula, curso, data e inciso.";
      msg.className = "msg msg-erro";
      return;
    }

    const { error, nivel } = await registrarOcorrencia(payload);
    if (error) {
      msg.textContent = "Erro ao salvar: " + error.message;
      msg.className = "msg msg-erro";
      return;
    }

    const { data: historico } = await listarOcorrenciasPorMatricula(payload.matricula);
    const sit = calcularSituacao(historico);

    msg.className = "msg msg-sucesso";
    msg.innerHTML = `Ocorrência registrada. Nível: ${badge(nivel)}. ` + (sit.alerta ? `<br><span class="texto-alerta">${sit.alerta.msg}</span>` : "Sem alertas de progressão neste momento.");

    el("form-lancamento").reset();
  });
}

// -------------------- Painel por aluno --------------------

async function preencherSelectAlunos() {
  const { data } = await listarTodasOcorrencias();
  const grupos = agruparPorDiscente(data);
  el("p-select").innerHTML = grupos.map((g) => `<option value="${g.matricula}">${g.nome} — ${g.matricula}</option>`).join("");
  if (grupos.length) renderizarPainelAluno(grupos[0].matricula);
  el("p-select").onchange = (e) => renderizarPainelAluno(e.target.value);
}

async function renderizarPainelAluno(matricula) {
  const { data: lista } = await listarOcorrenciasPorMatricula(matricula);
  const cont = el("p-conteudo");
  if (!lista.length) {
    cont.innerHTML = '<p class="muted">Nenhuma ocorrência registrada.</p>';
    return;
  }
  const sit = calcularSituacao(lista);

  let html = `<div class="grid-4">`;
  ["leve", "media", "grave", "gravissima"].forEach((k) => {
    html += `<div class="card-metric"><div class="metric-label">${NIVEIS[k].label}</div><div class="metric-valor">${sit.porNivel[k]}</div></div>`;
  });
  html += `</div>`;

  html += `<div class="linha-resumo">
    <span class="muted">Curso: ${lista[0].curso}</span>
    <span class="muted">|</span>
    <span class="muted">Nível atual:</span> ${badge(sit.nivelAtual)}
    <span class="muted" style="margin-left:auto;">Total: ${lista.length} ocorrência(s)</span>
  </div>`;

  if (sit.alerta) {
    const classe = sit.alerta.tipo.includes("gravissima") || sit.alerta.tipo.includes("grave_para") ? "alerta-critico" : "alerta-atencao";
    html += `<div class="caixa-alerta ${classe}"><i class="ti ti-alert-triangle"></i><span>${sit.alerta.msg}</span></div>`;
  }

  html += `<table class="tabela"><thead><tr>
      <th>Data</th><th>Inciso</th><th>Descrição</th><th>Nível</th><th>Registrado por</th>
    </tr></thead><tbody>`;
  lista.forEach((o) => {
    html += `<tr>
      <td>${formatarData(o.data_falta)}</td>
      <td>Art. 11, ${o.inciso}</td>
      <td>${o.descricao || "—"}</td>
      <td>${badge(o.nivel)}</td>
      <td class="muted">${o.registrado_por_nome || "—"}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  cont.innerHTML = html;
}

// -------------------- Visão geral --------------------

async function renderizarVisaoGeral() {
  const { data } = await listarTodasOcorrencias();
  const grupos = agruparPorDiscente(data).map((g) => ({ ...g, sit: calcularSituacao(g.ocorrencias) }));

  const totalAlunos = grupos.length;
  const totalOcorr = data.length;
  const emAlerta = grupos.filter((g) => g.sit.alerta).length;
  const gravissimas = grupos.filter((g) => g.sit.nivelAtual === "gravissima").length;

  el("todos-resumo").innerHTML = `
    <div class="card-metric"><div class="metric-label">Discentes monitorados</div><div class="metric-valor">${totalAlunos}</div></div>
    <div class="card-metric"><div class="metric-label">Ocorrências totais</div><div class="metric-valor">${totalOcorr}</div></div>
    <div class="card-metric"><div class="metric-label">Em alerta de progressão</div><div class="metric-valor">${emAlerta}</div></div>
    <div class="card-metric"><div class="metric-label">Risco de desligamento</div><div class="metric-valor">${gravissimas}</div></div>`;

  const comAlerta = grupos.filter((g) => g.sit.alerta);
  el("todos-alertas").innerHTML = comAlerta.length
    ? comAlerta
        .map((g) => {
          const classe = g.sit.alerta.tipo.includes("gravissima") || g.sit.alerta.tipo.includes("grave_para") ? "alerta-critico" : "alerta-atencao";
          return `<div class="caixa-alerta ${classe}"><i class="ti ti-alert-triangle"></i><span><strong>${g.nome}</strong> (${g.matricula}) — ${g.sit.alerta.msg}</span></div>`;
        })
        .join("")
    : '<p class="muted">Nenhum aluno em situação de alerta no momento.</p>';

  el("todos-tbody").innerHTML = grupos
    .map(
      (g) => `<tr>
      <td>${g.nome}</td>
      <td class="muted">${g.curso}</td>
      <td>${g.ocorrencias.length}</td>
      <td>${badge(g.sit.nivelAtual)}</td>
      <td class="muted">${g.sit.alerta ? "Requer atenção" : "Regular"}</td>
    </tr>`
    )
    .join("");
}

// -------------------- Inicialização --------------------

document.addEventListener("DOMContentLoaded", async () => {
  configurarTelaLogin();
  configurarFormularioLancamento();
  preencherSelectCursos();
  preencherSelectIncisos();
  el("f-inciso").addEventListener("change", atualizarPreviewNivel);

  el("tab-lanc").addEventListener("click", () => mostrarAba("lanc"));
  el("tab-painel").addEventListener("click", () => mostrarAba("painel"));
  el("tab-todos").addEventListener("click", () => mostrarAba("todos"));
  el("btn-sair").addEventListener("click", sair);
  el("btn-sair-pendente").addEventListener("click", sair);

  const { data: sessao } = await supabaseClient.auth.getSession();
  if (sessao.session) {
    await iniciarAposLogin();
  } else {
    mostrarTela("tela-login");
  }
});
