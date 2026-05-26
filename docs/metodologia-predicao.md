# Metodologia da Análise Preditiva de Prenhez

## Como o sistema calcula a probabilidade

A predição de prenhez do **Pecuária IA** é gerada por um modelo de pontuação por fatores (*scoring model*), metodologia amplamente utilizada em sistemas de apoio à decisão agropecuária. O sistema avalia até **11 fatores** independentes, cada um com peso definido por literatura zootécnica e veterinária. A fórmula final é:

> **Probabilidade (%) = 35 + (pontuação total × 0,6)**

A base de 35% representa a probabilidade mínima esperada mesmo em condições desfavoráveis, com base na taxa média nacional de prenhez por inseminação artificial em bovinos de corte (ASBIA, 2022). O limite máximo é 95%, refletindo que nenhuma técnica reprodutiva garante 100% de sucesso mesmo em condições ideais.

---

## Fatores avaliados e suas referências

### 1. Peso corporal
**Peso máximo: 25 pontos**

Pesos mínimos adotados: bovinos ≥ 380 kg, ovinos ≥ 45 kg, caprinos ≥ 35 kg. Animais abaixo desses limiares apresentam menor taxa de ovulação e implantação embrionária devido ao balanço energético negativo.

> Embrapa Pecuária Sudeste. *Manejo Reprodutivo de Bovinos de Corte*. São Carlos: Embrapa, 2021.

---

### 2. Intervalo pós-parto
**Peso máximo: 20 pontos**

Intervalo mínimo de 60 dias entre o último parto e a inseminação, necessário para a involução uterina completa e o retorno da ciclicidade ovariana. Inseminações realizadas antes desse período reduzem a taxa de concepção em até 30%.

> Hafez, E.S.E.; Hafez, B. *Reprodução Animal*. 7ª ed. São Paulo: Manole, 2004.
> CBRA — Colégio Brasileiro de Reprodução Animal. *Manual para Exame Andrológico e Avaliação de Sêmen Animal*. 3ª ed. Belo Horizonte: CBRA, 2013.

---

### 3. Histórico reprodutivo
**Peso máximo: 15 pontos**

Fêmeas com prenhezes anteriores comprovam fertilidade e apresentam menor probabilidade de subfertilidade idiopática. O número de prenhezes registradas no sistema é utilizado diretamente no cálculo.

> ASBIA — Associação Brasileira de Inseminação Artificial. *Relatório Estatístico de Mercado de Sêmen*. São Paulo: ASBIA, 2022.

---

### 4. Histórico de abortos
**Peso máximo: 10 pontos**

A ausência de abortos é indicativa de integridade reprodutiva. Fêmeas com histórico de abortos recorrentes apresentam taxa de prenhez até 25% inferior e requerem investigação de causas infecciosas (brucelose, IBR, BVD) e nutricionais.

> MAPA — Ministério da Agricultura, Pecuária e Abastecimento. *Programa Nacional de Controle e Erradicação da Brucelose e Tuberculose (PNCEBT)*. Brasília: MAPA, 2017.
> Embrapa Gado de Leite. *Doenças Reprodutivas em Bovinos*. Juiz de Fora: Embrapa, 2020.

---

### 5. Escore de Condição Corporal (ECC)
**Peso máximo: 10 pontos**

Adota-se escala de 1 a 5 (método Nicholson & Butterworth). ECC ≥ 3 é associado a balanço energético positivo e secreção adequada de hormônios reprodutivos (GnRH, LH, FSH). ECC < 3 suprime o eixo hipotálamo-hipófise-gonadal e reduz a taxa de ovulação em até 40%.

> Embrapa. *Escore de Condição Corporal em Bovinos de Corte: conceitos e aplicações*. Campo Grande: Embrapa Gado de Corte, 2019.
> Nicholson, M.J.; Butterworth, M.H. *A guide to condition scoring of zebu cattle*. ILCA, Addis Ababa, 1986.

---

### 6. Saúde reprodutiva
**Peso máximo: 10 pontos**

Animais sem histórico de doenças reprodutivas (metrite, endometrite, cistos ovarianos) preservam a integridade do trato reprodutivo. Endometrite subclínica reduz a taxa de prenhez entre 15 e 30%.

> LeBlanc, S.J. et al. Defining and diagnosing postpartum clinical endometritis and its impact on reproductive performance in dairy cows. *Journal of Dairy Science*, v. 94, n. 3, 2011.
> Gimenes, L.U. et al. Follicle deviation and ovulatory capacity in Bos indicus heifers. *Theriogenology*, v. 69, 2008.

---

### 7. Status reprodutivo atual
**Peso máximo: 5 pontos**

O status "Apto" indica liberação pelo responsável técnico após avaliação. Status "Prenhe" contraindica qualquer protocolo reprodutivo.

---

### 8. Score de fertilidade do reprodutor
**Peso máximo: 10 pontos**

O score do reprodutor é calculado pelo próprio sistema em duas etapas:

- **Estimativa inicial por raça:** tabela com 33 raças brasileiras e exóticas, construída com base em dados de fertilidade por espécie e condições do semiárido.
- **Blendagem com dados reais:** conforme o número de inseminações registradas aumenta, o peso dos dados reais cresce proporcionalmente (0% com 0 inseminações → 100% a partir de 10 inseminações), substituindo progressivamente a estimativa inicial.

Score ≥ 80: +10 pontos | Score 60–79: +5 pontos | Score < 60: fator de risco.

> CBRA. *Manual para Exame Andrológico e Avaliação de Sêmen Animal*. 3ª ed. Belo Horizonte: CBRA, 2013.

---

### 9. Protocolo reprodutivo
**Peso máximo: 5 pontos**

IATF e IATF com eCG recebem pontuação adicional por permitirem sincronização precisa da ovulação, eliminando a necessidade de detecção de cio. A taxa média de prenhez com IATF no Brasil é de 50–60% em bovinos de corte. A adição de eCG melhora a resposta em novilhas e vacas em anestro.

> Baruselli, P.S. et al. The use of hormonal treatments to improve reproductive performance of anestrous beef cattle in tropical climates. *Animal Reproduction Science*, v. 82–83, 2004.

---

### 10. Temperatura ambiente
**Penalização: −5 pontos se > 32°C**

Temperaturas acima de 32°C causam estresse térmico, reduzindo a qualidade oocitária, a taxa de fertilização e a sobrevivência embrionária em até 20%. O Índice de Temperatura e Umidade (ITU) > 72 é considerado crítico para bovinos.

> Hansen, P.J. Reproductive physiology of the heat-stressed dairy cow: implications for dairy cattle production in warm climates. *Animal Reproduction Science*, v. 60–61, 2000.

---

### 11. Estação do ano
**Penalização: −5 pontos na estação seca**

No semiárido nordestino, a estação seca reduz a disponibilidade de forragem nativa, levando ao balanço energético negativo e à supressão do eixo reprodutivo — especialmente relevante para caprinos e ovinos deslanados nativos. A suplementação proteico-energética é apontada como essencial para a manutenção da ciclicidade.

> Embrapa Caprinos e Ovinos. *Manejo Alimentar de Caprinos e Ovinos no Semiárido*. Sobral: Embrapa Caprinos e Ovinos, 2020.
> Moraes, J.C.F. et al. Sazonalidade reprodutiva em ovinos e caprinos criados no Brasil. *Revista Brasileira de Zootecnia*, v. 31, supl., 2002.

---

## Sobre o insight gerado pela IA

O texto narrativo exibido ao final de cada análise é gerado pelo modelo **GPT-4o-mini (OpenAI)**. Ele recebe como entrada os fatores, alertas e probabilidade calculados pelas regras acima e produz um resumo em linguagem natural para o técnico ou produtor. O insight **não substitui** nem altera os valores calculados — é apenas uma interpretação textual dos dados já determinados pelo modelo de pontuação.

---

## Resumo da pontuação

| Fator | Pontuação máxima | Penalização |
|---|---|---|
| Peso corporal | +25 | — |
| Intervalo pós-parto | +20 | — |
| Histórico reprodutivo | +15 | — |
| Histórico de abortos | +10 | — |
| Escore de Condição Corporal | +10 | — |
| Saúde reprodutiva | +10 | — |
| Status reprodutivo | +5 | — |
| Score do reprodutor | +10 | — |
| Protocolo reprodutivo | +5 | — |
| Temperatura ambiente | — | −5 se > 32°C |
| Estação do ano | — | −5 na seca |
| **Total possível** | **110** | **−10** |

*Score final limitado ao intervalo 0–100 antes de aplicar a fórmula de probabilidade.*

---

## Limitações e responsabilidade

Este sistema é uma ferramenta de **apoio à decisão**. Os resultados devem ser interpretados por médico veterinário ou zootecnista habilitado. Fatores não capturados pelo sistema (sanidade individual, qualidade de sêmen do lote específico, manejo no dia da inseminação) podem influenciar o resultado real. A probabilidade calculada representa uma estimativa baseada em dados históricos e literatura técnica, não uma garantia de prenhez.
