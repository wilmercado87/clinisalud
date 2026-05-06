import { Op } from "sequelize";
import CentroCosto from "../models/CentroCosto";
import TipoOrigen from "../models/TipoOrigen";
import Cama from "../models/Cama";
import Estancia from "../models/Estancia";
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

/**
 * BillingCatalogService - Catálogo de datos de facturación
 * Maneja: centros de costo, tipos de origen, camas, estancias, tarifarios, contratos, párrafos
 */
export class BillingCatalogService {
  /**
   * Obtiene todos los centros de costo
   */
  getAllCostCenters() {
    return CentroCosto.findAll({ order: [["descripcionCentroCosto", "ASC"]] });
  }

  /**
   * Busca centro de costo por ID
   */
  findCostCenterById(fkIdCentroCosto: number) {
    return CentroCosto.findByPk(fkIdCentroCosto);
  }

  /**
   * Busca centros de costo por complejidad
   */
  findCostCentersByComplexity(idNivelComplejidad: number) {
    return CentroCosto.findAll({ where: { idNivelComplejidad } });
  }

  /**
   * Obtiene todos los tipos de origen
   */
  getAllOriginTypes() {
    return TipoOrigen.findAll({ order: [["id", "ASC"]] });
  }

  /**
   * Busca tipo de origen por ID
   */
  findOriginTypeById(id: number) {
    return TipoOrigen.findByPk(id);
  }

  /**
   * Obtiene todas las camas
   */
  getAllBeds() {
    return Cama.findAll({ order: [["codigo", "ASC"]] });
  }

  /**
   * Busca cama por ID
   */
  findBedById(idHabitacion: number) {
    return Cama.findByPk(idHabitacion);
  }

  /**
   * Busca cama por código
   */
  findBedByCode(codigo: string) {
    return Cama.findOne({ where: { codigo } });
  }

  /**
   * Busca camas por estado
   */
  findBedsByState(estado: number) {
    return Cama.findAll({ where: { estado } });
  }

  /**
   * Obtiene todos los tipos de estancia
   */
  getAllStayTypes() {
    return Estancia.findAll({ order: [["codigo", "ASC"]] });
  }

  /**
   * Busca tipo de estancia por código
   */
  findStayTypeByCode(codigo: string) {
    return Estancia.findByPk(codigo);
  }

  /**
   * Busca tipos de estancia por nivel
   */
  findStayTypesByLevel(nivel: number) {
    const nivelMap: Record<number, string> = { 1: "1ER", 2: "SEG", 3: "TERCER" };
    const nivelStr = nivelMap[nivel];
    if (!nivelStr) return [];
    return Estancia.findAll({ where: { descripcion: { [Op.like]: `%${nivelStr}%` } } });
  }

  /**
   * Obtiene todos los tarifarios
   */
  getAllRates() {
    return Tarifario.findAll({ order: [["nombre", "ASC"]] });
  }

  /**
   * Busca tarifario por ID
   */
  findRateById(id: number) {
    return Tarifario.findByPk(id);
  }

  /**
   * Obtiene todos los diagnósticos de aplicación
   */
  getAllAppliedDiagnoses() {
    return DiagnosticoAplicacion.findAll({ order: [["codigo", "ASC"]] });
  }

  /**
   * Busca diagnóstico de aplicación por código
   */
  findAppliedDiagnosisByCode(codigo: string) {
    return DiagnosticoAplicacion.findOne({ where: { codigo } });
  }

  /**
   * Busca diagnósticos de aplicación por origen
   */
  findAppliedDiagnosesByOrigin(idTipoOrigen: number) {
    return DiagnosticoAplicacion.findAll({ where: { idTipoOrigen } });
  }

  /**
   * Obtiene todos los párrafos de aplicación
   */
  getAllParagraphApplications() {
    return ParrafoAplicacion.findAll();
  }

  /**
   * Busca párrafo de aplicación por ID
   */
  findParagraphApplicationById(id: number) {
    return ParrafoAplicacion.findByPk(id);
  }

  /**
   * Busca párrafos de aplicación por tarifario
   */
  findParagraphApplicationsByRate(idTarifario: number) {
    return ParrafoAplicacion.findAll({ where: { idTarifario } });
  }

  /**
   * Obtiene todos los contratos
   */
  getAllContracts() {
    return Contrato.findAll({ order: [["nombre", "ASC"]] });
  }

  /**
   * Busca contrato por ID
   */
  findContractById(idEps: string) {
    return Contrato.findByPk(idEps);
  }

  /**
   * Busca contratos por tarifario
   */
  findContractsByRate(idTarifario: number) {
    return Contrato.findAll({ where: { idTarifario } });
  }

  /**
   * Obtiene todos los códigos Mapiss
   */
  getAllMapiss() {
    return Mapiss.findAll({ order: [["codIss2001", "ASC"]] });
  }

  /**
   * Busca Mapiss por código
   */
  findMapissByCode(codIss2001: string) {
    return Mapiss.findByPk(codIss2001);
  }

  /**
   * Busca Mapiss por término
   */
  searchMapiss(term: string, limit = 20) {
    return Mapiss.findAll({ where: { descripcion: { [Op.iLike]: `%${term}%` } }, limit });
  }

  /**
   * Obtiene todos los articulados
   */
  getAllArticulados() {
    return Articulado.findAll({ order: [["id", "ASC"]] });
  }

  /**
   * Busca articulado por ID
   */
  findArticuladoById(id: number) {
    return Articulado.findByPk(id);
  }

  /**
   * Busca articulados por tarifario
   */
  findArticuladosByRate(idTarifario: number) {
    return Articulado.findAll({ where: { idTarifario } });
  }

  /**
   * Busca articulados por CUPS
   */
  findArticuladosByCups(codigoCups: string) {
    return Articulado.findAll({ where: { codigoCups } });
  }

  /**
   * Obtiene todos los párrafos
   */
  getAllParagraphs() {
    return Parrafo.findAll({ order: [["id", "ASC"]] });
  }

  /**
   * Busca párrafo por ID
   */
  findParagraphById(id: number) {
    return Parrafo.findByPk(id);
  }

  /**
   * Busca párrafos por tarifario
   */
  findParagraphsByRate(idTarifario: number) {
    return Parrafo.findAll({ where: { idTarifario } });
  }

  /**
   * Busca párrafos por CUPS
   */
  findParagraphsByCups(codigoCups: string) {
    return Parrafo.findAll({ where: { codigoCups } });
  }

  /**
   * Obtiene todos los párrafos de edad
   */
  getAllParagraphAges() {
    return ParrafoEdad.findAll({ order: [["id", "ASC"]] });
  }

  /**
   * Busca párrafo de edad por ID
   */
  findParagraphAgeById(id: number) {
    return ParrafoEdad.findByPk(id);
  }

  /**
   * Busca párrafos de edad por tarifario
   */
  findParagraphAgesByRate(idTarifario: number) {
    return ParrafoEdad.findAll({ where: { idTarifario } });
  }

  /**
   * Busca párrafos de edad por CUPS
   */
  findParagraphAgesByCups(codigoCups: string) {
    return ParrafoEdad.findAll({ where: { codigoCups } });
  }

  /**
   * Obtiene todas las inclusiones de párrafo
   */
  getAllParagraphInclusions() {
    return ParrafoInclusion.findAll({ order: [["id", "ASC"]] });
  }

  /**
   * Busca inclusión de párrafo por ID
   */
  findParagraphInclusionById(id: number) {
    return ParrafoInclusion.findByPk(id);
  }

  /**
   * Busca inclusiones por tarifario
   */
  findParagraphInclusionsByRate(idTarifario: number) {
    return ParrafoInclusion.findAll({ where: { idTarifario } });
  }

  /**
   * Obtiene todos los valores de párrafo
   */
  getAllParagraphValues() {
    return ParrafoValor.findAll({ order: [["id", "ASC"]] });
  }

  /**
   * Busca valor de párrafo por ID
   */
  findParagraphValueById(id: number) {
    return ParrafoValor.findByPk(id);
  }

  /**
   * Busca valores por tarifario
   */
  findParagraphValuesByRate(idTarifario: number) {
    return ParrafoValor.findAll({ where: { idTarifario } });
  }

  /**
   * Busca valores por artículo
   */
  findParagraphValuesByArticle(codArticulo: number) {
    return ParrafoValor.findAll({ where: { codArticulo } });
  }
}

export default new BillingCatalogService();