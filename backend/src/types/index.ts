export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
    email: string;
  };
}

export interface PatientData {
  idPaciente?: number;
  idTipoDocumento: number;
  numDocumento: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  fechaNacimiento: string;
  genero: string;
  direccion?: string;
  telefono?: string;
  idMunicipio: number;
  idDepartamento: number;
  idTipoUsuario: number;
  idConvenio: string;
}

export interface BillingData {
  numAdmision: string;
  idOrigenCta: number;
  idTarifario: number;
  idTipoServicio: number;
  idPaciente: number;
  idContrato?: string;
  codDiagnostico?: string;
  codProcedimiento?: string;
  idCama?: number;
  idEspecialidad?: number;
  fechaAdmision: string;
  fechaEgreso?: string;
  valorTotal: number;
  estado?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserData {
  idTipoDocumento: number;
  numDocumento: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  email: string;
  password: string;
  roleId: number;
  isActive?: boolean;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}