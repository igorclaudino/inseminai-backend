export function calcDaysPostpartum(lastBirthDate: Date | null | undefined): number {
  if (!lastBirthDate) return 0;
  return Math.floor((Date.now() - new Date(lastBirthDate).getTime()) / (1000 * 60 * 60 * 24));
}
