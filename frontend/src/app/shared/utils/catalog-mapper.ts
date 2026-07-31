export interface CatalogDisplayItem {
  id: number;
  description: string;
  code?: string;
  detail?: string;
}

export function mapCatalogItemToDisplay(catalogType: string, item: any): CatalogDisplayItem {
  switch (catalogType) {
    case 'beds':
      return {
        id: item.roomId,
        code: String(item.bedCode).trim(),
        description: `${String(item.bedCode).trim()} - ${String(item.tipoCama).trim()}`,
        detail: item.bedStatus === 0 ? 'Disponible' : 'Ocupada',
      };
    case 'user-types':
      return { id: item.id, description: String(item.name).trim() };
    case 'eps':
      return { id: item.idEps, description: String(item.epsName).trim() };
    default:
      return { id: item.id, description: String(item.description || item.name || '').trim() };
  }
}
