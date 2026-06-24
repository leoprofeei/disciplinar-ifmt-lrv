// ============================================================
// Base de regras — Resolução 113/2025 RTR-CONSUP/RTR/IFMT
// Regulamento Disciplinar Discente do IFMT
// ============================================================

const NIVEIS = {
  leve: { label: "Leve", medida: "Advertência verbal", artigo: "Art. 17", ordem: 1 },
  media: { label: "Média", medida: "Advertência escrita / Atividade pedagógica extracurricular", artigo: "Art. 18 / Art. 19", ordem: 2 },
  grave: { label: "Grave", medida: "Suspensão / Cancelamento ou conversão de benefício", artigo: "Art. 19", ordem: 3 },
  gravissima: { label: "Gravíssima", medida: "Desligamento (expulsão ou transferência compulsória)", artigo: "Art. 20", ordem: 4 }
};

const CURSOS = [
  { grupo: "Técnico Integrado ao Ensino Médio", opcoes: ["Técnico em Agronegócio", "Técnico em Biotecnologia"] },
  { grupo: "Técnico Subsequente", opcoes: ["Técnico em Qualidade - Subsequente"] },
  { grupo: "Bacharelado", opcoes: ["Bacharelado em Biotecnologia"] }
];

// Art. 11 — incisos I a LXXII, classificados por nível conforme Art. 17 a 20
const INCISOS = [
  ["I", "Faltar com asseio e organização pessoal/dependências", "leve"],
  ["II", "Proferir palavras obscenas ou de baixo calão", "leve"],
  ["III", "Não cumprir escalas de atividades pedagógicas extracurriculares", "leve"],
  ["IV", "Descumprir normas de uso de instalações/equipamentos/serviços", "leve"],
  ["V", "Desrespeitar legislação de trânsito nas dependências", "leve"],
  ["VI", "Atitude de desrespeito a servidores/colegas/colaboradores", "leve"],
  ["VII", "Ocupar-se com atividades alheias à Instituição", "leve"],
  ["VIII", "Comparecer às aulas com atraso não justificado", "leve"],
  ["IX", "Descumprir tarefas escolares sem justificativa", "leve"],
  ["X", "Ausentar-se de sala/laboratório/biblioteca sem autorização", "leve"],
  ["XI", "Descumprir horário do campus / sem uniforme", "leve"],
  ["XII", "Permanecer em sala/laboratório após o término sem autorização", "leve"],
  ["XIII", "Alimentar-se em sala, biblioteca, auditório, laboratórios", "leve"],
  ["XIV", "Usar celular/aparelhos eletrônicos sem autorização", "media"],
  ["XV", "Gestos, códigos ou expressões impróprias/constrangedoras", "media"],
  ["XVI", "Causar danos a prédio, mobiliário, equipamentos ou materiais", "media"],
  ["XVII", "Participar/incitar atos de indisciplina com dano à estrutura", "media"],
  ["XVIII", "Causar tumultos ou perturbação nas dependências", "media"],
  ["XIX", "Utilizar indevidamente equipamentos de prevenção/combate a incêndio", "media"],
  ["XX", "Ausentar-se ou entrar no campus sem autorização/identificação", "media"],
  ["XXI", "Ausentar-se da sala/atividade sem autorização do docente", "media"],
  ["XXII", "Ausentar-se sem justificativa de programações representando o campus", "media"],
  ["XXIII", "Ignorar convocações institucionais", "media"],
  ["XXIV", "Fraude em avaliações, trabalhos ou editais", "media"],
  ["XXV", "Usar pessoas ou meios ilícitos para obter frequência/nota", "media"],
  ["XXVI", "Obrigar ou aliciar colegas a executar tarefas próprias", "media"],
  ["XXVII", "Omitir ou distorcer informações solicitadas", "media"],
  ["XXVIII", "Agir contrário aos bons usos e costumes", "media"],
  ["XXIX", "Ausentar-se da Instituição antes do término sem autorização", "media"],
  ["XXX", "Trajar vestuário inadequado/constrangedor", "media"],
  ["XXXI", "Comportamento inapropriado (carícias, beijos, deitar-se no colo)", "media"],
  ["XXXII", "Coagir colegas a comprar produtos", "media"],
  ["XXXIII", "Praticar agiotagem, jogos de azar e apostas", "media"],
  ["XXXIV", "Praticar comércio nas dependências sem autorização", "media"],
  ["XXXV", "Usar o nome da Instituição para comércio ou apoio financeiro", "media"],
  ["XXXVI", "Facilitar acesso de pessoas estranhas ao campus", "grave"],
  ["XXXVII", "Gravar vídeos com conteúdo indevido no espaço da Instituição", "grave"],
  ["XXXVIII", "Utilizar pessoal/recursos do IFMT em atividades particulares", "grave"],
  ["XXXIX", "Tentativa de furto ou roubo", "grave"],
  ["XL", "Tentativa de agressão física", "grave"],
  ["XLI", "Envolver-se em luta corporal", "grave"],
  ["XLII", "Portar/consumir/repassar bebida alcoólica ou apresentar-se alcoolizado", "grave"],
  ["XLIII", "Fumar (cigarro, DEF/vape etc.) nas dependências", "grave"],
  ["XLIV", "Frequentar ambientes inapropriados trajando uniforme", "grave"],
  ["XLV", "Retirar equipamentos/produtos de setor sem autorização", "grave"],
  ["XLVI", "Usar indevidamente a logomarca do IFMT", "grave"],
  ["XLVII", "Plagiar obras literárias, artísticas, científicas ou técnicas", "grave"],
  ["XLVIII", "Promover eventos usando o nome do IFMT sem autorização", "grave"],
  ["XLIX", "Divulgar sons/imagens institucionais sem autorização", "grave"],
  ["L", "Acessar sistemas/redes do IFMT sem autorização, prejudicando funcionamento", "grave"],
  ["LI", "Praticar atos ou gestos obscenos", "grave"],
  ["LII", "Uso indevido de ambiente virtual/redes sociais institucionais", "gravissima"],
  ["LIII", "Praticar atos que infrinjam a lei fora da Instituição trajando uniforme", "gravissima"],
  ["LIV", "Expor intencionalmente a perigo a vida ou saúde de outrem", "gravissima"],
  ["LV", "Agredir física ou moralmente colegas, servidores ou colaboradores", "gravissima"],
  ["LVI", "Portar/usar armas ou materiais inflamáveis e explosivos", "gravissima"],
  ["LVII", "Praticar ato ou delito sujeito a infração ou ação penal", "gravissima"],
  ["LVIII", "Furtar ou roubar (ato consumado)", "gravissima"],
  ["LIX", "Portar/consumir/repassar drogas ilícitas", "gravissima"],
  ["LX", "Adulterar pareceres ou documentos institucionais", "gravissima"],
  ["LXI", "Divulgar/comercializar dados de pesquisa sem autorização", "gravissima"],
  ["LXII", "Promover/incitar vandalismo ou depredar patrimônio público", "gravissima"],
  ["LXIII", "Violar leis de proteção aos animais", "gravissima"],
  ["LXIV", "Usar espaços do campus de forma indevida, colocando em risco a integridade", "gravissima"],
  ["LXV", "Usar barragens/rios/lagos do campus sem autorização", "gravissima"],
  ["LXVI", "Ridicularizar ingressantes ou aplicar trotes agressivos", "gravissima"],
  ["LXVII", "Usar computadores/internet para crimes digitais ou conteúdo inadequado", "gravissima"],
  ["LXVIII", "Violência física, psicológica, sexual, moral ou bullying/cyberbullying", "gravissima"],
  ["LXIX", "Discriminação, injúria ou violência por preconceito", "gravissima"],
  ["LXX", "Atos libidinosos, importunação sexual e assédio sexual ou moral", "gravissima"],
  ["LXXI", "Ameaçar, coagir, importunar, constranger ou perseguir (stalking)", "gravissima"],
  ["LXXII", "Descumprir medida disciplinar já aplicada", "gravissima"]
];

function incisoInfo(romano) {
  return INCISOS.find((i) => i[0] === romano);
}

// Calcula nível atual de risco e alerta de progressão a partir do histórico do discente
function calcularSituacao(lista) {
  const porNivel = { leve: 0, media: 0, grave: 0, gravissima: 0 };
  lista.forEach((o) => porNivel[o.nivel]++);

  let nivelAtual = "leve";
  let alerta = null;

  if (porNivel.leve >= 2 && porNivel.media === 0 && porNivel.grave === 0 && porNivel.gravissima === 0) {
    alerta = { tipo: "leve_para_media", msg: "Atenção: reincidência em falta leve. Próxima ocorrência pode ser reclassificada para MÉDIA (Art. 17, §1º)." };
  }
  if (porNivel.media >= 1) nivelAtual = "media";
  if (porNivel.media >= 2) {
    alerta = { tipo: "media_para_grave", msg: "Alerta: 2ª advertência escrita registrada. Reincidência aciona medida GRAVE — suspensão/cancelamento de benefício (Art. 19)." };
  }
  if (porNivel.grave >= 1) nivelAtual = "grave";
  if (porNivel.grave >= 2) {
    nivelAtual = "gravissima";
    alerta = { tipo: "grave_para_gravissima", msg: "CRÍTICO: reincidência em falta GRAVE. Caso se enquadra em DESLIGAMENTO (Art. 20) — abrir Processo Disciplinar Discente via Comissão." };
  }
  if (porNivel.gravissima >= 1) {
    nivelAtual = "gravissima";
    alerta = { tipo: "gravissima_direta", msg: "CRÍTICO: infração gravíssima registrada (Art. 11, incisos LII a LXXII). Encaminhar à Direção-Geral para instauração de PDD (Art. 20, §1º)." };
  }
  return { porNivel, nivelAtual, alerta };
}

const ACOES_SUGERIDAS_ALERTA = {
  leve_para_media: ["Advertência verbal reforçada", "Orientação registrada com responsáveis", "Outra providência"],
  media_para_grave: ["Advertência escrita aplicada", "Atividade pedagógica extracurricular aplicada", "Outra providência"],
  grave_para_gravissima: ["Processo Disciplinar Discente (PDD) instaurado via Comissão", "Suspensão/cancelamento de benefício aplicado", "Outra providência"],
  gravissima_direta: ["Encaminhado à Direção-Geral para instauração de PDD", "Medida disciplinar aplicada", "Outra providência"]
};
