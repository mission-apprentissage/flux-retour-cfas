import { strict as assert } from "assert";

import { subDays } from "date-fns";
import { ObjectId } from "mongodb";
import { NATURE_ORGANISME_DE_FORMATION } from "shared";
import { IOrganisme } from "shared/models/data/organismes.model";

import {
  createOrganisme,
  findOrganismeById,
  getOrganismeInfosFromSiret,
  updateOrganismeTransmission,
  updateOrganisme,
  updateOneOrganismeRelatedFormations,
  IOrganismeCreate,
} from "@/common/actions/organismes/organismes.actions";
import { createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";

export const sampleOrganismeWithoutUai: IOrganismeCreate = {
  siret: "41461021200014",
  nom: "ETABLISSEMENT TEST",
  nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
  adresse: {
    departement: "01",
    region: "84",
    academie: "10",
  },
  organismesFormateurs: [],
  organismesResponsables: [],
};

export const sampleOrganismeWithUAI = {
  ...sampleOrganismeWithoutUai,
  uai: "0693400W",
};

const sampleOrganismeWithoutUAIOutput: IOrganisme = {
  ...sampleOrganismeWithoutUai,
  reseaux: [],
  erps: [],
  relatedFormations: [],
  fiabilisation_statut: "INCONNU",
  ferme: false,
  prepa_apprentissage: false,
  qualiopi: false,
  _id: new ObjectId(),
  created_at: new Date(),
  updated_at: new Date(),
};

const sampleOrganismeWithUAIOutput: IOrganisme = {
  ...sampleOrganismeWithoutUAIOutput,
  uai: sampleOrganismeWithUAI.uai,
  _id: new ObjectId(),
  created_at: new Date(),
  updated_at: new Date(),
};

const fieldsAddedByApiCalls = {
  enseigne: sampleOrganismeWithUAI.nom,
  raison_sociale: "CENTR FORMATION TECHNICIENS AGRICOLES",
  adresse: {
    numero: 25,
    voie: "RUEPIERRE NEVEU",
    code_postal: "61600",
    code_insee: "61168",
    commune: "LA FERTE MACE",
    departement: "61",
    region: "28",
    academie: "70",
    complete:
      "CENTR FORMATION TECHNICIENS AGRICOLES CFTA CENTR FORMAT TECHNICIENS AGRICOLES\r\n" +
      "25 RUE PIERRE NEVEU\r\n" +
      "61600 LA FERTE MACE\r\n" +
      "FRANCE",
  },
};

describe("Test des actions Organismes", () => {
  // Construction de l'adresse nockée via API Entreprise pour un fichier de sample

  useNock();
  useMongo();

  describe("createOrganisme", () => {
    it("throws when given organisme is null", async () => {
      try {
        await createOrganisme(null as any);
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

    it("returns created organisme when valid with UAI & SIRET & no API Calls", async () => {
      const { _id } = await createOrganisme(sampleOrganismeWithUAI);
      const created = await findOrganismeById(_id);

      expect(created).toStrictEqual({
        ...sampleOrganismeWithUAIOutput,
        _id: expect.anything(),
        created_at: expect.anything(),
        updated_at: expect.anything(),
      });
    });

    it("returns created organisme when valid with SIRET and no UAI & no API Calls", async () => {
      const { _id } = await createOrganisme(sampleOrganismeWithoutUai);
      const created = await findOrganismeById(_id);

      expect(created).toStrictEqual({
        ...sampleOrganismeWithoutUAIOutput,
        _id: expect.anything(),
        created_at: expect.anything(),
        updated_at: expect.anything(),
      });
    });

    it("returns created organisme when valid with UAI & SIRET & API Calls", async () => {
      const dataFromApiEntreprise = await getOrganismeInfosFromSiret(sampleOrganismeWithUAI.siret);

      const organisme = await createOrganisme({
        ...sampleOrganismeWithUAI,
        ...dataFromApiEntreprise,
      });
      await updateOneOrganismeRelatedFormations(organisme);
      const created = await findOrganismeById(organisme._id);

      expect(created).toStrictEqual({
        ...sampleOrganismeWithUAIOutput,
        ...fieldsAddedByApiCalls,
        _id: expect.anything(),
        created_at: expect.anything(),
        updated_at: expect.anything(),
      });
    });

    it("returns created organisme when valid with SIRET & no UAI & API Calls", async () => {
      const dataFromApiEntreprise = await getOrganismeInfosFromSiret(sampleOrganismeWithUAI.siret);
      const organisme = await createOrganisme({
        ...sampleOrganismeWithoutUai,
        ...dataFromApiEntreprise,
      });
      await updateOneOrganismeRelatedFormations(organisme);

      const created = await findOrganismeById(organisme._id);

      expect(created).toStrictEqual({
        ...sampleOrganismeWithoutUAIOutput,
        ...fieldsAddedByApiCalls,
        created_at: expect.anything(),
        updated_at: expect.anything(),
        _id: expect.anything(),
      });
    });
  });

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
      const createdOrganisme = await createOrganisme(sampleOrganismeWithUAI);
      const updated = await updateOrganisme(createdOrganisme._id, {
        ...createdOrganisme,
        nom: "UPDATED",
      });

      expect(updated).toStrictEqual({
        ...sampleOrganismeWithUAIOutput,
        nom: "UPDATED",
        _id: expect.anything(),
        created_at: expect.anything(),
        updated_at: expect.anything(),
      });
    });

    it("returns updated organisme & update ferme field to false when id valid and no API Calls", async () => {
      const createdOrganisme = await createOrganisme({ ...sampleOrganismeWithUAI, ferme: true });
      const updatedOrganisme = await updateOrganisme(createdOrganisme._id, {
        ...createdOrganisme,
        ferme: false,
      });

      expect(updatedOrganisme?.ferme).toBe(false);
    });

    it("returns updated organisme & does not update ferme field when id valid and no API Calls", async () => {
      const createdOrganisme = await createOrganisme({ ...sampleOrganismeWithUAI, ferme: true });
      const updatedOrganisme = await updateOrganisme(createdOrganisme._id, {
        ...createdOrganisme,
        ...sampleOrganismeWithUAI,
      });

      expect(updatedOrganisme?.ferme).toBe(true);
    });

    it("returns updated organisme & update ferme field from API", async () => {
      const sampleOrganisme = {
        uai: "0693400W",
        siret: "41461021200014",
        nom: "ETABLISSEMENT TEST",
        ferme: true,
        nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
        adresse: {
          departement: "01",
          region: "84",
          academie: "10",
        } as const,
        organismesFormateurs: [],
        organismesResponsables: [],
      };

      const dataFromApiEntreprise = await getOrganismeInfosFromSiret(sampleOrganismeWithUAI.siret);
      const createdOrganisme = await createOrganisme({
        ...sampleOrganisme,
        ...dataFromApiEntreprise,
      });
      const updatedOrganisme = await updateOneOrganismeRelatedFormations(createdOrganisme);

      expect(updatedOrganisme?.ferme).toBe(false);
    });
  });

  describe("updateOrganismeTransmission", () => {
    it("mets à jour les dates first_transmission_date et last_transmission_date pour un organisme sans first_transmission_date", async () => {
      const { _id } = await createOrganisme(sampleOrganismeWithUAI);

      // Vérification de la création sans first_transmission_date
      const created = await findOrganismeById(_id);
      assert(created);
      assert.deepStrictEqual(created.first_transmission_date, undefined);

      // MAJ de l'organisme et vérification de l'ajout de first_transmission_date
      await updateOrganismeTransmission(created);
      const updated = await findOrganismeById(_id);
      assert.notDeepStrictEqual(updated?.first_transmission_date, undefined);
      assert.notDeepStrictEqual(updated?.last_transmission_date, undefined);
    });

    it("mets à jour la date last_transmission_date pour un organisme avec first_transmission_date", async () => {
      const first_transmission_date = subDays(new Date(), 10);

      const { _id } = await createOrganisme({ ...sampleOrganismeWithUAI, first_transmission_date });

      // Vérification de la création avec first_transmission_date
      const created = await findOrganismeById(_id);
      assert(created);
      assert.deepStrictEqual(created.first_transmission_date, first_transmission_date);

      // MAJ de l'organisme et vérification de l'ajout de last_transmission_date
      await updateOrganismeTransmission(created);
      const updated = await findOrganismeById(_id);
      assert.deepStrictEqual(updated?.first_transmission_date, first_transmission_date);
      assert.notDeepStrictEqual(updated?.last_transmission_date, undefined);
    });

    it("mets à jour la source et l'api_version pour un organisme", async () => {
      const first_transmission_date = subDays(new Date(), 10);
      const testSource = "TEST_ERP";
      const testApiVersion = "v18";

      const { _id } = await createOrganisme({ ...sampleOrganismeWithUAI, first_transmission_date });

      // Vérification de la création avec first_transmission_date
      const created = await findOrganismeById(_id);
      assert(created);
      assert.deepStrictEqual(created.first_transmission_date, first_transmission_date);

      // MAJ de l'organisme et vérification de l'ajout de la source et api_key
      await updateOrganismeTransmission(created, testSource, testApiVersion);

      const updated = await findOrganismeById(_id);

      assert.deepStrictEqual(updated?.first_transmission_date, first_transmission_date);
      assert.deepStrictEqual(updated?.erps, [testSource]);
      assert.deepStrictEqual(updated?.api_version, testApiVersion);
      assert.notDeepStrictEqual(updated?.last_transmission_date, undefined);
    });
  });
});
