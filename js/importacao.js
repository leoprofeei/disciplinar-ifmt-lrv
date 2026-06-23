// ============================================================
// IMPORTAÇÃO EM LOTE — leitura de planilha, validação e prévia
// ============================================================

let importacaoLinhas = [];

function normalizarTexto(s) {
  return String(s || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function encontrarCursoValido(valor) {
  const norm = normalizarTexto(valor);
  return CURSOS.flatMap((g) => g.opcoes).find((c) => normalizarTexto(c) === norm) || null;
}

function encontrarIncisoValido(valor) {
  const texto = String(valor || "").trim();
  const romano = texto.split("—")[0].split("-")[0].trim().toUpperCase();
  const info = INCISOS.find((i) => i[0].toUpperCase() === romano);
  return info ? info[0] : null;
}

function parseDataBR(valor) {
  if (!valor) return null;
  if (valor instanceof Date) {
    const y = valor.getFullYear(), m = String(valor.getMonth() + 1).padStart(2, "0"), d = String(valor.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const texto = String(valor).trim();
  const m = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, dia, mes, ano] = m;
  return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

function validarLinhaImportacao(linha) {
  const erros = [];
  const nome = String(linha.nome || "").trim();
  const matricula = String(linha.matricula || "").trim();
  const cursoValido = encontrarCursoValido(linha.curso);
  const dataIso = parseDataBR(linha.data);
  const incisoValido = encontrarIncisoValido(linha.inciso);
  const descricao = String(linha.descricao || "").trim();

  if (!nome) erros.push("Nome do discente em branco");
  if (!matricula) erros.push("Matrícula em branco");
  if (!cursoValido) erros.push(`Curso não reconhecido: "${linha.curso || ""}"`);
  if (!dataIso) erros.push(`Data inválida: "${linha.data || ""}" (use DD/MM/AAAA)`);
  if (!incisoValido) erros.push(`Inciso não reconhecido: "${linha.inciso || ""}"`);

  const menorTexto = normalizarTexto(linha.menor);
  const menorIdade = menorTexto === "sim";

  return {
    nome, matricula, curso: cursoValido, dataFalta: dataIso, inciso: incisoValido, descricao, menorIdade,
    erros, valido: erros.length === 0
  };
}

function lerPlanilha(arquivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const nomeAba = workbook.SheetNames.find((n) => n.toLowerCase().includes("lan")) || workbook.SheetNames[0];
        const planilha = workbook.Sheets[nomeAba];
        const linhasBrutas = XLSX.utils.sheet_to_json(planilha, { header: 1, defval: "" });

        const linhas = linhasBrutas.slice(1).filter((l) => l.some((c) => String(c).trim() !== ""));
        const processadas = linhas.map((l) => ({
          nome: l[0], matricula: l[1], curso: l[2], data: l[3], inciso: l[4], descricao: l[5], menor: l[6]
        }));
        resolve(processadas.map(validarLinhaImportacao));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(arquivo);
  });
}

async function importarLinhasValidas(linhas) {
  const validas = linhas.filter((l) => l.valido);
  if (!validas.length) return { sucesso: 0, falha: 0, total: 0 };

  const payload = validas.map((linha) => {
    const info = incisoInfo(linha.inciso);
    return {
      nome_discente: linha.nome,
      matricula: linha.matricula,
      curso: linha.curso,
      data_falta: linha.dataFalta,
      inciso: linha.inciso,
      nivel: info[2],
      descricao: linha.descricao,
      menor_idade: linha.menorIdade
    };
  });

  const { data, error } = await supabaseClient.rpc("importar_ocorrencias_em_lote", { ocorrencias: payload });

  if (error) {
    return { sucesso: 0, falha: validas.length, total: validas.length, erro: error.message };
  }
  return { sucesso: data.inseridas, falha: validas.length - data.inseridas, total: validas.length };
}
