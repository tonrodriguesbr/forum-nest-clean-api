# Forum API - Clean Architecture com NestJS

API REST de um fórum de perguntas e respostas desenvolvida com NestJS, implementando os princípios de Clean Architecture e Domain-Driven Design (DDD).

## 📋 Sobre o Projeto

Esta aplicação é uma API completa para gerenciamento de um fórum, permitindo que usuários possam criar perguntas, responder, comentar e gerenciar conteúdo. O projeto foi desenvolvido com foco em boas práticas de arquitetura, separação de responsabilidades e testabilidade.

### Principais Funcionalidades

- **Autenticação e Autorização**

  - Registro de novos usuários
  - Autenticação via JWT
  - Controle de acesso baseado em roles (STUDENT/INSTRUCTOR)

- **Gerenciamento de Perguntas**

  - Criar, editar e deletar perguntas
  - Buscar perguntas recentes
  - Buscar pergunta por slug
  - Escolher melhor resposta
  - Adicionar anexos às perguntas

- **Sistema de Respostas**

  - Responder perguntas
  - Editar e deletar respostas
  - Adicionar anexos às respostas
  - Listar respostas de uma pergunta

- **Sistema de Comentários**

  - Comentar em perguntas
  - Comentar em respostas
  - Editar e deletar comentários
  - Listar comentários

- **Upload de Arquivos**
  - Upload de anexos para AWS S3/Cloudflare R2
  - Vinculação de anexos a perguntas e respostas

## 🏗️ Arquitetura

O projeto segue os princípios de **Clean Architecture** e **Domain-Driven Design**, organizando o código em camadas bem definidas:

```
src/
├── core/               # Código compartilhado entre domínios
│   ├── entities/       # Entidades base, Value Objects, Aggregate Roots
│   ├── events/         # Sistema de eventos de domínio
│   ├── errors/         # Tratamento de erros
│   └── repositories/   # Contratos de repositórios
│
├── domain/             # Camada de domínio
│   ├── forum/
│   │   ├── application/    # Casos de uso e contratos
│   │   └── enterprise/     # Entidades de domínio
│   └── notification/
│       ├── application/
│       └── enterprise/
│
└── infra/              # Camada de infraestrutura
    ├── auth/           # Autenticação e autorização
    ├── cryptography/   # Implementações de criptografia
    ├── database/       # Prisma ORM e repositórios
    ├── http/           # Controllers, DTOs, Presenters
    ├── storage/        # Upload de arquivos
    └── env/            # Configurações de ambiente
```

### Padrões Utilizados

- **Repository Pattern**: Abstração da camada de dados
- **Use Cases**: Encapsulamento de regras de negócio
- **Domain Events**: Comunicação entre agregados
- **Value Objects**: Objetos imutáveis de valor
- **Aggregate Roots**: Gerenciamento de consistência
- **Either Pattern**: Tratamento funcional de erros

## 🛠️ Tecnologias

- **[NestJS](https://nestjs.com/)** - Framework Node.js progressivo
- **[TypeScript](https://www.typescriptlang.org/)** - Superset JavaScript com tipagem estática
- **[Prisma](https://www.prisma.io/)** - ORM moderno para Node.js
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados relacional
- **[JWT](https://jwt.io/)** - Autenticação baseada em tokens
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** - Hash de senhas
- **[Zod](https://zod.dev/)** - Validação de schemas
- **[Vitest](https://vitest.dev/)** - Framework de testes
- **[AWS SDK](https://aws.amazon.com/sdk-for-javascript/)** - Upload de arquivos para S3
- **[Docker](https://www.docker.com/)** - Containerização

## 🚀 Como Executar

### Pré-requisitos

- Node.js (versão 18 ou superior)
- pnpm
- Docker e Docker Compose

### Instalação

1. Clone o repositório:

```bash
git clone https://github.com/wellingtonrodriguesbr/forum-nest-clean-api.git
cd forum-nest-clean-api
```

2. Instale as dependências:

```bash
pnpm install
```

3. Configure as variáveis de ambiente:

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Database
DATABASE_URL="postgresql://root:root@localhost:5432/nestcleandb?schema=public"

# Server
PORT=3333

# JWT
JWT_PRIVATE_KEY="sua-chave-privada"
JWT_PUBLIC_KEY="sua-chave-publica"

# AWS / Cloudflare R2
AWS_ACCESS_KEY_ID="seu-access-key"
AWS_SECRET_ACCESS_KEY_ID="seu-secret-key"
AWS_BUCKET_NAME="seu-bucket"
CLOUDFLARE_ACCOUNT_ID="seu-account-id"
```

**Gerando as chaves JWT:**

Para gerar as chaves RSA para o JWT, execute os seguintes comandos:

```bash
# Gera a chave privada
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# Gera a chave pública a partir da chave privada
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

Depois, converta as chaves para base64 para usar nas variáveis de ambiente:

```bash
# Converter chave privada para base64 (Linux/macOS)
base64 -i private_key.pem -o private_key_base64.txt

# Converter chave pública para base64 (Linux/macOS)
base64 -i public_key.pem -o public_key_base64.txt
```

Use o conteúdo dos arquivos gerados (em uma única linha) nas variáveis `JWT_PRIVATE_KEY` e `JWT_PUBLIC_KEY`.

4. Inicie o banco de dados com Docker:

```bash
docker-compose up -d
```

5. Execute as migrations:

```bash
pnpm prisma migrate dev
```

6. Inicie a aplicação:

```bash
# Desenvolvimento
pnpm start:dev

# Produção
pnpm build
pnpm start:prod
```

A API estará disponível em `http://localhost:3333`

## 🧪 Testes

O projeto possui cobertura de testes unitários e E2E:

```bash
# Testes unitários
pnpm test

# Testes unitários em modo watch
pnpm test:watch

# Testes E2E
pnpm test:e2e

# Testes E2E em modo watch
pnpm test:e2e:watch

# Cobertura de testes
pnpm test:cov
```

## 📚 Documentação da API

### Autenticação

#### POST /accounts

Criar uma nova conta de usuário.

**Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}
```

#### POST /sessions

Autenticar usuário e obter token JWT.

**Body:**

```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

### Perguntas

#### POST /questions

Criar uma nova pergunta (requer autenticação).

#### GET /questions

Buscar perguntas recentes.

#### GET /questions/:slug

Buscar pergunta por slug.

#### PUT /questions/:id

Editar uma pergunta (requer autenticação).

#### DELETE /questions/:id

Deletar uma pergunta (requer autenticação).

#### PATCH /questions/:questionId/answers/:answerId/choose-as-best

Escolher melhor resposta (requer autenticação).

### Respostas

#### POST /questions/:questionId/answers

Responder uma pergunta (requer autenticação).

#### GET /questions/:questionId/answers

Listar respostas de uma pergunta.

#### PUT /answers/:id

Editar uma resposta (requer autenticação).

#### DELETE /answers/:id

Deletar uma resposta (requer autenticação).

### Comentários

#### POST /questions/:questionId/comments

Comentar em uma pergunta (requer autenticação).

#### POST /answers/:answerId/comments

Comentar em uma resposta (requer autenticação).

#### GET /questions/:questionId/comments

Listar comentários de uma pergunta.

#### GET /answers/:answerId/comments

Listar comentários de uma resposta.

#### DELETE /questions/comments/:id

Deletar comentário de uma pergunta (requer autenticação).

#### DELETE /answers/comments/:id

Deletar comentário de uma resposta (requer autenticação).

### Anexos

#### POST /attachments

Fazer upload de um anexo (requer autenticação).

## 🗄️ Modelo de Dados

### Entidades Principais

- **User**: Usuários do sistema (STUDENT/INSTRUCTOR)
- **Question**: Perguntas criadas pelos usuários
- **Answer**: Respostas às perguntas
- **Comment**: Comentários em perguntas ou respostas
- **Attachment**: Anexos vinculados a perguntas ou respostas

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm start:dev          # Inicia em modo desenvolvimento
pnpm start:debug        # Inicia em modo debug

# Build
pnpm build              # Compila o projeto

# Testes
pnpm test               # Executa testes unitários
pnpm test:e2e           # Executa testes E2E
pnpm test:cov           # Gera relatório de cobertura

# Qualidade de código
pnpm lint               # Executa o linter
pnpm format             # Formata o código
```

## 🔐 Segurança

- Senhas são hash utilizando bcrypt
- Autenticação via JWT com chaves RSA
- Validação de dados de entrada com Zod
- Proteção de rotas com Guards do NestJS

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Desenvolvido por [Wellington Rodrigues](https://linkedin.com/in/wellingtonrodriguesbr)

---

Feito com ❤️ e NestJS
