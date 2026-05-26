# InsemiAI — Backend

Sistema de gestão genética e reprodutiva para bovinos, ovinos e caprinos com análise preditiva de prenhez por Inteligência Artificial.

Desenvolvido para o **Hackathon ExpoAgro Crateús — Edital 01/2026**.

---

## Stack

- **Runtime:** Node.js
- **Framework:** NestJS 10
- **ORM:** Prisma 5
- **Banco de dados:** PostgreSQL
- **Autenticação:** JWT (passport-jwt)
- **IA:** OpenAI GPT-4o-mini
- **Documentação:** Swagger (@nestjs/swagger)
- **Validação:** class-validator + class-transformer

---

## Pré-requisitos

- Node.js 20+
- PostgreSQL rodando na porta `55000` (ou ajustar `.env`)
- Chave de API OpenAI

---

## Instalação

```bash
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://postgres:root@localhost:55000/pecuaria_ia"
JWT_SECRET="pecuaria-ia-jwt-secret-hackathon-2026"
JWT_EXPIRES_IN="7d"
OPENAI_API_KEY="sk-..."
PORT=3001
```

### Banco de dados

```bash
# Gerar o Prisma Client
npm run prisma:generate

# Aplicar as migrations
npm run prisma:migrate

# Popular o banco com dados de exemplo
npm run prisma:seed
```

### Iniciar o servidor

```bash
# Desenvolvimento (hot reload)
npm run start:dev

# Produção
npm run build && npm run start:prod
```

Servidor disponível em: `http://localhost:3001`
Swagger disponível em: `http://localhost:3001/docs`

---

## Estrutura de módulos

```
src/
├── auth/              # Registro e login JWT
├── fazendas/          # CRUD de fazendas
├── animais/           # CRUD de animais (bovinos, ovinos, caprinos)
├── reprodutores/      # CRUD de reprodutores com score de fertilidade
├── reproducao/        # Registro de eventos reprodutivos
├── pesagem/           # Histórico de pesagens
├── ia/                # Análise preditiva de prenhez + recomendação de reprodutor
├── relatorios/        # Relatórios de desempenho
├── dashboard/         # Dados consolidados do dashboard
├── common/            # Guards, decorators, helpers
└── prisma/            # PrismaService
```

---

## Endpoints da API

Todas as rotas (exceto `/api/auth/*`) exigem header `Authorization: Bearer <token>`.

### Auth — `/api/auth`

| Método | Rota        | Descrição               |
|--------|-------------|-------------------------|
| POST   | `/registro` | Cadastrar novo usuário  |
| POST   | `/login`    | Login e obter JWT       |

### Fazendas — `/api/fazendas`

| Método | Rota    | Descrição                        |
|--------|---------|----------------------------------|
| POST   | `/`     | Cadastrar fazenda                |
| GET    | `/`     | Listar fazendas do usuário       |
| GET    | `/:id`  | Buscar fazenda por ID            |
| PUT    | `/:id`  | Atualizar fazenda                |

### Animais — `/api/animais`

| Método | Rota                        | Descrição                              |
|--------|-----------------------------|----------------------------------------|
| POST   | `/`                         | Cadastrar animal                       |
| GET    | `/fazenda/:fazendaId`       | Listar animais da fazenda (paginado, filtros por espécie/sexo/status) |
| GET    | `/:id`                      | Buscar animal por ID com histórico     |
| PUT    | `/:id`                      | Atualizar animal                       |
| DELETE | `/:id`                      | Inativar animal (soft delete)          |

**Campos do animal:** `identificador`, `especie` (bovino|ovino|caprino), `nome`, `raca`, `linhagem`, `sexo`, `dataNascimento`, `statusReproducao`, `scoreCondicaoCorporal` (1–5), `historicoDoencaReprodutiva`, `paiId`, `maeId`, `fazendaId`

### Reprodutores — `/api/reprodutores`

| Método | Rota                   | Descrição                                     |
|--------|------------------------|-----------------------------------------------|
| POST   | `/`                    | Cadastrar reprodutor                          |
| GET    | `/fazenda/:fazendaId`  | Listar reprodutores ativos da fazenda         |
| GET    | `/:id`                 | Buscar reprodutor por ID                      |
| PUT    | `/:id`                 | Atualizar reprodutor                          |
| DELETE | `/:id`                 | Inativar reprodutor                           |

> Reprodutor pode ser vinculado a um `Animal` da fazenda via `animalId` (sêmen externo deixa este campo nulo). O `scoreFertilidade` é calculado automaticamente: estimativa por raça (tabela com 33 raças) blendada progressivamente com dados reais a partir de 10 inseminações.

### Reprodução — `/api/reproducao`

| Método | Rota                              | Descrição                                   |
|--------|-----------------------------------|---------------------------------------------|
| POST   | `/evento`                         | Registrar evento (inseminação, parto, cio, aborto) |
| GET    | `/fazenda/:fazendaId`             | Listar eventos da fazenda (paginado, filtros) |
| GET    | `/animal/:animalId`               | Listar eventos de um animal                 |
| PATCH  | `/evento/:id/diagnostico`         | Atualizar diagnóstico de prenhez            |

**Tipos de evento:** `inseminacao_artificial`, `monta_natural`, `monta_controlada`, `cio`, `parto`, `aborto`, `prenhez`
**Diagnóstico:** `pendente`, `positivo`, `negativo`, `falha_concepcao`

### Pesagem — `/api/pesagem`

| Método | Rota                   | Descrição                    |
|--------|------------------------|------------------------------|
| POST   | `/`                    | Registrar pesagem            |
| GET    | `/animal/:animalId`    | Histórico de pesagens        |
| DELETE | `/:id`                 | Remover pesagem              |

### IA — `/api/ia`

| Método | Rota                                    | Descrição                                          |
|--------|-----------------------------------------|----------------------------------------------------|
| POST   | `/prever-prenhez`                       | Gerar análise preditiva de prenhez com IA          |
| GET    | `/recomendar-reprodutor/:fazendaId/:animalId` | Recomendar reprodutor por compatibilidade genética |
| GET    | `/historico/fazenda/:fazendaId`         | Histórico de predições da fazenda (paginado)       |
| GET    | `/historico/:animalId`                  | Histórico de predições de um animal                |

**Body do POST `/prever-prenhez`:**
```json
{
  "animalId": "uuid",
  "reprodutorId": "uuid",
  "protocolo": "IATF | IATF_eCG | IA_cio | monta_natural",
  "temperaturaAmbiente": 28.5,
  "estacaoAno": "chuvosa | seca"
}
```

**Resposta inclui:**
- `probabilidadePrenhez` (35–95%)
- `scoreFertilidade`
- `nivelRisco` (baixo | moderado | alto)
- `fatoresPositivos`, `alertas`, `recomendacoes`
- `fundamentacao` — array com cada fator, valor observado, pontuação e referência bibliográfica
- `formulaProbabilidade` — transparência do cálculo
- `insightGpt` — análise narrativa gerada pelo GPT-4o-mini

### Relatórios — `/api/relatorios`

| Método | Rota                        | Descrição                                 |
|--------|-----------------------------|-------------------------------------------|
| GET    | `/fazenda/:fazendaId`       | Desempenho geral da fazenda               |
| GET    | `/animal/:animalId`         | Desempenho reprodutivo de um animal       |
| GET    | `/reprodutores/:fazendaId`  | Ranking de reprodutores por fertilidade   |

### Dashboard — `/api/dashboard`

| Método | Rota              | Descrição                                              |
|--------|-------------------|--------------------------------------------------------|
| GET    | `/:fazendaId`     | Cards, gráfico de evolução e distribuição por espécie  |

**Query params opcionais:** `periodo` (7d | 30d | 90d | 365d), `especie` (bovino | ovino | caprino)

---

## Modelo de dados (resumo)

```
Usuario → Fazenda → Animal
                 → Reprodutor (pode vincular a um Animal)
                 → EventoReprodutivo → Predicao
                 → Pesagem
```

Campos automáticos do Animal atualizados a cada evento:
- `historicoPrenhez`, `quantidadeAbortos`, `quantidadePartos`
- `dataUltimoParto` → `diasPosParto` calculado dinamicamente
- `intervaloMedioPartos`

---

## Metodologia da IA

A predição usa um **modelo de pontuação por fatores** (scoring model):

```
Probabilidade (%) = 35 + (pontuação total × 0,6)
```

11 fatores avaliados com pesos baseados em literatura zootécnica (Embrapa, CBRA, ASBIA, Hafez). Documentação completa em [`docs/metodologia-predicao.md`](docs/metodologia-predicao.md).

---

## Dados de seed

Usuário de demonstração:
- **Email:** `demo@pecuaria.ia`
- **Senha:** `123456`

Inclui 1 fazenda, 8 reprodutores (3 espécies), 11 animais com perfis de risco variados (alto, moderado, alto risco), e eventos reprodutivos históricos.

---

## Documentação adicional

- [`docs/metodologia-predicao.md`](docs/metodologia-predicao.md) — metodologia completa da análise preditiva com referências bibliográficas
- [`docs/roteiro-pitch.md`](docs/roteiro-pitch.md) — roteiro do vídeo pitch para o hackathon
- [`docs/roteiro-pitch-insemiai.pdf`](docs/roteiro-pitch-insemiai.pdf) — roteiro em PDF
