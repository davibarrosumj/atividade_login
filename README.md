# Sistema de Gestao de Estacionamento

Aplicacao web simples em Node.js, Express, EJS, Sequelize e PostgreSQL para evoluir um sistema de estacionamento a partir do backlog documentado em `docs/backlog.md`.

## Status atual

O projeto possui autenticação basica, cadastro de usuarios, separacao entre usuario comum e administrador, power user inicial e dashboards diferentes por perfil.

Funcionalidades em andamento:

- US01: exibicao de vagas disponiveis e porcentagem de ocupacao.
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
PORT=3000
ESTACIONAMENTO_CAPACIDADE_TOTAL=150
POWER_USER_PASSWORD="super123"
```

## Rotas principais

- `GET /`: tela de login.
- `GET /cadastro`: tela de cadastro.
- `POST /cadastro`: cria usuario comum ou, se a sessao for do power user, administrador.
- `POST /login`: autentica e redireciona para `/dashboard`.
- `GET /dashboard`: renderiza o dashboard correto conforme o perfil da sessao.
- `POST /logout`: encerra a sessao.

## Observacao de desenvolvimento

Atualmente `sequelize.sync({ force: true })` ainda recria o banco ao iniciar a aplicacao. Isso ajuda no ciclo inicial de desenvolvimento, mas deve ser substituido por migrations ou sincronizacao nao destrutiva antes de preservar dados reais.
