import { strict as assert } from "assert";
import { Readable } from "node:stream";

import { ObjectId } from "mongodb";
import nock from "nock";

import { formationsCatalogueDb } from "@/common/model/collections";
import config from "@/config";
import { hydrateFormationsCatalogue } from "@/jobs/hydrate/hydrate-formations-catalogue";
import { id } from "@tests/utils/testUtils";

describe("Job hydrateFormationsCatalogue", () => {
  const formationsCatalogue = [
    {
      _id: id(1),
      intitule_long: "CHIMIE (MASTER)",
    },
    {
      _id: id(2),
      intitule_long: "COUVREUR (CAP)",
    },
  ];

  it("Remplace tout le contenu de la collection formationsCatalogue", async () => {
    nock(config.mnaCatalogApi.endpoint)
      .persist()
      .get(new RegExp("v1/entity/formations.json.*"))
      .reply(200, () => Readable.from([JSON.stringify(formationsCatalogue)]), {
        "content-type": "application/json",
      });

    await formationsCatalogueDb().insertOne({
      _id: new ObjectId(id(123)),
      intitule_long: "JARDINIER PAYSAGISTE (CAPA)",
    } as any);

    await hydrateFormationsCatalogue();

    assert.deepStrictEqual(
      await formationsCatalogueDb().find().toArray(),
      formationsCatalogue.map((formation) => ({
        ...formation,
        _id: new ObjectId(formation._id),
      }))
    );
  });
});
