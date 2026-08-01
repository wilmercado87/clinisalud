export interface CatalogDisplayItem {
  id: number;
  description: string;
  code?: string;
  detail?: string;
}

interface CatalogSourceItem {
  id?: number;
  name?: string;
  description?: string;
  roomId?: number;
  bedCode?: string;
  bedStatus?: number;
  tipoCama?: string;
  idEps?: number;
  epsName?: string;
}

export function mapCatalogItemToDisplay(
  catalogType: string,
  item: CatalogSourceItem,
): CatalogDisplayItem {
  switch (catalogType) {
    case 'beds':
      return {
        id: item.roomId ?? 0,
        code: String(item.bedCode ?? '').trim(),
        description: `${String(item.bedCode ?? '').trim()} - ${String(item.tipoCama ?? '').trim()}`,
        detail: item.bedStatus === 0 ? 'Disponible' : 'Ocupada',
      };
    case 'user-types':
      return { id: item.id ?? 0, description: String(item.name ?? '').trim() };
    case 'eps':
      return { id: item.idEps ?? 0, description: String(item.epsName ?? '').trim() };
    default:
      return {
        id: item.id ?? 0,
        description: String(item.description || item.name || '').trim(),
      };
  }
}
