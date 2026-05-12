jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('hashed')),
}));

import { UserService } from '../services/UserService';
import User from '../models/User';
import UserMenuOverride from '../models/UserMenuOverride';
import RoleMenuPermission from '../models/RoleMenuPermission';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
    jest.clearAllMocks();
  });

  describe('findAllManageableUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: 1, email: 'admin@test.com', toJSON: () => ({ id: 1, email: 'admin@test.com' }) },
        { id: 2, email: 'user@test.com', toJSON: () => ({ id: 2, email: 'user@test.com' }) },
      ];
      jest.spyOn(User, 'findAll').mockResolvedValue(mockUsers as any);

      const result = await service.findAllManageableUsers();

      expect(result).toHaveLength(2);
    });
  });

  describe('createUser', () => {
    const validData = {
      email: 'new@test.com',
      dni: '12345678',
      firstName: 'John',
      lastName: 'Doe',
      roleId: 1,
      permissions: [1, 2],
    };

    it('should create user with temp password', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValueOnce(null as any);
      jest.spyOn(User, 'create').mockResolvedValue({
        id: 1,
        ...validData,
        password: 'hashed_123',
        isActive: true,
        toJSON: () => ({ ...validData, id: 1 }),
      });
      jest.spyOn(RoleMenuPermission, 'findAll').mockResolvedValue([{ menuOptionId: 1 }, { menuOptionId: 2 }] as any);
      jest.spyOn(UserMenuOverride, 'bulkCreate').mockResolvedValue([]);

      const result = await service.createUser(validData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('temporaryPassword');
    });

    it('should throw if email already exists', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue({
        email: 'new@test.com',
        dni: 'different',
      } as any);

      await expect(service.createUser(validData)).rejects.toThrow('correo');
    });
  });

  describe('updateUserPermissions', () => {
    it('should update permissions', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue({ id: 2, roleData: { code: 'USER' } } as any);
      jest.spyOn(UserMenuOverride, 'destroy').mockResolvedValue(1);
      jest.spyOn(UserMenuOverride, 'bulkCreate').mockResolvedValue([]);

      await service.updateUserPermissions(2, [
        { menuOptionId: 1, hasAccess: true },
      ]);

      expect(UserMenuOverride.destroy).toHaveBeenCalled();
      expect(UserMenuOverride.bulkCreate).toHaveBeenCalled();
    });

    it('should throw if user not found', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue(null as any);

      await expect(service.updateUserPermissions(999, [])).rejects.toThrow('no encontrado');
    });

    it('should throw for admin user', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue({ id: 1, roleData: { code: 'ADMIN' } } as any);

      await expect(service.updateUserPermissions(1, [])).rejects.toThrow('403');
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
      jest.spyOn(User, 'findByPk').mockResolvedValue(mockUserObj as any);

      const result = await service.toggleUserStatus(2);

      expect(mockUserObj.save).toHaveBeenCalled();
      expect(result.isActive).toBe(true);
    });

    it('should throw if user not found', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue(null as any);

      await expect(service.toggleUserStatus(999)).rejects.toThrow('no encontrado');
    });

    it('should throw for admin', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue({ id: 1, roleData: { code: 'ADMIN' } } as any);

      await expect(service.toggleUserStatus(1)).rejects.toThrow('403');
    });
  });
});