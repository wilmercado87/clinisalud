// @spec:INV-ADM-01 — Control de Censo y Disponibilidad de Camas (presentación visual del estado)
import { AdmissionStatePipe } from './admission-state.pipe';

describe('AdmissionStatePipe', () => {
  const pipe = new AdmissionStatePipe();

  it('maps REGISTRADA to a muted grey chip', () => {
    expect(pipe.transform('REGISTRADA')).toEqual({ label: 'Registrada', tone: 'registered' });
  });

  it('maps EN_ATENCION to an attention blue chip', () => {
    expect(pipe.transform('EN_ATENCION')).toEqual({ label: 'En Atención', tone: 'in-care' });
  });

  it('maps CON_EPICRISIS to a warning chip', () => {
    expect(pipe.transform('CON_EPICRISIS')).toEqual({ label: 'En Epicrisis', tone: 'epicrisis' });
  });

  it('maps FACTURADA to a success chip', () => {
    expect(pipe.transform('FACTURADA')).toEqual({ label: 'Facturada', tone: 'billed' });
  });

  it('maps EGRESADA to a discharged chip', () => {
    expect(pipe.transform('EGRESADA')).toEqual({ label: 'Egresada', tone: 'discharged' });
  });

  it('falls back to the raw value with a default tone for unknown states', () => {
    expect(pipe.transform('CUALQUIERA')).toEqual({ label: 'CUALQUIERA', tone: 'default' });
  });
});