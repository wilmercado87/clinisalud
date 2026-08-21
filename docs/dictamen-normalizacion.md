# Dictamen de normalización del esquema PostgreSQL

> **Nota:** este documento es un **registro histórico** (auditoría puntual del esquema). No se actualiza con cada cambio; para el esquema vigente consultar `backend/db/clinisalud.sql` (regenerable con `npm run db:schema`).
>
> **Fecha de verificación:** 2026-08-08 (contra base de producción Neon, `public`).
> **Metodología:** conteos vía `information_schema` y `LEFT JOIN` anti-join sobre columnas FK reales.

## 1. Estado general

| Métrica | Valor |
|---|---|
| Tablas | 41 |
| FKs físicas declaradas | 51 (45 CONSTRAINT FK + 6 relaciones Sequelize `belongsMany/hasMany` con FK inline) |
| Catálogo CUPS | 21.426 códigos (11.351 únicos MAPIISS) |
| Catálogo Diagnóstico CIE-10 | 12.423 códigos |
| Articulados (reglas tarifaria) | 37.266 filas / 11.404 códigos MAPIISS distintos |
| Admisiones | pobladas en producción |

## 2. Integridad referencial verificada

| Relación | Huérfanos |
|---|---|
| `articulado → cups` (por `FK_CODIGO_MAPIISS`) | 76 filas / **58 códigos únicos** (0,2 %) |
| `triage → diagnostico` (`FK_CODIGO_DIAGNOSTICO`) | 0 |
| `municipio → departamento` | 0 |
| `cups → centro_costo` | 0 |
| `cups → nivel_atencion` | 0 |
| `cups → tarifario` | 0 |
| `articulado → tarifario` | 0 |
| `triagem → convenio (EPS)` | 0 |

### Desglose de los 58 huérfanos de `articulado`
- Son códigos `FK_CODIGO_MAPIISS` que no existen en `cups.CODIGO_MAPIISS` (verificación con `LEFT JOIN` desde `articulado`): 58 códigos únicos distribuidos en 76 filas. Sin códigos con espacios/padding (`length(trim())` = 0 discrepancias).
- **Consecuencia:** esas 76 reglas tarifarias nunca matchearán un CUPS → reglas inactivas en la tarifa.
- **Siguiente paso:** listarlos y decidir si (a) se cargan los catálogos faltantes, o (b) se eliminan las reglas huérfanas (requiere aprobación funcional). Ninguna de las dos acciones se ejecutó aún.

## 3. Problemas de modelado detectados (recomendaciones pendientes)

| # | Hallazgo | Tipo | Recomendación |
|---|---|---|---|
| 1 | `sqlite` era el motor previo; se migró a PostgreSQL con dump de esquema (`backend/db/clinisalud.sql`) | Migración | Confirmado: la app corre 100 % PostgreSQL (Neon prod, local docker). `database.sqlite` eliminado. |
| 2 | Identificadores mixtos (`"CODIGO_MAPIISS"`, `"ID_CENTRO_COSTO"`, etc.) → obligan a comillas dobles en SQL | Consistencia | Opcional: renombrar a estándar `snake_case` con migración; **requiere tocar backend, tests y seed** → no iniciado (riesgo alto, beneficio bajo). |
| 3 | Columnas de código ref en mayúscula (`FK_CODIGO_MAPIISS` varchar) | Normalización | El JOIN con CUPS es por `CODIGO_MAPIISS` (string). Verificado: sin códigos con espacios/padding (`length(trim())` = 0 discrepancias) → los 58 huérfanos son códigos realmente ausentes del catálogo, no artefactos de formato. |
| 4 | Seis relaciones Sequelize sin FK física en BD (relaciones 1.ª declaradas en modelos) | Coherencia | Al crear la siguiente migración, alinear con las 45 FK existentes (ya hay 51 física total en información_schema, incluidas las declaradas). |

## 4. Decisiones tomadas

- ✅ **SQLite → PostgreSQL:** definitivo (renuncia a `sqlite3`; BD local/Neon).
- ✅ **Dump canónico** en `backend/db/clinisalud.sql` (regenerable con `npm run db:schema`).
⚠️ **58 códigos huérfanos en articulado (76 filas):** mientras se resuelvan, no bloquean deploys; monitorear.

## 5. Cómo reproducir

```bash
# FKs físicas
psql "$DATABASE_URL" -c "SELECT count(*) FROM information_schema.table_constraints WHERE constraint_type='FOREIGN KEY';"

# Huérfanos articulado→cups
psql "$DATABASE_URL" -c "
SELECT count(*) FROM articulado a
LEFT JOIN cups c ON c.\"CODIGO_MAPIISS\" = a.\"FK_CODIGO_MAPIISS\"
WHERE a.\"FK_CODIGO_MAPIISS\" IS NOT NULL AND c.\"CODIGO_MAPIISS\" IS NULL;"
```