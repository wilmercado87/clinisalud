import { CamaResponse, CatalogSourceItem } from '@core/models/catalog.model';

export interface CatalogOptionUI {
  id: number;
  description: string;
  code?: string;
  detail?: string;
}

export interface AuthRowViewModel {
  authTypeName: string;
  authNumber: string;
  mapiissCode: string | null;
  quantity: number;
}

export function formatBedLabel(catalog: CatalogSourceItem[], roomId: number | null): string | null {
  if (!roomId) return null;
  const bed = catalog.find((item): item is CamaResponse => 'bedCode' in item && item.roomId === roomId);
  return bed ? `${bed.bedCode} - ${bed.tipoCama}` : `#${roomId}`;
}

export function toAuthRowViewModel(
  catalog: CatalogSourceItem[],
  row: {
    authTypeId: number | null;
    authTypeName?: string | null;
    authNumber: string;
    mapiissCode: string | null;
    quantity: number;
  },
): AuthRowViewModel {
  return {
    authTypeName: row.authTypeName ?? findCatalogItemName(catalog, row.authTypeId) ?? `#${row.authTypeId}`,
    authNumber: row.authNumber,
    mapiissCode: row.mapiissCode,
    quantity: row.quantity,
  };
}

export function findCatalogItemName(items: CatalogSourceItem[], id: number | null): string {
  if (id === null) return '';
  const item = items.find((catalogItem) => 'id' in catalogItem && catalogItem.id === id);
  if (!item || !('id' in item)) return '';
  return String(item.name || item.description || '');
}

export function mapCatalogItemToOption(catalogType: string, item: CatalogSourceItem): CatalogOptionUI {
  switch (catalogType) {
    case 'beds': {
      if ('bedCode' in item) {
        const code = String(item.bedCode).trim();
        return {
          id: item.roomId,
          code,
          description: `${code} - ${String(item.tipoCama).trim()}`,
          detail: item.bedStatus === 0 ? 'Disponible' : 'Ocupada',
        };
      }
      return { id: 0, description: '' };
    }
    case 'eps': {
      if ('epsName' in item) {
        return { id: item.idEps, description: String(item.epsName).trim() };
      }
      return { id: 0, description: '' };
    }
    default: {
      if ('bedCode' in item || 'epsName' in item) return { id: 0, description: '' };
      return {
        id: item.id,
        description: String(item.description || item.name || '').trim(),
      };
    }
  }
}
