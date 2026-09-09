class AppError extends Error {
  details: unknown;

  constructor(message: string, options?: ErrorOptions) {
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
export const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export const formatError = (error: unknown): Error & { details?: unknown } => {
  if (error instanceof Error && error.message === "Document failed validation") {
    const newError = new AppError("Document failed validation", { cause: error });
    newError.name = "DocumentFailedValidation";
    // details are only provided with insertOne (not insertMany, bulkWrite, etc.)
    const errInfo = (error as { errInfo?: { details?: { schemaRulesNotSatisfied?: unknown } } }).errInfo;
    newError.details = errInfo?.details?.schemaRulesNotSatisfied;
    return newError;
  }

  return error instanceof Error ? error : new Error(String(error));
};
