#!/usr/bin/env node
/**
 * Gates determinísticos de calidad (sin LLM) para CI.
 * - Prohibe `any` explícito nuevo en código TS (backend + frontend).
 * - Exige que tests citen invariantes del spec (@spec:INV-...).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const baseSha = process.env.BASE_SHA || "";
let errors = false;
let warnings = false;

function shell(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], ...opts });
  } catch {
    return "";
  }
}

// 1) any explícito nuevo en el diff (solo líneas añadidas en este PR)
const diffCmd = baseSha
  ? `git diff ${baseSha}...HEAD --name-only`
  : "git diff --name-only";
const allFiles = shell(diffCmd).split("\n").filter(Boolean);
const files = allFiles.filter(
  (f) =>
    /^(backend|frontend)\/src\/.*\.ts$/.test(f) &&
    !f.endsWith(".spec.ts") &&
    !f.endsWith(".test.ts")
);

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const addedLines = shell(`git diff ${baseSha}...HEAD -- "${file}"`)
    .split("\n")
    .filter((l) => l.startsWith("+") && !l.startsWith("+++"));
  addedLines.forEach((line) => {
    // any: como tipo o casting (no text/identificadores tipo "many", "anything")
    if (/: any\b|as any\b|<any>/.test(line)) {
      errors = true;
      console.error(`[ERROR] any explícito añadido ${file} -> ${line.slice(1).trim()}`);
    }
  });
}

// 2) trazabilidad @spec en tests modificados (aviso, no error)
const testFiles = allFiles.filter((f) => f.includes("__tests__") || f.endsWith(".spec.ts"));
if (testFiles.length) {
  const noSpec = testFiles.filter((f) => {
    try {
      return !fs.readFileSync(f, "utf-8").includes("@spec:");
    } catch {
      return false;
    }
  });
  if (noSpec.length) {
    warnings = true;
    console.warn(`[WARN] Tests sin referencia @spec:INV-... (SDD):\n  ${noSpec.join("\n  ")}`);
  }
}

if (errors) process.exit(1);
if (warnings) console.warn("\nAvisos: revisarlos pero no bloquean (salvo que rompan invariantes)");
console.log("Quality gates: OK");
process.exit(0);