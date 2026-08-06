import Admision from "../../models/Admision";
import Paciente from "../../models/Paciente";
import {
  AdmissionResponse,
  CensusRowResponse,
  DischargeAdmissionResponse,
  PatientLookupResponse,
} from "./admissions.types";

export const toPatientLookupResponse = (
  patient: Paciente,
  epsId: number | null,
  activeAdmission: { admissionNumber: string; admissionDate: string } | null,
): PatientLookupResponse => {
  const json = patient.toJSON() as PatientLookupResponse;
  return { ...json, id: patient.id, epsId, activeAdmission };
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