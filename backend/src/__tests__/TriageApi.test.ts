import request from "supertest";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario";

const mockCreateTriage = jest.fn();

jest.mock("../modules/triage/triage.service", () => ({
  TriageService: jest.fn().mockImplementation(() => ({
    createTriage: mockCreateTriage,
  })),
}));

jest.spyOn(Usuario, "findByPk").mockResolvedValue({
  id: 1,
  isActive: true,
  email: "admin@test.com",
} as any);

const app = require("../app").default;

const validToken = jwt.sign(
  { id: 1, role: "SUPER_ADMIN", email: "admin@test.com" },
  process.env.JWT_SECRET || "clinisalud_secret",
  { expiresIn: "1h" },
);

const medicToken = jwt.sign(
  { id: 2, role: "MEDICO", email: "medic@test.com" },
  process.env.JWT_SECRET || "clinisalud_secret",
  { expiresIn: "1h" },
);

const validBody = {
  isNewPatient: false,
  documentTypeId: 1,
  document: "12345",
  priorityTypeId: 1,
  epsId: 1,
  diagnosticId: 1,
};

describe("Triage API (INV-HC-03)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reject without token", async () => {
    const res = await request(app).post("/api/v1/triage").send(validBody);
    expect(res.status).toBe(401);
  });

  it("should register a triage and pass the authenticated user to the service", async () => {
    mockCreateTriage.mockResolvedValue({
      triage: { id: 1, attentionDate: "2026-08-21 10:00:00" },
      patient: { id: 7, documentTypeId: 1, document: "12345" },
    });

    const res = await request(app)
      .post("/api/v1/triage")
      .set("Authorization", `Bearer ${validToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(mockCreateTriage).toHaveBeenCalledWith(expect.objectContaining(validBody), 1);
  });

  it("should allow MEDICO role to register a triage", async () => {
    mockCreateTriage.mockResolvedValue({
      triage: { id: 2 },
      patient: { id: 7 },
    });

    const res = await request(app)
      .post("/api/v1/triage")
      .set("Authorization", `Bearer ${medicToken}`)
      .send(validBody);

    expect(res.status).toBe(201);
  });

  it("should reject invalid body (missing priorityTypeId)", async () => {
    const { priorityTypeId: _priorityTypeId, ...invalidBody } = validBody;

    const res = await request(app)
      .post("/api/v1/triage")
      .set("Authorization", `Bearer ${validToken}`)
      .send(invalidBody);

    expect(res.status).toBe(422);
  });
});
