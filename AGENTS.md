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

## Estilo de implementacao

- Priorizar simplicidade acima de tudo.
- Seguir o padrao de codigo existente: CommonJS, controllers pequenos, EJS e Bootstrap via CDN.
- Fazer fatias pequenas e funcionais do backlog.
- Manter a stack atual: Node.js, Express, EJS, Sequelize e PostgreSQL.
- Evitar refatoracoes amplas que nao sejam necessarias para a feature atual.

## Usuarios e privilegios

- `User` e o model Sequelize base.
- Classes de comportamento como `SimpleUser` e `SuperUser` devem ficar na camada de controller enquanto o projeto estiver simples.
- `SuperUser` significa administrador com acesso ao dashboard administrativo.
- `isPowerUser` significa permissao especial para criar novos administradores.
- O power user inicial deve continuar garantido durante a inicializacao do sistema.
- Nao confundir administrador comum com power user.

## Dashboards

- A rota publica do painel deve permanecer `/dashboard`.
- A escolha entre `dashboardUser` e `dashboardManager` deve ser feita no controller, usando informacoes preparadas por middleware.
- Evitar rotas separadas para o painel administrativo enquanto a sessao ja for suficiente para decidir a view.

## Backlog

- Atualizar `docs/backlog.md` sempre que uma historia avancar.
- Usar status simples: `Nao iniciado`, `Em andamento`, `Concluido`.
- Registrar observacoes curtas sobre o que foi entregue e o que falta.
