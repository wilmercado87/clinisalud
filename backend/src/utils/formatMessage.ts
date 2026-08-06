export const formatMessage = (
  template: string,
  params: Record<string, string | number>,
): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) =>
    params[key] !== undefined ? String(params[key]) : match,
  );
