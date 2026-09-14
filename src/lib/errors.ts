import type { CommandError } from "./types";

export function isCommandError(error: unknown): error is CommandError {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      "messageKey" in error,
  );
}
