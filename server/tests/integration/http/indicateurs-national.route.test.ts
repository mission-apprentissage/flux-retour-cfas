import { AxiosInstance } from "axiosist";

import { effectifsDb, organismesDb } from "@/common/model/collections";
import {
  historySequenceApprenti,
  historySequenceApprentiToAbandon,
  historySequenceApprentiToInscrit,
  historySequenceInscrit,
} from "@tests/data/historySequenceSamples";
import { createSampleEffectif } from "@tests/data/randomizedSample";
import { commonEffectifsAttributes, organismes } from "@tests/utils/permissions";
import { generate, initTestApp } from "@tests/utils/testUtils";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;

describe("GET /api/v1/indicateurs/national - liste des indicateurs sur les effectifs et organismes au national ", () => {
  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;

    const anneeScolaire = "2022-2023";
    await Promise.all([
      organismesDb().insertMany(organismes),
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
      indicateursOrganismes: {
        total: 4,
        responsablesFormateurs: 2,
        responsables: 1,
        formateurs: 1,
      },
    });
  });
});
