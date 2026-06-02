import { Injectable } from '@nestjs/common';
import { calcDaysPostpartum } from '../../common/helpers/days-postpartum';
import { ScoreInput, ScoreOutput } from './scoring.types';

@Injectable()
export class ScoringService {
  calculate(input: ScoreInput): ScoreOutput {
    let score = 0;
    const positiveFactors: string[] = [];
    const alerts: string[] = [];
    const recommendations: string[] = [];

    // 1. Peso vivo
    const minWeights: Record<string, number> = { cattle: 380, sheep: 45, goat: 35 };
    const minWeight = minWeights[input.species] ?? 380;
    if (input.currentWeight >= minWeight) {
      score += 25;
      positiveFactors.push(`Peso adequado (${input.currentWeight} kg)`);
    } else if (input.currentWeight > 0) {
      alerts.push(`Peso abaixo do ideal (${input.currentWeight} kg — mínimo ${minWeight} kg)`);
      recommendations.push('Melhorar suplementação nutricional antes da inseminação');
    }

    // 2. Período pós-parto
    const daysPostpartum = calcDaysPostpartum(input.lastBirthDate);
    if (daysPostpartum === 0 || daysPostpartum >= 60) {
      score += 20;
      if (daysPostpartum >= 60) positiveFactors.push(`Pós-parto adequado (${daysPostpartum} dias)`);
    } else {
      alerts.push(`Pós-parto curto (${daysPostpartum} dias — ideal ≥ 60)`);
      recommendations.push('Aguardar período pós-parto mínimo de 60 dias');
    }

    // 3. Histórico reprodutivo
    if (input.pregnancyHistory > 0) {
      score += 15;
      positiveFactors.push(`Histórico reprodutivo positivo (${input.pregnancyHistory} prenhezes anteriores)`);
    }

    // 4. Histórico de abortos
    if (input.abortionCount === 0) {
      score += 10;
      positiveFactors.push('Sem histórico de abortos');
    } else {
      alerts.push(`Histórico de ${input.abortionCount} aborto(s)`);
    }

    // 5. Condição corporal
    if (input.bodyConditionScore >= 3) {
      score += 10;
      positiveFactors.push(`Boa condição corporal (escore ${input.bodyConditionScore}/5)`);
    } else {
      alerts.push(`Condição corporal baixa (escore ${input.bodyConditionScore}/5)`);
      recommendations.push('Melhorar condição corporal antes do protocolo');
    }

    // 6. Saúde reprodutiva
    if (!input.reproductiveDiseaseHistory) {
      score += 10;
      positiveFactors.push('Sem histórico de doenças reprodutivas');
    } else {
      alerts.push('Animal com histórico de doença reprodutiva');
      recommendations.push('Avaliação veterinária prévia recomendada');
    }

    // 7. Status reprodutivo
    if (input.reproductiveStatus === 'Ready') {
      score += 5;
      positiveFactors.push('Animal com status Apto');
    } else if (input.reproductiveStatus === 'Pregnant') {
      alerts.push('Animal já está prenhe');
    }

    // 8. Score do reprodutor
    if (input.breeder) {
      if (input.breeder.fertilityScore >= 80) {
        score += 10;
        positiveFactors.push(`Reprodutor com alta fertilidade (score ${input.breeder.fertilityScore})`);
      } else if (input.breeder.fertilityScore >= 60) {
        score += 5;
        positiveFactors.push(`Reprodutor com fertilidade razoável (score ${input.breeder.fertilityScore})`);
      } else {
        alerts.push(`Reprodutor com fertilidade abaixo do ideal (score ${input.breeder.fertilityScore})`);
        recommendations.push('Considerar troca de reprodutor');
      }
    }

    // 9. Protocolo
    if (input.protocol === 'IATF' || input.protocol === 'IATF com eCG') {
      score += 5;
      positiveFactors.push(`Protocolo ${input.protocol} — alta precisão de sincronização`);
    }

    // 10. Temperatura ambiente
    if (input.ambientTemperature && input.ambientTemperature > 32) {
      score -= 5;
      alerts.push(`Temperatura elevada (${input.ambientTemperature}°C) — risco de estresse térmico`);
      recommendations.push('Realizar inseminação no período mais fresco do dia (madrugada/manhã cedo)');
    }

    // 11. Estação do ano
    if (input.season === 'dry') {
      score -= 5;
      alerts.push('Estação seca — maior risco nutricional');
      recommendations.push('Garantir suplementação durante o período seco');
    }

    // Bônus: taxa histórica da fazenda
    if ((input.farmAveragePregnancyRate ?? 0) >= 65) {
      score += 5;
      positiveFactors.push(`Fazenda com boa taxa histórica (${input.farmAveragePregnancyRate}%)`);
    }

    score = Math.max(0, Math.min(100, score));

    if (recommendations.length === 0) {
      recommendations.push('Realizar diagnóstico de gestação entre 28-35 dias pós-inseminação');
    } else {
      recommendations.push('Monitorar prenhez em 30 dias');
    }

    const pregnancyProbability = Math.round(35 + score * 0.6);
    const geneticCompatibility = input.breeder
      ? Math.min(100, input.breeder.fertilityScore + 5)
      : null;

    return {
      pregnancyProbability,
      fertilityScore: score,
      riskLevel: score >= 70 ? 'low' : score >= 45 ? 'moderate' : 'high',
      geneticCompatibility,
      positiveFactors,
      alerts,
      recommendations,
      protocol: input.protocol,
    };
  }
}
