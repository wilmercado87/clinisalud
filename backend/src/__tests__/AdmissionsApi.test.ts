import request from "supertest";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario";

const mockLookupPatient = jest.fn();
const mockCreateAdmission = jest.fn();
const mockGetCensus = jest.fn();
const mockUpdateAdmission = jest.fn();
const mockFindByAdmissionNumber = jest.fn();

jest.mock("../modules/admissions/admissions.service", () => ({
  AdmissionsService: jest.fn().mockImplementation(() => ({
    lookupPatient: mockLookupPatient,
    createAdmission: mockCreateAdmission,
    getCensus: mockGetCensus,
    updateAdmission: mockUpdateAdmission,
    findByAdmissionNumber: mockFindByAdmissionNumber,
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

    it("should allow admission without roomId (INV-ADM-01)", async () => {
      const { roomId: _roomId, ...bodyWithoutRoom } = validBody;
      mockCreateAdmission.mockResolvedValue({
        admissionNumber: "ADM-20260801-0001",
        patient: { id: 1, documentTypeId: 1, document: "12345" },
        admission: { admissionNumber: "ADM-20260801-0001", roomId: null },
      });

      const res = await request(app)
        .post("/api/v1/admissions")
        .set("Authorization", `Bearer ${validToken}`)
        .send(bodyWithoutRoom);

      expect(res.status).toBe(201);
      expect(mockCreateAdmission).toHaveBeenCalledWith(
        expect.not.objectContaining({ roomId: expect.anything() }),
        1,
        "admin@test.com",
        "SUPER_ADMIN",
      );
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

  describe("PATCH /api/v1/admissions/:admissionNumber", () => {
    it("should reject without token", async () => {
      const res = await request(app).patch("/api/v1/admissions/ADM-001").send({ roomId: 1 });
      expect(res.status).toBe(401);
    });

    it("should reject invalid roomId", async () => {
      const res = await request(app)
        .patch("/api/v1/admissions/ADM-001")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ roomId: 0 });
      expect(res.status).toBe(422);
      expect(res.body.errors.some((e: any) => e.field === "roomId")).toBe(true);
    });

    it("should update admission and pass user id to service (INV-ADM-07)", async () => {
      mockUpdateAdmission.mockResolvedValue({
        admissionNumber: "ADM-001",
        roomId: 2,
        authorizations: [],
      });

      const res = await request(app)
        .patch("/api/v1/admissions/ADM-001")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ roomId: 2 });

      expect(res.status).toBe(200);
      expect(res.body.roomId).toBe(2);
      expect(mockUpdateAdmission).toHaveBeenCalledWith("ADM-001", { roomId: 2 }, 1);
    });

    it("should reject invalid observations", async () => {
      const res = await request(app)
        .patch("/api/v1/admissions/ADM-001")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ observations: 123 });
      expect(res.status).toBe(422);
      expect(res.body.errors.some((e: any) => e.field === "observations")).toBe(true);
    });

    it("should update admission with observations (INV-ADM-07)", async () => {
      mockUpdateAdmission.mockResolvedValue({
        admissionNumber: "ADM-001",
        roomId: 1,
        observations: "Requiere control diario",
        authorizations: [],
      });

      const res = await request(app)
        .patch("/api/v1/admissions/ADM-001")
        .set("Authorization", `Bearer ${validToken}`)
        .send({ observations: "Requiere control diario" });

      expect(res.status).toBe(200);
      expect(res.body.observations).toBe("Requiere control diario");
      expect(mockUpdateAdmission).toHaveBeenCalledWith(
        "ADM-001",
        { observations: "Requiere control diario" },
        1,
      );
    });

    it("should update admission with authorizations only (INV-ADM-07)", async () => {
      mockUpdateAdmission.mockResolvedValue({
        admissionNumber: "ADM-001",
        roomId: null,
        authorizations: [],
      });

      const res = await request(app)
        .patch("/api/v1/admissions/ADM-001")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          authorizations: [{ authTypeId: 1, authNumber: "AUTH-001", mapiissCode: "CUP-001", quantity: 1 }],
        });

      expect(res.status).toBe(200);
      expect(mockUpdateAdmission).toHaveBeenCalledWith(
        "ADM-001",
        { authorizations: [{ authTypeId: 1, authNumber: "AUTH-001", mapiissCode: "CUP-001", quantity: 1 }] },
        1,
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

  describe("GET /api/v1/admissions/:admissionNumber", () => {
    it("should reject without token", async () => {
      const res = await request(app).get("/api/v1/admissions/ADM-001");
      expect(res.status).toBe(401);
    });

    it("should reject invalid admission number param", async () => {
      const res = await request(app)
        .get(`/api/v1/admissions/${"A".repeat(51)}`)
        .set("Authorization", `Bearer ${validToken}`);
      expect(res.status).toBe(422);
    });

    it("should return patient with active admission by number (INV-ADM-02)", async () => {
      mockFindByAdmissionNumber.mockResolvedValue({
        id: 1,
        firstName: "Juan",
        lastName: "Perez",
        epsId: 7,
        activeAdmission: {
          admissionNumber: "ADM-20260801-0001",
          admissionDate: "2026-08-01 10:30:00",
          roomId: 5,
          observations: null,
          authorizations: [
            { authTypeId: 2, authNumber: "AUTH-001", mapiissCode: "CUP-001", quantity: 1, feeScheduleId: 1 },
          ],
        },
      });

      const res = await request(app)
        .get("/api/v1/admissions/ADM-20260801-0001")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.firstName).toBe("Juan");
      expect(res.body.activeAdmission.admissionNumber).toBe("ADM-20260801-0001");
      expect(mockFindByAdmissionNumber).toHaveBeenCalledWith("ADM-20260801-0001");
    });
  });
});
