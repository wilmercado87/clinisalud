export const autoMapCsvRow = (model: any, row: any) => {
  const attributes = model.getAttributes();
  const mappedRow: any = {};

  for (const [key, config] of Object.entries(attributes)) {
    const attributeConfig = config as any;
    if (key === "createdAt" || key === "updatedAt") continue;
    // Buscamos el nombre de la columna en el CSV (por field o por la llave CamelCase)
    const csvKey = attributeConfig.field || key;
    let rawValue = row[csvKey];

    if (rawValue === undefined || rawValue === null || rawValue.toString().trim() === "") {
      // Si el campo está vacío en el CSV, usamos el valor por defecto o asignamos null
      mappedRow[key] = attributeConfig.defaultValue !== undefined ? attributeConfig.defaultValue : null;
      continue;
    }

    // 🛡️ PROTECCIÓN ULTRA-ESTRICTA CONTRA VALORES NaN
    if (attributeConfig.type.key === "INTEGER" || attributeConfig.type.key === "BIGINT") {
      const parsed = parseInt(rawValue, 10);
      mappedRow[key] = Number.isNaN(parsed) ? (attributeConfig.defaultValue ?? null) : parsed;
    } else if (attributeConfig.type.key === "DECIMAL" || attributeConfig.type.key === "FLOAT") {
      const parsed = parseFloat(rawValue);
      mappedRow[key] = Number.isNaN(parsed) ? (attributeConfig.defaultValue ?? null) : parsed;
    } else if (attributeConfig.type.key === "BOOLEAN") {
      mappedRow[key] = rawValue === "true" || rawValue === "1" || rawValue === true;
    } else {
      // Campos de texto (STRING, TEXT)
      mappedRow[key] = rawValue;
    }
  }

  return mappedRow;
};