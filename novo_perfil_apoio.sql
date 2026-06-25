-- ============================================================
-- NOVO PERFIL: "apoio" (Apoio Departamento de Ensino)
-- Mesmas permissões de coordenacao/chefia: lançar ocorrências,
-- editar/excluir apenas as próprias.
-- Cole no SQL Editor do Supabase e clique em "Run"
-- ============================================================

-- 1) Atualizar a constraint da tabela perfis para aceitar o novo papel
alter table public.perfis
  drop constraint if exists perfis_papel_check;

alter table public.perfis
  add constraint perfis_papel_check
  check (papel in ('pendente', 'coordenacao', 'chefia', 'apoio', 'admin'));

-- 2) Atualizar as policies de RLS da tabela ocorrencias para incluir 'apoio'
--    (descobre os nomes reais das policies de select/insert antes de recriar,
--    já que podem ter nomes diferentes dependendo de ajustes anteriores)
do $$
declare
  nome_policy text;
begin
  for nome_policy in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'ocorrencias' and cmd = 'SELECT'
  loop
    execute format('drop policy %I on public.ocorrencias', nome_policy);
  end loop;

  for nome_policy in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'ocorrencias' and cmd = 'INSERT'
  loop
    execute format('drop policy %I on public.ocorrencias', nome_policy);
  end loop;
end $$;

create policy "ocorrencias_select"
  on public.ocorrencias for select
  to authenticated
  using (
    exists (
      select 1 from public.perfis
      where id = auth.uid() and papel in ('coordenacao', 'chefia', 'apoio', 'admin')
    )
  );

create policy "ocorrencias_insert"
  on public.ocorrencias for insert
  to authenticated
  with check (
    exists (
      select 1 from public.perfis
      where id = auth.uid() and papel in ('coordenacao', 'chefia', 'apoio', 'admin')
    )
  );

-- 3) Atualizar a validação da função alterar_papel_usuario
create or replace function public.alterar_papel_usuario(p_user_id uuid, p_novo_papel text)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores podem alterar papéis de usuários.';
  end if;

  if p_novo_papel not in ('pendente', 'coordenacao', 'chefia', 'apoio', 'admin') then
    raise exception 'Papel inválido: %', p_novo_papel;
  end if;

  update public.perfis set papel = p_novo_papel where id = p_user_id;

  return jsonb_build_object('sucesso', true);
end;
$$;
