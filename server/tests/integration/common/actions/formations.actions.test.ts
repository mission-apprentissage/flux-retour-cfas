import { strict as assert } from "assert";

import omit from "lodash.omit";
import { ObjectId } from "mongodb";
import nock from "nock";

import {
  createFormation,
  getFormationWithCfd,
  getNiveauFormationFromLibelle,
} from "@/common/actions/formations.actions";
import { formationsDb } from "@/common/model/collections";
import { dataForGetCfdInfo } from "@tests/data/apiTablesDeCorrespondances";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";
import { nockGetCfdInfo } from "@tests/utils/nockApis/nock-tablesCorrespondances";

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

    it("throws when formation data is not valid", async () => {
      nock.cleanAll();
      nockGetCfdInfo(() => ({
        ...dataForGetCfdInfo.withIntituleLong,
        date_ouverture: "invalid",
      }));

      const cfd = "25020000D";
      await expect(createFormation({ cfd })).rejects.toThrowError();
    });

    it("returns created formation when cfd was found in Tables de Correspondances with intitule_long", async () => {
      nockGetCfdInfo(() => dataForGetCfdInfo.withIntituleLong);

      const cfd = "13534005";
      const insertedId = await createFormation({ cfd });
      const created = await formationsDb().findOne({ _id: insertedId });

      assert.deepEqual(omit(created, ["created_at", "_id"]), {
        cfd,
        cfd_start_date: new Date(dataForGetCfdInfo.withIntituleLong.date_ouverture),
        cfd_end_date: new Date(dataForGetCfdInfo.withIntituleLong.date_fermeture),
        rncps: ["RNCP34945"],
        libelle: "HYGIENISTE DU TRAVAIL ET DE L'ENVIRONNEMENT (CNAM)",
        niveau: "7",
        niveau_libelle: "7 (Master, titre ingénieur...)",
        metiers: [], // previously dataForGetMetiersByCfd.metiers, // using Call LBA Api // TODO Removed not useful now
        updated_at: null,
        annee: null,
        duree: null,
      });
    });

    it("returns created formation when cfd was found in Tables de Correspondances without intitule_long (no rncps found)", async () => {
      nock.cleanAll();
      nockGetCfdInfo(() => {
        return dataForGetCfdInfo.withoutIntituleLong;
      });

      const cfd = "13534005";
      const insertedId = await createFormation({ cfd });
      const created = await formationsDb().findOne({ _id: insertedId });

      assert.deepEqual(omit(created, ["created_at", "_id"]), {
        cfd,
        cfd_start_date: new Date(dataForGetCfdInfo.withIntituleLong.date_ouverture),
        cfd_end_date: new Date(dataForGetCfdInfo.withIntituleLong.date_fermeture),
        rncps: [],
        libelle: "",
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
});
