jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('hashed')),
}));

jest.mock('../modules/notifications/notifications.service', () => {
  const mockCreateAndDispatch = jest.fn().mockResolvedValue(undefined);
  return {
    NotificationsService: jest.fn().mockImplementation(() => ({
      createAndDispatch: mockCreateAndDispatch,
    })),
  };
});

import { UsersService } from '../modules/users/users.service';
import Usuario from '../models/Usuario';
import SobreescrituraMenuUsuario from '../models/SobreescrituraMenuUsuario';
import PermisoRolMenu from '../models/PermisoRolMenu';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService();
    jest.clearAllMocks();
  });

  describe('findAllManageableUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: 1, email: 'admin@test.com', toJSON: () => ({ id: 1, email: 'admin@test.com' }) },
        { id: 2, email: 'user@test.com', toJSON: () => ({ id: 2, email: 'user@test.com' }) },
      ];
      jest.spyOn(Usuario, 'findAll').mockResolvedValue(mockUsers as any);

      const result = await service.findAllManageableUsers();

      expect(result).toHaveLength(2);
    });
  });

  describe('createUser', () => {
    const validData = {
      email: 'new@test.com',
      dni: '12345678',
      documentTypeId: 1,
      firstName: 'John',
      lastName: 'Doe',
      roleId: 1,
      permissions: [1, 2],
    };

    it('should create user with temp password', async () => {
      jest.spyOn(Usuario, 'findOne').mockResolvedValueOnce(null as any);
      jest.spyOn(Usuario, 'create').mockResolvedValue({
        id: 1,
        ...validData,
        password: 'hashed_123',
        isActive: true,
        toJSON: () => ({ ...validData, id: 1 }),
      });
      jest.spyOn(PermisoRolMenu, 'findAll').mockResolvedValue([{ menuOptionId: 1 }, { menuOptionId: 2 }] as any);
      jest.spyOn(SobreescrituraMenuUsuario, 'bulkCreate').mockResolvedValue([]);

      const result = await service.createUser(validData, 'SUPER_ADMIN', 1, 'admin@test.com');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('emailSent');
    });

    it('should throw if email already exists', async () => {
      jest.spyOn(Usuario, 'findOne').mockResolvedValue({
        email: 'new@test.com',
        dni: 'different',
      } as any);

      await expect(service.createUser(validData, 'SUPER_ADMIN', 1, 'admin@test.com')).rejects.toThrow('correo');
    });
  });

  describe('updateUserPermissions', () => {
    it('should update permissions', async () => {
      jest.spyOn(Usuario, 'findByPk').mockResolvedValue({ id: 2, roleData: { code: 'USER' } } as any);
      jest.spyOn(SobreescrituraMenuUsuario, 'destroy').mockResolvedValue(1);
      jest.spyOn(SobreescrituraMenuUsuario, 'bulkCreate').mockResolvedValue([]);

      await service.updateUserPermissions(2, [
        { menuOptionId: 1, hasAccess: true },
      ], 'SUPER_ADMIN');

      expect(SobreescrituraMenuUsuario.destroy).toHaveBeenCalled();
      expect(SobreescrituraMenuUsuario.bulkCreate).toHaveBeenCalled();
    });

    it('should throw if user not found', async () => {
      jest.spyOn(Usuario, 'findByPk').mockResolvedValue(null as any);

      await expect(service.updateUserPermissions(999, [], 'SUPER_ADMIN')).rejects.toThrow('no encontrado');
    });

    it('should throw for admin user', async () => {
      jest.spyOn(Usuario, 'findByPk').mockResolvedValue({ id: 1, roleData: { code: 'ADMIN' } } as any);

      await expect(service.updateUserPermissions(1, [], 'ADMIN')).rejects.toThrow('No se puede cambiar permisos de administrador');
    });

    it('should allow SUPER_ADMIN to update ADMIN', async () => {
      jest.spyOn(Usuario, 'findByPk').mockResolvedValue({ id: 1, roleData: { code: 'ADMIN' } } as any);
      jest.spyOn(SobreescrituraMenuUsuario, 'destroy').mockResolvedValue(1);
      jest.spyOn(SobreescrituraMenuUsuario, 'bulkCreate').mockResolvedValue([]);

      await expect(
        service.updateUserPermissions(1, [{ menuOptionId: 1, hasAccess: true }], 'SUPER_ADMIN'),
      ).resolves.not.toThrow();
    });

    it('should throw for super admin user (immutable)', async () => {
      jest.spyOn(Usuario, 'findByPk').mockResolvedValue({ id: 1, roleData: { code: 'SUPER_ADMIN' } } as any);

      await expect(service.updateUserPermissions(1, [], 'SUPER_ADMIN')).rejects.toThrow('No se puede cambiar permisos del super administrador');
    });
  });

  describe('toggleUserStatus', () => {
    it('should toggle to active', async () => {
      const mockUserObj = {
        id: 2,
        isActive: false,
        roleData: { code: 'USER' },
        save: jest.fn().mockResolvedValue(true)
      };
      jest.spyOn(Usuario, 'findByPk').mockResolvedValue(mockUserObj as any);

      const result = await service.toggleUserStatus(2, 'SUPER_ADMIN', 1, 'admin@test.com');

      expect(mockUserObj.save).toHaveBeenCalled();
      expect(result.isActive).toBe(true);
    });

    it('should throw if user not found', async () => {
      jest.spyOn(Usuario, 'findByPk').mockResolvedValue(null as any);

      await expect(service.toggleUserStatus(999, 'SUPER_ADMIN', 1, 'admin@test.com')).rejects.toThrow('no encontrado');
    });

    it('should throw for admin', async () => {
      jest.spyOn(Usuario, 'findByPk').mockResolvedValue({ id: 1, roleData: { code: 'ADMIN' } } as any);

      await expect(service.toggleUserStatus(1, 'ADMIN', 1, 'admin@test.com')).rejects.toThrow('No se puede cambiar estado de administrador');
    });

    it('should allow SUPER_ADMIN to toggle ADMIN', async () => {
      const mockUserObj = {
        id: 1,
        isActive: false,
        roleData: { code: 'ADMIN' },
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(Usuario, 'findByPk').mockResolvedValue(mockUserObj as any);

      await expect(service.toggleUserStatus(1, 'SUPER_ADMIN', 1, 'admin@test.com')).resolves.not.toThrow();
    });

    it('should throw for super admin (immutable)', async () => {
      jest.spyOn(Usuario, 'findByPk').mockResolvedValue({ id: 1, roleData: { code: 'SUPER_ADMIN' } } as any);

      await expect(service.toggleUserStatus(1, 'SUPER_ADMIN', 1, 'admin@test.com')).rejects.toThrow('No se puede cambiar estado del super administrador');
    });
  });
});