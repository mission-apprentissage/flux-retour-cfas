import { ErrorCode, FileRejection } from "react-dropzone";
import { cyrb53Hash, ERREURS_TELEVERSEMENT, normalize, PlausibleGoalType } from "shared";

import { getApiErrorMessage, getErrorStatusCode, getServerErrorMessage } from "@/common/rateLimit";

import type { LectureReussie, ResultatLecture } from "./lectureFichierEffectifs";

export const MESSAGE_ERREUR_ENVOI = ERREURS_TELEVERSEMENT.erreur_reseau();

export const MESSAGE_ERREUR_TRAITEMENT = "Erreur de traitement du fichier";

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
    return ERREURS_TELEVERSEMENT.plusieurs_fichiers();
  }
  if (code === ErrorCode.FileInvalidType) {
    return ERREURS_TELEVERSEMENT.format_refuse();
  }
  return ERREURS_TELEVERSEMENT.depot_impossible();
}

export function evenementVerification(nombreErreurs: number): PlausibleGoalType {
  return nombreErreurs > 0 ? "televersement_verification_erreur" : "televersement_verification_reussie";
}

const STATUT_REFUS = 400;
const STATUT_TROP_LOURD = 413;
const STATUT_INDISPONIBLE = 503;

export function messageEchecEnvoi(err: unknown): string {
  const statut = getErrorStatusCode(err);
  if (statut === STATUT_TROP_LOURD) {
    return ERREURS_TELEVERSEMENT.fichier_trop_lourd();
  }
  if (statut === STATUT_INDISPONIBLE) {
    return getServerErrorMessage(err, MESSAGE_ERREUR_ENVOI);
  }
  return statut ? getApiErrorMessage(err, MESSAGE_ERREUR_ENVOI) : MESSAGE_ERREUR_ENVOI;
}

export function messageEchecVerification(err: unknown): string | null {
  const statut = getErrorStatusCode(err);
  if (statut === STATUT_TROP_LOURD) {
    return ERREURS_TELEVERSEMENT.fichier_trop_lourd();
  }
  if (statut === STATUT_REFUS || statut === STATUT_INDISPONIBLE) {
    return getServerErrorMessage(err, MESSAGE_ERREUR_TRAITEMENT);
  }
  return null;
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

export interface WorkerDeLecture {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: unknown): void;
  terminate(): void;
}

type MessageDuWorker = { type: "demarre" } | { type: "resultat"; resultat: ResultatLecture };

export function lireAvecUnWorker(
  creer: () => WorkerDeLecture,
  demande: { contenu: ArrayBuffer; nomFichier: string; maximumLignes: number },
  lireIci: () => ResultatLecture
): Promise<ResultatLecture> {
  return new Promise((resolve, reject) => {
    let worker: WorkerDeLecture;
    try {
      worker = creer();
    } catch {
      resolve(lireIci());
      return;
    }
    let demarre = false;
    worker.onmessage = (event: MessageEvent<MessageDuWorker>) => {
      if (event.data.type === "demarre") {
        demarre = true;
        return;
      }
      worker.terminate();
      resolve(event.data.resultat);
    };
    worker.onerror = (event) => {
      worker.terminate();
      if (demarre) {
        reject(new Error(`Lecture du fichier impossible dans le worker : ${event.message}`));
      } else {
        resolve(lireIci());
      }
    };
    worker.postMessage(demande);
  });
}

export interface IssueVerification {
  path: Array<string | number>;
  message: string;
  code?: string;
}

export interface ReponseVerification {
  error?: { issues?: IssueVerification[] };
  warnings?: { contratCount?: number; nouveaux?: number; misAJour?: number; contratsEffaces?: number[] };
}

export interface ApprentiContratEfface {
  nom: string;
  prenom: string;
  ligne: number;
}

export interface AvertissementsVerification {
  contratCount?: number;
  nouveaux?: number;
  misAJour?: number;
  contratsEffaces?: ApprentiContratEfface[];
}

export interface LigneVerifiee {
  [key: string]: unknown;
  numero: number;
  errors: { key: string; message: string }[];
}

export interface Verification {
  processedData: LigneVerifiee[];
  valeursAEnvoyer: Record<string, unknown>[];
  errorsCount: number;
  warnings: AvertissementsVerification;
  missingHeaders: string[];
  colonnesEnDouble: string[];
  columnsWithErrors: string[];
  codesErreurs: string[];
}

const texte = (valeur: unknown) => (valeur === undefined || valeur === null ? "" : String(valeur));

function apprentisContratEfface(lecture: LectureReussie, index: number[]): ApprentiContratEfface[] {
  return index.flatMap((position) => {
    const ligne = lecture.lignes[position];
    return ligne
      ? [
          {
            nom: texte(ligne.valeurs.nom_apprenant),
            prenom: texte(ligne.valeurs.prenom_apprenant),
            ligne: ligne.numero,
          },
        ]
      : [];
  });
}

export function fusionnerVerification(
  lecture: LectureReussie,
  valeursAEnvoyer: Record<string, unknown>[],
  reponse: ReponseVerification
): Verification {
  const erreursServeurParLigne = new Map<number, LigneVerifiee["errors"]>();
  (reponse.error?.issues ?? []).forEach((issue) => {
    const index = Number(issue.path[0]);
    erreursServeurParLigne.set(index, [
      ...(erreursServeurParLigne.get(index) ?? []),
      { key: String(issue.path[1]), message: issue.message },
    ]);
  });

  const processedData: LigneVerifiee[] = lecture.lignes.map((ligne, index) => ({
    ...ligne.valeurs,
    numero: ligne.numero,
    errors: [
      ...ligne.erreurs.map(({ cle, message }) => ({ key: cle, message })),
      ...(erreursServeurParLigne.get(index) ?? []).filter(({ key }) => !ligne.erreurs.some(({ cle }) => cle === key)),
    ],
  }));
  const erreursDeLignes = processedData.flatMap(({ errors }) => errors);
  const colonnesEnDouble = lecture.colonnesEnDouble.map((libelle) =>
    ERREURS_TELEVERSEMENT.colonne_en_double({ libelle })
  );

  const codesErreurs = new Set<string>(lecture.lignes.flatMap(({ erreurs }) => erreurs.map(({ code }) => code)));
  if (lecture.colonnesObligatoiresAbsentes.length > 0) {
    codesErreurs.add("colonne_absente");
  }
  if (colonnesEnDouble.length > 0) {
    codesErreurs.add("colonne_en_double");
  }

  const { contratsEffaces, ...autresAvertissements } = reponse.warnings ?? {};
  return {
    processedData,
    valeursAEnvoyer,
    errorsCount: erreursDeLignes.length + lecture.colonnesObligatoiresAbsentes.length + colonnesEnDouble.length,
    warnings: {
      ...autresAvertissements,
      ...(contratsEffaces && { contratsEffaces: apprentisContratEfface(lecture, contratsEffaces) }),
    },
    missingHeaders: lecture.colonnesObligatoiresAbsentes,
    colonnesEnDouble,
    columnsWithErrors: Array.from(new Set(erreursDeLignes.map(({ key }) => key))),
    codesErreurs: [...codesErreurs].sort(),
  };
}

export async function verifierFichier<Fichier>(
  fichier: Fichier | undefined,
  {
    lire,
    verifier,
    suivre,
    signaler,
  }: {
    lire: (fichier: Fichier) => Promise<ResultatLecture>;
    verifier: (valeurs: Record<string, unknown>[]) => Promise<ReponseVerification>;
    suivre: (goal: PlausibleGoalType, props?: Record<string, string>) => void;
    signaler: (err: unknown) => void;
  }
): Promise<{ succes: true; verification: Verification } | { succes: false; message: string }> {
  if (!fichier) {
    return { succes: false, message: ERREURS_TELEVERSEMENT.aucun_fichier() };
  }
  suivre("televersement_fichier_depose");
  try {
    const lecture = await lire(fichier);
    if (!lecture.succes) {
      return { succes: false, message: lecture.message };
    }
    const valeursAEnvoyer = toEffectifsQueue(
      lecture.lignes.map(({ valeurs, numero }) => ({ ...valeurs, ligne_fichier: numero }))
    );
    const verification = fusionnerVerification(lecture, valeursAEnvoyer, await verifier(valeursAEnvoyer));
    suivre(evenementVerification(verification.errorsCount), { codes: verification.codesErreurs.join(",") });
    return { succes: true, verification };
  } catch (err) {
    const message = messageEchecVerification(err);
    if (message === null) {
      signaler(err);
    }
    return { succes: false, message: message ?? MESSAGE_ERREUR_TRAITEMENT };
  }
}
