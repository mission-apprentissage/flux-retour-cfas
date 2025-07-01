import { siretFixtures } from "api-alternance-sdk/fixtures";
import { addDays } from "date-fns";
import { ObjectId } from "mongodb";
import type { IEffectifV2 } from "shared/models";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { effectifV2Db } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { ingestEffectifV2, type IIngestEffectifV2Params } from "./effectif.ingestion";

useMongo();

const juil24 = new Date("2024-07-21T00:00:00.000Z");
const aout24 = new Date("2024-08-31T00:00:00.000Z");
const sept24 = new Date("2024-09-01T00:00:00.000Z");
const nov24 = new Date("2024-11-30T00:00:00.000Z");
const aout25 = new Date("2025-08-31T00:00:00.000Z");
const aout26 = new Date("2026-08-31T00:00:00.000Z");
const now = new Date("2024-12-28T00:00:00.000Z");
const lastWeek = new Date("2024-12-21T00:00:00.000Z");

const paris = {
  label: "123 Rue de Paris",
  code_postal: "75001",
  code_commune_insee: "75056",
  commune: "Paris",
  code_academie: "01",
  code_departement: "75",
  code_region: "11",
  mission_locale_id: 609,
};

const marseille = {
  label: "123 Rue de Marseille",
  code_postal: "13001",
  code_commune_insee: "13055",
  commune: "Marseille",
  code_academie: "02",
  code_departement: "13",
  code_region: "93",
  mission_locale_id: 323,
};

describe("ingestEffectifV2", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);

    return () => {
      vi.useRealTimers();
    };
  });

  it("doit créer l'effectif si celle-ci n'existe pas", async () => {
    const result = await ingestEffectifV2({
      dossier: {
        annee_scolaire: "2024-2025",
        id_erp_apprenant: "#1",
        date_entree_formation: sept24,
        date_inscription_formation: juil24,
        date_fin_formation: aout26,
      },
      person_id: new ObjectId(),
      formation_id: new ObjectId(),
      date_transmission: now,
      adresse: paris,
    });

    const expectedEffectif: Omit<IEffectifV2, "_id"> = {
      identifiant: {
        formation_id: result.identifiant.formation_id,
        person_id: result.identifiant.person_id,
      },
      annee_scolaires: ["2024-2025"],
      id_erp: ["#1"],

      date_inscription: juil24,
      exclusion: null,
      diplome: null,
      session: {
        debut: sept24,
        fin: aout26,
      },
      adresse: paris,
      contrats: {},
      informations_personnelles: { rqth: false },
      derniere_transmission: now,
      _computed: {
        statut: {
          en_cours: "ABANDON",
          parcours: [
            { date: sept24, valeur: "INSCRIT" },
            { date: nov24, valeur: "ABANDON" },
            { date: aout26, valeur: "FIN_DE_FORMATION" },
          ],
        },
      },
    };

    expect(result).toEqual({
      _id: expect.any(ObjectId),
      ...expectedEffectif,
    });

    expect(await effectifV2Db().find({}).toArray()).toEqual([result]);
  });

  it("doit mettre à jour l'effectif si celui-ci existe", async () => {
    const existingEffectif: IEffectifV2 = {
      _id: new ObjectId(),
      identifiant: {
        person_id: new ObjectId(),
        formation_id: new ObjectId(),
      },
      annee_scolaires: ["2024-2025"],
      id_erp: ["#1"],

      date_inscription: juil24,
      exclusion: null,
      diplome: null,
      session: {
        debut: sept24,
        fin: aout26,
      },
      adresse: paris,
      contrats: {},
      informations_personnelles: { rqth: false },
      derniere_transmission: lastWeek,
      _computed: {
        statut: {
          en_cours: "ABANDON",
          parcours: [
            { date: sept24, valeur: "INSCRIT" },
            { date: nov24, valeur: "ABANDON" },
            { date: aout26, valeur: "FIN_DE_FORMATION" },
          ],
        },
      },
    };

    await effectifV2Db().insertOne(existingEffectif);

    const result = await ingestEffectifV2({
      dossier: {
        annee_scolaire: "2024-2025",
        id_erp_apprenant: "#1",
        date_entree_formation: sept24,
        date_inscription_formation: juil24,
        date_fin_formation: aout26,
        rqth_apprenant: true,
      },
      person_id: existingEffectif.identifiant.person_id,
      formation_id: existingEffectif.identifiant.formation_id,
      date_transmission: now,
      adresse: paris,
    });

    const expectedResult = {
      ...existingEffectif,
      derniere_transmission: now,
      informations_personnelles: { rqth: true },
    };
    expect(result).toEqual(expectedResult);

    expect(await effectifV2Db().find({}).toArray()).toEqual([expectedResult]);
  });

  it("doit utiliser la clé d'unicité (person_id, formation_id)", async () => {
    const person1 = new ObjectId();
    const person2 = new ObjectId();

    const formation1 = new ObjectId();
    const formation2 = new ObjectId();

    const existingEffectifs: IEffectifV2[] = [
      {
        _id: new ObjectId(),
        identifiant: {
          person_id: person1,
          formation_id: formation1,
        },
        annee_scolaires: ["2024-2025"],
        id_erp: ["#1"],

        date_inscription: juil24,
        exclusion: null,
        diplome: null,
        session: {
          debut: sept24,
          fin: aout26,
        },
        adresse: paris,
        contrats: {},
        informations_personnelles: { rqth: false },
        derniere_transmission: lastWeek,
        _computed: {
          statut: {
            en_cours: "ABANDON",
            parcours: [
              { date: sept24, valeur: "INSCRIT" },
              { date: nov24, valeur: "ABANDON" },
              { date: aout26, valeur: "FIN_DE_FORMATION" },
            ],
          },
        },
      },
      {
        _id: new ObjectId(),
        identifiant: {
          person_id: person1,
          formation_id: formation2,
        },
        annee_scolaires: ["2024-2025"],
        id_erp: ["#1"],

        date_inscription: juil24,
        exclusion: null,
        diplome: null,
        session: {
          debut: sept24,
          fin: aout26,
        },
        adresse: paris,
        contrats: {},
        informations_personnelles: { rqth: false },
        derniere_transmission: lastWeek,
        _computed: {
          statut: {
            en_cours: "ABANDON",
            parcours: [
              { date: sept24, valeur: "INSCRIT" },
              { date: nov24, valeur: "ABANDON" },
            ],
          },
        },
      },
      {
        _id: new ObjectId(),
        identifiant: {
          person_id: person2,
          formation_id: formation1,
        },
        annee_scolaires: ["2024-2025"],
        id_erp: ["#1"],

        date_inscription: juil24,
        exclusion: null,
        diplome: null,
        session: {
          debut: sept24,
          fin: aout26,
        },
        adresse: paris,
        contrats: {},
        informations_personnelles: { rqth: false },
        derniere_transmission: lastWeek,
        _computed: {
          statut: {
            en_cours: "ABANDON",
            parcours: [
              { date: sept24, valeur: "INSCRIT" },
              { date: nov24, valeur: "ABANDON" },
              { date: aout26, valeur: "FIN_DE_FORMATION" },
            ],
          },
        },
      },
      {
        _id: new ObjectId(),
        identifiant: {
          person_id: person2,
          formation_id: formation2,
        },
        annee_scolaires: ["2024-2025"],
        id_erp: ["#1"],

        date_inscription: juil24,
        exclusion: null,
        diplome: null,
        session: {
          debut: sept24,
          fin: aout26,
        },
        adresse: paris,
        contrats: {},
        informations_personnelles: { rqth: false },
        derniere_transmission: lastWeek,
        _computed: {
          statut: {
            en_cours: "ABANDON",
            parcours: [
              { date: sept24, valeur: "INSCRIT" },
              { date: nov24, valeur: "ABANDON" },
              { date: aout26, valeur: "FIN_DE_FORMATION" },
            ],
          },
        },
      },
    ];

    await effectifV2Db().insertMany(existingEffectifs);

    const result = await ingestEffectifV2({
      dossier: {
        annee_scolaire: "2025-2025",
        id_erp_apprenant: "#2",
        date_entree_formation: sept24,
        date_inscription_formation: juil24,
        date_fin_formation: aout26,
      },
      person_id: person1,
      formation_id: formation1,
      date_transmission: now,
      adresse: marseille,
    });

    expect(result).toEqual({
      ...existingEffectifs[0],
      annee_scolaires: ["2024-2025", "2025-2025"],
      id_erp: ["#1", "#2"],
      adresse: marseille,
      derniere_transmission: now,
    });

    expect(await effectifV2Db().countDocuments()).toBe(existingEffectifs.length);
  });

  it.each<[Partial<IIngestEffectifV2Params["dossier"]>, Partial<IEffectifV2>]>([
    [
      {
        date_entree_formation: aout24,
        date_inscription_formation: aout24,
        date_fin_formation: aout25,
      },
      {
        date_inscription: aout24,
        session: { debut: aout24, fin: aout25 },
        _computed: {
          statut: {
            en_cours: "ABANDON",
            parcours: [
              { date: aout24, valeur: "INSCRIT" },
              { date: new Date("2024-11-29"), valeur: "ABANDON" },
              { date: aout25, valeur: "FIN_DE_FORMATION" },
            ],
          },
        },
      },
    ],
    [
      {
        date_exclusion_formation: nov24,
        cause_exclusion_formation: "Raison",
      },
      { exclusion: { cause: "Raison", date: nov24 } },
    ],
    [
      {
        // Cause exlusion sans date ne devrait pas être autorisée ?
        cause_exclusion_formation: "Raison",
      },
      {},
    ],
    [
      {
        date_obtention_diplome_formation: nov24,
        obtention_diplome_formation: false,
      },
      { diplome: { date: nov24, obtention: false } },
    ],
    [
      {
        date_obtention_diplome_formation: nov24,
        obtention_diplome_formation: true,
      },
      { diplome: { date: nov24, obtention: true } },
    ],
    [
      {
        date_obtention_diplome_formation: nov24,
      },
      { diplome: { date: nov24, obtention: true } },
    ],
    [
      {
        obtention_diplome_formation: true,
      },
      { diplome: { date: null, obtention: true } },
    ],
    [
      {
        obtention_diplome_formation: false,
      },
      { diplome: { date: null, obtention: false } },
    ],
    [{ annee_scolaire: "2025-2025" }, { annee_scolaires: ["2024-2025", "2025-2025"] }],
    [{ id_erp_apprenant: "#2" }, { id_erp: ["#1", "#2"] }],
  ])("doit mettre à jour l'effectif avec le dossier '%s'", async (updatedDossier, expectedUpdates) => {
    const existingEffectif: IEffectifV2 = {
      _id: new ObjectId(),
      identifiant: {
        person_id: new ObjectId(),
        formation_id: new ObjectId(),
      },
      annee_scolaires: ["2024-2025"],
      id_erp: ["#1"],

      date_inscription: juil24,
      exclusion: null,
      diplome: null,
      session: {
        debut: sept24,
        fin: aout26,
      },
      adresse: paris,
      contrats: {},
      informations_personnelles: { rqth: false },
      derniere_transmission: lastWeek,
      _computed: {
        statut: {
          en_cours: "ABANDON",
          parcours: [
            { date: sept24, valeur: "INSCRIT" },
            { date: nov24, valeur: "ABANDON" },
            { date: aout26, valeur: "FIN_DE_FORMATION" },
          ],
        },
      },
    };

    await effectifV2Db().insertOne(existingEffectif);

    const result = await ingestEffectifV2({
      dossier: {
        annee_scolaire: "2024-2025",
        id_erp_apprenant: "#1",

        date_entree_formation: sept24,
        date_inscription_formation: juil24,
        date_fin_formation: aout26,

        ...updatedDossier,
      },
      person_id: existingEffectif.identifiant.person_id,
      formation_id: existingEffectif.identifiant.formation_id,
      date_transmission: now,
      adresse: paris,
    });

    const expectedResult = {
      ...existingEffectif,
      ...expectedUpdates,
      derniere_transmission: now,
    };
    expect(result).toEqual(expectedResult);

    expect(await effectifV2Db().find({}).toArray()).toEqual([expectedResult]);
  });

  describe("mise à jour des contrats", () => {
    const commonEffectif: IEffectifV2 = {
      _id: new ObjectId(),
      identifiant: {
        person_id: new ObjectId(),
        formation_id: new ObjectId(),
      },
      annee_scolaires: ["2024-2025"],
      id_erp: ["#1"],

      date_inscription: juil24,
      exclusion: null,
      diplome: null,
      session: {
        debut: sept24,
        fin: aout26,
      },
      adresse: paris,
      contrats: {},
      informations_personnelles: { rqth: false },
      derniere_transmission: now,
      _computed: {
        statut: {
          en_cours: "ABANDON",
          parcours: [
            { date: sept24, valeur: "INSCRIT" },
            { date: nov24, valeur: "ABANDON" },
            { date: aout26, valeur: "FIN_DE_FORMATION" },
          ],
        },
      },
    };

    const commonParams: IIngestEffectifV2Params = {
      dossier: {
        annee_scolaire: "2024-2025",
        id_erp_apprenant: "#1",
        date_entree_formation: sept24,
        date_inscription_formation: juil24,
        date_fin_formation: aout26,
      },
      person_id: commonEffectif.identifiant.person_id,
      formation_id: commonEffectif.identifiant.formation_id,
      date_transmission: now,
      adresse: paris,
    };

    it.each<["" | "_2" | "_3" | "_4"]>([[""], ["_2"], ["_3"], ["_4"]])(
      "doit ajouter le contrat #%s renseignés dans le dossier",
      async (n) => {
        await effectifV2Db().insertOne(commonEffectif);

        const result = await ingestEffectifV2({
          ...commonParams,
          dossier: {
            ...commonParams.dossier,

            [`contrat_date_debut${n}`]: sept24,
            [`contrat_date_fin${n}`]: aout25,
            [`contrat_date_rupture${n}`]: aout24,
            [`cause_rupture_contrat${n}`]: "Raison #1",
            [`siret_employeur${n}`]: siretFixtures[19350030300014],
          },
        });

        expect(result).toEqual({
          ...commonEffectif,
          contrats: {
            "2024-09-01": {
              date_debut: sept24,
              date_fin: aout25,
              employeur: {
                siret: siretFixtures[19350030300014],
              },
              rupture: {
                cause: "Raison #1",
                date_rupture: aout24,
              },
            },
          },
        });
      }
    );

    it("doit conserver l'historique des contrats non renseignés dans le dossier", async () => {
      await effectifV2Db().insertOne({
        ...commonEffectif,
        contrats: {
          "2024-09-01": {
            date_debut: sept24,
            date_fin: aout25,
            employeur: {
              siret: siretFixtures[19350030300014],
            },
            rupture: {
              cause: "Raison #1",
              date_rupture: aout24,
            },
          },
        },
      });

      const result = await ingestEffectifV2({
        ...commonParams,
        dossier: {
          ...commonParams.dossier,

          contrat_date_debut: nov24,
          contrat_date_fin: aout25,
        },
      });

      expect(result).toEqual({
        ...commonEffectif,
        contrats: {
          "2024-09-01": {
            date_debut: sept24,
            date_fin: aout25,
            employeur: {
              siret: siretFixtures[19350030300014],
            },
            rupture: {
              cause: "Raison #1",
              date_rupture: aout24,
            },
          },
          "2024-11-30": {
            date_debut: nov24,
            date_fin: aout25,
            employeur: {
              siret: null,
            },
            rupture: null,
          },
        },
        _computed: {
          statut: {
            en_cours: "APPRENTI",
            parcours: [
              { date: sept24, valeur: "INSCRIT" },
              { date: nov24, valeur: "APPRENTI" },
              {
                date: addDays(aout25, 1),
                valeur: "RUPTURANT",
              },
              {
                date: new Date("2026-02-28T00:00:00.000Z"),
                valeur: "ABANDON",
              },
              { date: aout26, valeur: "FIN_DE_FORMATION" },
            ],
          },
        },
      });
    });

    it("doit mettre à jour les contrats renseignés dans le dossier", async () => {
      await effectifV2Db().insertOne({
        ...commonEffectif,
        contrats: {
          "2024-09-01": {
            date_debut: sept24,
            date_fin: aout25,
            employeur: {
              siret: null,
            },
            rupture: null,
          },
        },
      });

      const result = await ingestEffectifV2({
        ...commonParams,
        dossier: {
          ...commonParams.dossier,

          contrat_date_debut: sept24,
          contrat_date_fin: nov24,
          contrat_date_rupture: aout24,
          cause_rupture_contrat: "Raison #1",
          siret_employeur: siretFixtures[19350030300014],
        },
      });

      expect(result).toEqual({
        ...commonEffectif,
        contrats: {
          "2024-09-01": {
            date_debut: sept24,
            date_fin: nov24,
            employeur: {
              siret: siretFixtures[19350030300014],
            },
            rupture: {
              cause: "Raison #1",
              date_rupture: aout24,
            },
          },
        },
      });
    });
  });
});
