import { ObjectId } from "mongodb";
import type { IFormationCatalogue, IRelatedOrganisme } from "shared/models";
import { zFormationCatalogue } from "shared/models/data/formationsCatalogue.model";
import { IOrganisme } from "shared/models/data/organismes.model";
import { generateFormationCatalogueFixture } from "shared/models/fixtures/formationsCatalogue.fixture";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { it, expect, describe, vi, beforeEach } from "vitest";

import { formationsCatalogueDb, organismesDb } from "@/common/model/collections";
import { hydrateOrganismesRelations } from "@/jobs/hydrate/organismes/hydrate-organismes-relations";
import { useMongo } from "@tests/jest/setupMongo";
import { id } from "@tests/utils/testUtils";

describe("Job hydrate:organismes-relations", () => {
  useMongo();

  const lastMonth = new Date("2025-01-01T15:00:00.000Z");
  const yesterday = new Date("2025-01-26T15:00:00.000Z");
  const now = new Date("2025-01-27T15:00:00.000Z");

  const generateFormationLink = (param: { resp: IOrganisme; form: IOrganisme }): IFormationCatalogue => {
    return generateFormationCatalogueFixture({
      cle_ministere_educatif: `${param.resp.siret}-${param.resp.uai}-${param.form.siret}-${param.form.uai}`,
      etablissement_gestionnaire_siret: param.resp.siret,
      etablissement_gestionnaire_uai: param.resp.uai,
      etablissement_formateur_siret: param.form.siret,
      etablissement_formateur_uai: param.form.uai,
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);

    return () => {
      vi.useRealTimers();
    };
  });

  it("Met à jour les relations des organismes selon le référentiel", async () => {
    /*
    OFA 1 formateur pour OFA 2 et 3
    OFA 1 responsable de OFA 4 5
    OFA 1 même entreprise que OFA 6
    */
    const organismes: IOrganisme[] = [
      generateOrganismeFixture({
        _id: new ObjectId(id(1)),
        siret: "00000000000018",
        uai: "0000000A",
        raison_sociale: "OFA 1",
        nature: "inconnue",
        organismesResponsables: [],
        organismesFormateurs: [],
        created_at: lastMonth,
        updated_at: yesterday,
        fiabilisation_statut: "FIABLE",
      }),
      generateOrganismeFixture({
        _id: new ObjectId(id(2)),
        siret: "00000000000026",
        uai: "0000000B",
        raison_sociale: "OFA 2",
        nature: "inconnue",
        organismesResponsables: [],
        organismesFormateurs: [],
        created_at: yesterday,
        updated_at: yesterday,
        fiabilisation_statut: "FIABLE",
      }),
      generateOrganismeFixture({
        _id: new ObjectId(id(3)),
        siret: "00000000000034",
        uai: "0000000C",
        raison_sociale: "OFA 3",
        nature: "inconnue",
        organismesResponsables: [],
        organismesFormateurs: [],
        created_at: lastMonth,
        updated_at: lastMonth,
        fiabilisation_statut: "NON_FIABLE",
      }),
      generateOrganismeFixture({
        _id: new ObjectId(id(4)),
        siret: "00000000000042",
        uai: "0000000D",
        raison_sociale: "OFA 4",
        nature: "inconnue",
        organismesResponsables: [],
        organismesFormateurs: [],
        created_at: yesterday,
        updated_at: yesterday,
        fiabilisation_statut: "FIABLE",
      }),
      generateOrganismeFixture({
        _id: new ObjectId(id(5)),
        siret: "00000000000059",
        uai: "0000000E",
        raison_sociale: "OFA 5",
        nature: "inconnue",
        organismesResponsables: [],
        organismesFormateurs: [],
        created_at: yesterday,
        updated_at: yesterday,
        fiabilisation_statut: "NON_FIABLE",
      }),
      generateOrganismeFixture({
        _id: new ObjectId(id(6)),
        siret: "00000000000067",
        uai: "0000000F",
        raison_sociale: "OFA 6",
        nature: "inconnue",
        organismesResponsables: [],
        organismesFormateurs: [],
        created_at: yesterday,
        updated_at: yesterday,
        fiabilisation_statut: "FIABLE",
      }),
    ];

    await organismesDb().insertMany(organismes);

    const formationsCatalogue: IFormationCatalogue[] = [
      generateFormationLink({ form: organismes[0], resp: organismes[1] }),
      generateFormationLink({ form: organismes[0], resp: organismes[2] }),
      generateFormationLink({ resp: organismes[0], form: organismes[3] }),
      generateFormationLink({ resp: organismes[0], form: organismes[4] }),
    ];

    const ofaInfos: IRelatedOrganisme[] = organismes.map((o, i): IRelatedOrganisme => {
      let nature: IRelatedOrganisme["nature"] = "inconnue";
      if (i === 0) {
        nature = "responsable_formateur";
      }
      if (i === 1 || i === 2) {
        nature = "responsable";
      }
      if (i === 3 || i === 4) {
        nature = "formateur";
      }

      return {
        siret: o.siret,
        uai: o.uai,
        raison_sociale: o.raison_sociale,
        _id: o._id,
        fiable: o.fiabilisation_statut === "FIABLE",
        nature,
        responsabilitePartielle: false,
      };
    });

    await formationsCatalogueDb().insertMany(formationsCatalogue);

    await hydrateOrganismesRelations();

    const updatedOrganismes = await organismesDb()
      .find({}, { sort: { siret: 1 } })
      .toArray();

    expect(updatedOrganismes).toEqual([
      {
        ...organismes[0],
        nature: "responsable_formateur",
        organismesResponsables: [ofaInfos[1], ofaInfos[2]],
        organismesFormateurs: [ofaInfos[3], ofaInfos[4]],
        updated_at: now,
      },
      {
        ...organismes[1],
        nature: "responsable",
        organismesResponsables: [],
        organismesFormateurs: [ofaInfos[0]],
        updated_at: now,
      },
      {
        ...organismes[2],
        nature: "responsable",
        organismesResponsables: [],
        organismesFormateurs: [ofaInfos[0]],
        updated_at: now,
      },
      {
        ...organismes[3],
        nature: "formateur",
        organismesResponsables: [ofaInfos[0]],
        organismesFormateurs: [],
        updated_at: now,
      },
      {
        ...organismes[4],
        nature: "formateur",
        organismesResponsables: [ofaInfos[0]],
        organismesFormateurs: [],
        updated_at: now,
      },
      {
        ...organismes[5],
        nature: "inconnue",
        organismesResponsables: [],
        organismesFormateurs: [],
        updated_at: now,
      },
    ] as IOrganisme[]);
  });

  describe("responsabilitePartielle", () => {
    it("Si un responsable_formateur a un autre responsable de la meme unité légale ==> responsabilite_partielle=false", async () => {
      const organismes: IOrganisme[] = [
        generateOrganismeFixture({
          _id: new ObjectId(id(1)),
          siret: "35600000037209",
          uai: "0000000A",
          raison_sociale: "OFA 1",
          nature: "inconnue",
          organismesResponsables: [],
          organismesFormateurs: [],
          created_at: lastMonth,
          updated_at: yesterday,
          fiabilisation_statut: "FIABLE",
        }),
        generateOrganismeFixture({
          _id: new ObjectId(id(2)),
          siret: "35600000000048",
          uai: "0000000B",
          raison_sociale: "OFA 2",
          nature: "inconnue",
          organismesResponsables: [],
          organismesFormateurs: [],
          created_at: yesterday,
          updated_at: yesterday,
          fiabilisation_statut: "FIABLE",
        }),
      ];

      await organismesDb().insertMany(organismes);

      const formationsCatalogue: IFormationCatalogue[] = [
        generateFormationLink({ form: organismes[0], resp: organismes[1] }),
        generateFormationLink({ form: organismes[0], resp: organismes[0] }),
      ];

      await formationsCatalogueDb().insertMany(formationsCatalogue);

      await hydrateOrganismesRelations();

      const updatedOrganismes = await organismesDb()
        .find(
          {},
          {
            sort: { raison_sociale: 1 },
            projection: { _id: 0, raison_sociale: 1, organismesResponsables: 1, organismesFormateurs: 1 },
          }
        )
        .toArray();

      expect(updatedOrganismes).toEqual([
        {
          raison_sociale: organismes[0].raison_sociale,
          organismesResponsables: [
            expect.objectContaining({
              _id: organismes[1]._id,
              fiable: true,
              nature: "responsable",
              responsabilitePartielle: false,
            }),
          ],
          organismesFormateurs: [],
        },
        {
          raison_sociale: organismes[1].raison_sociale,
          organismesResponsables: [],
          organismesFormateurs: [
            expect.objectContaining({
              _id: organismes[0]._id,
              fiable: true,
              nature: "responsable_formateur",
              responsabilitePartielle: false,
            }),
          ],
        },
      ]);
    });

    it("Si un responsable_formateur a un autre responsable d'une unité légale différente ==> responsabilite_partielle=true", async () => {
      const organismes: IOrganisme[] = [
        generateOrganismeFixture({
          _id: new ObjectId(id(1)),
          siret: "00000000000018",
          uai: "0000000A",
          raison_sociale: "OFA 1",
          nature: "inconnue",
          organismesResponsables: [],
          organismesFormateurs: [],
          created_at: lastMonth,
          updated_at: yesterday,
          fiabilisation_statut: "FIABLE",
        }),
        generateOrganismeFixture({
          _id: new ObjectId(id(2)),
          siret: "35600000000048",
          uai: "0000000B",
          raison_sociale: "OFA 2",
          nature: "inconnue",
          organismesResponsables: [],
          organismesFormateurs: [],
          created_at: yesterday,
          updated_at: yesterday,
          fiabilisation_statut: "FIABLE",
        }),
      ];

      await organismesDb().insertMany(organismes);

      const formationsCatalogue: IFormationCatalogue[] = [
        generateFormationLink({ form: organismes[0], resp: organismes[1] }),
        generateFormationLink({ form: organismes[0], resp: organismes[0] }),
      ];

      await formationsCatalogueDb().insertMany(formationsCatalogue);

      await hydrateOrganismesRelations();

      const updatedOrganismes = await organismesDb()
        .find(
          {},
          {
            sort: { raison_sociale: 1 },
            projection: { _id: 0, raison_sociale: 1, organismesResponsables: 1, organismesFormateurs: 1 },
          }
        )
        .toArray();

      expect(updatedOrganismes).toEqual([
        {
          raison_sociale: organismes[0].raison_sociale,
          organismesResponsables: [
            expect.objectContaining({
              _id: organismes[1]._id,
              fiable: true,
              nature: "responsable",
              responsabilitePartielle: true,
            }),
          ],
          organismesFormateurs: [],
        },
        {
          raison_sociale: organismes[1].raison_sociale,
          organismesResponsables: [],
          organismesFormateurs: [
            expect.objectContaining({
              _id: organismes[0]._id,
              fiable: true,
              nature: "responsable_formateur",
              responsabilitePartielle: true,
            }),
          ],
        },
      ]);
    });

    it("Si un formateur simple a un responsable unique d'une unité légale différente ==> responsabilite_partielle=false", async () => {
      const organismes: IOrganisme[] = [
        generateOrganismeFixture({
          _id: new ObjectId(id(1)),
          siret: "00000000000018",
          uai: "0000000A",
          raison_sociale: "OFA 1",
          nature: "inconnue",
          organismesResponsables: [],
          organismesFormateurs: [],
          created_at: lastMonth,
          updated_at: yesterday,
          fiabilisation_statut: "FIABLE",
        }),
        generateOrganismeFixture({
          _id: new ObjectId(id(2)),
          siret: "35600000000048",
          uai: "0000000B",
          raison_sociale: "OFA 2",
          nature: "inconnue",
          organismesResponsables: [],
          organismesFormateurs: [],
          created_at: yesterday,
          updated_at: yesterday,
          fiabilisation_statut: "FIABLE",
        }),
      ];

      await organismesDb().insertMany(organismes);

      const formationsCatalogue: IFormationCatalogue[] = [
        generateFormationLink({ form: organismes[0], resp: organismes[1] }),
      ];

      await formationsCatalogueDb().insertMany(formationsCatalogue);

      await hydrateOrganismesRelations();

      const updatedOrganismes = await organismesDb()
        .find(
          {},
          {
            sort: { raison_sociale: 1 },
            projection: { _id: 0, raison_sociale: 1, organismesResponsables: 1, organismesFormateurs: 1 },
          }
        )
        .toArray();

      expect(updatedOrganismes).toEqual([
        {
          raison_sociale: organismes[0].raison_sociale,
          organismesResponsables: [
            expect.objectContaining({
              _id: organismes[1]._id,
              fiable: true,
              nature: "responsable",
              responsabilitePartielle: false,
            }),
          ],
          organismesFormateurs: [],
        },
        {
          raison_sociale: organismes[1].raison_sociale,
          organismesResponsables: [],
          organismesFormateurs: [
            expect.objectContaining({
              _id: organismes[0]._id,
              fiable: true,
              nature: "formateur",
              responsabilitePartielle: false,
            }),
          ],
        },
      ]);
    });

    it("La responsabilté partielle est spécifique à une relation responsable-formateur", async () => {
      const organismes: IOrganisme[] = [
        generateOrganismeFixture({
          _id: new ObjectId(id(1)),
          siret: "35600000037209",
          uai: "0000000A",
          raison_sociale: "OFA 1",
          nature: "inconnue",
          organismesResponsables: [],
          organismesFormateurs: [],
          created_at: lastMonth,
          updated_at: yesterday,
          fiabilisation_statut: "FIABLE",
        }),
        generateOrganismeFixture({
          _id: new ObjectId(id(2)),
          siret: "35600000000048",
          uai: "0000000B",
          raison_sociale: "OFA 2",
          nature: "inconnue",
          organismesResponsables: [],
          organismesFormateurs: [],
          created_at: yesterday,
          updated_at: yesterday,
          fiabilisation_statut: "FIABLE",
        }),
        generateOrganismeFixture({
          _id: new ObjectId(id(3)),
          siret: "00000000000018",
          uai: "0000000C",
          raison_sociale: "OFA 3",
          nature: "inconnue",
          organismesResponsables: [],
          organismesFormateurs: [],
          created_at: yesterday,
          updated_at: yesterday,
          fiabilisation_statut: "FIABLE",
        }),
      ];

      await organismesDb().insertMany(organismes);

      const formationsCatalogue: IFormationCatalogue[] = [
        generateFormationLink({ form: organismes[0], resp: organismes[1] }),
        generateFormationLink({ form: organismes[0], resp: organismes[2] }),
      ];

      await formationsCatalogueDb().insertMany(formationsCatalogue);

      await hydrateOrganismesRelations();

      const updatedOrganismes = await organismesDb()
        .find(
          {},
          {
            sort: { raison_sociale: 1 },
            projection: { _id: 0, raison_sociale: 1, organismesResponsables: 1, organismesFormateurs: 1 },
          }
        )
        .toArray();

      expect(updatedOrganismes).toEqual([
        {
          raison_sociale: organismes[0].raison_sociale,
          organismesResponsables: [
            expect.objectContaining({
              _id: organismes[2]._id,
              fiable: true,
              nature: "responsable",
              responsabilitePartielle: true,
            }),
            expect.objectContaining({
              _id: organismes[1]._id,
              fiable: true,
              nature: "responsable",
              responsabilitePartielle: false,
            }),
          ],
          organismesFormateurs: [],
        },
        {
          raison_sociale: organismes[1].raison_sociale,
          organismesResponsables: [],
          organismesFormateurs: [
            expect.objectContaining({
              _id: organismes[0]._id,
              fiable: true,
              nature: "formateur",
              responsabilitePartielle: false,
            }),
          ],
        },
        {
          raison_sociale: organismes[2].raison_sociale,
          organismesResponsables: [],
          organismesFormateurs: [
            expect.objectContaining({
              _id: organismes[0]._id,
              fiable: true,
              nature: "formateur",
              responsabilitePartielle: true,
            }),
          ],
        },
      ]);
    });
  });

  describe("Nature sur les formations publiées ou en cours de session", () => {
    const organisme = (siret: string, uai: string, nature: IOrganisme["nature"] = "inconnue") =>
      generateOrganismeFixture({
        _id: new ObjectId(),
        siret,
        uai,
        nature,
        organismesResponsables: [],
        organismesFormateurs: [],
      });

    const insererFormation = async (resp: IOrganisme, form: IOrganisme, formation: Partial<IFormationCatalogue>) => {
      await formationsCatalogueDb().insertOne(
        zFormationCatalogue.parse({ ...generateFormationLink({ resp, form }), ...formation })
      );
    };

    it.each([
      {
        cas: "une session finie il y a 3 mois",
        date_fin: ["2023-06-30T00:00:00.000Z", "2024-10-27T00:00:00.000Z"],
        natures: ["responsable", "formateur"],
      },
      {
        cas: "une session pas encore finie",
        date_fin: ["2025-06-30T00:00:00.000Z"],
        natures: ["responsable", "formateur"],
      },
      {
        cas: "une session finie il y a 7 mois",
        date_fin: ["2024-06-27T00:00:00.000Z"],
        natures: ["inconnue", "inconnue"],
      },
      { cas: "aucune date de fin", date_fin: null, natures: ["inconnue", "inconnue"] },
    ])("Formation dépubliée avec $cas : nature $natures, sans relation", async ({ date_fin, natures }) => {
      const resp = organisme("00000000000042", "0000001A");
      const form = organisme("00000000000059", "0000002B");
      await organismesDb().insertMany([resp, form]);
      await insererFormation(resp, form, { published: false, date_fin });

      await hydrateOrganismesRelations();

      const [responsable, formateur] = await organismesDb()
        .find({}, { sort: { siret: 1 } })
        .toArray();
      expect(responsable).toMatchObject({ nature: natures[0], organismesFormateurs: [], organismesResponsables: [] });
      expect(formateur).toMatchObject({ nature: natures[1], organismesFormateurs: [], organismesResponsables: [] });
    });

    it("Donne la nature lieu de formation au seul lieu exact d'une formation active, sans relation", async () => {
      const resp = organisme("00000000000042", "0000001A");
      const form = organisme("00000000000059", "0000002B");
      const lieu = organisme("00000000000067", "0000003C");
      const memeSiretAutreUai = organisme("00000000000067", "0000004D");
      const lieuAncien = organisme("00000000000075", "0000005E");
      await organismesDb().insertMany([resp, form, lieu, memeSiretAutreUai, lieuAncien]);
      await insererFormation(resp, form, {
        etablissement_lieu_formation_siret: lieu.siret,
        etablissement_lieu_formation_uai: lieu.uai,
      });
      await insererFormation(resp, form, {
        cle_ministere_educatif: "formation-finie-il-y-a-7-mois",
        published: false,
        date_fin: ["2024-06-27T00:00:00.000Z"],
        etablissement_lieu_formation_siret: lieuAncien.siret,
        etablissement_lieu_formation_uai: lieuAncien.uai,
      });

      await hydrateOrganismesRelations();

      const organismes = await organismesDb().find({}).toArray();
      expect(Object.fromEntries(organismes.map((o) => [`${o.siret}-${o.uai}`, o.nature]))).toEqual({
        "00000000000042-0000001A": "responsable",
        "00000000000059-0000002B": "formateur",
        "00000000000067-0000003C": "lieu_formation",
        "00000000000067-0000004D": "inconnue",
        "00000000000075-0000005E": "inconnue",
      });
      expect(organismes.find((o) => o._id.equals(lieu._id))).toMatchObject({
        organismesFormateurs: [],
        organismesResponsables: [],
      });
      expect(organismes.find((o) => o._id.equals(resp._id))?.organismesFormateurs?.map((o) => o._id)).toEqual([
        form._id,
      ]);
    });

    it("Garde la nature formateur à un organisme qui est aussi le lieu de sa formation", async () => {
      const resp = organisme("00000000000042", "0000001A");
      const form = organisme("00000000000059", "0000002B");
      await organismesDb().insertMany([resp, form]);
      await insererFormation(resp, form, {
        etablissement_lieu_formation_siret: form.siret,
        etablissement_lieu_formation_uai: form.uai,
      });

      await hydrateOrganismesRelations();

      expect((await organismesDb().findOne({ _id: form._id }))?.nature).toBe("formateur");
    });

    it("Renvoie la répartition par nature et les transitions depuis le calcul précédent", async () => {
      const resp = organisme("00000000000042", "0000001A", "inconnue");
      const form = organisme("00000000000059", "0000002B", "formateur");
      const ancien = organisme("00000000000067", "0000003C", "responsable");
      await organismesDb().insertMany([resp, form, ancien]);
      await insererFormation(resp, form, { published: false, date_fin: ["2024-10-27T00:00:00.000Z"] });

      const bilan = await hydrateOrganismesRelations();

      expect(bilan.repartition).toEqual({ responsable: 1, formateur: 1, inconnue: 1 });
      expect(bilan.transitions).toHaveLength(2);
      expect(bilan.transitions).toEqual(
        expect.arrayContaining([
          { avant: "inconnue", apres: "responsable", nombre: 1 },
          { avant: "responsable", apres: "inconnue", nombre: 1 },
        ])
      );
    });
  });
});
