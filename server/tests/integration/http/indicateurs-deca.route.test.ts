import { ObjectId } from "mongodb";
import { SOURCE_APPRENANT } from "shared/constants";
import { IOrganisation, IOrganisme } from "shared/models";
import { it, expect, describe, beforeEach } from "vitest";

import { organismesDb, effectifsQueueDb, effectifsDECADb } from "@/common/model/collections";
import { processEffectifsQueue } from "@/jobs/ingestion/process-ingestion";
import { getRandomSourceOrganismeId } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { RequestAsOrganisationFunc, initTestApp } from "@tests/utils/testUtils";

let app: Awaited<ReturnType<typeof initTestApp>>;
let requestAsOrganisation: RequestAsOrganisationFunc;

const idResp = new ObjectId();
const idForm = new ObjectId();

const organismeResponsable: IOrganisme = {
  _id: idResp,
  fiabilisation_statut: "FIABLE",
  ferme: false,
  created_at: new Date(),
  updated_at: new Date(),
  uai: "0000000A",
  siret: "00000000000018",
  nature: "responsable",
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
  nom: "MON ORGANISME FORMATEUR",
};

const organismeFormateur: IOrganisme = {
  _id: idForm,
  fiabilisation_statut: "FIABLE",
  ferme: false,
  created_at: new Date(),
  updated_at: new Date(),
  uai: "0000000B",
  siret: "00000000000019",
  nature: "formateur",
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
  nom: "MON ORGANISME RESPONSABLE",
};

organismeResponsable.organismesFormateurs = [
  { _id: organismeFormateur._id, siret: organismeFormateur.siret, uai: organismeFormateur.uai },
];
organismeFormateur.organismesResponsables = [
  { _id: organismeResponsable._id, siret: organismeResponsable.siret, uai: organismeResponsable.uai },
];

const organisation = {
  _id: idResp,
  type: "ORGANISME_FORMATION",
  uai: organismeResponsable.uai,
  siret: organismeResponsable.siret,
  created_at: new Date(),
};

const createEff = (org) => ({
  _id: new ObjectId(),
  nom_apprenant: new ObjectId().toString(),
  prenom_apprenant: new ObjectId().toString(),
  date_de_naissance_apprenant: "1993-05-19T00:00:00.000Z",
  annee_scolaire: `2023-2024`,
  statut_apprenant: 0,
  date_metier_mise_a_jour_statut: `2023-12-28T04:05:47.647Z`,
  id_erp_apprenant: new ObjectId().toString(),
  api_version: "v3",
  source: SOURCE_APPRENANT.FICHIER,
  source_organisme_id: getRandomSourceOrganismeId(),
  date_inscription_formation: `2023-09-01T00:00:00.000Z`,
  date_entree_formation: `2023-09-01T00:00:00.000Z`,
  date_fin_formation: `2024-06-30T00:00:00.000Z`,

  etablissement_responsable_uai: org.uai,
  etablissement_responsable_siret: org.siret,
  etablissement_formateur_uai: org.uai,
  etablissement_formateur_siret: org.siret,
  etablissement_lieu_de_formation_uai: org.uai,
  etablissement_lieu_de_formation_siret: org.siret,
  created_at: new Date(),
});

const createEffDECA = (org) => ({
  _id: new ObjectId(),
  deca_raw_id: new ObjectId(),
  apprenant: {
    historique_statut: [
      {
        valeur_statut: 0,
        date_statut: new Date("2023-12-28T04:05:47.647Z"),
        date_reception: new Date("2024-04-24T09:23:11.020Z"),
      },
    ],
    nom: new ObjectId().toString(),
    prenom: new ObjectId().toString(),
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
  is_lock: {
    apprenant: {
      nom: true,
      prenom: true,
      date_de_naissance: true,
      historique_statut: true,
    },
    formation: {
      cfd: true,
      periode: true,
    },
    contrats: true,
  },
  validation_errors: [],
  _computed: {
    organisme: {
      region: org.adresse.region,
      departement: org.adresse.departement,
      academie: org.adresse.academie,
      bassinEmploi: org.adresse.bassinEmploi,
      uai: org.uai,
      siret: org.siret,
      fiable: true,
    },
    statut: {
      en_cours: "ABANDON",
      parcours: [
        {
          valeur: "INSCRIT",
          date: new Date("2023-09-01T00:00:00.000Z"),
        },
        {
          valeur: "ABANDON",
          date: new Date("2023-11-30T00:00:00.000Z"),
        },
      ],
    },
  },
  updated_at: new Date("2024-04-24T09:23:11.040Z"),
  created_at: new Date("2024-04-24T09:23:11.021Z"),
  annee_scolaire: "2023-2024",
  source: SOURCE_APPRENANT.FICHIER,
  source_organisme_id: getRandomSourceOrganismeId(),
  id_erp_apprenant: new ObjectId().toString(),
  organisme_id: org._id,
  organisme_formateur_id: org._id,
  organisme_responsable_id: org._id,
  is_deca_compatible: true,
});

/**
 *
 * @param nbEffR Nombre d'effectif transmis présent chez le responsable
 * @param nbEffF  Nombre d'effectif transmis présent chez le formateur
 * @param nbEffR_DECA Nombre d'effectif DECA présent chez le responsable
 * @param nbEffF_DECA Nombre d'effectif DECA présent chez le formateur
 * @param expected_nbEffR Nombre d'effectif attendu en indicateur chez le reponsable ( cumulé avec hierarchie )
 * @param expected_nbEffF Nombre d'effectif attendu en indicateur chez le formateur
 * @param fromDECA Indique si les données sont cénsées provenir de DECA ou des vrais effectifs
 */
const testDeca = async (nbEffR, nbEffF, nbEffR_DECA, nbEffF_DECA, expected_nbEffR, expected_nbEffF, fromDECA) => {
  const effR = [...new Array(nbEffR)].map(() => createEff(organismeResponsable));
  const effF = [...new Array(nbEffF)].map(() => createEff(organismeFormateur));

  const effRDeca: any[] = [...new Array(nbEffR_DECA)].map(() => createEffDECA(organismeResponsable));
  const effFDeca: any[] = [...new Array(nbEffF_DECA)].map(() => createEffDECA(organismeFormateur));

  effR.length && (await effectifsQueueDb().insertMany(effR));
  effF.length && (await effectifsQueueDb().insertMany(effF));
  effRDeca.length && (await effectifsDECADb().insertMany(effRDeca));
  effFDeca.length && (await effectifsDECADb().insertMany(effFDeca));

  await processEffectifsQueue();
  const responseResp = await requestAsOrganisation(
    organisation as IOrganisation,
    "get",
    `/api/v1/organismes/${idResp.toString()}/indicateurs/effectifs?date=2024-04-24T15:04:33.359Z`
  );

  const responseForm = await requestAsOrganisation(
    organisation as IOrganisation,
    "get",
    `/api/v1/organismes/${idForm.toString()}/indicateurs/effectifs?date=2024-04-24T15:04:33.359Z`
  );
  fromDECA
    ? expect((await effectifsDECADb().find({ is_deca_compatible: true }).toArray()).length).toBeGreaterThan(0)
    : expect((await effectifsDECADb().find({ is_deca_compatible: true }).toArray()).length).toBe(0);
  expect(responseResp.data.abandons).toBe(expected_nbEffR);
  expect(responseForm.data.abandons).toBe(expected_nbEffF);
};

describe("Test des indicateurs avec des données DECA", () => {
  useMongo();
  beforeEach(async () => {
    app = await initTestApp();
    requestAsOrganisation = app.requestAsOrganisation;
  });

  beforeEach(async () => {
    await organismesDb().insertMany([organismeResponsable, organismeFormateur]);
  });

  it("Indicateur avec DECA - 1", async () => {
    await testDeca(1, 0, 0, 0, 1, 0, false);
  });

  it("Indicateur avec DECA - 2", async () => {
    await testDeca(0, 0, 1, 0, 1, 0, true);
  });

  it("Indicateur avec DECA - 3", async () => {
    await testDeca(0, 0, 0, 1, 1, 1, true);
  });

  it("Indicateur avec DECA - 4", async () => {
    await testDeca(0, 1, 0, 0, 1, 1, false);
  });

  it("Indicateur avec DECA - 5", async () => {
    await testDeca(0, 1, 0, 1, 1, 1, false);
  });

  it("Indicateur avec DECA - 6", async () => {
    await testDeca(0, 0, 1, 0, 1, 0, true);
  });

  it("Indicateur avec DECA - 7", async () => {
    await testDeca(0, 0, 1, 1, 2, 1, true);
  });

  it("Indicateurs avec DECA - 8", async () => {
    await testDeca(0, 1, 1, 0, 1, 1, false);
  });

  it("Indicateurs avec DECA - 9", async () => {
    await testDeca(0, 1, 1, 1, 1, 1, false);
  });

  it("Indicateurs avec DECA - 10", async () => {
    await testDeca(1, 0, 0, 0, 1, 0, false);
  });

  it("Indicateurs avec DECA - 11", async () => {
    await testDeca(1, 0, 0, 1, 1, 0, false);
  });

  it("Indicateurs avec DECA - 12", async () => {
    await testDeca(1, 1, 0, 0, 2, 1, false);
  });

  it("Indicateurs avec DECA - 13", async () => {
    await testDeca(1, 1, 0, 1, 2, 1, false);
  });

  it("Indicateurs avec DECA - 14", async () => {
    await testDeca(1, 0, 1, 0, 1, 0, false);
  });

  it("Indicateurs avec DECA - 15", async () => {
    await testDeca(1, 0, 1, 1, 1, 0, false);
  });

  it("Indicateurs avec DECA - 16", async () => {
    await testDeca(1, 1, 1, 0, 2, 1, false);
  });

  it("Indicateurs avec DECA - 17", async () => {
    await testDeca(1, 1, 1, 1, 2, 1, false);
  });
});
