const assert = require("assert").strict;
// eslint-disable-next-line node/no-unpublished-require
const nock = require("nock");
const omit = require("lodash.omit");
const integrationTests = require("../../../utils/integrationTests");
const { dataForGetCfdInfo } = require("../../../data/apiTablesDeCorrespondances");
const formationsComponent = require("../../../../src/common/components/formations");
const config = require("../../../../config");
const { Formation } = require("../../../../src/common/model");

integrationTests(__filename, () => {
  describe("existsFormation", () => {
    const { existsFormation } = formationsComponent();

    it("returns false when formation with formations collection is empty", async () => {
      const shouldBeFalse = await existsFormation("blabla");
      assert.equal(shouldBeFalse, false);
    });

    it("returns false when formation with given cfd does not exist", async () => {
      // create a formation
      const newFormation = new Formation({ cfd: "0123456G" });
      await newFormation.save();

      const shouldBeFalse = await existsFormation("blabla");
      assert.equal(shouldBeFalse, false);
    });

    it("returns true when formation with given cfd exists", async () => {
      // create a formation
      const newFormation = new Formation({ cfd: "0123456G" });
      await newFormation.save();

      const shouldBeTrue = await existsFormation(newFormation.cfd);
      assert.equal(shouldBeTrue, true);
    });
  });

  describe("getFormationWithCfd", () => {
    const { getFormationWithCfd } = formationsComponent();

    it("returns null when formation does not exist", async () => {
      const found = await getFormationWithCfd("blabla");
      assert.equal(found, null);
    });

    it("returns formation with given cfd when it exists", async () => {
      // create a formation
      const cfd = "2502000D";
      const newFormation = new Formation({ cfd });
      const createdFormation = await newFormation.save();

      const found = await getFormationWithCfd(cfd);
      assert.deepEqual(createdFormation.toJSON(), found);
    });
  });

  describe("createFormation", () => {
    const { createFormation } = formationsComponent();

    it("throws when given cfd is invalid", async () => {
      try {
        await createFormation("invalid");
      } catch (err) {
        assert.notEqual(err, undefined);
      }
    });

    it("throws when formation with given cfd already exists", async () => {
      const cfd = "2502000D";
      // create formation in db
      const formation = new Formation({ cfd });
      await formation.save();

      try {
        await createFormation(cfd);
      } catch (err) {
        assert.notEqual(err, undefined);
      }
    });

    it("returns null when formation could not be found in Tables de Correspondaces", async () => {
      nock(config.tablesCorrespondances.endpoint).post("/cfd").reply(200, {
        result: null,
      });
      const cfd = "13534005";
      const formation = await createFormation(cfd);
      assert.equal(formation, null);
    });

    it("returns created formation when cfd was found in Tables de Correspondaces with intitule_long", async () => {
      nock(config.tablesCorrespondances.endpoint).post("/cfd").reply(200, {
        result: dataForGetCfdInfo.withIntituleLong,
      });

      const cfd = "13534005";
      const created = await createFormation(cfd);
      assert.deepEqual(omit(created, ["created_at", "_id"]), {
        cfd,
        libelle: "HYGIENISTE DU TRAVAIL ET DE L'ENVIRONNEMENT (CNAM)",
        updated_at: null,
      });
    });

    it("returns created formation when cfd was found in Tables de Correspondaces without intitule_long", async () => {
      nock(config.tablesCorrespondances.endpoint).post("/cfd").reply(200, {
        result: dataForGetCfdInfo.withoutIntituleLong,
      });

      const cfd = "13534005";
      const created = await createFormation(cfd);
      assert.deepEqual(omit(created, ["created_at", "_id"]), {
        cfd,
        libelle: "",
        updated_at: null,
      });
    });
  });
});
