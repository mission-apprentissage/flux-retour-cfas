import { strict as assert } from "assert";
import { createOrganisme } from "../../../../src/common/actions/organismes/organismes.actions.js";
import { createIndexes, dropIndexes } from "../../../../src/common/model/indexes/index.js";
import { getDbCollectionIndexes } from "../../../../src/common/mongodb.js";
import cfasModelDescriptor from "./../../../../src/common/model/previous.models/toRemove.models/cfas.model.js";

describe("Cfas Indexes", () => {
  let cfasIndexes = [];

  beforeEach(async () => {
    // Crée une entrée en base
    await createOrganisme({
      uai: "0142321X",
      sirets: ["44492238900010"],
      adresse: {
        departement: "14",
        region: "28",
        academie: "70",
      },
      reseaux: ["CCI"],
      erps: ["YMAG"],
      nature: "responsable_formateur",
      nom: "ADEN Formations (Caen)",
    });

    // Re-créé les indexs après l'ajout d'une entrée en base & récupère les indexes
    await dropIndexes();
    await createIndexes();
    cfasIndexes = await getDbCollectionIndexes(cfasModelDescriptor.collectionName);
  });

  it("Vérifie l'existence d'un index nom_tokenized_text", async () => {
    assert.equal(
      cfasIndexes.some((item) => item.name === "nom_tokenized_text"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ uai", async () => {
    assert.equal(
      cfasIndexes.some((item) => item.name === "uai"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ sirets", async () => {
    assert.equal(
      cfasIndexes.some((item) => item.name === "sirets"),
      true
    );
  });
});
