import { ApiError } from "api-alternance-sdk";

import { captureTiered } from "@/common/services/sentry/alertContract";

const signalees = new Set<string>();

export function viderRequetesRefuseesSignalees(): void {
  signalees.clear();
}

/** Un 400 n'est pas une panne : l'API a répondu et refuse notre requête. */
export function estRequeteRefusee(error: unknown): error is ApiError {
  return error instanceof ApiError && error.context.statusCode === 400;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Champs de la requête que l'API déclare invalides, quel que soit le format de
 * `validationError` :
 *  - actuel : `[{ instancePath: "/uai", message }]` ;
 *  - ancien : `{ uai: { _errors: [...] } }`.
 */
export function champsEnErreurDeValidation(errorData: unknown): Set<string> {
  const champs = new Set<string>();
  const validationError = isRecord(errorData) ? errorData.validationError : undefined;

  if (Array.isArray(validationError)) {
    for (const erreur of validationError) {
      const instancePath = isRecord(erreur) ? erreur.instancePath : undefined;
      const champ = typeof instancePath === "string" ? instancePath.split("/")[1] : undefined;
      if (champ) champs.add(champ);
    }
  } else if (isRecord(validationError)) {
    for (const [champ, detail] of Object.entries(validationError)) {
      if (champ === "_errors" || !isRecord(detail)) continue;
      if (Array.isArray(detail._errors) && detail._errors.length > 0) champs.add(champ);
    }
  }

  return champs;
}

/**
 * Une capture par clé et par processus, avec le corps de la réponse : ces
 * fonctions sont appelées par organisme ou par effectif, une capture par appel
 * produirait un événement par dossier.
 */
export function reportRequeteRefuseeOnce(cle: string, error: ApiError): void {
  if (signalees.has(cle)) return;
  signalees.add(cle);

  captureTiered(error, {
    tier: "jour",
    errorKind: "upstream",
    upstream: "api-alternance",
    fingerprintKey: `${cle}:requete-refusee`,
    extra: { errorData: error.context.errorData },
  });
}
