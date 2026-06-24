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
  const exibicao = { "tela-login": "flex", "tela-pendente": "flex", "tela-definir-senha": "flex", "tela-app": "block" };
  ["tela-login", "tela-pendente", "tela-definir-senha", "tela-app"].forEach((id) => {
    el(id).style.display = id === tela ? exibicao[id] : "none";
  });
}

function mostrarAba(aba) {
  ["lanc", "painel", "todos", "admin"].forEach((a) => {
    el("view-" + a).style.display = a === aba ? "block" : "none";
    el("tab-" + a).classList.toggle("active", a === aba);
  });
  if (aba === "lanc") renderizarListaOcorrencias();
  if (aba === "painel") preencherSelectAlunos();
  if (aba === "todos") renderizarVisaoGeral();
  if (aba === "admin") renderizarAdministracao();
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
    el("bloco-esqueci").style.display = "none";
  });
  el("btn-mostrar-login").addEventListener("click", () => {
    el("bloco-cadastro").style.display = "none";
    el("bloco-esqueci").style.display = "none";
    el("bloco-login").style.display = "block";
  });
  el("btn-mostrar-login-2").addEventListener("click", () => {
    el("bloco-cadastro").style.display = "none";
    el("bloco-esqueci").style.display = "none";
    el("bloco-login").style.display = "block";
  });
  el("btn-mostrar-esqueci").addEventListener("click", () => {
    el("bloco-login").style.display = "none";
    el("bloco-cadastro").style.display = "none";
    el("bloco-esqueci").style.display = "block";
  });

  el("form-esqueci").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = el("esqueci-email").value.trim();
    const msg = el("esqueci-msg");
    msg.textContent = "Enviando...";
    msg.className = "msg";
    const { error } = await enviarRecuperacaoSenha(email);
    if (error) {
      msg.textContent = "Erro: " + error.message;
      msg.className = "msg msg-erro";
      return;
    }
    msg.textContent = "Se este e-mail estiver cadastrado, você receberá um link para definir uma nova senha em poucos minutos.";
    msg.className = "msg msg-sucesso";
    el("form-esqueci").reset();
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

  const ehAdmin = perfil.papel === "admin";
  el("subtab-lote").style.display = ehAdmin ? "inline-flex" : "none";
  el("tab-admin").style.display = ehAdmin ? "flex" : "none";
  if (!ehAdmin) mostrarSubAba("individual");
  if (ehAdmin) {
    const { data: pendentes } = await listarUsuariosPendentes();
    atualizarBadgeAdmin(pendentes.length);
  }

  const { data: todasOc } = await listarTodasOcorrencias();
  cacheGruposDiscentes = agruparPorDiscente(todasOc);
  const { data: resolucoes } = await listarAlertasResolvidos();
  cacheResolucoesAlertas = resolucoes;
  atualizarBadgePainel();

  mostrarTela("tela-app");
  mostrarAba("lanc");
}

// -------------------- Lançamento --------------------

function preencherDatalistCursos() {
  const opcoes = CURSOS.flatMap((g) => g.opcoes);
  el("lista-cursos").innerHTML = opcoes.map((c) => `<option value="${c}">`).join("");
}

function preencherDatalistIncisos() {
  el("lista-incisos").innerHTML = INCISOS.map((i) => `<option value="${i[0]} — ${i[1]}">`).join("");
}

function textoIncisoParaCodigo(texto) {
  if (!texto) return "";
  const romano = texto.split("—")[0].trim().toUpperCase();
  const encontrado = INCISOS.find((i) => i[0].toUpperCase() === romano);
  return encontrado ? encontrado[0] : "";
}

function codigoIncisoParaTexto(codigo) {
  const info = INCISOS.find((i) => i[0] === codigo);
  return info ? `${info[0]} — ${info[1]}` : "";
}

function configurarBuscaInciso(idBusca, idOculto, idPreview) {
  el(idBusca).addEventListener("input", () => {
    const codigo = textoIncisoParaCodigo(el(idBusca).value);
    el(idOculto).value = codigo;
    if (idPreview) atualizarPreviewNivel();
  });
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

// -------------------- Lista de ocorrências (busca, editar, excluir) --------------------

let cacheOcorrencias = [];

async function renderizarListaOcorrencias() {
  const { data } = await listarTodasOcorrencias();
  cacheOcorrencias = data;
  aplicarFiltroOcorrencias();
}

function aplicarFiltroOcorrencias() {
  const termo = el("busca-ocorrencias").value;
  const filtradas = filtrarOcorrenciasPorTexto(cacheOcorrencias, termo)
    .slice()
    .sort((a, b) => (a.data_falta < b.data_falta ? 1 : -1));

  el("ocorrencias-tbody").innerHTML = filtradas
    .map((o) => {
      const podeGerenciar = usuarioAtual.papel === "admin" || o.registrado_por === usuarioAtual.id;
      const acoesGestao = podeGerenciar
        ? `<button class="acao-btn acao-editar btn-editar-ocorrencia" data-id="${o.id}">Editar</button>
           <button class="acao-btn acao-excluir btn-excluir-ocorrencia" data-id="${o.id}">Excluir</button>`
        : "";
      return `<tr>
        <td>${o.nome_discente}</td>
        <td class="muted">${o.curso}</td>
        <td>${formatarData(o.data_falta)}</td>
        <td>${o.inciso}</td>
        <td>${badge(o.nivel)}</td>
        <td>
          ${acoesGestao}
          <button class="acao-btn acao-editar btn-gerar-notificacao" data-id="${o.id}">Notificação</button>
        </td>
      </tr>`;
    })
    .join("") || `<tr><td colspan="6" class="muted">Nenhuma ocorrência encontrada.</td></tr>`;

  el("ocorrencias-tbody").querySelectorAll(".btn-editar-ocorrencia").forEach((btn) => {
    btn.addEventListener("click", () => abrirModalEdicao(btn.dataset.id));
  });
  el("ocorrencias-tbody").querySelectorAll(".btn-excluir-ocorrencia").forEach((btn) => {
    btn.addEventListener("click", () => confirmarExclusao(btn.dataset.id));
  });
  el("ocorrencias-tbody").querySelectorAll(".btn-gerar-notificacao").forEach((btn) => {
    btn.addEventListener("click", () => abrirModalNotificacao(btn.dataset.id, cacheOcorrencias));
  });
}

function abrirModalEdicao(id) {
  const o = cacheOcorrencias.find((x) => x.id === id);
  if (!o) return;
  el("edit-id").value = o.id;
  el("edit-nome").value = o.nome_discente;
  el("edit-matricula").value = o.matricula;
  el("edit-curso").value = o.curso;
  el("edit-data").value = o.data_falta;
  el("edit-inciso").value = o.inciso;
  el("edit-inciso-busca").value = codigoIncisoParaTexto(o.inciso);
  el("edit-desc").value = o.descricao || "";
  el("edit-menor").value = o.menor_idade ? "sim" : "nao";
  el("msg-edicao").textContent = "";
  el("modal-editar").style.display = "flex";
}

function fecharModalEdicao() {
  el("modal-editar").style.display = "none";
}

async function confirmarExclusao(id) {
  const o = cacheOcorrencias.find((x) => x.id === id);
  if (!o) return;
  const ok = confirm(`Excluir a ocorrência de ${o.nome_discente} (${formatarData(o.data_falta)})? Esta ação será registrada no histórico e não pode ser desfeita pela interface.`);
  if (!ok) return;

  const { error } = await excluirOcorrencia(id);
  if (error) {
    alert("Não foi possível excluir: " + error.message);
    return;
  }
  await renderizarListaOcorrencias();
}

function configurarModalEdicao() {
  el("btn-cancelar-edicao").addEventListener("click", fecharModalEdicao);
  el("modal-editar").addEventListener("click", (e) => {
    if (e.target.id === "modal-editar") fecharModalEdicao();
  });

  el("btn-salvar-edicao").addEventListener("click", async () => {
    const msg = el("msg-edicao");
    const payload = {
      nomeDiscente: el("edit-nome").value.trim(),
      matricula: el("edit-matricula").value.trim(),
      curso: el("edit-curso").value,
      dataFalta: el("edit-data").value,
      inciso: el("edit-inciso").value,
      descricao: el("edit-desc").value.trim(),
      menorIdade: el("edit-menor").value === "sim"
    };

    if (!payload.nomeDiscente || !payload.matricula || !payload.curso || !payload.dataFalta || !payload.inciso) {
      msg.textContent = "Preencha nome, matrícula, curso, data e inciso.";
      msg.className = "msg msg-erro";
      return;
    }

    msg.textContent = "Salvando...";
    msg.className = "msg";
    const { error } = await editarOcorrencia(el("edit-id").value, payload);
    if (error) {
      msg.textContent = "Erro: " + error.message;
      msg.className = "msg msg-erro";
      return;
    }
    fecharModalEdicao();
    await renderizarListaOcorrencias();
  });
}

// -------------------- Painel por aluno --------------------

let cacheGruposDiscentes = [];
let cacheResolucoesAlertas = [];

async function preencherSelectAlunos() {
  const { data } = await listarTodasOcorrencias();
  cacheGruposDiscentes = agruparPorDiscente(data);
  const { data: resolucoes } = await listarAlertasResolvidos();
  cacheResolucoesAlertas = resolucoes;
  renderizarOpcoesDiscentes(cacheGruposDiscentes);
  atualizarBadgePainel();
  if (cacheGruposDiscentes.length) renderizarPainelAluno(cacheGruposDiscentes[0].matricula);
  el("p-select").onchange = (e) => renderizarPainelAluno(e.target.value);
}

function alertaEstaResolvido(matricula, ultimaOcorrenciaData) {
  const resolucao = cacheResolucoesAlertas.find((r) => r.matricula === matricula);
  if (!resolucao) return false;
  return new Date(resolucao.data_acao) >= new Date(ultimaOcorrenciaData);
}

function gruposEmAlertaNaoResolvido() {
  return cacheGruposDiscentes.filter((g) => {
    const sit = calcularSituacao(g.ocorrencias);
    if (!sit.alerta) return false;
    const ultimaData = g.ocorrencias.slice().sort((a, b) => (a.data_falta > b.data_falta ? -1 : 1))[0].data_falta;
    return !alertaEstaResolvido(g.matricula, ultimaData);
  });
}

function atualizarBadgePainel() {
  const qtd = gruposEmAlertaNaoResolvido().length;
  const badgeEl = el("badge-painel");
  badgeEl.textContent = qtd;
  badgeEl.style.display = qtd > 0 ? "inline-flex" : "none";
}

function renderizarOpcoesDiscentes(grupos) {
  el("p-select").innerHTML = grupos.map((g) => `<option value="${g.matricula}">${g.nome} — ${g.matricula}</option>`).join("");
}

function abrirPainelParaMatricula(matricula) {
  mostrarAba("painel");
  setTimeout(() => {
    el("p-select").value = matricula;
    renderizarPainelAluno(matricula);
  }, 50);
}

let cacheListaPainelAtual = [];
let alertaAtualPainel = null;

async function renderizarPainelAluno(matricula) {
  const { data: lista } = await listarOcorrenciasPorMatricula(matricula);
  cacheListaPainelAtual = lista;
  const cont = el("p-conteudo");
  if (!lista.length) {
    cont.innerHTML = '<p class="muted">Nenhuma ocorrência registrada.</p>';
    return;
  }
  const sit = calcularSituacao(lista);
  const ultimaData = lista.slice().sort((a, b) => (a.data_falta > b.data_falta ? -1 : 1))[0].data_falta;
  const resolvido = sit.alerta ? alertaEstaResolvido(matricula, ultimaData) : false;
  alertaAtualPainel = sit.alerta && !resolvido ? { matricula, nome: lista[0].nome_discente, tipo: sit.alerta.tipo, msg: sit.alerta.msg } : null;

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

  if (sit.alerta && !resolvido) {
    const classe = sit.alerta.tipo.includes("gravissima") || sit.alerta.tipo.includes("grave_para") ? "alerta-critico" : "alerta-atencao";
    html += `<div class="caixa-alerta ${classe}">
      <i class="ti ti-alert-triangle"></i>
      <span style="flex:1;">${sit.alerta.msg}</span>
      <button id="btn-resolver-alerta" style="flex-shrink:0;">Resolver</button>
    </div>`;
  } else if (sit.alerta && resolvido) {
    const resolucao = cacheResolucoesAlertas.find((r) => r.matricula === matricula);
    html += `<div class="caixa-alerta alerta-atencao" style="opacity:0.75;">
      <i class="ti ti-check"></i>
      <span>Alerta tratado em ${formatarData(resolucao.data_acao)}: ${resolucao.acao_tomada}${resolucao.observacao ? " — " + resolucao.observacao : ""}</span>
    </div>`;
  }

  html += `<div class="linha-resumo" style="justify-content:flex-end; gap:10px;">
    <button id="btn-imprimir-painel">🖶 Ficha individual discente</button>
  </div>`;

  html += `<table class="tabela"><thead><tr>
      <th>Data</th><th>Inciso</th><th>Descrição</th><th>Nível</th><th>Registrado por</th><th>Notificação</th>
    </tr></thead><tbody>`;
  lista.forEach((o) => {
    html += `<tr>
      <td>${formatarData(o.data_falta)}</td>
      <td>Art. 11, ${o.inciso}</td>
      <td>${o.descricao || "—"}</td>
      <td>${badge(o.nivel)}</td>
      <td class="muted">${o.registrado_por_nome || "—"}</td>
      <td><button class="acao-btn acao-editar btn-gerar-notificacao" data-id="${o.id}">Gerar notificação</button></td>
    </tr>`;
  });
  html += `</tbody></table>`;
  cont.innerHTML = html;

  el("btn-imprimir-painel").addEventListener("click", () => imprimirOcorrenciasDiscente(lista, sit));
  cont.querySelectorAll(".btn-gerar-notificacao").forEach((btn) => {
    btn.addEventListener("click", () => abrirModalNotificacao(btn.dataset.id, lista));
  });
  const btnResolver = el("btn-resolver-alerta");
  if (btnResolver) btnResolver.addEventListener("click", () => abrirModalAlerta(alertaAtualPainel));
}

function imprimirOcorrenciasDiscente(lista, sit) {
  const primeira = lista[0];
  const linhas = lista
    .map(
      (o) => `<tr>
        <td>${formatarData(o.data_falta)}</td>
        <td>Art. 11, ${o.inciso}</td>
        <td>${o.descricao || "—"}</td>
        <td>${NIVEIS[o.nivel].label}</td>
        <td>${o.registrado_por_nome || "—"}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ficha Individual do Discente — ${primeira.nome_discente}</title>
  <style>
    body { font-family: Arial, sans-serif; color:#222; padding: 30px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .sub { color:#555; font-size: 13px; margin-bottom: 20px; }
    table { width:100%; border-collapse: collapse; font-size: 12.5px; }
    th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; }
    th { background: #1B6B45; color: #fff; }
    .resumo { margin-bottom: 16px; font-size: 13px; }
    .rodape { margin-top: 30px; font-size: 11px; color: #666; }
  </style>
  </head><body>
    <h1>IFMT — Campus Lucas do Rio Verde</h1>
    <div class="sub">Ficha Individual do Discente — Resolução 113/2025 RTR-CONSUP/RTR/IFMT</div>
    <div class="resumo">
      <strong>Discente:</strong> ${primeira.nome_discente}<br>
      <strong>Matrícula:</strong> ${primeira.matricula}<br>
      <strong>Curso:</strong> ${primeira.curso}<br>
      <strong>Nível atual:</strong> ${NIVEIS[sit.nivelAtual].label}<br>
      <strong>Total de ocorrências:</strong> ${lista.length}
    </div>
    <table>
      <thead><tr><th>Data</th><th>Inciso</th><th>Descrição</th><th>Nível</th><th>Registrado por</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    <div class="rodape">Documento gerado pelo sistema de Controle Disciplinar Discente em ${new Date().toLocaleDateString("pt-BR")}.</div>
  </body></html>`;

  const janela = window.open("", "_blank");
  janela.document.write(html);
  janela.document.close();
  janela.focus();
  setTimeout(() => janela.print(), 300);
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
      <td><span class="link-discente" data-matricula="${g.matricula}">${g.nome}</span></td>
      <td class="muted">${g.curso}</td>
      <td>${g.ocorrencias.length}</td>
      <td>${badge(g.sit.nivelAtual)}</td>
      <td class="muted">${g.sit.alerta ? "Requer atenção" : "Regular"}</td>
    </tr>`
    )
    .join("");

  el("todos-tbody").querySelectorAll(".link-discente").forEach((spanEl) => {
    spanEl.addEventListener("click", () => abrirPainelParaMatricula(spanEl.dataset.matricula));
  });

  renderizarGraficos(data, grupos);
}

let graficoNiveis = null;
let graficoCursos = null;

function renderizarGraficos(ocorrencias, grupos) {
  const coresNivel = { leve: "#3c6e1f", media: "#8a5a06", grave: "#a8531f", gravissima: "#a31616" };
  const contagemNivel = { leve: 0, media: 0, grave: 0, gravissima: 0 };
  ocorrencias.forEach((o) => { contagemNivel[o.nivel] = (contagemNivel[o.nivel] || 0) + 1; });

  const ctxNiveis = el("grafico-niveis").getContext("2d");
  if (graficoNiveis) graficoNiveis.destroy();
  graficoNiveis = new Chart(ctxNiveis, {
    type: "doughnut",
    data: {
      labels: ["Leve", "Média", "Grave", "Gravíssima"],
      datasets: [{
        data: [contagemNivel.leve, contagemNivel.media, contagemNivel.grave, contagemNivel.gravissima],
        backgroundColor: [coresNivel.leve, coresNivel.media, coresNivel.grave, coresNivel.gravissima]
      }]
    },
    options: { plugins: { legend: { position: "bottom", labels: { font: { size: 12 } } } } }
  });

  const contagemCurso = {};
  grupos.forEach((g) => {
    contagemCurso[g.curso] = (contagemCurso[g.curso] || 0) + g.ocorrencias.length;
  });
  const cursosLabels = Object.keys(contagemCurso);
  const cursosValores = Object.values(contagemCurso);

  const ctxCursos = el("grafico-cursos").getContext("2d");
  if (graficoCursos) graficoCursos.destroy();
  graficoCursos = new Chart(ctxCursos, {
    type: "bar",
    data: {
      labels: cursosLabels,
      datasets: [{ label: "Ocorrências", data: cursosValores, backgroundColor: "#F2B705" }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}

// -------------------- Importação em lote --------------------

function mostrarSubAba(sub) {
  el("sub-individual").style.display = sub === "individual" ? "block" : "none";
  el("sub-lote").style.display = sub === "lote" ? "block" : "none";
  el("subtab-individual").classList.toggle("active", sub === "individual");
  el("subtab-lote").classList.toggle("active", sub === "lote");
}

function renderizarPreviaLote(linhas) {
  importacaoLinhas = linhas;
  const validas = linhas.filter((l) => l.valido).length;
  const invalidas = linhas.length - validas;

  el("lote-total").textContent = linhas.length;
  el("lote-validas").textContent = validas;
  el("lote-invalidas").textContent = invalidas;
  el("lote-preview-wrap").style.display = "block";

  el("lote-tbody").innerHTML = linhas
    .map((l, i) => {
      const situacao = l.valido
        ? `<span style="color:var(--cor-leve); font-weight:600;">OK</span>`
        : `<span style="color:var(--cor-gravissima); font-weight:600;" title="${l.erros.join("; ")}">${l.erros.join("; ")}</span>`;
      return `<tr style="${l.valido ? "" : "background:var(--cor-gravissima-fundo);"}">
        <td>${i + 1}</td>
        <td>${l.nome || "—"}</td>
        <td>${l.matricula || "—"}</td>
        <td>${l.curso || "—"}</td>
        <td>${l.dataFalta ? formatarData(l.dataFalta) : "—"}</td>
        <td>${l.inciso || "—"}</td>
        <td style="font-size:12px;">${situacao}</td>
      </tr>`;
    })
    .join("");
}

function configurarImportacaoLote() {
  el("subtab-individual").addEventListener("click", () => mostrarSubAba("individual"));
  el("subtab-lote").addEventListener("click", () => mostrarSubAba("lote"));

  el("f-arquivo-lote").addEventListener("change", async (e) => {
    const arquivo = e.target.files[0];
    const msg = el("msg-lote-arquivo");
    if (!arquivo) return;
    msg.textContent = "Lendo planilha...";
    msg.className = "msg";
    try {
      const linhas = await lerPlanilha(arquivo);
      msg.textContent = `${linhas.length} linha(s) encontrada(s).`;
      msg.className = "msg msg-sucesso";
      renderizarPreviaLote(linhas);
    } catch (err) {
      msg.textContent = "Erro ao ler a planilha: " + err.message;
      msg.className = "msg msg-erro";
    }
  });

  el("btn-confirmar-lote").addEventListener("click", async () => {
    const msg = el("msg-lote-confirmacao");
    const validas = importacaoLinhas.filter((l) => l.valido);
    if (!validas.length) {
      msg.textContent = "Nenhuma linha válida para importar.";
      msg.className = "msg msg-erro";
      return;
    }
    msg.textContent = `Importando ${validas.length} ocorrência(s)...`;
    msg.className = "msg";
    const resultado = await importarLinhasValidas(importacaoLinhas);
    if (resultado.erro) {
      msg.textContent = "Não foi possível importar: " + resultado.erro;
      msg.className = "msg msg-erro";
      return;
    }
    msg.textContent = `Importação concluída: ${resultado.sucesso} salva(s), ${resultado.falha} com falha.`;
    msg.className = "msg msg-sucesso";
    el("f-arquivo-lote").value = "";
    el("lote-preview-wrap").style.display = "none";
    importacaoLinhas = [];
  });
}

// -------------------- Convite de usuário --------------------

function abrirModalConvite() {
  el("convite-nome").value = "";
  el("convite-email").value = "";
  el("convite-papel").value = "coordenacao";
  el("msg-convite").textContent = "";
  el("modal-convite").style.display = "flex";
}

function fecharModalConvite() {
  el("modal-convite").style.display = "none";
}

function configurarModalConvite() {
  el("btn-abrir-convite").addEventListener("click", abrirModalConvite);
  el("btn-cancelar-convite").addEventListener("click", fecharModalConvite);
  el("modal-convite").addEventListener("click", (e) => {
    if (e.target.id === "modal-convite") fecharModalConvite();
  });

  el("btn-enviar-convite").addEventListener("click", async () => {
    const msg = el("msg-convite");
    const nomeCompleto = el("convite-nome").value.trim();
    const email = el("convite-email").value.trim();
    const papel = el("convite-papel").value;

    if (!nomeCompleto || !email) {
      msg.textContent = "Preencha nome e e-mail.";
      msg.className = "msg msg-erro";
      return;
    }

    msg.textContent = "Enviando convite...";
    msg.className = "msg";

    const { error } = await convidarUsuario({ nomeCompleto, email, papel });
    if (error) {
      msg.textContent = "Erro: " + error.message;
      msg.className = "msg msg-erro";
      return;
    }

    msg.textContent = "Convite enviado com sucesso para " + email + ".";
    msg.className = "msg msg-sucesso";
    await renderizarAdministracao();
    setTimeout(fecharModalConvite, 1500);
  });
}

// -------------------- Administração (apenas admin) --------------------

const OPCOES_PAPEL = [
  { valor: "coordenacao", label: "Coordenação de Curso" },
  { valor: "chefia", label: "Chefia do Departamento de Ensino" },
  { valor: "admin", label: "Administrador" }
];

function selectPapelHtml(userId, papelAtual) {
  return `<select class="select-papel-admin" data-userid="${userId}">
    <option value="">Selecione...</option>
    ${OPCOES_PAPEL.map((o) => `<option value="${o.valor}" ${o.valor === papelAtual ? "selected" : ""}>${o.label}</option>`).join("")}
  </select>
  <button class="acao-btn acao-editar btn-aplicar-papel" data-userid="${userId}">Aplicar</button>`;
}

function atualizarBadgeAdmin(qtdPendentes) {
  const badgeEl = el("badge-admin");
  badgeEl.textContent = qtdPendentes;
  badgeEl.style.display = qtdPendentes > 0 ? "inline-flex" : "none";
}

function cardUsuarioHtml(u) {
  return `<div class="card-usuario">
    <div class="topo-usuario">
      <div>
        <p class="nome-usuario">${u.nome_completo}</p>
        <p class="email-usuario">${u.email}</p>
      </div>
      <span class="papel-badge">${PAPEL_LABEL[u.papel] || u.papel}</span>
    </div>
    <div class="acoes-usuario">
      <select class="select-papel-admin" data-userid="${u.id}">
        <option value="">Alterar papel para...</option>
        ${OPCOES_PAPEL.map((o) => `<option value="${o.valor}" ${o.valor === u.papel ? "selected" : ""}>${o.label}</option>`).join("")}
      </select>
      <button class="btn-aplicar-papel" data-userid="${u.id}">Aplicar</button>
      <button class="btn-resetar-senha" data-email="${u.email}"><i class="ti ti-mail"></i> Recuperação</button>
      <button class="btn-remover-usuario" data-userid="${u.id}" data-nome="${u.nome_completo}"><i class="ti ti-trash"></i> Remover</button>
    </div>
  </div>`;
}

async function renderizarAdministracao() {
  const msg = el("msg-admin");
  msg.textContent = "";

  const { data: pendentes, error: erroPendentes } = await listarUsuariosPendentes();
  if (erroPendentes) {
    msg.textContent = "Erro ao carregar pendentes: " + erroPendentes.message;
    msg.className = "msg msg-erro";
    return;
  }

  el("admin-pendentes-vazio").style.display = pendentes.length ? "none" : "block";
  el("admin-pendentes-tbody").innerHTML = pendentes
    .map(
      (u) => `<tr>
      <td>${u.nome_completo}</td>
      <td class="muted">${u.email}</td>
      <td class="muted">${new Date(u.criado_em).toLocaleDateString("pt-BR")}</td>
      <td>${selectPapelHtml(u.id, "")}</td>
    </tr>`
    )
    .join("");

  atualizarBadgeAdmin(pendentes.length);

  const { data: todos, error: erroTodos } = await listarTodosUsuarios();
  if (erroTodos) {
    msg.textContent = "Erro ao carregar usuários: " + erroTodos.message;
    msg.className = "msg msg-erro";
    return;
  }

  el("admin-usuarios-lista").innerHTML = todos.map(cardUsuarioHtml).join("");

  document.querySelectorAll(".btn-resetar-senha").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const email = btn.dataset.email;
      const ok = confirm(`Enviar e-mail de recuperação de senha para ${email}?`);
      if (!ok) return;
      msg.textContent = "Enviando...";
      msg.className = "msg";
      const { error } = await enviarRecuperacaoSenha(email);
      if (error) {
        msg.textContent = "Erro: " + error.message;
        msg.className = "msg msg-erro";
        return;
      }
      msg.textContent = `E-mail de recuperação enviado para ${email}.`;
      msg.className = "msg msg-sucesso";
    });
  });

  document.querySelectorAll(".btn-aplicar-papel").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const userId = btn.dataset.userid;
      const select = document.querySelector(`select[data-userid="${userId}"]`);
      const novoPapel = select.value;
      if (!novoPapel) {
        msg.textContent = "Selecione um papel antes de aplicar.";
        msg.className = "msg msg-erro";
        return;
      }
      msg.textContent = "Atualizando...";
      msg.className = "msg";
      const { error } = await alterarPapelUsuario(userId, novoPapel);
      if (error) {
        msg.textContent = "Erro: " + error.message;
        msg.className = "msg msg-erro";
        return;
      }
      msg.textContent = "Papel atualizado com sucesso.";
      msg.className = "msg msg-sucesso";
      await renderizarAdministracao();
    });
  });

  document.querySelectorAll(".btn-remover-usuario").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const userId = btn.dataset.userid;
      const nome = btn.dataset.nome;
      const ok = confirm(`Remover definitivamente o usuário "${nome}"? Esta ação não pode ser desfeita — a pessoa perderá o acesso ao sistema imediatamente.`);
      if (!ok) return;
      msg.textContent = "Removendo...";
      msg.className = "msg";
      const { error } = await removerUsuario(userId);
      if (error) {
        msg.textContent = "Erro: " + error.message;
        msg.className = "msg msg-erro";
        return;
      }
      msg.textContent = `Usuário "${nome}" removido com sucesso.`;
      msg.className = "msg msg-sucesso";
      await renderizarAdministracao();
    });
  });
}

// -------------------- Resolução de alertas --------------------

function abrirModalAlerta(alerta) {
  if (!alerta) return;
  el("alerta-matricula").value = alerta.matricula;
  el("alerta-nome").value = alerta.nome;
  el("alerta-tipo").value = alerta.tipo;
  el("alerta-descricao").textContent = `${alerta.nome} — ${alerta.msg}`;

  const opcoes = ACOES_SUGERIDAS_ALERTA[alerta.tipo] || ["Providência registrada"];
  el("alerta-acao").innerHTML = opcoes.map((o) => `<option value="${o}">${o}</option>`).join("");
  el("alerta-data").value = new Date().toISOString().slice(0, 10);
  el("alerta-obs").value = "";
  el("msg-alerta").textContent = "";

  el("modal-alerta").style.display = "flex";
}

function fecharModalAlerta() {
  el("modal-alerta").style.display = "none";
}

function configurarModalAlerta() {
  el("btn-cancelar-alerta").addEventListener("click", fecharModalAlerta);
  el("modal-alerta").addEventListener("click", (e) => {
    if (e.target.id === "modal-alerta") fecharModalAlerta();
  });

  el("btn-confirmar-alerta").addEventListener("click", async () => {
    const msg = el("msg-alerta");
    const dataAcao = el("alerta-data").value;
    if (!dataAcao) {
      msg.textContent = "Informe a data da ação.";
      msg.className = "msg msg-erro";
      return;
    }
    msg.textContent = "Salvando...";
    msg.className = "msg";

    const { error } = await registrarResolucaoAlerta({
      matricula: el("alerta-matricula").value,
      nomeDiscente: el("alerta-nome").value,
      tipoAlerta: el("alerta-tipo").value,
      acaoTomada: el("alerta-acao").value,
      dataAcao,
      observacao: el("alerta-obs").value.trim()
    });

    if (error) {
      msg.textContent = "Erro: " + error.message;
      msg.className = "msg msg-erro";
      return;
    }

    fecharModalAlerta();
    const { data: resolucoes } = await listarAlertasResolvidos();
    cacheResolucoesAlertas = resolucoes;
    atualizarBadgePainel();
    renderizarPainelAluno(el("alerta-matricula").value);
  });
}

// -------------------- Notificação de medida disciplinar --------------------

function abrirModalNotificacao(id, listaOcorrencias) {
  const o = listaOcorrencias.find((x) => x.id === id) || cacheOcorrencias.find((x) => x.id === id);
  if (!o) return;
  ocorrenciaParaNotificar = o;

  const sugestao = sugerirTextoNotificacao(o);
  el("not-data").value = new Date().toISOString().slice(0, 10);
  el("not-texto-principal").value = sugestao.textoPrincipal;
  el("not-fundamentacao").value = sugestao.fundamentacao;
  el("not-considerandos").value = "";
  el("not-tipo-falta").value = sugestao.tipoFalta;
  el("not-medida").value = sugestao.medida;
  el("not-rodape").value = sugestao.rodape;

  el("modal-notificacao").style.display = "flex";
}

function fecharModalNotificacao() {
  el("modal-notificacao").style.display = "none";
}

function coletarDadosNotificacaoForm() {
  return {
    dataFormatadaExtenso: dataExtenso(el("not-data").value),
    textoPrincipal: el("not-texto-principal").value.trim(),
    fundamentacao: el("not-fundamentacao").value.trim(),
    considerandos: el("not-considerandos").value.trim(),
    tipoFalta: el("not-tipo-falta").value.trim(),
    medida: el("not-medida").value.trim(),
    rodape: el("not-rodape").value.trim()
  };
}

function abrirPreviaNotificacao() {
  if (!ocorrenciaParaNotificar) return;
  const dados = coletarDadosNotificacaoForm();
  renderizarPreviaNotificacao(dados);
  el("msg-previa-notificacao").textContent = "";
  el("modal-notificacao").style.display = "none";
  el("modal-previa-notificacao").style.display = "flex";
}

function fecharPreviaNotificacao() {
  el("modal-previa-notificacao").style.display = "none";
}

function configurarModalNotificacao() {
  el("btn-cancelar-notificacao").addEventListener("click", fecharModalNotificacao);
  el("modal-notificacao").addEventListener("click", (e) => {
    if (e.target.id === "modal-notificacao") fecharModalNotificacao();
  });

  el("btn-ver-previa-notificacao").addEventListener("click", abrirPreviaNotificacao);

  el("btn-voltar-editar-notificacao").addEventListener("click", () => {
    el("modal-previa-notificacao").style.display = "none";
    el("modal-notificacao").style.display = "flex";
  });

  el("modal-previa-notificacao").addEventListener("click", (e) => {
    if (e.target.id === "modal-previa-notificacao") fecharPreviaNotificacao();
  });

  el("btn-imprimir-notificacao").addEventListener("click", imprimirPreviaNotificacao);

  el("btn-copiar-notificacao").addEventListener("click", async () => {
    const dados = coletarDadosNotificacaoForm();
    const ok = await copiarTextoNotificacao(dados);
    const msg = el("msg-previa-notificacao");
    msg.textContent = ok ? "Texto copiado para a área de transferência." : "Não foi possível copiar automaticamente. Selecione e copie manualmente.";
    msg.className = ok ? "msg msg-sucesso" : "msg msg-erro";
  });

  el("btn-baixar-notificacao").addEventListener("click", () => {
    if (!ocorrenciaParaNotificar) return;
    const o = ocorrenciaParaNotificar;
    const dados = coletarDadosNotificacaoForm();
    const html = gerarHtmlNotificacaoCompleto(dados);
    downloadComoDoc(`Notificacao_${o.nome_discente}_${formatarData(o.data_falta).replace(/\//g, "-")}`, html);
    fecharPreviaNotificacao();
  });
}

// -------------------- Inicialização --------------------

document.addEventListener("DOMContentLoaded", async () => {
  configurarTelaLogin();
  configurarFormularioLancamento();
  configurarImportacaoLote();
  configurarModalEdicao();
  configurarModalNotificacao();
  configurarModalAlerta();
  configurarModalConvite();
  preencherDatalistCursos();
  preencherDatalistIncisos();
  configurarBuscaInciso("f-inciso-busca", "f-inciso", true);
  configurarBuscaInciso("edit-inciso-busca", "edit-inciso", false);

  el("busca-ocorrencias").addEventListener("input", aplicarFiltroOcorrencias);
  el("p-busca").addEventListener("input", () => {
    const termo = el("p-busca").value.trim().toLowerCase();
    const filtrados = !termo
      ? cacheGruposDiscentes
      : cacheGruposDiscentes.filter((g) => g.nome.toLowerCase().includes(termo) || g.matricula.toLowerCase().includes(termo));
    renderizarOpcoesDiscentes(filtrados);
    if (filtrados.length) renderizarPainelAluno(filtrados[0].matricula);
  });

  el("tab-lanc").addEventListener("click", () => mostrarAba("lanc"));
  el("tab-painel").addEventListener("click", () => mostrarAba("painel"));
  el("tab-todos").addEventListener("click", () => mostrarAba("todos"));
  el("tab-admin").addEventListener("click", () => mostrarAba("admin"));
  el("btn-sair").addEventListener("click", sair);
  el("btn-sair-pendente").addEventListener("click", sair);
  configurarFormularioDefinirSenha();

  let fluxoRecuperacaoDetectado = detectarFluxoDefinirSenha();

  // O evento PASSWORD_RECOVERY é disparado pela própria biblioteca do Supabase
  // de forma confiável, independentemente do formato da URL (hash ou PKCE).
  // Usamos isso como sinal definitivo, complementando a checagem manual da URL.
  supabaseClient.auth.onAuthStateChange((event, sessao) => {
    if (event === "PASSWORD_RECOVERY") {
      fluxoRecuperacaoDetectado = true;
      mostrarTela("tela-definir-senha");
    }
  });

  // Pequena espera para dar tempo do evento PASSWORD_RECOVERY (se houver)
  // disparar antes de decidirmos qual tela mostrar.
  await new Promise((resolve) => setTimeout(resolve, 400));

  const { data: sessao } = await supabaseClient.auth.getSession();
  if (sessao.session && (fluxoRecuperacaoDetectado || detectarFluxoDefinirSenha())) {
    mostrarTela("tela-definir-senha");
  } else if (sessao.session) {
    await iniciarAposLogin();
  } else {
    mostrarTela("tela-login");
  }
});

function configurarFormularioDefinirSenha() {
  el("form-definir-senha").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = el("msg-definir-senha");
    const senha = el("nova-senha").value;
    const confirmar = el("nova-senha-confirmar").value;

    if (senha.length < 6) {
      msg.textContent = "A senha deve ter pelo menos 6 caracteres.";
      msg.className = "msg msg-erro";
      return;
    }
    if (senha !== confirmar) {
      msg.textContent = "As senhas não coincidem.";
      msg.className = "msg msg-erro";
      return;
    }

    msg.textContent = "Salvando...";
    msg.className = "msg";

    const { error } = await definirNovaSenha(senha);
    if (error) {
      msg.textContent = "Erro ao salvar senha: " + error.message;
      msg.className = "msg msg-erro";
      return;
    }

    msg.textContent = "Senha definida com sucesso! Entrando...";
    msg.className = "msg msg-sucesso";
    history.replaceState(null, "", window.location.pathname);
    setTimeout(() => iniciarAposLogin(), 800);
  });
}
