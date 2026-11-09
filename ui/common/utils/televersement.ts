import { ErrorCode, FileRejection } from "react-dropzone";
import { cyrb53Hash, normalize, PlausibleGoalType } from "shared";

import { getApiErrorMessage, getErrorStatusCode } from "@/common/rateLimit";

export const MESSAGE_ERREUR_ENVOI =
  "Votre fichier n'a pas pu être envoyé. Vérifiez votre connexion et réessayez. Rien n'a été importé.";

export function toEffectifsQueue(data: Record<string, unknown>[]) {
  return data.map((e) => ({
    ...e,
    // Generate a unique id for each row, based on the apprenant's name and birthdate.
    // Source: https://mission-apprentissage.slack.com/archives/C02FR2L1VB8/p1693294663898159?thread_ts=1693292246.217809&cid=C02FR2L1VB8
    id_erp_apprenant: cyrb53Hash(
      normalize(String(e.prenom_apprenant || "")).trim() +
        normalize(String(e.nom_apprenant || "")).trim() +
        String(e.date_de_naissance_apprenant || "").trim()
    ),
  }));
}

export function messageFichierRefuse(rejections: FileRejection[]): string {
  const code = rejections[0]?.errors[0]?.code;
  if (code === ErrorCode.TooManyFiles) {
    return "Déposez un seul fichier à la fois.";
  }
  if (code === ErrorCode.FileInvalidType) {
    return "Ce fichier n'est pas un tableur. Déposez un fichier Excel (.xlsx, .xls), OpenDocument (.ods) ou CSV.";
  }
  return "Ce fichier ne peut pas être déposé.";
}

export function evenementVerification(nombreErreurs: number): PlausibleGoalType {
  return nombreErreurs > 0 ? "televersement_verification_erreur" : "televersement_verification_reussie";
}

export function messageEchecEnvoi(err: unknown): string {
  return getErrorStatusCode(err) ? getApiErrorMessage(err, MESSAGE_ERREUR_ENVOI) : MESSAGE_ERREUR_ENVOI;
}

export async function envoyerImport(
  envoyer: () => Promise<unknown>,
  suivre: (goal: PlausibleGoalType) => void
): Promise<{ succes: true } | { succes: false; message: string }> {
  try {
    await envoyer();
    suivre("televersement_import_en_file");
    return { succes: true };
  } catch (err) {
    suivre("televersement_echec_envoi");
    return { succes: false, message: messageEchecEnvoi(err) };
  }
}
