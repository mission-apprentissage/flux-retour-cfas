import { strict as assert } from "assert";
import { createRandomOrganisme } from "../../../data/randomizedSample.js";
import pick from "lodash.pick";
import {
  createOrganisme,
  findOrganismeById,
  updateOrganisme,
} from "../../../../src/common/actions/organismes.actions.js";
import { buildTokenizedString } from "../../../../src/common/utils/buildTokenizedString.js";

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
});
