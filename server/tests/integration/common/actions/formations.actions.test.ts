import { strict as assert } from "assert";
import omit from "lodash.omit";
import nock from "nock";

import { nockGetCfdInfo } from "../../../utils/nockApis/nock-tablesCorrespondances.js";
import { dataForGetCfdInfo } from "../../../data/apiTablesDeCorrespondances.js";
import { nockGetMetiersByCfd } from "../../../utils/nockApis/nock-Lba.js";
import { formationsDb, effectifsDb, organismesDb } from "../../../../src/common/model/collections.js";
import {
  createFormation,
  existsFormation,
  findFormationById,
  getFormationWithCfd,
  getNiveauFormationFromLibelle,
  searchFormations,
} from "../../../../src/common/actions/formations.actions.js";
import { createSampleEffectif } from "../../../data/randomizedSample.js";
import { NATURE_ORGANISME_DE_FORMATION } from "../../../../src/common/constants/natureOrganismeConstants.js";
import { Organisme } from "../../../../src/common/model/@types/Organisme.js";
import { Formation } from "../../../../src/common/model/@types/Formation.js";

describe("Tests des actions Formations", () => {
  describe("existsFormation", () => {
    it("returns false when formation with formations collection is empty", async () => {
      const shouldBeFalse = await existsFormation("blabla");
      assert.equal(shouldBeFalse, false);
    });

    it("returns false when formation with given cfd does not exist", async () => {
      // create a formation
      await formationsDb().insertOne({ cfd: "0123456G" });

      const shouldBeFalse = await existsFormation("blabla");
      assert.equal(shouldBeFalse, false);
    });

    it("returns true when formation with given cfd exists", async () => {
      // create a formation
      const cfd = "0123456G";
      await formationsDb().insertOne({ cfd });

      const shouldBeTrue = await existsFormation(cfd);
      assert.equal(shouldBeTrue, true);
    });
  });

  describe("getFormationWithCfd", () => {
    it("returns null when formation does not exist", async () => {
      const found = await getFormationWithCfd("blabla");
      assert.equal(found, null);
    });

    it("returns formation with given cfd when it exists", async () => {
      // create a formation
      const cfd = "2502000D";
      const { insertedId } = await formationsDb().insertOne({ cfd });

      const found = (await getFormationWithCfd(cfd)) as Formation;
      assert.equal(insertedId.equals(found._id), true);
    });
  });

  describe("createFormation", () => {
    it("throws when given cfd is invalid", async () => {
      await assert.rejects(() => createFormation({ cfd: "invalid" }), new Error("Invalid CFD"));
    });

    it("throws when formation with given cfd already exists", async () => {
      const cfd = "2502000D";
      // create formation in db
      await formationsDb().insertOne({ cfd });

      await assert.rejects(() => createFormation({ cfd }), new Error("A Formation with CFD 2502000D already exists"));
    });

    it("throws when formation data is not valid", async () => {
      nock.cleanAll();
      nockGetCfdInfo(() => ({
        ...dataForGetCfdInfo.withIntituleLong,
        date_ouverture: "invalid",
      }));

      const cfd = "2502000D";
      await assert.rejects(() => createFormation({ cfd }));
    });

    it("returns created formation when cfd was found in Tables de Correspondances with intitule_long", async () => {
      nockGetCfdInfo(() => dataForGetCfdInfo.withIntituleLong);

      const cfd = "13534005";
      const insertedId = await createFormation({ cfd });
      const created = await findFormationById(insertedId);

      assert.deepEqual(omit(created, ["created_at", "_id", "tokenized_libelle"]), {
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
      nockGetMetiersByCfd();
      nockGetCfdInfo(() => {
        return dataForGetCfdInfo.withoutIntituleLong;
      });

      const cfd = "13534005";
      const insertedId = await createFormation({ cfd });
      const created = await findFormationById(insertedId);

      assert.deepEqual(omit(created, ["created_at", "_id", "tokenized_libelle"]), {
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

  describe("searchFormations", () => {
    const formationsSeed = [
      { cfd: "01022103", libelle: "EMPLOYE TRAITEUR (CAP)" },
      { cfd: "01022104", libelle: "ZINGUERIE (MC NIVEAU V)" },
      { cfd: "01022999", libelle: "Peinture décoration extérieure (MC NIVEAU V)" },
      { cfd: "01022111", libelle: "PEINTURE DECORATION (MC NIVEAU IV)" },
      { cfd: "01022551", libelle: "PEINTURE dEcOrAtIoN (MC NIVEAU IV)" },
      { cfd: "01026651", libelle: "PEINTURE DECORÀTION (MC NIVEAU IV)" },
    ];

    beforeEach(async () => {
      nock.cleanAll();
      nockGetCfdInfo((cfd) =>
        formationsSeed
          .filter((f) => f.cfd === cfd)
          .map((o) => ({
            cfd: o.cfd,
            intitule_long: o.libelle,
            intitule_court: o.libelle,
          }))
          .pop()
      );

      await Promise.all(
        formationsSeed.map(async ({ cfd }) => {
          await Promise.all([
            createFormation({ cfd }),
            effectifsDb().insertOne(
              createSampleEffectif({
                formation: {
                  cfd: cfd,
                },
              })
            ),
          ]);
        })
      );
    });

    const validCases = [
      {
        caseDescription: "when searchTerm does not anything",
        searchTerm: "nope",
        expectedResult: [],
      },
      {
        caseDescription: "when searchTerm matches cfd perfectly",
        searchTerm: formationsSeed[0].cfd,
        expectedResult: [formationsSeed[0]],
      },
      {
        caseDescription: "when searchTerm matches cfd partially",
        searchTerm: formationsSeed[0].cfd.slice(0, 6),
        expectedResult: [formationsSeed[0], formationsSeed[3], formationsSeed[1]],
      },
      {
        caseDescription: "when searchTerm matches libelle perfectly",
        searchTerm: formationsSeed[0].libelle,
        expectedResult: [formationsSeed[0]],
      },
      {
        caseDescription: "when searchTerm matches libelle partially",
        searchTerm: formationsSeed[0].libelle.slice(0, 5),
        expectedResult: [formationsSeed[0]],
      },
      {
        caseDescription: "when searchTerm matches a word in libelle",
        searchTerm: "ZINGUERIE",
        expectedResult: [formationsSeed[1]],
      },
      {
        caseDescription: "when searchTerm matches a word partially in libelle",
        searchTerm: "ZINGU",
        expectedResult: [formationsSeed[1]],
      },
      {
        caseDescription: "when searchTerm matches a word with different case in libelle",
        searchTerm: "zingu",
        expectedResult: [formationsSeed[1]],
      },
      {
        caseDescription: "when searchTerm matches a word with different diacritics in libelle",
        searchTerm: "zingùéri",
        expectedResult: [formationsSeed[1]],
      },
    ];

    validCases.forEach(({ searchTerm, caseDescription, expectedResult }) => {
      it(`returns results ${caseDescription}`, async () => {
        const results = await searchFormations({ searchTerm });

        const mapCfd = (result) => result.cfd;
        assert.deepEqual(results.map(mapCfd), expectedResult.map(mapCfd));
      });
    });

    it("sends a 200 HTTP response with results matching different cases and diacritics in libelle", async () => {
      const searchTerm = "decoratio";

      const results = await searchFormations({ searchTerm });

      assert.equal(results.length, 4);
      assert.ok(results.find((formation) => formation.cfd === formationsSeed[2].cfd));
      assert.ok(results.find((formation) => formation.cfd === formationsSeed[3].cfd));
      assert.ok(results.find((formation) => formation.cfd === formationsSeed[4].cfd));
      assert.ok(results.find((formation) => formation.cfd === formationsSeed[5].cfd));
    });

    const organisme: Organisme = {
      uai: "0040533H",
      siret: "19040492100016",
      nom: "LYCEE POLYVALENT LES ISCLES",
      nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
      adresse: {
        academie: "2",
        code_insee: "04112",
        code_postal: "04100",
        commune: "MANOSQUE",
        complete: "LYCEE POLYVALENT LES ISCLES\r\n" + "116 AV REGIS RYCKEBUSH\r\n" + "04100 MANOSQUE\r\n" + "FRANCE",
        departement: "04",
        numero: 116,
        region: "93",
        voie: "AVREGIS RYCKEBUSH",
      },
      reseaux: ["AGRI"],
    };
    it("returns results matching libelle and etablissement_num_region", async () => {
      const searchTerm = "decoration";

      const { insertedId: organisme_id } = await organismesDb().insertOne(organisme);
      await effectifsDb().insertOne(
        createSampleEffectif({
          formation: {
            cfd: formationsSeed[2].cfd,
          },
          organisme_id,
        })
      );

      const results = await searchFormations({ searchTerm, etablissement_num_region: organisme.adresse?.region });

      assert.equal(results.length, 1);
      assert.ok(results[0].cfd, formationsSeed[2].cfd);
    });

    it("returns results matching libelle and etablissement_num_departement", async () => {
      const searchTerm = "decoration";

      const { insertedId: organisme_id } = await organismesDb().insertOne(organisme);
      await effectifsDb().insertOne(
        createSampleEffectif({
          formation: {
            cfd: formationsSeed[2].cfd,
          },
          organisme_id,
        })
      );

      const results = await searchFormations({
        searchTerm,
        etablissement_num_departement: organisme.adresse?.departement,
      });

      assert.equal(results.length, 1);
      assert.ok(results[0].cfd, formationsSeed[2].cfd);
    });

    it("returns results matching libelle and etablissement_reseau", async () => {
      const searchTerm = "decoration";

      const { insertedId: organisme_id } = await organismesDb().insertOne(organisme);
      await effectifsDb().insertOne(
        createSampleEffectif({
          formation: {
            cfd: formationsSeed[2].cfd,
          },
          organisme_id,
        })
      );

      const results = await searchFormations({ searchTerm, etablissement_reseaux: organisme.reseaux?.[0] });

      assert.equal(results.length, 1);
      assert.ok(results[0].cfd, formationsSeed[2].cfd);
    });

    it("returns results matching libelle and uai_etablissement", async () => {
      const searchTerm = "decoration";

      const { insertedId: organisme_id } = await organismesDb().insertOne(organisme);
      await effectifsDb().insertOne(
        createSampleEffectif({
          formation: {
            cfd: formationsSeed[2].cfd,
          },
          organisme_id,
        })
      );

      const results = await searchFormations({ searchTerm, uai_etablissement: organisme.uai });

      assert.equal(results.length, 1);
      assert.ok(results[0].cfd, formationsSeed[2].cfd);
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
