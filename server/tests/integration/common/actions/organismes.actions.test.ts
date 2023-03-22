import { strict as assert } from "assert";
import { createRandomOrganisme } from "../../../data/randomizedSample.js";
import pick from "lodash.pick";
import {
  createOrganisme,
  findOrganismeById,
  setOrganismeTransmissionDates,
  updateOrganisme,
} from "../../../../src/common/actions/organismes/organismes.actions.js";
import { buildTokenizedString } from "../../../../src/common/utils/buildTokenizedString.js";
import { fiabilisationUaiSiretDb } from "../../../../src/common/model/collections.js";
import { FIABILISATION_MAPPINGS } from "../../../../src/jobs/fiabilisation/uai-siret/mapping.js";
import { mapFiabilizedOrganismeUaiSiretCouple } from "../../../../src/common/actions/engine/engine.organismes.utils.js";
import { STATUT_FIABILISATION_COUPLES_UAI_SIRET } from "../../../../src/common/constants/fiabilisationConstants.js";
import { NATURE_ORGANISME_DE_FORMATION } from "../../../../src/common/utils/validationsUtils/organisme-de-formation/nature.js";
import { SAMPLES_ETABLISSEMENTS_API_ENTREPRISE } from "../../../data/entreprise.api.gouv.fr/sampleDataApiEntreprise.js";
import { DEPARTEMENTS } from "../../../../src/common/constants/territoiresConstants.js";
import { subDays } from "date-fns";

describe("Test des actions Organismes", () => {
  // Construction de l'adresse nockée via API Entreprise pour un fichier de sample
  const buildAdresseFromApiEntreprise = (etablissementSample) => {
    const { adresse, region_implantation } = etablissementSample;
    const academieFromRegion = DEPARTEMENTS.find((o) => o.region?.code === region_implantation?.code);
    return {
      academie: academieFromRegion?.academie?.code,
      code_insee: adresse?.code_insee_localite,
      code_postal: adresse?.code_postal,
      commune: adresse?.localite,
      complete: `${adresse?.l1}\r\n${adresse?.l2}\r\n${adresse?.l4}\r\n${adresse?.l6}\r\n${adresse?.l7}`,
      departement: adresse?.code_postal.substring(0, 2),
      numero: parseInt(adresse?.numero_voie),
      region: region_implantation?.code,
      voie: `${adresse?.type_voie}${adresse.nom_voie}`,
    };
  };

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
      const sampleOrganisme = {
        uai: "0693400W",
        siret: "41461021200014",
        nom: "ETABLISSEMENT TEST",
        nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
        adresse: {
          departement: "01",
          region: "84",
          academie: "10",
        },
      };

      // Création de l'organisme sans les appels API
      const { _id } = await createOrganisme(sampleOrganisme, {
        buildFormationTree: false,
        buildInfosFromSiret: false,
        callLbaApi: false,
      });
      const created = await findOrganismeById(_id);

      assert.deepEqual(pick(created, ["uai", "siret", "nom", "nature"]), {
        uai: sampleOrganisme.uai,
        siret: sampleOrganisme.siret,
        nom: sampleOrganisme.nom,
        nature: sampleOrganisme.nature,
      });

      // Vérification des autres champs
      assert.equal(created?.nom_tokenized, buildTokenizedString(sampleOrganisme.nom.trim(), 4));
      assert.equal(!!created?.access_token, true);
      assert.equal(!!created?.created_at, true);
      assert.equal(!!created?.updated_at, true);
    });

    it("returns created organisme when valid with SIRET and no UAI & no API Calls", async () => {
      const sampleOrganisme = {
        siret: "41461021200014",
        nom: "ETABLISSEMENT TEST",
        nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
        adresse: {
          departement: "01",
          region: "84",
          academie: "10",
        },
      };

      // Création de l'organisme sans les appels API
      const { _id } = await createOrganisme(sampleOrganisme, {
        buildFormationTree: false,
        buildInfosFromSiret: false,
        callLbaApi: false,
      });
      const created = await findOrganismeById(_id);

      assert.deepEqual(pick(created, ["siret", "nom", "nature"]), {
        siret: sampleOrganisme.siret,
        nom: sampleOrganisme.nom,
        nature: sampleOrganisme.nature,
      });

      // Vérification des autres champs
      assert.equal(created?.nom_tokenized, buildTokenizedString(sampleOrganisme.nom.trim(), 4));
      assert.equal(!!created?.access_token, true);
      assert.equal(!!created?.created_at, true);
      assert.equal(!!created?.updated_at, true);
    });

    it("returns created organisme when valid with UAI & SIRET & API Calls", async () => {
      const sampleOrganisme = {
        uai: "0693400W",
        siret: "41461021200014",
        nom: "ETABLISSEMENT TEST",
        nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
        adresse: {
          departement: "01",
          region: "84",
          academie: "10",
        },
      };
      const { _id } = await createOrganisme(sampleOrganisme, {
        buildFormationTree: true,
        buildInfosFromSiret: true,
        callLbaApi: true,
      });
      const created = await findOrganismeById(_id);

      assert.deepEqual(pick(created, ["uai", "siret", "nom", "nature"]), {
        uai: sampleOrganisme.uai,
        siret: sampleOrganisme.siret,
        nom: sampleOrganisme.nom,
        nature: sampleOrganisme.nature,
      });

      assert.deepEqual(
        created?.adresse,
        buildAdresseFromApiEntreprise(SAMPLES_ETABLISSEMENTS_API_ENTREPRISE.sample41461021200014.etablissement)
      );

      // TODO Tester les API pour les formations tree et les metiers LBA

      // Vérification des autres champs
      assert.equal(created?.nom_tokenized, buildTokenizedString(sampleOrganisme.nom.trim(), 4));
      assert.equal(!!created?.access_token, true);
      assert.equal(!!created?.created_at, true);
      assert.equal(!!created?.updated_at, true);
    });

    it("returns created organisme when valid with SIRET & no UAI & API Calls", async () => {
      const sampleOrganisme = {
        siret: "41461021200014",
        nom: "ETABLISSEMENT TEST",
        nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
        adresse: {
          departement: "01",
          region: "84",
          academie: "10",
        },
      };
      const { _id } = await createOrganisme(sampleOrganisme, {
        buildFormationTree: true,
        buildInfosFromSiret: true,
        callLbaApi: true,
      });
      const created = await findOrganismeById(_id);

      assert.deepEqual(pick(created, ["siret", "nom", "nature"]), {
        siret: sampleOrganisme.siret,
        nom: sampleOrganisme.nom,
        nature: sampleOrganisme.nature,
      });

      // Vérification de l'adresse construite depuis l'appel API Entreprise
      const { adresse, region_implantation } = SAMPLES_ETABLISSEMENTS_API_ENTREPRISE.sample41461021200014.etablissement;
      const academieFromRegion = DEPARTEMENTS.find((o) => o.region?.code === region_implantation?.code);
      const adresseBuildFromApiEntreprise = {
        academie: academieFromRegion?.academie?.code,
        code_insee: adresse?.code_insee_localite,
        code_postal: adresse?.code_postal,
        commune: adresse?.localite,
        complete: `${adresse?.l1}\r\n${adresse?.l2}\r\n${adresse?.l4}\r\n${adresse?.l6}\r\n${adresse?.l7}`,
        departement: adresse?.code_postal.substring(0, 2),
        numero: parseInt(adresse?.numero_voie),
        region: region_implantation?.code,
        voie: `${adresse?.type_voie}${adresse.nom_voie}`,
      };

      assert.deepEqual(created?.adresse, adresseBuildFromApiEntreprise);

      // Vérification des autres champs
      assert.equal(created?.nom_tokenized, buildTokenizedString(sampleOrganisme.nom.trim(), 4));
      assert.equal(!!created?.access_token, true);
      assert.equal(!!created?.created_at, true);
      assert.equal(!!created?.updated_at, true);
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
      const sampleOrganisme = {
        uai: "0693400W",
        siret: "41461021200014",
        nom: "ETABLISSEMENT TEST",
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
      const toUpdateOrganisme = { ...sampleOrganisme, nom: "UPDATED" };
      const updatedOrganisme = await updateOrganisme(_id, toUpdateOrganisme, {
        buildFormationTree: false,
        buildInfosFromSiret: false,
        callLbaApi: false,
      });

      assert.deepEqual(pick(updatedOrganisme, ["uai", "siret", "nom", "adresse", "nature"]), {
        uai: updatedOrganisme?.uai,
        siret: updatedOrganisme?.siret,
        nom: "UPDATED",
        adresse: updatedOrganisme?.adresse,
        nature: updatedOrganisme?.nature,
      });

      assert.equal(updatedOrganisme?.nom_tokenized, buildTokenizedString("UPDATED", 4));
      assert.equal(!!updatedOrganisme?.access_token, true);
      assert.equal(!!updatedOrganisme?.created_at, true);
      assert.equal(!!updatedOrganisme?.updated_at, true);
    });

    it("returns updated organisme when id valid and API Calls", async () => {
      const sampleOrganisme = {
        uai: "0693400W",
        siret: "41461021200014",
        nom: "ETABLISSEMENT TEST",
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
      // Test d'update sur le champ api_key
      const toUpdateOrganisme = { ...sampleOrganisme, api_key: "UPDATED" };
      const updatedOrganisme = await updateOrganisme(_id, toUpdateOrganisme);

      assert.deepEqual(pick(updatedOrganisme, ["uai", "siret", "api_key", "nature"]), {
        uai: updatedOrganisme?.uai,
        siret: updatedOrganisme?.siret,
        api_key: "UPDATED",
        nature: updatedOrganisme?.nature,
      });

      // Vérification de l'adresse construite depuis l'appel API Entreprise
      const { adresse, region_implantation } = SAMPLES_ETABLISSEMENTS_API_ENTREPRISE.sample41461021200014.etablissement;
      const academieFromRegion = DEPARTEMENTS.find((o) => o.region?.code === region_implantation?.code);
      const adresseBuildFromApiEntreprise = {
        academie: academieFromRegion?.academie?.code,
        code_insee: adresse?.code_insee_localite,
        code_postal: adresse?.code_postal,
        commune: adresse?.localite,
        complete: `${adresse?.l1}\r\n${adresse?.l2}\r\n${adresse?.l4}\r\n${adresse?.l6}\r\n${adresse?.l7}`,
        departement: adresse?.code_postal.substring(0, 2),
        numero: parseInt(adresse?.numero_voie),
        region: region_implantation?.code,
        voie: `${adresse?.type_voie}${adresse.nom_voie}`,
      };

      assert.deepEqual(updatedOrganisme?.adresse, adresseBuildFromApiEntreprise);
      // TODO Tester les API pour les formations tree et les metiers LBA

      assert.equal(updatedOrganisme?.nom_tokenized, buildTokenizedString(sampleOrganisme.nom.trim(), 4));
      assert.equal(!!updatedOrganisme?.access_token, true);
      assert.equal(!!updatedOrganisme?.created_at, true);
      assert.equal(!!updatedOrganisme?.updated_at, true);
    });

    it("returns updated organisme & update ferme field to false when id valid and no API Calls", async () => {
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
      const updatedOrganisme = await updateOrganisme(
        _id,
        { ...sampleOrganisme, ferme: false },
        { buildFormationTree: false, buildInfosFromSiret: false, callLbaApi: false }
      );

      assert.equal(updatedOrganisme?.ferme, false);
    });

    it("returns updated organisme & does not update ferme field when id valid and no API Calls", async () => {
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
      const updatedOrganisme = await updateOrganisme(
        _id,
        { ...sampleOrganisme },
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
      const sampleOrganisme = {
        uai: "0693400W",
        siret: "41461021200014",
        nom: "ETABLISSEMENT TEST",
        nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
        adresse: {
          departement: "01",
          region: "84",
          academie: "10",
        },
      };

      // Création de l'organisme sans les appels API
      const { _id } = await createOrganisme(sampleOrganisme, {
        buildFormationTree: false,
        buildInfosFromSiret: false,
        callLbaApi: false,
      });

      // Vérification de la création sans first_transmission_date
      const created = await findOrganismeById(_id);
      assert.deepStrictEqual(created?.first_transmission_date, undefined);

      // MAJ de l'organisme et vérification de l'ajout de first_transmission_date
      await setOrganismeTransmissionDates(_id);
      const updated = await findOrganismeById(_id);
      assert.notDeepStrictEqual(updated?.first_transmission_date, undefined);
      assert.notDeepStrictEqual(updated?.last_transmission_date, undefined);
    });

    it("mets à jour la date last_transmission_date pour un organisme avec first_transmission_date", async () => {
      const first_transmission_date = subDays(new Date(), 10);

      const sampleOrganisme = {
        uai: "0693400W",
        siret: "41461021200014",
        nom: "ETABLISSEMENT TEST",
        nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
        first_transmission_date,
        adresse: {
          departement: "01",
          region: "84",
          academie: "10",
        },
      };

      // Création de l'organisme sans les appels API
      const { _id } = await createOrganisme(sampleOrganisme, {
        buildFormationTree: false,
        buildInfosFromSiret: false,
        callLbaApi: false,
      });

      // Vérification de la création avec first_transmission_date
      const created = await findOrganismeById(_id);
      assert.deepStrictEqual(created?.first_transmission_date, first_transmission_date);

      // MAJ de l'organisme et vérification de l'ajout de last_transmission_date
      await setOrganismeTransmissionDates(_id);
      const updated = await findOrganismeById(_id);
      assert.deepStrictEqual(updated?.first_transmission_date, first_transmission_date);
      assert.notDeepStrictEqual(updated?.last_transmission_date, undefined);
    });
  });
});
