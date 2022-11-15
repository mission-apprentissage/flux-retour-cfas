import { strict as assert } from "assert";
import cfasComponent from "../../../../src/common/components/cfas.js";
import { createRandomDossierApprenant } from "../../../data/randomizedSample.js";
import { addDays } from "date-fns";
import { Cfa } from "../../../../src/common/factory/cfa.js";
import pick from "lodash.pick";

// eslint-disable-next-line node/no-unpublished-require
import nock from "nock";

import { dataForGetMetiersBySiret } from "../../../data/apiLba.js";
import { nockGetMetiersBySiret } from "../../../utils/nockApis/nock-Lba.js";
import { NATURE_ORGANISME_DE_FORMATION } from "../../../../src/common/domain/organisme-de-formation/nature.js";
import { cfasDb, dossiersApprenantsDb } from "../../../../src/common/model/collections.js";

describe("Components Cfa Test", () => {
  describe("existsCfa", () => {
    const { existsCfa } = cfasComponent();

    it("returns false when cfa with cfa collection is empty", async () => {
      const shouldBeFalse = await existsCfa("blabla");
      assert.equal(shouldBeFalse, false);
    });

    it("returns false when cfa with given uai does not exist", async () => {
      await cfasDb().insertOne({ uai: "0802004U" });

      const shouldBeFalse = await existsCfa("blabla");
      assert.equal(shouldBeFalse, false);
    });

    it("returns true when cfa with given uai exists", async () => {
      const uai = "0802004U";
      await cfasDb().insertOne({ uai });

      const shouldBeTrue = await existsCfa(uai);
      assert.equal(shouldBeTrue, true);
    });
  });

  describe("createCfa", () => {
    const { createCfa } = cfasComponent();

    it("throws when given dossier apprenants is null", async () => {
      try {
        await createCfa(null);
      } catch (err) {
        assert.notEqual(err, undefined);
      }
    });

    it("throws when cfa with given uai already exists", async () => {
      const uai = "0802004U";
      await cfasDb().insertOne({ uai });

      // TODO use assert.rejects
      try {
        await createCfa({ uai_etablissement: uai });
      } catch (err) {
        assert.notEqual(err, undefined);
      }
    });

    it("returns created cfa when dossier apprenant is valid", async () => {
      nock.cleanAll();
      nockGetMetiersBySiret();

      const uai = "0802004A";
      const sirets = ["11111111100023"];

      const { insertedId } = await dossiersApprenantsDb().insertOne({
        uai_etablissement: uai,
        nom_etablissement: "TestCfa",
        etablissement_adresse: "10 rue de la paix 75016 Paris",
        source: "MonErp",
        etablissement_nom_region: "Ma région",
        etablissement_num_region: "17",
        created_at: new Date("2021-06-10T00:00:00.000+0000"),
      });
      const dossierApprenant = await dossiersApprenantsDb().findOne({ _id: insertedId });
      const created = await createCfa(dossierApprenant, sirets);

      assert.deepEqual(
        pick(created, ["uai", "sirets", "nom", "adresse", "erps", "region_nom", "region_num", "metiers"]),
        {
          uai,
          sirets,
          nom: dossierApprenant.nom_etablissement,
          adresse: dossierApprenant.etablissement_adresse,
          region_nom: dossierApprenant.etablissement_nom_region,
          region_num: dossierApprenant.etablissement_num_region,
          metiers: dataForGetMetiersBySiret.metiers,
          erps: [dossierApprenant.source],
        }
      );
      assert.equal(created.first_transmission_date.getTime(), dossierApprenant.created_at.getTime());
      assert.equal(created.nom_tokenized, Cfa.createTokenizedNom(dossierApprenant.nom_etablissement));
      assert.equal(created.private_url !== null, true);
      assert.equal(created.accessToken !== null, true);
      assert.equal(created.created_at !== null, true);
      assert.equal(created.updated_at, null);
    });
  });

  describe("updateCfa", () => {
    const { updateCfa } = cfasComponent();

    it("throws when given dossier apprenants is null", async () => {
      // TODO use assert.rejects
      try {
        await updateCfa("id", null);
      } catch (err) {
        assert.notEqual(err, undefined);
      }
    });

    it("throws when given id is null", async () => {
      const uai = "0802004A";

      const dossierApprenant = {
        uai_etablissement: uai,
        nom_etablissement: "TestCfa",
        etablissement_adresse: "10 rue de la paix 75016 Paris",
        source: "MonErp",
        etablissement_nom_region: "Ma région",
        etablissement_num_region: "17",
      };

      // TODO use assert.rejects
      try {
        await updateCfa(null, dossierApprenant);
      } catch (err) {
        assert.notEqual(err, undefined);
      }
    });

    it("throws when given id is not existant", async () => {
      const uai = "0802004A";
      await cfasDb().insertOne({ uai });

      const dossierApprenant = {
        uai_etablissement: uai,
        nom_etablissement: "TestCfa",
        etablissement_adresse: "10 rue de la paix 75016 Paris",
        source: "MonErp",
        etablissement_nom_region: "Ma région",
        etablissement_num_region: "17",
      };

      // TODO use assert.rejects
      try {
        await updateCfa("random-id", dossierApprenant);
      } catch (err) {
        assert.notEqual(err, undefined);
      }
    });

    it("returns update cfa when id and dossier apprenant are valid", async () => {
      const uai = "0802004A";
      const { insertedId: cfaIdToUpdate } = await cfasDb().insertOne({
        uai,
        nom: "TestCfa",
        adresse: "12 rue de la paix 75016 PARIS",
        sirets: [],
        erps: ["MonErp"],
        region_nom: "Ma région",
        region_num: "17",
      });

      const sirets = ["11111111100023"];

      const dossierApprenant = {
        uai_etablissement: "9902004A",
        nom_etablissement: "TestCfa Update",
        etablissement_adresse: "10 rue de la paix 75016 Paris",
        source: "MonErp2",
        etablissement_nom_region: "Ma 2e région",
        etablissement_num_region: "18",
      };

      await updateCfa(cfaIdToUpdate, dossierApprenant, sirets);
      const updatedCfa = await cfasDb().findOne({ _id: cfaIdToUpdate });

      assert.deepEqual(pick(updatedCfa, ["uai", "sirets", "nom", "adresse", "erps", "region_nom", "region_num"]), {
        uai: dossierApprenant.uai_etablissement,
        sirets,
        nom: dossierApprenant.nom_etablissement,
        adresse: dossierApprenant.etablissement_adresse,
        region_nom: dossierApprenant.etablissement_nom_region,
        region_num: dossierApprenant.etablissement_num_region,
        erps: [dossierApprenant.source],
      });
      assert.equal(updatedCfa.nom_tokenized, Cfa.createTokenizedNom(dossierApprenant.nom_etablissement));
      assert.equal(updatedCfa.created_at !== null, true);
      assert.equal(updatedCfa.updated_at !== null, true);
    });
  });

  describe("updateCfaNature", () => {
    const { updateCfaNature } = cfasComponent();

    it("throws when given nature is invalid", async () => {
      const uai = "0802004A";
      await cfasDb().insertOne({
        uai,
        nom: "TestCfa",
        adresse: "12 rue de la paix 75016 PARIS",
        sirets: [],
        erps: ["MonErp"],
        region_nom: "Ma région",
        region_num: "17",
      });

      await assert.rejects(() => updateCfaNature(uai, { nature: "blabla", natureValidityWarning: true }));
    });

    it("throws when Cfa with given UAI not found in DB", async () => {
      const uai = "0802004A";
      await assert.rejects(() =>
        updateCfaNature(uai, { nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE, natureValidityWarning: true })
      );
    });

    it("updates Cfa with given nature and natureValidityWarning", async () => {
      const uai = "0802004A";
      await cfasDb().insertOne({
        uai,
        nom: "TestCfa",
        adresse: "12 rue de la paix 75016 PARIS",
        sirets: [],
        erps: ["MonErp"],
        region_nom: "Ma région",
        region_num: "17",
      });

      await updateCfaNature(uai, {
        nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR,
        natureValidityWarning: true,
      });

      const updatedCfa = await cfasDb().findOne({ uai });
      assert.equal(updatedCfa.nature, NATURE_ORGANISME_DE_FORMATION.RESPONSABLE_FORMATEUR);
      assert.equal(updatedCfa.nature_validity_warning, true);
    });
  });

  describe("updateCfaReseauxFromUai", () => {
    const { updateCfaReseauxFromUai } = cfasComponent();

    it("throws when Cfa with given UAI not found in DB", async () => {
      const uai = "0802004A";
      await assert.rejects(() => updateCfaReseauxFromUai(uai, []));
    });

    it("updates Cfa with given list of reseaux", async () => {
      const uai = "0802004A";
      await cfasDb().insertOne({
        uai,
        nom: "TestCfa",
        adresse: "12 rue de la paix 75016 PARIS",
        sirets: [],
        erps: ["MonErp"],
        reseaux: ["Reseau1"],
        region_nom: "Ma région",
        region_num: "17",
      });

      const newReseaux = ["Reseau2", "Reseau3"];
      await updateCfaReseauxFromUai(uai, newReseaux);

      const updatedCfa = await cfasDb().findOne({ uai });
      assert.deepEqual(updatedCfa.reseaux, newReseaux);
    });
  });

  describe("searchCfas", () => {
    const { searchCfas } = cfasComponent();

    const cfaSeed = [
      {
        nom: "AFTRAL Amiens",
        uai: "0802004U",
        sirets: ["77554622900037", "77554622900038"],
      },
      {
        nom: "AFTRAL Pau",
        uai: "0642119F",
        sirets: ["77554622900038"],
      },
      {
        nom: "AFTRAL Nice",
        uai: "0061989E",
        sirets: ["77554622900039"],
      },
      {
        nom: "BTP CFA Somme",
        uai: "0801302F",
        sirets: ["77554622900030"],
      },
    ];

    const dossierApprenantSeed = [
      {
        ...createRandomDossierApprenant(),
        uai_etablissement: cfaSeed[0].uai,
        siret_etablissement: cfaSeed[0].sirets[0],
        etablissement_num_departement: "80",
        etablissement_num_region: "01",
        etablissement_reseaux: "AFTRAL",
      },
      {
        ...createRandomDossierApprenant(),
        uai_etablissement: cfaSeed[1].uai,
        siret_etablissement: cfaSeed[1].sirets[1],
        etablissement_num_departement: "64",
        etablissement_num_region: "02",
        etablissement_reseaux: "AFTRAL",
      },
      {
        ...createRandomDossierApprenant(),
        uai_etablissement: cfaSeed[2].uai,
        siret_etablissement: cfaSeed[2].sirets[2],
        etablissement_num_departement: "06",
        etablissement_num_region: "03",
        etablissement_reseaux: "AFTRAL",
      },
      {
        ...createRandomDossierApprenant(),
        uai_etablissement: cfaSeed[3].uai,
        siret_etablissement: cfaSeed[3].sirets[3],
        etablissement_num_departement: "80",
        etablissement_num_region: "01",
        etablissement_reseaux: "BTP",
      },
    ];

    beforeEach(async () => {
      for (let i = 0; i < cfaSeed.length; i++) {
        await cfasDb().insertOne({ ...cfaSeed[i], nom_tokenized: Cfa.createTokenizedNom(cfaSeed[i].nom) });
      }

      for (let i = 0; i < dossierApprenantSeed.length; i++) {
        const dossierApprenant = dossierApprenantSeed[i];
        await dossiersApprenantsDb().insertOne(dossierApprenant);
      }
    });

    it("throws error when no parameter passed", async () => {
      // TODO use assert.rejects
      try {
        await searchCfas();
      } catch (err) {
        assert.ok(err);
      }
    });

    it("returns [] when no CFA found", async () => {
      const cfa = await searchCfas({ searchTerm: "blabla" });
      assert.deepEqual(cfa, []);
    });

    it("returns all cfas when no parameter passed", async () => {
      const cfasFound = await searchCfas({});
      assert.equal(cfasFound.length, cfaSeed.length);
      const allUaiFound = cfasFound.map((cfa) => cfa.uai);
      const allUaiSeed = cfaSeed.map((cfa) => cfa.uai);
      assert.deepEqual(allUaiFound, allUaiSeed);
    });

    it("returns all cfas in a departement when etablissement_num_departement criteria passed", async () => {
      const cfasFound = await searchCfas({ etablissement_num_departement: "80" });

      assert.equal(cfasFound.length, 2);
      const allUaiFound = cfasFound.map((cfa) => cfa.uai);
      const expectedUai = [cfaSeed[3].uai, cfaSeed[0].uai];
      assert.deepEqual(allUaiFound, expectedUai);
    });

    it("returns all cfas in a region when etablissement_num_region criteria passed", async () => {
      const cfasFound = await searchCfas({ etablissement_num_region: "03" });

      assert.equal(cfasFound.length, 1);
      assert.equal(cfasFound[0].uai, cfaSeed[2].uai);
    });

    it("return all cfas in a reseau when etablissement_reseaux criteria passed", async () => {
      const cfasFound = await searchCfas({ etablissement_reseaux: "AFTRAL" });

      assert.equal(cfasFound.length, 3);
      const allUaiFound = cfasFound.map((cfa) => cfa.uai);
      const expectedUai = [cfaSeed[2].uai, cfaSeed[1].uai, cfaSeed[0].uai];
      assert.deepEqual(allUaiFound, expectedUai);
    });

    it("return all cfas in a reseau and departement when etablissement_reseaux and etablissement_num_departement criteria passed", async () => {
      const cfasFound = await searchCfas({ etablissement_reseaux: "AFTRAL", etablissement_num_departement: "80" });

      assert.equal(cfasFound.length, 1);
      assert.equal(cfasFound[0].uai, cfaSeed[0].uai);
    });

    describe("with search term", () => {
      const validsearchTermCases = [
        {
          caseDescription: "when searchTerm matches several nom partially => AFTRAL",
          searchTerm: "AFTRAL",
          expectedResults: [cfaSeed[0], cfaSeed[1], cfaSeed[2]],
        },
        {
          caseDescription: "when searchTerm matches several nom but with different case (aftral)",
          searchTerm: "aftral",
          expectedResults: [cfaSeed[0], cfaSeed[1], cfaSeed[2]],
        },
        {
          caseDescription: "when searchTerm matches one nom (BTP CFA Somme)",
          searchTerm: "BTP CFA Somme",
          expectedResults: [cfaSeed[3]],
        },
        {
          caseDescription: "when searchTerm matches one nom but partially (BTP Somme)",
          searchTerm: "BTP Somme",
          expectedResults: [cfaSeed[3]],
        },
        {
          caseDescription: "when searchTerm matches a word in nom but with different diacritics and case (btp sômme)",
          searchTerm: "btp sômme",
          expectedResults: [cfaSeed[3]],
        },
      ];
      validsearchTermCases.forEach(({ searchTerm, caseDescription, expectedResults }) => {
        it(`returns list of CFA matching ${caseDescription}`, async () => {
          const actualResults = await searchCfas({ searchTerm });
          assert.equal(actualResults.length, expectedResults.length);
          expectedResults.forEach((result) => {
            const foundResult = actualResults.find((cfa) => cfa.uai_etablissement === result.uai_etablissement);
            assert.ok(foundResult);
          });
        });
      });

      it("returns list of CFA whose UAI matches searchTerm", async () => {
        const actual = await searchCfas({ searchTerm: cfaSeed[2].uai });
        const expected = [cfaSeed[2]];
        assert.equal(actual.length, 1);
        assert.deepEqual(actual[0].nom, expected[0].nom);
      });

      it("returns list of CFA whose empty Sirets", async () => {
        const actual = await searchCfas({ searchTerm: "77554622900031" });
        assert.deepEqual(actual, []);
      });

      it("returns list of CFA whose several Sirets matches searchTerm", async () => {
        cfaSeed[0].sirets.forEach(async (result) => {
          await searchCfas({ searchTerm: result }).then((res) => {
            const expected = [cfaSeed[0]];
            assert.equal(res.length, 1);
            assert.deepEqual(res[0].nom, expected[0].nom);
          });
        });
      });

      it("returns list of CFA matching searchTerm AND additional criteria (etablissement_num_departement)", async () => {
        const actual = await searchCfas({ searchTerm: "AFTRAL", etablissement_num_departement: "80" });
        const expected = [cfaSeed[0]];
        assert.equal(actual.length, 1);
        assert.deepEqual(actual[0].nom, expected[0].nom);
      });

      it("returns list of CFA matching searchTerm AND additional filter (etablissement_num_region)", async () => {
        const actual = await searchCfas({ searchTerm: "AFTRAL", etablissement_num_region: "03" });
        const expected = [cfaSeed[2]];
        assert.equal(actual.length, 1);
        assert.deepEqual(actual[0].nom, expected[0].nom);
      });

      it("returns list of CFA matching searchTerm AND additional filter (etablissement_reseaux)", async () => {
        const actual = await searchCfas({ searchTerm: "somme", etablissement_reseaux: "BTP" });
        const expected = [cfaSeed[3]];
        assert.equal(actual.length, 1);
        assert.deepEqual(actual[0].nom, expected[0].nom);
      });
    });
  });

  describe("getCfaFirstTransmissionDateFromUai", () => {
    const { getCfaFirstTransmissionDateFromUai } = cfasComponent();
    const uaiToSearch = "0762290X";
    const firstDate = new Date("2020-08-30T00:00:00.000+0000");
    const dossierApprenantSeed = [
      {
        ...createRandomDossierApprenant(),
        uai_etablissement: uaiToSearch,
        created_at: addDays(firstDate, 2),
      },
      {
        ...createRandomDossierApprenant(),
        uai_etablissement: uaiToSearch,
        created_at: firstDate,
      },
      {
        ...createRandomDossierApprenant(),
        uai_etablissement: uaiToSearch,
        created_at: addDays(firstDate, 3),
      },
      {
        ...createRandomDossierApprenant(),
        uai_etablissement: uaiToSearch,
        created_at: addDays(firstDate, 4),
      },
    ];

    beforeEach(async () => {
      for (let i = 0; i < dossierApprenantSeed.length; i++) {
        const dossierApprenant = dossierApprenantSeed[i];
        await dossiersApprenantsDb().insertOne(dossierApprenant);
      }
    });

    it("returns null when no parameter passed", async () => {
      const firstTransmissionDateFromNoUaiParameter = await getCfaFirstTransmissionDateFromUai();
      assert.deepEqual(firstTransmissionDateFromNoUaiParameter, null);
    });

    it("returns null when bad uai is passed", async () => {
      const firstTransmissionDateFromBadUai = await getCfaFirstTransmissionDateFromUai("00000000");
      assert.deepEqual(firstTransmissionDateFromBadUai, null);
    });

    it("returns first date when good uai is passed", async () => {
      const firstTransmissionDateFromGoodUai = await getCfaFirstTransmissionDateFromUai(uaiToSearch);
      assert.deepEqual(firstTransmissionDateFromGoodUai, firstDate);
    });
  });

  describe("getCfaFirstTransmissionDateFromSiret", () => {
    const { getCfaFirstTransmissionDateFromSiret } = cfasComponent();

    const siretToSearch = "80420010000024";
    const firstDate = new Date("2020-06-10T00:00:00.000+0000");
    const dossierApprenantSeed = [
      {
        ...createRandomDossierApprenant(),
        siret_etablissement: siretToSearch,
        created_at: addDays(firstDate, 2),
      },
      {
        ...createRandomDossierApprenant(),
        siret_etablissement: siretToSearch,
        created_at: addDays(firstDate, 3),
      },
      {
        ...createRandomDossierApprenant(),
        siret_etablissement: siretToSearch,
        created_at: firstDate,
      },
      {
        ...createRandomDossierApprenant(),
        siret_etablissement: siretToSearch,
        created_at: addDays(firstDate, 4),
      },
    ];

    beforeEach(async () => {
      for (let i = 0; i < dossierApprenantSeed.length; i++) {
        const dossierApprenant = dossierApprenantSeed[i];
        await dossiersApprenantsDb().insertOne(dossierApprenant);
      }
    });

    it("returns null when no parameter passed", async () => {
      const firstTransmissionDateFromNoSiretParameter = await getCfaFirstTransmissionDateFromSiret();
      assert.deepEqual(firstTransmissionDateFromNoSiretParameter, null);
    });

    it("returns null when bad siret is passed", async () => {
      const firstTransmissionDateFromBadSiret = await getCfaFirstTransmissionDateFromSiret("00000000000000");
      assert.deepEqual(firstTransmissionDateFromBadSiret, null);
    });

    it("returns first date when good siret is passed", async () => {
      const getCfaFirstTransmissionDateFromGoodSiret = await getCfaFirstTransmissionDateFromSiret(siretToSearch);
      assert.deepEqual(getCfaFirstTransmissionDateFromGoodSiret, firstDate);
    });
  });

  describe("getFromAccessToken", () => {
    const { getFromAccessToken } = cfasComponent();

    it("returns Cfa found with access token", async () => {
      const token = "token";
      const { insertedId } = await cfasDb().insertOne({
        uai: "0762290X",
        sirets: [],
        nom: "hello",
        access_token: "token",
      });
      const cfaFound = await getFromAccessToken(token);
      assert.equal(insertedId.equals(cfaFound._id), true);
    });

    it("returns nothing when cfa not found", async () => {
      const token = "token";
      const cfaFound = await getFromAccessToken(token);
      assert.equal(cfaFound, null);
    });
  });

  describe("getFromUai", () => {
    const { getFromUai } = cfasComponent();

    it("returns CFA found with UAI", async () => {
      const uai = "0802004U";
      const { insertedId } = await cfasDb().insertOne({
        uai,
        sirets: ["40949392900012"],
        nom: "hello",
      });
      const cfaFound = await getFromUai(uai);
      assert.equal(insertedId.equals(cfaFound._id), true);
    });

    it("returns nothing when cfa not found", async () => {
      const uai = "0802004U";
      const cfaFound = await getFromUai(uai);
      assert.equal(cfaFound, null);
    });
  });
});
