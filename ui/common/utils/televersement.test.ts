import { ErrorCode, FileRejection } from "react-dropzone";
import { ERREURS_TELEVERSEMENT, type PlausibleGoalType } from "shared";
import { describe, expect, it, vi } from "vitest";

import { HTTPError } from "@/common/httpClient";

import type { LectureReussie, ResultatLecture } from "./lectureFichierEffectifs";
import {
  envoyerImport,
  evenementVerification,
  fusionnerVerification,
  lireAvecUnWorker,
  MESSAGE_ERREUR_ENVOI,
  MESSAGE_ERREUR_TRAITEMENT,
  messageEchecEnvoi,
  messageEchecVerification,
  messageFichierRefuse,
  verifierFichier,
  type ReponseVerification,
  type WorkerDeLecture,
} from "./televersement";

const rejet = (code: string): FileRejection[] => [
  { file: new File([], "effectifs.pdf"), errors: [{ code, message: "File type must be .xlsx" }] },
];

const erreurHttp = (status: number, message?: string) =>
  new HTTPError(
    `Server returned ${status}`,
    { status, data: { message }, headers: {} } as never,
    status,
    { message },
    "/api/v1/organismes/1/upload/import/v3"
  );

describe("messageFichierRefuse", () => {
  it("demande un seul fichier quand plusieurs sont déposés", () => {
    expect(messageFichierRefuse(rejet(ErrorCode.TooManyFiles))).toBe("Déposez un seul fichier à la fois.");
  });

  it("explique les formats acceptés pour un fichier qui n'est pas un tableur", () => {
    expect(messageFichierRefuse(rejet(ErrorCode.FileInvalidType))).toBe(
      "Ce fichier n'est pas un tableur. Déposez un fichier Excel (.xlsx, .xls), OpenDocument (.ods) ou CSV."
    );
  });

  it("ne reprend jamais le message anglais de react-dropzone", () => {
    expect(messageFichierRefuse(rejet("file-too-large"))).toBe("Ce fichier ne peut pas être déposé.");
  });
});

describe("evenementVerification", () => {
  it("distingue la vérification réussie de la vérification en erreur", () => {
    expect(evenementVerification(0)).toBe("televersement_verification_reussie");
    expect(evenementVerification(3)).toBe("televersement_verification_erreur");
  });
});

describe("messageEchecEnvoi", () => {
  it("affiche le message d'erreur réseau quand le serveur n'a pas répondu", () => {
    expect(messageEchecEnvoi(new Error("Network Error"))).toBe(MESSAGE_ERREUR_ENVOI);
  });

  it("affiche le message du serveur pour un refus", () => {
    expect(messageEchecEnvoi(erreurHttp(400, "Une ligne est hors périmètre"))).toBe("Une ligne est hors périmètre");
  });

  it("affiche le message d'erreur réseau pour une erreur serveur", () => {
    expect(messageEchecEnvoi(erreurHttp(500, "Internal Server Error"))).toBe(MESSAGE_ERREUR_ENVOI);
  });

  it("affiche le message du serveur quand l'API Alternance est indisponible", () => {
    expect(messageEchecEnvoi(erreurHttp(503, ERREURS_TELEVERSEMENT.api_indisponible()))).toBe(
      ERREURS_TELEVERSEMENT.api_indisponible()
    );
  });

  it("demande de couper un fichier trop lourd", () => {
    expect(messageEchecEnvoi(erreurHttp(413))).toBe(ERREURS_TELEVERSEMENT.fichier_trop_lourd());
  });
});

describe("messageEchecVerification", () => {
  it("affiche le message du serveur pour un refus ou une indisponibilité", () => {
    const tropDEtablissements = ERREURS_TELEVERSEMENT.trop_d_etablissements({ etablissements: 412, maximum: 200 });

    expect(messageEchecVerification(erreurHttp(400, tropDEtablissements))).toBe(tropDEtablissements);
    expect(messageEchecVerification(erreurHttp(503, ERREURS_TELEVERSEMENT.api_indisponible()))).toBe(
      ERREURS_TELEVERSEMENT.api_indisponible()
    );
  });

  it("demande de couper un fichier trop lourd", () => {
    expect(messageEchecVerification(erreurHttp(413))).toBe(ERREURS_TELEVERSEMENT.fichier_trop_lourd());
  });

  it("laisse signaler les erreurs inattendues", () => {
    expect(messageEchecVerification(erreurHttp(500, "Internal Server Error"))).toBeNull();
    expect(messageEchecVerification(new Error("Network Error"))).toBeNull();
  });
});

describe("envoyerImport", () => {
  it("suit l'import mis en file quand l'envoi réussit", async () => {
    const suivre = vi.fn();

    const resultat = await envoyerImport(() => Promise.resolve({ status: "OK" }), suivre);

    expect(resultat).toEqual({ succes: true });
    expect(suivre).toHaveBeenCalledExactlyOnceWith("televersement_import_en_file");
  });

  it("suit l'échec de l'envoi et rend le message à afficher", async () => {
    const suivre = vi.fn();

    const resultat = await envoyerImport(() => Promise.reject(new Error("Network Error")), suivre);

    expect(resultat).toEqual({ succes: false, message: MESSAGE_ERREUR_ENVOI });
    expect(suivre).toHaveBeenCalledExactlyOnceWith("televersement_echec_envoi");
  });
});

const lecture = (surcharge: Partial<LectureReussie> = {}): LectureReussie => ({
  succes: true,
  lignes: [
    { numero: 2, valeurs: { nom_apprenant: "TESTUX", prenom_apprenant: "Élodie" }, erreurs: [] },
    {
      numero: 4,
      valeurs: { nom_apprenant: "TESTUX", prenom_apprenant: "Jules" },
      erreurs: [
        {
          code: "date_illisible",
          cle: "date_entree_formation",
          message: "Date d'entrée en formation illisible : 01/13/2026. Écrivez-la sous la forme 01/09/2026.",
        },
      ],
    },
    { numero: 5, valeurs: { nom_apprenant: "TESTUX", prenom_apprenant: "Camille" }, erreurs: [] },
  ],
  colonnesReconnues: ["nom_apprenant", "prenom_apprenant", "date_entree_formation"],
  colonnesObligatoiresAbsentes: [],
  colonnesEnDouble: [],
  ...surcharge,
});

const issue = (index: number, cle: string, message: string) => ({ path: [index, cle], message, code: "custom" });

describe("fusionnerVerification", () => {
  it("place les erreurs du serveur sur les lignes lues, après celles du navigateur", () => {
    const verification = fusionnerVerification(lecture(), [], {
      error: {
        issues: [
          issue(1, "date_entree_formation", "Date d'entrée en formation manquante."),
          issue(1, "formation_rncp", "Indiquez le code RNCP ou le code diplôme de la formation."),
          issue(2, "nom_apprenant", "TESTUX Camille apparaît deux fois (lignes 2 et 5) pour la même année."),
        ],
      },
    });

    expect(verification.processedData.map(({ numero, errors }) => ({ numero, errors }))).toEqual([
      { numero: 2, errors: [] },
      {
        numero: 4,
        errors: [
          {
            key: "date_entree_formation",
            message: "Date d'entrée en formation illisible : 01/13/2026. Écrivez-la sous la forme 01/09/2026.",
          },
          { key: "formation_rncp", message: "Indiquez le code RNCP ou le code diplôme de la formation." },
        ],
      },
      {
        numero: 5,
        errors: [
          { key: "nom_apprenant", message: "TESTUX Camille apparaît deux fois (lignes 2 et 5) pour la même année." },
        ],
      },
    ]);
    expect(verification.errorsCount).toBe(3);
    expect(verification.columnsWithErrors).toEqual(["date_entree_formation", "formation_rncp", "nom_apprenant"]);
  });

  it("compte les colonnes absentes et en double, même sans erreur du serveur", () => {
    const verification = fusionnerVerification(
      lecture({ colonnesObligatoiresAbsentes: ["Début du contrat"], colonnesEnDouble: ["Nom"] }),
      [],
      {}
    );

    expect(verification.errorsCount).toBe(3);
    expect(verification.missingHeaders).toEqual(["Début du contrat"]);
    expect(verification.colonnesEnDouble).toEqual([ERREURS_TELEVERSEMENT.colonne_en_double({ libelle: "Nom" })]);
    expect(verification.codesErreurs).toEqual(["colonne_absente", "colonne_en_double", "date_illisible"]);
  });

  it("retrouve nom, prénom et ligne des contrats effacés depuis les index du serveur", () => {
    const verification = fusionnerVerification(lecture(), [], {
      warnings: { contratCount: 1, nouveaux: 1, misAJour: 2, contratsEffaces: [0, 2, 9] },
    });

    expect(verification.warnings).toEqual({
      contratCount: 1,
      nouveaux: 1,
      misAJour: 2,
      contratsEffaces: [
        { nom: "TESTUX", prenom: "Élodie", ligne: 2 },
        { nom: "TESTUX", prenom: "Camille", ligne: 5 },
      ],
    });
  });
});

const lectureSansErreur = (): LectureReussie =>
  lecture({ lignes: lecture().lignes.map((ligne) => ({ ...ligne, erreurs: [] })) });

const verifierAvec = (
  resultatLecture: ResultatLecture,
  reponse: () => Promise<ReponseVerification>,
  fichier: { name: string } | null = { name: "effectifs.xlsx" }
) => {
  const suivre = vi.fn<(goal: PlausibleGoalType, props?: Record<string, string>) => void>();
  const signaler = vi.fn();
  const verifier = vi.fn<(valeurs: Record<string, unknown>[]) => Promise<ReponseVerification>>(reponse);
  const resultat = verifierFichier(fichier ?? undefined, {
    lire: () => Promise.resolve(resultatLecture),
    verifier,
    suivre,
    signaler,
  });
  return { resultat, suivre, signaler, verifier };
};

describe("verifierFichier", () => {
  it("suit le fichier déposé puis la vérification réussie", async () => {
    const { resultat, suivre, verifier } = verifierAvec(lectureSansErreur(), () => Promise.resolve({}));

    expect(await resultat).toMatchObject({ succes: true, verification: { errorsCount: 0 } });
    expect(suivre.mock.calls).toEqual([
      ["televersement_fichier_depose"],
      ["televersement_verification_reussie", { codes: "" }],
    ]);
    expect(verifier.mock.calls[0][0].map(({ ligne_fichier }) => ligne_fichier)).toEqual([2, 4, 5]);
  });

  it("suit la vérification en erreur avec les codes trouvés, quand le serveur refuse une ligne", async () => {
    const { resultat, suivre } = verifierAvec(lectureSansErreur(), () =>
      Promise.resolve({ error: { issues: [issue(0, "formation_rncp", "Indiquez le code RNCP.")] } })
    );

    expect(await resultat).toMatchObject({ succes: true, verification: { errorsCount: 1 } });
    expect(suivre).toHaveBeenLastCalledWith("televersement_verification_erreur", { codes: "" });
  });

  it("met en échec une colonne absente même quand le serveur ne renvoie aucune erreur", async () => {
    const { resultat, suivre } = verifierAvec(
      lecture({ lignes: lectureSansErreur().lignes, colonnesObligatoiresAbsentes: ["Début du contrat"] }),
      () => Promise.resolve({})
    );

    expect(await resultat).toMatchObject({ succes: true, verification: { errorsCount: 1 } });
    expect(suivre).toHaveBeenLastCalledWith("televersement_verification_erreur", { codes: "colonne_absente" });
  });

  it("n'appelle pas le serveur quand la lecture échoue", async () => {
    const { resultat, suivre, verifier } = verifierAvec(
      { succes: false, code: "fichier_vide", message: ERREURS_TELEVERSEMENT.fichier_vide() },
      () => Promise.resolve({})
    );

    expect(await resultat).toEqual({ succes: false, message: ERREURS_TELEVERSEMENT.fichier_vide() });
    expect(verifier).not.toHaveBeenCalled();
    expect(suivre.mock.calls).toEqual([["televersement_fichier_depose"]]);
  });

  it("ne suit rien quand aucun fichier n'est reçu", async () => {
    const { resultat, suivre } = verifierAvec(lectureSansErreur(), () => Promise.resolve({}), null);

    expect(await resultat).toEqual({ succes: false, message: ERREURS_TELEVERSEMENT.aucun_fichier() });
    expect(suivre).not.toHaveBeenCalled();
  });

  it("affiche le message du serveur pour un refus de la vérification, sans le signaler", async () => {
    const message = ERREURS_TELEVERSEMENT.trop_d_etablissements({ etablissements: 412, maximum: 200 });
    const { resultat, signaler } = verifierAvec(lectureSansErreur(), () => Promise.reject(erreurHttp(400, message)));

    expect(await resultat).toEqual({ succes: false, message });
    expect(signaler).not.toHaveBeenCalled();
  });

  it("signale une erreur inattendue et affiche le message générique", async () => {
    const erreur = erreurHttp(500, "Internal Server Error");
    const { resultat, signaler } = verifierAvec(lectureSansErreur(), () => Promise.reject(erreur));

    expect(await resultat).toEqual({ succes: false, message: MESSAGE_ERREUR_TRAITEMENT });
    expect(signaler).toHaveBeenCalledExactlyOnceWith(erreur);
  });
});

describe("événements Plausible du téléversement", () => {
  it("envoie les cinq événements du parcours", async () => {
    const reussie = verifierAvec(lectureSansErreur(), () => Promise.resolve({}));
    const enErreur = verifierAvec(lecture(), () => Promise.resolve({}));
    await Promise.all([reussie.resultat, enErreur.resultat]);
    const suivreImport = vi.fn();
    await envoyerImport(() => Promise.resolve({}), suivreImport);
    await envoyerImport(() => Promise.reject(new Error("Network Error")), suivreImport);

    const evenements = [...reussie.suivre.mock.calls, ...enErreur.suivre.mock.calls, ...suivreImport.mock.calls].map(
      ([goal]) => goal
    );

    expect(new Set(evenements)).toEqual(
      new Set([
        "televersement_fichier_depose",
        "televersement_verification_reussie",
        "televersement_verification_erreur",
        "televersement_import_en_file",
        "televersement_echec_envoi",
      ])
    );
  });
});

class FauxWorker implements WorkerDeLecture {
  onmessage: WorkerDeLecture["onmessage"] = null;
  onerror: WorkerDeLecture["onerror"] = null;
  messages: unknown[] = [];
  termine = false;

  postMessage(message: unknown) {
    this.messages.push(message);
  }

  terminate() {
    this.termine = true;
  }

  repondre(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }

  planter(message: string) {
    this.onerror?.({ message } as ErrorEvent);
  }
}

describe("lireAvecUnWorker", () => {
  const demande = { contenu: new ArrayBuffer(0), nomFichier: "effectifs.xlsx", maximumLignes: 5000 };
  const lu: ResultatLecture = lectureSansErreur();
  const luIci: ResultatLecture = { succes: false, code: "fichier_vide", message: "lu ici" };

  it("rend le résultat du worker", async () => {
    const worker = new FauxWorker();
    const lireIci = vi.fn(() => luIci);

    const resultat = lireAvecUnWorker(() => worker, demande, lireIci);
    worker.repondre({ type: "demarre" });
    worker.repondre({ type: "resultat", resultat: lu });

    expect(await resultat).toBe(lu);
    expect(worker.messages).toEqual([demande]);
    expect(worker.termine).toBe(true);
    expect(lireIci).not.toHaveBeenCalled();
  });

  it("lit dans le fil principal quand le worker ne peut pas être créé", async () => {
    const resultat = lireAvecUnWorker(
      () => {
        throw new Error("Worker interdit");
      },
      demande,
      () => luIci
    );

    expect(await resultat).toBe(luIci);
  });

  it("lit dans le fil principal quand le worker ne démarre pas", async () => {
    const worker = new FauxWorker();

    const resultat = lireAvecUnWorker(
      () => worker,
      demande,
      () => luIci
    );
    worker.planter("Failed to fetch worker chunk");

    expect(await resultat).toBe(luIci);
  });

  it("ne relit pas le fichier dans le fil principal quand la lecture échoue dans le worker", async () => {
    const worker = new FauxWorker();
    const lireIci = vi.fn(() => luIci);

    const resultat = lireAvecUnWorker(() => worker, demande, lireIci);
    worker.repondre({ type: "demarre" });
    worker.planter("Array buffer allocation failed");

    await expect(resultat).rejects.toThrow("Array buffer allocation failed");
    expect(lireIci).not.toHaveBeenCalled();
    expect(worker.termine).toBe(true);
  });
});
