import { Op } from "sequelize";
import TipoUsuario from "../models/TipoUsuario";
import ViaAcceso from "../models/ViaAcceso";
import TipoAcceso from "../models/TipoAcceso";
import Prioridad from "../models/Prioridad";
import Departamento from "../models/Departamento";
import Municipio from "../models/Municipio";
import Especialidad from "../models/Especialidad";
import Diagnostico from "../models/Diagnostico";
import Cups from "../models/Cups";
import Convenio from "../models/Convenio";
import CentroCosto from "../models/CentroCosto";
import TipoOrigen from "../models/TipoOrigen";
import Cama from "../models/Cama";
import Estancia from "../models/Estancia";
import DiagnosticoPaciente from "../models/DiagnosticoPaciente";
import Tarifario from "../models/Tarifario";
import DiagnosticoAplicacion from "../models/DiagnosticoAplicacion";
import ParrafoAplicacion from "../models/ParrafoAplicacion";
import Contrato from "../models/Contrato";
import Mapiss from "../models/Mapiss";
import Articulado from "../models/Articulado";
import Parrafo from "../models/Parrafo";
import ParrafoEdad from "../models/ParrafoEdad";
import ParrafoInclusion from "../models/ParrafoInclusion";
import ParrafoValor from "../models/ParrafoValor";
import TipoDocumento from "../models/TipoDocumento";

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

export class CatalogService {
  public async getAllUserTypes(): Promise<TipoUsuario[]> {
    return await TipoUsuario.findAll();
  }

  public async findUserTypeById(id: number): Promise<TipoUsuario | null> {
    return await TipoUsuario.findByPk(id);
  }

  public async findUserTypeByName(tipoUsuario: string): Promise<TipoUsuario | null> {
    return await TipoUsuario.findOne({ where: { tipoUsuario } });
  }

  public async getAllAccessWays(): Promise<ViaAcceso[]> {
    return await ViaAcceso.findAll();
  }

  public async findAccessWayById(id: number): Promise<ViaAcceso | null> {
    return await ViaAcceso.findByPk(id);
  }

  public async findAccessWaysByVia(idViaAcceso: number): Promise<ViaAcceso[]> {
    return await ViaAcceso.findAll({ where: { idViaAcceso } });
  }

  public async getAllAccessTypes(): Promise<TipoAcceso[]> {
    return await TipoAcceso.findAll();
  }

  public async findAccessTypeById(id: number): Promise<TipoAcceso | null> {
    return await TipoAcceso.findByPk(id);
  }

  public async findAccessTypesByTarifario(idTarifario: number): Promise<TipoAcceso[]> {
    return await TipoAcceso.findAll({ where: { idTarifario } });
  }

  public async getAllPriorities(): Promise<Prioridad[]> {
    return await Prioridad.findAll({ order: [["prioridad", "ASC"]] });
  }

  public async findPriorityById(id: number): Promise<Prioridad | null> {
    return await Prioridad.findByPk(id);
  }

  public async findPriorityByNumber(prioridad: number): Promise<Prioridad[]> {
    return await Prioridad.findAll({ where: { prioridad } });
  }

  public async findPriorityByAgeAndSex(age: number, sexo: string): Promise<Prioridad | null> {
    const priorities = await Prioridad.findAll({
      where: {
        rangoDesde: { [Op.lte]: age },
        rangoHasta: { [Op.gte]: age },
        sexo,
      },
    });
    return priorities[0] || null;
  }

  public async getAllDepartments(): Promise<Departamento[]> {
    return await Departamento.findAll();
  }

  public async findDepartmentById(id: number): Promise<Departamento | null> {
    return await Departamento.findByPk(id);
  }

  public async findDepartmentByIdDpto(idDpto: string): Promise<Departamento | null> {
    return await Departamento.findOne({ where: { idDpto } });
  }

  public async getDepartmentName(id: number): Promise<string | null> {
    const dept = await Departamento.findByPk(id);
    return dept ? dept.departamento : null;
  }

  public async getAllMunicipalities(): Promise<Municipio[]> {
    return await Municipio.findAll();
  }

  public async findMunicipalityById(id: number): Promise<Municipio | null> {
    return await Municipio.findByPk(id, { include: ["departamento"] });
  }

  public async findMunicipalityByIdMunicipio(idMunicipio: string): Promise<Municipio | null> {
    return await Municipio.findOne({ where: { idMunicipio } });
  }

  public async findMunicipalitiesByDepartment(idDpto: string): Promise<Municipio[]> {
    return await Municipio.findAll({ where: { idDpto } });
  }

  public async getMunicipalityName(id: number): Promise<string | null> {
    const mun = await Municipio.findByPk(id);
    return mun ? mun.municipio : null;
  }

  public async getAllSpecialties(): Promise<Especialidad[]> {
    return await Especialidad.findAll({ order: [["especilidad", "ASC"]] });
  }

  public async findSpecialtyById(id: number): Promise<Especialidad | null> {
    return await Especialidad.findByPk(id);
  }

  public async findSpecialtyByIdEspec(idEspec: string): Promise<Especialidad | null> {
    return await Especialidad.findOne({ where: { idEspec } });
  }

  public async findSpecialtyByName(name: string): Promise<Especialidad | null> {
    return await Especialidad.findOne({ where: { especilidad: name } });
  }

  public async searchDiagnoses(term: string, limit = DEFAULT_LIMIT): Promise<Diagnostico[]> {
    return await Diagnostico.findAll({
      where: {
        [Op.or]: [
          { codigoDiagnostico: { [Op.iLike]: `%${term}%` } },
          { descripcion: { [Op.iLike]: `%${term}%` } },
        ],
      },
      limit,
      order: [["codigoDiagnostico", "ASC"]],
    });
  }

  public async findDiagnosisByCode(codigoDiagnostico: string): Promise<Diagnostico | null> {
    return await Diagnostico.findOne({ where: { codigoDiagnostico } });
  }

  public async getAllDiagnoses(limit = 100, offset = DEFAULT_OFFSET): Promise<Diagnostico[]> {
    return await Diagnostico.findAll({ limit, offset, order: [["codigoDiagnostico", "ASC"]] });
  }

  public async searchProcedures(term: string, limit = DEFAULT_LIMIT): Promise<Cups[]> {
    return await Cups.findAll({
      where: {
        [Op.or]: [
          { pkCodigoMapiiss: { [Op.iLike]: `%${term}%` } },
          { descripcionMapiiss: { [Op.iLike]: `%${term}%` } },
        ],
      },
      limit,
      order: [["pkCodigoMapiiss", "ASC"]],
    });
  }

  public async findProcedureByCode(pkCodigoMapiiss: string): Promise<Cups | null> {
    return await Cups.findByPk(pkCodigoMapiiss);
  }

  public async getAllProcedures(limit = 100, offset = DEFAULT_OFFSET): Promise<Cups[]> {
    return await Cups.findAll({ limit, offset, order: [["pkCodigoMapiiss", "ASC"]] });
  }

  public async getAllPayers(): Promise<Convenio[]> {
    return await Convenio.findAll({ order: [["nombre", "ASC"]] });
  }

  public async findPayerById(idEps: string): Promise<Convenio | null> {
    return await Convenio.findByPk(idEps);
  }

  public async findPayerByCode(codEps: string): Promise<Convenio | null> {
    return await Convenio.findOne({ where: { codEps } });
  }

  public async findPayersByTarifario(idTarifario: number): Promise<Convenio[]> {
    return await Convenio.findAll({ where: { idTarifario } });
  }

  public async getAllCostCenters(): Promise<CentroCosto[]> {
    return await CentroCosto.findAll({ order: [["descripcionCentroCosto", "ASC"]] });
  }

  public async findCostCenterById(fkIdCentroCosto: number): Promise<CentroCosto | null> {
    return await CentroCosto.findByPk(fkIdCentroCosto);
  }

  public async findCostCentersByComplexity(idNivelComplejidad: number): Promise<CentroCosto[]> {
    return await CentroCosto.findAll({ where: { idNivelComplejidad } });
  }

  public async getAllOriginTypes(): Promise<TipoOrigen[]> {
    return await TipoOrigen.findAll({ order: [["id", "ASC"]] });
  }

  public async findOriginTypeById(id: number): Promise<TipoOrigen | null> {
    return await TipoOrigen.findByPk(id);
  }

  public async getAllBeds(): Promise<Cama[]> {
    return await Cama.findAll({ order: [["codigo", "ASC"]] });
  }

  public async findBedById(idHabitacion: number): Promise<Cama | null> {
    return await Cama.findByPk(idHabitacion);
  }

  public async findBedByCode(codigo: string): Promise<Cama | null> {
    return await Cama.findOne({ where: { codigo } });
  }

  public async findBedsByState(estado: number): Promise<Cama[]> {
    return await Cama.findAll({ where: { estado } });
  }

  public async getAllStayTypes(): Promise<Estancia[]> {
    return await Estancia.findAll({ order: [["codigo", "ASC"]] });
  }

  public async findStayTypeByCode(codigo: string): Promise<Estancia | null> {
    return await Estancia.findByPk(codigo);
  }

  public async findStayTypesByLevel(nivel: number): Promise<Estancia[]> {
    const nivelMap: Record<number, string> = { 1: "1ER", 2: "SEG", 3: "TERCER" };
    const nivelStr = nivelMap[nivel];
    if (!nivelStr) return [];
    return await Estancia.findAll({ where: { descripcion: { [Op.like]: `%${nivelStr}%` } } });
  }

  public async getAllPatientDiagnoses(): Promise<DiagnosticoPaciente[]> {
    return await DiagnosticoPaciente.findAll();
  }

  public async findPatientDiagnosisById(id: number): Promise<DiagnosticoPaciente | null> {
    return await DiagnosticoPaciente.findByPk(id);
  }

  public async findPatientDiagnosesByPatient(identificacion: string): Promise<DiagnosticoPaciente[]> {
    return await DiagnosticoPaciente.findAll({ where: { identificacion } });
  }

  public async getAllRates(): Promise<Tarifario[]> {
    return await Tarifario.findAll({ order: [["nombre", "ASC"]] });
  }

  public async findRateById(id: number): Promise<Tarifario | null> {
    return await Tarifario.findByPk(id);
  }

  public async getAllAppliedDiagnoses(): Promise<DiagnosticoAplicacion[]> {
    return await DiagnosticoAplicacion.findAll({ order: [["codigo", "ASC"]] });
  }

  public async findAppliedDiagnosisByCode(codigo: string): Promise<DiagnosticoAplicacion | null> {
    return await DiagnosticoAplicacion.findOne({ where: { codigo } });
  }

  public async findAppliedDiagnosesByOrigin(idTipoOrigen: number): Promise<DiagnosticoAplicacion[]> {
    return await DiagnosticoAplicacion.findAll({ where: { idTipoOrigen } });
  }

  public async getAllParagraphApplications(): Promise<ParrafoAplicacion[]> {
    return await ParrafoAplicacion.findAll();
  }

  public async findParagraphApplicationById(id: number): Promise<ParrafoAplicacion | null> {
    return await ParrafoAplicacion.findByPk(id);
  }

  public async findParagraphApplicationsByRate(idTarifario: number): Promise<ParrafoAplicacion[]> {
    return await ParrafoAplicacion.findAll({ where: { idTarifario } });
  }

  public async getAllContracts(): Promise<Contrato[]> {
    return await Contrato.findAll({ order: [["nombre", "ASC"]] });
  }

  public async findContractById(idEps: string): Promise<Contrato | null> {
    return await Contrato.findByPk(idEps);
  }

  public async findContractsByRate(idTarifario: number): Promise<Contrato[]> {
    return await Contrato.findAll({ where: { idTarifario } });
  }

  public async getAllMapiss(): Promise<Mapiss[]> {
    return await Mapiss.findAll({ order: [["codIss2001", "ASC"]] });
  }

  public async findMapissByCode(codIss2001: string): Promise<Mapiss | null> {
    return await Mapiss.findByPk(codIss2001);
  }

  public async searchMapiss(term: string, limit = DEFAULT_LIMIT): Promise<Mapiss[]> {
    return await Mapiss.findAll({ where: { descripcion: { [Op.iLike]: `%${term}%` } }, limit });
  }

  public async getAllArticulados(): Promise<Articulado[]> {
    return await Articulado.findAll({ order: [["id", "ASC"]] });
  }

  public async findArticuladoById(id: number): Promise<Articulado | null> {
    return await Articulado.findByPk(id);
  }

  public async findArticuladosByRate(idTarifario: number): Promise<Articulado[]> {
    return await Articulado.findAll({ where: { idTarifario } });
  }

  public async findArticuladosByCups(codigoCups: string): Promise<Articulado[]> {
    return await Articulado.findAll({ where: { codigoCups } });
  }

  public async getAllParagraphs(): Promise<Parrafo[]> {
    return await Parrafo.findAll({ order: [["id", "ASC"]] });
  }

  public async findParagraphById(id: number): Promise<Parrafo | null> {
    return await Parrafo.findByPk(id);
  }

  public async findParagraphsByRate(idTarifario: number): Promise<Parrafo[]> {
    return await Parrafo.findAll({ where: { idTarifario } });
  }

  public async findParagraphsByCups(codigoCups: string): Promise<Parrafo[]> {
    return await Parrafo.findAll({ where: { codigoCups } });
  }

  public async getAllParagraphAges(): Promise<ParrafoEdad[]> {
    return await ParrafoEdad.findAll({ order: [["id", "ASC"]] });
  }

  public async findParagraphAgeById(id: number): Promise<ParrafoEdad | null> {
    return await ParrafoEdad.findByPk(id);
  }

  public async findParagraphAgesByRate(idTarifario: number): Promise<ParrafoEdad[]> {
    return await ParrafoEdad.findAll({ where: { idTarifario } });
  }

  public async findParagraphAgesByCups(codigoCups: string): Promise<ParrafoEdad[]> {
    return await ParrafoEdad.findAll({ where: { codigoCups } });
  }

  public async getAllParagraphInclusions(): Promise<ParrafoInclusion[]> {
    return await ParrafoInclusion.findAll({ order: [["id", "ASC"]] });
  }

  public async findParagraphInclusionById(id: number): Promise<ParrafoInclusion | null> {
    return await ParrafoInclusion.findByPk(id);
  }

  public async findParagraphInclusionsByRate(idTarifario: number): Promise<ParrafoInclusion[]> {
    return await ParrafoInclusion.findAll({ where: { idTarifario } });
  }

  public async getAllParagraphValues(): Promise<ParrafoValor[]> {
    return await ParrafoValor.findAll({ order: [["id", "ASC"]] });
  }

  public async findParagraphValueById(id: number): Promise<ParrafoValor | null> {
    return await ParrafoValor.findByPk(id);
  }

  public async findParagraphValuesByRate(idTarifario: number): Promise<ParrafoValor[]> {
    return await ParrafoValor.findAll({ where: { idTarifario } });
  }

  public async findParagraphValuesByArticle(codArticulo: number): Promise<ParrafoValor[]> {
    return await ParrafoValor.findAll({ where: { codArticulo } });
  }

  public async getAllDocumentTypes(): Promise<TipoDocumento[]> {
    return await TipoDocumento.findAll({ order: [["descripcion", "ASC"]] });
  }

  public async findDocumentTypeById(id: number): Promise<TipoDocumento | null> {
    return await TipoDocumento.findByPk(id);
  }

  public async findDocumentTypeByCode(codigo: string): Promise<TipoDocumento | null> {
    return await TipoDocumento.findOne({ where: { codigo } });
  }
}

export default new CatalogService();