import { AxiosInstance } from "axiosist";
import { addDays } from "date-fns";
import { ObjectId } from "mongodb";
import { it, expect, describe, beforeEach } from "vitest";

import { createComputedStatutObject } from "@/common/actions/effectifs.statut.actions";
import { effectifsDb, organismesDb } from "@/common/model/collections";
import { createSampleEffectif, createRandomFormation } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { commonEffectifsAttributes, commonOrganismeAttributes } from "@tests/utils/permissions";
import { generate, id, initTestApp } from "@tests/utils/testUtils";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;

const ANNEE_SCOLAIRE = "2022-2023";

const date = "2023-04-13T10:00:00.000Z";

describe("GET /api/v1/indicateurs/national - liste des indicateurs sur les effectifs et organismes au national ", () => {
  useMongo();
  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;

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
        ...(await generate(5, async () => {
          const effectif = {
            _id: new ObjectId(),
            ...(await createSampleEffectif({
              ...(await commonEffectifsAttributes()),
              formation: createRandomFormation(ANNEE_SCOLAIRE, new Date(date)),
              annee_scolaire: ANNEE_SCOLAIRE,
              contrats: [
                {
                  date_debut: new Date(date),
                },
              ],
            })),
          };

          const effectifGenerated = {
            ...effectif,
            _computed: {
              ...effectif._computed,
              statut: createComputedStatutObject(effectif, new Date(date)),
            },
          };

          return effectifGenerated;
        })),

        // 10 Inscrit
        ...(await generate(10, async () => {
          const moinsDe90Jours = new Date(new Date(date).getTime());
          moinsDe90Jours.setDate(moinsDe90Jours.getDate() + 89);

          return {
            _id: new ObjectId(),
            ...(await createSampleEffectif({
              ...(await commonEffectifsAttributes()),
              formation: createRandomFormation(ANNEE_SCOLAIRE, new Date(date)),
              annee_scolaire: ANNEE_SCOLAIRE,
            })),
          };
        })),

        // // 15 ApprentiToAbandon
        ...(await generate(15, async () => {
          const plusDe180Jours = new Date(new Date(date).getTime());
          plusDe180Jours.setDate(plusDe180Jours.getDate() - 191);

          const effectif = {
            _id: new ObjectId(),
            ...(await createSampleEffectif({
              ...(await commonEffectifsAttributes()),
              formation: createRandomFormation(ANNEE_SCOLAIRE, plusDe180Jours),
              annee_scolaire: ANNEE_SCOLAIRE,
              contrats: [
                {
                  date_debut: plusDe180Jours,
                  date_fin: plusDe180Jours,
                  date_rupture: plusDe180Jours,
                },
              ],
            })),
          };

          const effectifGenerated = {
            ...effectif,
            _computed: {
              ...effectif._computed,
              statut: createComputedStatutObject(effectif, new Date(date)),
            },
          };

          return effectifGenerated;
        })),

        // 20 ApprentiToInscrit
        ...(await generate(20, async () => {
          const effectif = {
            _id: new ObjectId(),
            ...(await createSampleEffectif({
              ...(await commonEffectifsAttributes()),
              formation: createRandomFormation(ANNEE_SCOLAIRE, new Date(date)),
              annee_scolaire: ANNEE_SCOLAIRE,
              contrats: [
                {
                  date_debut: addDays(new Date(date), -100),
                  date_fin: addDays(new Date(date), 50),
                  date_rupture: new Date(date),
                },
              ],
            })),
          };

          const effectifGenerated = {
            ...effectif,
            _computed: {
              ...effectif._computed,
              statut: createComputedStatutObject(effectif, new Date(date)),
            },
          };

          return effectifGenerated;
        })),
      ]),
    ]);
  });

  it("Accès public", async () => {
    const response = await httpClient.get(`/api/v1/indicateurs/national?date=${date}`);

    expect(response.status).toEqual(200);
    expect(response.data).toStrictEqual({
      indicateursEffectifs: [
        {
          departement: "56",
          apprenants: 35,
          abandons: 15,
          apprentis: 5,
          inscrits: 10,
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
