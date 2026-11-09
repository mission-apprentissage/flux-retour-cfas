import { ObjectId } from "mongodb";
import { SOURCE_APPRENANT, STATUT_APPRENANT } from "shared/constants";
import { IOrganisation, IOrganisme } from "shared/models";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { beforeEach, describe, expect, it } from "vitest";

import { effectifsDECADb, effectifsDb, effectifsQueueDb, organismesDb } from "@/common/model/collections";
import { getOrganismeEffectifs, updateOrganismeEffectifs } from "@/http/routes/specific.routes/organisme.routes";
import { processEffectifsQueue } from "@/jobs/ingestion/process-ingestion";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp, RequestAsOrganisationFunc, testDoc } from "@tests/utils/testUtils";

const organisme: IOrganisme = generateOrganismeFixture({
  _id: new ObjectId(),
  fiabilisation_statut: "FIABLE",
  ferme: false,
  uai: "0000000A",
  siret: "00000000000018",
  nature: "responsable_formateur",
  is_transmission_target: false,
  erps: ["FICHIER"],
  adresse: {
    code_postal: "33400",
    code_insee: "33522",
    commune: "Talence",
    departement: "33",
    region: "75",
    academie: "04",
    complete: "680 CRS DE LA LIBERATION 33400 TALENCE",
    bassinEmploi: "7505",
  },
  nom: "CFA EN MODE FICHIER",
});

const organisation = {
  _id: organisme._id,
  type: "ORGANISME_FORMATION",
  uai: organisme.uai,
  siret: organisme.siret,
  created_at: new Date(),
};

const ligneFichier = (nom: string, prenom: string) => ({
  _id: new ObjectId(),
  nom_apprenant: nom,
  prenom_apprenant: prenom,
  date_de_naissance_apprenant: "1993-05-19T00:00:00.000Z",
  annee_scolaire: "2023-2024",
  statut_apprenant: 0,
  date_metier_mise_a_jour_statut: "2023-12-28T04:05:47.647Z",
  id_erp_apprenant: new ObjectId().toString(),
  api_version: "v3",
  source: SOURCE_APPRENANT.FICHIER,
  source_organisme_id: organisme._id.toString(),
  date_inscription_formation: "2023-09-01T00:00:00.000Z",
  date_entree_formation: "2023-09-01T00:00:00.000Z",
  date_fin_formation: "2024-06-30T00:00:00.000Z",
  etablissement_responsable_uai: organisme.uai,
  etablissement_responsable_siret: organisme.siret,
  etablissement_formateur_uai: organisme.uai,
  etablissement_formateur_siret: organisme.siret,
  etablissement_lieu_de_formation_uai: organisme.uai,
  etablissement_lieu_de_formation_siret: organisme.siret,
  created_at: new Date(),
});

const contratDeca = (nom: string, prenom: string): IEffectifDECA =>
  testDoc<IEffectifDECA>({
    _id: new ObjectId(),
    deca_raw_id: new ObjectId(),
    apprenant: {
      historique_statut: [],
      nom,
      prenom,
      date_de_naissance: new Date("1993-05-19T00:00:00.000Z"),
      adresse: {},
    },
    contrats: [],
    formation: {
      periode: [],
      date_inscription: new Date("2023-09-01T00:00:00.000Z"),
      date_fin: new Date("2024-06-30T00:00:00.000Z"),
      date_entree: new Date("2023-09-01T00:00:00.000Z"),
    },
    validation_errors: [],
    _computed: {
      organisme: {
        region: "75",
        departement: "33",
        academie: "04",
        bassinEmploi: "7505",
        uai: organisme.uai,
        siret: organisme.siret,
        fiable: true,
      },
      statut: {
        en_cours: STATUT_APPRENANT.ABANDON,
        parcours: [
          { valeur: STATUT_APPRENANT.INSCRIT, date: new Date("2023-09-01T00:00:00.000Z") },
          { valeur: STATUT_APPRENANT.ABANDON, date: new Date("2023-11-30T00:00:00.000Z") },
        ],
      },
    },
    updated_at: new Date("2024-04-24T09:23:11.040Z"),
    created_at: new Date("2024-04-24T09:23:11.021Z"),
    annee_scolaire: "2023-2024",
    source: SOURCE_APPRENANT.DECA,
    id_erp_apprenant: new ObjectId().toString(),
    organisme_id: organisme._id,
    organisme_formateur_id: organisme._id,
    organisme_responsable_id: organisme._id,
    is_deca_compatible: true,
  });

describe("Organisme hors cible qui importe par fichier", () => {
  useMongo();

  let requestAsOrganisation: RequestAsOrganisationFunc;

  beforeEach(async () => {
    const app = await initTestApp();
    requestAsOrganisation = app.requestAsOrganisation;
    await organismesDb().insertOne(organisme);
    await effectifsQueueDb().insertOne(ligneFichier("Dupont", "Jeanne"));
    await processEffectifsQueue();
    await effectifsDECADb().insertMany([contratDeca("DUPONT", "Jeanne"), contratDeca("Martin", "Paul")], {
      bypassDocumentValidation: true,
    });
  });

  it("reste hors cible après l'import", async () => {
    expect((await organismesDb().findOne({ _id: organisme._id }))?.is_transmission_target).toBe(false);
  });

  it("la liste admin montre l'effectif du fichier et le seul contrat DECA d'un autre apprenti", async () => {
    const { total, organismesEffectifs } = await getOrganismeEffectifs(organisme._id, { page: 0, limit: 10 });

    expect(total).toBe(2);
    expect(organismesEffectifs.map(({ nom, source }) => ({ nom, source }))).toEqual(
      expect.arrayContaining([
        { nom: "DUPONT", source: SOURCE_APPRENANT.FICHIER },
        { nom: "Martin", source: SOURCE_APPRENANT.DECA },
      ])
    );
  });

  it("les indicateurs comptent chaque apprenti une seule fois", async () => {
    const response = await requestAsOrganisation(
      organisation as IOrganisation,
      "get",
      `/api/v1/organismes/${organisme._id.toString()}/indicateurs/effectifs?date=2024-04-24T15:04:33.359Z`
    );

    expect(response.status).toBe(200);
    expect(response.data.abandons).toBe(2);
  });

  it("la mise à jour du type de CFA vise les effectifs du fichier", async () => {
    await updateOrganismeEffectifs(organisme._id, { "apprenant.type_cfa": "01" });

    const effectif = await effectifsDb().findOne({ organisme_id: organisme._id });
    expect(effectif?.apprenant.type_cfa).toBe("01");
  });
});
