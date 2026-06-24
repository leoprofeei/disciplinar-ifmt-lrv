// ============================================================
// NOTIFICAÇÃO — geração de documento de medida disciplinar (.doc)
// Modelo único, sem cabeçalho institucional (numeração e cabeçalho
// completo são gerados automaticamente pelo SUAP a partir deste texto)
// ============================================================

let ocorrenciaParaNotificar = null;

function sugerirTextoNotificacao(o) {
  const info = incisoInfo(o.inciso);
  const dataFormatada = formatarData(o.data_falta);
  const descricaoBase = o.descricao ? o.descricao.trim().replace(/\.$/, "") : "praticar conduta em desacordo com as normas institucionais";

  const textoPrincipal =
    `Informamos que o(a) discente ${o.nome_discente}, regularmente matriculado(a) no curso ${o.curso}, ` +
    `foi notificado(a) por ${descricaoBase.charAt(0).toLowerCase() + descricaoBase.slice(1)}, ocorrido(a) no dia ${dataFormatada}. ` +
    `Tal conduta configura descumprimento das normas institucionais previstas no Regulamento Disciplinar Discente do IFMT.`;

  const fundamentacao =
    `A conduta do(a) discente infringe o Regulamento Disciplinar Discente do IFMT (Resolução nº 113, de 03 de dezembro de 2025), ` +
    `especificamente o Art. 11, inciso ${o.inciso} — ${info[1]}.`;

  const rodape =
    `Esta falta disciplinar será incluída na Ficha Individual do(a) Discente para registro. Casos de reincidência poderão implicar em medida disciplinar de grau maior. ` +
    `Não havendo reincidência em faltas leves e médias, o(a) discente retornará à condição de primariedade no prazo de 01 (um) ano.`;

  return {
    textoPrincipal,
    fundamentacao,
    tipoFalta: NIVEIS[info[2]].label.toUpperCase(),
    medida: NIVEIS[info[2]].medida,
    rodape
  };
}

function corpoNotificacaoHtml(dados, esc, nl) {
  return `
  <h4>NOTIFICAÇÃO DE APLICAÇÃO DE MEDIDA DISCIPLINAR</h4>
  <p>${nl(dados.textoPrincipal)}</p>
  <p>${nl(dados.fundamentacao)}</p>
  ${dados.considerandos ? `<p>${nl(dados.considerandos)}</p>` : ""}
  <p><span class="campo-label">Tipo de falta disciplinar:</span> ${esc(dados.tipoFalta)}.<br>
  <span class="campo-label">Medida disciplinar:</span> ${esc(dados.medida)}</p>
  <p class="rodape-italico">${nl(dados.rodape)}</p>`;
}

function escHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function nlHtml(s) {
  return escHtml(s).replace(/\n/g, "<br>");
}

function renderizarPreviaNotificacao(dados) {
  el("previa-documento").innerHTML = corpoNotificacaoHtml(dados, escHtml, nlHtml);
}

function gerarHtmlNotificacaoCompleto(dados) {
  const corpo = corpoNotificacaoHtml(dados, escHtml, nlHtml);
  return `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="UTF-8"><title>Notificação de medida disciplinar</title>
<style>
  @page { size: A4; margin: 2.5cm 2cm 2cm 2cm; }
  body { font-family: Calibri, Arial, sans-serif; font-size: 12pt; color:#000; line-height:1.5; }
  h4 { text-align:center; font-size:13pt; margin: 0 0 18pt; }
  p { text-align: left; margin: 0 0 12pt; }
  .campo-label { font-weight:bold; }
  .rodape-italico { font-style: italic; margin-top: 18pt; }
</style>
</head>
<body>${corpo}</body>
</html>`;
}

function textoNotificacaoPuro(dados) {
  let partes = [
    "NOTIFICAÇÃO DE APLICAÇÃO DE MEDIDA DISCIPLINAR",
    "",
    dados.textoPrincipal,
    "",
    dados.fundamentacao
  ];
  if (dados.considerandos) partes.push("", dados.considerandos);
  partes.push("", `Tipo de falta disciplinar: ${dados.tipoFalta}.`, `Medida disciplinar: ${dados.medida}`);
  partes.push("", dados.rodape);
  return partes.join("\n");
}

function downloadComoDoc(nomeArquivo, html) {
  const blob = new Blob(["\ufeff" + html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo.replace(/\s+/g, "_") + ".doc";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function imprimirPreviaNotificacao() {
  const conteudo = el("previa-documento").innerHTML;
  const janela = window.open("", "_blank");
  janela.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Notificação de medida disciplinar</title>
    <style>
      body { font-family: Calibri, Arial, sans-serif; font-size: 12pt; color:#000; line-height:1.5; padding: 2cm; }
      h4 { text-align:center; font-size:13pt; margin: 0 0 18pt; }
      p { margin: 0 0 12pt; }
      .campo-label { font-weight:bold; }
      .rodape-italico { font-style: italic; margin-top: 18pt; }
    </style></head><body>${conteudo}</body></html>`);
  janela.document.close();
  janela.focus();
  setTimeout(() => janela.print(), 300);
}

async function copiarTextoNotificacao(dados) {
  const texto = textoNotificacaoPuro(dados);
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (e) {
    return false;
  }
}

function dataExtenso(isoOuVazia) {
  const d = isoOuVazia ? new Date(isoOuVazia + "T12:00:00") : new Date();
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}
