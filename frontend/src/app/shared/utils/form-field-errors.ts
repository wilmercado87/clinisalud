import { FormGroup } from '@angular/forms';

export type ErrorRules = Record<string, [string, string][]>;

export type FieldErrors<R extends ErrorRules> = {
  [K in keyof R]: string | null;
};

export function extractFieldErrors<R extends ErrorRules>(
  group: FormGroup,
  rules: R,
): FieldErrors<R> {
  const result: Record<string, string | null> = {};
  for (const key of Object.keys(rules)) {
    const control = group.get(key);
    if (!control) continue;
    const rule = rules[key].find(([error]) => control.hasError(error));
    result[key] = rule ? rule[1] : null;
  }
  return result as FieldErrors<R>;
}
