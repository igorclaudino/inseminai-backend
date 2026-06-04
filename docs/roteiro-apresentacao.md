# InseminAI — Roteiro Completo da Apresentação
**Hackathon ExpoAgro Crateús 2026 · 10 minutos**

---

## BLOCO 1 — Problema e Contexto (0–2 min)

**Fala:**

> "A inseminação artificial é a principal ferramenta para melhorar a genética do rebanho no sertão cearense. Mas ela falha com frequência — e quando falha, o produtor perde de R$ 80 a R$ 300 por tentativa, mais um ciclo reprodutivo inteiro de até 6 meses."

> "A ExpoAgro Crateús reuniu mais de 2.300 animais e gerou R$ 67 milhões em negócios em apenas 6 dias. A pecuária é o motor econômico desta região. E a gestão reprodutiva ainda é feita de caderninho e planilha."

> "O problema não é falta de tecnologia no campo. É falta de uma ferramenta que transforme os dados do rebanho em decisões mais inteligentes — antes de inseminar, não depois."

**Slide sugerido:** dados da ASBIA (50–60% de taxa de prenhez nacional) + custo por inseminação falha.

---

## BLOCO 2 — A Solução (2–4 min)

**Fala:**

> "Apresentamos o InseminAI: um sistema de gestão genética e reprodutiva para bovinos, ovinos e caprinos, com predição de prenhez por Inteligência Artificial."

> "O produtor ou técnico cadastra o rebanho, registra os eventos reprodutivos e — antes de cada inseminação — consulta o sistema: qual a chance real de prenhez deste animal, com este reprodutor, nesta condição, nesta época do ano?"

> "A resposta vem em segundos, citando os dados reais daquele animal específico. Não é uma resposta genérica — é uma análise clínica baseada nos dados do seu rebanho."

**Abrir o sistema no navegador:**

- Login: `demo@inseminai.com.br` / `Demo@2026`
- Mostrar o **Dashboard**: 4 cards com totais, gráfico de evolução mensal, distribuição por espécie
- Falar: *"Cada número aqui é atualizado automaticamente quando o técnico registra um evento — sem lançamento manual duplicado."*
- Navegar para **Animais**: mostrar os 3 filtros de espécie (bovinos, ovinos, caprinos) e a genealogia com pai/mãe vinculados
- Mostrar reprodutores machos com `fertilityScore` calculado automaticamente pelo histórico real de inseminações

---

## BLOCO 3 — Demonstração ao Vivo (4–8 min)

> **Este é o bloco mais importante. Manter o ritmo — não parar para explicar detalhes técnicos.**

---

### Demo 1 — Predição de Alta Probabilidade: Mimosa (90s)

Abrir detalhes de **Mimosa (0020 — Nelore)**:
- 461 kg, ECC 4/5, 3 prenhezes anteriores, sem abortos, genealogia Bumbá/Moeda

Fazer análise ao vivo → **Nova Análise → Chance de Prenhez**:
- Matriz: Mimosa · Reprodutor: Bumbá (score 88) · IATF · 26°C · Seca

**No resultado:**
- Destacar a probabilidade (~84%) e o risco **baixo**
- Ler um trecho do `aiInsight` em voz alta: a IA cita o peso exato, o ECC e a taxa real do Bumbá

> *"Olha o que a IA escreveu: ela está citando 461 kg, ECC 4/5, e que o Bumbá tem 79% de taxa real em 24 inseminações. Não é uma resposta que serviria para qualquer animal — é uma análise específica desta vaca, desta fazenda."*

---

### Demo 2 — Contraste de Risco por Espécie (60s)

Abrir o **Histórico de Análises** da fazenda (predições pré-salvas):

| Animal | Espécie | Resultado | Por que |
|---|---|---|---|
| **Estrela (0023)** | Bovino Girolando | **55% — risco moderado** | Pós-parto 40 dias + 1 aborto |
| **Serena (0031)** | Ovino Morada Nova | **44% — risco alto** | 37 kg (18% abaixo do mínimo) + ECC 2/5 |
| **Rosa (0042)** | Caprino Canindé | **38% — risco alto** | Doença reprodutiva + peso 20% abaixo |

> *"A Rosa, aqui, recebeu a recomendação de não inseminar neste ciclo. O sistema identificou doença reprodutiva ativa e peso 20% abaixo do mínimo para caprinos. Uma inseminação aqui seria dinheiro jogado fora — e ainda agravaria a condição do animal."*

> *"Bovino, ovino, caprino — a análise funciona igual para as 3 espécies. O InseminAI é a única ferramenta no mercado que cobre as 3 na mesma plataforma, com IA adaptada para cada raça e para o clima do semiárido."*

---

### Demo 3 — Ciclo Completo: Inseminação → Diagnóstico → Dashboard (90s)

**Registrar nova inseminação** → Reprodução → Nova Inseminação:
- Matriz: Garoa (0021) · Reprodutor: Bumbá · IATF · hoje

Garoa aparece na lista com diagnóstico **Pendente**.

**Garoa já tem uma inseminação de 28 dias atrás** (Barão — status Pendente) → Atualizar Diagnóstico:
- Diagnóstico: **Positivo** · "Prenhez confirmada por ultrassom"

O sistema automaticamente:
- Muda Garoa para **Prenha**
- Cria evento de Prenhez no histórico
- Incrementa o score do reprodutor Barão

Abrir **Dashboard** → mostrar o card de Gravidezes Ativas atualizado.

> *"Um clique. O sistema atualiza o animal, atualiza o reprodutor, atualiza o dashboard. O técnico registra uma vez — e todos os dados do rebanho se mantêm consistentes automaticamente."*

---

## BLOCO 4 — Diferenciais e Próximos Passos (8–10 min)

### Diferencial 1 — Perfis de IA: viabilidade econômica real

> *"Uma das decisões mais importantes que tomamos foi criar 4 perfis de IA. Não é só uma questão de funcionalidade — é o que torna o negócio sustentável."*

| Perfil | Custo por análise | Quando usar |
|---|---|---|
| ⚡ Essencial | R$ 0,00 | Campo sem internet, alto volume |
| 💬 Rápido | ~R$ 0,001 | Operação diária, resposta rápida |
| 📋 Padrão | ~R$ 0,001 | Análise completa — uso normal |
| 🔬 Expert | ~R$ 0,002 | Casos críticos, decisões importantes |

> *"Uma fazenda com 200 fêmeas, fazendo 2 ciclos por ano no perfil Padrão, gasta menos de R$ 1,00 por ano com IA. O sistema se paga com menos de 3 inseminações evitadas por mês — independente do perfil escolhido."*

> *"E o produtor que não tem budget ou não tem internet usa o perfil Essencial: cálculo local, resposta em menos de 200ms, zero custo de API. O sistema nunca depende da internet para funcionar."*

---

### Diferencial 2 — Arquitetura aberta para múltiplos modelos de IA

> *"O InseminAI foi construído para não ficar preso a nenhum fornecedor de IA."*

Hoje usamos o **GPT-4o-mini da OpenAI** — o modelo mais custo-eficiente do mercado para este caso de uso. Mas a arquitetura foi desenhada para trocar ou adicionar provedores com mudança mínima de código:

- O módulo `AiInsightsService` centraliza todas as chamadas de IA em um único lugar
- Adicionar **Claude (Anthropic)**, **Gemini (Google)** ou **LLaMA via Ollama** (modelo local, zero custo) é uma questão de adicionar um novo cliente e uma nova rota de configuração
- O campo `aiProfile` na fazenda já prevê essa extensão: novos perfis podem mapear para provedores diferentes

> *"Isso protege o negócio. Se o OpenAI mudar os preços, ou se surgir um modelo mais preciso para zootecnia — migramos sem reescrever o sistema."*

---

### Diferencial 3 — Funciona offline e no campo

> *"O produtor rural do sertão não tem 4G o tempo todo. Com o perfil Essencial, o sistema roda localmente — sem chamar nenhuma API externa. O técnico no campo registra a inseminação, consulta a probabilidade, e o sistema funciona. Quando voltar à internet, sincroniza."*

---

### Diferencial 4 — Multi-fazenda, multi-usuário, multi-espécie

> *"Uma conta pode gerenciar múltiplas fazendas. Dentro de cada fazenda, o admin convida técnicos por e-mail — eles viram operadores, com acesso controlado. Cada fazenda tem seus dados isolados, seus próprios animais, seu próprio histórico."*

> *"E as 3 espécies — bovinos, ovinos e caprinos — na mesma plataforma. A pecuária do sertão cearense não é só boi. Metade do rebanho é ovino e caprino. O InseminAI é o único sistema que atende as 3 espécies com IA adaptada para cada uma."*

---

### Diferencial 5 — Score de fertilidade automático e genealogia completa

> *"O score de fertilidade de cada reprodutor é calculado automaticamente: começa com uma estimativa por raça e vai sendo calibrado com os dados reais de cada inseminação registrada. Quanto mais o técnico usa o sistema, mais preciso o score fica."*

> *"E o pedigree do rebanho é construído automaticamente: cada animal tem pai e mãe vinculados, e o sistema valida que não é possível criar ciclos na genealogia — um pai não pode ser filho do próprio filho."*

---

### Próximos passos

> *"O que construímos em 10 dias é um MVP funcional com IA real, multi-espécie, multi-fazenda, pronto para produção. Para escalar:"*

1. **App mobile nativo** — o campo pede uma interface mais simples no celular
2. **Integração com balanças digitais** — pesagem automática via Bluetooth ou RFID
3. **Modelo fine-tuned** — treinar um modelo específico para raças do semiárido nordestino com dados reais
4. **Relatórios para financiamento rural** — exportar histórico reprodutivo no formato exigido por bancos e cooperativas

---

> *"O sertão cearense tem um dos maiores rebanhos do Nordeste e uma das maiores feiras agropecuárias do Ceará. O InseminAI é a ferramenta que faltava para transformar dados de rebanho em decisões inteligentes — acessível, barata, e feita para o produtor rural daqui."*

---

## Resumo dos pontos-chave para memorizar

| Ponto | Argumento em 1 frase |
|---|---|
| Problema | Inseminação falha custa R$ 80–300 + 6 meses de ciclo perdido |
| Solução | IA prevê a chance de prenhez com dados reais daquele animal específico |
| Custo da IA | < R$ 0,002 por análise — se paga com 3 inseminações evitadas/mês |
| Offline | Perfil Essencial funciona sem internet, resposta em < 200ms |
| Multi-provedor | Arquitetura permite trocar OpenAI por Claude, Gemini ou modelo local |
| Multi-espécie | Bovinos, ovinos e caprinos — única plataforma para os 3 |
| Score automático | Fertilidade do reprodutor calibrada com dados reais de cada fazenda |

---

## Plano B (problemas técnicos no palco)

| Problema | Solução |
|---|---|
| Sem internet | Rodar localmente — notebook com `npm run start:prod` |
| IA lenta | Mostrar predições pré-salvas no histórico (já no banco) |
| Erro de API OpenAI | Mudar perfil para `essential` — mostra resultado instantâneo do algoritmo |
| Sistema travado | Vídeo gravado da demo como backup |
| Tudo falha | Slides com prints das telas e narração dos resultados |
