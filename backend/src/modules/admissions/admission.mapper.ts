import Admision from "../../models/Admision";
import Paciente from "../../models/Paciente";
import {
  AdmissionAuthorization,
  AdmissionResponse,
  CensusRowResponse,
  DischargeAdmissionResponse,
  PatientLookupResponse,
} from "./admissions.types";

export const toPatientLookupResponse = (
  patient: Paciente,
  epsId: number | null,
  activeAdmission: {
    admissionNumber: string;
    admissionDate: string;
    statusId: number;
    state: string;
    roomId: number | null;
    observations: string | null;
    authorizations: AdmissionAuthorization[];
  } | null,
): PatientLookupResponse => {
  const json = patient.toJSON() as PatientLookupResponse;
  return { ...json, id: patient.id, epsId, activeAdmission };
};

export const attachCupsDescriptions = (
  authorizations: Array<{
    authTypeId: number;
    authNumber: string;
    mapiissCode: string;
    quantity: number;
    feeScheduleId: number;
    authType?: { id: number; description: string } | null;
  }>,
  cupsRows: Array<{ mapiissCode: string; feeScheduleId: number; mapiissDescription: string }>,
): AdmissionAuthorization[] => {
  const descriptionByService = new Map(
    cupsRows.map((cups) => [`${cups.mapiissCode}|${cups.feeScheduleId}`, cups.mapiissDescription]),
  );

  return authorizations.map((authorization) => ({
    authTypeId: authorization.authTypeId,
    authTypeName: authorization.authType?.description ?? undefined,
    authNumber: authorization.authNumber,
    mapiissCode: authorization.mapiissCode,
    quantity: authorization.quantity,
    feeScheduleId: authorization.feeScheduleId,
    mapiissDescription:
      descriptionByService.get(`${authorization.mapiissCode}|${authorization.feeScheduleId}`) ?? undefined,
  }));
};

export const toAdmissionResponse = (admission: Admision): AdmissionResponse =>
  admission.toJSON() as AdmissionResponse;

export const toCensusRowResponse = (
  admission: Admision,
  state: string,
): CensusRowResponse => {
  const json = admission.toJSON() as CensusRowResponse;
  return {
    admissionNumber: json.admissionNumber,
    patient: json.patient,
    room: json.room,
    eps: json.eps,
    admissionDate: json.admissionDate,
    observations: json.observations,
    statusId: json.statusId,
    state,
  };
};

export const toDischargeResponse = (
  admissionNumber: string,
  statusId: number,
  roomId: number | null,
  dischargedAt: Date,
): DischargeAdmissionResponse => ({
  admissionNumber,
  statusId,
  roomId,
  dischargedAt,
});