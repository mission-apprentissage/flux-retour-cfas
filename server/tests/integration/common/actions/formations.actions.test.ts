import { strict as assert } from "assert";

import { omit } from "lodash-es";
import { ObjectId } from "mongodb";
import nock from "nock";
import { vi, it, expect, describe } from "vitest";

import {
  createFormation,
  getFormationWithCfd,
  getNiveauFormationFromLibelle,
  getNiveauFormationLibelle,
} from "@/common/actions/formations.actions";
import { apiAlternanceClient } from "@/common/apis/apiAlternance";
import { formationsDb } from "@/common/model/collections";
import { apiAlternanceCertifFixture } from "@tests/data/apiTablesDeCorrespondances";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";

vi.mock("@/common/apis/apiAlternance", () => ({
  apiAlternanceClient: {
    certification: {
      index: vi.fn(),
    },
  },
}));

describe("Tests des actions Formations", () => {
  useNock();
  useMongo();

  describe("getFormationWithCfd", () => {
    it("returns null when formation does not exist", async () => {
      const found = await getFormationWithCfd("blabla");
      assert.equal(found, null);
    });

    it("returns formation with given cfd when it exists", async () => {
      // create a formation
      const cfd = "2502000D";
      const { insertedId } = await formationsDb().insertOne({
        _id: new ObjectId(),
        cfd,
      });

      const found = await getFormationWithCfd(cfd);
      assert.equal(found?._id.equals(insertedId), true);
    });
  });

  describe("createFormation", () => {
    it("throws when given cfd is invalid", async () => {
      await expect(createFormation({ cfd: "invalid" })).rejects.toThrowError("Invalid CFD");
    });

    it("throws when formation with given cfd already exists", async () => {
      const cfd = "2502000D";
      // create formation in db
      await formationsDb().insertOne({
        _id: new ObjectId(),
        cfd,
      });

      await expect(createFormation({ cfd })).rejects.toThrowError("A Formation with CFD 2502000D already exists");
    });

    it("returns created formation when cfd was found in API Alternance", async () => {
      vi.mocked(apiAlternanceClient.certification.index).mockResolvedValueOnce(apiAlternanceCertifFixture);

      const cfd = "13534005";
      const insertedId = await createFormation({ cfd });
      const created = await formationsDb().findOne({ _id: insertedId });

      assert.deepEqual(omit(created, ["created_at", "_id"]), {
        cfd,
        cfd_start_date: apiAlternanceCertifFixture[0].periode_validite.cfd.ouverture,
        cfd_end_date: apiAlternanceCertifFixture[0].periode_validite.cfd.fermeture,
        rncps: ["RNCP34945"],
        libelle: "MANAGER HYGIENE SECURITE ENVIRONNEMENT HCE (CNAM)",
        niveau: "7",
        niveau_libelle: "7 (Master, titre ingénieur...)",
        metiers: [], // previously dataForGetMetiersByCfd.metiers, // using Call LBA Api // TODO Removed not useful now
        updated_at: null,
        annee: null,
        duree: null,
      });
    });

    it("returns created formation when cfd was found in Tables de Correspondances without rncps", async () => {
      nock.cleanAll();
      (apiAlternanceClient.certification.index as any).mockResolvedValueOnce(
        apiAlternanceCertifFixture.filter((certif) => certif.identifiant.rncp === null)
      );

      const cfd = "13534005";
      const insertedId = await createFormation({ cfd });
      const created = await formationsDb().findOne({ _id: insertedId });

      assert.deepEqual(omit(created, ["created_at", "_id"]), {
        cfd,
        cfd_start_date: apiAlternanceCertifFixture[0].periode_validite.cfd.ouverture,
        cfd_end_date: apiAlternanceCertifFixture[0].periode_validite.cfd.fermeture,
        rncps: [],
        libelle: "MANAGER HYGIENE SECURITE ENVIRONNEMENT HCE (CNAM)",
        niveau: "7",
        niveau_libelle: "7 (Master, titre ingénieur...)",
        metiers: [], // previously dataForGetMetiersByCfd.metiers, // using Call LBA Api // TODO Removed not useful now
        updated_at: null,
        annee: null,
        duree: null,
      });
    });
  });

  describe("getNiveauFormationFromLibelle", () => {
    it("should return null when passed null", () => {
      assert.equal(getNiveauFormationFromLibelle(null), null);
    });

    it("should return null when passed empty string", () => {
      assert.equal(getNiveauFormationFromLibelle(null), null);
    });

    it("should return null when passed empty undefined", () => {
      assert.equal(getNiveauFormationFromLibelle(undefined), null);
    });

    it("should return null when it cannot parse number from passed string", () => {
      assert.equal(getNiveauFormationFromLibelle("BTS, DUT..."), null);
    });

    it("should return niveau when passed a number as string", () => {
      assert.equal(getNiveauFormationFromLibelle("0"), "0");
    });

    it("should return parsed niveau when passed a string", () => {
      assert.equal(getNiveauFormationFromLibelle("3 (BTS, DUT...)"), "3");
    });
  });

  describe("getNiveauFormationFromLibelle", () => {
    it("should return null when passed null", () => {
      assert.equal(getNiveauFormationLibelle(null), null);
    });

    it("should return null when passed empty undefined", () => {
      assert.equal(getNiveauFormationLibelle(undefined), null);
    });

    it.each([
      ["1", null],
      ["2", null],
      ["3", "3 (CAP...)"],
      ["4", "4 (BAC...)"],
      ["5", "5 (BTS, DEUST...)"],
      ["6", "6 (Licence, BUT...)"],
      ["7", "7 (Master, titre ingénieur...)"],
      ["8", "8 (Doctorat...)"],
    ])("should return %s when passed %s", (niveau, expected) => {
      assert.equal(getNiveauFormationLibelle(niveau), expected);
    });
  });
});
