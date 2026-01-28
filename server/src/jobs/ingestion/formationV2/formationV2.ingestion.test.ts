import { cfdCodeFixtures, rncpCodeFixtures, siretFixtures, uaiFixtures } from "api-alternance-sdk/fixtures";
import { ObjectId } from "mongodb";
import { describe, it, expect } from "vitest";

import { formationV2Db } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { ingestFormationV2, type IIngestFormationV2Params } from "./formationV2.ingestion";

useMongo();

describe("ingestFormationV2", () => {
  const dossier = {
    formation_cfd: cfdCodeFixtures[13512840],
    formation_rncp: rncpCodeFixtures.RNCP36092,
    etablissement_responsable_siret: siretFixtures[19350030300014],
    etablissement_responsable_uai: uaiFixtures["0491801S"],
    etablissement_formateur_siret: siretFixtures[26590673500120],
    etablissement_formateur_uai: uaiFixtures["0631408N"],
    date_entree_formation: new Date("2024-09-01T00:00:00.000Z"),
    date_fin_formation: new Date("2026-08-31T00:00:00.000Z"),
  } as const satisfies IIngestFormationV2Params;

  it("doit créer une nouvelle formation si celle-ci n'existe pas", async () => {
    const result = await ingestFormationV2(dossier);

    expect(result).toEqual({
      _id: expect.any(ObjectId),
      identifiant: {
        cfd: dossier.formation_cfd,
        rncp: dossier.formation_rncp,
        responsable_siret: dossier.etablissement_responsable_siret,
        responsable_uai: dossier.etablissement_responsable_uai,
        formateur_siret: dossier.etablissement_formateur_siret,
        formateur_uai: dossier.etablissement_formateur_uai,
      },
      draft: true,
      fiabilisation: {
        responsable_siret: null,
        responsable_uai: null,
        formateur_siret: null,
        formateur_uai: null,
      },
      organisme_formateur_id: null,
      organisme_responsable_id: null,
      computed: { formation: null },
    });

    expect(await formationV2Db().find({}).toArray()).toEqual([result]);
  });

  it("doit retourner la formation existante si celle-ci existe", async () => {
    const existingFormation = {
      _id: new ObjectId(),
      identifiant: {
        cfd: dossier.formation_cfd,
        rncp: dossier.formation_rncp,
        responsable_siret: dossier.etablissement_responsable_siret,
        responsable_uai: dossier.etablissement_responsable_uai,
        formateur_siret: dossier.etablissement_formateur_siret,
        formateur_uai: dossier.etablissement_formateur_uai,
      },
      draft: false,
    };

    await formationV2Db().insertOne(existingFormation);

    const result = await ingestFormationV2(dossier);

    expect(result).toEqual(existingFormation);

    expect(await formationV2Db().find({}).toArray()).toEqual([existingFormation]);
  });

  it("doit utiliser la bonne clé d'unicité", async () => {
    const existingFormations = [
      {
        _id: new ObjectId(),
        identifiant: {
          cfd: cfdCodeFixtures[20512008],
          rncp: dossier.formation_rncp,
          responsable_siret: dossier.etablissement_responsable_siret,
          responsable_uai: dossier.etablissement_responsable_uai,
          formateur_siret: dossier.etablissement_formateur_siret,
          formateur_uai: dossier.etablissement_formateur_uai,
        },
        draft: false,
      },
      {
        _id: new ObjectId(),
        identifiant: {
          cfd: dossier.formation_cfd,
          rncp: rncpCodeFixtures.RNCP36629,
          responsable_siret: dossier.etablissement_responsable_siret,
          responsable_uai: dossier.etablissement_responsable_uai,
          formateur_siret: dossier.etablissement_formateur_siret,
          formateur_uai: dossier.etablissement_formateur_uai,
        },
        draft: false,
      },
      {
        _id: new ObjectId(),
        identifiant: {
          cfd: dossier.formation_cfd,
          rncp: dossier.formation_rncp,
          responsable_siret: siretFixtures[19850144700025],
          responsable_uai: dossier.etablissement_responsable_uai,
          formateur_siret: dossier.etablissement_formateur_siret,
          formateur_uai: dossier.etablissement_formateur_uai,
        },
        draft: false,
      },
      {
        _id: new ObjectId(),
        identifiant: {
          cfd: dossier.formation_cfd,
          rncp: dossier.formation_rncp,
          responsable_siret: dossier.etablissement_responsable_siret,
          responsable_uai: uaiFixtures["0594899E"],
          formateur_siret: dossier.etablissement_formateur_siret,
          formateur_uai: dossier.etablissement_formateur_uai,
        },
        draft: false,
      },
      {
        _id: new ObjectId(),
        identifiant: {
          cfd: dossier.formation_cfd,
          rncp: dossier.formation_rncp,
          responsable_siret: dossier.etablissement_responsable_siret,
          responsable_uai: dossier.etablissement_responsable_uai,
          formateur_siret: siretFixtures[19850144700025],
          formateur_uai: dossier.etablissement_formateur_uai,
        },
        draft: false,
      },
      {
        _id: new ObjectId(),
        identifiant: {
          cfd: dossier.formation_cfd,
          rncp: dossier.formation_rncp,
          responsable_siret: dossier.etablissement_responsable_siret,
          responsable_uai: dossier.etablissement_responsable_uai,
          formateur_siret: dossier.etablissement_formateur_siret,
          formateur_uai: uaiFixtures["0594899E"],
        },
        draft: false,
      },
    ];

    await formationV2Db().insertMany(existingFormations);

    const result = await ingestFormationV2(dossier);

    expect({
      _id: expect.any(ObjectId),
      identifiant: {
        cfd: dossier.formation_cfd,
        rncp: dossier.formation_rncp,
        responsable_siret: dossier.etablissement_responsable_siret,
        responsable_uai: dossier.etablissement_responsable_uai,
        formateur_siret: dossier.etablissement_formateur_siret,
        formateur_uai: dossier.etablissement_formateur_uai,
      },
      draft: true,
      organisme_formateur_id: null,
      organisme_responsable_id: null,
      fiabilisation: {
        responsable_siret: null,
        responsable_uai: null,
        formateur_siret: null,
        formateur_uai: null,
      },
      computed: { formation: null },
    }).toEqual(result);

    expect(await formationV2Db().countDocuments()).toBe(existingFormations.length + 1);
  });
});
