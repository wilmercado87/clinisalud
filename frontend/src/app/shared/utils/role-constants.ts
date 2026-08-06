export const ROLE_CODES = {
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMISIONES: 'ADMISIONES',
  MEDICO: 'MEDICO',
  FACTURADOR: 'FACTURADOR',
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];
