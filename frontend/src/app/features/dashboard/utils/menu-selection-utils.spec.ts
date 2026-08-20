import { MenuOption } from '@core/models/user.model';
import {
  GESTOR_USUARIOS_LABEL,
  allMenuOptionIds,
  buildPermissionOverrides,
  collectGroupIds,
  isUserManagerGroup,
  toggleChildSelection,
  toggleParentSelection,
} from './menu-selection-utils';

function menuOption(id: number, label: string, children: MenuOption[] = []): MenuOption {
  return { id, label, icon: '', path: null, order: id, parentId: null, isActive: true, children };
}

describe('menu-selection-utils', () => {
  const userManagerGroup = menuOption(1, 'Gestor Usuarios', [menuOption(2, 'Usuarios'), menuOption(3, 'Roles')]);

  const plainGroup = menuOption(10, 'Admisiones', [menuOption(11, 'Ingresos')]);

  const emptyGroup = menuOption(20, 'Solo padre');

  describe('isUserManagerGroup', () => {
    it('identifica el grupo GESTOR USUARIOS ignorando mayúsculas', () => {
      expect(isUserManagerGroup(userManagerGroup)).toBe(true);
    });

    it('rechaza grupos que no son GESTOR USUARIOS', () => {
      expect(isUserManagerGroup(plainGroup)).toBe(false);
    });

    it('GESTOR_USUARIOS_LABEL coincide con el valor en mayúsculas', () => {
      expect(GESTOR_USUARIOS_LABEL).toBe('GESTOR USUARIOS');
    });
  });

  describe('collectGroupIds', () => {
    it('devuelve el id del grupo y el de sus hijos', () => {
      expect(collectGroupIds(userManagerGroup)).toEqual([1, 2, 3]);
    });

    it('devuelve solo el id del grupo cuando no tiene hijos', () => {
      expect(collectGroupIds(emptyGroup)).toEqual([20]);
    });
  });

  describe('allMenuOptionIds', () => {
    it('aplanja los ids de todos los grupos y sus hijos', () => {
      expect(allMenuOptionIds([userManagerGroup, plainGroup])).toEqual([1, 2, 3, 10, 11]);
    });
  });

  describe('toggleParentSelection', () => {
    it('agrega el grupo y sus hijos al marcar', () => {
      const result = toggleParentSelection(new Set(), userManagerGroup, true);
      expect(result).toEqual(new Set([1, 2, 3]));
    });

    it('elimina el grupo y sus hijos al desmarcar', () => {
      const result = toggleParentSelection(new Set([1, 2, 3, 10]), userManagerGroup, false);
      expect(result).toEqual(new Set([10]));
    });

    it('no muta el set original', () => {
      const current = new Set([1]);
      toggleParentSelection(current, userManagerGroup, true);
      expect(current).toEqual(new Set([1]));
    });
  });

  describe('toggleChildSelection', () => {
    it('agrega el hijo y el padre al seleccionar', () => {
      const result = toggleChildSelection(new Set([10]), plainGroup, 11);
      expect(result).toEqual(new Set([10, 11, 10]));
    });

    it('elimina el hijo y el padre al deseleccionar sin siblings activos', () => {
      const result = toggleChildSelection(new Set([10, 11]), plainGroup, 11);
      expect(result).toEqual(new Set());
    });

    it('mantiene el padre cuando quedan siblings activos', () => {
      const result = toggleChildSelection(new Set([1, 2, 3]), userManagerGroup, 2);
      expect(result).toEqual(new Set([1, 3]));
    });
  });

  describe('buildPermissionOverrides', () => {
    it('genera overrides para cada grupo y sus hijos', () => {
      const result = buildPermissionOverrides([userManagerGroup, emptyGroup], new Set([1, 2]));
      expect(result).toEqual([
        { menuOptionId: 1, hasAccess: true },
        { menuOptionId: 2, hasAccess: true },
        { menuOptionId: 3, hasAccess: false },
        { menuOptionId: 20, hasAccess: false },
      ]);
    });
  });
});
