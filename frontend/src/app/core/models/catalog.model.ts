export interface CatalogItem {
  id: number;
  name: string;
  code?: string;
  description?: string;
}

export interface MunicipioItem extends CatalogItem {
  departmentId: string;
}

export interface ContratoItem extends CatalogItem {
  epsId: number;
  contractNumber: string;
}

export interface CamaItem {
  roomId: number;
  bedCode: string;
  bedStatus: number;
  tipoCama: string;
}

export interface DiagnosticoItem {
  id: number;
  code: string;
  description: string;
}

export interface CupsItem {
  id: number;
  mapiissCode: string;
  description: string;
}
