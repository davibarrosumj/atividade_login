# Atividade de Reaproveitamento & Segurança de Login

Este projeto é uma aplicação web desenvolvida em Node.js com Express, Sequelize (PostgreSQL), e templates EJS, estendida com recursos avançados de segurança, reutilização de código no front-end, tratamento centralizado de erros e testes automatizados.

## 🚀 Funcionalidades Implementadas

### 1. Fluxo de Autenticação & Cadastro Seguro
* **Cadastro Completo (`/register`)**: Interface amigável para criação de novas contas com verificação de campos vazios, formato do e-mail, senhas que não coincidem e duplicidade no banco de dados.
* **Política de Senhas Fortes**: Exigência de senhas seguras (mínimo de 8 caracteres, contendo pelo menos 1 letra maiúscula, 1 minúscula e 1 número).
* **Proteção de Rotas & Sessão**: Middlewares de autenticação que impedem acessos não autorizados ao painel e redirecionam usuários logados que tentam acessar as páginas de Login ou Registro.
* **Correção de Vulnerabilidade de Logout**: Garantia de que o cookie do token JWT é devidamente invalidado e limpo ao encerrar a sessão.

### 2. Painel de Controle & Edição de Perfil
* **Editar Perfil**: Opção integrada no Dashboard para alterar Nome, E-mail e Senha.
* **Verificação de Senha Atual**: Por motivos de segurança, qualquer alteração cadastral exige a validação da senha atual.
* **Atualização Dinâmica de Sessão**: Ao salvar as alterações, um novo cookie de token JWT é emitido de forma transparente, atualizando as informações no cabeçalho sem deslogar o usuário.

### 3. Reaproveitamento de Código (EJS Partials)
As views foram refatoradas para evitar duplicações de cabeçalhos HTML, imports de CSS (Bootstrap 5) e componentes estáticos:
* `views/partials/head.ejs`: Contém meta tags de responsividade, descrição do sistema e link do Bootstrap 5 (com suporte a título dinâmico).
* `views/partials/navbar.ejs`: Barra de navegação para páginas logadas, mostrando o nome do usuário ativo e botão de sair.
* `views/partials/alerts.ejs`: Alertas de sucesso e erro unificados para exibir mensagens de validação (flash messages).
* `views/partials/footer.ejs`: Scripts comuns e bundle do Bootstrap 5.

### 4. Tratamento Centralizado de Erros
* **Error Middleware**: Middleware global do Express registrado após as rotas para interceptar quaisquer exceções inesperadas do servidor.
* **Página de Erro Personalizada (`views/error.ejs`)**: Exibe uma tela amigável para o usuário.
* **Exposição de Stack Trace Condicional**: O stack trace detalhado do erro só é renderizado em tela se a variável de ambiente `NODE_ENV` estiver configurada como `development` (ocultado em produção por motivos de segurança).

### 5. Seeding Automático do Banco de Dados
* Caso a tabela `Users` esteja vazia na inicialização do servidor, o sistema cria automaticamente duas contas de teste usando a senha fornecida na variável de ambiente `PU_PASSWORD`:
  * **Administrador**: `admin@mail.com` (nível administrativo)
  * **Usuário Comum**: `user@mail.com`

---

## 🛠️ Instalação e Execução

### 1. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com a seguinte estrutura:

```env
DB_NAME="reaproveitamento"
DB_USER="..."
DB_HOST="localhost"
DB_PASSWORD="..."
SESSION_SECRET="..."
JWT_SECRET="..."
PU_PASSWORD="..."
PORT=3000
```

### 2. Passos para Executar
1. Instale as dependências do projeto:
   ```bash
   npm install
   ```
2. Inicie o servidor da aplicação:
   ```bash
   node app.js
   # ou usando nodemon
   npx nodemon app.js
   ```
3. Acesse em seu navegador: `http://localhost:3000`

---

## 🧪 Testes Automatizados

O projeto contém uma suíte de testes unitários que utiliza o **Node.js Native Test Runner** (zero dependências extras de frameworks de teste) e stubs de banco de dados para testar de forma isolada.

Para executar os testes, utilize o comando:
```bash
npm test
```

### Escopo dos testes (33 casos de testes no total):
* **Controllers**: Verifica validações de login, registro, e edição de perfil (fluxos de sucesso e erros previstos).
* **Middlewares**: Valida a barreira de segurança de rotas restritas e redirecionamentos.
* **Seeder**: Garante que o banco de dados é populado somente quando está vazio.
* **Error Handler**: Valida a resposta do tratamento de erro global e a ocultação do stack trace em produção.
