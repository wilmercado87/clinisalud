import { Op } from "sequelize";
import Triage from "../models/Triage";

export class TriageService {
  public async getAllTriageLevels(): Promise<Triage[]> {
    return await Triage.findAll({ order: [["id", "ASC"]] });
  }

  public async findTriageById(id: number): Promise<Triage | null> {
    return await Triage.findByPk(id);
  }

  public async findTriageByType(tipoTriage: string): Promise<Triage | null> {
    return await Triage.findOne({ where: { tipoTriage } });
  }

  public async findTriageByClassification(clasificacion: string): Promise<Triage | null> {
    return await Triage.findOne({ where: { clasificacion: { [Op.iLike]: `%${clasificacion}%` } } });
  }

  public async getTriageByPriority(priorityLevel: number): Promise<Triage | null> {
    return await Triage.findByPk(priorityLevel);
  }

  public async getUrgentTriage(): Promise<Triage | null> {
    return await Triage.findOne({ where: { tipoTriage: "I" } });
  }

  public async getEmergencyWaitTime(tipoTriage: string): Promise<string | null> {
    const triage = await this.findTriageByType(tipoTriage);
    return triage?.tiempoEspera || null;
  }
}

export default new TriageService();