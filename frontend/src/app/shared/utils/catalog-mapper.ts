import { CatalogSourceItem } from '@core/models/catalog.model';

export interface CatalogOptionUI {
  id: number;
  description: string;
  code?: string;
  detail?: string;
}

export function mapCatalogItemToOption(
  catalogType: string,
  item: CatalogSourceItem,
): CatalogOptionUI {
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
