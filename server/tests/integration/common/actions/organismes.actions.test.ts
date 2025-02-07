import { strict as assert } from "assert";

import { subDays } from "date-fns";
import { ObjectId } from "mongodb";
import { NATURE_ORGANISME_DE_FORMATION } from "shared";
import { IOrganisme } from "shared/models/data/organismes.model";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { it, expect, describe, beforeEach } from "vitest";

import {
  findOrganismeById,
  updateOrganismeTransmission,
  updateOrganisme,
} from "@/common/actions/organismes/organismes.actions";
import { organismesDb } from "@/common/model/collections";
import { createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";

export const sampleOrganismeWithoutUAIOutput: IOrganisme = generateOrganismeFixture({
  siret: "41461021200014",
  nom: "ETABLISSEMENT TEST",
  nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
  adresse: {
    departement: "01",
    region: "84",
    academie: "10",
  },
  fiabilisation_statut: "NON_FIABLE",
  ferme: false,
  qualiopi: false,
});

export const sampleOrganismeWithUAIOutput: IOrganisme = generateOrganismeFixture({
  ...sampleOrganismeWithoutUAIOutput,
  uai: "0693400W",
  _id: new ObjectId(),
  created_at: new Date(),
  updated_at: new Date(),
});

useMongo();

beforeEach(async () => {
  await organismesDb().insertMany([sampleOrganismeWithoutUAIOutput, sampleOrganismeWithUAIOutput]);
});

describe("Test des actions Organismes", () => {
  describe("updateOrganisme", () => {
    it("throws when given data is null", async () => {
      // @ts-expect-error
      await assert.rejects(() => updateOrganisme("id", null));
    });

    it("throws when given id is null", async () => {
      const randomOrganisme = createRandomOrganisme();
      // @ts-expect-error
      await assert.rejects(() => updateOrganisme(null, randomOrganisme));
    });

    it("throws when given id is not existant", async () => {
      const randomOrganisme = createRandomOrganisme();
      await assert.rejects(() => updateOrganisme(new ObjectId(), randomOrganisme));
    });

    it("returns updated organisme when id valid and no API Calls", async () => {
      const updated = await updateOrganisme(sampleOrganismeWithoutUAIOutput._id, {
        ...sampleOrganismeWithoutUAIOutput,
        nom: "UPDATED",
      });

      expect(updated).toStrictEqual({
        ...sampleOrganismeWithoutUAIOutput,
        nom: "UPDATED",
        _id: expect.anything(),
        created_at: sampleOrganismeWithoutUAIOutput.created_at,
        updated_at: expect.anything(),
      });
    });
  });

  describe("updateOrganismeTransmission", () => {
    it("mets à jour les dates first_transmission_date et last_transmission_date pour un organisme sans first_transmission_date", async () => {
      // MAJ de l'organisme et vérification de l'ajout de first_transmission_date
      await updateOrganismeTransmission(sampleOrganismeWithoutUAIOutput);
      const updated = await findOrganismeById(sampleOrganismeWithoutUAIOutput._id);
      assert.notDeepStrictEqual(updated?.first_transmission_date, undefined);
      assert.notDeepStrictEqual(updated?.last_transmission_date, undefined);
    });

    it("mets à jour la date last_transmission_date pour un organisme avec first_transmission_date", async () => {
      const first_transmission_date = subDays(new Date(), 10);

      await organismesDb().updateOne(
        { _id: sampleOrganismeWithoutUAIOutput._id },
        { $set: { first_transmission_date } }
      );

      // MAJ de l'organisme et vérification de l'ajout de last_transmission_date
      await updateOrganismeTransmission({
        _id: sampleOrganismeWithoutUAIOutput._id,
        first_transmission_date,
      });
      const updated = await findOrganismeById(sampleOrganismeWithoutUAIOutput._id);
      assert.deepStrictEqual(updated?.first_transmission_date, first_transmission_date);
      assert.notDeepStrictEqual(updated?.last_transmission_date, undefined);
    });

    it("mets à jour la source et l'api_version pour un organisme", async () => {
      const first_transmission_date = subDays(new Date(), 10);
      const testSource = "TEST_ERP";
      const testApiVersion = "v18";

      await organismesDb().updateOne(
        { _id: sampleOrganismeWithoutUAIOutput._id },
        { $set: { first_transmission_date } }
      );

      // MAJ de l'organisme et vérification de l'ajout de la source et api_key
      await updateOrganismeTransmission(
        {
          _id: sampleOrganismeWithoutUAIOutput._id,
          first_transmission_date,
        },
        testSource,
        testApiVersion
      );

      const updated = await findOrganismeById(sampleOrganismeWithoutUAIOutput._id);

      assert.deepStrictEqual(updated?.first_transmission_date, first_transmission_date);
      assert.deepStrictEqual(updated?.erps, [testSource]);
      assert.deepStrictEqual(updated?.api_version, testApiVersion);
      assert.notDeepStrictEqual(updated?.last_transmission_date, undefined);
    });
  });
});
