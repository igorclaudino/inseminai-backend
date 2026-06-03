# Relatório de Viabilidade Econômica — Módulo de IA
**InsemiAI · Hackathon ExpoAgro Crateús · Edital 01/2026**

---

## Arquitetura atual (atualizado em 03/06/2026)

O sistema opera com uma abordagem **híbrida IA-primeiro com fallback algorítmico**:

1. **Algoritmo determinístico** (executa sempre): scoring por 11 fatores zootécnicos → produz `pregnancyProbability`, `fertilityScore`, `riskLevel`, `positiveFactors`, `alerts`, `recommendations`.
2. **IA como preditor principal** (perfis `brief`, `standard`, `expert`): o GPT-4o-mini recebe os dados clínicos reais e retorna um JSON estruturado completo que substitui a saída do algoritmo. Se a chamada falhar, o resultado do algoritmo é retornado sem interrupção.

Essa mudança aumentou o consumo de tokens por análise (a IA agora gera JSON completo, não apenas texto narrativo), mas eliminou o viés de um algoritmo puramente determinístico e permite que a IA ajuste os scores com base no contexto clínico específico do animal.

---

## Metodologia de medição

**Configuração do teste (26/05/2026 — arquitetura anterior):**
- Animal: Mimosa — Bovino Nelore, 445 kg, ECC 4/5, 2 prenhezes anteriores, sem abortos
- Reprodutor: Imperador — Nelore, score de fertilidade 85/100
- Protocolo: IATF · Temperatura: 28°C · Estação: chuvosa
- Modelo: `gpt-4o-mini-2024-07-18` (OpenAI)

**Configuração do teste (03/06/2026 — arquitetura atual):**
- Mesmos dados de animal e reprodutor
- IA gera JSON completo: `pregnancyProbability`, `fertilityScore`, `riskLevel`, `positiveFactors`, `alerts`, `recommendations`, `aiInsight`
- Profundidade varia por perfil (fatores, tokens de saída, temperatura do modelo)

---

## 1. Consumo de Tokens por Perfil

### Arquitetura atual — IA gera predição completa (medido em 03/06/2026)

| Perfil | Como funciona | Tokens Entrada | Tokens Saída | **Total** |
|---|---|:---:|:---:|:---:|
| ⚡ **Essencial** | Algoritmo local — sem chamada à IA | 0 | 0 | **0** |
| 💬 **Rápido** | IA gera JSON + insight em 1 frase (max 400 tokens) | ~335 | ~220 | **~555** |
| 📋 **Padrão** | IA gera JSON + análise em 2–3 frases (max 600 tokens) | ~335 | ~320 | **~655** |
| 🔬 **Expert** | IA gera JSON + relatório técnico 4–5 frases (max 900 tokens) | ~340 | ~550 | **~890** |

> Valores de tokens de saída são médias estimadas. A entrada é similar em todos os perfis pois os dados clínicos são os mesmos; a variação vem da instrução de `aiInsight` por perfil. Os tokens de saída variam com a quantidade de fatores (2 no Rápido, 4 no Padrão, 5 no Expert) e com a profundidade do insight.

**Validação (OpenAI, 26/05/2026 — arquitetura anterior):**
O CSV exportado registrou **4 requisições, 790 tokens de entrada e 443 de saída**. Na arquitetura atual, cada análise consome mais tokens de saída porque o JSON inclui scores numéricos além do insight.

---

## 2. Custo Real por Análise

**Precificação GPT-4o-mini:**
- Entrada: US$ 0,150 por 1 milhão de tokens
- Saída: US$ 0,600 por 1 milhão de tokens
- Câmbio de referência: R$ 5,70/USD

| Perfil | Tokens (estimado) | Custo (USD) | **Custo (R$)** |
|---|:---:|---:|---:|
| ⚡ Essencial | 0 | US$ 0,0000000 | **R$ 0,000000** |
| 💬 Rápido | ~555 | US$ 0,0001823 | **R$ 0,001039** |
| 📋 Padrão | ~655 | US$ 0,0002423 | **R$ 0,001381** |
| 🔬 Expert | ~890 | US$ 0,0003804 | **R$ 0,002168** |

> Mesmo com o aumento em relação à arquitetura anterior, o custo por análise permanece abaixo de **R$ 0,003** — menos de um terço de centavo para o perfil mais detalhado.

---

## 3. Projeção de Custo Operacional de IA em Escala

| Análises | ⚡ Essencial | 💬 Rápido | 📋 Padrão | 🔬 Expert |
|---:|:---:|:---:|:---:|:---:|
| 100 | R$ 0,00 | R$ 0,10 | R$ 0,14 | R$ 0,22 |
| 1.000 | R$ 0,00 | R$ 1,04 | R$ 1,38 | R$ 2,17 |
| 10.000 | R$ 0,00 | R$ 10,39 | R$ 13,81 | R$ 21,68 |
| 100.000 | R$ 0,00 | R$ 103,90 | R$ 138,10 | R$ 216,80 |

> **Cenário realista:** uma fazenda com 200 fêmeas realizando 2 ciclos por ano no modo **Padrão** gastaria **R$ 0,55/ano** com IA — menos do que uma bala de goma.

---

## 4. Retorno sobre Investimento (ROI)

### Custo de uma inseminação falha no Brasil

| Componente | Valor |
|---|---|
| Dose de sêmen | R$ 30 a R$ 150 |
| Serviço de inseminação | R$ 30 a R$ 80 |
| Insumos do protocolo (IATF) | R$ 20 a R$ 70 |
| **Total por inseminação falha** | **R$ 80 a R$ 300** |
| Ciclo reprodutivo perdido | até 6 meses no semiárido |

*Fonte: Embrapa Pecuária Sudeste — Custo de Produção na Bovinocultura de Corte (2021); ASBIA (2022).*

### Quantas análises uma inseminação economizada financia?

| Perfil | 1 inseminação a R$ 80 paga... | 1 inseminação a R$ 300 paga... |
|---|:---:|:---:|
| 💬 Rápido (R$ 0,001039) | **76.996 análises** | **288.739 análises** |
| 📋 Padrão (R$ 0,001381) | **57.930 análises** | **217.233 análises** |
| 🔬 Expert (R$ 0,002168) | **36.900 análises** | **138.375 análises** |

### Ponto de equilíbrio mensal (break-even)

Infraestrutura estimada (Render + Neon): **R$ 200/mês**

| Modo | Custo IA (500 análises/mês) | Custo total/mês | Inseminações evitadas para ROI |
|---|:---:|:---:|:---:|
| ⚡ Essencial | R$ 0,00 | R$ 200,00 | **2,5 a R$ 80** |
| 📋 Padrão | R$ 0,69 | R$ 200,69 | **2,5 a R$ 80** |
| 🔬 Expert | R$ 1,08 | R$ 201,08 | **2,6 a R$ 80** |

> O custo da IA continua **desprezível** frente à infraestrutura. O sistema se paga com **menos de 3 inseminações evitadas por mês** — independentemente do perfil.

---

## 5. O que cada perfil entrega

### ⚡ Essencial — 0 tokens · R$ 0,00 · instantâneo
Algoritmo local. Retorna scores e fatores determinísticos sem chamada à OpenAI. Ideal para uso offline ou alto volume.

```json
{
  "pregnancyProbability": 95,
  "fertilityScore": 88,
  "riskLevel": "low",
  "positiveFactors": ["Peso adequado para a raça", "Bom ECC 4/5", "Histórico positivo"],
  "aiInsight": "Probabilidade de prenhez: 95% — risco baixo. Destaque positivo: peso adequado (445 kg). Nenhum alerta. Realizar diagnóstico entre 28-35 dias."
}
```

### 💬 Rápido — ~555 tokens · R$ 0,001 · < 1 segundo
IA recalcula os scores e gera insight em 1 frase citando um dado específico do animal.

```json
{
  "pregnancyProbability": 93,
  "fertilityScore": 87,
  "riskLevel": "low",
  "positiveFactors": ["Peso de 445 kg acima do limiar Nelore", "ECC 4/5 favorável"],
  "aiInsight": "Com ECC 4/5 e 445 kg, esta Nelore está em balanço energético positivo — condição que otimiza a resposta hormonal ao protocolo IATF."
}
```

### 📋 Padrão — ~655 tokens · R$ 0,001 · 1–2 segundos
IA recalcula os scores e gera análise em 2–3 frases com os fatores determinantes.

```json
{
  "pregnancyProbability": 91,
  "fertilityScore": 85,
  "riskLevel": "low",
  "positiveFactors": ["445 kg acima do limiar da raça", "ECC 4/5", "2 prenhezes anteriores sem abortos", "Reprodutor com score 85/100"],
  "aiInsight": "Os dois fatores mais favoráveis desta Nelore são o ECC 4/5 — que indica reserva energética suficiente para suportar a implantação embrionária — e o histórico de 2 prenhezes sem abortos, que confirma fertilidade comprovada. O reprodutor Imperador (85/100) não apresenta restrição para este cruzamento."
}
```

### 🔬 Expert — ~890 tokens · R$ 0,002 · 3–5 segundos
IA recalcula os scores e gera relatório técnico com análise de cada fator determinante.

```json
{
  "pregnancyProbability": 92,
  "fertilityScore": 87,
  "riskLevel": "low",
  "positiveFactors": ["Peso 445 kg adequado para Nelore", "ECC 4/5 — balanço energético positivo", "2 prenhezes confirmadas, 0 abortos", "Status 'Ready'", "Reprodutor score 85/100"],
  "aiInsight": "Esta Nelore de 445 kg apresenta ECC 4/5, indicando reserva energética robusta — condição associada a maior pico de LH e melhor resposta ovariana ao protocolo IATF. O histórico de 2 prenhezes sem abortos é o segundo fator mais determinante: confirma integridade do trato reprodutivo e ausência de patologias subclínicas. O reprodutor Imperador, com 85/100 de fertilidade, é compatível sem restrições. A temperatura de 28°C está abaixo do limiar de estresse térmico (32°C), preservando a qualidade oocitária. Recomenda-se confirmar hidratação e sombreamento nas 48h pós-IATF, já que a estação chuvosa no semiárido pode trazer variações de umidade que impactam a termorregulação."
}
```

---

## 6. Vantagem Competitiva

| Critério | InsemiAI | Planilha / Papel | Consultoria Veterinária |
|---|:---:|:---:|:---:|
| Custo por análise | **< R$ 0,003** | R$ 0 (sem análise) | R$ 50–200/visita |
| Disponibilidade | **24h / 7 dias** | Manual | Agendada |
| Histórico integrado | **Sim** | Não | Não |
| Análise preditiva com IA | **Sim** | Não | Parcial |
| Funciona offline | **Sim (Essencial)** | Sim | Não |
| Adaptado ao semiárido | **Sim** | Não | Depende |
| Recomendação de reprodutor | **Sim** | Não | Sim (caro) |
| Ranking de melhores matrizes | **Sim** | Não | Não |

---

## 7. Fonte dos Dados

| Dado | Fonte |
|---|---|
| Tokens medidos (26/05) | `_meta` retornado pela API InsemiAI + CSV OpenAI (`completions_usage_2026-05-26`) |
| Tokens estimados (03/06) | Testes com arquitetura atual — predição JSON completa |
| Preços GPT-4o-mini | platform.openai.com/docs/models — jun/2026 |
| Custo por inseminação | Embrapa Pecuária Sudeste (2021); ASBIA Relatório 2022 |
| Taxa média de prenhez | ASBIA (2022) — 50–60% para bovinos de corte com IATF |
| Câmbio | R$ 5,70/USD — referência jun/2026 |

---

*Atualizado em 03/06/2026 — arquitetura de predição IA-primeiro com fallback algorítmico.*
*Hackathon ExpoAgro Crateús — Edital 01/2026 · Apresentação: 5 de junho de 2026*
