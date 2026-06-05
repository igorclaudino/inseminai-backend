# InseminAI — Roteiro da Apresentação
**Hackathon ExpoAgro Crateús 2026 · 10 minutos · 12 slides**

---

## Slide 1 — Capa

> *"Apresentamos o InseminAI — Sistema de Monitoramento de Inseminação Artificial Pecuarista."*

---

## Slide 2 — O Problema (0–2 min)

**Fala:**

> *"A inseminação artificial é a principal ferramenta para melhorar a genética do rebanho no sertão cearense. Mas ela é cara e falha com frequência — e quando falha, o produtor perde dinheiro, perde tempo e perde um ciclo reprodutivo inteiro de até 6 meses."*

> *"A taxa média de prenhez por inseminação artificial no Brasil é de 50 a 60%. Isso significa que quase metade das tentativas falha. A cada falha, o custo direto vai de R$ 80 a R$ 300 — fora o ciclo reprodutivo perdido."*

> *"O problema não é falta de tecnologia. É falta de uma ferramenta que transforme os dados do rebanho em decisões mais inteligentes — antes de inseminar, não depois."*

**No slide:** dados da ASBIA, custo por inseminação e ciclo perdido com as fontes no rodapé.

---

## Slide 3 — A Solução (2–4 min)

**Fala:**

> *"O InseminAI centraliza o cadastro do rebanho, registra cada evento reprodutivo e — antes de cada inseminação — usa Inteligência Artificial para calcular a chance de prenhez daquele animal específico."*

> *"O sistema avalia 11 fatores clínicos: peso, escore de condição corporal, dias pós-parto, histórico de prenhezes e abortos, doenças reprodutivas, status do animal, dados do reprodutor, protocolo utilizado, temperatura ambiente e estação do ano. Esses são exatamente os dados enviados ao modelo de IA."*

> *"Funciona para bovinos, ovinos e caprinos na mesma plataforma."*

**Abrir o sistema:**
- Login: `demo@inseminai.com.br` / `Demo@2026`
- Mostrar o **Dashboard**: 4 cards + gráfico de evolução mensal
- *"Cada número atualiza automaticamente quando o técnico registra um evento."*
- Navegar para **Animais** → mostrar as 3 espécies, genealogia com pai/mãe vinculados

---

## Slide 4 — Demonstração ao vivo (transição)

> *"Agora vou mostrar o sistema funcionando."*

---

## Slide 5 — O que a IA entrega (usar durante a análise ao vivo)

> *"Antes de fazer a análise, quero mostrar o que vamos ver no resultado."*

> *"O que importa não é o número percentual em si — é o raciocínio da IA. Ela vai citar o peso exato do animal, o ECC, o pós-parto, e a taxa real do reprodutor com base nas inseminações registradas nesta fazenda. Não é uma resposta genérica — é uma análise clínica deste animal."*

---

## Bloco de Demo ao Vivo (slides 4–5, 4–8 min)

> **Bloco mais importante. Manter o ritmo.**

---

### Demo 1 — Predição de Alta Probabilidade: Mimosa (90s)

Abrir detalhes de **Mimosa (0020 — Nelore)**:
- 461 kg · ECC 4/5 · 3 prenhezes sem abortos · genealogia Bumbá/Moeda · 5 pesagens com tendência de ganho

**Nova Análise → Chance de Prenhez:**

| Campo | Valor |
|---|---|
| Matriz | 0020 — Mimosa |
| Reprodutor | 0005 — Bumbá |
| Protocolo | IATF |
| Temperatura | 26°C |
| Estação | Seca |

**No resultado:**
- Mencionar a probabilidade e o risco **baixo** — o número exato varia a cada chamada, não citar antes de aparecer
- Ler um trecho do `aiInsight` em voz alta

> *"Olha o que a IA escreveu. Ela está citando o peso exato da Mimosa, o ECC dela, e a taxa real do Bumbá — 6 prenhezes confirmadas em 7 inseminações registradas aqui nesta fazenda. Não é uma resposta que serviria para qualquer animal. É uma análise deste animal, deste reprodutor, desta fazenda."*

---

### Demo 2 — Contraste de Risco por Espécie (60s)

Abrir o **Histórico de Análises** (predições pré-salvas — não esperar pela IA):

| Animal | Espécie | Resultado | Por que |
|---|---|---|---|
| **Estrela (0023)** | Bovino Girolando | **52% — moderado** | Pós-parto 55 dias + falha recente |
| **Serena (0031)** | Ovino Morada Nova | **44% — alto** | 37 kg, 18% abaixo do mínimo + ECC 2/5 |
| **Rosa (0042)** | Caprino Canindé | **38% — alto** | Doença reprodutiva + peso 20% abaixo |

> *"A Rosa recebeu a recomendação de não inseminar neste ciclo. O sistema identificou doença reprodutiva ativa e peso 20% abaixo do mínimo. Uma inseminação aqui seria dinheiro jogado fora — e ainda agravaria a condição do animal."*

> *"Bovino, ovino, caprino — a mesma análise, adaptada para cada espécie e raça."*

---

### Demo 2.5 — Mobile: o técnico no campo (30s)

**Pegar o celular** e abrir o sistema no browser mobile:
- Mostrar a **predição da Nuvem (0040 — Caprino Boer)** pré-salva: **77%, risco baixo**
- Rolar para mostrar o `aiInsight` na tela do celular

> *"O mesmo sistema, no celular do técnico no campo. Ele consulta antes de inseminar, sem precisar voltar ao escritório."*

---

### Demo 3 — Ciclo Completo: Inseminação → Diagnóstico → Dashboard (90s)

**Registrar nova inseminação** → Reprodução → Nova Inseminação:
- Matriz: Garoa (0021) · Reprodutor: Bumbá · IATF · hoje

Garoa aparece na lista com diagnóstico **Pendente**.

**Garoa já tem inseminação de 28 dias atrás** (Barão — Pendente) → Atualizar Diagnóstico:
- Diagnóstico: **Positivo** · "Prenhez confirmada por ultrassom"

O sistema automaticamente:
- Muda Garoa para **Prenha**
- Cria evento de Prenhez no histórico reprodutivo
- Atualiza histórico do reprodutor Barão

Abrir **Dashboard** → mostrar Gravidezes Ativas atualizado.

> *"Um clique. O sistema atualiza o animal, o reprodutor e o dashboard. O técnico registra uma vez — tudo se mantém consistente automaticamente."*

---

## Slide 6 — Diferencial 1: Perfis de IA (8–10 min)

> *"Uma das decisões mais importantes que tomamos foi criar 4 perfis de IA — e isso não é só funcionalidade, é o que torna o negócio sustentável."*

| Perfil | Por análise | 1.000 análises |
|---|---|---|
| ⚡ Essencial | R$ 0,00 | R$ 0,00 |
| 💬 Rápido | ~R$ 0,001 | ~R$ 1,04 |
| 📋 Padrão | ~R$ 0,001 | ~R$ 1,38 |
| 🔬 Expert | ~R$ 0,002 | ~R$ 2,17 |

> *"200 fêmeas, 2 ciclos por ano, perfil Padrão: menos de R$ 1,00 por ano com IA. O sistema se paga com menos de 3 inseminações evitadas por mês."*

> *"O perfil Essencial faz o cálculo localmente, sem chamar nenhuma API externa, em menos de 200ms — zero custo."*

---

## Slide 7 — Diferencial 2: Arquitetura

> *"O InseminAI foi construído para não ficar preso a nenhum fornecedor de IA."*

> *"Hoje usamos o GPT-4o-mini da OpenAI — o modelo mais custo-eficiente para este caso de uso. Mas o módulo de IA foi desenhado para que trocar de provedor seja uma mudança mínima de código. Claude da Anthropic, Gemini do Google, ou até um modelo local rodando na fazenda sem internet — a arquitetura já prevê isso."*

> *"Isso protege o negócio. Se o OpenAI mudar os preços, ou se surgir um modelo mais preciso para zootecnia — migramos sem reescrever o sistema."*

---

## Slide 8 — Diferencial 3: Multi-espécie e Multi-fazenda

> *"Uma conta, múltiplas fazendas. Dentro de cada fazenda, o admin convida técnicos por e-mail — cada um com o papel adequado: admin ou operador. Os dados de cada fazenda ficam completamente isolados."*

> *"E as 3 espécies na mesma plataforma. A pecuária do sertão cearense não é só boi — ovinos e caprinos têm peso significativo na economia regional. O InseminAI atende as 3 com análise adaptada para cada raça."*

---

## Slide 9 — Diferencial 4: Inteligência que cresce

> *"Cada inseminação registrada alimenta o histórico do reprodutor. O sistema calcula a taxa real de sucesso com dados desta fazenda — não médias genéricas de mercado. Quanto mais o técnico usa, mais precisa fica a recomendação da IA."*

> *"No relatório de reprodutores, o admin vê quem está performando bem e quem está abaixo do esperado — com base no histórico real."*

> *"O pedigree do rebanho é construído automaticamente, e o sistema impede que se crie uma genealogia inválida — um pai não pode ser descendente do próprio filho."*

---

## Slide 10 — O que construímos

> *"Em 10 dias construímos um sistema funcional e em produção. IA real, 3 espécies, multi-fazenda, multi-usuário — rodando hoje."*

> *"Backend no Render, banco de dados Neon PostgreSQL, frontend no Vercel. Menos de R$ 0,002 por análise de prenhez com IA. Se paga com 3 inseminações evitadas por mês."*

---

## Slide 11 — Para escalar

> *"Para levar o InseminAI a todo o sertão cearense, os próximos passos são:"*

1. **App mobile nativo** — interface para uso no pasto
2. **Integração com balanças digitais** — pesagem automática via Bluetooth ou RFID
3. **Modelo fine-tuned** — IA treinada com dados reais das raças atendidas
4. **Relatórios para financiamento rural** — exportar histórico no formato de bancos e cooperativas

---

## Slide 12 — Encerramento

> *"Mais dados. Melhores decisões. Mais prenhezes bem-sucedidas."*

> *"O sertão cearense tem um dos maiores rebanhos do Nordeste. O InseminAI é a ferramenta que faltava."*

---

## Resumo dos pontos-chave

| Ponto | Argumento em 1 frase |
|---|---|
| Problema | Inseminação falha custa R$ 80–300 + até 6 meses de ciclo perdido |
| Solução | IA analisa 11 fatores clínicos e entrega predição específica daquele animal |
| Custo da IA | < R$ 0,002 por análise — se paga com 3 inseminações evitadas/mês |
| Perfil Essencial | Cálculo local, zero custo, < 200ms de resposta |
| Multi-provedor | Trocar OpenAI por Claude, Gemini ou modelo local é mudança mínima de código |
| Multi-espécie | Bovinos, ovinos e caprinos — única plataforma para os 3 |
| Histórico real | Taxa do reprodutor calculada com dados reais desta fazenda |

---

## Plano B (problemas técnicos)

| Problema | Solução |
|---|---|
| Sem internet | Rodar localmente — `npm run start:prod` no notebook |
| IA lenta | Mostrar predições pré-salvas no histórico |
| Erro de API OpenAI | Mudar perfil para `essential` — resultado instantâneo do algoritmo |
| Sistema travado | Vídeo gravado da solução como backup |
| Tudo falha | Slides + narração dos resultados |
