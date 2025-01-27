import { ObjectId } from "mongodb";
import type { IFormationCatalogue } from "shared/models";
import { IOrganisme } from "shared/models/data/organismes.model";
import { IOrganismeReferentiel } from "shared/models/data/organismesReferentiel.model";
import { generateFormationCatalogueFixture } from "shared/models/fixtures/formationsCatalogue.fixture";
import { it, expect, describe } from "vitest";

import { formationsCatalogueDb, organismesDb, organismesReferentielDb } from "@/common/model/collections";
import { hydrateOrganismesFromReferentiel } from "@/jobs/hydrate/organismes/hydrate-organismes";
import { hydrateOrganismesRelations } from "@/jobs/hydrate/organismes/hydrate-organismes-relations";
import { useMongo } from "@tests/jest/setupMongo";
import { id } from "@tests/utils/testUtils";

describe("Job hydrate:organismes-relations", () => {
  useMongo();
  it("Met à jour les relations des organismes selon le référentiel", async () => {
    /*
    OFA 1 formateur pour OFA 2 et 3
    OFA 1 responsable de OFA 4 5
    OFA 1 même entreprise que OFA 6
    */
    const organismesReferentiel: IOrganismeReferentiel[] = [
      {
        _id: new ObjectId(id(1)),
        siret: "00000000000018",
        uai: "0000000A",
        raison_sociale: "OFA 1",
        nature: "inconnue",
        lieux_de_formation: [],
      },
      {
        _id: new ObjectId(id(2)),
        siret: "00000000000026",
        uai: "0000000B",
        raison_sociale: "OFA 2",
        nature: "inconnue",
        lieux_de_formation: [],
      },
      {
        _id: new ObjectId(id(3)),
        siret: "00000000000034",
        uai: "0000000C",
        raison_sociale: "OFA 3",
        nature: "inconnue",
        lieux_de_formation: [],
      },
      {
        _id: new ObjectId(id(4)),
        siret: "00000000000042",
        uai: "0000000D",
        raison_sociale: "OFA 4",
        nature: "inconnue",
        lieux_de_formation: [],
      },
      {
        _id: new ObjectId(id(5)),
        siret: "00000000000059",
        uai: "0000000E",
        raison_sociale: "OFA 5",
        nature: "inconnue",
        lieux_de_formation: [],
      },
      {
        _id: new ObjectId(id(6)),
        siret: "00000000000067",
        uai: "0000000F",
        raison_sociale: "OFA 6",
        nature: "inconnue",
        lieux_de_formation: [],
      },
    ];

    const generateFormationLink = (param: {
      resp: IOrganismeReferentiel;
      form: IOrganismeReferentiel;
    }): IFormationCatalogue => {
      return generateFormationCatalogueFixture({
        cle_ministere_educatif: `${param.resp.siret}-${param.resp.uai}-${param.form.siret}-${param.form.uai}`,
        etablissement_gestionnaire_siret: param.resp.siret,
        etablissement_gestionnaire_uai: param.resp.uai,
        etablissement_formateur_siret: param.form.siret,
        etablissement_formateur_uai: param.form.uai,
      });
    };

    const formationsCatalogue: IFormationCatalogue[] = [
      generateFormationLink({ form: organismesReferentiel[0], resp: organismesReferentiel[1] }),
      generateFormationLink({ form: organismesReferentiel[0], resp: organismesReferentiel[2] }),
      generateFormationLink({ resp: organismesReferentiel[0], form: organismesReferentiel[3] }),
      generateFormationLink({ resp: organismesReferentiel[0], form: organismesReferentiel[4] }),
    ];

    await organismesReferentielDb().insertMany(organismesReferentiel);
    await formationsCatalogueDb().insertMany(formationsCatalogue);
    // on peuple les organismes à partir du référentiel en raccourci
    await hydrateOrganismesFromReferentiel();

    // vérifier que les liens sont bien peuplés côté TDB
    await hydrateOrganismesRelations();

    const organismes = await organismesDb()
      .find({}, { sort: { siret: 1 } })
      .toArray();
    expect(organismes).toMatchObject([
      {
        raison_sociale: "OFA 1",
        siret: "00000000000018",
        organismesResponsables: [
          {
            siret: "00000000000026",
            uai: "0000000B",
            raison_sociale: "OFA 2",
            _id: expect.any(ObjectId),
          },
          {
            siret: "00000000000034",
            uai: "0000000C",
            raison_sociale: "OFA 3",
            _id: expect.any(ObjectId),
          },
        ],
        organismesFormateurs: [
          {
            siret: "00000000000042",
            uai: "0000000D",
            raison_sociale: "OFA 4",
            _id: expect.any(ObjectId),
          },
          {
            siret: "00000000000059",
            uai: "0000000E",
            raison_sociale: "OFA 5",
            _id: expect.any(ObjectId),
          },
        ],
      },
      {
        raison_sociale: "OFA 2",
        siret: "00000000000026",
        organismesResponsables: [],
        organismesFormateurs: [
          {
            siret: "00000000000018",
            uai: "0000000A",
            raison_sociale: "OFA 1",
            _id: expect.any(ObjectId),
          },
        ],
      },
      {
        raison_sociale: "OFA 3",
        siret: "00000000000034",
        organismesResponsables: [],
        organismesFormateurs: [
          {
            siret: "00000000000018",
            uai: "0000000A",
            raison_sociale: "OFA 1",
            _id: expect.any(ObjectId),
          },
        ],
      },
      {
        raison_sociale: "OFA 4",
        siret: "00000000000042",
        organismesResponsables: [
          {
            siret: "00000000000018",
            uai: "0000000A",
            raison_sociale: "OFA 1",
            _id: expect.any(ObjectId),
          },
        ],
        organismesFormateurs: [],
      },
      {
        raison_sociale: "OFA 5",
        siret: "00000000000059",
        organismesResponsables: [
          {
            siret: "00000000000018",
            uai: "0000000A",
            raison_sociale: "OFA 1",
            _id: expect.any(ObjectId),
          },
        ],
        organismesFormateurs: [],
      },
      {
        raison_sociale: "OFA 6",
        siret: "00000000000067",
        organismesResponsables: [],
        organismesFormateurs: [],
      },
    ] as IOrganisme[]);
  });
});
