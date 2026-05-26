# InsemiAI — Casos de Uso e Fluxos Implementados

> **Status:** Backend 100% funcional · 37 endpoints · 8 módulos · 3 análises de IA
> **Hackathon ExpoAgro Crateús · Edital 01/2026**

---

## Sumário

1. [Autenticação](#1-autenticação)
2. [Gestão de Fazendas](#2-gestão-de-fazendas)
3. [Gestão de Animais](#3-gestão-de-animais)
4. [Gestão de Reprodutores](#4-gestão-de-reprodutores)
5. [Registro Reprodutivo](#5-registro-reprodutivo)
6. [Pesagem](#6-pesagem)
7. [Análises de IA](#7-análises-de-ia)
8. [Dashboard](#8-dashboard)
9. [Relatórios](#9-relatórios)
10. [Arquitetura Multi-Tenant](#10-arquitetura-multi-tenant)

---

## 1. Autenticação

### UC-01 · Cadastro de novo usuário

**Fluxo:**
1. Frontend envia `POST /api/auth/registro` com `nome`, `email`, `senha`
2. Sistema verifica duplicidade de e-mail
3. Senha é hasheada com bcrypt (salt 10)
4. Usuário criado; JWT retornado imediatamente

```
POST /api/auth/registro
{ "nome": "João Silva", "email": "joao@fazenda.com", "senha": "minhaSenha123" }
→ { "access_token": "eyJ..." }
```

### UC-02 · Login

**Fluxo:**
1. Frontend envia `POST /api/auth/login`
2. Credenciais validadas; token JWT assinado com expiração de 7 dias
3. Token deve ser enviado em todas as demais requisições: `Authorization: Bearer <token>`

```
POST /api/auth/login
{ "email": "joao@fazenda.com", "senha": "minhaSenha123" }
→ { "access_token": "eyJ..." }
```

**Proteção:** todas as rotas (exceto registro e login) exigem JWT válido via `JwtAuthGuard`.

---

## 2. Gestão de Fazendas

> Cada fazenda é um **tenant** independente. Um usuário pode ter múltiplas fazendas; os dados nunca se cruzam entre tenants.

### UC-03 · Criar fazenda

```
POST /api/fazendas
{ "nome": "Fazenda São João", "municipio": "Crateús", "estado": "CE" }
→ { "id": "uuid", "nome": "Fazenda São João", ... }
```

### UC-04 · Listar fazendas do usuário

```
GET /api/fazendas
→ [ { "id": "...", "nome": "...", "_count": { "animais": 10, "reprodutores": 3 } } ]
```

### UC-05 · Buscar / atualizar fazenda

```
GET /api/fazendas/:id
PUT /api/fazendas/:id  { "taxaMediaPrenhez": 68 }
```

---

## 3. Gestão de Animais

> Suporta bovinos, ovinos e caprinos na mesma plataforma. Soft delete preserva o histórico.

### UC-06 · Cadastrar animal

Campos capturados no cadastro:

| Campo | Tipo | Descrição |
|---|---|---|
| `identificador` | String | Código interno (ex: BOV-2024-001) |
| `especie` | Enum | `bovino` · `ovino` · `caprino` |
| `raca` | String | Raça do animal |
| `sexo` | Enum | `macho` · `femea` |
| `scoreCondicaoCorporal` | Int (1–5) | ECC (Nicholson & Butterworth) |
| `historicoDoencaReprodutiva` | Boolean | Metrite, endometrite, cistos |
| `paiId` / `maeId` | UUID? | Vínculo genealógico (pedigree) |
| `pesoNascer`, `pesoDesmame` | Float? | Desempenho ponderal |

```
POST /api/animais
→ animal criado com contadores zerados (historicoPrenhez, quantidadeAbortos, etc.)
```

### UC-07 · Listar animais da fazenda (com filtros e paginação)

```
GET /api/animais/fazenda/:fazendaId
  ?especie=bovino
  &sexo=femea
  &statusReproducao=Apto
  &page=1&limit=20
→ { "data": [...], "total": 45, "page": 1, "totalPages": 3 }
```

**Status disponíveis:** `Apto` · `Prenhe` · `Em Reprodução` · `Descarte` · `Inativo`

### UC-08 · Detalhe do animal

Retorna o perfil completo com:
- Dados cadastrais e genealógicos (`pai`, `mae`)
- Contadores reprodutivos atualizados automaticamente (`historicoPrenhez`, `quantidadeAbortos`, `quantidadePartos`)
- `diasPosParto` calculado dinamicamente a partir de `dataUltimoParto`
- `pesoAtual` (última pesagem registrada)
- Histórico completo de pesagens e eventos reprodutivos

```
GET /api/animais/:id
→ { ...dados, "diasPosParto": 75, "pesoAtual": 445, "pesagens": [...], "eventosReprodutivos": [...] }
```

### UC-09 · Atualizar / Inativar animal

```
PUT /api/animais/:id   { "scoreCondicaoCorporal": 4, "statusReproducao": "Apto" }
DELETE /api/animais/:id  → soft delete (ativo: false), histórico preservado
```

---

## 4. Gestão de Reprodutores

> O score de fertilidade é calculado automaticamente pelo sistema com **blendagem progressiva**: estimativa inicial por raça → substituída pelos dados reais conforme inseminações são registradas (0% real com 0 inseminações → 100% real a partir de 10).

### UC-10 · Cadastrar reprodutor

Reprodutor pode ser:
- **Vinculado a um animal macho da fazenda** (`animalId` preenchido)
- **Sêmen externo** (`animalId` nulo) — para palhetas adquiridas de terceiros

```
POST /api/reprodutores
{ "especie": "bovino", "nome": "Imperador", "raca": "Nelore", "fazendaId": "uuid" }
→ { "id": "uuid", "scoreFertilidade": 85, "scoreEstimado": 85, ... }
```

### UC-11 · Listar / buscar / atualizar / inativar reprodutor

```
GET  /api/reprodutores/fazenda/:fazendaId  → apenas ativos, ordenados por score
GET  /api/reprodutores/:id
PUT  /api/reprodutores/:id
DELETE /api/reprodutores/:id               → inativação (ativo: false)
```

**Classificação automática:** `scoreFertilidade ≥ 80` = Excelente · `60–79` = Bom · `< 60` = Regular

---

## 5. Registro Reprodutivo

> Cada evento registrado atualiza automaticamente os contadores do animal (`historicoPrenhez`, `quantidadeAbortos`, `dataUltimoParto`, etc.) e o score do reprodutor.

### UC-12 · Registrar evento reprodutivo

**Tipos de evento suportados:**

| Tipo | Descrição |
|---|---|
| `inseminacao_artificial` | IA com sêmen + reprodutor + protocolo |
| `monta_natural` | Cobertura natural sem controle |
| `monta_controlada` | Cobertura monitorada |
| `cio` | Detecção de cio |
| `parto` | Nascimento (atualiza `dataUltimoParto`, incrementa `quantidadePartos`) |
| `aborto` | Perda gestacional (incrementa `quantidadeAbortos`) |
| `prenhez` | Confirmação de gestação |

```
POST /api/reproducao/evento
{
  "animalId": "uuid",
  "reprodutorId": "uuid",           // opcional
  "tipoEvento": "inseminacao_artificial",
  "inseminador": "Dr. Fernando Lima",
  "semenUtilizado": "Nelore MAX-102",
  "lote": "Lote 05 - Primíparas",
  "protocoloReprodutivo": "IATF",
  "dataEvento": "2026-05-22"
}
```

### UC-13 · Atualizar diagnóstico de prenhez

```
PATCH /api/reproducao/evento/:id/diagnostico
{ "diagnosticoPrenhez": "positivo", "resultado": "Prenhe" }
```

**Diagnósticos:** `pendente` · `positivo` · `negativo` · `falha_concepcao`
**Resultados:** `Prenhe` · `Vazia` · `Gêmeos` · `Aborto` · `Natimorto` · `Parto Duplo`

### UC-14 · Listar eventos com filtros

```
GET /api/reproducao/fazenda/:fazendaId
  ?tipoEvento=inseminacao_artificial
  &diagnosticoPrenhez=positivo
  &dataInicio=2026-01-01
  &dataFim=2026-05-31
  &page=1&limit=20

GET /api/reproducao/animal/:animalId   → histórico completo de um animal
```

---

## 6. Pesagem

> Histórico de pesagens permite ao sistema calcular `pesoAtual` do animal e ao modelo de IA avaliar o fator "Peso corporal" com dado real.

### UC-15 · Registrar pesagem

```
POST /api/pesagem
{ "animalId": "uuid", "pesoKg": 448.5, "dataPesagem": "2026-05-20" }
```

### UC-16 · Histórico e exclusão

```
GET    /api/pesagem/animal/:animalId   → lista ordenada por data desc
DELETE /api/pesagem/:id
```

---

## 7. Análises de IA

> **Modelo base:** scoring por 11 fatores zootécnicos com pesos definidos por literatura científica (Embrapa, CBRA, ASBIA).
> **Fórmula:** `Probabilidade (%) = 35 + (score × 0,6)` · mínimo 35% · máximo 95%
> **Insight narrativo:** `gpt-4o-mini` (OpenAI) com prompt adaptado ao perfil selecionado.

### Perfis de IA (configuráveis por fazenda)

| Perfil | Tokens reais* | Latência | Custo / 1.000 análises |
|---|:---:|:---:|:---:|
| ⚡ **Essencial** — sem IA | 0 | < 200 ms | R$ 0,00 |
| 💬 **Resumido** — 1 frase | ~69 | < 1 s | R$ 0,13 |
| 📋 **Padrão** — 1-2 frases | ~155 | 1–2 s | R$ 0,30 |
| 🔬 **Especialista** — laudo técnico | ~460 | 3–5 s | R$ 0,87 |

*Medidos em testes reais com a API OpenAI em 26/05/2026 e validados pelo relatório de uso exportado do painel OpenAI (`completions_usage_2026-05-26_2026-05-26.csv`).

---

### UC-17 · Listar perfis disponíveis

```
GET /api/ia/perfis
→ [
    { "id": "essencial", "nome": "Essencial", "icone": "⚡", "resumo": "Resultado imediato, sem IA",
      "tokensEstimadosPorAnalise": 0, "custoEstimadoPor1000Analises": { "brl": 0 } },
    { "id": "resumido",  "nome": "Resumido",  "icone": "💬", "tokensEstimadosPorAnalise": 70 },
    { "id": "padrao",    "nome": "Padrão",    "icone": "📋", "tokensEstimadosPorAnalise": 130 },
    { "id": "especialista", "nome": "Especialista", "icone": "🔬", "tokensEstimadosPorAnalise": 380 }
  ]
```

### UC-18 · Configurar perfil de IA da fazenda

```
GET   /api/ia/config/:fazendaId   → perfil atual + lista de perfis disponíveis
PATCH /api/ia/config/:fazendaId   { "perfilIa": "especialista" }
→ { "mensagem": "Perfil atualizado para \"Especialista\" com sucesso.", ... }
```

**Override por análise:** qualquer análise aceita `perfilIaOverride` para sobrescrever o perfil da fazenda apenas naquela chamada.

---

### UC-19 · Análise: Chance de Prenhez

Avalia a probabilidade de prenhez de uma fêmea específica com um reprodutor e condições ambientais definidas.

**11 fatores avaliados:**

| # | Fator | Peso máx. |
|---|---|:---:|
| 1 | Peso corporal (mín. bovino 380 kg · ovino 45 kg · caprino 35 kg) | +25 |
| 2 | Intervalo pós-parto (mín. 60 dias) | +20 |
| 3 | Histórico reprodutivo (prenhezes anteriores) | +15 |
| 4 | Histórico de abortos (ausência = positivo) | +10 |
| 5 | ECC — Escore de Condição Corporal (≥ 3/5) | +10 |
| 6 | Saúde reprodutiva (sem metrite/endometrite) | +10 |
| 7 | Status reprodutivo (Apto = positivo) | +5 |
| 8 | Score de fertilidade do reprodutor (≥ 80 = máximo) | +10 |
| 9 | Protocolo reprodutivo (IATF / IATF com eCG = bônus) | +5 |
| 10 | Temperatura ambiente (> 32°C = −5) | −5 |
| 11 | Estação do ano (seca = −5) | −5 |

```
POST /api/ia/prever-prenhez
{
  "animalId": "uuid",
  "reprodutorId": "uuid",       // opcional
  "protocolo": "IATF",
  "temperaturaAmbiente": 28,
  "estacaoAno": "chuvosa",
  "perfilIaOverride": "padrao"  // opcional
}
→ {
    "probabilidadePrenhez": 95,
    "scoreFertilidade": 100,
    "nivelRisco": "baixo",
    "compatibilidadeGenetica": 90,
    "fatoresPositivos": ["Peso adequado (445 kg)", "Reprodutor com alta fertilidade (score 85)"],
    "alertas": [],
    "recomendacoes": ["Realizar diagnóstico de gestação entre 28-35 dias pós-inseminação"],
    "fundamentacao": [ { "fator": "Peso corporal", "pontuacao": "+25 pontos", "referencia": "Embrapa..." } ],
    "formulaProbabilidade": "Probabilidade = 35% + 100 × 0,6 = 95%",
    "insightGpt": "A vaca Nelore de 445 kg, com duas prenhezes anteriores...",
    "_meta": { "perfilIa": "padrao", "tokensEntrada": 88, "tokensSaida": 67, "tokensTotal": 155 }
  }
```

**Resultado salvo no histórico** com `tipoAnalise: "prenhez"`.

---

### UC-20 · Análise: Melhor Reprodutor

Rankeia todos os reprodutores ativos da fazenda por compatibilidade com uma fêmea específica. A compatibilidade combina:
- Score de fertilidade do reprodutor
- Bônus genético por diversidade de raça (+5 se raça diferente da fêmea)
- Bônus por histórico real no sistema (+3 se ≥ 10 inseminações registradas)
- Penalização por fertilidade abaixo do ideal (−10 se score < 60)

```
GET /api/ia/recomendar-reprodutor/:fazendaId/:animalId?perfilIaOverride=padrao
→ {
    "animal": { "nome": "Mimosa", "especie": "bovino", "raca": "Nelore", "pesoAtual": 445 },
    "ranking": [
      { "posicao": 1, "reprodutor": { "nome": "Black Diamond", "raca": "Angus",
          "scoreFertilidade": 82, "taxaRealPrenhez": 75 },
        "compatibilidade": 90, "classificacao": "Excelente", "melhorEscolha": true },
      { "posicao": 2, "reprodutor": { "nome": "Imperador", "raca": "Nelore",
          "scoreFertilidade": 85, "taxaRealPrenhez": null },
        "compatibilidade": 85, "classificacao": "Excelente", "melhorEscolha": false }
    ],
    "insightGpt": "Recomendo o Black Diamond Angus, pois apresenta a maior compatibilidade...",
    "_meta": { "perfilIa": "padrao", "tokensEntrada": 85, "tokensSaida": 73, "tokensTotal": 158 }
  }
```

**Resultado salvo no histórico** com `tipoAnalise: "melhor_reprodutor"`.

---

### UC-21 · Análise: Melhor Matriz

Avalia **todas as fêmeas elegíveis** da fazenda usando os mesmos 11 fatores e retorna um ranking das mais aptas para inseminação agora. Fêmeas com status `Prenhe`, `Inativo` ou `Descarte` são automaticamente excluídas.

```
GET /api/ia/melhor-matriz/:fazendaId
  ?especie=bovino          // filtro opcional
  &protocolo=IATF
  &temperaturaAmbiente=28
  &estacaoAno=chuvosa
  &limite=5                // top N animais (máx. 20)
  &perfilIaOverride=padrao

→ {
    "fazenda": { "nome": "Fazenda São João" },
    "parametros": { "protocolo": "IATF", "temperaturaAmbiente": 28, "estacaoAno": "chuvosa", "especie": "todas" },
    "totalAnimaisAvaliados": 10,
    "ranking": [
      { "posicao": 1, "animal": { "nome": "Mimosa", "especie": "bovino", "raca": "Nelore" },
        "pesoAtual": 445, "probabilidadePrenhez": 95, "nivelRisco": "baixo",
        "fatoresPositivos": ["Peso adequado (445 kg)", "Boa condição corporal (4/5)"],
        "alertas": [], "melhorEscolha": true },
      { "posicao": 2, "animal": { "nome": "Branca", "especie": "ovino", "raca": "Dorper" },
        "pesoAtual": 52, "probabilidadePrenhez": 95, "nivelRisco": "baixo", "melhorEscolha": false }
    ],
    "insightGpt": "Priorize a inseminação de Mimosa e Branca, que apresentam condições ideais...",
    "_meta": { "perfilIa": "padrao", "tokensEntrada": 92, "tokensSaida": 79, "tokensTotal": 171 }
  }
```

**Resultado salvo no histórico** com `tipoAnalise: "melhor_matriz"`, usando o animal #1 do ranking como referência.

---

### UC-22 · Histórico de análises

Todas as análises (Chance de Prenhez, Melhor Reprodutor e Melhor Matriz) são persistidas no banco e acessíveis pelo histórico.

```
GET /api/ia/historico/fazenda/:fazendaId?page=1&limit=20
→ {
    "data": [
      { "id": "uuid", "tipoAnalise": "melhor_matriz", "perfilIa": "especialista",
        "probabilidadePrenhez": 95, "nivelRisco": "baixo",
        "tokensEntrada": 271, "tokensSaida": 170, "criadoEm": "2026-05-26T...",
        "animal": { "nome": "Mimosa", "especie": "bovino" } },
      ...
    ],
    "total": 20, "page": 1, "totalPages": 7
  }

GET /api/ia/historico/:animalId   → análises de um animal específico
```

---

### UC-23 · Relatório de consumo de tokens

Mostra o consumo real de IA da fazenda com custo acumulado, médias por perfil e projeções para planejamento financeiro.

```
GET /api/ia/relatorio-consumo/:fazendaId
→ {
    "resumo": {
      "totalAnalises": 20,
      "totalTokensConsumidos": 2430,
      "custoRealAcumulado": { "usd": 0.000789, "brl": 0.0045 },
      "economiaVsEspecialistaTotal": { "percentual": 76.7 }
    },
    "porPerfil": [
      { "perfilNome": "Essencial",    "totalAnalises": 5, "tokens": { "mediaRealPorAnalise": 0 } },
      { "perfilNome": "Resumido",     "totalAnalises": 2, "tokens": { "mediaRealPorAnalise": 35 } },
      { "perfilNome": "Padrão",       "totalAnalises": 6, "tokens": { "mediaRealPorAnalise": 81 } },
      { "perfilNome": "Especialista", "totalAnalises": 7, "tokens": { "mediaRealPorAnalise": 268 } }
    ],
    "projecoesCusto": [
      { "perfilNome": "Essencial",    "para1000AnalisesBrl": 0 },
      { "perfilNome": "Resumido",     "para1000AnalisesBrl": 0.13 },
      { "perfilNome": "Padrão",       "para1000AnalisesBrl": 0.30 },
      { "perfilNome": "Especialista", "para1000AnalisesBrl": 0.84 }
    ]
  }
```

---

## 8. Dashboard

### UC-24 · Métricas consolidadas da fazenda

```
GET /api/dashboard/:fazendaId?periodo=30d&especie=bovino
```

**Períodos:** `7d` · `30d` · `90d` · `365d`
**Espécie:** `bovino` · `ovino` · `caprino` · (omitir para todos)

**Resposta:**
```json
{
  "cards": {
    "totalAnimais": 10,
    "garanhoeAtivos": 5,
    "inseminacoesSucesso": 3,
    "inseminacoesInsucesso": 1,
    "taxaPrenhez": 75.0
  },
  "grafico": [ { "mes": "2026-05", "inseminacoes": 4, "prenhezes": 3 } ],
  "distribuicaoPorEspecie": [ { "especie": "bovino", "total": 4 }, ... ]
}
```

---

## 9. Relatórios

### UC-25 · Relatório de desempenho da fazenda

```
GET /api/relatorios/fazenda/:fazendaId
→ {
    "fazenda": { "nome": "...", "taxaMediaPrenhez": 68 },
    "resumo": { "totalAnimais": 10, "totalInseminacoes": 8, "taxaPrenhez": 75 },
    "porEspecie": [ { "especie": "bovino", "total": 4, "taxaPrenhez": 80 } ],
    "distribuicaoRisco": { "baixo": 5, "moderado": 3, "alto": 2 }
  }
```

### UC-26 · Relatório de histórico do animal

```
GET /api/relatorios/animal/:animalId
→ histórico completo com todos os eventos, pesagens e predições do animal
```

### UC-27 · Ranking de reprodutores

```
GET /api/relatorios/reprodutores/:fazendaId
→ lista ordenada por scoreFertilidade com totalInseminacoes e prenhezes reais
```

---

## 10. Arquitetura Multi-Tenant

### Isolamento de dados

- Todo acesso verifica `fazenda.usuarioId === usuarioId` autenticado
- Tentativa de acesso a dados de outro tenant retorna `403 Forbidden`
- Não há dados compartilhados entre fazendas

### Configuração de IA por tenant

Cada fazenda tem seu próprio `perfilIa` (`essencial` · `resumido` · `padrao` · `especialista`), permitindo que diferentes operações escolham o nível de detalhe e custo adequado ao seu contexto.

```
Fazenda A → perfilIa: "essencial"     (operação extensiva, muitos animais, custo mínimo)
Fazenda B → perfilIa: "padrao"        (uso diário do técnico de campo)
Fazenda C → perfilIa: "especialista"  (genética de ponta, laudos para veterinários)
```

### Schema do banco (PostgreSQL)

```
Usuario (1) ──── (N) Fazenda
                       │
              ┌────────┼────────────┐
           Animal   Reprodutor   Predicao
              │         │
           Pesagem  EventoReprodutivo
```

---

## Mapa de Endpoints

| Módulo | Método | Rota | Caso de Uso |
|---|:---:|---|---|
| **Auth** | POST | `/api/auth/registro` | UC-01 |
| | POST | `/api/auth/login` | UC-02 |
| **Fazendas** | POST | `/api/fazendas` | UC-03 |
| | GET | `/api/fazendas` | UC-04 |
| | GET | `/api/fazendas/:id` | UC-05 |
| | PUT | `/api/fazendas/:id` | UC-05 |
| **Animais** | POST | `/api/animais` | UC-06 |
| | GET | `/api/animais/fazenda/:id` | UC-07 |
| | GET | `/api/animais/:id` | UC-08 |
| | PUT | `/api/animais/:id` | UC-09 |
| | DELETE | `/api/animais/:id` | UC-09 |
| **Reprodutores** | POST | `/api/reprodutores` | UC-10 |
| | GET | `/api/reprodutores/fazenda/:id` | UC-11 |
| | GET | `/api/reprodutores/:id` | UC-11 |
| | PUT | `/api/reprodutores/:id` | UC-11 |
| | DELETE | `/api/reprodutores/:id` | UC-11 |
| **Reprodução** | POST | `/api/reproducao/evento` | UC-12 |
| | PATCH | `/api/reproducao/evento/:id/diagnostico` | UC-13 |
| | GET | `/api/reproducao/fazenda/:id` | UC-14 |
| | GET | `/api/reproducao/animal/:id` | UC-14 |
| **Pesagem** | POST | `/api/pesagem` | UC-15 |
| | GET | `/api/pesagem/animal/:id` | UC-16 |
| | DELETE | `/api/pesagem/:id` | UC-16 |
| **IA** | GET | `/api/ia/perfis` | UC-17 |
| | GET | `/api/ia/config/:fazendaId` | UC-18 |
| | PATCH | `/api/ia/config/:fazendaId` | UC-18 |
| | POST | `/api/ia/prever-prenhez` | UC-19 |
| | GET | `/api/ia/recomendar-reprodutor/:fId/:aId` | UC-20 |
| | GET | `/api/ia/melhor-matriz/:fazendaId` | UC-21 |
| | GET | `/api/ia/historico/fazenda/:fazendaId` | UC-22 |
| | GET | `/api/ia/historico/:animalId` | UC-22 |
| | GET | `/api/ia/relatorio-consumo/:fazendaId` | UC-23 |
| **Dashboard** | GET | `/api/dashboard/:fazendaId` | UC-24 |
| **Relatórios** | GET | `/api/relatorios/fazenda/:id` | UC-25 |
| | GET | `/api/relatorios/animal/:id` | UC-26 |
| | GET | `/api/relatorios/reprodutores/:id` | UC-27 |

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | NestJS 10 (TypeScript) |
| ORM | Prisma 5 |
| Banco de dados | PostgreSQL |
| Autenticação | JWT (passport-jwt, 7 dias) |
| IA narrativa | GPT-4o-mini (OpenAI) |
| SDK Anthropic | @anthropic-ai/sdk (disponível para expansão) |
| Documentação | Swagger — `http://localhost:3001/docs` |
| Seed de demo | `npm run prisma:seed` — 10 animais, 8 reprodutores, histórico completo |

---

*Última atualização: 26/05/2026 · InsemiAI Backend v1.0*
