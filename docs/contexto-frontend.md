# Contexto — InsemiAI Frontend

Este documento contém todo o contexto necessário para iniciar o desenvolvimento do frontend em uma nova sessão.

---

## O Projeto

**InsemiAI** é um sistema web de gestão genética e reprodutiva para bovinos, ovinos e caprinos com análise preditiva de prenhez por Inteligência Artificial.

Desenvolvido para o **Hackathon ExpoAgro Crateús — Edital 01/2026**.
- Prazo de entrega: **5 de junho de 2026**
- Prêmio 1º lugar: R$ 7.000
- Critérios de avaliação: Impacto (50%), Criatividade e Originalidade (30%), Viabilidade (20%)

---

## Backend — Status atual

O backend está **100% implementado e funcional**.

- **Tecnologia:** NestJS + Prisma + PostgreSQL
- **Porta:** `3001`
- **Banco:** PostgreSQL na porta `55000` (senha: `root`)
- **Swagger:** `http://localhost:3001/docs`
- **Prefixo global:** `/api`

### Credenciais de demo

```
Email: demo@pecuaria.ia
Senha: 123456
```

### Como rodar o backend

```bash
cd backend
npm run start:dev
```

---

## Todos os endpoints disponíveis

### Autenticação

```
POST /api/auth/registro     → Cadastrar usuário
POST /api/auth/login        → Login → retorna { access_token }
```

Todas as demais rotas exigem: `Authorization: Bearer <token>`

---

### Fazendas

```
POST   /api/fazendas              → Criar fazenda
GET    /api/fazendas              → Listar fazendas do usuário
GET    /api/fazendas/:id          → Buscar por ID
PUT    /api/fazendas/:id          → Atualizar
```

---

### Animais

```
POST   /api/animais                          → Cadastrar animal
GET    /api/animais/fazenda/:fazendaId       → Listar (paginado)
GET    /api/animais/:id                      → Buscar por ID (com histórico completo)
PUT    /api/animais/:id                      → Atualizar
DELETE /api/animais/:id                      → Inativar (soft delete)
```

**Filtros disponíveis no GET /fazenda/:id:**
- `especie`: bovino | ovino | caprino
- `sexo`: macho | femea
- `statusReproducao`: Apto | Prenhe | Em Reprodução | Descarte | Inativo
- `page`, `limit`

**Campos relevantes do animal:**
```json
{
  "identificador": "BOV-2024-001",
  "especie": "bovino",
  "nome": "Mimosa",
  "raca": "Nelore",
  "linhagem": "Opcional",
  "sexo": "femea",
  "dataNascimento": "2021-03-15",
  "statusReproducao": "Apto",
  "scoreCondicaoCorporal": 4,
  "historicoDoencaReprodutiva": false,
  "paiId": "uuid-ou-null",
  "maeId": "uuid-ou-null",
  "fazendaId": "uuid"
}
```

---

### Reprodutores

```
POST   /api/reprodutores                        → Cadastrar reprodutor
GET    /api/reprodutores/fazenda/:fazendaId     → Listar ativos
GET    /api/reprodutores/:id                    → Buscar por ID
PUT    /api/reprodutores/:id                    → Atualizar
DELETE /api/reprodutores/:id                    → Inativar
```

> Reprodutor pode ser vinculado a um animal macho da fazenda via `animalId`. Se for sêmen externo, `animalId` fica nulo.

O campo `scoreFertilidade` é calculado automaticamente pelo sistema (0–100).

---

### Reprodução (Inseminações e Eventos)

```
POST   /api/reproducao/evento                        → Registrar evento
GET    /api/reproducao/fazenda/:fazendaId            → Listar eventos da fazenda (paginado)
GET    /api/reproducao/animal/:animalId              → Listar eventos de um animal
PATCH  /api/reproducao/evento/:id/diagnostico        → Atualizar diagnóstico de prenhez
```

**Body do POST /evento:**
```json
{
  "animalId": "uuid",
  "reprodutorId": "uuid-ou-null",
  "tipoEvento": "inseminacao_artificial",
  "inseminador": "Dr. Fernando Lima",
  "semenUtilizado": "Nelore MAX-102",
  "lote": "Lote 05 - Primíparas",
  "protocoloReprodutivo": "IATF",
  "dataEvento": "2026-05-22",
  "observacoes": "Opcional"
}
```

**Tipos de evento:** `inseminacao_artificial` | `monta_natural` | `monta_controlada` | `cio` | `parto` | `aborto` | `prenhez`

**Diagnóstico de prenhez:** `pendente` | `positivo` | `negativo` | `falha_concepcao`

**Resultados possíveis:** `Prenhe` | `Vazia` | `Gêmeos` | `Aborto` | `Natimorto` | `Parto Duplo`

**Filtros do GET /fazenda/:id:**
- `tipoEvento`, `diagnosticoPrenhez`, `reprodutorId`
- `dataInicio`, `dataFim`
- `page`, `limit`

---

### Pesagem

```
POST   /api/pesagem                      → Registrar pesagem
GET    /api/pesagem/animal/:animalId     → Histórico de pesagens
DELETE /api/pesagem/:id                  → Remover pesagem
```

---

### IA — Análise Preditiva

```
POST /api/ia/prever-prenhez
GET  /api/ia/recomendar-reprodutor/:fazendaId/:animalId
GET  /api/ia/historico/fazenda/:fazendaId    → paginado (?page=1&limit=20)
GET  /api/ia/historico/:animalId
```

**Body do POST /prever-prenhez:**
```json
{
  "animalId": "uuid",
  "reprodutorId": "uuid",
  "protocolo": "IATF",
  "temperaturaAmbiente": 28.5,
  "estacaoAno": "chuvosa"
}
```

**Protocolos aceitos:** `IATF` | `IATF_eCG` | `IA_cio` | `monta_natural`
**Estação do ano:** `chuvosa` | `seca`

**Resposta do POST /prever-prenhez:**
```json
{
  "probabilidadePrenhez": 81,
  "scoreFertilidade": 83,
  "nivelRisco": "baixo",
  "compatibilidadeGenetica": 88,
  "fatoresPositivos": ["ECC adequado (4/5)", "Reprodutor com alto score (83)"],
  "alertas": ["Temperatura elevada pode reduzir taxa de concepção"],
  "recomendacoes": ["Manter protocolo IATF conforme planejado"],
  "insightGpt": "Texto narrativo gerado pela IA...",
  "protocolo": "IATF",
  "fundamentacao": [
    {
      "fator": "Peso corporal",
      "valorObservado": "420 kg",
      "pontuacao": 25,
      "referencia": "Embrapa Pecuária Sudeste, 2021"
    }
  ],
  "formulaProbabilidade": "Probabilidade = 35% (base) + 76 pontos × 0,6 = 81%"
}
```

---

### Dashboard

```
GET /api/dashboard/:fazendaId?periodo=30d&especie=bovino
```

**Períodos:** `7d` | `30d` | `90d` | `365d`
**Espécie:** `bovino` | `ovino` | `caprino` (omitir para todos)

**Resposta:**
```json
{
  "cards": {
    "totalAnimais": 300,
    "gravidezesAtivas": 20,
    "inseminacoesComSucesso": 20,
    "inseminacoesSemSucesso": 7,
    "variacaoTotalAnimais": 73,
    "variacaoGravidezes": 0,
    "variacaoSucesso": 30,
    "variacaoFalha": 5
  },
  "evolucaoMensal": [...],
  "distribuicaoPorEspecie": [...]
}
```

---

### Relatórios

```
GET /api/relatorios/fazenda/:fazendaId      → Desempenho geral + taxa de prenhez por espécie
GET /api/relatorios/animal/:animalId        → Histórico completo + taxa de prenhez do animal
GET /api/relatorios/reprodutores/:fazendaId → Ranking por score de fertilidade
```

---

## Telas já prototipadas no Figma

### 1. Dashboard
- Sidebar: Dashboard, Reprodução, Animais
- Filtros no topo: Tipo de Animal (dropdown), Período (dropdown), botão Atualizar
- 4 cards: Total de Animais, Gravidezes Ativas, Inseminações com Sucesso, Inseminações sem Sucesso (cada card com valor, variação percentual e comparativo com período anterior)
- Tabela "Análises" com colunas: Data, Nome, Tipo (Chance de Prenhez | Melhor Matriz | Melhor Reprodutor), Detalhes (ícone olho), Excluir (ícone lixeira)
- Botões no canto superior direito: "Baixar Relatório" e "Nova Análise ▾"
- Botão "Abra um Chamado" na sidebar

### 2. Reprodução
- Cabeçalho com título "Reprodução" e botão "+ Nova Inseminação"
- Filtros: Busca (texto livre), Tipo de Animal, Diagnóstico de Prenhez, Resultado, Início/Fim (date pickers), botão "Limpar Campos"
- Tabela "Inseminações" com colunas: Data, Inseminador, Sêmen Utilizado, Lote, Reprodutor (link), Protocolo, Diagnóstico de Prenhez, Resultado
- Badges de resultado coloridos: "Em Andamento" (amarelo), "Natimorto" (vermelho escuro), "Parto Duplo" (verde), "Falha na Concepção" (vermelho)
- Modal "Nova Inseminação": Data*, Inseminador*, Sêmen Utilizado*, Lote (dropdown), Protocolo (dropdown IATF etc.), botões Cancelar/Cadastrar
- Estado de carregamento: spinner com texto "Cadastrando..."

### 3. Animais — Lista
- Tabela com colunas: ID, Nome, Tipo, Sexo, Raça, Idade, Peso Atual, Pai, Mãe
- Filtros por espécie/sexo/status
- Botão "+ Novo Animal"

### 4. Animais — Cadastro (formulário)
- Campos: foto (upload), identificador, nome, espécie, raça, linhagem, sexo, data de nascimento, status reprodutivo, ECC (1–5), histórico de doença reprodutiva (checkbox), pai (busca), mãe (busca)
- Campos de desempenho ponderal: peso ao nascer, ganho pré-desmame, peso ao desmame

### 5. Animal — Detalhe
- Abas: Dados Cadastrais, Pesagens, Histórico Reprodutivo
- Pesagens: tabela com histórico + modal para adicionar nova pesagem com gráfico de evolução de peso
- Histórico Reprodutivo: tabela com eventos reprodutivos do animal

### 6. Predição (modal sobre o Dashboard)
- Formulário: Tipo de Animal, Raça, Nome do Animal (busca), Reprodutor (busca), Temperatura Ambiente (°C), Estação do Ano
- Resultado: gauge circular com percentual (ex: 81%), texto "Análise IA" (insightGpt), lista de Recomendações, botões Resumo / Refazer / Salvar

---

## Identidade visual

- **Nome:** InsemiAI
- **Cor primária:** Verde escuro (`#1a5c1a` ou similar — tom do agronegócio)
- **Sidebar:** Fundo verde escuro com ícones e texto branco
- **Conteúdo:** Fundo branco/cinza claro
- **Badges:** Verde (sucesso), Vermelho (falha), Amarelo (pendente)
- **Fonte:** Sans-serif (Inter ou similar)

---

## Regras de negócio importantes para o frontend

1. **Apenas fêmeas** aparecem nas análises de prenhez. Filtrar `sexo === 'femea'` ao selecionar animal para predição.
2. **Status "Prenhe"** contraindica nova inseminação — mostrar aviso.
3. **`diasPosParto`** é calculado dinamicamente a partir de `dataUltimoParto` — o backend já retorna esse valor calculado.
4. **Score do reprodutor** (0–100): verde ≥ 80, amarelo 60–79, vermelho < 60.
5. **Nível de risco da predição:** baixo = verde, moderado = amarelo, alto = vermelho.
6. **`estacaoAno`** aceita apenas `"chuvosa"` ou `"seca"`.
7. O relatório do dashboard é gerado a partir dos dados já exibidos (botão "Baixar Relatório" no canto superior direito).
8. Reprodutor pode existir sem vínculo a um animal da fazenda (sêmen externo).

---

## Dados de seed disponíveis para testar

Após `npm run prisma:seed`:

| Animal | Espécie | Risco esperado |
|--------|---------|----------------|
| Mimosa (BOV-001) | Bovino | Alto (favorável) |
| Estrela (BOV-002) | Bovino | Moderado |
| Pérola (BOV-003) | Bovino | Alto risco (ECC 2, abortos) |
| Branca (OVI-001) | Ovino | Alto (favorável) |
| Lua (OVI-003) | Ovino | Moderado |
| Nuvem (CAP-001) | Caprino | Alto (favorável) |
| Rosa (CAP-003) | Caprino | Alto risco |

---

## Fluxo de autenticação

1. `POST /api/auth/login` → recebe `{ access_token }`
2. Armazenar token (localStorage ou cookie httpOnly)
3. Enviar em todas as requisições: `Authorization: Bearer <token>`
4. Token expira em 7 dias (`JWT_EXPIRES_IN=7d`)

---

## Observações finais

- O backend já tem CORS habilitado (`app.enableCors()`) — sem restrição de origem em dev.
- Swagger completo em `http://localhost:3001/docs` — usar para explorar todos os exemplos de request/response.
- O `insightGpt` pode demorar 2–4 segundos (chamada OpenAI) — considerar loading state na tela de predição.
- Todos os IDs são UUIDs.
- Datas no formato ISO 8601 (`2026-05-22T00:00:00.000Z`).
