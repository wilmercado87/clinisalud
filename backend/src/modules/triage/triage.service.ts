import { Transaction } from "sequelize";
import sequelize from "../../config/database";
import Triage from "../../models/Triage";
import TipoTriage from "../../models/TipoTriage";
import Convenio from "../../models/Convenio";
import Diagnostico from "../../models/Diagnostico";
import { ApiError } from "../../middlewares/ErrorHandlerMiddleware";
import { ERROR_MESSAGES_ADMISION, ERROR_MESSAGES_TRIAGE } from "../../constants";
import { formatLocalDateTime } from "../../utils/datetime";
import { PatientService } from "../admissions/patient.service";
import { toTriageResponse } from "./triage.mapper";
import { CreateTriageRequest, CreateTriageResponse } from "./triage.types";

export class TriageService {
  private readonly patientService = new PatientService();

  public async createTriage(
    data: CreateTriageRequest,
    systemUserId: number,
  ): Promise<CreateTriageResponse> {
    return await sequelize.transaction(async (t: Transaction) => {
      const pacienteId = await this.patientService.ensurePatient(data, systemUserId, t);
      await this.assertPriorityExists(data.priorityTypeId, t);
      await this.assertEpsExists(data.epsId, t);
      await this.assertDiagnosticExists(data.diagnosticId, t);

      const triage = await Triage.create(
        {
          priorityTypeId: data.priorityTypeId,
          pacienteId,
          attentionDate: formatLocalDateTime(new Date()),
          epsId: data.epsId,
          diagnosticId: data.diagnosticId,
          systemUserId,
        },
        { transaction: t },
      );

      return toTriageResponse(triage, {
        id: pacienteId,
        documentTypeId: data.documentTypeId,
        document: data.document,
      });
    });
  }

  private async assertPriorityExists(priorityTypeId: number, t: Transaction): Promise<void> {
    const priority = await TipoTriage.findByPk(priorityTypeId, { transaction: t });
    if (!priority) throw ApiError.badRequest(ERROR_MESSAGES_TRIAGE.TRIAGE_PRIORITY_NOT_FOUND);
  }

  private async assertEpsExists(epsId: number, t: Transaction): Promise<void> {
    const eps = await Convenio.findByPk(epsId, { transaction: t });
    if (!eps) throw ApiError.badRequest(ERROR_MESSAGES_ADMISION.EPS_NOT_FOUND);
  }

  private async assertDiagnosticExists(diagnosticId: number, t: Transaction): Promise<void> {
    const diagnostic = await Diagnostico.findByPk(diagnosticId, { transaction: t });
    if (!diagnostic) throw ApiError.badRequest(ERROR_MESSAGES_TRIAGE.TRIAGE_DIAGNOSTIC_NOT_FOUND);
  }
}
