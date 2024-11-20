import { ObjectId } from "mongodb";
import { IOrganisme } from "shared/models/data/organismes.model";
import { IOrganismeReferentiel } from "shared/models/data/organismesReferentiel.model";
import { it, expect, describe } from "vitest";

import { organismesDb, organismesReferentielDb } from "@/common/model/collections";
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
        nature: "responsable_formateur",
        lieux_de_formation: [],
        relations: [
          {
            type: "formateur->responsable",
            siret: "00000000000026",
            uai: "0000000B",
            label: "OFA 2",
            referentiel: true,
            sources: ["catalogue"],
          },
          {
            type: "formateur->responsable",
            siret: "00000000000034",
            uai: "0000000C",
            label: "OFA 3",
            referentiel: true,
            sources: ["catalogue"],
          },
          {
            type: "responsable->formateur",
            siret: "00000000000042",
            uai: "0000000D",
            label: "OFA 4",
            referentiel: true,
            sources: ["catalogue"],
          },
          {
            type: "responsable->formateur",
            siret: "00000000000059",
            uai: "0000000E",
            label: "OFA 5",
            referentiel: true,
            sources: ["catalogue"],
          },
          {
            type: "entreprise",
            siret: "00000000000067",
            uai: "0000000F",
            label: "OFA 6",
            referentiel: true,
            sources: ["catalogue"],
          },
        ],
      },
      {
        _id: new ObjectId(id(2)),
        siret: "00000000000026",
        uai: "0000000B",
        raison_sociale: "OFA 2",
        nature: "responsable_formateur",
        lieux_de_formation: [],
        relations: [
          {
            type: "responsable->formateur",
            siret: "00000000000018",
            uai: "0000000A",
            label: "OFA 1",
            referentiel: true,
            sources: ["catalogue"],
          },
        ],
      },
      {
        _id: new ObjectId(id(3)),
        siret: "00000000000034",
        uai: "0000000C",
        raison_sociale: "OFA 3",
        nature: "responsable_formateur",
        lieux_de_formation: [],
        relations: [
          {
            type: "responsable->formateur",
            siret: "00000000000018",
            uai: "0000000A",
            label: "OFA 1",
            referentiel: true,
            sources: ["catalogue"],
          },
        ],
      },
      {
        _id: new ObjectId(id(4)),
        siret: "00000000000042",
        uai: "0000000D",
        raison_sociale: "OFA 4",
        nature: "responsable_formateur",
        lieux_de_formation: [],
        relations: [
          {
            type: "formateur->responsable",
            siret: "00000000000018",
            uai: "0000000A",
            label: "OFA 1",
            referentiel: true,
            sources: ["catalogue"],
          },
        ],
      },
      {
        _id: new ObjectId(id(5)),
        siret: "00000000000059",
        uai: "0000000E",
        raison_sociale: "OFA 5",
        nature: "responsable_formateur",
        lieux_de_formation: [],
        relations: [
          {
            type: "formateur->responsable",
            siret: "00000000000018",
            uai: "0000000A",
            label: "OFA 1",
            referentiel: true,
            sources: ["catalogue"],
          },
        ],
      },
      {
        _id: new ObjectId(id(6)),
        siret: "00000000000067",
        uai: "0000000F",
        raison_sociale: "OFA 6",
        nature: "responsable_formateur",
        lieux_de_formation: [],
        relations: [
          {
            type: "entreprise",
            siret: "00000000000018",
            uai: "0000000A",
            label: "OFA 1",
            referentiel: true,
            sources: ["catalogue"],
          },
        ],
      },
    ];
    await organismesReferentielDb().insertMany(organismesReferentiel);
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
            label: "OFA 2",
            referentiel: true,
            sources: ["catalogue"],
            raison_sociale: "OFA 2",
            _id: expect.any(ObjectId),
          },
          {
            siret: "00000000000034",
            uai: "0000000C",
            label: "OFA 3",
            referentiel: true,
            sources: ["catalogue"],
            raison_sociale: "OFA 3",
            _id: expect.any(ObjectId),
          },
        ],
        organismesFormateurs: [
          {
            siret: "00000000000042",
            uai: "0000000D",
            label: "OFA 4",
            referentiel: true,
            sources: ["catalogue"],
            raison_sociale: "OFA 4",
            _id: expect.any(ObjectId),
          },

          {
            siret: "00000000000059",
            uai: "0000000E",
            label: "OFA 5",
            referentiel: true,
            sources: ["catalogue"],
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
            label: "OFA 1",
            referentiel: true,
            sources: ["catalogue"],
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
            label: "OFA 1",
            referentiel: true,
            sources: ["catalogue"],
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
            label: "OFA 1",
            referentiel: true,
            sources: ["catalogue"],
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
            label: "OFA 1",
            referentiel: true,
            sources: ["catalogue"],
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
