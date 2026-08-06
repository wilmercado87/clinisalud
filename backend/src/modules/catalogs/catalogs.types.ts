export interface CatalogItemResponse {
  id: number;
  [key: string]: string | number | boolean | Date | null | undefined;
}

export interface BedsPageResponse {
  items: CatalogItemResponse[];
  total: number;
}

export interface CupsItemResponse {
  id: number;
  code: string;
  description: string;
  maxQuantity: number;
  netValue: number;
}

export interface CupsPageResponse {
  items: CupsItemResponse[];
  total: number;
}
