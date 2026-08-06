import request from "supertest";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario";

const mockLookupPatient = jest.fn();
const mockCreateAdmission = jest.fn();
const mockGetCensus = jest.fn();

jest.mock("../modules/admissions/admissions.service", () => ({
  AdmissionsService: jest.fn().mockImplementation(() => ({
    lookupPatient: mockLookupPatient,
    createAdmission: mockCreateAdmission,
    getCensus: mockGetCensus,
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

const validBody = {
  isNewPatient: true,
  documentTypeId: 1,
  document: "12345",
  firstName: "Juan",
  lastName: "Perez",
  epsId: 1,
  roomId: 1,
  observations: "Ingreso por urgencias",
};

describe("Admissions API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/v1/admissions", () => {
    it("should reject without token", async () => {
      const res = await request(app).post("/api/v1/admissions").send(validBody);
      expect(res.status).toBe(401);
    });

    it("should reject when roomId is missing (INV-ADM-01)", async () => {
      const { roomId: _roomId, ...bodyWithoutRoom } = validBody;
      const res = await request(app)
        .post("/api/v1/admissions")
        .set("Authorization", `Bearer ${validToken}`)
        .send(bodyWithoutRoom);
      expect(res.status).toBe(422);
      expect(res.body.errors.some((e: any) => e.field === "roomId")).toBe(true);
    });

    it("should reject invalid authorizations (INV-ADM-02)", async () => {
      const res = await request(app)
        .post("/api/v1/admissions")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          ...validBody,
          authorizations: [{ authTypeId: 1, mapiissCode: "CUP-001" }],
        });
      expect(res.status).toBe(422);
      expect(res.body.errors.some((e: any) => e.field === "authorizations[0].authNumber")).toBe(true);
    });

    it("should create admission and pass user info to service", async () => {
      mockCreateAdmission.mockResolvedValue({
        admissionNumber: "ADM-20260801-0001",
        patient: { id: 1, documentTypeId: 1, document: "12345" },
        admission: { admissionNumber: "ADM-20260801-0001" },
      });

      const res = await request(app)
        .post("/api/v1/admissions")
        .set("Authorization", `Bearer ${validToken}`)
        .send(validBody);

      expect(res.status).toBe(201);
      expect(mockCreateAdmission).toHaveBeenCalledWith(
        expect.objectContaining({ document: "12345", roomId: 1 }),
        1,
        "admin@test.com",
        "SUPER_ADMIN",
      );
    });
  });

  describe("GET /api/v1/admissions/patient-lookup", () => {
    it("should reject invalid query params", async () => {
      const res = await request(app)
        .get("/api/v1/admissions/patient-lookup")
        .set("Authorization", `Bearer ${validToken}`)
        .query({ documentTypeId: "abc", document: "" });
      expect(res.status).toBe(422);
    });

    it("should return patient data", async () => {
      mockLookupPatient.mockResolvedValue({ id: 1, firstName: "Juan" });

      const res = await request(app)
        .get("/api/v1/admissions/patient-lookup")
        .set("Authorization", `Bearer ${validToken}`)
        .query({ documentTypeId: 1, document: "12345" });

      expect(res.status).toBe(200);
      expect(res.body.firstName).toBe("Juan");
    });
  });

  describe("GET /api/v1/admissions/census", () => {
    it("should return census rows", async () => {
      mockGetCensus.mockResolvedValue([]);

      const res = await request(app)
        .get("/api/v1/admissions/census")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
