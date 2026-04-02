# Prospect Clinic — Product Requirements Document (PRD)

## Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-04-01 | 1.0 | Versão inicial do PRD | Morgan |

---

## 1. Goals and Background Context

### Goals

- Automatizar a prospecção de leads qualificados (donos/gestores de clínicas odontológicas e estéticas) no Instagram e LinkedIn
- Reduzir o tempo gasto em prospecção manual, permitindo foco em fechamento de vendas
- Gerar mensagens de abordagem personalizadas via IA que aumentem a taxa de resposta
- Centralizar e organizar leads capturados em um dashboard web intuitivo
- Acelerar o ciclo de vendas de soluções de IA com ticket médio de R$580/mês
- Garantir volume consistente de prospecção para escalar receita recorrente

### Background Context

O mercado de clínicas odontológicas e estéticas no Brasil é vasto e fragmentado, com milhares de estabelecimentos que ainda operam sem soluções tecnológicas avançadas. A empresa oferece soluções de IA para esse nicho, com ticket médio de R$580/mês, porém enfrenta um gargalo crítico: encontrar e abordar prospects qualificados de forma eficiente e escalável.

O processo atual de prospecção é manual, consumindo tempo valioso e gerando baixo volume de contatos. O Prospect Clinic resolve isso combinando scraping automatizado via Apify (Instagram/LinkedIn), armazenamento local de leads em JSON e geração de mensagens personalizadas via Gemini API — tudo visualizável em um dashboard web — transformando prospecção em um processo sistemático e escalável.

---

## 2. Requirements

### Functional Requirements

- **FR1:** O sistema deve buscar prospects automaticamente no Instagram e LinkedIn utilizando a API do Apify, com filtros configuráveis por nicho (odontológico/estético)
- **FR2:** O sistema deve extrair e armazenar dados dos prospects em arquivos JSON locais, incluindo: nome, perfil/URL, plataforma de origem, bio/descrição, número de seguidores e data de captura
- **FR3:** O sistema deve integrar com a Gemini API para gerar mensagens de abordagem personalizadas por prospect, com base nos dados do perfil capturado
- **FR4:** O sistema deve exibir um dashboard web com listagem de todos os leads capturados, com filtros por plataforma, status e data
- **FR5:** O dashboard deve permitir visualizar a mensagem personalizada gerada para cada lead
- **FR6:** O sistema deve permitir marcar o status de cada lead (ex: Novo, Contatado, Respondeu, Fechado, Descartado)
- **FR7:** O sistema deve permitir exportar a lista de leads e mensagens para CSV
- **FR8:** O sistema deve permitir re-gerar a mensagem de um lead individualmente via dashboard

### Non-Functional Requirements

- **NFR1:** O sistema deve rodar localmente (sem necessidade de servidor cloud), utilizando Node.js
- **NFR2:** O tempo de geração de mensagem via Gemini API não deve ultrapassar 10 segundos por prospect
- **NFR3:** O dashboard web deve ser responsivo e funcionar nos principais browsers modernos (Chrome, Firefox, Edge)
- **NFR4:** O armazenamento em JSON local deve suportar até 10.000 leads sem degradação de performance
- **NFR5:** As credenciais de API (Apify, Gemini) devem ser armazenadas em variáveis de ambiente (.env), nunca em código
- **NFR6:** O sistema deve logar erros de scraping e geração de mensagem para facilitar diagnóstico

---

## 3. User Interface Design Goals

### Overall UX Vision

Interface operacional e objetiva — o usuário chega, vê os leads, vê as mensagens, age. Sem distrações. Visual limpo inspirado em ferramentas de CRM leve (estilo Notion/Linear), com foco em produtividade.

### Key Interaction Paradigms

- Lista de leads como visão principal (tabela com filtros rápidos)
- Clique no lead → abre painel lateral com detalhes e mensagem gerada
- Ações por linha: marcar status, copiar mensagem, re-gerar mensagem
- Botão de "Buscar novos prospects" aciona o scraping via Apify

### Core Screens and Views

1. **Dashboard / Lista de Leads** — tabela com todos os leads, filtros e status
2. **Detalhe do Lead** — perfil completo + mensagem personalizada gerada
3. **Configurações** — parâmetros de busca (nicho, plataforma, quantidade) e chaves de API
4. **Log de Atividades** — histórico de buscas realizadas e erros

### Accessibility

Nenhum requisito especial de acessibilidade no MVP.

### Branding

Interface neutra, profissional. Sem branding forte no MVP — foco em funcionalidade.

### Target Device and Platforms

**Web Responsivo** — rodando localmente via `localhost`, acesso por desktop/notebook. Mobile não é prioridade no MVP.

---

## 4. Technical Assumptions

### Repository Structure

**Monorepo** — projeto único com frontend (dashboard) e backend (scraping/IA) na mesma pasta.

### Service Architecture

**Monolith local** — aplicação Node.js única com:
- **Backend:** Next.js API Routes (endpoints para scraping, geração de mensagem, CRUD de leads)
- **Frontend:** Next.js + React + Tailwind CSS (dashboard)
- **Storage:** JSON local (arquivo `data/leads.json` no filesystem)
- **Sem banco de dados** no MVP — JSON é suficiente para até 10k leads

### Testing Requirements

**Unit básico apenas no MVP** — foco em testes das funções críticas:
- Integração com Apify (mock)
- Integração com Gemini API (mock)
- Leitura/escrita do JSON local

### Additional Technical Assumptions

- **Runtime:** Node.js v22 (instalado)
- **Framework:** Next.js 15+ com App Router + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui para componentes do dashboard
- **Apify:** SDK oficial `apify-client` (npm)
- **Gemini:** SDK `@google/generative-ai` (npm)
- **Storage:** `fs` nativo do Node.js para leitura/escrita do JSON local
- **Variáveis de ambiente:** `.env.local` (padrão Next.js) para `APIFY_TOKEN` e `GEMINI_API_KEY`
- **Deploy:** Apenas local (`localhost:3000`) — sem deploy cloud no MVP

---

## 5. Epic List

- **Epic 1 — Foundation & Lead Capture:** Configurar o projeto Next.js com toda a infraestrutura base e integrar com Apify para capturar e armazenar prospects do Instagram/LinkedIn em JSON local
- **Epic 2 — AI Message Generation:** Integrar a Gemini API para gerar mensagens de abordagem personalizadas para cada lead capturado, com armazenamento da mensagem no JSON do lead
- **Epic 3 — Dashboard & Operations:** Construir o dashboard web completo para visualizar leads, mensagens, gerenciar status, re-gerar mensagens e exportar dados para CSV

---

## 6. Epic 1 — Foundation & Lead Capture

**Objetivo:** Configurar o projeto Next.js com infraestrutura base e entregar o fluxo completo de captura de prospects via Apify, com armazenamento em JSON local — sistema funcional testável via API antes mesmo do dashboard existir.

### Story 1.1 — Project Setup & Environment

> Como desenvolvedor, quero um projeto Next.js configurado com TypeScript, Tailwind e variáveis de ambiente, para ter a base técnica pronta para desenvolvimento.

**Acceptance Criteria:**
1. Projeto Next.js 15+ criado com TypeScript, Tailwind CSS e shadcn/ui instalados e funcionando
2. Arquivo `.env.local` criado com as variáveis `APIFY_TOKEN` e `GEMINI_API_KEY` (valores placeholder)
3. Arquivo `.env.example` versionado no git com os nomes das variáveis (sem valores)
4. Rota de health check `GET /api/health` retorna `{ status: "ok", timestamp: "..." }`
5. `npm run dev` inicia o servidor sem erros em `localhost:3000`

### Story 1.2 — Apify Lead Scraping

> Como usuário, quero acionar uma busca de prospects no Instagram ou LinkedIn via API, para capturar leads do meu nicho automaticamente.

**Acceptance Criteria:**
1. Endpoint `POST /api/scrape` aceita body `{ platform: "instagram"|"linkedin", keyword: string, limit: number }`
2. A rota integra com `apify-client` usando `APIFY_TOKEN` do `.env.local`
3. O scraping retorna ao menos os campos: `name`, `profileUrl`, `platform`, `bio`, `followersCount`
4. Erros da Apify API são capturados e retornam resposta `{ error: string }` com status 500
5. A rota funciona via `curl` ou Postman antes do dashboard existir

### Story 1.3 — JSON Lead Storage

> Como usuário, quero que os leads capturados sejam salvos localmente em JSON, para que eu possa acessá-los posteriormente sem perder dados.

**Acceptance Criteria:**
1. Leads são salvos no arquivo `data/leads.json` após cada scraping bem-sucedido
2. Cada lead recebe os campos adicionais: `id` (uuid), `createdAt` (ISO date), `status: "novo"`, `message: null`
3. Leads duplicados (mesmo `profileUrl`) são ignorados — não geram duplicatas no JSON
4. Endpoint `GET /api/leads` retorna todos os leads armazenados
5. Se `data/leads.json` não existir, é criado automaticamente na primeira execução

---

## 7. Epic 2 — AI Message Generation

**Objetivo:** Integrar Gemini API para gerar mensagens de abordagem personalizadas para cada lead, tornando a prospecção humanizada e escalável.

### Story 2.1 — Gemini API Integration

> Como usuário, quero que o sistema gere automaticamente uma mensagem personalizada para cada lead, para economizar tempo na elaboração de abordagens.

**Acceptance Criteria:**
1. Endpoint `POST /api/leads/:id/generate-message` integra com `@google/generative-ai` usando `GEMINI_API_KEY`
2. O prompt enviado ao Gemini inclui: nome, bio, plataforma e seguidores do lead
3. A mensagem gerada é salva no campo `message` do lead no JSON
4. Mensagem gerada em até 10 segundos — timeout configurável
5. Erros da Gemini API retornam `{ error: string }` com status 500

### Story 2.2 — Batch Message Generation

> Como usuário, quero gerar mensagens para múltiplos leads de uma vez, para processar lotes de prospects sem ação manual repetitiva.

**Acceptance Criteria:**
1. Endpoint `POST /api/leads/generate-messages` aceita body `{ ids: string[] }` ou `{ all: true }` para todos os leads sem mensagem
2. Geração é feita sequencialmente (não paralela) para evitar rate limit do Gemini
3. Retorna relatório `{ processed: number, errors: number, details: [...] }`
4. Leads já com mensagem são ignorados a menos que `force: true` seja enviado

---

## 8. Epic 3 — Dashboard & Operations

**Objetivo:** Interface web completa para visualizar, gerenciar e operar sobre os leads capturados e suas mensagens personalizadas.

### Story 3.1 — Leads Dashboard

> Como usuário, quero ver todos os meus leads em uma tabela com filtros, para ter visão geral da minha base de prospects.

**Acceptance Criteria:**
1. Página principal (`/`) exibe tabela com todos os leads: nome, plataforma, status, data de captura
2. Filtros funcionais por: plataforma (Instagram/LinkedIn), status (Novo/Contatado/etc)
3. Contadores no topo: total de leads, leads com mensagem, leads por status
4. Tabela ordenada por `createdAt` decrescente por padrão
5. Interface construída com shadcn/ui (componentes Table, Badge, Select)

### Story 3.2 — Lead Detail & Message View

> Como usuário, quero clicar em um lead e ver seus detalhes completos junto com a mensagem gerada, para copiar e usar na abordagem.

**Acceptance Criteria:**
1. Clique na linha abre painel lateral (Sheet do shadcn/ui) com dados completos do lead
2. Mensagem personalizada exibida em campo de texto copiável com botão "Copiar"
3. Botão "Re-gerar mensagem" chama `POST /api/leads/:id/generate-message` e atualiza o painel
4. Se o lead não tem mensagem, exibe botão "Gerar mensagem agora"
5. Link direto para o perfil do lead (Instagram/LinkedIn) abre em nova aba

### Story 3.3 — Lead Status Management & Export

> Como usuário, quero atualizar o status de cada lead e exportar minha lista, para acompanhar o pipeline de prospecção.

**Acceptance Criteria:**
1. Dropdown de status (Novo, Contatado, Respondeu, Fechado, Descartado) atualiza via `PATCH /api/leads/:id`
2. Mudança de status persiste no JSON local imediatamente
3. Botão "Exportar CSV" baixa arquivo com todos os leads visíveis (respeitando filtros ativos)
4. CSV inclui colunas: nome, plataforma, profileUrl, status, mensagem, data de captura

### Story 3.4 — Scraping Trigger & Settings

> Como usuário, quero acionar novas buscas e configurar parâmetros de scraping diretamente pelo dashboard, para operar tudo sem usar terminal.

**Acceptance Criteria:**
1. Modal "Nova Busca" com campos: plataforma, keyword/nicho, quantidade (10-100)
2. Botão "Buscar Prospects" chama `POST /api/scrape` e exibe loader durante execução
3. Ao finalizar, tabela atualiza automaticamente com novos leads
4. Página `/settings` exibe campos para inserir/atualizar `APIFY_TOKEN` e `GEMINI_API_KEY` (valores mascarados)
5. Configurações salvas em `.env.local` via endpoint `POST /api/settings`

---

## 9. Checklist Results Report

| Item | Status | Observação |
|------|--------|------------|
| Goals claros e mensuráveis | ✅ | Alinhados ao negócio (ticket médio R$580/mês) |
| Problema claramente definido | ✅ | Prospecção manual ineficiente |
| Usuário-alvo identificado | ✅ | Donos/gestores de clínicas odontológicas e estéticas |
| Requisitos funcionais completos | ✅ | FR1-FR8 cobrem todos os fluxos |
| Requisitos não-funcionais definidos | ✅ | NFR1-NFR6 com foco em MVP local |
| Epics sequenciais e independentes | ✅ | 3 epics com entrega incremental de valor |
| Stories com critérios testáveis | ✅ | Acceptance Criteria mensuráveis em todas as stories |
| Assumptions técnicas documentadas | ✅ | Stack Next.js + Apify + Gemini + JSON |
| Segurança básica coberta | ✅ | Credenciais em .env, nunca em código (NFR5) |
| MVP bem delimitado | ✅ | Escopo local sem cloud, sem auth, sem DB |

---

## 10. Next Steps

### UX Expert Prompt

> Use este PRD como input para criar o design do Prospect Clinic. Foque no dashboard principal (lista de leads com filtros) e no painel lateral de detalhes do lead. Stack: Next.js + Tailwind + shadcn/ui. Visual limpo, operacional, inspirado em CRM leve.

### Architect Prompt

> Use este PRD para criar a arquitetura técnica do Prospect Clinic. Stack definida: Next.js 15+ App Router, TypeScript, Tailwind, shadcn/ui, apify-client, @google/generative-ai, storage em JSON local. Monolith local, sem banco de dados no MVP. Foque na estrutura de pastas, contratos de API e modelo de dados do leads.json.
