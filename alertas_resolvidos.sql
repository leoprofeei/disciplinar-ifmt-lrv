-- ============================================================
-- RESOLUÇÃO DE ALERTAS — registro de providências tomadas
-- Cole no SQL Editor do Supabase e clique em "Run"
-- ============================================================

create table if not exists public.alertas_resolvidos (
  id uuid primary key default gen_random_uuid(),
  matricula text not null,
  nome_discente text not null,
  tipo_alerta text not null,
  acao_tomada text not null,
  data_acao date not null,
  observacao text,
  registrado_por uuid references public.perfis(id),
  registrado_por_nome text,
  criado_em timestamptz not null default now()
);

alter table public.alertas_resolvidos enable row level security;

drop policy if exists "alertas_select_autenticados" on public.alertas_resolvidos;
create policy "alertas_select_autenticados"
  on public.alertas_resolvidos for select
  to authenticated
  using (true);

drop policy if exists "alertas_insert_autenticados" on public.alertas_resolvidos;
create policy "alertas_insert_autenticados"
  on public.alertas_resolvidos for insert
  to authenticated
  with check (true);
