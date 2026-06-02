# InsemiAI — Roteiro de Demo

**Duração estimada:** 12–15 minutos  
**Credenciais:** luiza@fazendauruguai.com.br / Demo@2026  
**Fazenda:** Fazenda Uruguai — Crateús/CE

---

## Passo 1 — Login e Dashboard (2 min)

1. Acesse a aplicação e faça login com as credenciais acima
2. Na tela de **Dashboard**:
   - Mostrar os 4 cards: **Total de Animais**, **Gravidezes Ativas** (Arrepiada está prenhe), **Inseminações com Sucesso**, **Inseminações sem Sucesso**
   - Mostrar o gráfico de inseminações por mês
   - Mencionar o filtro de **Espécie** e **Período**

---

## Passo 2 — Lista de Animais (2 min)

1. Navegar para **Animais**
2. Mostrar a lista com genealogia (coluna Pai/Mãe com links)
3. Filtrar por **Espécie: Bovino** e **Sexo: Fêmea** para focar nas matrizes
4. Destacar as diferentes espécies: bovinos (0020–0023) e ovino (0030)
5. Clicar em **Detalhes** da **Mimosa (0020)**

---

## Passo 3 — Detalhes do Animal: Mimosa (2 min)

1. Mostrar os **Dados Cadastrais**: RFID 12756, Nelore, Linhagem Lemgruber, genealogia Bumbá/Moeda
2. Na seção **Pesagens**:
   - Última pesagem: 461 kg (22/05/2026)
   - Clicar em **Ver Histórico** → sidebar com as 4 pesagens mostrando evolução de peso
3. Mostrar as **Métricas de Crescimento**: Peso ao nascer, GPP, Peso ao desmame
4. No **Histórico Reprodutivo**: mostrar a inseminação positiva e o parto registrados

---

## Passo 4 — Nova Análise IA: Chance de Prenhez (3 min)

> **Ponto alto da demo — mostrar a IA em ação**

1. Clicar em **Nova Análise → Chance de Prenhez**
2. Preencher o formulário:
   - **Espécie:** Bovino
   - **Matriz:** 0020 - Mimosa
   - **Reprodutor:** Imperador do Sertão
   - **Protocolo:** IATF
   - **Temperatura:** 26°C
   - **Estação:** Seca
3. Clicar em **Realizar Análise**
4. No resultado, destacar:
   - **81%** de Chance de Prenhez
   - **Score de Fertilidade** e **Compatibilidade Genética**
   - **Fatores Positivos**: peso, pós-parto, histórico limpo, reprodutor de alta fertilidade
   - **Alerta**: estação seca — maior risco nutricional
   - **Análise IA** (texto gerado pelo modelo)
5. Clicar em **Salvar** — análise aparece no histórico do Dashboard

---

## Passo 5 — Nova Inseminação (2 min)

1. Navegar para **Reprodução → Nova Inseminação**
2. Preencher o formulário:
   - **Matriz:** 0021 - Garoa
   - **Reprodutor:** Imperador do Sertão
   - **Inseminador:** Dr. Fernando Lima
   - **Sêmen:** Nelore MAX-102
   - **Lote:** Lote Junho 2026
   - **Protocolo:** IATF
   - **Data:** hoje
3. Clicar em **Cadastrar**
4. Garoa aparece na lista de Reprodução com diagnóstico **Pendente**

---

## Passo 6 — Diagnóstico de Prenhez (2 min)

> **Mostrar o ciclo completo: inseminação → diagnóstico**

1. Na tela de **Reprodução**, localizar a **Garoa (0021)** com inseminação de 28 dias atrás (status Pendente)
2. Clicar em **Detalhes** → opção de atualizar diagnóstico
3. Preencher:
   - **Diagnóstico:** Positivo (Prenha)
   - **Resultado:** Prenhez confirmada por ultrassom
   - **Data de confirmação:** hoje
4. Salvar — status atualiza para **Prenha**
5. Mostrar que o Dashboard agora contabiliza mais uma gestação ativa

---

## Passo 7 — Relatórios (1 min)

1. Navegar para **Relatórios**
2. Mostrar o **relatório geral da fazenda**: taxa de prenhez, total de inseminações
3. Mostrar o **ranking de reprodutores**: Imperador do Sertão no topo (score 88, 79% taxa real)

---

## Dados disponíveis para a demo

### Animais
| Identificador | Nome | Espécie | Status | Prob. IA | Observação |
|---|---|---|---|---|---|
| 0020 | Mimosa | Bovino | Apto | 81% ↑ | 4 pesagens, 3 prenhezes, RFID |
| 0021 | Garoa | Bovino | Apto | — | Inseminação pendente (28 dias) |
| 0022 | Arrepiada | Bovino | Prenhe | 74% | Inseminação positiva registrada |
| 0023 | Estrela | Bovino | Apto | — | Falha na concepção anterior |
| 0030 | Branca | Ovino | Apto | 78% ↑ | Santa Inês, 2 prenhezes |
| 0031 | Serena | Ovino | Apto | 47% ↓ | Pós-parto curto + ECC baixo |
| 0032 | Luna | Ovino | Apto | — | Nulípara jovem |
| 0040 | Nuvem | Caprino | Apto | 76% ↑ | Boer, 2 partos, boa condição |
| 0041 | Flor | Caprino | Apto | 59% → | Anglonubiana, falha anterior |
| 0042 | Rosa | Caprino | Apto | 42% ↓ | Alto risco: doença + baixo peso |
| 0005–0013 | Genealogia | — | — | — | Pais e mães dos animais |

### Reprodutores
| Nome | Espécie | Score | Taxa Real |
|---|---|---|---|
| Imperador do Sertão | Bovino Nelore | 88 | 79% (19/24) |
| Bandoleiro da FTI | Bovino Brahman | 73 | 67% (10/15) |
| Nordestino Prime | Ovino Santa Inês | 85 | 83% (15/18) |

### Inseminações existentes
| Animal | Reprodutor | Protocolo | Diagnóstico |
|---|---|---|---|
| Mimosa | Imperador | IATF | ✅ Positivo (histórico) |
| Garoa | Bandoleiro | Ovsynch | ⏳ Pendente (28 dias) |
| Arrepiada | Imperador | IATF | ✅ Positivo (prenhe) |
| Estrela | Bandoleiro | IATF com eCG | ❌ Falha na concepção |
| Branca | Nordestino | IATF | ✅ Positivo (ovelha) |
