import { query, body } from "express-validator";

export const patientLookupValidation = [
  query("documentTypeId")
    .isInt({ min: 1 })
    .withMessage("Tipo de documento debe ser un número válido"),
  query("document")
    .isLength({ min: 1, max: 30 })
    .withMessage("Documento es requerido y debe tener máximo 30 caracteres"),
];

export const createAdmissionValidation = [
  body("isNewPatient").isBoolean().withMessage("isNewPatient debe ser booleano"),
  body("documentTypeId").isInt({ min: 1 }).withMessage("Tipo de documento es requerido"),
  body("document").isLength({ min: 1, max: 30 }).withMessage("Documento es requerido"),
  body("epsId").isInt({ min: 1 }).withMessage("EPS es requerida"),
  body("roomId").isInt({ min: 1 }).withMessage("Cama es requerida"),
];
