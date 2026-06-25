-- ============================================================
-- CORREÇÃO: permitir exclusão de usuários mesmo com histórico
-- vinculado (ocorrências, edições, alertas resolvidos).
-- Sem isso, o Postgres bloqueia o delete do usuário porque
-- existem registros referenciando seu perfil.
-- Cole no SQL Editor do Supabase e clique em "Run"
-- ============================================================

do $$
declare
  nome_constraint text;
begin
  -- 1) Ocorrências registradas pelo usuário
  select conname into nome_constraint
  from pg_constraint
  where conrelid = 'public.ocorrencias'::regclass
    and confrelid = 'public.perfis'::regclass;

  if nome_constraint is not null then
    execute format('alter table public.ocorrencias drop constraint %I', nome_constraint);
  end if;

  alter table public.ocorrencias
    add constraint ocorrencias_registrado_por_fkey
    foreign key (registrado_por) references public.perfis(id)
    on delete set null;

  -- 2) Histórico de edições/exclusões de ocorrências
  select conname into nome_constraint
  from pg_constraint
  where conrelid = 'public.ocorrencias_historico'::regclass
    and confrelid = 'public.perfis'::regclass;

  if nome_constraint is not null then
    execute format('alter table public.ocorrencias_historico drop constraint %I', nome_constraint);
  end if;

  alter table public.ocorrencias_historico
    add constraint ocorrencias_historico_realizado_por_fkey
    foreign key (realizado_por) references public.perfis(id)
    on delete set null;

  -- 3) Alertas resolvidos
  select conname into nome_constraint
  from pg_constraint
  where conrelid = 'public.alertas_resolvidos'::regclass
    and confrelid = 'public.perfis'::regclass;

  if nome_constraint is not null then
    execute format('alter table public.alertas_resolvidos drop constraint %I', nome_constraint);
  end if;

  alter table public.alertas_resolvidos
    add constraint alertas_resolvidos_registrado_por_fkey
    foreign key (registrado_por) references public.perfis(id)
    on delete set null;
end $$;

