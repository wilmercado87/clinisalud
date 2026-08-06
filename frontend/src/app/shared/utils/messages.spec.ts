import {
  APP_MESSAGES,
  ADMISSION_MESSAGES,
  USER_MESSAGES,
  NOTIFICATION_MESSAGES,
  formatMessage,
} from './messages';

describe('messages', () => {
  describe('formatMessage', () => {
    it('reemplaza los placeholders con los parámetros', () => {
      const result = formatMessage(ADMISSION_MESSAGES.ADMISSION_CREATED, {
        admissionNumber: 'ADM-2024-001',
      });
      expect(result).toBe('Admisión ADM-2024-001 registrada correctamente');
    });

    it('reemplaza múltiples placeholders', () => {
      const result = formatMessage(ADMISSION_MESSAGES.ADMISSION_STATE_CHANGED, {
        admissionNumber: 'ADM-001',
        state: 'EN_ATENCION',
      });
      expect(result).toBe('Admisión ADM-001 pasó a estado EN_ATENCION');
    });

    it('conserva el placeholder si el parámetro no existe', () => {
      const result = formatMessage(ADMISSION_MESSAGES.ACTIVE_ADMISSION_EXISTS, {});
      expect(result).toContain('{admissionNumber}');
    });

    it('soporta parámetros numéricos', () => {
      const result = formatMessage('Cantidad {maxQuantity}', { maxQuantity: 10 });
      expect(result).toBe('Cantidad 10');
    });
  });

  describe('grupos de mensajes', () => {
    it('define los grupos por feature', () => {
      expect(APP_MESSAGES.OPERATION_ERROR).toBeTruthy();
      expect(ADMISSION_MESSAGES.ADMISSION_CREATED).toBeTruthy();
      expect(USER_MESSAGES.USER_CREATED).toBeTruthy();
      expect(NOTIFICATION_MESSAGES.MARKED_READ).toBeTruthy();
    });
  });
});
