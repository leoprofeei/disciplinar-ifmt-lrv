# Controle Disciplinar Discente — IFMT Campus Lucas do Rio Verde

Sistema de registro e acompanhamento de infrações disciplinares discentes,
conforme a Resolução 113/2025 RTR-CONSUP/RTR/IFMT, com cálculo automático
de nível de gravidade, reincidência e alertas de progressão.

## Passo a passo de configuração

### Parte 1 — Supabase (banco de dados e login)

1. Crie uma conta em https://supabase.com (pode entrar com GitHub)
2. Clique em "New Project", dê um nome (ex.: `disciplinar-ifmt-lrv`),
   crie uma senha de banco e escolha a região "South America (São Paulo)"
3. Aguarde o projeto ser criado (1-2 minutos)
4. No menu lateral, abra "SQL Editor" → "New query"
5. Cole todo o conteúdo do arquivo `setup_supabase.sql` (fornecido junto
   com este pacote) e clique em "Run"
6. No menu lateral, abra "Project Settings" → "API"
7. Copie o "Project URL" e a chave "anon public" (NÃO use a "service_role")

### Parte 2 — Preencher a configuração do site

1. Abra o arquivo `js/config.js`
2. Substitua `COLE_AQUI_A_URL_DO_SEU_PROJETO` pelo Project URL copiado
3. Substitua `COLE_AQUI_A_CHAVE_ANON_PUBLIC` pela chave anon public copiada
4. Salve o arquivo

### Parte 3 — Publicar no GitHub Pages

1. Crie um repositório novo no GitHub (pode ser público ou privado —
   se for privado, o GitHub Pages exige plano pago; para uso gratuito,
   use repositório público)
2. Suba todos os arquivos deste pacote para o repositório (pela interface
   web do GitHub, arrastando os arquivos, ou via `git push`)
3. No repositório, vá em "Settings" → "Pages"
4. Em "Source", selecione a branch `main` e a pasta `/ (root)`
5. Clique em "Save" e aguarde 1-2 minutos
6. O GitHub vai te dar uma URL do tipo
   `https://seu-usuario.github.io/nome-do-repositorio/`

### Parte 4 — Tornar seu usuário administrador

1. Acesse a URL do site publicado e clique em "Cadastre-se"
2. Crie sua conta com seu e-mail e uma senha
3. Confirme o e-mail (o Supabase envia um link de confirmação)
4. Volte ao Supabase → "SQL Editor" → "New query" e rode o comando abaixo,
   substituindo pelo e-mail que você usou no cadastro:

   ```sql
   update public.perfis
   set papel = 'admin'
   where email = 'seu-email@exemplo.com';
   ```

5. Faça login novamente no site — agora você é administrador

### Parte 5 — Aprovar outros usuários (Coordenação / Chefia)

Por enquanto, a aprovação é feita diretamente no Supabase (uma tela de
administração dentro do próprio site pode ser adicionada depois, se
fizer sentido). Para aprovar alguém que se cadastrou:

1. No Supabase, vá em "Table Editor" → tabela `perfis`
2. Localize a linha da pessoa (pelo e-mail)
3. Clique no campo `papel` e troque de `pendente` para `coordenacao`
   ou `chefia`, conforme o caso
4. Salve — a pessoa já consegue usar o sistema no próximo login

## Estrutura de arquivos

```
index.html              página principal
css/estilo.css           estilos visuais
js/config.js              suas credenciais do Supabase (preencher)
js/regras.js              base de regras da Resolução 113/2025 (incisos, níveis, cursos)
js/auth.js                login, cadastro e sessão
js/dados.js                leitura e gravação de ocorrências
js/app.js                  lógica da interface
setup_supabase.sql        script de criação do banco (rodar uma vez)
```

## Avisos importantes

- Este sistema lida com dados pessoais de estudantes (alguns menores de
  idade). Trate o acesso ao painel do Supabase com o mesmo cuidado que
  trataria qualquer sistema com dados sensíveis — senhas fortes, acesso
  restrito.
- Este é um instrumento de apoio ao controle administrativo. As decisões
  e atos formais (aplicação de medida disciplinar, abertura de PDD,
  notificações) continuam seguindo o rito da Resolução 113/2025 e devem
  ser formalizadas nos canais oficiais (ex.: SUAP, processos eletrônicos).
- Recomenda-se manter o repositório do GitHub como privado se a hospedagem
  paga estiver disponível, já que o código-fonte (ainda que sem dados)
  ficaria visível publicamente em repositórios gratuitos.
