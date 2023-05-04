import { strict as assert } from "assert";

import omit from "lodash.omit";
import { ObjectId } from "mongodb";
import nock from "nock";

import {
  createFormation,
  existsFormation,
  findFormationById,
  getFormationWithCfd,
  getNiveauFormationFromLibelle,
  searchFormations,
} from "@/common/actions/formations.actions";
import { Formation } from "@/common/model/@types/Formation";
import { Organisme } from "@/common/model/@types/Organisme";
import { formationsDb, effectifsDb, organismesDb } from "@/common/model/collections";
import { dataForGetCfdInfo } from "@tests/data/apiTablesDeCorrespondances";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { nockGetMetiersByCfd } from "@tests/utils/nockApis/nock-Lba";
import { nockGetCfdInfo } from "@tests/utils/nockApis/nock-tablesCorrespondances";
import { id } from "@tests/utils/testUtils";

const organisme: Organisme = {
  _id: new ObjectId(id(1)),
  ...createRandomOrganisme({ siret: "19040492100016" }),
};

const organisme2: Organisme = {
  _id: new ObjectId(id(2)),
  ...createRandomOrganisme({ siret: "41461021200014" }),
};

describe("Tests des actions Formations", () => {
  describe("existsFormation", () => {
    it("returns false when formation with formations collection is empty", async () => {
      const shouldBeFalse = await existsFormation("blabla");
      assert.equal(shouldBeFalse, false);
    });

    it("returns false when formation with given cfd does not exist", async () => {
      // create a formation
      await formationsDb().insertOne({ cfd: "0123456G" });
      assert.equal(await existsFormation("blabla"), false);
    });

    it("returns true when formation with given cfd exists", async () => {
      // create a formation
      const cfd = "0123456G";
      await formationsDb().insertOne({ cfd });
      assert.equal(await existsFormation(cfd), true);
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
      nockGetMetiersByCfd();
      nockGetCfdInfo(() => {
        return dataForGetCfdInfo.withoutIntituleLong;
      });

      const cfd = "13534005";
      const insertedId = await createFormation({ cfd });
      const created = await findFormationById(insertedId);

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
      try {
        await organismesDb().insertOne(organisme);
        await organismesDb().insertOne(organisme2);

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
                  formation: { cfd },
                  organisme: organisme2,
                })
              ),
            ]);
          })
        );
      } catch (e) {
        console.log(JSON.stringify(e, null, 2));
        throw e;
      }
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
      it(`returns results ${caseDescription} (search ${searchTerm})`, async () => {
        const results = await searchFormations({ searchTerm });

        const mapCfd = (result) => result.cfd;
        assert.deepEqual(results.map(mapCfd), expectedResult.map(mapCfd));
      });
    });

    it("returns results matching libelle and etablissement_num_region", async () => {
      const searchTerm = "decoration";

      await effectifsDb().insertOne(
        createSampleEffectif({
          formation: { cfd: formationsSeed[2].cfd },
          organisme,
        })
      );

      const results = await searchFormations({ searchTerm, etablissement_num_region: organisme.adresse?.region });

      assert.equal(results.length, 1);
      assert.ok(results[0].cfd, formationsSeed[2].cfd);
    });

    it("returns results matching libelle and etablissement_num_departement", async () => {
      const searchTerm = "decoration";

      // const { insertedId: organisme_id } = await organismesDb().insertOne(organisme);
      await effectifsDb().insertOne(
        createSampleEffectif({
          formation: {
            cfd: formationsSeed[2].cfd,
          },
          organisme,
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

      // const { insertedId: organisme_id } = await organismesDb().insertOne(organisme);
      await effectifsDb().insertOne(
        createSampleEffectif({
          formation: {
            cfd: formationsSeed[2].cfd,
          },
          organisme,
        })
      );

      const results = await searchFormations({ searchTerm, etablissement_reseaux: organisme.reseaux?.[0] });

      assert.equal(results.length, 1);
      assert.ok(results[0].cfd, formationsSeed[2].cfd);
    });

    it("returns results matching libelle and uai_etablissement", async () => {
      const searchTerm = "decoration";

      // const { insertedId: organisme_id } = await organismesDb().insertOne(organisme);
      await effectifsDb().insertOne(
        createSampleEffectif({
          formation: {
            cfd: formationsSeed[2].cfd,
          },
          organisme,
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
