export const PROTOCOLS = [
  'IATF',
  'Ovsynch',
  'IATF com eCG',
  'Ressincronização',
] as const;

export type Protocol = (typeof PROTOCOLS)[number];
