export interface CatalogItemResponse {
  id: number;
  [key: string]: string | number | boolean | Date | null | undefined;
}

export interface BedsPageResponse {
  items: CatalogItemResponse[];
  total: number;
}
