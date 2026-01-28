import type { ICommune } from "api-alternance-sdk";
import { cfdCodeFixtures, rncpCodeFixtures, siretFixtures, uaiFixtures } from "api-alternance-sdk/fixtures";
import { ObjectId } from "mongodb";
import type { IDossierApprenantSchemaV3 } from "shared/models/parts/dossierApprenantSchemaV3";
import { describe, expect, it, vi } from "vitest";

import { getCommune } from "@/common/apis/apiAlternance/apiAlternance";
import { effectifV2Db, formationV2Db, personV2Db } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import type { IIngestAdresseUsedFields } from "./adresse/adresse.builder";
import type { IIngestEffectifUsedFields } from "./effectif/effectif.ingestion";
import type { IIngestFormationUsedFields } from "./formationV2/formationV2.ingestion";
import type { IIngestPersonUsedFields } from "./person/person.ingestion";
import { handleEffectifTransmission } from "./process-ingestion.v2";

const juil24 = new Date("2024-07-21");
const sept24 = new Date("2024-09-01");
const aout26 = new Date("2026-08-31");
const now = new Date("2024-12-28");

const parisInfo: ICommune = {
  code: {
    insee: "75056",
    postaux: [
      "75001",
      "75002",
      "75003",
      "75004",
      "75005",
      "75006",
      "75007",
      "75008",
      "75009",
      "75010",
      "75011",
      "75012",
      "75013",
      "75014",
      "75015",
      "75016",
      "75017",
      "75018",
      "75019",
      "75020",
      "75116",
    ],
  },
  academie: {
    nom: "Paris",
    id: "A01",
    code: "01",
  },
  anciennes: [],
  arrondissements: [
    {
      code: "75101",
      nom: "Paris 1er Arrondissement",
    },
    {
      code: "75102",
      nom: "Paris 2e Arrondissement",
    },
    {
      code: "75103",
      nom: "Paris 3e Arrondissement",
    },
    {
      code: "75104",
      nom: "Paris 4e Arrondissement",
    },
    {
      code: "75105",
      nom: "Paris 5e Arrondissement",
    },
    {
      code: "75106",
      nom: "Paris 6e Arrondissement",
    },
    {
      code: "75107",
      nom: "Paris 7e Arrondissement",
    },
    {
      code: "75108",
      nom: "Paris 8e Arrondissement",
    },
    {
      code: "75109",
      nom: "Paris 9e Arrondissement",
    },
    {
      code: "75110",
      nom: "Paris 10e Arrondissement",
    },
    {
      code: "75111",
      nom: "Paris 11e Arrondissement",
    },
    {
      code: "75112",
      nom: "Paris 12e Arrondissement",
    },
    {
      code: "75113",
      nom: "Paris 13e Arrondissement",
    },
    {
      code: "75114",
      nom: "Paris 14e Arrondissement",
    },
    {
      code: "75115",
      nom: "Paris 15e Arrondissement",
    },
    {
      code: "75116",
      nom: "Paris 16e Arrondissement",
    },
    {
      code: "75117",
      nom: "Paris 17e Arrondissement",
    },
    {
      code: "75118",
      nom: "Paris 18e Arrondissement",
    },
    {
      code: "75119",
      nom: "Paris 19e Arrondissement",
    },
    {
      code: "75120",
      nom: "Paris 20e Arrondissement",
    },
  ],
  departement: {
    nom: "Paris",
    codeInsee: "75",
  },
  localisation: {
    centre: {
      coordinates: [2.347, 48.8589],
      type: "Point",
    },
    bbox: {
      coordinates: [
        [
          [2.224219, 48.815562],
          [2.469851, 48.815562],
          [2.469851, 48.902148],
          [2.224219, 48.902148],
          [2.224219, 48.815562],
        ],
      ],
      type: "Polygon",
    },
  },
  mission_locale: {
    id: 609,
    nom: "DE PARIS",
    siret: "53132862300149",
    code: "75018",
    localisation: {
      geopoint: {
        type: "Point",
        coordinates: [2.3740736, 48.8848179],
      },
      adresse: "22 rue Pajol",
      cp: "75018",
      ville: "PARIS",
    },
    contact: {
      email: "contact@missionlocaledeparis.fr",
      telephone: "0179970000",
      siteWeb: "https://www.missionlocale.paris/",
    },
  },
  nom: "Paris",
  region: {
    codeInsee: "11",
    nom: "Île-de-France",
  },
};

vi.mock("@/common/apis/apiAlternance/apiAlternance");

useMongo();

describe("process-ingestion.v2", () => {
  // Ce fichier est un test fonctionnel, ne pas décliner tous les cas de tests ici

  it("doit traiter la transmission de l'effectif", async () => {
    const dossier: Pick<
      IDossierApprenantSchemaV3,
      IIngestFormationUsedFields | IIngestEffectifUsedFields | IIngestAdresseUsedFields | IIngestPersonUsedFields
    > = {
      nom_apprenant: "DOE",
      prenom_apprenant: "John",
      date_de_naissance_apprenant: new Date("1990-01-01"),

      annee_scolaire: "2024-2025",
      id_erp_apprenant: "#1",
      date_entree_formation: sept24,
      date_inscription_formation: juil24,
      date_fin_formation: aout26,

      formation_cfd: cfdCodeFixtures[13512840],
      formation_rncp: rncpCodeFixtures.RNCP36092,
      etablissement_responsable_siret: siretFixtures[19350030300014],
      etablissement_responsable_uai: uaiFixtures["0491801S"],
      etablissement_formateur_siret: siretFixtures[26590673500120],
      etablissement_formateur_uai: uaiFixtures["0631408N"],

      code_commune_insee_apprenant: "75056",
    };

    vi.mocked(getCommune).mockResolvedValue(parisInfo);

    await handleEffectifTransmission(
      {
        _id: new ObjectId(),
        source: "api",
        created_at: new Date(),
        updated_at: new Date(),
        ...dossier,
      },
      now
    );

    const persons = await personV2Db().find({}).toArray();
    expect(persons).toHaveLength(1);
    expect(persons[0]).toEqual({
      _id: expect.any(ObjectId),
      identifiant: {
        nom: dossier.nom_apprenant,
        prenom: dossier.prenom_apprenant,
        date_de_naissance: dossier.date_de_naissance_apprenant,
      },
      parcours: {
        chronologie: [
          {
            date: juil24,
            id: expect.any(ObjectId),
          },
        ],
        en_cours: {
          date: juil24,
          id: expect.any(ObjectId),
        },
      },
    });

    const formations = await formationV2Db().find({}).toArray();
    expect(formations).toHaveLength(1);
    expect(formations[0]).toEqual({
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
    });

    const effectifs = await effectifV2Db().find({}).toArray();
    expect(effectifs).toHaveLength(1);
    expect(effectifs[0]).toEqual({
      _id: expect.any(ObjectId),
      identifiant: {
        formation_id: formations[0]._id,
        person_id: persons[0]._id,
      },
      annee_scolaires: ["2024-2025"],
      id_erp: ["#1"],
      custom_statut_apprenant: null,
      date_inscription: juil24,
      exclusion: null,
      diplome: null,
      session: {
        debut: sept24,
        fin: aout26,
      },
      adresse: {
        label: null,
        code_postal: "75001",
        code_commune_insee: "75056",
        commune: "Paris",
        code_academie: "01",
        code_departement: "75",
        code_region: "11",
        mission_locale_id: 609,
      },
      contrats: {},
      derniere_transmission: now,
      informations_personnelles: {
        email: null,
        telephone: null,
        rqth: false,
      },
      referent_handicap: {
        email: null,
        nom: null,
        prenom: null,
      },
      responsable_apprenant: {
        email1: null,
        email2: null,
      },
      _computed: {
        session: null,
        formation: null,
        statut: {
          en_cours: "ABANDON",
          parcours: [
            {
              date: new Date("2024-09-01T00:00:00.000Z"),
              valeur: "INSCRIT",
            },
            {
              date: new Date("2024-11-30T00:00:00.000Z"),
              valeur: "ABANDON",
            },
            { date: aout26, valeur: "FIN_DE_FORMATION" },
          ],
        },
      },
    });
  });
});
