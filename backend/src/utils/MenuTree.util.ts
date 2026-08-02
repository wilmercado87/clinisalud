export type MenuTreeItem<T> = T & { children: MenuTreeItem<T>[] };

interface MenuTreeNode {
  id: number;
  parentId: number | null;
  order?: number;
}

export const buildMenuTree = <T extends MenuTreeNode>(options: T[]): MenuTreeItem<T>[] => {
  const map = new Map<number, MenuTreeItem<T>>();
  const tree: MenuTreeItem<T>[] = [];

  const sortedOptions = [...options].sort((a, b) => (a.order || 0) - (b.order || 0));

  sortedOptions.forEach((opt) => {
    map.set(opt.id, { ...opt, children: [] });
  });

  sortedOptions.forEach((opt) => {
    const node = map.get(opt.id);
    if (opt.parentId && map.has(opt.parentId)) {
      map.get(opt.parentId)!.children.push(node!);
    } else if (!opt.parentId) {
      tree.push(node!);
    }
  });

  return tree;
};
