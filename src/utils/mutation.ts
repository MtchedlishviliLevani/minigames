import { isOutcomeUnknown } from '../api/client';
import { ApiError } from '../api/client';

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

export function mutationFailure(error: unknown, unknownOutcome: string): string {
  if (isOutcomeUnknown(error)) return unknownOutcome;
  return error instanceof ApiError ? error.message : FALLBACK_MESSAGE;
}
