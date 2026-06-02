# InsemiAI — API Contracts

> Documento para integração frontend ↔ backend.  
> Base URL: `https://<seu-dominio>/api`  
> Todas as rotas (exceto Auth e `GET /invitations/:token`) exigem `Authorization: Bearer <token>` e o header `X-Farm-ID: <farmId>`.

---

## Autenticação

### `POST /api/auth/register`
Cria conta e retorna token JWT.

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@farm.com.br",
  "password": "minimo6chars"
}
```

**Response 201:**
```json
{
  "token": "eyJ...",
  "user": { "id": "uuid", "name": "João Silva", "email": "joao@farm.com.br" }
}
```

---

### `POST /api/auth/login`

**Body:**
```json
{ "email": "joao@farm.com.br", "password": "senha" }
```

**Response 200:**
```json
{
  "token": "eyJ...",
  "user": { "id": "uuid", "name": "João Silva", "email": "joao@farm.com.br" }
}
```

---

## Farms

> Rotas sem `X-Farm-ID`: `POST /farms` e `GET /farms`.  
> Demais rotas exigem `X-Farm-ID`.

### `POST /api/farms`
Cria fazenda. O criador vira admin automaticamente.

**Body:**
```json
{ "name": "Fazenda São João", "city": "Crateús", "state": "CE" }
```

**Response 201:**
```json
{ "id": "uuid", "name": "Fazenda São João", "city": "Crateús", "state": "CE" }
```

---

### `GET /api/farms`
Lista todas as fazendas onde o usuário autenticado é membro.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "name": "Fazenda São João",
    "city": "Crateús",
    "state": "CE",
    "role": "admin"
  }
]
```

---

### `GET /api/farms/current` _(requer X-Farm-ID)_
Retorna dados da fazenda ativa.

**Response 200:**
```json
{
  "id": "uuid",
  "name": "Fazenda São João",
  "city": "Crateús",
  "state": "CE",
  "averagePregnancyRate": 72,
  "aiProfile": "standard",
  "memberRole": "admin"
}
```

---

### `PUT /api/farms` _(admin)_
Atualiza dados da fazenda ativa.

**Body:** qualquer campo de `CreateFarmDto` (todos opcionais).

---

## Animais

### `POST /api/animals`

**Body:**
```json
{
  "identifier": "BOV-001",
  "species": "cattle",
  "name": "Mimosa",
  "breed": "Nelore",
  "sex": "female",
  "birthDate": "2021-03-15",
  "bodyConditionScore": 3,
  "reproductiveDiseaseHistory": false,
  "lineage": "Line A",
  "sireId": "uuid-opcional",
  "damId": "uuid-opcional",
  "initialWeight": 420.5,
  "initialWeighingDate": "2024-01-10"
}
```

> `species`: `"cattle" | "sheep" | "goat"`  
> `sex`: `"male" | "female"`  
> `bodyConditionScore`: 1–5

---

### `GET /api/animals`
Lista com filtros e paginação.

**Query params:**
| Param | Tipo | Exemplo |
|-------|------|---------|
| `species` | `cattle\|sheep\|goat` | `cattle` |
| `sex` | `male\|female` | `female` |
| `breed` | string | `Nelore` |
| `search` | string | `Mimosa` |
| `page` | number | `1` |
| `limit` | number | `20` |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "identifier": "BOV-001",
      "name": "Mimosa",
      "species": "cattle",
      "breed": "Nelore",
      "sex": "female",
      "birthDate": "2021-03-15",
      "bodyConditionScore": 3,
      "reproductiveStatus": "Open",
      "active": true,
      "pregnancyHistory": 2,
      "abortionCount": 0,
      "lastBirthDate": "2023-08-10",
      "reproductiveDiseaseHistory": false
    }
  ],
  "total": 84,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

---

### `GET /api/animals/:id`

**Response 200:** objeto completo do animal com `weighings` e `reproductiveEvents`.

---

### `PUT /api/animals/:id`
Atualiza animal. Body: mesmos campos de `CreateAnimalDto`, todos opcionais.

---

### `DELETE /api/animals/:id` _(admin)_

**Body:**
```json
{ "reason": "Motivo da exclusão" }
```

---

## Reprodutores (Breeders)

### `POST /api/breeders`

**Body:**
```json
{
  "animalId": "uuid-opcional",
  "name": "Imperador",
  "species": "cattle",
  "breed": "Nelore",
  "totalInseminations": 12,
  "pregnancies": 9
}
```

> Se `animalId` for informado, os campos `name`/`species`/`breed` são preenchidos automaticamente a partir do animal.

---

### `GET /api/breeders`

**Query:** `species`, `page`, `limit`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Imperador",
      "species": "cattle",
      "breed": "Nelore",
      "fertilityScore": 87,
      "totalInseminations": 12,
      "pregnancies": 9,
      "active": true
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### `GET /api/breeders/:id`
### `PUT /api/breeders/:id`
### `DELETE /api/breeders/:id` _(admin)_

---

## Reprodução

### `POST /api/reproduction/event`

**Body:**
```json
{
  "animalId": "uuid",
  "breederId": "uuid-opcional",
  "eventType": "artificial_insemination",
  "inseminator": "Dr. Carlos",
  "semenUsed": "Nelore Lote A",
  "lot": "Lote-2024-001",
  "reproductiveProtocol": "FTAI",
  "eventDate": "2024-06-01",
  "notes": "Animal em boa condição"
}
```

> `eventType`: `"artificial_insemination" | "natural_mating" | "controlled_mating" | "heat" | "birth" | "abortion" | "pregnancy"`

---

### `GET /api/reproduction`

**Query params:**
| Param | Tipo | Exemplo |
|-------|------|---------|
| `search` | string | `Mimosa` |
| `species` | `cattle\|sheep\|goat` | `cattle` |
| `pregnancyDiagnosis` | `positive\|negative\|conception_failure` | |
| `from` | date string | `2024-01-01` |
| `to` | date string | `2024-12-31` |
| `page` | number | `1` |
| `limit` | number | `20` |

---

### `GET /api/reproduction/animal/:animalId`
Lista eventos reprodutivos de um animal específico.

---

### `PATCH /api/reproduction/event/:id/diagnosis`
Registra resultado do diagnóstico de prenhez.

**Body:**
```json
{
  "pregnancyDiagnosis": "positive",
  "result": "Prenhez confirmada por ultrassom",
  "confirmationDate": "2024-06-30"
}
```

> `pregnancyDiagnosis`: `"positive" | "negative" | "conception_failure"`

---

## Pesagens

### `POST /api/weighing`

**Body:**
```json
{
  "animalId": "uuid",
  "weightKg": 435.5,
  "weighingDate": "2024-06-01",
  "notes": "Pesagem pós-desmame"
}
```

---

### `GET /api/weighing/animal/:animalId`
Histórico de pesagens do animal.

---

### `DELETE /api/weighing/:id` _(admin)_

---

## Dashboard

### `GET /api/dashboard`

**Query params:**
| Param | Valores | Default |
|-------|---------|---------|
| `period` | `last_week\|last_month\|last_quarter\|last_year\|all` | `last_month` |
| `species` | `cattle\|sheep\|goat` | todos |

**Response 200 (resumo):**
```json
{
  "cards": {
    "totalAnimals": 120,
    "activeFemales": 84,
    "pregnant": 22,
    "inseminationsThisPeriod": 18,
    "averagePregnancyRate": 72
  },
  "chart": [
    { "month": "Jan", "inseminations": 8, "pregnancies": 6 }
  ],
  "speciesDistribution": [
    { "species": "cattle", "count": 95, "percentage": 79.2 }
  ]
}
```

---

## Relatórios

### `GET /api/reports/farm`
Relatório geral de desempenho reprodutivo da fazenda.

### `GET /api/reports/animal/:animalId`
Relatório de desempenho reprodutivo de um animal.

### `GET /api/reports/breeders`
Ranking de reprodutores por `fertilityScore`.

---

## Membros da Fazenda _(rotas admin)_

### `GET /api/members`
Lista membros da fazenda ativa.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "name": "Maria Souza",
    "email": "maria@farm.com",
    "role": "operator",
    "joinedAt": "2024-02-10T00:00:00.000Z"
  }
]
```

---

### `POST /api/members/invite` _(admin)_
Envia convite por e-mail.

**Body:**
```json
{ "email": "colaborador@farm.com", "role": "operator" }
```

> `role`: `"admin" | "operator"`

---

### `GET /api/members/invitations` _(admin)_
Lista convites pendentes.

---

### `DELETE /api/members/invitations/:invitationId` _(admin)_
Cancela convite pendente.

---

### `PATCH /api/members/:memberId` _(admin)_
Atualiza papel de um membro.

**Body:**
```json
{ "role": "admin" }
```

---

### `DELETE /api/members/:memberId` _(admin)_
Remove membro da fazenda.

---

## Convites (fluxo público)

### `GET /api/invitations/:token`
Retorna detalhes do convite. **Não requer autenticação.**

**Response 200:**
```json
{
  "token": "abc123",
  "email": "colaborador@farm.com",
  "role": "operator",
  "farmName": "Fazenda São João",
  "expiresAt": "2024-07-10T00:00:00.000Z",
  "status": "pending"
}
```

---

### `POST /api/invitations/:token/accept`
Aceita convite. **Requer autenticação** com o e-mail do convite.

---

## IA — Análises

> Todas as rotas de IA têm rate limit de **10 req/min** por farm.

---

### `POST /api/ai/predict-pregnancy`
Prediz probabilidade de prenhez para um animal.

**Body:**
```json
{
  "animalId": "uuid",
  "breederId": "uuid-opcional",
  "protocol": "FTAI",
  "ambientTemperature": 28,
  "season": "dry",
  "reproductiveEventId": "uuid-opcional"
}
```

> `protocol`: `"FTAI" | "Ovsynch" | "FTAI with eCG" | "Resync" | "Natural Mating" | "Controlled Mating"`  
> `season`: `"dry" | "rainy"`

**Response 201:**
```json
{
  "pregnancyProbability": 74,
  "fertilityScore": 78,
  "riskLevel": "low",
  "geneticCompatibility": 85,
  "positiveFactors": ["Good body condition", "Recent reproductive history"],
  "alerts": [],
  "recommendations": ["Proceed with insemination"],
  "aiInsight": "Animal com boa condição corporal e histórico reprodutivo favorável...",
  "_meta": {
    "aiProfile": "standard",
    "aiProfileName": "Standard",
    "inputTokens": 52,
    "outputTokens": 76,
    "totalTokens": 128
  }
}
```

---

### `GET /api/ai/recommend-breeder/:animalId`
Ranqueia reprodutores compatíveis com a fêmea.

**Response 200:**
```json
{
  "animal": {
    "id": "uuid",
    "name": "Mimosa",
    "species": "cattle",
    "breed": "Nelore",
    "currentWeight": 430,
    "bodyConditionScore": 3
  },
  "ranking": [
    {
      "position": 1,
      "breeder": {
        "id": "uuid",
        "name": "Imperador",
        "breed": "Nelore",
        "fertilityScore": 87,
        "totalInseminations": 12,
        "pregnancies": 9,
        "actualPregnancyRate": 75
      },
      "compatibility": 90,
      "classification": "Excellent",
      "bestChoice": true
    }
  ],
  "aiInsight": "Reprodutor Imperador apresenta compatibilidade excelente...",
  "_meta": { "aiProfile": "standard", "inputTokens": 48, "outputTokens": 70, "totalTokens": 118 }
}
```

---

### `GET /api/ai/best-dam`
Ranqueia as fêmeas mais aptas para inseminação agora.

**Query params:**
| Param | Tipo | Exemplo |
|-------|------|---------|
| `species` | `cattle\|sheep\|goat` | `cattle` |
| `protocol` | ver lista acima | `FTAI` |
| `ambientTemperature` | number | `28` |
| `season` | `dry\|rainy` | `dry` |
| `limit` | number (max 20) | `5` |

**Response 200:**
```json
{
  "farm": { "id": "uuid", "name": "Fazenda São João" },
  "parameters": { "protocol": "FTAI", "ambientTemperature": 28, "season": "dry", "species": "all" },
  "totalAnimalsEvaluated": 84,
  "ranking": [
    {
      "position": 1,
      "animal": {
        "id": "uuid",
        "name": "Mimosa",
        "identifier": "BOV-001",
        "species": "cattle",
        "breed": "Nelore",
        "reproductiveStatus": "Open",
        "bodyConditionScore": 4
      },
      "currentWeight": 435,
      "pregnancyProbability": 81,
      "fertilityScore": 85,
      "riskLevel": "low",
      "positiveFactors": ["Excelente condição corporal", "Histórico reprodutivo positivo"],
      "alerts": [],
      "bestChoice": true
    }
  ],
  "aiInsight": "Mimosa lidera o ranking com 81% de probabilidade...",
  "_meta": { "aiProfile": "standard", "inputTokens": 95, "outputTokens": 110, "totalTokens": 205 }
}
```

---

### `GET /api/ai/profiles`
Lista todos os perfis de IA disponíveis.

**Response 200:**
```json
[
  {
    "id": "essential",
    "name": "Essential",
    "icon": "⚡",
    "summary": "Local analysis only, zero AI cost",
    "description": "Fast scoring with no API calls...",
    "estimatedLatency": "< 200 ms",
    "estimatedTokensPerAnalysis": 0,
    "estimatedCostPer1000Analyses": { "usd": 0, "brl": 0 }
  },
  {
    "id": "brief",
    "name": "Brief",
    "icon": "💬",
    "summary": "Single-sentence AI insight",
    "estimatedLatency": "< 1 second",
    "estimatedTokensPerAnalysis": 70,
    "estimatedCostPer1000Analyses": { "usd": 0.026, "brl": 0.15 }
  },
  {
    "id": "standard",
    "name": "Standard",
    "icon": "📋",
    "summary": "1–2 sentence analysis",
    "estimatedLatency": "1–2 seconds",
    "estimatedTokensPerAnalysis": 130,
    "estimatedCostPer1000Analyses": { "usd": 0.056, "brl": 0.32 }
  },
  {
    "id": "expert",
    "name": "Expert",
    "icon": "🔬",
    "summary": "Full technical report",
    "estimatedLatency": "3–5 seconds",
    "estimatedTokensPerAnalysis": 380,
    "estimatedCostPer1000Analyses": { "usd": 0.17, "brl": 0.97 }
  }
]
```

---

### `GET /api/ai/config`
Retorna o perfil de IA configurado na fazenda ativa.

**Response 200:**
```json
{
  "farmId": "uuid",
  "farmName": "Fazenda São João",
  "currentProfile": {
    "id": "standard",
    "name": "Standard",
    "icon": "📋",
    "summary": "1–2 sentence analysis",
    "description": "Balanced analysis with key factors..."
  },
  "availableProfiles": [ /* array igual ao GET /ai/profiles */ ]
}
```

---

### `PATCH /api/ai/config` _(admin)_
Atualiza perfil de IA da fazenda.

**Body:**
```json
{ "aiProfile": "expert" }
```

> Valores aceitos: `"essential" | "brief" | "standard" | "expert"`

---

### `GET /api/ai/consumption-report`
Relatório de consumo de tokens e custos estimados.

**Response 200 (resumo):**
```json
{
  "farm": { "id": "uuid", "name": "Fazenda São João", "currentProfile": "standard" },
  "summary": {
    "totalAnalyses": 340,
    "totalTokensConsumed": 44200,
    "actualAccumulatedCost": { "usd": 0.024, "brl": 0.14 },
    "savingsVsExpertTotal": { "usd": 0.034, "brl": 0.19, "percentage": 58.6 }
  },
  "byProfile": [
    {
      "profileId": "standard",
      "profileName": "Standard",
      "icon": "📋",
      "totalAnalyses": 320,
      "usagePercentage": 94.1,
      "tokens": {
        "averageActualPerAnalysis": 128,
        "estimatedPerAnalysis": 130,
        "totalConsumed": 40960
      },
      "cost": { "totalUsd": 0.023, "totalBrl": 0.13, "estimatedPer1000AnalysesBrl": 0.32 },
      "estimatedLatency": "1–2 seconds"
    }
  ],
  "costProjections": [
    {
      "profileId": "standard",
      "profileName": "Standard",
      "for100AnalysesBrl": 0.03,
      "for1000AnalysesBrl": 0.32,
      "for10000AnalysesBrl": 3.19
    }
  ]
}
```

---

### `GET /api/ai/history/farm`
Histórico paginado de predições da fazenda.

**Query:** `page`, `limit`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "analysisType": "pregnancy",
      "pregnancyProbability": 74,
      "riskLevel": "low",
      "aiInsight": "...",
      "createdAt": "2024-06-01T10:30:00.000Z",
      "animal": { "id": "uuid", "name": "Mimosa", "identifier": "BOV-001", "species": "cattle", "breed": "Nelore" },
      "breeder": { "id": "uuid", "name": "Imperador", "breed": "Nelore", "fertilityScore": 87 }
    }
  ],
  "total": 340,
  "page": 1,
  "limit": 20,
  "totalPages": 17
}
```

---

### `GET /api/ai/history/animal/:animalId`
Histórico de predições de um animal específico. (sem paginação)

---

## Health Check

### `GET /api/health`
Verifica se o serviço e o banco estão operacionais. Não requer autenticação.

**Response 200:**
```json
{ "status": "ok", "info": { "database": { "status": "up" } } }
```

---

## Convenções gerais

| Conceito | Detalhe |
|----------|---------|
| **Header obrigatório** | `X-Farm-ID: <farmId>` em todas as rotas com guard de farm |
| **Autenticação** | `Authorization: Bearer <jwt>` |
| **Datas** | ISO 8601 — `"2024-06-01"` ou `"2024-06-01T10:30:00.000Z"` |
| **Paginação** | Todas as listas retornam `{ data, total, page, limit, totalPages }` |
| **Roles** | `"admin"` tem acesso total; `"operator"` não pode deletar nem gerenciar membros |
| **Rate limit IA** | 10 req/min nas rotas de análise; 20 req/min global |
| **Erros** | `400` validação, `401` sem token, `403` sem permissão, `404` não encontrado, `409` conflito |

---

## Enums de referência

```
Species:       cattle | sheep | goat
AnimalSex:     male | female
MemberRole:    admin | operator
AiProfile:     essential | brief | standard | expert
Season:        dry | rainy
Protocol:      FTAI | Ovsynch | FTAI with eCG | Resync | Natural Mating | Controlled Mating
EventType:     artificial_insemination | natural_mating | controlled_mating |
               heat | birth | abortion | pregnancy
Diagnosis:     positive | negative | conception_failure
ReproStatus:   Open | Pregnant | Lactating | Inactive | Culled (valores livres no banco)
```
