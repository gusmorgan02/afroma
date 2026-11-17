# AFROMA

Aplicação React/Vite de cultura afro-brasileira integrada ao Supabase para autenticação, conteúdo, eventos, favoritos e mídias.

## Rodar o site localmente

1. Instale o [Node.js](https://nodejs.org/) se ainda não estiver instalado.
2. No terminal do VS Code, abra a pasta do projeto e instale as dependências:
   ```sh
   npm install
   ```
3. Para ativar o banco, copie `.env.example` para `.env` e substitua os valores pelos encontrados em **Project Settings → API** no Supabase:
   ```env
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA_ANON
   ```
   A chave `anon`/publishable é apropriada para o frontend quando as políticas RLS estão ativas. **Nunca** coloque `service_role` ou outra chave secreta em variáveis `VITE_*`.
4. No SQL Editor do Supabase, execute a versão atualizada de [`supabase/schema.sql`](./supabase/schema.sql). Se o banco já foi configurado antes, execute o arquivo novamente para criar `cultural_music`, as políticas de acesso e as músicas iniciais.
5. Inicie o site:
   ```sh
   npm run dev
   ```
   Abra no navegador o endereço mostrado no terminal (normalmente `http://localhost:5173`).
6. Para liberar a administração, crie uma conta pela tela do site e confirme o e-mail. Somente quem tem acesso autorizado ao SQL Editor do projeto (ou um administrador já autorizado pelas políticas) pode promover uma conta; usuários comuns não conseguem alterar sua própria função. No SQL Editor, promova somente a conta aprovada:
   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'SEU_EMAIL_AUTORIZADO');
   ```
7. Publique a Edge Function de exclusão de conta com o Supabase CLI:
   ```sh
   supabase functions deploy delete-account
   ```
   A função valida a sessão do usuário e usa a chave privilegiada apenas no servidor da Edge Function. Não inclua essa chave no frontend.
   Configure também `ALLOWED_ORIGIN` nos secrets da Edge Function com a origem HTTPS exata do site publicado (sem barra final), por exemplo com `supabase secrets set ALLOWED_ORIGIN=https://seu-dominio.example`. Sem essa configuração, a função aceita apenas `http://localhost:5173`.
8. Para limitar chamadas à exclusão de conta, execute novamente `supabase/schema.sql` no SQL Editor e publique a Edge Function. A RPC `consume_user_rate_limit` permite até 5 solicitações por usuário autenticado a cada 60 segundos; excedentes recebem HTTP 429 e `Retry-After`. A tabela `user_rate_limits` é acessível somente pela `service_role` e apaga os contadores junto com a conta.
9. Para habilitar a autenticação em produção, configure o widget hCaptcha e a chave pública `hcaptcha-site-key` no `index.html`. No Supabase, em **Authentication → Bot and Abuse Protection**, habilite CAPTCHA, selecione hCaptcha e informe a chave secreta do widget. A chave secreta fica somente no painel do Supabase, nunca no frontend ou neste repositório. O app envia o token pelo Supabase Auth, que faz a validação no servidor; não adicione uma função `verifyToken` com segredo hardcoded. Autorize no hCaptcha os domínios de produção e, se necessário, de desenvolvimento. Em produção, login, cadastro e recuperação ficam bloqueados enquanto a chave pública não estiver configurada; localmente, sem a chave, o cooldown serve apenas como proteção de interface.
10. Confira em **Authentication → Rate Limits** os limites server-side do Supabase Auth. O Supabase aplica limites por IP aos endpoints de autenticação (padrão documentado: até 30 solicitações por 5 minutos para login/cadastro/recuperação, além de limites para envio de e-mail e intervalo por usuário). Esses limites são aplicados pelo serviço Supabase, não pelo cooldown do navegador; ajuste-os conforme a disponibilidade do seu projeto e confirme as configurações ativas no painel.

Sem URL e chave Supabase, as telas públicas mostram os dados de exemplo incorporados ao app, mas cadastro, login, favoritos e administração ficam indisponíveis.

## Funcionalidades conectadas

- Cadastro, login, confirmação de e-mail e recuperação/alteração de senha pelo Supabase Auth.
- Conteúdos e agenda carregados do Postgres; o painel admin permite cadastrar, editar e excluir.
- Músicas carregadas do Postgres; administradores podem cadastrar, editar e excluir faixas e seus links do YouTube.
- Administradores podem editar categoria, texto e mídia de receitas, personalidades e demais conteúdos culturais.
- Favoritos de conteúdo e música sincronizados por usuário entre dispositivos.
- Acesso administrativo determinado pela role `profiles.role`, nunca por senha embutida no código.
- A edição de músicas, conteúdos e eventos é protegida por RLS; apenas perfis com `role = 'admin'` podem gravar no banco.
- Upload de imagens e vídeos no Supabase Storage, limitado a 20 MB e tipos permitidos no bucket.
- Exclusão de conta pela Edge Function; a exclusão do usuário Auth remove perfil e favoritos via `ON DELETE CASCADE`.
- Busca por palavra-chave/categoria, calendário mensal, estado de carregamento e mensagens de erro, configurações de tamanho da fonte e suporte a leitores de tela.

## Segurança e operação

O SQL habilita RLS e restringe inserção/edição de conteúdos, eventos e mídias a administradores; cada usuário só pode ler e alterar seus próprios favoritos e perfil. Revise as políticas, os domínios de redirecionamento de Auth, backups e limites do projeto antes de publicar.

As imagens públicas do bucket `afroma-media` ficam acessíveis a qualquer pessoa com o link. Não envie conteúdo privado. Os eventos de exemplo inseridos pelo SQL são demonstrativos e devem ser confirmados/atualizados antes de divulgação.

Esta integração não configura por si só monitoramento 24/7, alertas, recuperação de desastre, revisão jurídica ou conformidade integral com a LGPD. São necessárias configuração operacional, política de privacidade, governança e testes de desempenho/segurança para produção.
