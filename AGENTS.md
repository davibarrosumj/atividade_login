# Agent Development Notes

Estas praticas devem orientar as proximas features deste projeto.

## Arquitetura

- Manter MVC estrito:
  - `app.js` ve apenas configuracao Express e `routes`.
  - `routes` ve apenas `controllers` e `middlewares`.
  - `controllers` podem ver `models`.
  - `models` representam dados e persistencia via Sequelize.
- Evitar colocar regras de dominio diretamente em `app.js`.
- Evitar criar novas camadas ou bibliotecas sem necessidade clara.
- `app.js` pode configurar middlewares globais de infraestrutura, como sessao, flash, arquivos estaticos e `routes`.
- Helpers compartilhados de autenticacao podem ficar em `middlewares` quando servirem aos middlewares, sem virar uma nova camada de dominio.

## Estilo de implementacao

- Priorizar simplicidade acima de tudo.
- Seguir o padrao de codigo existente: CommonJS, controllers pequenos, EJS e Bootstrap via CDN.
- Fazer fatias pequenas e funcionais do backlog.
- Manter a stack atual: Node.js, Express, EJS, Sequelize e PostgreSQL.
- Evitar refatoracoes amplas que nao sejam necessarias para a feature atual.
- Manter JavaScript de interacao de views em `public/`, servido pelo Express com `express.static`.
- Evitar scripts inline nas views quando a interacao puder viver em arquivo JS pequeno e especifico da tela.
- Usar partials EJS para elementos repetidos de interface, como mensagens flash.
- Usar mensagens de formulario com `connect-flash` em fluxos server-rendered, redirecionando apos POST quando fizer sentido.
- Atualizar `README.md` quando uma mudanca estrutural alterar configuracao, rotas, autenticacao, front-end ou testes.

## Autenticacao e sessao

- `SESSION_SECRET` protege a sessao Express.
- `JWT_SECRET` assina o JWT guardado em `req.session.authToken`; nao usar fallback para `SESSION_SECRET`.
- O login deve assinar no JWT apenas dados essenciais do usuario: `id`, `name`, `email`, `userType` e `isPowerUser`.
- `authMiddleware` representa autenticacao obrigatoria: sem JWT valido, a rota deve redirecionar para login.
- `adminStatusMiddleware` representa status administrativo opcional: deve calcular `req.isAdmin`, `req.isPowerUser` e `req.canCreateAdmin` sem bloquear rotas publicas.
- Quando houver repeticao entre middlewares de autenticacao, centralizar apenas a validacao comum, mantendo claro o contraste entre autenticar usuario e derivar privilegios.

## Usuarios e privilegios

- `User` e o model Sequelize base.
- Classes de comportamento como `SimpleUser` e `SuperUser` devem ficar na camada de controller enquanto o projeto estiver simples.
- `SuperUser` significa administrador com acesso ao dashboard administrativo.
- `isPowerUser` significa permissao especial para criar novos administradores.
- O power user inicial deve continuar garantido durante a inicializacao do sistema.
- Nao confundir administrador comum com power user.
- `isAdmin` deriva de `userType === 'super'`.
- `canCreateAdmin` deriva de `isPowerUser`, nao de administrador comum.

## Dashboards

- A rota publica do painel deve permanecer `/dashboard`.
- A escolha entre `dashboardUser` e `dashboardManager` deve ser feita no controller, usando informacoes preparadas por middleware.
- Evitar rotas separadas para o painel administrativo enquanto a sessao ja for suficiente para decidir a view.
- No dashboard administrativo, preferir controles HTML nativos quando forem suficientes; na edicao de capacidade total, usar apenas os controles padrao do input `type="number"`.
- O dashboard do power user deve oferecer atalho para criar novo administrador, evitando que ele precise sair do dashboard e perca o contexto de privilegio ao voltar para a tela inicial.

## Backlog

- Atualizar `docs/backlog.md` sempre que uma historia avancar.
- Usar status simples: `Nao iniciado`, `Em andamento`, `Concluido`.
- Registrar observacoes curtas sobre o que foi entregue e o que falta.

## Testes

- `npm test` deve executar algo efetivo.
- O teste atual em `scripts/test.js` deve continuar cobrindo sintaxe dos principais arquivos JavaScript e renderizacao basica das views EJS.
- Ao adicionar novo arquivo JavaScript relevante ou view EJS principal, atualizar `scripts/test.js`.

## Progresso recente

- US01 concluida: dashboards exibem vagas disponiveis/ocupacao e administrador pode editar a capacidade total de vagas.
- O dashboard administrativo usa JavaScript em `public/dashboardManager.js` para liberar edicao e salvar capacidade.
- O dashboard do power user oferece atalho direto para criar novo administrador.
- Mensagens de erro/sucesso usam `connect-flash` e `views/partials/flashMessages.ejs`.
- Autenticacao passou a usar JWT assinado na sessao, validado por helper compartilhado em `middlewares/sessionAuth.js`.
- `npm test` foi substituido por uma checagem real em `scripts/test.js`.
