# Agenda+ - Sistema de Agendamento Online para Clínica de Massoterapia e Estética

## Visão Geral do Projeto

O **Agenda+** é um sistema web desenvolvido como Projeto de Ação Comunitária (PAC Extensionista) do curso de Engenharia de Software do **Centro Universitário Católica de Santa Catarina (Católica SC - Joinville)**.

A solução foi projetada sob medida para atender às necessidades do **Espaço Patrícia Fagundes**, gerido por Patrícia Ferreira Fagundes (MEI). O objetivo principal é automatizar o processo de agendamento de consultas de massoterapia e estética, eliminando gargalos operacionais decorrentes do controle manual via mensagens instantâneas e cadernos físicos.

O sistema proporciona autonomia de agendamento aos clientes 24 horas por dia, 7 dias por semana, além de oferecer à profissional um painel administrativo completo para gestão de horários, portfólio de serviços, pacotes de sessões e prontuário de clientes.

Em produção: [agendaplus-opal.vercel.app](https://agendaplus-opal.vercel.app)

---

## Objetivos do Projeto

### Objetivo Geral
Desenvolver e implementar um sistema online de agendamento para uma clínica de massoterapia e estética, focado em automatizar a gestão de clientes, serviços e horários, garantindo maior eficiência operacional.

### Objetivos Específicos
- **Módulo de Gestão de Clientes:** Permitir o cadastro, edição, exclusão e busca de clientes, armazenando informações de contato, histórico e observações clínicas/preferências.
- **Módulo de Gestão de Serviços:** Permitir a definição customizada de valores, durações e ativação/desativação de tratamentos oferecidos.
- **Módulo de Agendamento Interativo:** Desenvolver controle de agenda com bloqueio automático de horários ocupados e acompanhamento em formato diário, semanal e mensal através de um painel administrativo com status atualizados.

---

## Principais Funcionalidades

### Visão do Cliente
- **Cadastro e login:** com e-mail e senha ou com a conta Google. Quem entra pelo Google pode criar uma senha depois, em Configurações.
- **Recuperação de senha:** link de redefinição enviado por e-mail.
- **Agendamento 24/7:** escolha do serviço, da data no calendário e de um horário livre, separado por turno (Manhã, Tarde, Noite). Os horários já ocupados ou bloqueados não aparecem.
- **Adicionar ao calendário:** ao agendar, o compromisso abre na agenda do celular (iPhone) ou no Google Agenda já preenchido (Android e computador).
- **Meus agendamentos e histórico:** próximas sessões, cancelamento e sessões passadas.
- **Meus pacotes:** sessões restantes e validade de cada pacote. Ao agendar, a sessão é descontada automaticamente do pacote.

### Visão do Administrador (Profissional)
- **Dashboard:** atendimentos do dia, novos clientes, faturamento da semana e próximos agendamentos.
- **Agenda mensal:** calendário do mês com filtros por status, lista do dia selecionado e próximos compromissos. Daqui é possível confirmar, concluir ou cancelar. Agendamentos cancelados não aparecem na agenda.
- **Integração com o Google Agenda:** a profissional conecta a própria conta Google em Configurações, e os agendamentos passam a ser criados, atualizados e removidos automaticamente na agenda dela, inclusive no celular.
- **Gestão de clientes:** busca por nome, e-mail ou telefone; telefone e observações clínicas (ex.: alergias, intensidade da pressão); atalho para WhatsApp; agendamento em nome do cliente.
- **Gestão de serviços:** preço, duração, foto e ativação/desativação de cada tratamento.
- **Pacotes de sessões:** pacotes com um ou mais serviços, em que as sessões são um saldo único usado em qualquer um deles. Na tela de clientes, a profissional atribui, ajusta, cancela ou remove pacotes.
- **Horários de atendimento:** janelas de atendimento por dia da semana e intervalo entre sessões.
- **Perfil:** dados da conta e troca de senha.

---

## Arquitetura do Sistema

O sistema foi modelado utilizando o **Modelo C4** para documentação detalhada da arquitetura de software:

### C4 - Nível 1: Diagrama de Contexto
Mapeia as interações dos dois atores principais (**Massoterapeuta/Esteticista** e **Cliente**) com a fronteira do sistema **Agenda+** e com os serviços externos: **Google** (login e Google Agenda) e **Brevo** (envio de e-mails).

### C4 - Nível 2: Diagrama de Containers
Descreve a estrutura unificada da aplicação em **Next.js**:
- **Aplicação Fullstack (Next.js):** frontend com **React** + **Tailwind CSS** (Server e Client Components) e API com **Route Handlers** em **Node.js** e **TypeScript**, hospedados na **Vercel**.
- **Autenticação:** sessão em cookie com **JWT** (biblioteca `jose`), senhas com **bcrypt** e login social via **OAuth do Google**. O arquivo `src/proxy.ts` protege as rotas `/admin` e `/cliente`.
- **Banco de Dados:** **PostgreSQL** (Supabase em produção, Docker no desenvolvimento), com o esquema versionado por migrations (**node-pg-migrate**).

### C4 - Nível 3: Diagrama de Componentes (Backend / APIs)
Detalha a estrutura interna das rotas e serviços da aplicação Next.js:
- **Route Handlers (`src/app/api`):** `auth` (login, cadastro, Google, recuperação de senha), `agendamentos`, `clientes`, `cliente` (perfil do cliente), `servicos`, `pacotes`, `horarios`, `perfil` e `admin/google-agenda`. Cada rota valida a entrada com **Zod** e confere a sessão e o papel do usuário.
- **Services (`src/services`):** regras de negócio e acesso ao banco com SQL direto pelo `pg` — `auth`, `agendamento`, `cliente`, `servico`, `pacote`, `pacote-cliente`, `horario`, `perfil`, `dashboard`, `google-agenda`, entre outros.

---

## Tecnologias Utilizadas

### Fullstack Framework & Linguagem
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

### Backend, Autenticação & Persistência
- Node.js (Route Handlers do Next.js)
- PostgreSQL + `pg`
- node-pg-migrate (migrations)
- Zod (validação)
- jose (JWT) e bcryptjs (hash de senhas)
- OAuth 2.0 do Google e Google Calendar API
- Brevo (e-mails transacionais)
- sharp e heic-convert (tratamento das fotos dos serviços)

### Infraestrutura
- Vercel (hospedagem e deploy contínuo)
- Supabase (PostgreSQL em produção)
- Docker Compose (PostgreSQL local)
- GitHub Actions (lint, typecheck e build a cada push)

### Prototipagem e Design
- Figma (Prototipagem de UI/UX de alta fidelidade)

---

## Estrutura do Projeto

```
agendaplus/
├── src/
│   ├── app/                   # App Router do Next.js
│   │   ├── (auth)/            # Login, cadastro e recuperação de senha
│   │   ├── admin/             # Painel da profissional (agenda, clientes, serviços, pacotes, configurações)
│   │   ├── cliente/           # Área do cliente (agendar, agendamentos, histórico, pacotes)
│   │   ├── privacidade/       # Política de Privacidade (pública)
│   │   ├── api/               # Route Handlers (backend)
│   │   └── layout.tsx
│   ├── components/            # Componentes de UI (admin, cliente, auth, ui)
│   ├── services/              # Regras de negócio e acesso ao PostgreSQL
│   ├── db/
│   │   ├── client.ts          # Pool de conexões do PostgreSQL
│   │   └── migrations/        # Migrations do banco (node-pg-migrate)
│   ├── lib/                   # Autenticação, validações (Zod), e-mail, toast
│   ├── hooks/                 # Hooks React reutilizáveis
│   ├── types/                 # Tipos TypeScript compartilhados
│   ├── utils/                 # Funções utilitárias (datas, calendário, pacotes...)
│   └── proxy.ts               # Proteção das rotas /admin e /cliente
├── scripts/                   # Seed, criação de admin, migrations no deploy
├── public/                    # Arquivos estáticos
├── docker-compose.yml         # PostgreSQL local
├── .env.example               # Modelo das variáveis de ambiente
└── package.json
```

---

## Como Executar o Projeto

### Pré-requisitos
- Node.js 20.9 ou superior
- npm
- Docker (para o PostgreSQL local) ou outra instância do PostgreSQL

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/matheusfefagundes/agendaplus.git
   cd agendaplus
   ```

2. **Instalar as dependências:**
   ```bash
   npm install
   ```

3. **Configurar as variáveis de ambiente:**
   Copie o modelo e preencha os valores:
   ```bash
   cp .env.example .env
   ```

   | Variável | Para que serve |
   |---|---|
   | `DATABASE_URL` | Conexão com o PostgreSQL. O valor do modelo já aponta para o banco do Docker. |
   | `JWT_SECRET` | Chave que assina as sessões. Use um texto longo e aleatório. |
   | `APP_URL` | Endereço do site, sem `/` no final (`http://localhost:3000` no desenvolvimento). |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Login com Google e integração com o Google Agenda. |
   | `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` | Envio de e-mails, como a recuperação de senha. |

   As chaves ficam disponíveis apenas no servidor e nunca devem usar o prefixo `NEXT_PUBLIC_`.

4. **Subir o banco de dados:**
   ```bash
   docker compose up -d
   ```
   O PostgreSQL fica disponível na porta `5433`.

5. **Criar as tabelas:**
   ```bash
   npm run db:migrate:up
   ```

6. **Criar dados de acesso:**
   Para dados de exemplo (admin `admin@agendaplus.local` e clientes, todos com a senha `Agenda123!`):
   ```bash
   npm run db:seed
   ```
   Ou crie apenas um administrador:
   ```bash
   npm run create-admin -- "Nome" email@exemplo.com "senha-forte"
   ```

7. **Executar o projeto:**
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000` no navegador.

### Configurar o Google (opcional)

Necessário apenas para o login com Google e para a integração com o Google Agenda.

1. Em [console.cloud.google.com](https://console.cloud.google.com), crie um **ID do cliente OAuth** do tipo "Aplicativo da Web".
2. Cadastre as URIs de redirecionamento autorizadas (troque `{APP_URL}` pelo endereço do site):
   - `{APP_URL}/api/auth/google/callback` — login com Google
   - `{APP_URL}/api/admin/google-agenda/callback` — conexão do Google Agenda
3. Em **APIs e serviços → Biblioteca**, ative a **Google Calendar API**.
4. Em **Google Auth Platform → Público-alvo**, publique o app ("Em produção"). No modo de teste, só usuários de teste entram e a conexão com a agenda expira em 7 dias.
5. Coloque o ID e a chave secreta em `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.

### Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificação de tipos do TypeScript |
| `npm run db:migrate:up` / `db:migrate:down` | Aplica / desfaz migrations |
| `npm run db:migrate:create -- nome` | Cria uma nova migration |
| `npm run db:seed` | Popula o banco com dados de exemplo |
| `npm run create-admin` | Cria um usuário administrador |
| `npm run email:test` | Envia um e-mail de teste pela Brevo |

---

## Deploy

O deploy é feito pela **Vercel** a cada push:
- `main` → produção ([agendaplus-opal.vercel.app](https://agendaplus-opal.vercel.app))
- demais branches → deploys de preview

No deploy de produção, as **migrations pendentes rodam automaticamente** logo após o build (`vercel-build` → `scripts/migrar-producao.mjs`). Se uma migration falhar, o deploy é interrompido e a versão anterior continua no ar. Deploys de preview não alteram o banco.

As variáveis de ambiente de produção são configuradas no painel da Vercel. O `DATABASE_URL` deve usar a conexão do Supabase na porta `5432`.

---

## Recurso de Design e Prototipagem

O design de interface e protótipo de navegação de alta fidelidade estão disponíveis no Figma:
- [Acessar Protótipo Interativo no Figma](https://www.figma.com/design/EK5wT3lPu7DwPGYtOpx0hS/Agenda----Prot%C3%B3tipo-Incial?node-id=0-1&p=f&t=7XypOQdyR7LVim0r-0)

---

## Equipe de Desenvolvimento

Projeto desenvolvido para a disciplina de **PAC Extensionista** do curso de **Engenharia de Software** do **Centro Universitário Católica de Santa Catarina (Católica SC - Joinville)**:

- **Kauã Martins Bassan**
- **Lucas Klug Sebastião**
- **Matheus Ferreira Fagundes**
- **Miguel Hort**
- **Roger Klock**
