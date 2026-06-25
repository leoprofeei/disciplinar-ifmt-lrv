-- ============================================================
-- SETUP DO BANCO DE DADOS — Sistema de Controle Disciplinar Discente
-- IFMT Campus Lucas do Rio Verde
-- Cole este script completo no SQL Editor do Supabase e clique em "Run"
-- ============================================================

-- 1. Tabela de PERFIS (vincula cada usuário autenticado a um papel)
create table public.perfis (
  id uuid references auth.users on delete cascade primary key,
  nome_completo text not null,
  email text not null,
  papel text not null default 'pendente' check (papel in ('pendente', 'coordenacao', 'chefia', 'apoio', 'admin')),
  curso_responsavel text,
  criado_em timestamp with time zone default now()
);

-- 2. Tabela de OCORRÊNCIAS (registro das infrações disciplinares)
create table public.ocorrencias (
  id uuid default gen_random_uuid() primary key,
  nome_discente text not null,
  matricula text not null,
  curso text not null,
  data_falta date not null,
  inciso text not null,
  nivel text not null check (nivel in ('leve', 'media', 'grave', 'gravissima')),
  descricao text,
  registrado_por uuid references public.perfis(id),
  registrado_por_nome text,
  menor_idade boolean default false,
  criado_em timestamp with time zone default now()
);

-- 3. Função: quando alguém cria conta, gera automaticamente uma linha em "perfis"
create function public.lidar_novo_usuario()
returns trigger as $$
begin
  insert into public.perfis (id, nome_completo, email, papel)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome_completo', new.email), new.email, 'pendente');
  return new;
end;
$$ language plpgsql security definer;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute procedure public.lidar_novo_usuario();

-- 4. Ativar Row Level Security (RLS) — controla quem pode ler/gravar o quê
alter table public.perfis enable row level security;
alter table public.ocorrencias enable row level security;

-- 5. Políticas de acesso para PERFIS
-- Qualquer usuário autenticado pode ver seu próprio perfil
create policy "usuario_ve_proprio_perfil"
  on public.perfis for select
  using (auth.uid() = id);

-- Admin pode ver todos os perfis
create policy "admin_ve_todos_perfis"
  on public.perfis for select
  using (
    exists (select 1 from public.perfis where id = auth.uid() and papel = 'admin')
  );

-- Admin pode atualizar perfis (aprovar / definir papel)
create policy "admin_atualiza_perfis"
  on public.perfis for update
  using (
    exists (select 1 from public.perfis where id = auth.uid() and papel = 'admin')
  );

-- 6. Políticas de acesso para OCORRÊNCIAS
-- Apenas usuários aprovados (coordenacao, chefia ou admin) podem ler ocorrências
create policy "aprovados_leem_ocorrencias"
  on public.ocorrencias for select
  using (
    exists (
      select 1 from public.perfis
      where id = auth.uid() and papel in ('coordenacao', 'chefia', 'apoio', 'admin')
    )
  );

-- Apenas usuários aprovados podem inserir ocorrências
create policy "aprovados_inserem_ocorrencias"
  on public.ocorrencias for insert
  with check (
    exists (
      select 1 from public.perfis
      where id = auth.uid() and papel in ('coordenacao', 'chefia', 'apoio', 'admin')
    )
  );

-- ============================================================
-- IMPORTANTE: depois de rodar este script, você precisa
-- tornar SEU PRÓPRIO usuário um "admin" manualmente.
-- Isso é feito em um segundo passo, depois de você criar
-- sua conta no site (veja instruções da Parte 2).
-- ============================================================
