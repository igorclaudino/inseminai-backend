# InsemiAI — Roteiro de Demo

**Duração máxima:** 10 minutos (limite do hackathon)  
**Credenciais:** luiza@fazendauruguai.com.br / Demo@2026  
**Fazenda:** Fazenda Uruguai — Crateús/CE

> **Nota:** Reprodutores não são cadastrados separadamente. São os animais machos da fazenda. Para listar: `GET /animals?sex=male&species=<espécie>`.

---

## Estrutura (10 minutos)

| Bloco | Tempo | Conteúdo |
|---|---|---|
| Problema e contexto | 0–2 min | Por que o InsemiAI existe |
| A solução | 2–4 min | Como funciona, a IA |
| Demonstração ao vivo | 4–8 min | Sistema funcionando |
| Diferenciais e escala | 8–10 min | ROI, próximos passos |

---

## Demo ao vivo (4 min — o momento mais importante)

### 1. Dashboard (30s)
- Login com as credenciais acima
- Mostrar os 4 cards: **Total de Animais**, **Gravidezes Ativas**, **Inseminações com Sucesso**, **Inseminações sem Sucesso**
- Mencionar filtros de Espécie e Período

---

### 2. Lista de Animais (30s)
- Navegar para **Animais**
- Filtrar por **Espécie: Bovino / Sexo: Fêmea**
- Mostrar genealogia (Pai/Mãe vinculados)
- Filtrar por **Sexo: Macho** para mostrar os reprodutores (Bumbá, Barão)

---

### 3. Detalhes do Animal: Mimosa (45s)
- Clicar em **Mimosa (0020)**
- Mostrar: RFID, raça Nelore, linhagem Lemgruber, genealogia Bumbá/Moeda
- Seção **Pesagens**: última pesagem 461 kg (22/05/2026), histórico com evolução
- **Histórico Reprodutivo**: inseminação positiva + parto registrados

---

### 4. Análise IA — Chance de Prenhez ⭐ PONTO ALTO (1 min)
1. Abrir **Nova Análise → Chance de Prenhez**
2. Preencher:
   - **Matriz:** 0020 - Mimosa
   - **Reprodutor:** 0005 - Bumbá
   - **Protocolo:** IATF · **Temperatura:** 26°C · **Estação:** Seca
3. Clicar em **Realizar Análise** — aguardar 1–2s (IA em ação)
4. Destacar no resultado:
   - Porcentagem de probabilidade de prenhez
   - **Fatores Positivos** e **Alertas** específicos do animal
   - **Análise da IA** — texto técnico citando dados reais da Mimosa

---

### 5. Nova Inseminação (30s)
1. **Reprodução → Nova Inseminação**
2. Preencher: Garoa (0021), Bumbá, IATF, hoje
3. Garoa aparece na lista com diagnóstico **Pendente**

---

### 6. Diagnóstico de Prenhez — ciclo completo (45s)
1. Localizar inseminação de **28 dias atrás** (Garoa/Barão — status Pendente)
2. Atualizar diagnóstico → **Positivo**
3. Sistema automaticamente:
   - Muda status da Garoa para **Prenha**
   - Cria evento de "Prenhez" no histórico
   - Incrementa score do reprodutor
4. Dashboard atualiza gravidezes ativas

---

## Dados disponíveis para a demo

### Fêmeas
| Id | Nome | Espécie | Status | Observação |
|---|---|---|---|---|
| 0020 | Mimosa | Bovino | Apto | 4 pesagens, 3 prenhezes, RFID |
| 0021 | Garoa | Bovino | Apto | Inseminação pendente (28 dias) |
| 0022 | Arrepiada | Bovino | Prenhe | Inseminação positiva |
| 0023 | Estrela | Bovino | Apto | Falha anterior |
| 0030 | Branca | Ovino | Apto | 2 prenhezes |
| 0031 | Serena | Ovino | Apto | Alto risco (pós-parto curto) |
| 0040 | Nuvem | Caprino | Apto | 2 partos |
| 0041 | Flor | Caprino | Apto | Falha anterior |
| 0042 | Rosa | Caprino | Apto | Alto risco |

### Reprodutores (machos)
| Id | Nome | Espécie | fertilityScore | Taxa Real |
|---|---|---|---|---|
| 0005 | Bumbá | Bovino Nelore | 88 | 79% (19/24) |
| 0006 | Barão | Bovino Brahman | 73 | 67% (10/15) |
| 0007 | Carneiro 42 | Ovino Dorper | 85 | 83% (15/18) |
| 0008 | King Boer | Caprino Boer | 86 | 80% (16/20) |

---

## Plano B (em caso de falha técnica)
- Ter vídeo gravado da solução funcionando salvo offline
- Ter a solução rodando localmente no notebook como backup
- URL de produção + URL local como alternativas
