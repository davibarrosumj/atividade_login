# Sistema de Gestao de Estacionamento

Aplicacao web simples em Node.js, Express, EJS, Sequelize e PostgreSQL para evoluir um sistema de estacionamento a partir do backlog documentado em `docs/backlog.md`.

## Status atual

O projeto possui autenticacao basica com sessao e JWT, cadastro de usuarios, separacao entre usuario comum e administrador, power user inicial e dashboards diferentes por perfil.

Funcionalidades concluidas:

- US01: exibicao de vagas disponiveis, porcentagem de ocupacao e edicao administrativa da capacidade.

Funcionalidades em andamento:

- US05: cadastro de usuarios com diferenciacao entre usuario comum, administrador e power user.

Funcionalidades ainda nao iniciadas:

- Entrada e saida de veiculos.
- Controle e consumo de tiquetes.
- Relatorios, estatisticas e historico de uso.

## Perfis de usuario

- `SimpleUser`: usuario comum, acessa o dashboard de usuario.
- `SuperUser`: administrador, acessa o dashboard administrativo.
- Power user: administrador especial e unico que pode criar novos administradores.

O power user e garantido no inicio da aplicacao:

- Nome: `admin`
- Email: `admin@mail.com`
- Senha: definida em `POWER_USER_PASSWORD`

## Configuracao

Variaveis usadas no `.env`:

```env
DB_NAME="estacionamento"
DB_USER="postgres"
DB_HOST="localhost"
DB_PASSWORD="..."
SESSION_SECRET="..."
JWT_SECRET="..."
POWER_USER_PASSWORD="..."
PORT=3000
ESTACIONAMENTO_CAPACIDADE_TOTAL=150
```

`JWT_SECRET` assina as credenciais mantidas na sessao.

## Autenticacao e mensagens

- O login cria uma sessao Express e armazena um JWT assinado em `req.session.authToken`.
- Rotas autenticadas usam `authMiddleware`, que exige JWT valido.
- Rotas que precisam apenas saber o perfil usam `adminStatusMiddleware`, que calcula privilegios sem bloquear acesso publico.
- Mensagens de erro e sucesso usam `connect-flash` e o partial `views/partials/flashMessages.ejs`.

## Rotas principais

- `GET /`: tela de login.
- `GET /cadastro`: tela de cadastro.
- `POST /cadastro`: cria usuario comum ou, se a sessao for do power user, administrador.
- `POST /login`: autentica e redireciona para `/dashboard`.
- `GET /dashboard`: renderiza o dashboard correto conforme o perfil da sessao.
- `POST /dashboard/capacidade`: altera a capacidade total de vagas, apenas para administradores.
- `POST /logout`: encerra a sessao.

No dashboard administrativo, o power user tambem ve um atalho para cadastrar novos administradores.

## Front-end

Arquivos JavaScript de interacao das views ficam em `public/` e sao servidos pelo Express como arquivos estaticos.

## Testes

`npm test` executa `scripts/test.js`, que valida a sintaxe dos arquivos JavaScript principais e renderiza as views EJS com dados minimos.

## Observacao de desenvolvimento

Atualmente `sequelize.sync({ force: true })` ainda recria o banco ao iniciar a aplicacao. Isso ajuda no ciclo inicial de desenvolvimento, mas deve ser substituido por migrations ou sincronizacao nao destrutiva antes de preservar dados reais.
