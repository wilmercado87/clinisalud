export function getNotificationTypeLabel(type: string): string {
  const dictionaryLabels: Record<string, string> = {
    USER_CREATED: 'Usuario creado',
    USER_TOGGLED: 'Estado usuario',
    ADMISSION_CREATED: 'Admisión',
    BILLING_COMPLETED: 'Facturación',
    DIAGNOSIS_UPDATED: 'Diagnóstico',
    BILLING_CANCELLED: 'Factura anulada',
    AUTHORIZATION_REQUESTED: 'Autorización',
  };
  return dictionaryLabels[type] || type;
}