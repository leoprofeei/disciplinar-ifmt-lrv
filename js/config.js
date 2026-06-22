// ============================================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================================
// Projeto: disciplinar-ifmt-lrv
//
// IMPORTANTE: a "Publishable key" é segura para ficar no código do site.
// NUNCA use a "Secret key" aqui — essa é secreta e nunca deve
// aparecer em um repositório público.
// ============================================================

const SUPABASE_URL = "https://forzhqpvvrrqppeekmcp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_o2SDIVJjcr6C_Y12oKaYHg_1WFAy98Y";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
