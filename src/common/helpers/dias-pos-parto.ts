export function calcularDiasPosParto(dataUltimoParto: Date | null | undefined): number {
  if (!dataUltimoParto) return 0;
  return Math.floor((Date.now() - new Date(dataUltimoParto).getTime()) / (1000 * 60 * 60 * 24));
}
