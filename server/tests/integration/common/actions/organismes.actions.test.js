import { strict as assert } from "assert";
import { createRandomOrganisme } from "../../../data/randomizedSample.js";
import pick from "lodash.pick";
import {
  createOrganisme,
  findOrganismeById,
  mapFiabilizedOrganismeUaiSiretCouple,
  updateOrganisme,
} from "../../../../src/common/actions/organismes.actions.js";
import { buildTokenizedString } from "../../../../src/common/utils/buildTokenizedString.js";
import { fiabilisationUaiSiretDb } from "../../../../src/common/model/collections.js";
import { FIABILISATION_MAPPINGS } from "../../../../src/jobs/fiabilisation/uai-siret/create-fiabilisation-uai-siret-mapping/mapping.js";

describe("Test des actions Organismes", () => {
  describe("createOrganisme", () => {
    it("throws when given organisme is null", async () => {
      try {
        await createOrganisme(null);
      } catch (err) {
        assert.notEqual(err, undefined);
      }
    });

    it("throws when cfa with given uai already exists", async () => {
      const uai = "0802004U";
      const randomOrganisme = createRandomOrganisme();
      await createOrganisme({ ...randomOrganisme, uai });

      try {
        await createOrganisme({ ...randomOrganisme, uai });
      } catch (err) {
        assert.notEqual(err, undefined);
      }
    });

    it("returns created organisme when valid", async () => {
      const randomOrganisme = createRandomOrganisme();
      const { _id } = await createOrganisme(randomOrganisme);
      const created = await findOrganismeById(_id);

      assert.deepEqual(pick(created, ["uai", "sirets", "nom", "adresse", "nature"]), {
        uai: randomOrganisme.uai,
        sirets: randomOrganisme.sirets,
        nom: randomOrganisme.nom,
        adresse: randomOrganisme.adresse,
        nature: randomOrganisme.nature,
      });

      assert.equal(created.nom_tokenized, buildTokenizedString(randomOrganisme.nom.trim(), 4));
      assert.equal(created.private_url !== null, true);
      assert.equal(created.accessToken !== null, true);
      assert.equal(created.created_at !== null, true);
      assert.equal(created.updated_at !== null, true);
    });
  });

  describe("updateOrganisme", () => {
    it("throws when given data is null", async () => {
      // TODO use assert.rejects
      try {
        await updateOrganisme("id", null);
      } catch (err) {
        assert.notEqual(err, undefined);
      }
    });

    it("throws when given id is null", async () => {
      const randomOrganisme = createRandomOrganisme();
      // TODO use assert.rejects
      try {
        await updateOrganisme(null, randomOrganisme);
      } catch (err) {
        assert.notEqual(err, undefined);
      }
    });

    it("throws when given id is not existant", async () => {
      const randomOrganisme = createRandomOrganisme();
      // TODO use assert.rejects
      try {
        await updateOrganisme("random-id", randomOrganisme);
      } catch (err) {
        assert.notEqual(err, undefined);
      }
    });

    it("returns update cfa when id and dossier apprenant are valid", async () => {
      const randomOrganisme = createRandomOrganisme();
      const { _id } = await createOrganisme(randomOrganisme);
      const toUpdateOrganisme = { ...randomOrganisme, nom: "UPDATED" };
      const updatedOrganisme = await updateOrganisme(_id, toUpdateOrganisme);

      assert.deepEqual(pick(updatedOrganisme, ["uai", "sirets", "nom", "adresse", "nature"]), {
        uai: updatedOrganisme.uai,
        sirets: updatedOrganisme.sirets,
        nom: "UPDATED",
        adresse: updatedOrganisme.adresse,
        nature: updatedOrganisme.nature,
      });

      assert.equal(updatedOrganisme.nom_tokenized, buildTokenizedString("UPDATED", 4));
      assert.equal(updatedOrganisme.private_url !== null, true);
      assert.equal(updatedOrganisme.accessToken !== null, true);
      assert.equal(updatedOrganisme.created_at !== null, true);
      assert.equal(updatedOrganisme.updated_at !== null, true);
    });
  });

  describe("mapFiabilizedOrganismeUaiSiretCouple", () => {
    it("return same uai-siret couple when not present in fiabilisation file or collection", async () => {
      const uai = "0802004U";
      const siret = "77937827200016";

      const { cleanUai, cleanSiret } = await mapFiabilizedOrganismeUaiSiretCouple({
        uai,
        siret,
      });
      assert.equal(cleanUai, uai);
      assert.equal(cleanSiret, siret);
    });

    it("return cleaned uai-siret couple when uai present in fiabilisation file", async () => {
      const uai = FIABILISATION_MAPPINGS[0].uai;
      const siret = FIABILISATION_MAPPINGS[0].siret;

      const { cleanUai, cleanSiret } = await mapFiabilizedOrganismeUaiSiretCouple({ uai, siret });
      assert.equal(cleanUai, FIABILISATION_MAPPINGS[0].uai_fiable);
      assert.equal(cleanSiret, FIABILISATION_MAPPINGS[0].siret_fiable);
    });

    it("return cleaned uai-siret couple when uai is the same in fiabilisation collection", async () => {
      const sampleUai = "0755805C";
      const sampleSiret = "77568013501139";
      const sampleUaiFiable = "0755805C";
      const sampleSiretFiable = "77568013501089";

      // Create entry in fiabilisation collection
      await fiabilisationUaiSiretDb().insertOne({
        uai: sampleUai,
        siret: sampleSiret,
        uai_fiable: sampleUaiFiable,
        siret_fiable: sampleSiretFiable,
      });

      const { cleanUai, cleanSiret } = await mapFiabilizedOrganismeUaiSiretCouple({
        uai: sampleUai,
        siret: sampleSiret,
      });
      assert.equal(cleanUai, sampleUaiFiable);
      assert.equal(cleanSiret, sampleSiretFiable);
    });

    it("return cleaned uai-siret couple when siret is the same in fiabilisation collection", async () => {
      const sampleUai = "0755805C";
      const sampleSiret = "77568013501139";
      const sampleUaiFiable = "0802004U";
      const sampleSiretFiable = "77568013501139";

      // Create entry in fiabilisation collection
      await fiabilisationUaiSiretDb().insertOne({
        uai: sampleUai,
        siret: sampleSiret,
        uai_fiable: sampleUaiFiable,
        siret_fiable: sampleSiretFiable,
      });

      const { cleanUai, cleanSiret } = await mapFiabilizedOrganismeUaiSiretCouple({
        uai: sampleUai,
        siret: sampleSiret,
      });
      assert.equal(cleanUai, sampleUaiFiable);
      assert.equal(cleanSiret, sampleSiretFiable);
    });

    it("return cleaned uai-siret couple when siret is null in fiabilisation collection", async () => {
      const sampleUai = "0755805C";
      const sampleSiret = null;
      const sampleUaiFiable = "0755805C";
      const sampleSiretFiable = "77568013501139";

      // Create entry in fiabilisation collection
      await fiabilisationUaiSiretDb().insertOne({
        uai: sampleUai,
        siret: sampleSiret,
        uai_fiable: sampleUaiFiable,
        siret_fiable: sampleSiretFiable,
      });

      const { cleanUai, cleanSiret } = await mapFiabilizedOrganismeUaiSiretCouple({
        uai: sampleUai,
        siret: sampleSiret,
      });
      assert.equal(cleanUai, sampleUaiFiable);
      assert.equal(cleanSiret, sampleSiretFiable);
    });
  });

  // describe("createAndControlOrganisme", () => {
  //   it("return organisme id if uai-siret couple existant in db", async () => {
  //     const uai = "0802004U";
  //     const siret = "77937827200016";

  //     const randomOrganisme = createRandomOrganisme({ uai, siret });
  //     const { _id: createdOrganismeId } = await createOrganisme(randomOrganisme);

  //     const { _id: foundOrganismeId } = await createAndControlOrganisme({ uai, siret });

  //     assert.deepEqual(createdOrganismeId, foundOrganismeId);
  //   });

  //   it("return existant organisme id if uai-siret couple existant in db after fiabilisation mapping", async () => {
  //     const uai = "0040533H";
  //     const siret = "19040492100016";

  //     // Création d'un organisme clean avec uai - siret présent dans le mapping de fiabilisation
  //     const randomOrganisme = createRandomOrganisme({ uai, siret });
  //     const { _id: createdOrganismeId } = await createOrganisme(randomOrganisme);

  //     // Création & control d'un organisme avec le même uai mais un siret non fiabilisé
  //     const siretNotClean = "19050006600039";
  //     const { _id: foundOrganismeId } = await createAndControlOrganisme({ uai, siret: siretNotClean });

  //     assert.deepEqual(createdOrganismeId, foundOrganismeId);
  //   });

  //   it("return existant organisme id if uai-siret couple existant in db after fiabilisation mapping", async () => {
  //     const uai = "0040533H";
  //     const siret = "19040492100016";

  //     // Création d'un organisme clean avec uai - siret présent dans le mapping de fiabilisation
  //     const randomOrganisme = createRandomOrganisme({ uai, siret });
  //     const { _id: createdOrganismeId } = await createOrganisme(randomOrganisme);

  //     // Création & control d'un organisme avec le même uai mais un siret non fiabilisé
  //     const siretNotClean = "19050006600039";
  //     const { _id: foundOrganismeId } = await createAndControlOrganisme({ uai, siret: siretNotClean });

  //     assert.deepEqual(createdOrganismeId, foundOrganismeId);
  //   });

  //   it("return existant organisme id if uai-siret couple existant in db after fiabilisation mapping with siret empty in input", async () => {
  //     const uai = "0912364A";
  //     const siret = "20007515800010";

  //     // Création d'un organisme clean avec uai - siret présent dans le mapping de fiabilisation
  //     const randomOrganisme = createRandomOrganisme({ uai, siret });
  //     const { _id: createdOrganismeId } = await createOrganisme(randomOrganisme);

  //     // Création & control d'un organisme avec le même uai mais un siret vide
  //     const { _id: foundOrganismeId } = await createAndControlOrganisme({ uai, siret: null });

  //     assert.deepEqual(createdOrganismeId, foundOrganismeId);
  //   });

  //   it("throws error if uai existant in db with a different siret", async () => {
  //     const uai = "0011073L";
  //     const siret = "77933737700021";

  //     const randomOrganisme = createRandomOrganisme({ uai, siret });
  //     await createOrganisme(randomOrganisme);

  //     await assert.rejects(() => createAndControlOrganisme({ uai, siret: "20007515800010" }));
  //   });

  //   it("throws error if siret existant in db with a different uai", async () => {
  //     const uai = "0011073L";
  //     const siret = "77933737700021";

  //     const randomOrganisme = createRandomOrganisme({ uai, siret });
  //     await createOrganisme(randomOrganisme);

  //     await assert.rejects(() => createAndControlOrganisme({ uai: "0912364A", siret }));
  //   });

  //   it("throws error if uai-siret not present in ACCES", async () => {
  //     // TODO Faire un createAndControlOrganisme avec un couple uai - siret non présent en db et non présent dans ACCES
  //   });

  //   it("return a created organisme id if uai-siret couple existant in base ACCES and not in db", async () => {
  //     // TODO Faire un createAndControlOrganisme avec un couple uai - siret non présent en db et présent dans ACCES
  //   });
  // });
});
