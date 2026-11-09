import { ObjectId } from "mongodb";
import nock from "nock";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IOrganisationCreate } from "shared/models/data/organisations.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { beforeEach, describe, expect, it } from "vitest";

import { effectifsDb, effectifsQueueDb, organismesDb } from "@/common/model/collections";
import { createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";
import { initTestApp, RequestAsOrganisationFunc, testDoc } from "@tests/utils/testUtils";

const API = "https://api.apprentissage.beta.gouv.fr/api";

const IMPORTATEUR = { uai: "0610071W", siret: "77777777200016" };
const TIERS = { uai: "0610077C", siret: "88888888000018" };
const TIERS_API_EN_PANNE = { uai: "0610079E", siret: "99999998000017" };

const organisation: IOrganisationCreate = { type: "ORGANISME_FORMATION", ...IMPORTATEUR };

type Identifiant = { uai: string; siret: string };

function mockRechercheExacte({ uai, siret }: Identifiant) {
  nock(API)
    .get("/organisme/v1/recherche")
    .query({ uai, siret })
    .reply(200, {
      metadata: { uai: { status: "ok" }, siret: { status: "ok" } },
      resultat: {
        status: { ouvert: true, declaration_catalogue: true, validation_uai: true },
        correspondances: {
          uai: { lui_meme: true, son_lieu: false },
          siret: { lui_meme: true, son_formateur: false, son_responsable: false },
        },
        organisme: { identifiant: { uai, siret } },
      },
      candidats: [],
    })
    .persist();
}

function mockRechercheSansResultat() {
  nock(API)
    .get("/organisme/v1/recherche")
    .query(true)
    .reply(200, { metadata: { uai: { status: "ok" }, siret: { status: "ok" } }, resultat: null, candidats: [] })
    .persist();
}

let numero = 0;

const ligneFichier = (formateur: Identifiant, extra: Record<string, unknown> = {}): Record<string, unknown> => {
  numero += 1;
  return {
    ligne_fichier: numero + 1,
    id_erp_apprenant: `apprenant-${numero}`,
    nom_apprenant: "Dupuis",
    prenom_apprenant: `Gaston${numero}`,
    date_de_naissance_apprenant: "2006-03-15",
    annee_scolaire: "2026-2027",
    date_inscription_formation: "2026-09-01",
    date_entree_formation: "2026-09-01",
    date_fin_formation: "2028-06-30",
    etablissement_responsable_uai: IMPORTATEUR.uai,
    etablissement_responsable_siret: IMPORTATEUR.siret,
    etablissement_formateur_uai: formateur.uai,
    etablissement_formateur_siret: formateur.siret,
    formation_rncp: "RNCP12345",
    code_postal_apprenant: "60000",
    email_contact: "gaston.dupuis@domaine.fr",
    contrat_date_debut: "2026-09-01",
    ...extra,
  };
};

type Issue = { path: [number, string]; message: string };

describe("Vérification de l'import par fichier", () => {
  useNock();
  useMongo();

  let importateur: IOrganisme;
  let requestAsOrganisation: RequestAsOrganisationFunc;

  const verifier = async (lignes: Record<string, unknown>[]) => {
    const response = await requestAsOrganisation(
      organisation,
      "post",
      `/api/v1/organismes/${importateur._id}/upload/validate`,
      lignes
    );
    expect(response.status).toBe(200);
    return response.data as {
      success: boolean;
      error?: { issues: Issue[] };
      warnings: { contratCount: number; nouveaux: number; misAJour: number; contratsEffaces: unknown[] };
    };
  };

  beforeEach(async () => {
    numero = 0;
    const app = await initTestApp();
    requestAsOrganisation = app.requestAsOrganisation;
    importateur = { _id: new ObjectId(), ...createRandomOrganisme({ reseaux: [] }), ...IMPORTATEUR };
    await organismesDb().insertMany([
      importateur,
      { _id: new ObjectId(), ...createRandomOrganisme({ reseaux: [] }), ...TIERS },
      { _id: new ObjectId(), ...createRandomOrganisme({ reseaux: [] }), ...TIERS_API_EN_PANNE },
    ]);
  });

  it("accepte un fichier sans erreur et compte les nouveaux", async () => {
    mockRechercheExacte(IMPORTATEUR);

    const resultat = await verifier([ligneFichier(IMPORTATEUR), ligneFichier(IMPORTATEUR)]);

    expect(resultat).toEqual({
      success: true,
      warnings: { contratCount: 0, nouveaux: 2, misAJour: 0, contratsEffaces: [] },
    });
  });

  it("signale la ligne hors périmètre dans sa cellule", async () => {
    [IMPORTATEUR, TIERS].forEach(mockRechercheExacte);

    const resultat = await verifier([ligneFichier(IMPORTATEUR), ligneFichier(TIERS)]);

    expect(resultat.error?.issues).toEqual([
      {
        path: [1, "etablissement_formateur_uai"],
        message: expect.stringContaining("L'établissement 0610077C n'est pas rattaché à"),
        code: "custom",
        motif: "hors_perimetre",
      },
    ]);
  });

  it("détecte un couple UAI et SIRET qui existent chacun de leur côté", async () => {
    mockRechercheExacte(IMPORTATEUR);
    mockRechercheSansResultat();

    const resultat = await verifier([ligneFichier({ uai: IMPORTATEUR.uai, siret: TIERS.siret })]);

    expect(resultat.error?.issues).toEqual([
      {
        path: [0, "etablissement_formateur_uai"],
        message: `Aucun établissement ne correspond à l'UAI ${IMPORTATEUR.uai} et au SIRET ${TIERS.siret}. Vérifiez les deux numéros.`,
        code: "custom",
        motif: "etablissement_inconnu",
      },
    ]);
  });

  it("détecte la fin de formation avant l'entrée et le contrat sans date de début", async () => {
    mockRechercheExacte(IMPORTATEUR);

    const resultat = await verifier([
      ligneFichier(IMPORTATEUR, { date_fin_formation: "2026-01-01" }),
      ligneFichier(IMPORTATEUR, { contrat_date_debut: undefined, contrat_date_rupture: "2026-12-01" }),
    ]);

    expect(resultat.error?.issues.map(({ path, message }) => [...path, message])).toEqual([
      [0, "date_fin_formation", "La fin de formation (01/01/2026) est avant l'entrée en formation (01/09/2026)."],
      [
        1,
        "contrat_date_debut",
        "La date de début du contrat manque, alors que sa fin, sa rupture ou sa cause de rupture est renseignée.",
      ],
    ]);
  });

  it("dit en français quelle cellule obligatoire est vide ou mal formée", async () => {
    mockRechercheExacte(IMPORTATEUR);

    const resultat = await verifier([
      ligneFichier(IMPORTATEUR, { date_entree_formation: undefined, siret_employeur: "1234" }),
    ]);

    expect(resultat.error?.issues.map(({ path, message }) => [...path, message])).toEqual([
      [0, "siret_employeur", "SIRET de l'employeur du contrat : valeur mal formée (1234). Il compte 14 chiffres."],
      [0, "date_entree_formation", "Date d'entrée en formation : à renseigner."],
    ]);
  });

  it("signale le même apprenant deux fois chez le même formateur la même année, avec ses numéros de ligne", async () => {
    mockRechercheExacte(IMPORTATEUR);
    const premiere = ligneFichier(IMPORTATEUR, { prenom_apprenant: "Camille", nom_apprenant: "Martin" });
    const seconde = ligneFichier(IMPORTATEUR, {
      prenom_apprenant: "Camille",
      nom_apprenant: "Martin",
      id_erp_apprenant: premiere.id_erp_apprenant,
    });
    const autreAnnee = ligneFichier(IMPORTATEUR, {
      id_erp_apprenant: premiere.id_erp_apprenant,
      annee_scolaire: "2025-2026",
      date_inscription_formation: "2025-09-01",
      date_entree_formation: "2025-09-01",
    });

    const resultat = await verifier([premiere, seconde, autreAnnee]);

    const message = "Camille Martin apparaît deux fois (lignes 2 et 3) pour la même année. Gardez une seule ligne.";
    expect(resultat.error?.issues).toEqual([
      { path: [0, "nom_apprenant"], message, code: "custom", motif: "doublon" },
      { path: [1, "nom_apprenant"], message, code: "custom", motif: "doublon" },
    ]);
  });

  it("prévient des contrats connus qui seraient retirés par l'import (R5)", async () => {
    mockRechercheExacte(IMPORTATEUR);
    const avecMoinsDeContrats = ligneFichier(IMPORTATEUR, { nom_apprenant: "Martin", prenom_apprenant: "Camille" });
    const sansContrat = ligneFichier(IMPORTATEUR, {
      nom_apprenant: "Durand",
      prenom_apprenant: "Lou",
      contrat_date_debut: undefined,
    });
    const memesContrats = ligneFichier(IMPORTATEUR);
    const nouveau = ligneFichier(IMPORTATEUR);
    const contrat = { date_debut: new Date("2026-09-01"), date_fin: new Date("2028-06-30") };
    await effectifsDb().insertMany(
      [
        { ligne: avecMoinsDeContrats, contrats: [contrat, contrat] },
        { ligne: sansContrat, contrats: [contrat] },
        { ligne: memesContrats, contrats: [contrat] },
      ].map(({ ligne, contrats }) =>
        testDoc<IEffectif>({
          organisme_id: importateur._id,
          annee_scolaire: ligne.annee_scolaire as string,
          id_erp_apprenant: ligne.id_erp_apprenant as string,
          contrats,
        })
      ),
      { bypassDocumentValidation: true }
    );

    const resultat = await verifier([avecMoinsDeContrats, sansContrat, memesContrats, nouveau]);

    expect(resultat).toEqual({
      success: true,
      warnings: {
        contratCount: 1,
        nouveaux: 1,
        misAJour: 3,
        contratsEffaces: [
          { nom: "Martin", prenom: "Camille", ligne: avecMoinsDeContrats.ligne_fichier },
          { nom: "Durand", prenom: "Lou", ligne: sansContrat.ligne_fichier },
        ],
      },
    });
  });

  it("l'import refuse toute la requête quand une ligne est en erreur", async () => {
    [IMPORTATEUR, TIERS].forEach(mockRechercheExacte);

    const response = await requestAsOrganisation(
      organisation,
      "post",
      `/api/v1/organismes/${importateur._id}/upload/import/v3`,
      [ligneFichier(IMPORTATEUR), ligneFichier(TIERS)]
    );

    expect(response.status).toBe(400);
    expect(response.data.message).toMatch(/^Corrigez les erreurs avant d'importer\. L'établissement 0610077C/);
    expect(await effectifsQueueDb().countDocuments({})).toBe(0);
  });

  it("l'import met en file les lignes vérifiées sous un même identifiant, sans le numéro de ligne", async () => {
    mockRechercheExacte(IMPORTATEUR);

    const response = await requestAsOrganisation(
      organisation,
      "post",
      `/api/v1/organismes/${importateur._id}/upload/import/v3`,
      [ligneFichier(IMPORTATEUR), ligneFichier(IMPORTATEUR)]
    );

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ upload_id: expect.stringMatching(/^[0-9a-f]{24}$/), lignes: 2 });
    const enFile = await effectifsQueueDb().find({ source_organisme_id: importateur._id.toString() }).toArray();
    expect(enFile).toHaveLength(2);
    expect(enFile.map(({ upload_id }) => upload_id)).toEqual([response.data.upload_id, response.data.upload_id]);
    expect(enFile[0]).not.toHaveProperty("ligne_fichier");
    expect(enFile[0].validation_errors).toEqual([]);
  });

  it("les deux routes acceptent 5 000 lignes et refusent au-delà", async () => {
    const response = await requestAsOrganisation(
      organisation,
      "post",
      `/api/v1/organismes/${importateur._id}/upload/validate`,
      Array.from({ length: 5001 }, () => ({}))
    );

    expect(response.status).toBe(400);
    expect(JSON.stringify(response.data)).toContain("less than or equal to 5000 items");
  });

  it("les deux routes répondent 503 quand l'API Alternance est indisponible", async () => {
    nock(API).get("/organisme/v1/recherche").query(true).replyWithError("API indisponible").persist();

    for (const route of ["validate", "import/v3"]) {
      const response = await requestAsOrganisation(
        organisation,
        "post",
        `/api/v1/organismes/${importateur._id}/upload/${route}`,
        [ligneFichier(TIERS_API_EN_PANNE)]
      );

      expect(response.status).toBe(503);
      expect(response.data.message).toBe(
        "La vérification des établissements est momentanément impossible. Réessayez dans quelques minutes. Rien n'a été importé."
      );
    }
    expect(await effectifsQueueDb().countDocuments({})).toBe(0);
  });
});
