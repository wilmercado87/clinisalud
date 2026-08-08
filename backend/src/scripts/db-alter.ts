import "dotenv/config";
import sequelize from "../config/database";
import { initAssociations } from "../models/associations";

function toSqlType(attribute: any): string | null {
  if (attribute.type && typeof attribute.type.toSql === "function") {
    try {
      return attribute.type.toSql();
    } catch {
      return null;
    }
  }
  if (typeof attribute.type === "string") return attribute.type;
  return null;
}

async function listTables(): Promise<string[]> {
  return sequelize
    .getQueryInterface()
    .showAllTables() as unknown as string[];
}

(async () => {
  try {
    initAssociations();
    await sequelize.authenticate();
    console.log("✅ Conexión a base de datos establecida.");

    const q = sequelize.getQueryInterface();
    const existingTables = await listTables();
    const changes: string[] = [];

    for (const model of Object.values(sequelize.models)) {
      const tableName = model.getTableName() as string;

      if (!existingTables.includes(tableName)) {
        await model.sync({ force: false, alter: false });
        changes.push(`+ tabla creada: ${tableName}`);
        console.log(`✅ Tabla creada: ${tableName}`);
        continue;
      }

      const columns = await q.describeTable(tableName);
      for (const name of Object.keys(model.getAttributes())) {
        const attribute = model.getAttributes()[name];
        const dbColumn = attribute.field ?? name;
        if (columns[dbColumn]) continue;

        const sqlType = toSqlType(attribute);
        if (!sqlType) {
          console.warn(`⚠️  ${tableName}.${dbColumn}: tipo no resuelto, se omite`);
          continue;
        }

        const nullable = attribute.allowNull === false ? "NOT NULL" : "NULL";
        const defaultSql = attribute.defaultValue !== undefined ? ` DEFAULT ${JSON.stringify(attribute.defaultValue)}` : "";
        const sql = `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${dbColumn}" ${sqlType} ${nullable}${defaultSql}`;
        await q.sequelize.query(sql);
        changes.push(`+ columna agregada: ${tableName}.${dbColumn} (${sqlType})`);
        console.log(`✅ Columna agregada: ${tableName}.${dbColumn} (${sqlType})`);
      }
    }

    console.log(`\n📋 Resumen de cambios de esquema: ${changes.length}`);
    for (const c of changes) console.log(`  ${c}`);
    if (changes.length === 0) console.log("ℹ️  Esquema ya sincronizado (sin cambios).");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en db:alter:", error);
    process.exit(1);
  }
})();