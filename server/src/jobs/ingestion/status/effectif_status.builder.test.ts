import type { IEffectifComputedStatut, IEffectifV2 } from "shared/models";
import { describe, expect, it } from "vitest";

import { buildEffectifStatus } from "./effectif_status.builder";

describe("buildEffectifStatus", () => {
  const now = new Date("2025-03-06");

  const testCases: [Pick<IEffectifV2, "session" | "contrats" | "exclusion">, IEffectifComputedStatut | null][] = [
    [
      // Cas d'acceptation #1
      {
        session: { debut: new Date("2024-09-01"), fin: new Date("2025-08-31") },
        contrats: {
          "2024-10-01": {
            date_debut: new Date("2024-10-01T00:00:00.000Z"),
            date_fin: new Date("2025-08-31T00:00:00.000Z"),
            rupture: null,
            employeur: { siret: null },
          },
        },
        exclusion: null,
      },
      {
        en_cours: "APPRENTI",
        parcours: [
          {
            valeur: "INSCRIT",
            date: new Date("2024-09-01"),
          },
          {
            valeur: "APPRENTI",
            date: new Date("2024-10-01"),
          },
          {
            valeur: "FIN_DE_FORMATION",
            date: new Date("2025-08-31"),
          },
        ],
      },
    ],
    [
      // Cas d'acceptation #2
      {
        session: { debut: new Date("2024-09-01"), fin: new Date("2025-08-31") },
        contrats: {},
        exclusion: null,
      },
      {
        en_cours: "ABANDON",
        parcours: [
          {
            valeur: "INSCRIT",
            date: new Date("2024-09-01"),
          },
          {
            valeur: "ABANDON",
            date: new Date("2024-11-30"),
          },
          {
            valeur: "FIN_DE_FORMATION",
            date: new Date("2025-08-31"),
          },
        ],
      },
    ],
    [
      // Cas d'acceptation #3
      {
        session: { debut: new Date("2024-09-01"), fin: new Date("2025-08-31") },
        contrats: {
          "2024-07-01": {
            date_debut: new Date("2024-07-01T00:00:00.000Z"),
            date_fin: new Date("2025-08-31T00:00:00.000Z"),
            rupture: null,
            employeur: { siret: null },
          },
        },
        exclusion: null,
      },
      {
        en_cours: "APPRENTI",
        parcours: [
          {
            valeur: "APPRENTI",
            date: new Date("2024-07-01"),
          },
          {
            valeur: "FIN_DE_FORMATION",
            date: new Date("2025-08-31"),
          },
        ],
      },
    ],
    [
      // Cas d'acceptation #4
      {
        session: { debut: new Date("2024-09-01"), fin: new Date("2025-08-31") },
        contrats: {
          "2024-10-01": {
            date_debut: new Date("2024-10-01T00:00:00.000Z"),
            date_fin: new Date("2025-08-31T00:00:00.000Z"),
            rupture: {
              date_rupture: new Date("2024-09-01T00:00:00.000Z"),
              cause: null,
            },
            employeur: { siret: null },
          },
        },
        exclusion: null,
      },
      {
        en_cours: "ABANDON",
        parcours: [
          {
            valeur: "INSCRIT",
            date: new Date("2024-09-01"),
          },
          {
            valeur: "ABANDON",
            date: new Date("2024-11-30"),
          },
          {
            valeur: "FIN_DE_FORMATION",
            date: new Date("2025-08-31"),
          },
        ],
      },
    ],
    [
      // Cas d'acceptation #5
      {
        session: { debut: new Date("2024-09-01"), fin: new Date("2025-08-31") },
        contrats: {
          "2024-10-01": {
            date_debut: new Date("2024-10-01T00:00:00.000Z"),
            date_fin: new Date("2025-08-31T00:00:00.000Z"),
            rupture: {
              date_rupture: new Date("2024-12-01T00:00:00.000Z"),
              cause: null,
            },
            employeur: { siret: null },
          },
        },
        exclusion: null,
      },
      {
        en_cours: "RUPTURANT",
        parcours: [
          {
            valeur: "INSCRIT",
            date: new Date("2024-09-01"),
          },
          {
            valeur: "APPRENTI",
            date: new Date("2024-10-01"),
          },
          {
            valeur: "RUPTURANT",
            date: new Date("2024-12-01"),
          },
          {
            valeur: "ABANDON",
            date: new Date("2025-05-30"),
          },
          {
            valeur: "FIN_DE_FORMATION",
            date: new Date("2025-08-31"),
          },
        ],
      },
    ],
    [
      // Cas d'acceptation #6
      {
        session: { debut: new Date("2024-09-01"), fin: new Date("2025-08-31") },
        contrats: {
          "2024-10-01": {
            date_debut: new Date("2024-10-01T00:00:00.000Z"),
            date_fin: new Date("2025-08-31T00:00:00.000Z"),
            rupture: {
              date_rupture: new Date("2024-12-01T00:00:00.000Z"),
              cause: null,
            },
            employeur: { siret: null },
          },
          "2025-04-01": {
            date_debut: new Date("2025-04-01T00:00:00.000Z"),
            date_fin: new Date("2025-08-31T00:00:00.000Z"),
            rupture: null,
            employeur: { siret: null },
          },
        },
        exclusion: null,
      },
      {
        en_cours: "RUPTURANT",
        parcours: [
          {
            valeur: "INSCRIT",
            date: new Date("2024-09-01"),
          },
          {
            valeur: "APPRENTI",
            date: new Date("2024-10-01"),
          },
          {
            valeur: "RUPTURANT",
            date: new Date("2024-12-01"),
          },
          {
            valeur: "APPRENTI",
            date: new Date("2025-04-01"),
          },
          {
            valeur: "FIN_DE_FORMATION",
            date: new Date("2025-08-31"),
          },
        ],
      },
    ],
    [
      // Cas d'acceptation #7
      {
        session: { debut: new Date("2024-09-01"), fin: new Date("2025-08-31") },
        contrats: {
          "2024-10-01": {
            date_debut: new Date("2024-10-01T00:00:00.000Z"),
            date_fin: new Date("2025-08-31T00:00:00.000Z"),
            rupture: {
              date_rupture: new Date("2024-12-01T00:00:00.000Z"),
              cause: null,
            },
            employeur: { siret: null },
          },
          "2025-04-01": {
            date_debut: new Date("2025-04-01T00:00:00.000Z"),
            date_fin: new Date("2025-08-31T00:00:00.000Z"),
            rupture: null,
            employeur: { siret: null },
          },
        },
        exclusion: {
          date: new Date("2025-03-01T00:00:00.000Z"),
          cause: null,
        },
      },
      {
        en_cours: "ABANDON",
        parcours: [
          {
            valeur: "INSCRIT",
            date: new Date("2024-09-01"),
          },
          {
            valeur: "APPRENTI",
            date: new Date("2024-10-01"),
          },
          {
            valeur: "RUPTURANT",
            date: new Date("2024-12-01"),
          },
          {
            valeur: "ABANDON",
            date: new Date("2025-03-01"),
          },
          {
            valeur: "FIN_DE_FORMATION",
            date: new Date("2025-08-31"),
          },
        ],
      },
    ],
    [
      {
        session: { debut: new Date("2025-01-06"), fin: new Date("2025-12-23") },
        contrats: {},
        exclusion: null,
      },
      {
        en_cours: "INSCRIT",
        parcours: [
          {
            valeur: "INSCRIT",
            date: new Date("2025-01-06"),
          },
          {
            valeur: "ABANDON",
            date: new Date("2025-04-06"),
          },
          {
            valeur: "FIN_DE_FORMATION",
            date: new Date("2025-12-23"),
          },
        ],
      },
    ],
    [
      {
        contrats: {
          "2023-09-25": {
            date_debut: new Date("2023-09-25T00:00:00.000Z"),
            date_fin: new Date("2025-09-12T00:00:00.000Z"),
            employeur: { siret: "55213967700025" },
            rupture: null,
          },
        },
        session: {
          debut: new Date("2024-09-06T00:00:00.000Z"),
          fin: new Date("2025-09-02T00:00:00.000Z"),
        },
        exclusion: null,
      },
      {
        en_cours: "APPRENTI",
        parcours: [
          {
            valeur: "APPRENTI",
            date: new Date("2023-09-25T00:00:00.000Z"),
          },
          {
            valeur: "FIN_DE_FORMATION",
            date: new Date("2025-09-02T00:00:00.000Z"),
          },
        ],
      },
    ],
    [
      {
        contrats: {
          "2022-12-05": {
            date_debut: new Date("2022-12-05T00:00:00.000Z"),
            date_fin: new Date("2023-05-29T00:00:00.000Z"),
            rupture: null,
            employeur: { siret: "44391877603721" },
          },
          "2023-05-29": {
            date_debut: new Date("2023-05-29T00:00:00.000Z"),
            date_fin: new Date("2025-07-31T00:00:00.000Z"),

            rupture: {
              date_rupture: new Date("2023-10-03T00:00:00.000Z"),
              cause: "Rupture d'un commun accord entre l'apprenti et l'employeur (art. L.6222-18, al.2)",
            },

            employeur: { siret: "83308207600021" },
          },
          "2023-12-04": {
            date_debut: new Date("2023-12-04T00:00:00.000Z"),
            date_fin: new Date("2024-12-03T00:00:00.000Z"),

            rupture: {
              date_rupture: new Date("2024-08-13T00:00:00.000Z"),
              cause: "Rupture d'un commun accord entre l'apprenti et l'employeur (art. L.6222-18, al.2)",
            },

            employeur: { siret: "50880130500212" },
          },
          "2024-10-01": {
            date_debut: new Date("2024-10-01T00:00:00.000Z"),
            date_fin: new Date("2025-07-31T00:00:00.000Z"),
            rupture: null,
            employeur: { siret: "57375061900138" },
          },
        },
        session: {
          fin: new Date("2025-07-11T00:00:00.000Z"),
          debut: new Date("2022-10-25T00:00:00.000Z"),
        },
        exclusion: null,
      },
      {
        en_cours: "APPRENTI",
        parcours: [
          {
            valeur: "INSCRIT",
            date: new Date("2022-10-25T00:00:00.000Z"),
          },
          {
            valeur: "APPRENTI",
            date: new Date("2022-12-05T00:00:00.000Z"),
          },
          {
            valeur: "RUPTURANT",
            date: new Date("2023-10-03T00:00:00.000Z"),
          },
          {
            valeur: "APPRENTI",
            date: new Date("2023-12-04T00:00:00.000Z"),
          },
          {
            valeur: "RUPTURANT",
            date: new Date("2024-08-13T00:00:00.000Z"),
          },
          {
            valeur: "APPRENTI",
            date: new Date("2024-10-01T00:00:00.000Z"),
          },
          {
            valeur: "FIN_DE_FORMATION",
            date: new Date("2025-07-11T00:00:00.000Z"),
          },
        ],
      },
    ],
    [
      {
        contrats: {
          "2022-09-05": {
            date_debut: new Date("2022-09-05T00:00:00.000Z"),
            date_fin: new Date("2024-08-31T00:00:00.000Z"),
            rupture: {
              date_rupture: new Date("2023-09-11T00:00:00.000Z"),
              cause: null,
            },
            employeur: {
              siret: "63201210001952",
            },
          },
          "2024-01-08": {
            date_debut: new Date("2024-01-08T00:00:00.000Z"),
            date_fin: new Date("2024-09-04T00:00:00.000Z"),
            rupture: {
              date_rupture: new Date("2024-07-12T00:00:00.000Z"),
              cause: null,
            },
            employeur: {
              siret: "90454873200026",
            },
          },
        },
        session: {
          debut: new Date("2022-09-13T00:00:00.000Z"),
          fin: new Date("2024-07-10T00:00:00.000Z"),
        },
        exclusion: null,
      },
      {
        en_cours: "FIN_DE_FORMATION",
        parcours: [
          {
            valeur: "APPRENTI",
            date: new Date("2022-09-05T00:00:00.000Z"),
          },
          {
            valeur: "RUPTURANT",
            date: new Date("2023-09-11T00:00:00.000Z"),
          },
          {
            valeur: "APPRENTI",
            date: new Date("2024-01-08T00:00:00.000Z"),
          },
          {
            valeur: "FIN_DE_FORMATION",
            date: new Date("2024-07-10T00:00:00.000Z"),
          },
        ],
      },
    ],
  ];

  it.each<[Pick<IEffectifV2, "session" | "contrats" | "exclusion">, IEffectifComputedStatut | null]>(testCases)(
    "doit calculer correctement le statut de l'effectif %s",
    (data, expected) => {
      const result = buildEffectifStatus(data, now);

      expect(result).toEqual(expected);
    }
  );
});
