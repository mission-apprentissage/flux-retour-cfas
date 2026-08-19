interface InputValidationDetail {
  message: string;
  path: (string | number)[];
  type: string;
}

/**
 * Erreur de validation d'entrée au format attendu par errorMiddleware (`name` + `details`),
 * afin que la réponse HTTP reste identique pour les consommateurs externes de l'API.
 */
export class InputValidationError extends Error {
  readonly name = "ValidationError";
  readonly details: InputValidationDetail[];

  constructor(details: InputValidationDetail[]) {
    super(details[0]?.message ?? "Erreur de validation");
    this.details = details;
  }
}

export function validateArrayInput(value: unknown, maxLength: number): any[] {
  if (!Array.isArray(value)) {
    throw new InputValidationError([{ message: '"value" must be an array', path: [], type: "array.base" }]);
  }

  if (value.length > maxLength) {
    throw new InputValidationError([
      {
        message: `"value" must contain less than or equal to ${maxLength} items`,
        path: [],
        type: "array.max",
      },
    ]);
  }

  return value;
}
