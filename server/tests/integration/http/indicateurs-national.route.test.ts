import { AxiosInstance } from "axiosist";
import { ObjectId } from "mongodb";

import { effectifsDb, organismesDb } from "@/common/model/collections";
import {
  historySequenceApprenti,
  historySequenceApprentiToAbandon,
  historySequenceApprentiToInscrit,
  historySequenceInscrit,
} from "@tests/data/historySequenceSamples";
import { createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { commonEffectifsAttributes, commonOrganismeAttributes } from "@tests/utils/permissions";
import { generate, id, initTestApp } from "@tests/utils/testUtils";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;

describe("GET /api/v1/indicateurs/national - liste des indicateurs sur les effectifs et organismes au national ", () => {
  useMongo();
  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;

    const anneeScolaire = "2022-2023";
    await Promise.all([
      organismesDb().insertMany([
        {
          ...commonOrganismeAttributes,
          _id: new ObjectId(id(1)),
          uai: "0000000A",
          siret: "00000000000018",
          nature: "formateur",
          first_transmission_date: new Date("2023-01-01T00:00:00.000Z"),
        },
        {
          ...commonOrganismeAttributes,
          _id: new ObjectId(id(2)),
          uai: "0000000B",
          siret: "00000000000026",
          nature: "responsable_formateur",
          first_transmission_date: new Date("2023-01-01T00:00:00.000Z"),
        },
        {
          ...commonOrganismeAttributes,
          _id: new ObjectId(id(3)),
          uai: "0000000C",
          siret: "00000000000034",
          nature: "responsable",
          first_transmission_date: new Date("2023-01-01T00:00:00.000Z"),
        },
        {
          ...commonOrganismeAttributes,
          _id: new ObjectId(id(10)),
          uai: "1111111B",
          siret: "11111111100006",
          nature: "responsable_formateur",
          first_transmission_date: new Date("2023-01-01T00:00:00.000Z"),
        },
      ]),
      effectifsDb().insertMany([
        // 5 apprentis
        ...generate(5, () =>
          createSampleEffectif({
            ...commonEffectifsAttributes,
            annee_scolaire: anneeScolaire,
            apprenant: {
              historique_statut: historySequenceApprenti,
            },
          })
        ),

        // 10 Inscrit
        ...generate(10, () =>
          createSampleEffectif({
            ...commonEffectifsAttributes,
            annee_scolaire: anneeScolaire,
            apprenant: {
              historique_statut: historySequenceInscrit,
            },
          })
        ),

        // 15 ApprentiToAbandon
        ...generate(15, () =>
          createSampleEffectif({
            ...commonEffectifsAttributes,
            annee_scolaire: anneeScolaire,
            apprenant: {
              historique_statut: historySequenceApprentiToAbandon,
            },
          })
        ),

        // 20 ApprentiToInscrit
        ...generate(20, () =>
          createSampleEffectif({
            ...commonEffectifsAttributes,
            annee_scolaire: anneeScolaire,
            apprenant: {
              historique_statut: historySequenceApprentiToInscrit,
            },
          })
        ),
      ]),
    ]);
  });

  it("Accès public", async () => {
    const date = "2023-04-13T10:00:00.000Z";
    const response = await httpClient.get(`/api/v1/indicateurs/national?date=${date}`);

    expect(response.status).toEqual(200);
    expect(response.data).toStrictEqual({
      indicateursEffectifs: [
        {
          departement: "56",
          apprenants: 35,
          abandons: 15,
          apprentis: 5,
          inscritsSansContrat: 10,
          rupturants: 20,
        },
      ],
      indicateursOrganismes: [
        {
          departement: "56",
          organismesNonTransmetteurs: {
            formateurs: 0,
            inconnues: 0,
            responsables: 0,
            responsablesFormateurs: 0,
            total: 0,
          },
          organismesTransmetteurs: {
            total: 4,
            inconnues: 0,
            responsablesFormateurs: 2,
            responsables: 1,
            formateurs: 1,
          },
          tauxCouverture: {
            formateurs: 100,
            inconnues: 100,
            responsables: 100,
            responsablesFormateurs: 100,
            total: 100,
          },
          totalOrganismes: {
            formateurs: 1,
            inconnues: 0,
            responsables: 1,
            responsablesFormateurs: 2,
            total: 4,
          },
        },
      ],
    });
  });
});
