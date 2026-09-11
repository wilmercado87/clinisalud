import Triage from "../../models/Triage";
import { CreateTriageResponse, TriageResponse } from "./triage.types";

export const toTriageResponse = (
  triage: Triage,
  patient: { id: number; documentTypeId: number; document: string },
): CreateTriageResponse => {
  const json = triage.toJSON() as TriageResponse;
  return { triage: json, patient };
};
