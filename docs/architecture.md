# Prospect Clinic — Fullstack Architecture Document

## Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 2026-04-01 | 1.0 | Arquitetura inicial — MVP local | Aria |

---

## 1. Introduction

Este documento define a arquitetura completa do **Prospect Clinic**, sistema de prospecção automatizada com IA para donos e gestores de clínicas odontológicas e estéticas. Cobre backend, frontend e integrações externas, servindo como fonte única de verdade para o desenvolvimento.

O sistema opera como um monolith local rodando em `localhost:3000`, sem necessidade de infraestrutura cloud no MVP. A unificação de frontend e backend em um único projeto Next.js simplifica o desenvolvimento e elimina complexidade operacional desnecessária para esse estágio.

### Starter Template

**N/A — Greenfield project.** Projeto criado do zero com `create-next-app`. Nenhuma constraint de template existente.

---

## 2. High-Level Architecture

### Technical Summary

O Prospect Clinic é uma aplicação Next.js 15 com App Router rodando localmente, onde as API Routes servem como backend e o React serve como frontend — tudo em um único processo Node.js. O armazenamento é feito em `data/leads.json` via `fs` nativo, eliminando dependência de banco de dados. As integrações externas são Apify (scraping de Instagram/LinkedIn) e Gemini API (geração de mensagens personalizadas), ambas chamadas exclusivamente pelo lado do servidor (API Routes) para proteger as credenciais. O sistema não possui autenticação no MVP, pois opera em ambiente local privado.

### Platform & Infrastructure

**Plataforma:** Local (Node.js 22 + Next.js 15)
**Serviços principais:** `apify-client`, `@google/generative-ai`, `fs` nativo
**Deploy:** `localhost:3000` — sem cloud no MVP

> Sem necessidade de Vercel, AWS ou qualquer plataforma externa. Todo o sistema roda na máquina local do usuário.

### Repository Structure

**Estrutura:** Monorepo single-app (sem Turborepo/Nx — desnecessário para projeto desta escala)
**Organização:** Tudo dentro de um único Next.js app

### High-Level Architecture Diagram

```mermaid
graph TB
    User["👤 Usuário\n(Browser localhost:3000)"]

    subgraph NextJS["Next.js App (localhost:3000)"]
        UI["Frontend\nReact + Tailwind + shadcn/ui"]
        API["API Routes\n(Next.js Route Handlers)"]
    end

    subgraph Storage["Storage Local"]
        JSON["data/leads.json\n(Filesystem)"]
    end

    subgraph ExternalAPIs["APIs Externas"]
        Apify["Apify API\nInstagram / LinkedIn Scraper"]
        Gemini["Google Gemini API\nMessage Generation"]
    end

    User -->|HTTP| UI
    UI -->|fetch /api/*| API
    API -->|fs read/write| JSON
    API -->|apify-client| Apify
    API -->|@google/generative-ai| Gemini
```

### Architectural Patterns

- **Monolith Local:** Frontend e backend no mesmo processo Next.js — _Rationale:_ MVP local não justifica separação; reduz complexidade operacional a zero
- **Server-Side API Calls:** Todas as chamadas para Apify e Gemini ocorrem em API Routes (server-side) — _Rationale:_ Protege credenciais; nunca expõe tokens para o browser
- **Repository Pattern (simplificado):** Toda leitura/escrita do JSON passa por `lib/leads-repository.ts` — _Rationale:_ Isola a camada de dados; facilita migração para SQLite/banco no futuro
- **Component-Based UI:** Componentes React reutilizáveis com shadcn/ui — _Rationale:_ Consistência visual e produtividade de desenvolvimento
- **API REST simples:** Endpoints REST diretos sem GraphQL/tRPC — _Rationale:_ Simplicidade adequada para o escopo do MVP

---

## 3. Tech Stack

| Categoria | Tecnologia | Versão | Propósito | Rationale |
|-----------|-----------|--------|-----------|-----------|
| Frontend Language | TypeScript | 5.x | Type safety em todo o projeto | Previne bugs em runtime; autocomplete no dev |
| Frontend Framework | Next.js (App Router) | 15.x | SSR, API Routes, routing | Unifica frontend/backend; preset ativo do projeto |
| UI Component Library | shadcn/ui | latest | Componentes prontos (Table, Sheet, Badge, etc.) | Acelera construção do dashboard; altamente customizável |
| CSS Framework | Tailwind CSS | 3.x | Estilização utility-first | Integrado com shadcn/ui; produtividade alta |
| State Management | React useState/useEffect | — | Estado local de componentes | Escopo do MVP não justifica Zustand/Redux |
| Backend Language | TypeScript (Node.js) | 22.x | Lógica server-side nas API Routes | Mesma linguagem frontend/backend; Node.js já instalado |
| Backend Framework | Next.js Route Handlers | 15.x | Endpoints REST para scraping e leads | Elimina necessidade de Express separado |
| API Style | REST | — | CRUD de leads + triggers de ação | Simples, direto, suficiente para o escopo |
| Storage | JSON local (fs) | Node built-in | Persistência de leads em arquivo | Zero infra; suficiente para 10k leads; sem dependências |
| Scraping | apify-client | latest | Busca de prospects no Instagram/LinkedIn | SDK oficial da Apify; suporte a múltiplos scrapers |
| AI / Mensagens | @google/generative-ai | latest | Geração de mensagens personalizadas via Gemini | API gratuita com tier generoso; resultado de alta qualidade |
| UUID | uuid | 9.x | Geração de IDs únicos para leads | Padrão; sem dependências extras |
| Variáveis de Ambiente | dotenv (.env.local) | Next.js built-in | Armazenamento de tokens API | Padrão Next.js; seguro para uso local |
| Frontend Testing | Vitest | latest | Testes unitários de funções puras | Compatível com Vite/Next.js; mais rápido que Jest |
| Backend Testing | Vitest | latest | Testes de API Routes e repository | Mesma ferramenta para toda a stack |
| E2E Testing | N/A (MVP) | — | Não incluído no MVP | Complexidade não justificada no escopo atual |
| Linting | ESLint + Prettier | latest | Qualidade e consistência de código | Padrão do ecossistema Next.js |
| Build Tool | Next.js CLI | built-in | Build e dev server | Integrado ao framework |

---

## 4. Data Models

### Lead

**Propósito:** Representa um prospect capturado do Instagram ou LinkedIn, com seus dados de perfil, status no pipeline de prospecção e a mensagem personalizada gerada pela IA.

**Atributos principais:**
- `id`: string (UUID v4) — identificador único imutável
- `name`: string — nome do perfil/pessoa
- `profileUrl`: string — URL única do perfil (usada para deduplicação)
- `platform`: `"instagram" | "linkedin"` — origem do lead
- `bio`: string — descrição/bio do perfil
- `followersCount`: number — número de seguidores
- `status`: `LeadStatus` — estágio no pipeline
- `message`: string | null — mensagem gerada pelo Gemini (null se ainda não gerada)
- `createdAt`: string (ISO 8601) — data de captura

```typescript
// src/types/lead.ts

export type LeadStatus =
  | "novo"
  | "contatado"
  | "respondeu"
  | "fechado"
  | "descartado";

export type Platform = "instagram" | "linkedin";

export interface Lead {
  id: string;           // UUID v4
  name: string;
  profileUrl: string;   // Usado para deduplicação
  platform: Platform;
  bio: string;
  followersCount: number;
  status: LeadStatus;
  message: string | null;
  createdAt: string;    // ISO 8601
}

export interface LeadsStore {
  leads: Lead[];
  updatedAt: string;    // ISO 8601 — última modificação do arquivo
}
```

**Relacionamentos:** Não há outros modelos no MVP. `LeadsStore` é o container raiz do JSON.

---

### ScrapeRequest

```typescript
// src/types/scrape.ts

export interface ScrapeRequest {
  platform: Platform;
  keyword: string;    // Ex: "clínica odontológica", "clínica estética"
  limit: number;      // Entre 10 e 100
}

export interface ScrapeResult {
  imported: number;
  skipped: number;    // Duplicatas ignoradas
  errors: number;
  leads: Lead[];
}
```

---

### GenerateMessageRequest / BatchResult

```typescript
// src/types/messages.ts

export interface BatchGenerateRequest {
  ids?: string[];     // IDs específicos
  all?: boolean;      // true = todos sem mensagem
  force?: boolean;    // true = re-gera mesmo se já tem mensagem
}

export interface BatchGenerateResult {
  processed: number;
  errors: number;
  details: Array<{
    leadId: string;
    success: boolean;
    error?: string;
  }>;
}
```

---

## 5. API Specification

```yaml
openapi: 3.0.0
info:
  title: Prospect Clinic API
  version: 1.0.0
  description: API interna do sistema de prospecção automatizada
servers:
  - url: http://localhost:3000/api
    description: Servidor local de desenvolvimento

paths:
  /health:
    get:
      summary: Health check
      responses:
        '200':
          description: Sistema operacional
          content:
            application/json:
              example: { "status": "ok", "timestamp": "2026-04-01T12:00:00Z" }

  /leads:
    get:
      summary: Listar todos os leads
      parameters:
        - name: platform
          in: query
          schema: { type: string, enum: [instagram, linkedin] }
        - name: status
          in: query
          schema: { type: string }
      responses:
        '200':
          description: Lista de leads
          content:
            application/json:
              schema:
                type: array
                items: { $ref: '#/components/schemas/Lead' }

  /leads/{id}:
    patch:
      summary: Atualizar status de um lead
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                status: { type: string }
      responses:
        '200':
          description: Lead atualizado
        '404':
          description: Lead não encontrado

  /leads/{id}/generate-message:
    post:
      summary: Gerar mensagem personalizada para um lead
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Mensagem gerada e salva
          content:
            application/json:
              example: { "message": "Olá Dr. João, vi seu perfil..." }
        '404':
          description: Lead não encontrado
        '500':
          description: Erro na API Gemini

  /leads/generate-messages:
    post:
      summary: Geração em lote de mensagens
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                ids: { type: array, items: { type: string } }
                all: { type: boolean }
                force: { type: boolean }
      responses:
        '200':
          description: Relatório de geração
          content:
            application/json:
              example: { "processed": 10, "errors": 1, "details": [] }

  /leads/export:
    get:
      summary: Exportar leads para CSV
      parameters:
        - name: platform
          in: query
          schema: { type: string }
        - name: status
          in: query
          schema: { type: string }
      responses:
        '200':
          description: Arquivo CSV para download
          content:
            text/csv: {}

  /scrape:
    post:
      summary: Acionar scraping de prospects via Apify
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [platform, keyword, limit]
              properties:
                platform: { type: string, enum: [instagram, linkedin] }
                keyword: { type: string }
                limit: { type: integer, minimum: 10, maximum: 100 }
      responses:
        '200':
          description: Resultado do scraping
          content:
            application/json:
              example: { "imported": 15, "skipped": 3, "errors": 0 }
        '500':
          description: Erro na API Apify

  /settings:
    post:
      summary: Atualizar chaves de API
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                APIFY_TOKEN: { type: string }
                GEMINI_API_KEY: { type: string }
      responses:
        '200':
          description: Configurações salvas no .env.local
```

---

## 6. Components

### LeadsRepository (`src/lib/leads-repository.ts`)

**Responsabilidade:** Camada de acesso exclusiva ao `data/leads.json`. Todos os outros módulos leem/escrevem leads através desta camada.

**Interfaces:**
- `getAll(filters?)` → `Lead[]`
- `getById(id)` → `Lead | null`
- `save(leads)` → `void`
- `upsert(lead)` → `{ inserted: boolean }` (deduplicação por `profileUrl`)
- `update(id, partial)` → `Lead | null`

**Dependências:** `fs/promises`, `uuid`, `src/types/lead.ts`

**Detalhes:** Usa file locking leve (flag de escrita em memória) para evitar race conditions em operações batch sequenciais.

---

### ApifyService (`src/lib/apify-service.ts`)

**Responsabilidade:** Integração com Apify API para scraping de Instagram e LinkedIn.

**Interfaces:**
- `scrapeProspects(request: ScrapeRequest)` → `Partial<Lead>[]`

**Dependências:** `apify-client`, `APIFY_TOKEN` (env), `src/types/scrape.ts`

**Detalhes:** Seleciona o Actor correto por plataforma. Instagram: `apify/instagram-profile-scraper`. LinkedIn: `2SyF0bVxmgGr8IVCZ` (LinkedIn Profile Scraper). Normaliza campos retornados para o modelo `Lead`.

---

### GeminiService (`src/lib/gemini-service.ts`)

**Responsabilidade:** Geração de mensagens personalizadas via Google Gemini API.

**Interfaces:**
- `generateMessage(lead: Lead)` → `string`

**Dependências:** `@google/generative-ai`, `GEMINI_API_KEY` (env)

**Detalhes:** Usa modelo `gemini-1.5-flash` (gratuito, rápido). Prompt inclui: nome, bio, plataforma, seguidores. Timeout de 10s configurável via variável de ambiente `GEMINI_TIMEOUT_MS`.

---

### API Routes (`src/app/api/`)

**Responsabilidade:** Endpoints REST que orquestram LeadsRepository, ApifyService e GeminiService.

**Interfaces:** Conforme especificação OpenAPI acima.

**Dependências:** LeadsRepository, ApifyService, GeminiService

---

### Dashboard UI (`src/app/page.tsx` + components)

**Responsabilidade:** Interface React para visualização e operação sobre os leads.

**Interfaces:** Consome todas as API Routes via `fetch`.

**Dependências:** shadcn/ui, Tailwind CSS, React hooks

---

### Component Diagram

```mermaid
graph LR
    subgraph Frontend["Frontend (React)"]
        Page["page.tsx\nDashboard Principal"]
        LeadsTable["LeadsTable\nComponente"]
        LeadSheet["LeadSheet\nPainel Lateral"]
        ScrapeModal["ScrapeModal\nModal Nova Busca"]
        Settings["settings/page.tsx"]
    end

    subgraph APIRoutes["API Routes (Next.js)"]
        RLeads["/api/leads"]
        RScrape["/api/scrape"]
        RMessages["/api/leads/[id]/generate-message"]
        RExport["/api/leads/export"]
        RSettings["/api/settings"]
    end

    subgraph Services["Services Layer"]
        Repo["LeadsRepository\nleads.json"]
        Apify["ApifyService\napify-client"]
        Gemini["GeminiService\n@google/generative-ai"]
    end

    Page --> LeadsTable
    Page --> ScrapeModal
    LeadsTable --> LeadSheet

    Page -->|fetch| RLeads
    ScrapeModal -->|fetch| RScrape
    LeadSheet -->|fetch| RMessages
    Page -->|fetch| RExport
    Settings -->|fetch| RSettings

    RLeads --> Repo
    RScrape --> Apify
    RScrape --> Repo
    RMessages --> Gemini
    RMessages --> Repo
    RExport --> Repo
    RSettings --> Repo
```

---

## 7. External APIs

### Apify API

- **Propósito:** Scraping automatizado de perfis no Instagram e LinkedIn
- **Autenticação:** Bearer Token (`APIFY_TOKEN` no `.env.local`)
- **Rate Limits:** Depende do plano; tier gratuito: ~1000 resultados/mês
- **SDK:** `apify-client` (npm)

**Actors utilizados:**
- `apify/instagram-profile-scraper` — scraping do Instagram
- `apify/linkedin-profile-scraper` — scraping do LinkedIn

**Considerações de integração:**
- Chamadas são síncronas (aguarda conclusão do Actor)
- Timeout padrão de 5 minutos para o run do Actor
- Custo por resultado: verificar plano do usuário no Apify Console

---

### Google Gemini API

- **Propósito:** Geração de mensagens de abordagem personalizadas por prospect
- **Autenticação:** API Key (`GEMINI_API_KEY` no `.env.local`)
- **Rate Limits:** Tier gratuito: 15 RPM (requests per minute), 1M tokens/dia
- **SDK:** `@google/generative-ai` (npm)

**Modelo utilizado:** `gemini-1.5-flash`

**Template de prompt:**
```
Você é um especialista em prospecção B2B para clínicas de saúde e estética no Brasil.

Escreva uma mensagem de primeiro contato para o seguinte prospect no {platform}:
- Nome: {name}
- Bio: {bio}
- Seguidores: {followersCount}

A mensagem deve:
- Ter no máximo 150 palavras
- Ser pessoal e mencionar algo específico do perfil
- Apresentar brevemente soluções de IA para clínicas
- Ter um call-to-action para uma conversa de 15 minutos
- Soar natural, não robótica

Escreva apenas a mensagem, sem explicações.
```

---

## 8. Core Workflows

### Workflow 1 — Scraping de Prospects

```mermaid
sequenceDiagram
    actor U as Usuário
    participant UI as Dashboard (React)
    participant API as /api/scrape
    participant AS as ApifyService
    participant Apify as Apify API
    participant Repo as LeadsRepository

    U->>UI: Clica "Buscar Prospects"\n(platform, keyword, limit)
    UI->>UI: Exibe loader
    UI->>API: POST /api/scrape
    API->>AS: scrapeProspects(request)
    AS->>Apify: runActor(actorId, input)
    Note over Apify: Scraping em andamento\n(pode levar 1-3 min)
    Apify-->>AS: Resultado bruto do scraping
    AS-->>API: Lead[] normalizado
    loop Para cada lead
        API->>Repo: upsert(lead)
        Note over Repo: Ignora duplicatas\npor profileUrl
    end
    API-->>UI: { imported, skipped, errors }
    UI->>UI: Atualiza tabela de leads
    UI-->>U: "15 novos leads importados"
```

---

### Workflow 2 — Geração de Mensagem Individual

```mermaid
sequenceDiagram
    actor U as Usuário
    participant UI as LeadSheet (painel lateral)
    participant API as /api/leads/[id]/generate-message
    participant GS as GeminiService
    participant Gemini as Gemini API
    participant Repo as LeadsRepository

    U->>UI: Clica "Gerar mensagem agora"
    UI->>UI: Exibe spinner no botão
    UI->>API: POST /api/leads/{id}/generate-message
    API->>Repo: getById(id)
    Repo-->>API: Lead
    API->>GS: generateMessage(lead)
    GS->>Gemini: generateContent(prompt)
    Note over Gemini: Geração de texto\n(< 10 segundos)
    Gemini-->>GS: Mensagem gerada
    GS-->>API: string (mensagem)
    API->>Repo: update(id, { message })
    Repo-->>API: Lead atualizado
    API-->>UI: { message: "Olá Dr. João..." }
    UI-->>U: Exibe mensagem no painel
```

---

## 9. Database Schema

O MVP utiliza **JSON local** ao invés de banco de dados relacional. O schema do arquivo `data/leads.json`:

```json
{
  "leads": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Clínica Sorrir Bem",
      "profileUrl": "https://www.instagram.com/clinicasorrirbe",
      "platform": "instagram",
      "bio": "Clínica odontológica em São Paulo. Transformando sorrisos há 10 anos. 😊",
      "followersCount": 3420,
      "status": "novo",
      "message": null,
      "createdAt": "2026-04-01T14:30:00.000Z"
    }
  ],
  "updatedAt": "2026-04-01T14:30:00.000Z"
}
```

**Índice de deduplicação:** `profileUrl` — verificado no `upsert()` antes de cada inserção.

**Performance com 10k leads:** Arquivo JSON de ~10k registros ocupa aproximadamente 5-10MB em disco. Leitura completa leva < 100ms em hardware moderno. Suficiente para o MVP.

> **Migração futura:** O padrão Repository isola completamente o storage. Se necessário escalar, substituir `leads-repository.ts` por implementação SQLite/PostgreSQL sem alterar nenhum outro arquivo.

---

## 10. Frontend Architecture

### Component Architecture

```
src/
├── app/
│   ├── page.tsx                 # Dashboard principal (lista de leads)
│   ├── settings/
│   │   └── page.tsx             # Página de configurações
│   └── api/                     # API Routes (backend)
├── components/
│   ├── leads/
│   │   ├── LeadsTable.tsx       # Tabela principal com filtros
│   │   ├── LeadRow.tsx          # Linha individual da tabela
│   │   ├── LeadSheet.tsx        # Painel lateral de detalhes
│   │   ├── StatusBadge.tsx      # Badge de status colorido
│   │   └── ScrapeModal.tsx      # Modal "Nova Busca"
│   ├── ui/                      # Componentes shadcn/ui (gerados pelo CLI)
│   └── layout/
│       └── Header.tsx           # Header com título e ações globais
├── hooks/
│   ├── useLeads.ts              # Fetch e estado da lista de leads
│   └── useGenerateMessage.ts    # Mutação de geração de mensagem
├── lib/
│   ├── leads-repository.ts      # Camada de dados (JSON)
│   ├── apify-service.ts         # Integração Apify
│   ├── gemini-service.ts        # Integração Gemini
│   └── csv-exporter.ts          # Geração de CSV
└── types/
    ├── lead.ts                  # Interfaces Lead, LeadStatus, Platform
    ├── scrape.ts                # ScrapeRequest, ScrapeResult
    └── messages.ts              # BatchGenerateRequest, BatchGenerateResult
```

### State Management

Estado local com `useState` e `useEffect`. Nenhum estado global necessário no MVP — cada página gerencia seu próprio estado de dados.

```typescript
// hooks/useLeads.ts
export function useLeads(filters?: { platform?: Platform; status?: LeadStatus }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    const params = new URLSearchParams(filters as Record<string, string>);
    const res = await fetch(`/api/leads?${params}`);
    setLeads(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, [filters]);

  return { leads, loading, refetch: fetchLeads };
}
```

### Routing Architecture

```
/ (app/page.tsx)           → Dashboard principal
/settings (app/settings/)  → Configurações de API keys
/api/health                → Health check
/api/leads                 → GET lista, filtros
/api/leads/[id]            → PATCH atualizar status
/api/leads/[id]/generate-message → POST gerar mensagem
/api/leads/generate-messages     → POST batch
/api/leads/export          → GET CSV
/api/scrape                → POST acionar scraping
/api/settings              → POST salvar config
```

---

## 11. Backend Architecture

### Service Architecture (API Routes — Next.js App Router)

```
src/app/api/
├── health/
│   └── route.ts                          # GET /api/health
├── leads/
│   ├── route.ts                          # GET /api/leads
│   ├── export/
│   │   └── route.ts                      # GET /api/leads/export
│   ├── generate-messages/
│   │   └── route.ts                      # POST /api/leads/generate-messages
│   └── [id]/
│       ├── route.ts                      # PATCH /api/leads/:id
│       └── generate-message/
│           └── route.ts                  # POST /api/leads/:id/generate-message
├── scrape/
│   └── route.ts                          # POST /api/scrape
└── settings/
    └── route.ts                          # POST /api/settings
```

**Padrão de cada route handler:**

```typescript
// src/app/api/leads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { leadsRepository } from "@/lib/leads-repository";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform") ?? undefined;
    const status = searchParams.get("status") ?? undefined;

    const leads = await leadsRepository.getAll({ platform, status });
    return NextResponse.json(leads);
  } catch (error) {
    console.error("[GET /api/leads]", error);
    return NextResponse.json(
      { error: "Falha ao carregar leads" },
      { status: 500 }
    );
  }
}
```

### Data Access Layer

```typescript
// src/lib/leads-repository.ts
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import type { Lead, LeadsStore } from "@/types/lead";

const DATA_PATH = "data/leads.json";

async function read(): Promise<LeadsStore> {
  if (!existsSync(DATA_PATH)) {
    return { leads: [], updatedAt: new Date().toISOString() };
  }
  const raw = await readFile(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

async function write(store: LeadsStore): Promise<void> {
  await mkdir("data", { recursive: true });
  store.updatedAt = new Date().toISOString();
  await writeFile(DATA_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export const leadsRepository = {
  getAll: async (filters?: Partial<Pick<Lead, "platform" | "status">>) => {
    const { leads } = await read();
    return leads.filter(l =>
      (!filters?.platform || l.platform === filters.platform) &&
      (!filters?.status || l.status === filters.status)
    );
  },
  getById: async (id: string) => {
    const { leads } = await read();
    return leads.find(l => l.id === id) ?? null;
  },
  upsert: async (partial: Omit<Lead, "id" | "status" | "message" | "createdAt">) => {
    const store = await read();
    const exists = store.leads.find(l => l.profileUrl === partial.profileUrl);
    if (exists) return { inserted: false };
    store.leads.push({ ...partial, id: uuidv4(), status: "novo", message: null, createdAt: new Date().toISOString() });
    await write(store);
    return { inserted: true };
  },
  update: async (id: string, patch: Partial<Lead>) => {
    const store = await read();
    const idx = store.leads.findIndex(l => l.id === id);
    if (idx === -1) return null;
    store.leads[idx] = { ...store.leads[idx], ...patch };
    await write(store);
    return store.leads[idx];
  },
};
```

---

## 12. Unified Project Structure

```
prospect-clinic/
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Dashboard principal
│   │   ├── layout.tsx                    # Layout raiz
│   │   ├── globals.css                   # Estilos globais
│   │   ├── settings/
│   │   │   └── page.tsx                  # Página de configurações
│   │   └── api/                          # API Routes (backend)
│   │       ├── health/route.ts
│   │       ├── leads/
│   │       │   ├── route.ts
│   │       │   ├── export/route.ts
│   │       │   ├── generate-messages/route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── generate-message/route.ts
│   │       ├── scrape/route.ts
│   │       └── settings/route.ts
│   ├── components/
│   │   ├── leads/
│   │   │   ├── LeadsTable.tsx
│   │   │   ├── LeadRow.tsx
│   │   │   ├── LeadSheet.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── ScrapeModal.tsx
│   │   ├── layout/
│   │   │   └── Header.tsx
│   │   └── ui/                           # shadcn/ui (gerado pelo CLI)
│   ├── hooks/
│   │   ├── useLeads.ts
│   │   └── useGenerateMessage.ts
│   ├── lib/
│   │   ├── leads-repository.ts           # Acesso ao JSON local
│   │   ├── apify-service.ts              # Integração Apify
│   │   ├── gemini-service.ts             # Integração Gemini
│   │   └── csv-exporter.ts              # Exportação CSV
│   └── types/
│       ├── lead.ts
│       ├── scrape.ts
│       └── messages.ts
├── data/
│   └── leads.json                        # Storage local (gitignored)
├── docs/
│   ├── prd.md
│   └── architecture.md
├── .env.local                            # Credenciais (gitignored)
├── .env.example                          # Template de variáveis
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── components.json                       # Config shadcn/ui
└── package.json
```

---

## 13. Development Workflow

### Prerequisites

```bash
# Verificar Node.js (requer v22+)
node --version

# Verificar npm
npm --version
```

### Initial Setup

```bash
# 1. Criar o projeto Next.js
npx create-next-app@latest prospect-clinic \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd prospect-clinic

# 2. Instalar dependências de produção
npm install apify-client @google/generative-ai uuid

# 3. Instalar dependências de tipos
npm install -D @types/uuid

# 4. Inicializar shadcn/ui
npx shadcn@latest init

# 5. Instalar componentes shadcn/ui necessários
npx shadcn@latest add table badge select sheet button input dialog

# 6. Criar arquivo de variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com seus tokens reais

# 7. Criar pasta data (gitignored)
mkdir data
echo '{"leads":[],"updatedAt":""}' > data/leads.json
```

### Development Commands

```bash
# Iniciar servidor de desenvolvimento
npm run dev              # localhost:3000

# Build de produção (opcional)
npm run build
npm run start

# Linting
npm run lint

# Testes
npm test
npm run test:watch
```

### Environment Configuration

```bash
# .env.local (nunca versionar)
APIFY_TOKEN=apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_TIMEOUT_MS=10000

# .env.example (versionar — sem valores reais)
APIFY_TOKEN=
GEMINI_API_KEY=
GEMINI_TIMEOUT_MS=10000
```

---

## 14. Deployment Architecture

### Estratégia de Deploy

**Frontend + Backend:** Next.js em `localhost:3000` via `npm run dev` (desenvolvimento) ou `npm run build && npm start` (produção local).

**Storage:** `data/leads.json` no filesystem local.

**Não há deploy cloud no MVP.**

### Environments

| Environment | URL | Propósito |
|-------------|-----|-----------|
| Development | `http://localhost:3000` | Desenvolvimento com hot-reload |
| Production Local | `http://localhost:3000` | Uso diário (`npm start`) |

---

## 15. Security & Performance

### Security

**Proteção de credenciais:**
- `APIFY_TOKEN` e `GEMINI_API_KEY` exclusivamente em `.env.local` (Next.js nunca expõe para o browser)
- `.env.local` e `data/leads.json` no `.gitignore`
- API Routes só aceitam requests de `localhost` implicitamente (sem exposição pública)

**Validação de inputs:**
- Parâmetros de scraping validados no servidor (`limit` entre 10-100, `platform` enum válido)
- IDs de lead validados antes de operações no repository
- Mensagem gerada pelo Gemini é tratada como string — sem execução de código

**CORS:** Next.js em modo local não expõe CORS externamente. Sem configuração adicional necessária.

### Performance

**Frontend:**
- Tabela carregada via `useEffect` — sem SSR para dados dinâmicos (leads mudam com frequência)
- Filtros aplicados client-side para respostas instantâneas após carga inicial
- shadcn/ui Table virtualizada implicitamente pelo browser para listas de até 10k items

**Backend:**
- JSON lido do disco a cada requisição — aceitável para MVP (< 100ms para 10k leads)
- Geração batch de mensagens: sequencial (não paralela) para respeitar rate limit do Gemini (15 RPM)
- Timeout de 10s por geração (configurável via `GEMINI_TIMEOUT_MS`)

---

## 16. Testing Strategy

```
        (sem E2E no MVP)
       /                \
    Integração: API Routes
      /                    \
 Unit: Services       Unit: Repository
 (Apify mock)         (JSON mock)
```

### Frontend Tests

```
src/
└── __tests__/
    ├── components/
    │   ├── LeadsTable.test.tsx
    │   └── StatusBadge.test.tsx
    └── hooks/
        └── useLeads.test.ts
```

### Backend Tests

```
src/
└── __tests__/
    ├── lib/
    │   ├── leads-repository.test.ts   # Testa CRUD com arquivo temp
    │   ├── apify-service.test.ts      # Mock do apify-client
    │   └── gemini-service.test.ts     # Mock do @google/generative-ai
    └── api/
        ├── leads.test.ts              # Testa GET /api/leads
        └── scrape.test.ts             # Testa POST /api/scrape
```

**Exemplo de teste do Repository:**

```typescript
// __tests__/lib/leads-repository.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFile, unlink } from "fs/promises";
import { leadsRepository } from "@/lib/leads-repository";

const TEST_PATH = "data/leads-test.json";

beforeEach(async () => {
  await writeFile(TEST_PATH, JSON.stringify({ leads: [], updatedAt: "" }));
});

afterEach(async () => {
  await unlink(TEST_PATH).catch(() => {});
});

describe("leadsRepository.upsert", () => {
  it("deve inserir lead novo", async () => {
    const result = await leadsRepository.upsert({
      name: "Clínica Teste",
      profileUrl: "https://instagram.com/clinicateste",
      platform: "instagram",
      bio: "Bio teste",
      followersCount: 1000,
    });
    expect(result.inserted).toBe(true);
  });

  it("deve ignorar lead duplicado", async () => {
    const lead = { name: "Clínica Teste", profileUrl: "https://instagram.com/clinicateste", platform: "instagram" as const, bio: "", followersCount: 0 };
    await leadsRepository.upsert(lead);
    const result = await leadsRepository.upsert(lead);
    expect(result.inserted).toBe(false);
  });
});
```

---

## 17. Coding Standards

### Critical Rules

- **Types em `src/types/`:** Sempre definir e importar tipos de `src/types/` — nunca inline em componentes ou routes
- **API Calls via hooks:** Componentes React nunca chamam `fetch` diretamente — sempre via hooks customizados (`useLeads`, `useGenerateMessage`)
- **Dados sensíveis server-only:** `apify-service.ts` e `gemini-service.ts` só são importados em API Routes — nunca em componentes client
- **Error handling uniforme:** Toda API Route retorna `{ error: string }` com status HTTP correto em caso de falha
- **Repository como único gateway:** Nenhum módulo acessa `data/leads.json` diretamente — sempre via `leadsRepository`

### Naming Conventions

| Elemento | Padrão | Exemplo |
|---------|--------|---------|
| Componentes React | PascalCase | `LeadsTable.tsx` |
| Hooks | camelCase com `use` | `useLeads.ts` |
| API Routes (pastas) | kebab-case | `/api/generate-messages/` |
| Funções/variáveis | camelCase | `scrapeProspects()` |
| Types/Interfaces | PascalCase | `Lead`, `ScrapeRequest` |
| Constantes | UPPER_SNAKE | `GEMINI_TIMEOUT_MS` |

---

## 18. Error Handling Strategy

### Error Response Format

```typescript
// Padrão de erro consistente em todas as API Routes
interface ApiError {
  error: string;        // Mensagem legível por humanos
  code?: string;        // Código opcional para debugging
}

// Exemplo de uso:
return NextResponse.json(
  { error: "Falha ao conectar com a Apify API", code: "APIFY_CONNECTION_ERROR" },
  { status: 500 }
);
```

### Frontend Error Handling

```typescript
// hooks/useLeads.ts — padrão de error handling
const [error, setError] = useState<string | null>(null);

const fetchLeads = async () => {
  try {
    const res = await fetch("/api/leads");
    if (!res.ok) {
      const { error } = await res.json();
      setError(error ?? "Erro desconhecido");
      return;
    }
    setLeads(await res.json());
  } catch {
    setError("Falha de conexão com o servidor");
  }
};
```

### Logging Strategy

```typescript
// Padrão de log em API Routes — prefixo com rota para filtrar no terminal
console.error("[POST /api/scrape] Erro Apify:", error);
console.log("[POST /api/scrape] Importados:", imported, "Ignorados:", skipped);
```

---

## 19. Monitoring & Observability

**MVP local — sem ferramentas externas de monitoramento.**

- **Logs:** `console.log` / `console.error` no terminal onde `npm run dev` está rodando
- **Error tracking:** Manual via terminal; prefixo de rota em cada log facilita filtros
- **Performance:** DevTools do browser para inspecionar tempos de resposta das API Routes

---

## 20. Checklist de Arquitetura

| Item | Status | Observação |
|------|--------|------------|
| Arquitetura adequada ao MVP local | ✅ | Monolith Next.js sem infra externa |
| Credenciais protegidas | ✅ | .env.local server-only; gitignored |
| Modelo de dados definido com TypeScript | ✅ | Interfaces em src/types/ |
| API REST especificada (OpenAPI) | ✅ | 8 endpoints documentados |
| Camada de dados isolada | ✅ | leadsRepository — migration-ready |
| Fluxos principais diagramados | ✅ | Scraping + Geração de mensagem |
| Estrutura de pastas definida | ✅ | src/ com app/, components/, lib/, types/ |
| Coding standards documentados | ✅ | 5 regras críticas + naming conventions |
| Strategy de testes definida | ✅ | Vitest, unit + integração |
| Error handling padronizado | ✅ | { error: string } em todas as routes |
| NFRs atendidos pela arquitetura | ✅ | NFR1-NFR6 todos cobertos |
| Performance local adequada | ✅ | JSON < 100ms para 10k leads |
