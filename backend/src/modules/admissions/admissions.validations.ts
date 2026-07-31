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
  body("companion").optional().isObject().withMessage("Acompañante debe ser un objeto"),
  body("companion.firstName").optional({ values: "falsy" }).isString().withMessage("Nombre del acompañante inválido"),
  body("companion.lastName").optional({ values: "falsy" }).isString().withMessage("Apellido del acompañante inválido"),
  body("companion.documentTypeId").optional().isInt({ min: 1 }).withMessage("Tipo de documento del acompañante inválido"),
  body("companion.document").optional({ values: "falsy" }).isLength({ max: 30 }).withMessage("Documento del acompañante inválido"),
  body("companion.address").optional({ values: "falsy" }).isString().withMessage("Dirección del acompañante inválida"),
  body("companion.relationshipId").optional().isInt({ min: 1 }).withMessage("Parentesco del acompañante inválido"),
  body("companion.phone").optional({ values: "falsy" }).isString().withMessage("Teléfono del acompañante inválido"),
];
