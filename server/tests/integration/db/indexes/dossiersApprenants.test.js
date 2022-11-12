import { strict as assert } from "assert";
import { createIndexes, dropIndexes } from "../../../../src/common/model/indexes/index.js";
import { getDbCollectionIndexes } from "../../../../src/common/mongodb.js";
import dossiersApprenantsModelDescriptor from "../../../../src/common/model/dossiersApprenants.model.js";
import { createRandomDossierApprenant } from "../../../data/randomizedSample.js";
import dossiersApprenants from "../../../../src/common/components/dossiersApprenants.js";

// TODO : Boucler sur la liste des index names pour les tests
describe("DossiersApprenants Indexes", () => {
  let indexes = [];

  beforeEach(async () => {
    const { addOrUpdateDossiersApprenants } = await dossiersApprenants();

    // Crée une entrée en base
    const randomDossier = createRandomDossierApprenant({});
    await addOrUpdateDossiersApprenants(randomDossier);

    // Re-créé les indexs après l'ajout d'une entrée en base & récupère les indexes
    await dropIndexes();
    await createIndexes();
    indexes = await getDbCollectionIndexes(dossiersApprenantsModelDescriptor.collectionName);
  });

  it("Vérifie l'existence d'un index sur le champ uai_etablissement", async () => {
    assert.equal(
      indexes.some((item) => item.name === "uai_etablissement"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ siret_etablissement", async () => {
    assert.equal(
      indexes.some((item) => item.name === "siret_etablissement"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ formation_cfd", async () => {
    assert.equal(
      indexes.some((item) => item.name === "formation_cfd"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ etablissement_num_region", async () => {
    assert.equal(
      indexes.some((item) => item.name === "etablissement_num_region"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ etablissement_num_departement", async () => {
    assert.equal(
      indexes.some((item) => item.name === "etablissement_num_departement"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ annee_scolaire", async () => {
    assert.equal(
      indexes.some((item) => item.name === "annee_scolaire"),
      true
    );
  });

  it("Vérifie l'existence d'un index sur le champ etablissement_reseaux", async () => {
    assert.equal(
      indexes.some((item) => item.name === "etablissement_reseaux"),
      true
    );
  });
});
