import { MenuOption, PermissionOverride } from '@core/models/user.model';

export const GESTOR_USUARIOS_LABEL = 'GESTOR USUARIOS';

export function isUserManagerGroup(group: MenuOption): boolean {
  return group.label.toUpperCase() === GESTOR_USUARIOS_LABEL;
}

export function collectGroupIds(group: MenuOption): number[] {
  return [group.id, ...(group.children?.map((child) => child.id) ?? [])];
}

export function allMenuOptionIds(groups: MenuOption[]): number[] {
  return groups.flatMap((group) => collectGroupIds(group));
}

export function toggleParentSelection(current: Set<number>, group: MenuOption, checked: boolean): Set<number> {
  const next = new Set(current);
  const ids = collectGroupIds(group);

  if (checked) {
    ids.forEach((id) => next.add(id));
  } else {
    ids.forEach((id) => next.delete(id));
  }

  return next;
}

export function toggleChildSelection(current: Set<number>, parent: MenuOption, childId: number): Set<number> {
  const next = new Set(current);
  const childIds = parent.children?.map((child) => child.id) ?? [];

  if (next.has(childId)) {
    next.delete(childId);
    const hasSelectedSiblings = childIds.some((id) => id !== childId && next.has(id));
    if (!hasSelectedSiblings) next.delete(parent.id);
  } else {
    next.add(childId);
    next.add(parent.id);
  }

  return next;
}

export function buildPermissionOverrides(groups: MenuOption[], selected: Set<number>): PermissionOverride[] {
  return groups.flatMap((group) => [
    { menuOptionId: group.id, hasAccess: selected.has(group.id) },
    ...(group.children?.map((child) => ({
      menuOptionId: child.id,
      hasAccess: selected.has(child.id),
    })) ?? []),
  ]);
}
