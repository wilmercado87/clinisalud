import { Op } from "sequelize";
import FacturacionPaciente from "../models/FacturacionPaciente";
import Paciente from "../models/Paciente";

export class BillingService {
  public async createBilling(billingData: {
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
  }): Promise<FacturacionPaciente> {
    const existing = await FacturacionPaciente.findOne({
      where: { numAdmision: billingData.numAdmision },
    });

    if (existing) {
      throw new Error("409:Ya existe una facturación con este número de admisión");
    }

    const billing = await FacturacionPaciente.create({
      ...billingData,
      valorPaciente: 0,
      valorCopago: 0,
      estado: billingData.estado || "pendiente",
    });

    return billing;
  }

  public async calculateTotal(id: number): Promise<number> {
    const billing = await FacturacionPaciente.findByPk(id);
    if (!billing) {
      throw new Error("404:Facturación no encontrada");
    }
    return Number(billing.valorTotal);
  }

  public async calculateCopago(idPaciente: number): Promise<number> {
    const billings = await FacturacionPaciente.findAll({
      where: { idPaciente, estado: "pendiente" },
    });

    const paciente = await Paciente.findByPk(idPaciente);
    if (!paciente) {
      throw new Error("404:Paciente no encontrado");
    }

    let totalCopago = 0;
    for (const bill of billings) {
      totalCopago += Number(bill.valorTotal) * 0.1;
    }

    return totalCopago;
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

  public async findAll(limit: number = 50, offset: number = 0): Promise<FacturacionPaciente[]> {
    return await FacturacionPaciente.findAll({
      limit,
      offset,
      order: [["fechaAdmision", "DESC"]],
      include: ["paciente", "contrato"],
    });
  }

  public async updateStatus(id: number, estado: string): Promise<FacturacionPaciente | null> {
    const billing = await FacturacionPaciente.findByPk(id);
    if (!billing) {
      throw new Error("404:Facturación no encontrada");
    }
    await billing.update({ estado });
    return billing;
  }

  public async getTotalByDateRange(startDate: string, endDate: string): Promise<number> {
    const billings = await FacturacionPaciente.findAll({
      where: {
        fechaAdmision: {
          [Op.between]: [startDate, endDate],
        },
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