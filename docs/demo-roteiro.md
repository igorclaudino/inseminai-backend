# InsemiAI — Roteiro de Demo

**Duração máxima:** 10 minutos  
**Credenciais:** demo@insemiai.com.br / Demo@2026  
**Fazenda:** Fazenda Uruguai — Crateús/CE  
**Perfil de IA configurado:** Padrão (`standard`)

---

## Estrutura dos 10 minutos

| Tempo | Bloco | O que fazer |
|---|---|---|
| 0–2 min | Problema e contexto | Slides |
| 2–4 min | A solução | Demonstrar dashboard + lista de animais |
| 4–8 min | Demo ao vivo | 4 cenários de análise |
| 8–10 min | Diferenciais e escala | Slides + encerramento |

---

## Bloco 1 — Dashboard e Animais (2–4 min)

**Login** com `demo@insemiai.com.br` / `Demo@2026`.

**Dashboard:**
- Mostrar os 4 cards: Total de Animais, Gravidezes Ativas, Inseminações com Sucesso, Sem Sucesso
- Mencionar: *"Atualizados automaticamente a cada evento registrado"*

**Lista de Animais:**
- Filtrar por **Espécie: Bovino / Sexo: Fêmea** → mostrar matrizes com genealogia
- Filtrar por **Sexo: Macho** → mostrar os 3 reprodutores bovinos com `fertilityScore`
- Mencionar: *"Reprodutores são os próprios machos da fazenda — sem módulo separado"*
- Trocar para **Espécie: Ovino** e **Espécie: Caprino** rapidamente → mostrar as 3 espécies

---

## Bloco 2 — Demo ao Vivo (4–8 min)

> **Cada cenário mostra a IA citando dados específicos do animal — nunca respostas genéricas.**

---

### Cenário 1 — Bovino Ideal: Mimosa (90s)

**Abrir os detalhes de Mimosa (0020):**
- Mostrar: 461 kg, ECC 4/5, 3 prenhezes, genealogia Bumbá/Moeda, 5 pesagens com tendência de ganho

**Fazer análise ao vivo** → Nova Análise → Chance de Prenhez:

| Campo | Valor |
|---|---|
| Matriz | 0020 — Mimosa |
| Reprodutor | 0005 — Bumbá |
| Protocolo | IATF |
| Temperatura | 26°C |
| Estação | Seca |

**No resultado destacar:**
- Probabilidade ~80–85%, risco **baixo**
- `positiveFactors`: IA cita "461 kg acima do limiar Nelore", "ECC 4/5", "3 partos sem abortos", "Bumbá — 79% taxa real"
- `aiInsight`: texto que cita dados específicos da Mimosa, não genérico
- `_meta.aiProfile`: `standard`, `inputTokens` e `outputTokens`

**Fala sugerida:**
> *"Olha o insight: a IA está citando o peso exato, o ECC e a taxa real do reprodutor. Não é uma resposta genérica — ela analisou este animal específico."*

---

### Cenário 2 — Contraste: Animal de Alto Risco por Espécie (60s)

> Mostrar predições pré-salvas para **não perder tempo com espera de API**. Abrir o histórico de predições da fazenda e navegar pelos resultados.

**Bovino — Estrela (0023):** probabilidade **55%**, risco moderado
- IA aponta: *"pós-parto de 40 dias — involução uterina incompleta"*, *"1 aborto anterior"*

**Ovino — Serena (0031):** probabilidade **44%**, risco **alto**
- IA aponta: *"37 kg — 18% abaixo do mínimo Morada Nova"*, *"ECC 2/5 suprime eixo reprodutivo"*

**Caprino — Rosa (0042):** probabilidade **38%**, risco **alto**
- IA aponta: *"doença reprodutiva + peso 20% abaixo do mínimo"*, recomenda **não inseminar**

**Fala sugerida:**
> *"Aqui está o valor prático: o sistema não só diz a probabilidade — ele explica por qual dado específico o animal está em risco. O veterinário pode agir antes de desperdiçar uma inseminação de R$ 80 a R$ 300."*

---

### Cenário 3 — Análise Multi-Espécie: Uma de Cada (60s)

> Mostrar que o sistema funciona igual para bovinos, ovinos e caprinos.

**Branca (0030) — Ovino Santa Inês** (predição pré-salva):
- 52 kg, ECC 4, 2 prenhezes incluindo gemelar → **79%** baixo risco
- IA cita: *"parto gemelar no 1º ciclo confirma prolificidade"*, *"raça Santa Inês — fotoperíodo pouco sensível reduz impacto da seca"*

**Nuvem (0040) — Caprino Boer** (predição pré-salva):
- 40 kg, ECC 4, 2 partos → **77%** baixo risco
- IA cita: *"King Boer — 80% taxa real em 20 inseminações"*, *"Boer tem alta prolificidade no semiárido"*

**Fala sugerida:**
> *"Bovino, ovino, caprino — o sistema é o mesmo. A IA adapta a análise para cada espécie e raça."*

---

### Cenário 4 — Ciclo Completo: Inseminação → Diagnóstico → Dashboard (90s)

> **Ponto mais impactante da demo — mostrar o sistema em uso real.**

**Passo 1** — Reprodução → Nova Inseminação:

| Campo | Valor |
|---|---|
| Matriz | 0021 — Garoa |
| Reprodutor | 0005 — Bumbá |
| Protocolo | IATF |
| Inseminador | Dr. Fernando Lima |
| Data | Hoje |

→ Garoa aparece na lista com diagnóstico **Pendente**

**Passo 2** — Garoa já tem uma inseminação de 28 dias atrás (com Barão) → clicar em **Atualizar Diagnóstico**:
- Diagnóstico: **Positivo**
- Resultado: *"Prenhez confirmada por ultrassom"*
- Data de confirmação: hoje

**O sistema automaticamente:**
- Muda status da Garoa para **Prenha**
- Cria evento de "Prenhez" no histórico reprodutivo
- Incrementa `pregnanciesAsBreeder` do Barão
- Atualiza o Dashboard (gravidezes ativas +1)

**Abrir Dashboard** → mostrar o card "Gravidezes Ativas" atualizado

**Fala sugerida:**
> *"Um clique — e o sistema atualiza o animal, o reprodutor e o dashboard. Sem planilha, sem lançamento manual adicional."*

---

## Dados disponíveis no seed

### Bovinos

| Id | Nome | Espécie | Status | Peso | ECC | Prenhezes | Prob. pré-salva |
|---|---|---|---|---|---|---|---|
| 0020 | Mimosa | Nelore | Apto | 461 kg | 4/5 | 3 | **84%** baixo |
| 0021 | Garoa | Brahman | Apto | 398 kg | 3/5 | 1 | — (live) |
| 0022 | Arrepiada | Nelore | Prenhe | 452 kg | 4/5 | 3 | — |
| 0023 | Estrela | Girolando | Apto | 388 kg | 3/5 | 1 + 1 aborto | **55%** moderado |
| 0024 | Princesa | Angus | Apto | 332 kg | 2/5 | 1 + 2 abortos | — |
| 0025 | Bela | Sindi | Apto | 382 kg | 3/5 | 1 | — |

### Reprodutores Bovinos

| Id | Nome | Raça | Score | Taxa Real |
|---|---|---|---|---|
| 0005 | Bumbá | Nelore | **88** | 79% (19/24) |
| 0009 | Trovão | Nelore | **82** | 75% (9/12) |
| 0006 | Barão | Brahman | **73** | 67% (10/15) |

### Ovinos

| Id | Nome | Raça | Status | Peso | ECC | Prob. pré-salva |
|---|---|---|---|---|---|---|
| 0030 | Branca | Santa Inês | Apto | 52 kg | 4/5 | **79%** baixo |
| 0031 | Serena | Morada Nova | Apto | 37 kg | 2/5 | **44%** alto |
| 0032 | Luna | Dorper | Apto | 48 kg | 4/5 | — (live) |
| 0033 | Antônia | Santa Inês | Apto | 46 kg | 3/5 | — |

### Reprodutores Ovinos

| Id | Nome | Raça | Score | Taxa Real |
|---|---|---|---|---|
| 0007 | Carneiro 42 | Dorper | **85** | 83% (15/18) |
| 0013 | Faraó | Ile de France | **78** | 70% (7/10) |

### Caprinos

| Id | Nome | Raça | Status | Peso | ECC | Prob. pré-salva |
|---|---|---|---|---|---|---|
| 0040 | Nuvem | Boer | Apto | 40 kg | 4/5 | **77%** baixo |
| 0041 | Flor | Anglonubiana | Apto | 37 kg | 3/5 | — |
| 0042 | Rosa | Canindé | Apto | 28 kg | 2/5 | **38%** alto |
| 0043 | Safira | Anglo-nubiana | Apto | 36 kg | 3/5 | — |

### Reprodutores Caprinos

| Id | Nome | Raça | Score | Taxa Real |
|---|---|---|---|---|
| 0008 | King Boer | Boer | **86** | 80% (16/20) |
| 0014 | Zeus | Boer | **79** | 75% (6/8) |

---

## Eventos com diagnóstico pendente (para mostrar o ciclo)

| Animal | Reprodutor | Protocolo | Dias desde inseminação |
|---|---|---|---|
| Garoa (0021) | Barão (0006) | Ovsynch | **28 dias** ← ideal para demo |
| Serena (0031) | Carneiro 42 (0007) | Ovsynch | 20 dias |
| Flor (0041) | Zeus (0014) | Ressincronização | 25 dias |

---

## Plano B (problemas técnicos)

1. **Sem internet no palco:** rodar localmente — `npm run start:prod` no notebook
2. **IA lenta:** mostrar predições pré-salvas no histórico (já no banco)
3. **Erro de API:** descrever o resultado enquanto mostra a tela do algoritmo local (perfil `essential`)
4. **Tela travada:** ter vídeo gravado da solução funcionando como backup offline
