# Relatório de Viabilidade Econômica — Módulo de IA
**InsemiAI · Hackathon ExpoAgro Crateús · Edital 01/2026**

---

## Metodologia

Todas as medições foram realizadas em **26/05/2026**, com dados reais da API OpenAI, confirmados pelo relatório de uso exportado diretamente do painel do projeto (`proj_32JtcVTeQE02exrkowCC7LLB`).

**Configuração do teste:**
- **Animal:** Mimosa — Bovino Nelore, 445 kg, ECC 4/5, 2 prenhezes anteriores, sem abortos
- **Reprodutor:** Imperador — Nelore, score de fertilidade 85/100
- **Protocolo:** IATF · Temperatura: 28°C · Estação: chuvosa
- **Modelo de IA:** `gpt-4o-mini-2024-07-18` (OpenAI)

---

## 1. Consumo Real de Tokens por Perfil

Cada perfil foi testado com os mesmos dados de entrada. A tabela abaixo usa **valores medidos**, não estimados.

| # | Perfil | Como funciona | Tokens Entrada | Tokens Saída | **Total Real** |
|---|---|---|:---:|:---:|:---:|
| 1 | ⚡ **Essencial** | Sem chamada à IA — resultado gerado localmente | 0 | 0 | **0** |
| 2 | 💬 **Resumido** | 1 frase direta da IA | 40 | 29 | **69** |
| 3 | 📋 **Padrão** | 1-2 frases em linguagem simples | 88 | 67 | **155** |
| 4 | 🔬 **Especialista** | Laudo técnico com 3-4 frases | 331 | 164 | **495** |

**Validação com o relatório OpenAI:**

O CSV exportado registrou **4 requisições, 790 tokens de entrada e 443 de saída** no dia do teste. A reconciliação é exata:

- Requisições `resumido` + `padrao` + `especialista` = 459 entrada / 260 saída
- 4ª requisição: retentativa automática do modo `especialista` (mesmo tokens de entrada: 331; saída ligeiramente distinta: 183)
- **Total:** 459 + 331 = **790** entrada · 260 + 183 = **443** saída ✅

> Conclusão: os valores medidos pelo InsemiAI batem com precisão com a fatura da OpenAI.

---

## 2. Custo Real por Análise

**Precificação GPT-4o-mini:**
- Entrada: US$ 0,150 por 1 milhão de tokens (US$ 0,00000015/token)
- Saída: US$ 0,600 por 1 milhão de tokens (US$ 0,00000060/token)

| Perfil | Tokens | Custo (USD) | **Custo (R$)** |
|---|:---:|---:|---:|
| ⚡ Essencial | 0 | US$ 0,0000000 | **R$ 0,000000** |
| 💬 Resumido | 69 | US$ 0,0000234 | **R$ 0,000133** |
| 📋 Padrão | 155 | US$ 0,0000534 | **R$ 0,000304** |
| 🔬 Especialista | 495 | US$ 0,0001481 | **R$ 0,000844** |

*Câmbio de referência: R$ 5,70/USD.*

**Para contexto:** o custo total das 4 análises do teste foi de **US$ 0,000384 → R$ 0,0022** — menos de um quarto de centavo.

---

## 3. Projeção de Custo Operacional de IA em Escala

| Análises | ⚡ Essencial | 💬 Resumido | 📋 Padrão | 🔬 Especialista |
|---:|:---:|:---:|:---:|:---:|
| 100 | R$ 0,00 | R$ 0,01 | R$ 0,03 | R$ 0,08 |
| 1.000 | R$ 0,00 | R$ 0,13 | R$ 0,30 | R$ 0,84 |
| 10.000 | R$ 0,00 | R$ 1,33 | R$ 3,04 | R$ 8,44 |
| 100.000 | R$ 0,00 | R$ 13,34 | R$ 30,44 | R$ 84,39 |

> **Cenário realista para o semiárido:** uma fazenda com 200 fêmeas realizando 2 ciclos reprodutivos por ano no modo **Padrão** gastaria **R$ 0,12/ano** com IA — menos do que uma mensagem de WhatsApp.

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

| Perfil de IA | 1 inseminação a R$80 paga... | 1 inseminação a R$300 paga... |
|---|:---:|:---:|
| 💬 Resumido (R$ 0,000133) | **601.504 análises** | **2.255.639 análises** |
| 📋 Padrão (R$ 0,000304) | **263.158 análises** | **986.842 análises** |
| 🔬 Especialista (R$ 0,000844) | **94.787 análises** | **355.450 análises** |

### Ponto de equilíbrio mensal (break-even)

Considerando infraestrutura de servidor + banco de dados: **R$ 200/mês**

| Modo | Custo IA (500 análises/mês) | Custo total/mês | Inseminações evitadas para ROI |
|---|:---:|:---:|:---:|
| ⚡ Essencial | R$ 0,00 | R$ 200,00 | **2,5 a R$80** |
| 📋 Padrão | R$ 0,15 | R$ 200,15 | **2,5 a R$80** |
| 🔬 Especialista | R$ 0,42 | R$ 200,42 | **2,5 a R$80** |

> O custo da IA é **desprezível** frente à infraestrutura. O sistema se paga com **menos de 3 inseminações evitadas por mês** — independentemente do perfil escolhido.

---

## 5. Comparativo entre Perfis — Qualidade do Insight

Os textos abaixo foram gerados na mesma análise, com os mesmos dados, em 26/05/2026.

---

**⚡ Essencial** — 0 tokens · R$ 0,00 · resposta instantânea
> *"Probabilidade de prenhez: 95% — risco baixo. Destaque positivo: peso adequado (445 kg). Nenhum alerta identificado nos fatores avaliados. Realizar diagnóstico de gestação entre 28-35 dias pós-inseminação."*

---

**💬 Resumido** — 69 tokens · R$ 0,000133 · < 1 segundo
> *"Bovino Nelore de 445 kg com prenhez de 95% e risco baixo: continue o manejo normal, sem alertas."*

---

**📋 Padrão** — 155 tokens · R$ 0,000304 · ~1 segundo
> *"A vaca Nelore de 445 kg, com duas prenhezes anteriores e sem abortos, apresenta 95% de taxa de prenhez com o protocolo IATF, sob o reprodutor Imperador (score 85/100). O risco de complicações é baixo e não há alertas a serem considerados."*

---

**🔬 Especialista** — 495 tokens · R$ 0,000844 · ~3 segundos
> *"O bovino Nelore avaliado apresenta condição corporal excelente (ECC 4/5) e peso adequado de 445 kg, além de histórico reprodutivo positivo com duas prenhezes anteriores e sem abortos, tornando-o candidato ideal para a inseminação. A probabilidade de prenhez é de 95%, com risco baixo, o que sugere bom prognóstico para a IATF. Recomenda-se garantir hidratação adequada e alimentação balanceada, especialmente durante a estação chuvosa, para maximizar a eficiência reprodutiva, além de monitorar a temperatura ambiente, pois variações climáticas podem impactar o desempenho reprodutivo."*

---

## 6. Vantagem Competitiva — Por que isso é relevante?

| Critério | InsemiAI | Planilha/Papel | Consultoria Veterinária |
|---|:---:|:---:|:---:|
| Custo por análise | **< R$ 0,001** | R$ 0 (sem análise) | R$ 50–200/visita |
| Disponibilidade | **24h/7 dias** | Manual | Agendada |
| Histórico integrado | **Sim** | Não | Não |
| Análise preditiva | **Sim** | Não | Parcial |
| Funciona no campo | **Sim (Essencial)** | Sim | Não |
| Adaptado ao semiárido | **Sim** | Não | Depende |

---

## 7. Fonte dos Dados

| Dado | Fonte |
|---|---|
| Tokens reais medidos | `_meta` retornado pela API InsemiAI, capturado em 26/05/2026 |
| Validação dos tokens | Relatório CSV exportado do painel OpenAI (`completions_usage_2026-05-26_2026-05-26.csv`) |
| Preços GPT-4o-mini | [platform.openai.com/docs/models](https://platform.openai.com/docs/models) — mai/2026 |
| Custo por inseminação | Embrapa Pecuária Sudeste (2021); ASBIA Relatório 2022 |
| Taxa média de prenhez | ASBIA (2022) — 50-60% para bovinos de corte com IATF |
| Câmbio | R$ 5,70/USD — referência mai/2026 |

---

*Documento gerado automaticamente pelo sistema InsemiAI com base nos dados reais de uso da API OpenAI.*
*Hackathon ExpoAgro Crateús — Edital 01/2026 · Prazo: 5 de junho de 2026*
