-- ============================================================
-- AJUSTES: edição/exclusão de ocorrências, histórico de auditoria
-- e gestão de usuários (aprovar pendentes, promover a admin)
-- Cole no SQL Editor do Supabase e clique em "Run"
-- ============================================================

-- 1) Tabela de histórico de alterações em ocorrências
create table if not exists public.ocorrencias_historico (
  id uuid primary key default gen_random_uuid(),
  ocorrencia_id uuid not null,
  acao text not null check (acao in ('edicao', 'exclusao')),
  dados_anteriores jsonb,
  realizado_por uuid references public.perfis(id),
  realizado_por_nome text,
  realizado_em timestamptz not null default now()
);

alter table public.ocorrencias_historico enable row level security;

drop policy if exists "historico_select_autenticados" on public.ocorrencias_historico;
create policy "historico_select_autenticados"
  on public.ocorrencias_historico for select
  to authenticated
  using (true);

drop policy if exists "historico_insert_autenticados" on public.ocorrencias_historico;
create policy "historico_insert_autenticados"
  on public.ocorrencias_historico for insert
  to authenticated
  with check (true);

-- 2) Funções auxiliares (reaproveita eh_admin() se já existir; cria se não existir)
create or replace function public.eh_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.perfis where id = auth.uid() and papel = 'admin'
  );
$$;

-- 3) Policy de UPDATE em ocorrencias: admin edita qualquer uma;
--    coordenação/chefia só edita as que registraram
drop policy if exists "ocorrencias_update" on public.ocorrencias;
create policy "ocorrencias_update"
  on public.ocorrencias for update
  to authenticated
  using (
    public.eh_admin() or registrado_por = auth.uid()
  );

-- 4) Policy de DELETE em ocorrencias: mesma regra do update
drop policy if exists "ocorrencias_delete" on public.ocorrencias;
create policy "ocorrencias_delete"
  on public.ocorrencias for delete
  to authenticated
  using (
    public.eh_admin() or registrado_por = auth.uid()
  );

-- 5) Função RPC: edita uma ocorrência E grava histórico do estado anterior
create or replace function public.editar_ocorrencia(
  p_id uuid,
  p_nome_discente text,
  p_matricula text,
  p_curso text,
  p_data_falta date,
  p_inciso text,
  p_nivel text,
  p_descricao text,
  p_menor_idade boolean
)
returns jsonb
language plpgsql
security definer
as $$
declare
  pode_editar boolean;
  registro_anterior record;
  nome_quem_edita text;
begin
  select (public.eh_admin() or registrado_por = auth.uid())
    into pode_editar
    from public.ocorrencias where id = p_id;

  if not found then
    raise exception 'Ocorrência não encontrada.';
  end if;

  if not pode_editar then
    raise exception 'Você não tem permissão para editar esta ocorrência.';
  end if;

  select * into registro_anterior from public.ocorrencias where id = p_id;
  select nome_completo into nome_quem_edita from public.perfis where id = auth.uid();

  update public.ocorrencias set
    nome_discente = p_nome_discente,
    matricula = p_matricula,
    curso = p_curso,
    data_falta = p_data_falta,
    inciso = p_inciso,
    nivel = p_nivel,
    descricao = p_descricao,
    menor_idade = p_menor_idade
  where id = p_id;

  insert into public.ocorrencias_historico (ocorrencia_id, acao, dados_anteriores, realizado_por, realizado_por_nome)
  values (p_id, 'edicao', to_jsonb(registro_anterior), auth.uid(), nome_quem_edita);

  return jsonb_build_object('sucesso', true);
end;
$$;

grant execute on function public.editar_ocorrencia(uuid, text, text, text, date, text, text, text, boolean) to authenticated;

-- 6) Função RPC: exclui uma ocorrência E grava histórico do estado removido
create or replace function public.excluir_ocorrencia(p_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  pode_excluir boolean;
  registro record;
  nome_quem_exclui text;
begin
  select (public.eh_admin() or registrado_por = auth.uid())
    into pode_excluir
    from public.ocorrencias where id = p_id;

  if not found then
    raise exception 'Ocorrência não encontrada.';
  end if;

  if not pode_excluir then
    raise exception 'Você não tem permissão para excluir esta ocorrência.';
  end if;

  select * into registro from public.ocorrencias where id = p_id;
  select nome_completo into nome_quem_exclui from public.perfis where id = auth.uid();

  insert into public.ocorrencias_historico (ocorrencia_id, acao, dados_anteriores, realizado_por, realizado_por_nome)
  values (p_id, 'exclusao', to_jsonb(registro), auth.uid(), nome_quem_exclui);

  delete from public.ocorrencias where id = p_id;

  return jsonb_build_object('sucesso', true);
end;
$$;

grant execute on function public.excluir_ocorrencia(uuid) to authenticated;

-- 7) Função RPC: lista usuários pendentes (apenas admin pode chamar)
create or replace function public.listar_usuarios_pendentes()
returns setof public.perfis
language sql
security definer
as $$
  select * from public.perfis
  where papel = 'pendente' and public.eh_admin()
  order by criado_em asc;
$$;

grant execute on function public.listar_usuarios_pendentes() to authenticated;

-- 8) Função RPC: lista todos os usuários (apenas admin pode chamar)
create or replace function public.listar_todos_usuarios()
returns setof public.perfis
language sql
security definer
as $$
  select * from public.perfis
  where public.eh_admin()
  order by criado_em asc;
$$;

grant execute on function public.listar_todos_usuarios() to authenticated;

-- 9) Função RPC: altera o papel de um usuário (apenas admin pode chamar)
create or replace function public.alterar_papel_usuario(p_user_id uuid, p_novo_papel text)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores podem alterar papéis de usuários.';
  end if;

  if p_novo_papel not in ('pendente', 'coordenacao', 'chefia', 'admin') then
    raise exception 'Papel inválido: %', p_novo_papel;
  end if;

  update public.perfis set papel = p_novo_papel where id = p_user_id;

  return jsonb_build_object('sucesso', true);
end;
$$;

grant execute on function public.alterar_papel_usuario(uuid, text) to authenticated;
