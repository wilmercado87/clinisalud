import { Op, Transaction } from "sequelize";
import sequelize from "../../config/database";
import Admision from "../../models/Admision";
import Paciente from "../../models/Paciente";
import Cama from "../../models/Cama";
import Convenio from "../../models/Convenio";
import TipoEstado from "../../models/TipoEstado";
import Autorizacion from "../../models/Autorizacion";
import { ApiError } from "../../middlewares/ErrorHandlerMiddleware";
import { NotificationsService } from "../notifications/notifications.service";

interface PatientLookupQuery {
  documentTypeId: number;
  document: string;
}

interface CreateAdmissionData {
  isNewPatient: boolean;
  documentTypeId: number;
  document: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  genderId?: number;
  age?: string;
  disability?: string;
  userTypeId?: number;
  address?: string;
  phone?: string;
  email?: string;
  epsId: number;
  roomId: number;
  observations?: string;
  authorizations?: {
    authTypeId: number;
    authNumber: string;
    mapiissCode: string;
    quantity?: number;
  }[];
}

interface CreateAdmissionResult {
  admissionNumber: string;
  patient: any;
  admission: any;
}

interface AdmissionCensusRow {
  admissionNumber: string;
  patient: any;
  room: any;
  eps: any;
  admissionDate: string;
  observations: string | null;
  statusId: number;
}

export class AdmissionsService {
  private readonly notificationsService = new NotificationsService();

  public async lookupPatient(query: PatientLookupQuery) {
    const patient = await Paciente.findOne({
      where: { documentTypeId: query.documentTypeId, document: query.document },
      include: [
        { association: "documentType", attributes: ["id", "code", "description"] },
        { association: "gender", attributes: ["id", "code", "description"] },
        { association: "userType", attributes: ["id", "code", "name"] },
      ],
    });
    return patient ? patient.toJSON() : null;
  }

  public async createAdmission(
    data: CreateAdmissionData,
    userId: number,
    userName: string,
    userRole: string,
  ): Promise<CreateAdmissionResult> {
    const errors: string[] = [];

    if (!data.documentTypeId) errors.push("Tipo de documento es requerido");
    if (!data.document) errors.push("Número de documento es requerido");
    if (!data.epsId) errors.push("EPS es requerida");
    if (!data.roomId) errors.push("Cama es requerida");

    if (errors.length > 0) {
      throw ApiError.badRequest(errors.join("; "));
    }

    return await sequelize.transaction(async (t: Transaction) => {
      let patientId: number;

      if (data.isNewPatient) {
        if (!data.firstName) throw ApiError.badRequest("Nombre del paciente es requerido");
        if (!data.lastName) throw ApiError.badRequest("Apellido del paciente es requerido");

        const existingPatient = await Paciente.findOne({
          where: { documentTypeId: data.documentTypeId, document: data.document },
          transaction: t,
        });
        if (existingPatient) {
          throw ApiError.conflict("Ya existe un paciente con ese tipo y número de documento");
        }

        const activeStatus = await TipoEstado.findOne({ where: { id: 1 }, transaction: t });
        const statusId = activeStatus ? activeStatus.id : 1;

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
            statusId,
            systemUserId: userId,
          },
          { transaction: t },
        );
        patientId = newPatient.id;
      } else {
        const existingPatient = await Paciente.findOne({
          where: { documentTypeId: data.documentTypeId, document: data.document },
          transaction: t,
        });
        if (!existingPatient) {
          throw ApiError.notFound("Paciente no encontrado con los datos proporcionados");
        }
        patientId = existingPatient.id;
      }

      const bed = await Cama.findByPk(data.roomId, { transaction: t });
      if (!bed) throw ApiError.notFound("Cama no encontrada");
      if (bed.bedStatus !== 0) {
        throw ApiError.conflict("La cama seleccionada no está disponible");
      }

      const eps = await Convenio.findByPk(data.epsId, { transaction: t });
      if (!eps) throw ApiError.notFound("EPS no encontrada");

      const today = new Date().toISOString().slice(0, 10);
      const todayPrefix = today.replace(/-/g, "");
      const todayCount = await Admision.count({
        where: { admissionDate: { [Op.startsWith]: today } },
        transaction: t,
      });
      const seq = String(todayCount + 1).padStart(4, "0");
      const admissionNumber = `ADM-${todayPrefix}-${seq}`;

      const activeStatus = await TipoEstado.findOne({ where: { id: 1 }, transaction: t });
      const statusId = activeStatus ? activeStatus.id : 1;

      const admission = await Admision.create(
        {
          admissionNumber,
          patientId,
          admissionDate: today,
          roomId: data.roomId,
          epsId: data.epsId,
          observations: data.observations || null,
          statusId,
          systemUserId: userId,
        },
        { transaction: t },
      );

      bed.bedStatus = 1;
      await bed.save({ transaction: t });

      if (data.authorizations && data.authorizations.length > 0) {
        const authData = data.authorizations.map((a) => ({
          admissionNumber,
          authTypeId: a.authTypeId,
          authNumber: a.authNumber,
          mapiissCode: a.mapiissCode,
          quantity: a.quantity || 1,
          systemUserId: userId,
        }));
        await Autorizacion.bulkCreate(authData, { transaction: t });
      }

      const admissionJson = admission.toJSON() as any;

      this.notificationsService
        .createAndDispatch(
          "ADMISSION_CREATED",
          "Nueva admisión registrada",
          `Se registró la admisión ${admissionNumber} para paciente ${data.firstName || ""} ${data.lastName || ""}`,
          userId,
          userName,
          userRole,
          `/dashboard/admission`,
          "Ver admisiones",
        )
        .catch(() => {});

      return {
        admissionNumber,
        patient: { id: patientId, documentTypeId: data.documentTypeId, document: data.document },
        admission: admissionJson,
      };
    });
  }

  public async getCensus(): Promise<AdmissionCensusRow[]> {
    const activeStatus = await TipoEstado.findOne({ where: { id: 1 } });
    const statusId = activeStatus ? activeStatus.id : 1;

    const admissions = await Admision.findAll({
      where: { statusId },
      include: [
        { association: "patient", include: [
          { association: "documentType", attributes: ["id", "code", "description"] },
        ]},
        { association: "room" },
        { association: "eps" },
      ],
      order: [["admissionDate", "DESC"]],
    });

    return admissions.map((adm) => {
      const a = adm.toJSON() as any;
      return {
        admissionNumber: a.admissionNumber,
        patient: a.patient,
        room: a.room,
        eps: a.eps,
        admissionDate: a.admissionDate,
        observations: a.observations,
        statusId: a.statusId,
      };
    });
  }
}
