export function generateTempPassword(): string {
  return `Clini-${Math.random().toString(36).slice(-4)}!`;
}
