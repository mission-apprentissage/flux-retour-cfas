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
  console.log(JSON.stringify(error, null, 2));
  console.log(error.message);
  console.log(error?.errInfo?.details?.schemaRulesNotSatisfied);

  if (error.message === "Document failed validation") {
    const newError = new AppError("Document failed validation", { cause: error });
    newError.name = "DocumentFailedValidation";
    // details are only provided with insertOne (not insertMany, bulkWrite, etc.)
    newError.details = error?.errInfo?.details?.schemaRulesNotSatisfied;
    return newError;
  }

  return error;
};
