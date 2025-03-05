import { captureException } from "@sentry/node";

class AppError extends Error {
  details: any;

  constructor(message: string, options: any) {
    super(message, options);
  }

  toString(): string {
    return `${this.message}${this.details ? `: ${JSON.stringify(this.details)}` : ""}`;
  }
}

/**
 * an helper to enhance error message (for example, when a document failed validation)
 *
 * @param error
 * @returns
 */
export const formatError = (error: any) => {
  if (error.message === "Document failed validation") {
    const newError = new AppError("Document failed validation", { cause: error });
    newError.name = "DocumentFailedValidation";
    // details are only provided with insertOne (not insertMany, bulkWrite, etc.)
    newError.details = error?.errInfo?.details?.schemaRulesNotSatisfied;
    return newError;
  }

  return error;
};

export function withCause<T extends Error>(error: T, cause: Error, level: "fatal" | "error" | "warning" = "error"): T {
  error.cause = cause;
  captureException(cause, { level });
  return error;
}
