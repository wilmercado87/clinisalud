import { HttpErrorResponse } from '@angular/common/http';
import { ERROR_MAPPING, HTTP_STATUS } from '@shared/utils/status.codes';

export function getHttpErrorStatus(err: unknown): number | undefined {
  return err instanceof HttpErrorResponse ? err.status : undefined;
}

export function getHttpErrorMessage(err: unknown, fallback: string): string {
  return err instanceof HttpErrorResponse && err.error?.message
    ? err.error.message
    : fallback;
}

export function getBusinessErrorMessage(error: HttpErrorResponse): string {
  const { status, error: body } = error;

  if (status === HTTP_STATUS.VALIDATION_ERROR) {
    const detail = body?.errors?.[0]?.message;
    if (detail) return detail;
  }

  return ERROR_MAPPING[status] || body?.message || 'Error inesperado en el servidor';
}
