export const buildMenuTree = (options: any[]): any[] => {
  const map = new Map<number, any>();
  const tree: any[] = [];

  const sortedOptions = [...options].sort((a, b) => (a.order || 0) - (b.order || 0));

  sortedOptions.forEach((opt) => {
    map.set(opt.id, { ...opt, children: [] });
  });

  sortedOptions.forEach((opt) => {
    const node = map.get(opt.id);
    if (opt.parentId && map.has(opt.parentId)) {
      map.get(opt.parentId).children.push(node);
    } else if (!opt.parentId) {
      tree.push(node);
    }
  });

  return tree;
};