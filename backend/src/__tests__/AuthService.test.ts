jest.mock('bcryptjs', () => ({
  compare: jest.fn((a: string, b: string) => Promise.resolve(true)),
  hash: jest.fn(() => Promise.resolve('hashed')),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock_token'),
}));

import { AuthService } from '../modules/auth/auth.service';
import Usuario from '../models/Usuario';
import Rol from '../models/Rol';
import SobreescrituraMenuUsuario from '../models/SobreescrituraMenuUsuario';
import PermisoRolMenu from '../models/PermisoRolMenu';
import OpcionMenu from '../models/OpcionMenu';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 1,
    email: 'admin@test.com',
    password: 'hashed_password',
    isActive: true,
    roleId: 1,
    roleData: { code: 'ADMIN' } as any,
    toJSON: function() { return { ...this }; },
  };

  beforeEach(() => {
    service = new AuthService();
    jest.clearAllMocks();

    jest.spyOn(Usuario, 'findOne').mockResolvedValue(mockUser as any);
    jest.spyOn(Rol, 'findByPk').mockResolvedValue({ code: 'ADMIN', id: 1 } as any);
    jest.spyOn(PermisoRolMenu, 'findAll').mockResolvedValue([{ menuOptionId: 1 }] as any);
    jest.spyOn(SobreescrituraMenuUsuario, 'findAll').mockResolvedValue([] as any);
    jest.spyOn(OpcionMenu, 'findAll').mockResolvedValue([{ id: 1, get: () => ({ id: 1, label: 'Test', parentId: null }) }] as any);
  });

  describe('login - SUCCESS', () => {
    it('should login with valid credentials', async () => {
      const result = await service.login('admin@test.com', 'any_password');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('menu');
    });

    it('should return menu array', async () => {
      jest.spyOn(Rol, 'findByPk').mockResolvedValue({ code: 'USER', id: 2 } as any);
      jest.spyOn(PermisoRolMenu, 'findAll').mockResolvedValue([{ menuOptionId: 1 }] as any);

      const result = await service.login('admin@test.com', 'any_password');

      expect(result.menu).toBeDefined();
    });
  });

  describe('login - ERROR', () => {
    it('should throw if user not found', async () => {
      (Usuario.findOne as jest.Mock).mockResolvedValueOnce(null as any);

      await expect(service.login('notfound@test.com', 'password')).rejects.toThrow('no encontrado');
    });

    it('should throw if user inactive', async () => {
      (Usuario.findOne as jest.Mock).mockResolvedValueOnce({ ...mockUser, isActive: false } as any);

      await expect(service.login('admin@test.com', 'password')).rejects.toThrow('inactivo');
    });
  });
});