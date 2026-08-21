import "dotenv/config";
import sequelize from "../config/database";
import { initAssociations } from "../models/associations";
import type { ModelAttributeColumnOptions } from "sequelize";

function toSqlType(attribute: ModelAttributeColumnOptions): string | null {
  const type = attribute.type as { toSql?: () => string } | undefined;
  if (type && typeof type.toSql === "function") {
    try {
      return type.toSql();
    } catch {
      return null;
    }
  }
  if (typeof type === "string") return type;
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
    let existingTables = await listTables();

    if (existingTables.length === 0) {
      console.error("❌ Base vacía: el esquema debe inicializarse con el dump canónico: psql -f db/clinisalud.sql");
      process.exit(1);
    }

    const changes: string[] = [];

    for (const model of Object.values(sequelize.models) as (typeof sequelize.models[string])[]) {
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
        const existingColumn = columns[dbColumn];

        if (!existingColumn) {
          const sqlType = toSqlType(attribute);
          if (!sqlType) {
            console.warn(`⚠️  ${tableName}.${dbColumn}: tipo no resuelto, se omite`);
            continue;
          }

          // Siempre se agrega nullable primero: agregar NOT NULL sobre tablas
          // con filas falla (PG 23502). El enforcement ocurre más abajo cuando
          // no queden NULLs (tras el backfill de npm run db:migrate).
          const addSql = `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${dbColumn}" ${sqlType} NULL`;
          await q.sequelize.query(addSql);
          changes.push(`+ columna agregada: ${tableName}.${dbColumn} (${sqlType})`);
          console.log(`✅ Columna agregada: ${tableName}.${dbColumn} (${sqlType})`);

          if (attribute.defaultValue !== undefined) {
            const [, meta] = await q.sequelize.query(
              `UPDATE "${tableName}" SET "${dbColumn}" = $value WHERE "${dbColumn}" IS NULL`,
              { bind: { value: attribute.defaultValue } },
            );
            const affected = Number((meta as { rowCount?: number | null } | null)?.rowCount ?? 0);
            if (affected > 0) {
              changes.push(`~ backfill por default: ${tableName}.${dbColumn} (${affected} filas)`);
              console.log(`✅ Backfill default ${tableName}.${dbColumn}: ${affected} filas`);
            }
          }
        }

        if (!columns[dbColumn]) continue;

        if (attribute.allowNull === false) {
          const [nullabilityRows] = await q.sequelize.query(
            `SELECT is_nullable FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $t AND column_name = $c`,
            { bind: { t: tableName, c: dbColumn } },
          );
          const isNullable = (nullabilityRows[0] as { is_nullable?: string } | undefined)?.is_nullable === "YES";
          if (!isNullable) continue;

          const [rows] = await q.sequelize.query(
            `SELECT COUNT(*)::int AS missing FROM "${tableName}" WHERE "${dbColumn}" IS NULL`,
          );
          const missing = Number((rows[0] as { missing: number })["missing"] ?? 0);
          if (missing === 0) {
            await q.sequelize.query(
              `ALTER TABLE "${tableName}" ALTER COLUMN "${dbColumn}" SET NOT NULL`,
            );
            changes.push(`! NOT NULL aplicado: ${tableName}.${dbColumn}`);
            console.log(`✅ NOT NULL aplicado: ${tableName}.${dbColumn}`);
          } else {
            console.warn(
              `⚠️  ${tableName}.${dbColumn}: ${missing} filas con NULL — corre 'npm run db:migrate' y re-ejecuta 'npm run db:alter' para aplicar NOT NULL`,
            );
          }
        }
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