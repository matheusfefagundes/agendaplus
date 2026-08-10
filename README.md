# Agenda+ - Sistema de Agendamento Online para Clínica de Massoterapia e Estética

## Visão Geral do Projeto

O **Agenda+** é um sistema web desenvolvido como Projeto de Ação Comunitária (PAC Extensionista) do curso de Engenharia de Software do **Centro Universitário Católica de Santa Catarina (Católica SC - Joinville)**.

A solução foi projetada sob medida para atender às necessidades do **Espaço Patrícia Fagundes**, gerido por Patrícia Ferreira Fagundes (MEI). O objetivo principal é automatizar o processo de agendamento de consultas de massoterapia e estética, eliminando gargalos operacionais decorrentes do controle manual via mensagens instantâneas e cadernos físicos.

O sistema proporciona autonomia de agendamento aos clientes 24 horas por dia, 7 dias por semana, além de oferecer à profissional um painel administrativo completo para gestão de horários, portfólio de serviços e prontuário de clientes.

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
- **Autocadastro e Autenticação:** Criação de conta e login seguro para gerenciamento de reservas.
- **Reserva Interativa 24/7:** Escolha do serviço/tratamento (ex.: Massagem Relaxante, Massagem Terapêutica), seleção de data via calendário interativo e escolha de horários disponíveis divididos por turnos (Manhã, Tarde, Noite).
- **Resumo e Confirmação:** Visualização de duração, valor, profissional responsável e política de cancelamento antes da confirmação final.
- **Histórico de Agendamentos:** Acompanhamento de sessões passadas e agendamentos futuros.

### Visão do Administrador (Profissional)
- **Painel Administrativo (Dashboard):** Visualização diária, semanal e mensal de compromissos com cartões de status (Confirmado, Cancelado).
- **Gestão de Clientes:** Cadastro, edição, remoção e busca filtrada por nome ou telefone; acompanhamento do prontuário do cliente, incluindo preferências (ex.: intensidade da pressão) e restrições de saúde (ex.: alergias a óleos).
- **Gestão de Serviços:** Cadastro e edição de tratamentos, definição de preços e durações, além de opção de ativar ou desativar serviços.
- **Controle de Disponibilidade:** Bloqueio automático de horários ocupados, configuração de intervalos operacionais entre sessões e parâmetros de antecedência mínima.

---

## Arquitetura do Sistema

O sistema foi modelado utilizando o **Modelo C4** para documentação detalhada da arquitetura de software:

### C4 - Nível 1: Diagrama de Contexto
Mapeia as interações dos dois atores principais (**Massoterapeuta/Esteticista** e **Cliente**) com a fronteira do sistema **Agenda+**, além do planejamento para integrações com serviços externos de notificação (lembretes) e gateways de pagamento futuros.

### C4 - Nível 2: Diagrama de Containers
Descreve a estrutura unificada da aplicação em **Next.js**:
- **Aplicação Fullstack (Next.js):** Frontend renderizado no servidor/cliente (**React** + **Tailwind CSS**) integrado com APIs nativas (**Route Handlers / Server Actions**) em **Node.js** e **TypeScript**.
- **Módulo de Autenticação:** Implementação com **JWT (JSON Web Token)** e criptografia **bcrypt**.
- **Banco de Dados:** Relacional **PostgreSQL** para persistência dos dados de clientes, serviços e agendamentos.

### C4 - Nível 3: Diagrama de Componentes (Backend / APIs)
Detalha a estrutura interna das rotas e serviços da aplicação Next.js:
- **API Routes / Route Handlers:** Endpoints em `/api/auth`, `/api/clientes`, `/api/servicos`, `/api/agenda` e `/api/agendamentos`.
- **Services Layer:** Camada unificada para execução das regras de negócio (`AuthService`, `ClienteService`, `ServicoService`, `AgendaService` e `AgendamentoService`).
- **Repository Pattern / Data Access:** Abstração de acesso e persistência ao banco de dados executando consultas no **PostgreSQL**.

---

## Tecnologias Utilizadas

### Fullstack Framework & Linguagem
- Next.js (React Framework)
- React.js
- TypeScript
- Tailwind CSS

### Backend, Autenticação & Persistência
- Node.js (executado via Next.js API Routes)
- JSON Web Token (JWT)
- bcrypt (hash criptográfico de senhas)
- PostgreSQL (Banco de dados relacional)

### Prototipagem e Design
- Figma (Prototipagem de UI/UX de alta fidelidade)

---

## Estrutura do Projeto

```
agenda-plus/
├── src/
│   ├── app/                   # App Router do Next.js
│   │   ├── api/               # Endpoints da API REST (Backend Route Handlers)
│   │   │   ├── auth/
│   │   │   ├── clientes/
│   │   │   ├── servicos/
│   │   │   ├── agenda/
│   │   │   └── agendamentos/
│   │   ├── (auth)/            # Telas de Login e Cadastro
│   │   ├── dashboard/         # Painel da Profissional
│   │   ├── agendar/           # Tela de Agendamento do Cliente
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # Componentes reutilizáveis de UI
│   ├── services/              # Camada de Regras de Negócio
│   ├── repositories/          # Abstração de acesso ao PostgreSQL
│   ├── lib/                   # Configurações globais (DB, Auth, JWT)
│   └── styles/                # Estilos globais e Tailwind CSS
├── public/                    # Arquivos estáticos
├── .env.local                 # Variáveis de ambiente
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## Como Executar o Projeto

### Pré-requisitos
- Node.js (versão 18.x ou superior)
- npm, yarn ou pnpm
- Instância do PostgreSQL configurada e em execução

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/usuario/agenda-plus.git
   cd agenda-plus
   ```

2. **Instalar as dependências:**
   ```bash
   npm install
   ```

3. **Configurar as Variáveis de Ambiente:**
   Crie um arquivo `.env.local` na raiz do projeto contendo as credenciais de acesso:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://usuario:senha@localhost:5432/agendaplus
   JWT_SECRET=sua_chave_secreta_jwt
   ```

4. **Executar o Projeto:**
   Inicie o servidor de desenvolvimento do Next.js (que executará tanto o Frontend quanto as API Routes unificadas):
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000` no seu navegador.

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
