# InsemiAI — Backend

Sistema de gestão genética e reprodutiva para bovinos, ovinos e caprinos com predição de prenhez por Inteligência Artificial.

Desenvolvido para o **Hackathon ExpoAgro Crateús — Edital 01/2026**.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20 |
| Framework | NestJS 10 |
| ORM | Prisma 5 |
| Banco de dados | PostgreSQL (Neon serverless em produção) |
| Autenticação | JWT (passport-jwt) |
| IA | OpenAI GPT-4o-mini |
| Documentação | Swagger (`@nestjs/swagger`) |
| Validação | class-validator + class-transformer |
| Deploy | Render |

---

## Pré-requisitos

- Node.js 20+
- PostgreSQL rodando localmente (ou string de conexão Neon)
- Chave de API OpenAI (opcional — sistema funciona sem ela no perfil `essential`)

---

## Instalação

```bash
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/insemiai"
JWT_SECRET="insemiai-jwt-secret-hackathon-2026"
JWT_EXPIRES_IN="7d"
OPENAI_API_KEY="sk-..."          # opcional
PORT=3001
FRONTEND_URL="http://localhost:3000"

# E-mail (opcional — sem essas vars, e-mails são apenas logados no console)
MAIL_HOST="smtp.exemplo.com"
MAIL_PORT="587"
MAIL_SECURE="false"
MAIL_USER="noreply@insemiai.com"
MAIL_PASS="senha"
MAIL_FROM="InseminAI <noreply@insemiai.com>"
```

### Banco de dados

```bash
# Gerar o Prisma Client
npx prisma generate

# Aplicar as migrations
npx prisma migrate deploy

# Popular o banco com dados de demonstração
npx ts-node prisma/seed.ts
```

### Iniciar o servidor

```bash
# Desenvolvimento (hot reload)
npm run start:dev

# Produção
npm run build && npm run start:prod
```

Servidor: `http://localhost:3001`  
Swagger: `http://localhost:3001/docs`

---

## Dados de acesso (demonstração)

Após executar o seed:

| Campo | Valor |
|---|---|
| E-mail | `demo@insemiai.com.br` |
| Senha | `Demo@2026` |
| Fazenda | Fazenda Uruguai — Crateús/CE |

---

## Arquitetura de módulos

```
src/
├── auth/           # Registro, login JWT, recuperação de senha
├── farms/          # CRUD de fazendas + configuração de perfil de IA
├── animals/        # CRUD de animais (bovinos, ovinos, caprinos) + validação de parentesco
├── reproduction/   # Eventos reprodutivos (inseminação, parto, aborto, cio)
├── weighing/       # Histórico de pesagens
├── members/        # Membros da fazenda + sistema de convites por e-mail
├── invitations/    # Aceitação de convites via token
├── ai/             # Predições com IA: prenhez, melhor reprodutor, melhores matrizes
├── dashboard/      # KPIs consolidados: eventos, prenhezes, distribuição por espécie
├── reports/        # Relatórios de desempenho reprodutivo
├── backoffice/     # Criação de administradores (rota protegida por secret)
├── mail/           # Templates de e-mail transacional
├── common/         # Guards, decorators, interceptors, helpers
└── prisma/         # PrismaService
```

### Modelo de dados

```
User ──── FarmMember ──── Farm ──── Animal ──── Weighing
                                         └──── ReproductiveEvent ──── Prediction
                               └──── FarmInvitation
```

---

## Autenticação e multi-fazenda

Todas as rotas (exceto `/api/auth/*` e `/api/invitations/*`) exigem:

```
Authorization: Bearer <jwt_token>
```

Rotas que operam sobre uma fazenda específica também exigem o header:

```
X-Farm-ID: <uuid_da_fazenda>
```

O `X-Farm-ID` é verificado pelo `FarmGuard`, que valida se o usuário é membro ativo da fazenda informada.

---

## Endpoints da API

### Auth — `/api/auth`

| Método | Rota | Descrição |
|---|---|---|
| POST | `/register` | Criar conta de usuário |
| POST | `/login` | Login (retorna JWT) |
| POST | `/forgot-password` | Solicitar redefinição de senha |
| POST | `/reset-password` | Redefinir senha com token |
| PATCH | `/password` | Alterar senha (autenticado) |

### Farms — `/api/farms`

| Método | Rota | Descrição |
|---|---|---|
| POST | `/` | Criar fazenda (criador vira admin) |
| GET | `/` | Listar fazendas do usuário |
| GET | `/current` | Dados da fazenda ativa (X-Farm-ID) |
| PUT | `/` | Atualizar fazenda (admin) |

**Campos editáveis no PUT:** `name`, `city`, `state`, `aiProfile` (`essential`\|`brief`\|`standard`\|`expert`)

### Animals — `/api/animals`

| Método | Rota | Descrição |
|---|---|---|
| POST | `/` | Cadastrar animal |
| GET | `/` | Listar animais (filtros: `species`, `sex`, `breed`, `search`) |
| GET | `/:id` | Detalhe do animal com eventos, pesagens e predições |
| PUT | `/:id` | Atualizar animal |
| DELETE | `/:id` | Desativar animal (soft delete) |

**Espécies:** `cattle` \| `sheep` \| `goat`  
**Sexo:** `male` \| `female`  
**Status reprodutivo:** `Ready` \| `Pregnant` \| `In Reproduction` \| `Culled` \| `Inactive`

O campo `photoUrl` aceita URL ou string base64 (`data:image/jpeg;base64,...`).  
Parentesco (`sireId`, `damId`) tem validação de ciclos (BFS) — nenhum animal pode ser ancestral de si mesmo.

### Reproduction — `/api/reproduction`

| Método | Rota | Descrição |
|---|---|---|
| POST | `/insemination` | Registrar inseminação artificial |
| POST | `/event` | Registrar evento reprodutivo geral |
| GET | `/` | Listar eventos da fazenda (paginado) |
| GET | `/animal/:animalId` | Listar eventos de um animal |
| PATCH | `/event/:id/diagnosis` | Atualizar diagnóstico de prenhez |

**Tipos de evento:** `artificial_insemination` \| `natural_mating` \| `controlled_mating` \| `heat` \| `birth` \| `abortion` \| `pregnancy`  
**Diagnóstico:** `pending` \| `positive` \| `negative` \| `conception_failure`

### Weighing — `/api/weighing`

| Método | Rota | Descrição |
|---|---|---|
| POST | `/` | Registrar pesagem |
| GET | `/animal/:animalId` | Histórico de pesagens do animal |
| DELETE | `/:id` | Remover pesagem |

### Members — `/api/members`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Listar membros da fazenda |
| POST | `/invite` | Convidar membro por e-mail |
| GET | `/invitations` | Listar convites pendentes |
| DELETE | `/invitations/:invitationId` | Cancelar convite |
| PATCH | `/:memberId` | Alterar papel do membro |
| DELETE | `/:memberId` | Remover membro |

### Invitations — `/api/invitations`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/:token` | Consultar convite pelo token |
| POST | `/:token/accept` | Aceitar convite e criar conta |

### AI — `/api/ai`

| Método | Rota | Descrição |
|---|---|---|
| POST | `/predict-pregnancy` | Predição de prenhez (IA + algoritmo) |
| GET | `/recommend-breeder/:animalId` | Recomendar reprodutor para uma fêmea |
| GET | `/best-dam` | Rankear melhores matrizes para inseminação |
| GET | `/profiles` | Listar perfis de IA disponíveis |
| GET | `/config` | Perfil de IA configurado na fazenda |
| PATCH | `/config` | Alterar perfil de IA da fazenda |
| GET | `/consumption-report` | Relatório de consumo de tokens |
| GET | `/history/farm` | Histórico de predições da fazenda |
| GET | `/history/animal/:animalId` | Histórico de predições de um animal |
| DELETE | `/history/:id` | Remover predição do histórico |

**Body do POST `/predict-pregnancy`:**
```json
{
  "animalId": "uuid",
  "sireId": "uuid",
  "protocol": "IATF",
  "ambientTemperature": 28,
  "season": "dry"
}
```

**Query params do GET `/best-dam`:** `species`, `protocol`, `ambientTemperature`, `season`, `limit` (máx. 20)

### Dashboard — `/api/dashboard`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | KPIs: total de eventos, prenhezes, animais, distribuição por espécie |

### Reports — `/api/reports`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/farm` | Desempenho geral da fazenda |
| GET | `/animal/:animalId` | Desempenho reprodutivo do animal |
| GET | `/breeders` | Ranking de reprodutores por fertilidade |

---

## Perfis de IA

O sistema opera em 4 perfis configuráveis por fazenda via `PUT /api/farms`:

| Perfil | Nome | Descrição | Latência estimada |
|---|---|---|---|
| `essential` | Essencial | Apenas cálculo local, sem chamada de IA | < 200 ms |
| `brief` | Rápido | IA gera predição + insight em 1 frase | < 1 segundo |
| `standard` | Padrão | IA gera predição + análise em 2–3 frases | 1–2 segundos |
| `expert` | Expert | IA gera predição + relatório técnico completo | 3–5 segundos |

---

## Como a Inteligência Artificial foi implementada

### Modelo utilizado
**OpenAI GPT-4o-mini** via API (`response_format: json_object`).

### Abordagem híbrida: algoritmo + IA

O sistema usa dois mecanismos complementares:

**1. Algoritmo determinístico (sempre executado)**  
Scoring por 11 fatores zootécnicos com pesos baseados em literatura científica (Embrapa, CBRA, ASBIA, Hafez):

| # | Fator | Peso máx. |
|---|---|---|
| 1 | Histórico de prenhez anterior | 15 pts |
| 2 | Escore de condição corporal (ECC 1–5) | 15 pts |
| 3 | Dias pós-parto | 12 pts |
| 4 | Ausência de abortos | 10 pts |
| 5 | Peso corporal adequado para a raça | 10 pts |
| 6 | Score de fertilidade do reprodutor | 10 pts |
| 7 | Status reprodutivo atual | 8 pts |
| 8 | Ausência de doenças reprodutivas | 8 pts |
| 9 | Taxa média de prenhez da fazenda | 5 pts |
| 10 | Temperatura ambiente | 4 pts |
| 11 | Estação do ano | 3 pts |

Fórmula: `probabilidade (%) = 35 + (pontuação_total × 0,6)`  
Faixa de saída: 35% – 95%.

**2. IA como preditor principal (perfis `brief`, `standard`, `expert`)**  
Quando o perfil de IA da fazenda ativa chamadas à API, o GPT-4o-mini recebe os dados clínicos reais do animal e retorna um JSON estruturado com:
- `pregnancyProbability` — probabilidade recalculada pela IA (35–95%)
- `fertilityScore` — aptidão reprodutiva geral (0–100)
- `riskLevel` — `low` / `moderate` / `high`
- `positiveFactors` — fatores favoráveis específicos do animal
- `alerts` — achados preocupantes
- `recommendations` — ações concretas
- `aiInsight` — análise narrativa técnica (profundidade varia por perfil)

O algoritmo serve como **baseline e fallback**: se a chamada à IA falhar, o resultado determinístico é retornado sem interrupção do serviço.

### Dados de entrada
Espécie, raça, peso atual, ECC, histórico de prenhezes, abortos, dias pós-parto, status reprodutivo, dados do reprodutor, protocolo, temperatura ambiente e estação do ano.

### Precisão estimada
O algoritmo foi calibrado com referências zootécnicas para o semiárido nordestino. A IA complementa com análise contextual, citando valores específicos do animal (não orientações genéricas). Não há conjunto de validação estatística formal — o sistema foi concebido como suporte à decisão veterinária, não como substituto.

---

## Conformidade com a LGPD

O InsemiAI trata dados pessoais de produtores rurais (nome, e-mail) e dados de animais de propriedade privada. As medidas adotadas:

| Princípio LGPD | Implementação |
|---|---|
| **Finalidade** | Dados coletados exclusivamente para gestão reprodutiva da fazenda cadastrada |
| **Acesso mínimo** | Cada usuário acessa apenas as fazendas das quais é membro (`FarmGuard`) |
| **Autenticação** | JWT com expiração de 7 dias; senhas armazenadas com bcrypt (salt 10) |
| **Controle de acesso** | Dois papéis: `admin` (gestão completa) e `operator` (somente leitura/registro) |
| **Exclusão** | Animais e usuários usam soft delete (`deletedAt`) — dados podem ser removidos definitivamente sob solicitação |
| **Transparência** | Swagger público com documentação de todos os endpoints e campos |
| **Dados de IA** | Dados enviados à OpenAI são anonimizados por espécie/raça/métricas clínicas — nenhum dado pessoal identificável é incluído nos prompts |

---

## Documentação adicional

- [`docs/metodologia-predicao.md`](docs/metodologia-predicao.md) — metodologia completa com referências bibliográficas
- Swagger interativo: `/docs` (disponível na URL de produção)
