import type { IOrganisme as IOrganismeApi } from "api-alternance-sdk";
import { ObjectId } from "mongodb";
import type { IOrganisme } from "shared/models";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import { organismesDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { hydrateOrganismesFromApiAlternance } from "./hydrate-organismes";

vi.mock("@/common/apis/apiAlternance/client");

useMongo();

const now = new Date("2024-01-29T00:00:00.000Z");
const yesterday = new Date("2024-01-28T00:00:00.000Z");
const lastYear = new Date("2023-01-29T00:00:00.000Z");

describe("hydrateOrganismesFromReferentiel", () => {
  const organismesApi: IOrganismeApi[][] = [
    [
      {
        contacts: [
          {
            email: "contact@mail.com",
            confirmation_referentiel: true,
            sources: ["source1", "source2"],
          },
          {
            email: "notConfirmed@mail.com",
            confirmation_referentiel: false,
            sources: [],
          },
        ],
        identifiant: {
          siret: "13002975400020",
          uai: "0597114M",
        },
        etablissement: {
          adresse: {
            academie: {
              code: "09",
              id: "A09",
              nom: "Lille",
            },
            code_postal: "59790",
            commune: {
              code_insee: "59507",
              nom: "Ronchin",
            },
            departement: {
              code_insee: "59",
              nom: "Nord",
            },
            label: "9 RUE DE L'UNIVERSITE",
            region: {
              code_insee: "32",
              nom: "Hauts-de-France",
            },
          },
          geopoint: {
            type: "Point",
            coordinates: [3.098, 50.611],
          },
          creation: new Date("1970-01-19T23:49:51.600Z"),
          enseigne: "FACULTE SCIENCES SPORT ET EDUCATION PHYSIQUE",
          fermeture: null,
          ouvert: true,
          siret: "13002975400020",
        },
        renseignements_specifiques: {
          numero_activite: "32591104359",
          qualiopi: true,
        },
        statut: {
          referentiel: "présent",
        },
        unite_legale: {
          actif: true,
          cessation: null,
          creation: new Date("1970-01-19T21:24:21.600Z"),
          raison_sociale: "UNIVERSITE DE LILLE",
          siren: "130029754",
        },
      },
      {
        contacts: [],
        identifiant: {
          siret: "26220009000278",
          uai: "0932751K",
        },
        etablissement: {
          adresse: {
            academie: {
              code: "14",
              id: "A14",
              nom: "Rennes",
            },
            code_postal: "22220",
            commune: {
              code_insee: "22362",
              nom: "Tréguier",
            },
            departement: {
              code_insee: "22",
              nom: "Côtes-d'Armor",
            },
            label: "TOUR SAINT MICHEL",
            region: {
              code_insee: "53",
              nom: "Bretagne",
            },
          },
          geopoint: {
            type: "Point",
            coordinates: [3.098, 50.611],
          },
          creation: new Date("1970-01-20T17:21:03.600Z"),
          enseigne: "ECOLE D'AIDE SOIGNANTS",
          fermeture: null,
          ouvert: true,
          siret: "26220009000278",
        },
        renseignements_specifiques: {
          numero_activite: null,
          qualiopi: false,
        },
        statut: {
          referentiel: "présent",
        },
        unite_legale: {
          actif: true,
          cessation: null,
          creation: new Date("1969-12-06T19:09:06.639Z"),
          raison_sociale: "CENTRE HOSPITALIER DE SAINT-BRIEUC, PAIMPOL ET TREGUIER",
          siren: "262200090",
        },
      },
      {
        identifiant: {
          uai: null,
          siret: "19590065900028",
        },
        contacts: [],
        etablissement: {
          siret: "19590065900028",
          ouvert: true,
          enseigne: "GRETA DU GRAND HAINAUT",
          adresse: {
            label: "817 RUE CHARLES BOURSEUL",
            code_postal: "59500",
            commune: {
              nom: "Douai",
              code_insee: "59178",
            },
            departement: {
              nom: "Nord",
              code_insee: "59",
            },
            region: {
              code_insee: "32",
              nom: "Hauts-de-France",
            },
            academie: {
              id: "A09",
              code: "09",
              nom: "Lille",
            },
          },
          geopoint: {
            type: "Point",
            coordinates: [3.098, 50.611],
          },
          creation: new Date("1970-01-09T00:08:34.800Z"),
          fermeture: null,
        },
        renseignements_specifiques: {
          qualiopi: false,
          numero_activite: "3159P001659",
        },
        statut: {
          referentiel: "présent",
        },
        unite_legale: {
          siren: "195900659",
          actif: true,
          raison_sociale: "LYCEE POLYVALENT ELISA LEMONNIER",
          creation: new Date("-178938000"),
          cessation: null,
        },
      },
    ],
    [
      {
        identifiant: {
          uai: "0802230P",
          siret: "81171016900012",
        },
        etablissement: {
          siret: "81171016900012",
          ouvert: false,
          enseigne: "ASAF",
          adresse: null,
          creation: new Date("1970-01-17T13:49:19.200Z"),
          fermeture: new Date("1970-01-19T09:48:50.400Z"),
          geopoint: {
            type: "Point",
            coordinates: [3.098, 50.611],
          },
        },
        renseignements_specifiques: {
          qualiopi: false,
          numero_activite: null,
        },
        statut: {
          referentiel: "supprimé",
        },
        unite_legale: {
          siren: "811710169",
          actif: true,
          raison_sociale: "ACADELY",
          creation: new Date("1970-01-17T13:49:19.200Z"),
          cessation: null,
        },
        contacts: [],
      },
    ],
  ];

  const expectedOrganismes: Omit<IOrganisme, "_id" | "created_at" | "updated_at">[] = [
    {
      adresse: {
        academie: "09",
        code_insee: "59507",
        code_postal: "59790",
        commune: "Ronchin",
        complete: "9 RUE DE L'UNIVERSITE 59790 Ronchin",
        departement: "59",
        region: "32",
      },
      geopoint: {
        type: "Point",
        coordinates: [3.098, 50.611],
      },
      contacts_from_referentiel: organismesApi[0][0].contacts,
      enseigne: "FACULTE SCIENCES SPORT ET EDUCATION PHYSIQUE",
      est_dans_le_referentiel: "present",
      ferme: false,
      fiabilisation_statut: "FIABLE",
      nature: "inconnue",
      nom: "FACULTE SCIENCES SPORT ET EDUCATION PHYSIQUE",
      qualiopi: true,
      raison_sociale: "UNIVERSITE DE LILLE",
      siret: "13002975400020",
      uai: "0597114M",
    },
    {
      adresse: {
        academie: "14",
        code_insee: "22362",
        code_postal: "22220",
        commune: "Tréguier",
        complete: "TOUR SAINT MICHEL 22220 Tréguier",
        departement: "22",
        region: "53",
      },
      geopoint: {
        type: "Point",
        coordinates: [3.098, 50.611],
      },
      contacts_from_referentiel: [],
      enseigne: "ECOLE D'AIDE SOIGNANTS",
      est_dans_le_referentiel: "present",
      ferme: false,
      fiabilisation_statut: "FIABLE",
      nature: "inconnue",
      nom: "ECOLE D'AIDE SOIGNANTS",
      qualiopi: false,
      raison_sociale: "CENTRE HOSPITALIER DE SAINT-BRIEUC, PAIMPOL ET TREGUIER",
      siret: "26220009000278",
      uai: "0932751K",
    },
  ];

  beforeEach(() => {
    vi.mocked(apiAlternanceClient.organisme.export).mockImplementation(async function* () {
      for (const page of organismesApi) {
        yield page;
      }
    });
  });

  it("doit ajouter les organismes présent dans le référentiel", async () => {
    const result = await hydrateOrganismesFromApiAlternance(now);

    const organismes = await organismesDb()
      .find({}, { sort: { siret: 1 } })
      .toArray();
    expect(organismes).toHaveLength(2);
    expect(organismes).toEqual(
      expectedOrganismes.map((o) => ({ ...o, _id: expect.any(ObjectId), created_at: now, updated_at: now }))
    );

    expect(result).toEqual({ nbOrganismesCrees: 2, nbOrganismesMaj: 0, nbOrganismesSuppr: 0 });
  });

  it("doit mettre à jour les organismes présents dans le référentiel", async () => {
    await organismesDb().insertMany([
      generateOrganismeFixture({
        created_at: lastYear,
        siret: "13002975400020",
        uai: "0597114M",
        updated_at: yesterday,
        nature: "formateur",
      }),
      generateOrganismeFixture({
        created_at: yesterday,
        siret: "26220009000278",
        uai: "0932751K",
        updated_at: yesterday,
        nature: "responsable_formateur",
      }),
    ]);

    const result = await hydrateOrganismesFromApiAlternance(now);

    const organismes = await organismesDb()
      .find({}, { sort: { siret: 1 } })
      .toArray();

    expect(organismes).toHaveLength(2);
    expect(organismes).toEqual([
      {
        ...expectedOrganismes[0],
        _id: expect.any(ObjectId),
        created_at: lastYear,
        updated_at: now,
        nature: "formateur",
      },
      {
        ...expectedOrganismes[1],
        _id: expect.any(ObjectId),
        created_at: yesterday,
        updated_at: now,
        nature: "responsable_formateur",
      },
    ]);

    expect(result).toEqual({ nbOrganismesCrees: 0, nbOrganismesMaj: 2, nbOrganismesSuppr: 0 });
  });

  it("doit préserver les organismes supprimé du référentiel mais en réinitialisant le statut", async () => {
    const oldOrganismePresent = generateOrganismeFixture({
      created_at: lastYear,
      siret: organismesApi[1][0].identifiant.siret,
      uai: organismesApi[1][0].identifiant.uai!,
      updated_at: yesterday,
      nature: "formateur",
      fiabilisation_statut: "FIABLE",
      est_dans_le_referentiel: "present",
      adresse: {
        academie: "14",
        code_insee: "22362",
        code_postal: "22220",
        commune: "Tréguier",
        complete: "TOUR SAINT MICHEL 22220 Tréguier",
        departement: "22",
        region: "53",
      },
      geopoint: {
        type: "Point",
        coordinates: [3.098, 50.611],
      },
      ferme: false,
      enseigne: null,
      nom: "RANDOM",
      qualiopi: true,
      raison_sociale: "RANDOM",
    });
    const oldOrganismeAbsent = generateOrganismeFixture({
      created_at: lastYear,
      siret: "98222438800016",
      uai: "0597114M",
      updated_at: yesterday,
      nature: "formateur",
      fiabilisation_statut: "FIABLE",
      est_dans_le_referentiel: "present",
      ferme: false,
      enseigne: null,
      nom: "RANDOM",
      qualiopi: true,
      raison_sociale: "RANDOM",
    });

    await organismesDb().insertMany([oldOrganismePresent, oldOrganismeAbsent]);

    const result = await hydrateOrganismesFromApiAlternance(now);

    const organismes = await organismesDb()
      .find({}, { sort: { siret: 1 } })
      .toArray();

    expect(organismes).toHaveLength(4);
    expect(organismes).toEqual([
      {
        ...expectedOrganismes[0],
        _id: expect.any(ObjectId),
        created_at: now,
        updated_at: now,
      },
      {
        ...expectedOrganismes[1],
        _id: expect.any(ObjectId),
        created_at: now,
        updated_at: now,
      },
      {
        ...oldOrganismePresent,
        _id: expect.any(ObjectId),
        updated_at: now,
        adresse: null,
        ferme: true,
        enseigne: "ASAF",
        nom: "ASAF",
        qualiopi: false,
        raison_sociale: "ACADELY",
        fiabilisation_statut: "NON_FIABLE",
        est_dans_le_referentiel: "absent",
      },
      {
        ...oldOrganismeAbsent,
        _id: expect.any(ObjectId),
        updated_at: now,
        fiabilisation_statut: "NON_FIABLE",
        est_dans_le_referentiel: "absent",
      },
    ]);

    expect(result).toEqual({ nbOrganismesCrees: 2, nbOrganismesMaj: 1, nbOrganismesSuppr: 1 });
  });

  it("doit préserver les organismes si une erreur api alternance", async () => {
    const oldOrganismePresent = generateOrganismeFixture({
      created_at: lastYear,
      siret: organismesApi[1][0].identifiant.siret,
      uai: organismesApi[1][0].identifiant.uai!,
      updated_at: yesterday,
      nature: "formateur",
      fiabilisation_statut: "FIABLE",
      est_dans_le_referentiel: "present",
      adresse: {
        academie: "14",
        code_insee: "22362",
        code_postal: "22220",
        commune: "Tréguier",
        complete: "TOUR SAINT MICHEL 22220 Tréguier",
        departement: "22",
        region: "53",
      },
      ferme: false,
      enseigne: null,
      nom: "RANDOM",
      qualiopi: true,
      raison_sociale: "RANDOM",
    });
    const oldOrganismeAbsent = generateOrganismeFixture({
      created_at: lastYear,
      siret: "98222438800016",
      uai: "0597114M",
      updated_at: yesterday,
      nature: "formateur",
      fiabilisation_statut: "FIABLE",
      est_dans_le_referentiel: "present",
      ferme: false,
      enseigne: null,
      nom: "RANDOM",
      qualiopi: true,
      raison_sociale: "RANDOM",
    });

    await organismesDb().insertMany([oldOrganismePresent, oldOrganismeAbsent]);

    vi.mocked(apiAlternanceClient.organisme.export).mockReset();
    vi.mocked(apiAlternanceClient.organisme.export).mockImplementation(async function* () {
      yield organismesApi[0];

      throw new Error("Erreur API Alternance");
    });

    await expect(() => hydrateOrganismesFromApiAlternance(now)).rejects.toThrow("Erreur API Alternance");

    const organismes = await organismesDb()
      .find({}, { sort: { siret: 1 } })
      .toArray();

    expect(organismes).toHaveLength(4);
    expect(organismes).toEqual([
      {
        ...expectedOrganismes[0],
        _id: expect.any(ObjectId),
        created_at: now,
        updated_at: now,
      },
      {
        ...expectedOrganismes[1],
        _id: expect.any(ObjectId),
        created_at: now,
        updated_at: now,
      },
      {
        ...oldOrganismePresent,
        _id: expect.any(ObjectId),
      },
      {
        ...oldOrganismeAbsent,
        _id: expect.any(ObjectId),
      },
    ]);
  });
});
