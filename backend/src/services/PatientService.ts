import { Op } from "sequelize";
import Paciente from "../models/Paciente";

export class PatientService {
  public async register(patientData: {
    idPaciente?: number;
    tipoDocumento: string;
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
  }): Promise<Paciente> {
    const existingPatient = await Paciente.findOne({
      where: { numDocumento: patientData.numDocumento },
    });

    if (existingPatient) {
      throw new Error("409:El paciente ya existe con este número de documento");
    }

    const patient = await Paciente.create(patientData);
    return patient;
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

  public async findAll(limit: number = 50, offset: number = 0): Promise<Paciente[]> {
    return await Paciente.findAll({
      limit,
      offset,
      order: [["primerApellido", "ASC"]],
      include: ["departamento", "municipio", "convenio"],
    });
  }

  public async search(term: string, limit: number = 20): Promise<Paciente[]> {
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

  public async update(id: number, patientData: Partial<Paciente>): Promise<Paciente | null> {
    const patient = await Paciente.findByPk(id);
    if (!patient) {
      throw new Error("404:Paciente no encontrado");
    }
    await patient.update(patientData);
    return patient;
  }

  public async validateDuplicate(numDocumento: string, excludeId?: number): Promise<boolean> {
    const where: any = { numDocumento };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const existing = await Paciente.findOne({ where });
    return !!existing;
  }
}

export default new PatientService();