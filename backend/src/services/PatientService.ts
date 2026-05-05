import { Op } from "sequelize";
import Paciente from "../models/Paciente";
import { ApiError } from "../middlewares/ErrorHandlerMiddleware";

interface PatientData {
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

export class PatientService {
  public async register(data: PatientData): Promise<Paciente> {
    const existingPatient = await Paciente.findOne({ where: { numDocumento: data.numDocumento } });
    if (existingPatient) throw ApiError.conflict("El paciente ya existe con este número de documento");

    return await Paciente.create(data as any);
  }

  public async findByDocument(numDocumento: string): Promise<Paciente | null> {
    return await Paciente.findOne({
      where: { numDocumento },
      include: ["departamento", "municipio", "tipoUsuario", "convenio"],
    });
  }

  public async findById(id: number): Promise<Paciente | null> {
    return await Paciente.findByPk(id, {
      include: ["departamento", "municipio", "tipoUsuario", "convenio"],
    });
  }

  public async findAll(limit = 50, offset = 0): Promise<Paciente[]> {
    return await Paciente.findAll({
      limit,
      offset,
      order: [["primerApellido", "ASC"]],
      include: ["departamento", "municipio", "convenio"],
    });
  }

  public async search(term: string, limit = 20): Promise<Paciente[]> {
    return await Paciente.findAll({
      where: {
        [Op.or]: [
          { numDocumento: { [Op.iLike]: `%${term}%` } },
          { primerNombre: { [Op.iLike]: `%${term}%` } },
          { primerApellido: { [Op.iLike]: `%${term}%` } },
        ],
      },
      limit,
      include: ["convenio"],
    });
  }

  public async update(id: number, data: Partial<PatientData>): Promise<Paciente> {
    const patient = await Paciente.findByPk(id);
    if (!patient) throw ApiError.notFound();
    await patient.update(data);
    return patient;
  }

  public async validateDuplicate(numDocumento: string, excludeId?: number): Promise<boolean> {
    const where: Record<string, any> = { numDocumento };
    if (excludeId) where.id = { [Op.ne]: excludeId };

    const existing = await Paciente.findOne({ where });
    return !!existing;
  }
}

export default new PatientService();