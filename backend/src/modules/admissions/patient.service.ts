import { Transaction } from "sequelize";
import Paciente from "../../models/Paciente";
import { ApiError } from "../../middlewares/ErrorHandlerMiddleware";
import { ERROR_MESSAGES_ADMISION, PATIENT_STATUS } from "../../constants";
import { getStatusIdByDescription } from "./admission-status.util";
import { CreateAdmissionRequest } from "./admissions.types";

const PATIENT_LOOKUP_INCLUDE = [
  { association: "documentType", attributes: ["id", "code", "description"] },
  { association: "gender", attributes: ["id", "description"] },
  { association: "userType", attributes: ["id", "name"] },
];

export class PatientService {
  public async findByDocument(
    documentTypeId: number,
    document: string,
    t?: Transaction,
  ): Promise<Paciente | null> {
    return await Paciente.findOne({
      where: { documentTypeId, document },
      include: PATIENT_LOOKUP_INCLUDE,
      transaction: t,
    });
  }

  public async ensurePatient(
    data: CreateAdmissionRequest,
    userId: number,
    t: Transaction,
  ): Promise<number> {
    if (data.isNewPatient) return await this.createNewPatient(data, userId, t);
    return await this.updateExistingPatient(data, t);
  }

  private async createNewPatient(
    data: CreateAdmissionRequest,
    userId: number,
    t: Transaction,
  ): Promise<number> {
    if (!data.firstName) throw ApiError.badRequest(ERROR_MESSAGES_ADMISION.FIRST_NAME_REQUIRED);
    if (!data.lastName) throw ApiError.badRequest(ERROR_MESSAGES_ADMISION.LAST_NAME_REQUIRED);

    const existingPatient = await this.findByDocument(data.documentTypeId, data.document, t);
    if (existingPatient) {
      throw ApiError.conflict(ERROR_MESSAGES_ADMISION.PATIENT_ALREADY_EXISTS);
    }

    const activeStatusId = await getStatusIdByDescription(PATIENT_STATUS.ACTIVE, t);

    const newPatient = await Paciente.create(
      {
        documentTypeId: data.documentTypeId,
        document: data.document,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        age: data.age || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || null,
        disability: data.disability || "NO",
        userTypeId: data.userTypeId || 1,
        birthDate: data.birthDate || "",
        genderId: data.genderId || 1,
        statusId: activeStatusId,
        systemUserId: userId,
      },
      { transaction: t },
    );
    return newPatient.id;
  }

  private async updateExistingPatient(
    data: CreateAdmissionRequest,
    t: Transaction,
  ): Promise<number> {
    const existingPatient = await this.findByDocument(data.documentTypeId, data.document, t);
    if (!existingPatient) {
      throw ApiError.notFound(ERROR_MESSAGES_ADMISION.PATIENT_NOT_FOUND_WITH_DATA);
    }

    await existingPatient.update(
      {
        firstName: data.firstName?.trim() || existingPatient.firstName,
        lastName: data.lastName?.trim() || existingPatient.lastName,
        age: data.age ?? existingPatient.age,
        address: data.address !== undefined ? data.address : existingPatient.address,
        phone: data.phone !== undefined ? data.phone : existingPatient.phone,
        email: data.email !== undefined ? data.email || null : existingPatient.email,
        disability: data.disability?.trim() || existingPatient.disability,
        userTypeId: data.userTypeId ?? existingPatient.userTypeId,
        birthDate: data.birthDate?.trim() || existingPatient.birthDate,
        genderId: data.genderId ?? existingPatient.genderId,
      },
      { transaction: t },
    );
    return existingPatient.id;
  }
}