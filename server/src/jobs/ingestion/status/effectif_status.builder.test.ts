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
    [
      // Rupture sur formation.date_fin : RUPTURANT préservé (pas écrasé en FIN_DE_FORMATION).
      {
        session: { debut: new Date("2024-01-01"), fin: new Date("2024-12-15") },
        contrats: {
          "2024-02-01": {
            date_debut: new Date("2024-02-01T00:00:00.000Z"),
            date_fin: new Date("2024-12-15T00:00:00.000Z"),
            rupture: {
              date_rupture: new Date("2024-12-15T00:00:00.000Z"),
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
            date: new Date("2024-01-01"),
          },
          {
            valeur: "APPRENTI",
            date: new Date("2024-02-01"),
          },
          {
            valeur: "RUPTURANT",
            date: new Date("2024-12-15"),
          },
        ],
      },
    ],
    [
      // Multi-contrats : seul le DERNIER décide. Régression : avant fix, `.some(c => !c.rupture)`
      // voyait contrat1 naturel et écrasait le RUPTURANT du contrat2 en FIN_DE_FORMATION.
      {
        session: { debut: new Date("2024-01-01"), fin: new Date("2024-12-15") },
        contrats: {
          "2024-02-01": {
            date_debut: new Date("2024-02-01T00:00:00.000Z"),
            date_fin: new Date("2024-06-30T00:00:00.000Z"),
            rupture: null,
            employeur: { siret: null },
          },
          "2024-08-01": {
            date_debut: new Date("2024-08-01T00:00:00.000Z"),
            date_fin: new Date("2024-12-15T00:00:00.000Z"),
            rupture: {
              date_rupture: new Date("2024-12-15T00:00:00.000Z"),
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
            date: new Date("2024-01-01"),
          },
          {
            valeur: "APPRENTI",
            date: new Date("2024-02-01"),
          },
          {
            valeur: "RUPTURANT",
            date: new Date("2024-07-01"),
          },
          {
            valeur: "APPRENTI",
            date: new Date("2024-08-01"),
          },
          {
            valeur: "RUPTURANT",
            date: new Date("2024-12-15"),
          },
        ],
      },
    ],
    [
      // Tolérance fin de formation : contrat terminé naturellement à 45 j de la fin de session
      // → FIN_DE_FORMATION dès J+1 (et non RUPTURANT).
      {
        session: { debut: new Date("2024-01-01"), fin: new Date("2024-12-15") },
        contrats: {
          "2024-02-01": {
            date_debut: new Date("2024-02-01T00:00:00.000Z"),
            date_fin: new Date("2024-10-31T00:00:00.000Z"),
            rupture: null,
            employeur: { siret: null },
          },
        },
        exclusion: null,
      },
      {
        en_cours: "FIN_DE_FORMATION",
        parcours: [
          { valeur: "INSCRIT", date: new Date("2024-01-01") },
          { valeur: "APPRENTI", date: new Date("2024-02-01") },
          { valeur: "FIN_DE_FORMATION", date: new Date("2024-11-01") },
        ],
      },
    ],
    [
      // Hors tolérance : 46 j entre la fin de contrat et la fin de session → RUPTURANT sur tout le
      // gap, FIN_DE_FORMATION uniquement le dernier jour de session (règle préexistante).
      {
        session: { debut: new Date("2024-01-01"), fin: new Date("2024-12-15") },
        contrats: {
          "2024-02-01": {
            date_debut: new Date("2024-02-01T00:00:00.000Z"),
            date_fin: new Date("2024-10-30T00:00:00.000Z"),
            rupture: null,
            employeur: { siret: null },
          },
        },
        exclusion: null,
      },
      {
        en_cours: "FIN_DE_FORMATION",
        parcours: [
          { valeur: "INSCRIT", date: new Date("2024-01-01") },
          { valeur: "APPRENTI", date: new Date("2024-02-01") },
          { valeur: "RUPTURANT", date: new Date("2024-10-31") },
          { valeur: "FIN_DE_FORMATION", date: new Date("2024-12-15") },
        ],
      },
    ],
    [
      // Rupture transmise à 10 j de la fin de session : RUPTURANT, la tolérance ne s'applique pas.
      {
        session: { debut: new Date("2024-01-01"), fin: new Date("2024-12-15") },
        contrats: {
          "2024-02-01": {
            date_debut: new Date("2024-02-01T00:00:00.000Z"),
            date_fin: new Date("2024-12-15T00:00:00.000Z"),
            rupture: { date_rupture: new Date("2024-12-05T00:00:00.000Z"), cause: null },
            employeur: { siret: null },
          },
        },
        exclusion: null,
      },
      {
        en_cours: "RUPTURANT",
        parcours: [
          { valeur: "INSCRIT", date: new Date("2024-01-01") },
          { valeur: "APPRENTI", date: new Date("2024-02-01") },
          { valeur: "RUPTURANT", date: new Date("2024-12-05") },
        ],
      },
    ],
    [
      // Gap NON terminal : 20 j entre deux contrats → RUPTURANT (vraie interruption suivie d'une re-signature).
      {
        session: { debut: new Date("2024-01-01"), fin: new Date("2024-12-15") },
        contrats: {
          "2024-02-01": {
            date_debut: new Date("2024-02-01T00:00:00.000Z"),
            date_fin: new Date("2024-06-30T00:00:00.000Z"),
            rupture: null,
            employeur: { siret: null },
          },
          "2024-07-21": {
            date_debut: new Date("2024-07-21T00:00:00.000Z"),
            date_fin: new Date("2024-12-15T00:00:00.000Z"),
            rupture: null,
            employeur: { siret: null },
          },
        },
        exclusion: null,
      },
      {
        en_cours: "FIN_DE_FORMATION",
        parcours: [
          { valeur: "INSCRIT", date: new Date("2024-01-01") },
          { valeur: "APPRENTI", date: new Date("2024-02-01") },
          { valeur: "RUPTURANT", date: new Date("2024-07-01") },
          { valeur: "APPRENTI", date: new Date("2024-07-21") },
          { valeur: "FIN_DE_FORMATION", date: new Date("2024-12-15") },
        ],
      },
    ],
    [
      // Fin naturelle mais exclusion posée dans le gap terminal → ABANDON, jamais écrasé par la tolérance.
      {
        session: { debut: new Date("2024-01-01"), fin: new Date("2024-12-15") },
        contrats: {
          "2024-02-01": {
            date_debut: new Date("2024-02-01T00:00:00.000Z"),
            date_fin: new Date("2024-11-30T00:00:00.000Z"),
            rupture: null,
            employeur: { siret: null },
          },
        },
        exclusion: { date: new Date("2024-12-01T00:00:00.000Z"), cause: null },
      },
      {
        en_cours: "ABANDON",
        parcours: [
          { valeur: "INSCRIT", date: new Date("2024-01-01") },
          { valeur: "APPRENTI", date: new Date("2024-02-01") },
          { valeur: "ABANDON", date: new Date("2024-12-01") },
        ],
      },
    ],
    [
      // Sentinelle saisonnalité : contrat finissant un 31/07, session finissant le 31/08.
      // Verrouille le fix du pic de rupturants du 1er août.
      {
        session: { debut: new Date("2023-09-01"), fin: new Date("2024-08-31") },
        contrats: {
          "2023-10-01": {
            date_debut: new Date("2023-10-01T00:00:00.000Z"),
            date_fin: new Date("2024-07-31T00:00:00.000Z"),
            rupture: null,
            employeur: { siret: null },
          },
        },
        exclusion: null,
      },
      {
        en_cours: "FIN_DE_FORMATION",
        parcours: [
          { valeur: "INSCRIT", date: new Date("2023-09-01") },
          { valeur: "APPRENTI", date: new Date("2023-10-01") },
          { valeur: "FIN_DE_FORMATION", date: new Date("2024-08-01") },
        ],
      },
    ],
    [
      // Contrats chevauchants : celui démarré en dernier finit en premier. La fin terminale est
      // celle du contrat démarré en premier (rompu) → RUPTURANT, pas de tolérance.
      {
        session: { debut: new Date("2024-01-01"), fin: new Date("2024-12-15") },
        contrats: {
          "2024-02-01": {
            date_debut: new Date("2024-02-01T00:00:00.000Z"),
            date_fin: new Date("2024-12-15T00:00:00.000Z"),
            rupture: { date_rupture: new Date("2024-11-01T00:00:00.000Z"), cause: null },
            employeur: { siret: null },
          },
          "2024-03-01": {
            date_debut: new Date("2024-03-01T00:00:00.000Z"),
            date_fin: new Date("2024-05-31T00:00:00.000Z"),
            rupture: null,
            employeur: { siret: null },
          },
        },
        exclusion: null,
      },
      {
        en_cours: "RUPTURANT",
        parcours: [
          { valeur: "INSCRIT", date: new Date("2024-01-01") },
          { valeur: "APPRENTI", date: new Date("2024-02-01") },
          { valeur: "RUPTURANT", date: new Date("2024-11-01") },
        ],
      },
    ],
    [
      // Rupture transmise sur un contrat antérieur, datée au premier jour du gap terminal
      // (fins effectives à égalité) → RUPTURANT préservé, jamais masqué par la tolérance.
      {
        session: { debut: new Date("2024-01-01"), fin: new Date("2024-12-15") },
        contrats: {
          "2024-02-01": {
            date_debut: new Date("2024-02-01T00:00:00.000Z"),
            date_fin: new Date("2024-12-15T00:00:00.000Z"),
            rupture: { date_rupture: new Date("2024-11-01T00:00:00.000Z"), cause: null },
            employeur: { siret: null },
          },
          "2024-03-01": {
            date_debut: new Date("2024-03-01T00:00:00.000Z"),
            date_fin: new Date("2024-10-31T00:00:00.000Z"),
            rupture: null,
            employeur: { siret: null },
          },
        },
        exclusion: null,
      },
      {
        en_cours: "RUPTURANT",
        parcours: [
          { valeur: "INSCRIT", date: new Date("2024-01-01") },
          { valeur: "APPRENTI", date: new Date("2024-02-01") },
          { valeur: "RUPTURANT", date: new Date("2024-11-01") },
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
