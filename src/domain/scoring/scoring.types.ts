/** Input para o algoritmo de scoring — desacoplado do Prisma */
export interface ScoreInput {
  species: string;
  lastBirthDate: Date | null | undefined;
  pregnancyHistory: number;
  abortionCount: number;
  bodyConditionScore: number;
  reproductiveDiseaseHistory: boolean;
  reproductiveStatus: string;
  farmAveragePregnancyRate?: number;
  currentWeight: number;
  breeder?: { fertilityScore: number } | null;
  protocol?: string;
  ambientTemperature?: number;
  season?: string;
}

/** Resultado puro do algoritmo de scoring (sem insight de IA) */
export interface ScoreOutput {
  pregnancyProbability: number;
  fertilityScore: number;
  riskLevel: 'low' | 'moderate' | 'high';
  geneticCompatibility: number | null;
  positiveFactors: string[];
  alerts: string[];
  recommendations: string[];
  protocol?: string;
}
