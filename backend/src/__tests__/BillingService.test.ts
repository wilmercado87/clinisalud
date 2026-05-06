import { BillingService } from '../services/BillingService';
import FacturacionPaciente from '../models/FacturacionPaciente';
import { ApiError } from '../middlewares/ErrorHandlerMiddleware';

jest.mock('../models/FacturacionPaciente');

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(() => {
    service = new BillingService();
    jest.clearAllMocks();
  });

  describe('createBilling', () => {
    const validBillingData = {
      numAdmision: 'ADM2026-001',
      idOrigenCta: 1,
      idTarifario: 1,
      idTipoServicio: 1,
      idPaciente: 1,
      fechaAdmision: '2026-01-01',
      valorTotal: 100000,
    };

    it('should create billing successfully', async () => {
      (FacturacionPaciente.findOne as jest.Mock).mockResolvedValue(null);
      (FacturacionPaciente.create as jest.Mock).mockResolvedValue({
        ...validBillingData,
        id: 1,
        valorPaciente: 0,
        valorCopago: 0,
        estado: 'pendiente',
      });

      const result = await service.createBilling(validBillingData);

      expect(FacturacionPaciente.findOne).toHaveBeenCalledWith({
        where: { numAdmision: 'ADM2026-001' },
      });
      expect(FacturacionPaciente.create).toHaveBeenCalledWith({
        ...validBillingData,
        valorPaciente: 0,
        valorCopago: 0,
        estado: 'pendiente',
      });
      expect(result).toEqual(expect.objectContaining(validBillingData));
    });

    it('should throw conflict if billing exists', async () => {
      (FacturacionPaciente.findOne as jest.Mock).mockResolvedValue({ numAdmision: 'ADM2026-001' });

      await expect(service.createBilling(validBillingData)).rejects.toThrow(ApiError);
      await expect(service.createBilling(validBillingData)).rejects.toThrow('Ya existe');
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total for billing', async () => {
      (FacturacionPaciente.findByPk as jest.Mock).mockResolvedValue({ id: 1, valorTotal: 100000 });

      const result = await service.calculateTotal(1);

      expect(result).toBe(100000);
    });

    it('should throw notFound if billing does not exist', async () => {
      (FacturacionPaciente.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(service.calculateTotal(999)).rejects.toThrow(ApiError);
    });
  });

  describe('calculateCopago', () => {
    it('should calculate 10% copago for pending billings', async () => {
      (FacturacionPaciente.findAll as jest.Mock).mockResolvedValue([
        { valorTotal: 100000 },
        { valorTotal: 50000 },
      ]);

      const result = await service.calculateCopago(1);

      expect(result).toBe(15000);
    });

    it('should return 0 if no pending billings', async () => {
      (FacturacionPaciente.findAll as jest.Mock).mockResolvedValue([]);

      const result = await service.calculateCopago(1);

      expect(result).toBe(0);
    });
  });

  describe('findByPatient', () => {
    it('should find billings by patient id', async () => {
      const mockBillings = [{ id: 1 }, { id: 2 }];
      (FacturacionPaciente.findAll as jest.Mock).mockResolvedValue(mockBillings);

      const result = await service.findByPatient(1);

      expect(FacturacionPaciente.findAll).toHaveBeenCalledWith({
        where: { idPaciente: 1 },
        order: [['fechaAdmision', 'DESC']],
        include: ['paciente', 'contrato', 'diagnostico', 'procedimiento'],
      });
      expect(result).toEqual(mockBillings);
    });
  });

  describe('updateStatus', () => {
    it('should update billing status', async () => {
      const mockBilling = {
        id: 1,
        estado: 'pendiente',
        update: jest.fn().mockResolvedValue({}),
      };
      (FacturacionPaciente.findByPk as jest.Mock).mockResolvedValue(mockBilling);

      const result = await service.updateStatus(1, 'pagado');

      expect(mockBilling.update).toHaveBeenCalledWith({ estado: 'pagado' });
    });

    it('should throw notFound if billing does not exist', async () => {
      (FacturacionPaciente.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(service.updateStatus(999, 'pagado')).rejects.toThrow(ApiError);
    });
  });

  describe('getTotalByDateRange', () => {
    it('should calculate total for paid billings in date range', async () => {
      (FacturacionPaciente.findAll as jest.Mock).mockResolvedValue([
        { valorTotal: 100000 },
        { valorTotal: 50000 },
      ]);

      const result = await service.getTotalByDateRange('2026-01-01', '2026-01-31');

      expect(result).toBe(150000);
    });
  });

  describe('getPendingBillings', () => {
    it('should return all pending billings', async () => {
      const mockBillings = [{ id: 1, estado: 'pendiente' }];
      (FacturacionPaciente.findAll as jest.Mock).mockResolvedValue(mockBillings);

      const result = await service.getPendingBillings();

      expect(FacturacionPaciente.findAll).toHaveBeenCalledWith({
        where: { estado: 'pendiente' },
        include: ['paciente'],
        order: [['fechaAdmision', 'ASC']],
      });
      expect(result).toEqual(mockBillings);
    });
  });
});