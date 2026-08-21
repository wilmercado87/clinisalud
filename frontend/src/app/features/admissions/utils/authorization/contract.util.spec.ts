import { ContratoResponse } from '@core/models/catalog.model';
import { resolveContractFeeSchedule } from './contract.util';

function contract(id: number, endDate: string): ContratoResponse {
  return {
    id,
    name: `CT-${id}`,
    epsId: 8002514406,
    feeScheduleId: id,
    contractNumber: `CT-${id}`,
    startDate: '01/01/2026',
    endDate,
  };
}

describe('resolveContractFeeSchedule', () => {
  it('returns null when there are no contracts', () => {
    expect(resolveContractFeeSchedule([])).toBeNull();
  });

  it('resolves the fee schedule of the only contract', () => {
    expect(resolveContractFeeSchedule([contract(7, '31/12/2026')])).toBe(7);
  });

  it('resolves the latest-ending contract (INV-ADM-02 tariff source)', () => {
    const contracts = [contract(3, '30/06/2026'), contract(9, '31/12/2027'), contract(5, '31/12/2026')];
    expect(resolveContractFeeSchedule(contracts)).toBe(9);
  });

  it('breaks ties by list order stability for identical end dates', () => {
    const contracts = [contract(2, '31/12/2026'), contract(8, '31/12/2026')];
    expect([2, 8]).toContain(resolveContractFeeSchedule(contracts));
  });
});
