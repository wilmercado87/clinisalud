import { Op } from "sequelize";
import FacturacionPaciente from "../models/FacturacionPaciente";
import { ApiError } from "../middlewares/ErrorHandlerMiddleware";

interface BillingData {
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

export class BillingService {
  public async createBilling(data: BillingData) {
    const existing = await FacturacionPaciente.findOne({ where: { numAdmision: data.numAdmision } });
    if (existing) throw ApiError.conflict("Ya existe facturación con este número de admisión");

    return await FacturacionPaciente.create({
      ...data,
      valorPaciente: 0,
      valorCopago: 0,
      estado: data.estado || "pendiente",
    });
  }

  public async calculateTotal(id: number): Promise<number> {
    const billing = await FacturacionPaciente.findByPk(id);
    if (!billing) throw ApiError.notFound("Facturación no encontrada");
    return Number(billing.valorTotal);
  }

  public async calculateCopago(idPaciente: number): Promise<number> {
    const billings = await FacturacionPaciente.findAll({
      where: { idPaciente, estado: "pendiente" },
    });

    if (billings.length === 0) return 0;

    return billings.reduce((total, bill) => total + Number(bill.valorTotal) * 0.1, 0);
  }

  public async findByPatient(idPaciente: number): Promise<FacturacionPaciente[]> {
    return await FacturacionPaciente.findAll({
      where: { idPaciente },
      order: [["fechaAdmision", "DESC"]],
      include: ["paciente", "contrato", "diagnostico", "procedimiento"],
    });
  }

  public async findById(id: number): Promise<FacturacionPaciente | null> {
    return await FacturacionPaciente.findByPk(id, {
      include: ["paciente", "contrato", "diagnostico", "procedimiento", "cama", "especialidad"],
    });
  }

  public async findAll(limit = 50, offset = 0): Promise<FacturacionPaciente[]> {
    return await FacturacionPaciente.findAll({
      limit,
      offset,
      order: [["fechaAdmision", "DESC"]],
      include: ["paciente", "contrato"],
    });
  }

  public async updateStatus(id: number, estado: string): Promise<FacturacionPaciente> {
    const billing = await FacturacionPaciente.findByPk(id);
    if (!billing) throw ApiError.notFound("Facturación no encontrada");
    await billing.update({ estado });
    return billing;
  }

  public async getTotalByDateRange(startDate: string, endDate: string): Promise<number> {
    const billings = await FacturacionPaciente.findAll({
      where: {
        fechaAdmision: { [Op.between]: [startDate, endDate] },
        estado: "pagado",
      },
    });

    return billings.reduce((total, bill) => total + Number(bill.valorTotal), 0);
  }

  public async getPendingBillings(): Promise<FacturacionPaciente[]> {
    return await FacturacionPaciente.findAll({
      where: { estado: "pendiente" },
      include: ["paciente"],
      order: [["fechaAdmision", "ASC"]],
    });
  }
}

export default new BillingService();