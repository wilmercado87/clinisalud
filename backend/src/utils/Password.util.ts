import { randomBytes } from "node:crypto";

export function generateTempPassword(): string {
  return `Clini-${randomBytes(4).toString("hex")}!`;
}