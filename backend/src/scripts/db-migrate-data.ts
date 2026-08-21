import "dotenv/config";
import sequelize from "../config/database";
import { initAssociations } from "../models/associations";

/**
 * Migraciones de DATOS idempotentes (complementan db:alter, que solo toca esquema).
 * Reglas:
 * - Cada migración debe poder ejecutarse múltiples veces sin efecto duplicado.
 * - Orden fijo; las nuevas se agregan al final del arreglo.
 * Flujo completo de release: npm run db:alter && npm run db:migrate && npm run db:alter
 * (la segunda pasada de db:alter aplica los NOT NULL cuando ya no quedan NULLs).
 */

type DataMigration = {
  id: string;
  statements: string[];
};

const DATA_MIGRATIONS: DataMigration[] = [
  {
    id: "2026-08-21 tipo_autorizacion: sincronizar catálogo desde tablas_clinisalud/tipo_autorizacion.csv",
    statements: [
      `INSERT INTO "tipo_autorizacion" ("ID_TIPO_AUTORIZACION", "DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION") VALUES (1, 'Aut. Consulta Externa', 1) ON CONFLICT ("ID_TIPO_AUTORIZACION") DO UPDATE SET "DESCRIPCION_TIPO_AUTORIZACION" = EXCLUDED."DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION" = EXCLUDED."FK_NIVEL_ATENCION"`,
      `INSERT INTO "tipo_autorizacion" ("ID_TIPO_AUTORIZACION", "DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION") VALUES (2, 'Aut. Procedimientos Ambulatorios', 1) ON CONFLICT ("ID_TIPO_AUTORIZACION") DO UPDATE SET "DESCRIPCION_TIPO_AUTORIZACION" = EXCLUDED."DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION" = EXCLUDED."FK_NIVEL_ATENCION"`,
      `INSERT INTO "tipo_autorizacion" ("ID_TIPO_AUTORIZACION", "DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION") VALUES (3, 'Aut. Procedimientos No pos', 4) ON CONFLICT ("ID_TIPO_AUTORIZACION") DO UPDATE SET "DESCRIPCION_TIPO_AUTORIZACION" = EXCLUDED."DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION" = EXCLUDED."FK_NIVEL_ATENCION"`,
      `INSERT INTO "tipo_autorizacion" ("ID_TIPO_AUTORIZACION", "DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION") VALUES (4, 'Aut. Urgencias', 2) ON CONFLICT ("ID_TIPO_AUTORIZACION") DO UPDATE SET "DESCRIPCION_TIPO_AUTORIZACION" = EXCLUDED."DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION" = EXCLUDED."FK_NIVEL_ATENCION"`,
      `INSERT INTO "tipo_autorizacion" ("ID_TIPO_AUTORIZACION", "DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION") VALUES (5, 'Aut. Cirugía Ambulatoria', 2) ON CONFLICT ("ID_TIPO_AUTORIZACION") DO UPDATE SET "DESCRIPCION_TIPO_AUTORIZACION" = EXCLUDED."DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION" = EXCLUDED."FK_NIVEL_ATENCION"`,
      `INSERT INTO "tipo_autorizacion" ("ID_TIPO_AUTORIZACION", "DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION") VALUES (6, 'Aut. Hospitalización', 2) ON CONFLICT ("ID_TIPO_AUTORIZACION") DO UPDATE SET "DESCRIPCION_TIPO_AUTORIZACION" = EXCLUDED."DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION" = EXCLUDED."FK_NIVEL_ATENCION"`,
      `INSERT INTO "tipo_autorizacion" ("ID_TIPO_AUTORIZACION", "DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION") VALUES (7, 'Aut. Hospitalización Qx', 3) ON CONFLICT ("ID_TIPO_AUTORIZACION") DO UPDATE SET "DESCRIPCION_TIPO_AUTORIZACION" = EXCLUDED."DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION" = EXCLUDED."FK_NIVEL_ATENCION"`,
      `INSERT INTO "tipo_autorizacion" ("ID_TIPO_AUTORIZACION", "DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION") VALUES (8, 'Aut. UCE', 3) ON CONFLICT ("ID_TIPO_AUTORIZACION") DO UPDATE SET "DESCRIPCION_TIPO_AUTORIZACION" = EXCLUDED."DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION" = EXCLUDED."FK_NIVEL_ATENCION"`,
      `INSERT INTO "tipo_autorizacion" ("ID_TIPO_AUTORIZACION", "DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION") VALUES (9, 'Aut. UCI', 4) ON CONFLICT ("ID_TIPO_AUTORIZACION") DO UPDATE SET "DESCRIPCION_TIPO_AUTORIZACION" = EXCLUDED."DESCRIPCION_TIPO_AUTORIZACION", "FK_NIVEL_ATENCION" = EXCLUDED."FK_NIVEL_ATENCION"`,
    ],
  },
];

(async () => {
  try {
    initAssociations();
    await sequelize.authenticate();
    console.log("✅ Conexión a base de datos establecida.");

    for (const migration of DATA_MIGRATIONS) {
      console.log(`\n▶ Migración: ${migration.id}`);
      for (const statement of migration.statements) {
        const [, meta] = await sequelize.query(statement);
        const affected = typeof meta === "object" && meta && "rowCount" in meta ? meta.rowCount ?? 0 : 0;
        console.log(`  ✓ ejecutado (${affected} filas afectadas)`);
      }
    }

    console.log("\n📋 Migraciones de datos aplicadas.");
    console.log("ℹ️  Si agregaste columnas NOT NULL, re-ejecuta 'npm run db:alter' para enforcing final.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en db:migrate:", error);
    process.exit(1);
  }
})();
