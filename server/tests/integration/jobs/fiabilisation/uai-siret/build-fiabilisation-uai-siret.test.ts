import { strict as assert } from "assert";
import { organismesReferentielDb, fiabilisationUaiSiretDb } from "../../../../../src/common/model/collections.js";
import {
  buildFiabilisationCoupleForTdbCouple,
  checkCoupleFiable,
} from "../../../../../src/jobs/fiabilisation/uai-siret/build-fiabilisation/index.js";
import { STATUT_FIABILISATION_COUPLES_UAI_SIRET } from "../../../../../src/common/constants/fiabilisationConstants.js";

describe("Job Build Fiabilisation UAI SIRET", () => {
  describe("checkCoupleFiable", async () => {
    const UAI_REFERENTIEL = "7722672E";
    const SIRET_REFERENTIEL = "99370584100099";
    let organismeReferentiel;

    beforeEach(async () => {
      // Création d'un organisme dans le référentiel avec un couple
      const { value } = await organismesReferentielDb().findOneAndUpdate(
        { uai: UAI_REFERENTIEL, siret: SIRET_REFERENTIEL, nature: "formateur" },
        { $set: { lieux_de_formation: [], relations: [] } },
        { upsert: true, returnDocument: "after" }
      );
      organismeReferentiel = value;
    });

    it("Vérifie l'ajout d'une entrée de fiabilisation FIABLE et un retour TRUE pour un couple du TDB dont le SIRET et l'UAI sont trouvés dans le Référentiel", async () => {
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: SIRET_REFERENTIEL };
      const allReferentielOrganismes = [organismeReferentiel];
      const isCoupleFiable = await checkCoupleFiable(coupleTdb, allReferentielOrganismes);

      // Vérification de la création du couple en tant que FIABLE
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_REFERENTIEL,
        siret: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.FIABLE,
      });
      assert.deepEqual(nbCoupleFiabilisationValid, 1);
      assert.deepEqual(isCoupleFiable, true);
    });

    it("Vérifie un retour FALSE pour un couple du TDB dont le SIRET et l'UAI ne sont pas trouvés dans le Référentiel", async () => {
      const coupleTdb = { uai: "7722672A", siret: "00070584100000" };
      const allReferentielOrganismes = [organismeReferentiel];
      const isCoupleFiable = await checkCoupleFiable(coupleTdb, allReferentielOrganismes);

      // Vérification de la non création du couple en tant que FIABLE
      const nbCoupleFiabilisation = await fiabilisationUaiSiretDb().countDocuments({});
      assert.deepEqual(nbCoupleFiabilisation, 0);
      assert.deepEqual(isCoupleFiable, false);
    });
  });

  describe("buildFiabilisationCoupleForTdbCouple", async () => {
    const UAI_REFERENTIEL = "7722672E";
    const SIRET_REFERENTIEL = "99370584100099";
    let organismeReferentiel;

    beforeEach(async () => {
      // Création d'un organisme dans le référentiel avec un couple
      const { value } = await organismesReferentielDb().findOneAndUpdate(
        { uai: UAI_REFERENTIEL, siret: SIRET_REFERENTIEL, nature: "formateur" },
        { $set: { lieux_de_formation: [], relations: [] } },
        { upsert: true, returnDocument: "after" }
      );
      organismeReferentiel = value;
    });

    it.skip("Vérifie l'ajout d'une entrée de fiabilisation FIABLE pour un couple du TDB dont le SIRET et l'UAI sont trouvés dans le Référentiel", async () => {
      // Construction de la collection de fiabilisation pour ce couple,
      // avec une liste de couples du TDB simple et une liste d'organismes du référentiel simple
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: SIRET_REFERENTIEL };
      const allTdbCouples = [coupleTdb];
      const allReferentielOrganismes = [organismeReferentiel];
      await buildFiabilisationCoupleForTdbCouple(coupleTdb, allTdbCouples, allReferentielOrganismes);

      // Vérification de la création du couple en tant que FIABLE
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_REFERENTIEL,
        siret: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.FIABLE,
      });
      assert.deepEqual(nbCoupleFiabilisationValid, 1);
    });

    it.skip("Vérifie l'ajout d'une entrée de fiabilisation A_FIABILISER pour un couple du TDB pour lequel on trouve un organisme unique dans le Référentiel avec l'UAI du TDB mais que le SIRET du TDB est vide et que l'UAI est unique dans tous les couples du TDB", async () => {
      // Construction de la collection de fiabilisation pour un couple avec cet UAI mais sans siret
      // avec une liste de couples du TDB simple et une liste d'organismes du référentiel simple
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: null };
      const allTdbCouples = [coupleTdb];
      const allReferentielOrganismes = [organismeReferentiel];
      await buildFiabilisationCoupleForTdbCouple(coupleTdb, allTdbCouples, allReferentielOrganismes);

      // Vérification de la création du couple en tant que A_FIABILISER
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_REFERENTIEL,
        siret: null,
        uai_fiable: UAI_REFERENTIEL,
        siret_fiable: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
      });
      assert.deepEqual(nbCoupleFiabilisationValid, 1);
    });

    it.skip("Vérifie l'ajout d'une entrée de fiabilisation NON_FIABILISABLE_MAPPING pour un couple du TDB pour lequel on trouve un organisme unique dans le Référentiel avec l'UAI du TDB mais que le SIRET du TDB est vide et que l'UAI n'est pas unique dans tous les couples du TDB", async () => {
      // Construction de la collection de fiabilisation pour un couple avec cet UAI mais sans siret
      // avec une liste de couples du TDB contenant des doublons d'UAI et une liste d'organismes du référentiel simple
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: null };
      const coupleTdb2 = { uai: UAI_REFERENTIEL, siret: "77370584100099" };
      const coupleTdb3 = { uai: UAI_REFERENTIEL, siret: "88370584100099" };
      const allTdbCouples = [coupleTdb, coupleTdb2, coupleTdb3];
      const allReferentielOrganismes = [organismeReferentiel];
      await buildFiabilisationCoupleForTdbCouple(coupleTdb, allTdbCouples, allReferentielOrganismes);

      // Vérification de la création du couple en tant que NON_FIABILISABLE_MAPPING car l'UAI existe bien dans le référentiel
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_REFERENTIEL,
        siret: null,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_MAPPING,
      });
      assert.deepEqual(nbCoupleFiabilisationValid, 1);
    });

    it.skip("Vérifie l'ajout d'une entrée de fiabilisation A_FIABILISER pour un couple du TDB pour lequel on trouve un organisme unique dans le Référentiel avec l'UAI du TDB mais que le SIRET du TDB n'est pas le même dans le Référentiel et que l'UAI est unique dans tous les couples du TDB", async () => {
      const SIRET_TDB = "11110584101111";

      // Construction de la collection de fiabilisation pour un couple avec cet UAI mais un siret différent
      // avec une liste de couples du TDB simple et une liste d'organismes du référentiel simple
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: SIRET_TDB };
      const allTdbCouples = [coupleTdb];
      const allReferentielOrganismes = [organismeReferentiel];
      await buildFiabilisationCoupleForTdbCouple(coupleTdb, allTdbCouples, allReferentielOrganismes);

      // Vérification de la création du couple en tant que A_FIABILISER
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_REFERENTIEL,
        siret: SIRET_TDB,
        uai_fiable: UAI_REFERENTIEL,
        siret_fiable: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
      });
      assert.deepEqual(nbCoupleFiabilisationValid, 1);
    });

    it.skip("Vérifie l'ajout d'une entrée de fiabilisation NON_FIABILISABLE_MAPPING pour un couple du TDB pour lequel on trouve un organisme unique dans le Référentiel avec l'UAI du TDB mais que le SIRET du TDB n'est pas le même dans le Référentiel et que l'UAI n'est pas unique dans tous les couples du TDB", async () => {
      const SIRET_TDB = "11110584101111";

      // Construction de la collection de fiabilisation pour un couple avec cet UAI mais un siret différent
      // avec une liste de couples du TDB contenant des doublons de cet UAI et une liste d'organismes du référentiel simple
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: SIRET_TDB };
      const coupleTdb2 = { uai: UAI_REFERENTIEL, siret: "22110584101111" };
      const coupleTdb3 = { uai: UAI_REFERENTIEL, siret: "33110584101111" };
      const allTdbCouples = [coupleTdb, coupleTdb2, coupleTdb3];
      const allReferentielOrganismes = [organismeReferentiel];
      await buildFiabilisationCoupleForTdbCouple(coupleTdb, allTdbCouples, allReferentielOrganismes);

      // Vérification de la création du couple en tant que NON_FIABILISABLE_MAPPING car l'UAI existe bien dans le référentiel
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_REFERENTIEL,
        siret: SIRET_TDB,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_MAPPING,
      });
      assert.deepEqual(nbCoupleFiabilisationValid, 1);
    });

    it.skip("Vérifie l'ajout d'une entrée de fiabilisation A_FIABILISER pour un couple du TDB pour lequel on trouve un organisme unique dans le référentiel avec le SIRET du TDB mais que l'UAI du Référentiel est différent de celui du TDB et que le SIRET est unique dans tous les couples du TDB", async () => {
      const UAI_TDB = "9933672E";

      // Construction de la collection de fiabilisation pour un couple avec le SIRET du référentiel et un UAI différent du référentiel
      // avec une liste de couples du TDB simple et une liste d'organismes du référentiel simple
      const coupleTdb = { uai: UAI_TDB, siret: SIRET_REFERENTIEL };
      const allTdbCouples = [coupleTdb];
      const allReferentielOrganismes = [organismeReferentiel];
      await buildFiabilisationCoupleForTdbCouple(coupleTdb, allTdbCouples, allReferentielOrganismes);

      // Vérification de la création du couple en tant que A_FIABILISER avec l'UAI du
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        uai_fiable: UAI_REFERENTIEL,
        siret_fiable: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
      });
      assert.deepEqual(nbCoupleFiabilisationValid, 1);
    });

    it.skip("Vérifie l'ajout d'une entrée de fiabilisation NON_FIABILISABLE_UAI_NON_VALIDEE pour un couple du TDB pour lequel on trouve un organisme unique dans le référentiel avec le SIRET du TDB mais que l'UAI du Référentiel est différent de celui du TDB et que le SIRET n'est pas unique dans tous les couples du TDB", async () => {
      const UAI_TDB = "9933672E";

      // Construction de la collection de fiabilisation pour un couple avec le SIRET du référentiel et un UAI différent du référentiel
      // avec une liste de couples du TDB simple et une liste d'organismes du référentiel simple
      const coupleTdb = { uai: UAI_TDB, siret: SIRET_REFERENTIEL };
      const coupleTdb2 = { uai: "1133672E", siret: SIRET_REFERENTIEL };
      const coupleTdb3 = { uai: "2233672E", siret: SIRET_REFERENTIEL };
      const allTdbCouples = [coupleTdb, coupleTdb2, coupleTdb3];
      const allReferentielOrganismes = [organismeReferentiel];
      await buildFiabilisationCoupleForTdbCouple(coupleTdb, allTdbCouples, allReferentielOrganismes);

      // Vérification de la création du couple en tant que NON_FIABILISABLE_UAI_NON_VALIDEE car l'UAI n'est pas dans le Référentiel
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_NON_VALIDEE,
      });
      assert.deepEqual(nbCoupleFiabilisationValid, 1);
    });

    it.skip("Vérifie l'ajout d'une entrée de fiabilisation NON_FIABILISABLE_MAPPING pour un couple du TDB pour lequel on trouve un organisme unique dans le référentiel avec le SIRET du TDB mais que l'UAI du Référentiel est différent de celui du TDB et que le SIRET n'est pas unique dans tous les couples du TDB mais que l'UAI est présente dans le référentiel", async () => {
      const UAI_TDB = "9933672E";
      const SIRET_REFERENTIEL2 = "12000000000000";

      // Création d'un autre organisme dans le Référentiel avec le couple contenant l'UAI du TDB
      await organismesReferentielDb().insertOne({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL2,
        nature: "formateur",
        lieux_de_formation: [],
        relations: [],
      });

      // Construction de la collection de fiabilisation pour un couple avec le SIRET du référentiel et un UAI différent du référentiel
      // avec une liste de couples du TDB simple et une liste d'organismes du référentiel simple
      const coupleTdb = { uai: UAI_TDB, siret: SIRET_REFERENTIEL };
      const coupleTdb2 = { uai: "1133672E", siret: SIRET_REFERENTIEL };
      const coupleTdb3 = { uai: "2233672E", siret: SIRET_REFERENTIEL };
      const allTdbCouples = [coupleTdb, coupleTdb2, coupleTdb3];
      const allReferentielOrganismes = [organismeReferentiel];
      await buildFiabilisationCoupleForTdbCouple(coupleTdb, allTdbCouples, allReferentielOrganismes);

      // Vérification de la création du couple en tant que NON_FIABILISABLE_MAPPING car l'UAI est dans le Référentiel
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_MAPPING,
      });
      assert.deepEqual(nbCoupleFiabilisationValid, 1);
    });

    it.skip("Vérifie l'ajout d'une entrée de fiabilisation NON_FIABILISABLE_UAI_NON_VALIDEE pour un couple du TDB pour lequel on trouve un organisme unique dans le référentiel avec le SIRET du TDB mais que dans le Référentiel il n'y a aucune UAI", async () => {
      const SIRET_REFERENTIEL = "123450584100099";
      const UAI_TDB = "3355672E";

      // Création d'un organisme dans le référentiel avec un couple
      const { value: organismeReferentielSansUai } = await organismesReferentielDb().findOneAndUpdate(
        { siret: SIRET_REFERENTIEL, nature: "formateur" },
        { $set: { lieux_de_formation: [] } },
        { upsert: true, returnDocument: "after" }
      );

      // Construction de la collection de fiabilisation pour un couple avec le SIRET du référentiel et un UAI différent du référentiel
      // avec une liste de couples du TDB simple et une liste d'organismes du référentiel simple
      const coupleTdb = { uai: UAI_TDB, siret: SIRET_REFERENTIEL };
      const allTdbCouples = [coupleTdb];
      const allReferentielOrganismes = [organismeReferentielSansUai];
      await buildFiabilisationCoupleForTdbCouple(coupleTdb, allTdbCouples, allReferentielOrganismes);

      // Vérification de la création du couple en tant que NON_FIABILISABLE_UAI_NON_VALIDEE car l'UAI n'est pas dans le référentiel
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_NON_VALIDEE,
      });
      assert.deepEqual(nbCoupleFiabilisationValid, 1);
    });

    it.skip("Vérifie l'ajout d'une entrée de fiabilisation FIABLE pour un couple du TDB pour lequel on trouve un organisme unique dans le référentiel avec le SIRET du TDB et que dans le Référentiel l'UAI est le même que dans le TDB", async () => {
      // Construction de la collection de fiabilisation pour un couple avec le SIRET du référentiel et un UAI différent du référentiel
      // avec une liste de couples du TDB simple et une liste d'organismes du référentiel simple
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: SIRET_REFERENTIEL };
      const allTdbCouples = [coupleTdb];
      const allReferentielOrganismes = [organismeReferentiel];
      await buildFiabilisationCoupleForTdbCouple(coupleTdb, allTdbCouples, allReferentielOrganismes);

      // Vérification de la création du couple en tant que NON_FIABILISABLE_UAI_NON_VALIDEE car l'UAI n'est pas dans le référentiel
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_REFERENTIEL,
        siret: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.FIABLE,
      });
      assert.deepEqual(nbCoupleFiabilisationValid, 1);
    });
  });
});
