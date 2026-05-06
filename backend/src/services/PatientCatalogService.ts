import { Op } from "sequelize";
import Departamento from "../models/Departamento";
import Municipio from "../models/Municipio";
import Especialidad from "../models/Especialidad";
import TipoDocumento from "../models/TipoDocumento";
import TipoUsuario from "../models/TipoUsuario";
import Convenio from "../models/Convenio";

/**
 * PatientCatalogService - Catálogo de datos relacionados con pacientes
 * Maneja: departamentos, municipios, especialidades, tipos de documento, tipos de usuario y convenios
 */
export class PatientCatalogService {
  /**
   * Obtiene todos los departamentos
   */
  getAllDepartments() {
    return Departamento.findAll();
  }

  /**
   * Busca departamento por ID
   */
  findDepartmentById(id: number) {
    return Departamento.findByPk(id);
  }

  /**
   * Busca departamento por código
   */
  findDepartmentByIdDpto(idDpto: string) {
    return Departamento.findOne({ where: { idDpto } });
  }

  /**
   * Obtiene nombre de departamento
   */
  async getDepartmentName(id: number): Promise<string | null> {
    const dept = await Departamento.findByPk(id);
    return dept?.departamento || null;
  }

  /**
   * Obtiene todos los municipios
   */
  getAllMunicipalities() {
    return Municipio.findAll();
  }

  /**
   * Busca municipio por ID
   */
  findMunicipalityById(id: number) {
    return Municipio.findByPk(id, { include: ["departamento"] });
  }

  /**
   * Busca municipio por código
   */
  findMunicipalityByIdMunicipio(idMunicipio: string) {
    return Municipio.findOne({ where: { idMunicipio } });
  }

  /**
   * Busca municipios por departamento
   */
  findMunicipalitiesByDepartment(idDpto: string) {
    return Municipio.findAll({ where: { idDpto } });
  }

  /**
   * Obtiene nombre de municipio
   */
  async getMunicipalityName(id: number): Promise<string | null> {
    const mun = await Municipio.findByPk(id);
    return mun?.municipio || null;
  }

  /**
   * Obtiene todas las especialidades
   */
  getAllSpecialties() {
    return Especialidad.findAll({ order: [["especilidad", "ASC"]] });
  }

  /**
   * Busca especialidad por ID
   */
  findSpecialtyById(id: number) {
    return Especialidad.findByPk(id);
  }

  /**
   * Busca especialidad por código
   */
  findSpecialtyByIdEspec(idEspec: string) {
    return Especialidad.findOne({ where: { idEspec } });
  }

  /**
   * Busca especialidad por nombre
   */
  findSpecialtyByName(name: string) {
    return Especialidad.findOne({ where: { especilidad: name } });
  }

  /**
   * Obtiene todos los tipos de documento
   */
  getAllDocumentTypes() {
    return TipoDocumento.findAll({ order: [["descripcion", "ASC"]] });
  }

  /**
   * Busca tipo de documento por ID
   */
  findDocumentTypeById(id: number) {
    return TipoDocumento.findByPk(id);
  }

  /**
   * Busca tipo de documento por código
   */
  findDocumentTypeByCode(codigo: string) {
    return TipoDocumento.findOne({ where: { codigo } });
  }

  /**
   * Obtiene todos los tipos de usuario
   */
  getAllUserTypes() {
    return TipoUsuario.findAll();
  }

  /**
   * Busca tipo de usuario por ID
   */
  findUserTypeById(id: number) {
    return TipoUsuario.findByPk(id);
  }

  /**
   * Busca tipo de usuario por nombre
   */
  findUserTypeByName(tipoUsuario: string) {
    return TipoUsuario.findOne({ where: { tipoUsuario } });
  }

  /**
   * Obtiene todos los convenios
   */
  getAllPayers() {
    return Convenio.findAll({ order: [["nombre", "ASC"]] });
  }

  /**
   * Busca convenio por ID
   */
  findPayerById(idEps: string) {
    return Convenio.findByPk(idEps);
  }

  /**
   * Busca convenio por código
   */
  findPayerByCode(codEps: string) {
    return Convenio.findOne({ where: { codEps } });
  }

  /**
   * Busca convenios por tarifario
   */
  findPayersByTarifario(idTarifario: number) {
    return Convenio.findAll({ where: { idTarifario } });
  }
}

export default new PatientCatalogService();