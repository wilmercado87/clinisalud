export interface CatalogItemResponse {
  id: number;
  name: string;
  code?: string;
  description?: string;
}

export interface MunicipioResponse extends CatalogItemResponse {
  departmentId: string;
}

export interface ContratoResponse extends CatalogItemResponse {
  epsId: number;
  contractNumber: string;
}

export interface CamaResponse {
  roomId: number;
  bedCode: string;
  bedStatus: number;
  tipoCama: string;
}

export interface BedsPageResponse {
  items: CamaResponse[];
  total: number;
}

export interface EpsResponse {
  idEps: number;
  epsCode: string;
  epsName: string;
}

export interface DiagnosticoResponse {
  id: number;
  code: string;
  description: string;
}

export interface CupsSearchItem {
  id: number;
  code: string;
  description: string;
  maxQuantity: number;
  netValue: number;
}

export interface CupsPageResponse {
  items: CupsSearchItem[];
  total: number;
}

export type CatalogSourceItem = CatalogItemResponse | CamaResponse | EpsResponse;
