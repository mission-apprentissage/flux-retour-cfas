import { strict as assert } from "assert";
import { subDays } from "date-fns";

import { createRandomOrganisme } from "../../../data/randomizedSample.js";
import {
  createOrganisme,
  findOrganismeById,
  setOrganismeTransmissionDates,
  updateOrganisme,
} from "../../../../src/common/actions/organismes/organismes.actions.js";
import { fiabilisationUaiSiretDb } from "../../../../src/common/model/collections.js";
import { FIABILISATION_MAPPINGS } from "../../../../src/jobs/fiabilisation/uai-siret/mapping.js";
import { mapFiabilizedOrganismeUaiSiretCouple } from "../../../../src/common/actions/engine/engine.organismes.utils.js";
import { STATUT_FIABILISATION_COUPLES_UAI_SIRET } from "../../../../src/common/constants/fiabilisationConstants.js";
import { NATURE_ORGANISME_DE_FORMATION } from "../../../../src/common/constants/natureOrganismeConstants.js";

const sampleOrganismeWithoutUai = {
  siret: "41461021200014",
  nom: "ETABLISSEMENT TEST",
  nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
  adresse: {
    departement: "01",
    region: "84",
    academie: "10",
  },
};

const sampleOrganismeWithUAI = {
  uai: "0693400W",
  ...sampleOrganismeWithoutUai,
};

const sampleOrganismeWithoutUAIOutput = {
  siret: sampleOrganismeWithUAI.siret,
  nom: sampleOrganismeWithUAI.nom,
  nature: sampleOrganismeWithUAI.nature,
  metiers: [],
  reseaux: [],
  erps: [],
  formations: [],
  fiabilisation_statut: "INCONNU",
  adresse: { departement: "01", region: "84", academie: "10" },
  ferme: false,
};

const sampleOrganismeWithUAIOutput = {
  uai: sampleOrganismeWithUAI.uai,
  ...sampleOrganismeWithoutUAIOutput,
};

const fieldsAddedByApiCalls = {
  enseigne: sampleOrganismeWithUAI.nom,
  raison_sociale: "CENTR FORMATION TECHNICIENS AGRICOLES",
  metiers: [
    "Exploitation agricole",
    "Paysagisme, jardinage, entretien des espaces verts",
    "Elevage d'animaux de ferme ",
    "Ingéniérie, agronomie",
    "Exploitation forestière, sylviculture",
    "Horticulture : production de fleurs, végétaux, arbustes",
    "Mécanique engins agricoles et engins de chantier",
    "Conduite d'engins agricoles",
    "Production d'alcool (vin, bière, cidre…)",
    "Architecture",
    "Ingéniérie en BTP (Bureau d'études, conception technique, BIM, …)",
    "Elevage de chevaux",
    "Production de produits fermiers",
    "Management commercial",
    "Soins aux animaux",
    "Elevage de poissons, produits de la mer",
  ],
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
      "CENTR FORMATION TECHNICIENS AGRICOLES\r\n" +
      "CFTA CENTR FORMAT TECHNICIENS AGRICOLES\r\n" +
      "25 RUE PIERRE NEVEU\r\n" +
      "61600 LA FERTE MACE\r\n" +
      "FRANCE",
  },
};

describe("Test des actions Organismes", () => {
  // Construction de l'adresse nockée via API Entreprise pour un fichier de sample

  describe("createOrganisme", () => {
    it("throws when given organisme is null", async () => {
      try {
        await createOrganisme(null, {
          buildFormationTree: false,
          buildInfosFromSiret: false,
          callLbaApi: false,
        });
      } catch (err) {
        assert.notEqual(err, undefined);
      }
    });

    it("throws when cfa with given uai already exists", async () => {
      const uai = "0802004U";
      const randomOrganisme = createRandomOrganisme();
      await createOrganisme(
        { ...randomOrganisme, uai },
        {
          buildFormationTree: false,
          buildInfosFromSiret: false,
          callLbaApi: false,
        }
      );

      try {
        await createOrganisme(
          { ...randomOrganisme, uai },
          {
            buildFormationTree: false,
            buildInfosFromSiret: false,
            callLbaApi: false,
          }
        );
      } catch (err) {
        assert.notEqual(err, undefined);
      }
    });

    it("returns created organisme when valid with UAI & SIRET & no API Calls", async () => {
      // Création de l'organisme sans les appels API
      const { _id } = await createOrganisme(sampleOrganismeWithUAI, {
        buildFormationTree: false,
        buildInfosFromSiret: false,
        callLbaApi: false,
      });
      const created = await findOrganismeById(_id);

      assert.deepEqual(created, {
        ...sampleOrganismeWithUAIOutput,
        _id: created?._id || "should not be null",
        created_at: created?.created_at || "should not be null",
        updated_at: created?.updated_at || "should not be null",
      });
    });

    it("returns created organisme when valid with SIRET and no UAI & no API Calls", async () => {
      // Création de l'organisme sans les appels API
      const { _id } = await createOrganisme(sampleOrganismeWithoutUai, {
        buildFormationTree: false,
        buildInfosFromSiret: false,
        callLbaApi: false,
      });
      const created = await findOrganismeById(_id);

      assert.deepEqual(created, {
        ...sampleOrganismeWithoutUAIOutput,
        _id: created?._id || "should not be null",
        created_at: created?.created_at || "should not be null",
        updated_at: created?.updated_at || "should not be null",
      });
    });

    it("returns created organisme when valid with UAI & SIRET & API Calls", async () => {
      const { _id } = await createOrganisme(sampleOrganismeWithUAI, {
        buildFormationTree: true,
        buildInfosFromSiret: true,
        callLbaApi: true,
      });
      const created = await findOrganismeById(_id);

      assert.deepEqual(created, {
        ...sampleOrganismeWithUAIOutput,
        ...fieldsAddedByApiCalls,
        _id: created?._id || "should not be null",
        created_at: created?.created_at || "should not be null",
        updated_at: created?.updated_at || "should not be null",
      });
    });

    it("returns created organisme when valid with SIRET & no UAI & API Calls", async () => {
      const { _id } = await createOrganisme(sampleOrganismeWithoutUai, {
        buildFormationTree: true,
        buildInfosFromSiret: true,
        callLbaApi: true,
      });
      const created = await findOrganismeById(_id);

      assert.deepEqual(created, {
        ...sampleOrganismeWithoutUAIOutput,
        ...fieldsAddedByApiCalls,
        _id: created?._id || "should not be null",
        created_at: created?.created_at || "should not be null",
        updated_at: created?.updated_at || "should not be null",
      });
    });
  });

  describe("updateOrganisme", () => {
    it("throws when given data is null", async () => {
      // @ts-ignore
      await assert.rejects(() => updateOrganisme("id", null));
    });

    it("throws when given id is null", async () => {
      const randomOrganisme = createRandomOrganisme();
      // @ts-ignore
      await assert.rejects(() => updateOrganisme(null, randomOrganisme));
    });

    it("throws when given id is not existant", async () => {
      const randomOrganisme = createRandomOrganisme();
      await assert.rejects(() => updateOrganisme("random-id", randomOrganisme));
    });

    it("returns updated organisme when id valid and no API Calls", async () => {
      const { _id } = await createOrganisme(sampleOrganismeWithUAI, {
        buildFormationTree: false,
        buildInfosFromSiret: false,
        callLbaApi: false,
      });
      const toUpdateOrganisme = { ...sampleOrganismeWithUAI, nom: "UPDATED" };
      const updated = await updateOrganisme(_id, toUpdateOrganisme, {
        buildFormationTree: false,
        buildInfosFromSiret: false,
        callLbaApi: false,
      });

      assert.deepEqual(updated, {
        ...sampleOrganismeWithUAIOutput,
        nom: "UPDATED",
        nom_tokenized: "UPDA UPDAT UPDATE UPDATED",
        _id: updated?._id || "should not be null",
        created_at: updated?.created_at || "should not be null",
        updated_at: updated?.updated_at || "should not be null",
      });
    });

    it("returns updated organisme when id valid and API Calls", async () => {
      const { _id } = await createOrganisme(sampleOrganismeWithUAI, {
        buildFormationTree: false,
        buildInfosFromSiret: false,
        callLbaApi: false,
      });
      // Test d'update sur le champ api_key
      const toUpdateOrganisme = { ...sampleOrganismeWithUAI, api_key: "UPDATED" };
      const updated = await updateOrganisme(_id, toUpdateOrganisme);

      assert.deepEqual(updated, {
        ...sampleOrganismeWithUAIOutput,
        ...fieldsAddedByApiCalls,
        api_key: "UPDATED",
        _id: updated?._id || "should not be null",
        created_at: updated?.created_at || "should not be null",
        updated_at: updated?.updated_at || "should not be null",
      });
    });

    it("returns updated organisme & update ferme field to false when id valid and no API Calls", async () => {
      const { _id } = await createOrganisme(
        { ...sampleOrganismeWithUAI, ferme: true },
        {
          buildFormationTree: false,
          buildInfosFromSiret: false,
          callLbaApi: false,
        }
      );
      const updatedOrganisme = await updateOrganisme(
        _id,
        { ...sampleOrganismeWithUAI, ferme: false },
        { buildFormationTree: false, buildInfosFromSiret: false, callLbaApi: false }
      );

      assert.equal(updatedOrganisme?.ferme, false);
    });

    it("returns updated organisme & does not update ferme field when id valid and no API Calls", async () => {
      const { _id } = await createOrganisme(
        { ...sampleOrganismeWithUAI, ferme: true },
        {
          buildFormationTree: false,
          buildInfosFromSiret: false,
          callLbaApi: false,
        }
      );
      const updatedOrganisme = await updateOrganisme(
        _id,
        { ...sampleOrganismeWithUAI },
        { buildFormationTree: false, buildInfosFromSiret: false, callLbaApi: false }
      );

      assert.equal(updatedOrganisme?.ferme, true);
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
        },
      };

      const { _id } = await createOrganisme(sampleOrganisme, {
        buildFormationTree: false,
        buildInfosFromSiret: false,
        callLbaApi: false,
      });
      const updatedOrganisme = await updateOrganisme(_id, { ...sampleOrganisme });

      assert.equal(updatedOrganisme?.ferme, false);
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

      // Create entry A_FIABILISER in fiabilisation collection
      await fiabilisationUaiSiretDb().insertOne({
        uai: sampleUai,
        siret: sampleSiret,
        uai_fiable: sampleUaiFiable,
        siret_fiable: sampleSiretFiable,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
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

      // Create entry A_FIABILISER in fiabilisation collection
      await fiabilisationUaiSiretDb().insertOne({
        uai: sampleUai,
        siret: sampleSiret,
        uai_fiable: sampleUaiFiable,
        siret_fiable: sampleSiretFiable,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
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

      // Create entry A_FIABILISER in fiabilisation collection
      await fiabilisationUaiSiretDb().insertOne({
        uai: sampleUai,
        siret: sampleSiret,
        uai_fiable: sampleUaiFiable,
        siret_fiable: sampleSiretFiable,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
      });

      const { cleanUai, cleanSiret } = await mapFiabilizedOrganismeUaiSiretCouple({
        uai: sampleUai,
        siret: sampleSiret,
      });
      assert.equal(cleanUai, sampleUaiFiable);
      assert.equal(cleanSiret, sampleSiretFiable);
    });
  });

  describe("setOrganismeTransmissionDates", () => {
    it("mets à jour les dates first_transmission_date et last_transmission_date pour un organisme sans first_transmission_date", async () => {
      // Création de l'organisme sans les appels API
      const { _id } = await createOrganisme(sampleOrganismeWithUAI, {
        buildFormationTree: false,
        buildInfosFromSiret: false,
        callLbaApi: false,
      });

      // Vérification de la création sans first_transmission_date
      const created = await findOrganismeById(_id);
      assert(created);
      assert.deepStrictEqual(created.first_transmission_date, undefined);

      // MAJ de l'organisme et vérification de l'ajout de first_transmission_date
      await setOrganismeTransmissionDates(created);
      const updated = await findOrganismeById(_id);
      assert.notDeepStrictEqual(updated?.first_transmission_date, undefined);
      assert.notDeepStrictEqual(updated?.last_transmission_date, undefined);
    });

    it("mets à jour la date last_transmission_date pour un organisme avec first_transmission_date", async () => {
      const first_transmission_date = subDays(new Date(), 10);

      // Création de l'organisme sans les appels API
      const { _id } = await createOrganisme(
        { ...sampleOrganismeWithUAI, first_transmission_date },
        {
          buildFormationTree: false,
          buildInfosFromSiret: false,
          callLbaApi: false,
        }
      );

      // Vérification de la création avec first_transmission_date
      const created = await findOrganismeById(_id);
      assert(created);
      assert.deepStrictEqual(created.first_transmission_date, first_transmission_date);

      // MAJ de l'organisme et vérification de l'ajout de last_transmission_date
      await setOrganismeTransmissionDates(created);
      const updated = await findOrganismeById(_id);
      assert.deepStrictEqual(updated?.first_transmission_date, first_transmission_date);
      assert.notDeepStrictEqual(updated?.last_transmission_date, undefined);
    });
  });
});
