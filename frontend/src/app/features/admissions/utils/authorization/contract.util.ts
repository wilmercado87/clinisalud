import { ContratoResponse } from '@core/models/catalog.model';

export function resolveContractFeeSchedule(contracts: ContratoResponse[]): number | null {
  const sorted = [...contracts].sort((a, b) => contractEndKey(b.endDate) - contractEndKey(a.endDate));
  return sorted[0]?.feeScheduleId ?? null;
}

function contractEndKey(endDate: string): number {
  const [day, month, year] = endDate.split('/');
  return Number(`${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`);
}
