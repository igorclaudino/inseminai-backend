# Contexto — InsemiAI Frontend

Contexto atualizado para integração frontend ↔ backend.

---

## O Projeto

**InsemiAI** é um sistema web de gestão genética e reprodutiva para bovinos, ovinos e caprinos com predição de prenhez por Inteligência Artificial.

Hackathon ExpoAgro Crateús — Edital 01/2026 · Apresentação: **5 de junho de 2026**

---

## Backend — Status atual

- **URL de produção:** deploy no Render (verificar variável de ambiente `VITE_API_URL` ou equivalente)
- **Porta local:** `3001`
- **Swagger:** `http://localhost:3001/docs`
- **Prefixo global:** `/api`

### Credenciais de demo (após seed)

```
Email: demo@insemiai.com.br
Senha: Demo@2026
Fazenda: Fazenda Uruguai — Crateús/CE
```

---

## Autenticação

```
POST /api/auth/register     → criar conta
POST /api/auth/login        → login → retorna { token, user }
POST /api/auth/forgot-password
POST /api/auth/reset-password
PATCH /api/auth/password    → alterar senha (autenticado)
```

**Resposta do login:**
```json
{ "token": "eyJ...", "user": { "id": "uuid", "name": "Luiza", "email": "luiza@..." } }
```

Todas as demais rotas exigem:
```
Authorization: Bearer <token>
X-Farm-ID: <uuid_da_fazenda>   ← obrigatório nas rotas protegidas por FarmGuard
```

O `X-Farm-ID` deve ser enviado após o usuário selecionar/entrar em uma fazenda. Obtê-lo via `GET /api/farms`.

---

## Fazendas

```
POST  /api/farms             → criar fazenda (sem X-Farm-ID)
GET   /api/farms             → listar fazendas do usuário (sem X-Farm-ID)
GET   /api/farms/current     → dados da fazenda ativa (requer X-Farm-ID)
PUT   /api/farms             → atualizar fazenda (admin, requer X-Farm-ID)
```

**PUT body (todos opcionais):**
```json
{ "name": "Fazenda São João", "city": "Crateús", "state": "CE", "aiProfile": "standard" }
```

`aiProfile`: `"essential" | "brief" | "standard" | "expert"`

---

## Animais

> **Reprodutores são animais machos da própria fazenda.** Não há módulo separado. Filtrar `sex=male` para listar reprodutores.

```
POST   /api/animals          → cadastrar animal
GET    /api/animals          → listar (filtros via query)
GET    /api/animals/:id      → detalhe completo (eventos, pesagens, predições)
PUT    /api/animals/:id      → atualizar
DELETE /api/animals/:id      → desativar (admin)
```

**Filtros do GET `/api/animals`:**
```
species=cattle|sheep|goat
sex=male|female
breed=Nelore
search=Mimosa
page=1
limit=20
```

**Body do POST:**
```json
{
  "name": "Mimosa",
  "species": "cattle",
  "breed": "Nelore",
  "sex": "female",
  "birthDate": "2021-03-15",
  "bodyConditionScore": 3,
  "reproductiveDiseaseHistory": false,
  "lineage": "Linhagem A",
  "sireId": "uuid-ou-omitir",
  "damId": "uuid-ou-omitir",
  "initialWeight": 420.5,
  "initialWeighingDate": "2026-05-10",
  "photoUrl": "data:image/jpeg;base64,... ou https://..."
}
```

**Body do DELETE:**
```json
{ "deletionReason": "Motivo da exclusão" }
```

**Campos importantes na resposta do GET `:id`:**
- `currentWeight` — último peso (calculado pelo backend)
- `age` — idade formatada ("2 anos", "5 meses")
- `daysPostpartum` — dias desde o último parto (calculado)
- `reproductiveEvents` — histórico de eventos (inclui eventos onde o macho foi reprodutor)
- `weighings` — histórico de pesagens
- `sire`, `dam` — dados resumidos do pai/mãe

---

## Reprodução

```
POST  /api/reproduction/insemination         → registrar inseminação
POST  /api/reproduction/event                → registrar evento reprodutivo
GET   /api/reproduction                      → listar eventos da fazenda (paginado)
GET   /api/reproduction/animal/:animalId     → eventos de um animal
PATCH /api/reproduction/event/:id/diagnosis  → atualizar diagnóstico
```

**Body do POST `/insemination`:**
```json
{
  "animalId": "uuid",
  "sireId": "uuid-opcional",
  "eventDate": "2026-06-01",
  "inseminator": "Dr. Fernando Lima",
  "semenUsed": "Nelore MAX-102",
  "lot": "Lote Junho 2026",
  "reproductiveProtocol": "IATF",
  "notes": "opcional"
}
```

**Body do POST `/event`:**
```json
{
  "animalId": "uuid",
  "sireId": "uuid-opcional",
  "eventType": "artificial_insemination",
  "eventDate": "2026-06-01",
  "inseminator": "Dr. Fernando Lima",
  "semenUsed": "Nelore MAX-102",
  "lot": "Lote Junho 2026",
  "reproductiveProtocol": "IATF"
}
```

`eventType`: `artificial_insemination | natural_mating | controlled_mating | heat | birth | abortion | pregnancy`

**Body do PATCH `/diagnosis`:**
```json
{
  "pregnancyDiagnosis": "positive",
  "result": "Prenhez confirmada por ultrassom",
  "confirmationDate": "2026-06-30"
}
```

`pregnancyDiagnosis`: `positive | negative | conception_failure`

---

## Pesagem

```
POST   /api/weighing                    → registrar pesagem
GET    /api/weighing/animal/:animalId   → histórico de pesagens
DELETE /api/weighing/:id                → remover (admin)
```

**Body do POST:**
```json
{ "animalId": "uuid", "weightKg": 435.5, "weighingDate": "2026-06-01", "notes": "opcional" }
```

---

## Membros

```
GET    /api/members                              → listar membros
POST   /api/members/invite                       → convidar (admin)
GET    /api/members/invitations                  → convites pendentes
DELETE /api/members/invitations/:invitationId    → cancelar convite (admin)
PATCH  /api/members/:memberId                    → alterar papel (admin)
DELETE /api/members/:memberId                    → remover membro (admin)
```

**Body do POST `/invite`:**
```json
{ "email": "colaborador@fazenda.com", "role": "operator" }
```

---

## Convites (fluxo público)

```
GET  /api/invitations/:token         → consultar convite (sem autenticação)
POST /api/invitations/:token/accept  → aceitar convite (autenticado)
```

---

## IA — Análises Preditivas

```
POST /api/ai/predict-pregnancy            → predição de prenhez
GET  /api/ai/recommend-breeder/:animalId  → reprodutor recomendado para uma fêmea
GET  /api/ai/best-dam                     → ranking de melhores matrizes
GET  /api/ai/profiles                     → listar perfis de IA disponíveis
GET  /api/ai/config                       → perfil de IA da fazenda
PATCH /api/ai/config                      → alterar perfil (admin)
GET  /api/ai/consumption-report           → relatório de tokens e custos
GET  /api/ai/history/farm                 → histórico de predições da fazenda
GET  /api/ai/history/animal/:animalId     → histórico de predições do animal
DELETE /api/ai/history/:id                → remover predição
```

**Body do POST `/predict-pregnancy`:**
```json
{
  "animalId": "uuid",
  "sireId": "uuid-opcional",
  "protocol": "IATF",
  "ambientTemperature": 28,
  "season": "dry"
}
```

**Resposta do POST `/predict-pregnancy`:**
```json
{
  "pregnancyProbability": 81,
  "fertilityScore": 83,
  "riskLevel": "low",
  "geneticCompatibility": 88,
  "positiveFactors": ["Peso adequado", "Bom ECC"],
  "alerts": ["Temperatura elevada"],
  "recommendations": ["Monitorar hidratação"],
  "aiInsight": "Texto técnico gerado pela IA...",
  "_meta": { "aiProfile": "standard", "inputTokens": 335, "outputTokens": 320, "totalTokens": 655 }
}
```

**Query params do GET `/best-dam`:**
```
species=cattle|sheep|goat
protocol=IATF
ambientTemperature=28
season=dry
limit=5   (máx 20)
```

---

## Dashboard

```
GET /api/dashboard
```

**Query params opcionais:** `period` (`last_week|last_month|last_quarter|last_year|all`), `species` (`cattle|sheep|goat`)

**Resposta:**
```json
{
  "cards": {
    "totalAnimals": 120,
    "pregnant": 22,
    "inseminationsSuccess": 18,
    "inseminationsFailure": 7
  },
  "chart": [{ "month": "Jan", "inseminations": 8, "pregnancies": 6 }],
  "speciesDistribution": [{ "species": "cattle", "count": 95 }]
}
```

---

## Relatórios

```
GET /api/reports/farm              → desempenho geral da fazenda
GET /api/reports/animal/:animalId  → desempenho reprodutivo do animal
GET /api/reports/breeders          → ranking de reprodutores por fertilidade
```

---

## Regras de negócio importantes

1. **Reprodutores = animais machos**: usar `GET /api/animals?sex=male&species=<espécie>` para listar reprodutores disponíveis
2. **Apenas fêmeas** podem ser analisadas em predições de prenhez (`sex=female`)
3. **Status `Pregnant`** contraindica nova inseminação — mostrar aviso
4. **`daysPostpartum`** é calculado pelo backend — não calcular no frontend
5. **Score do reprodutor** (`fertilityScore` 0–100): verde ≥ 80, amarelo 60–79, vermelho < 60
6. **Nível de risco**: `low` = verde, `moderate` = amarelo, `high` = vermelho
7. **Foto do animal**: enviar base64 (`data:image/jpeg;base64,...`) no campo `photoUrl` — limite 10MB por request
8. **Parentesco circular**: backend rejeita `sireId`/`damId` que criariam ciclos na genealogia
9. **`mustChangePassword`**: usuários criados por admin ou convidados têm esta flag — redirecionar para troca de senha no primeiro login
10. **`aiProfile` padrão** da fazenda: `standard` — pode ser alterado pelo admin via `PUT /api/farms`

---

## Perfis de IA (para o seletor de configuração)

| id | icon | name | summary | estimatedLatency |
|---|---|---|---|---|
| `essential` | ⚡ | Essencial | Apenas cálculo local, sem custo de IA | < 200 ms |
| `brief` | 💬 | Rápido | Recomendação da IA em uma frase | < 1 segundo |
| `standard` | 📋 | Padrão | Análise em 1–2 frases | 1–2 segundos |
| `expert` | 🔬 | Expert | Relatório técnico completo | 3–5 segundos |

Buscar via `GET /api/ai/profiles` para sempre ter os dados atualizados.

---

## Fluxo de autenticação

1. `POST /api/auth/login` → recebe `{ token, user }`
2. Armazenar `token` (localStorage ou cookie)
3. Enviar em todas as requisições: `Authorization: Bearer <token>`
4. Armazenar `farmId` da fazenda selecionada e enviar: `X-Farm-ID: <farmId>`
5. Token expira em 7 dias

---

## Observações técnicas

- CORS habilitado para `FRONTEND_URL` (configurado no servidor)
- Swagger completo em `/docs`
- Latência da IA: 1–5 segundos dependendo do perfil — usar loading state
- Todos os IDs são UUIDs
- Datas no formato ISO 8601 (`"2026-06-01"` ou `"2026-06-01T12:00:00.000Z"`)
- Paginação: todas as listas retornam `{ data, total, page, limit, totalPages }`
