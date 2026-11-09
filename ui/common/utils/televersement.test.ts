import { ErrorCode, FileRejection } from "react-dropzone";
import { describe, expect, it, vi } from "vitest";

import { HTTPError } from "@/common/httpClient";

import {
  envoyerImport,
  evenementVerification,
  MESSAGE_ERREUR_ENVOI,
  messageEchecEnvoi,
  messageFichierRefuse,
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
