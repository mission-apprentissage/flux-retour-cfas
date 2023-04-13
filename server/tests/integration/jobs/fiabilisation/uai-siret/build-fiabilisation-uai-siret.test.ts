import { strict as assert } from "assert";
import {
  organismesReferentielDb,
  fiabilisationUaiSiretDb,
  organismesDb,
} from "../../../../../src/common/model/collections.js";
import { buildFiabilisationCoupleForTdbCouple } from "../../../../../src/jobs/fiabilisation/uai-siret/build.js";
import {
  STATUT_FIABILISATION_COUPLES_UAI_SIRET,
  STATUT_FIABILISATION_ORGANISME,
} from "../../../../../src/common/constants/fiabilisationConstants.js";
import {
  checkCoupleFiable,
  checkCoupleNonFiabilisable,
  checkMatchReferentielSiretUaiDifferent,
  checkMatchReferentielUaiUniqueSiretDifferent,
  checkUaiAucunLieuReferentiel,
} from "../../../../../src/jobs/fiabilisation/uai-siret/build.rules.js";

describe("Job Build Fiabilisation UAI SIRET", () => {
  const UAI_REFERENTIEL = "7722672E";
  const SIRET_REFERENTIEL = "99370584100099";
  let organismeReferentiel;

  beforeEach(async () => {
    // Création d'un organisme dans le référentiel avec un couple
    const { value } = await organismesReferentielDb().findOneAndUpdate(
      { uai: UAI_REFERENTIEL, siret: SIRET_REFERENTIEL, nature: "formateur" },
      { $set: { lieux_de_formation: [{ uai: UAI_REFERENTIEL }], relations: [] } },
      { upsert: true, returnDocument: "after" }
    );
    organismeReferentiel = value;
  });

  describe("checkCoupleFiable", async () => {
    it("Vérifie l'ajout d'une entrée de fiabilisation FIABLE et un retour TRUE pour un couple du TDB dont le SIRET et l'UAI sont trouvés dans le Référentiel", async () => {
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: SIRET_REFERENTIEL };

      // Ajout d'un organisme pour le couple
      await organismesDb().insertOne({
        uai: UAI_REFERENTIEL,
        siret: SIRET_REFERENTIEL,
        nature: "responsable",
        relatedFormations: [],
      });

      const allReferentielOrganismes = [organismeReferentiel];
      const isCoupleFiable = await checkCoupleFiable(coupleTdb, allReferentielOrganismes);

      // Vérification de la création du couple en tant que FIABLE
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_REFERENTIEL,
        siret: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.FIABLE,
      });

      const nbOrganismeFiable = await organismesDb().countDocuments({
        uai: UAI_REFERENTIEL,
        siret: SIRET_REFERENTIEL,
        fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.FIABLE,
      });

      assert.deepEqual(nbCoupleFiabilisationValid, 1);
      assert.deepEqual(nbOrganismeFiable, 1);
      assert.deepEqual(isCoupleFiable, true);
    });

    it("Vérifie un retour FALSE pour un couple du TDB dont le SIRET et l'UAI ne sont pas trouvés dans le Référentiel", async () => {
      const uaiTest = "7722672A";
      const siretTest = "00070584100000";
      const coupleTdb = { uai: uaiTest, siret: siretTest };

      // Ajout d'un organisme pour le couple
      await organismesDb().insertOne({
        uai: uaiTest,
        siret: siretTest,
        nature: "responsable",
        relatedFormations: [],
      });

      const allReferentielOrganismes = [organismeReferentiel];
      const isCoupleFiable = await checkCoupleFiable(coupleTdb, allReferentielOrganismes);

      // Vérification de la non création du couple en tant que FIABLE
      const nbCoupleFiabilisation = await fiabilisationUaiSiretDb().countDocuments({});

      const nbOrganismeFiable = await organismesDb().countDocuments({
        uai: UAI_REFERENTIEL,
        siret: SIRET_REFERENTIEL,
        fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.FIABLE,
      });

      assert.deepEqual(nbCoupleFiabilisation, 0);
      assert.deepEqual(nbOrganismeFiable, 0);
      assert.deepEqual(isCoupleFiable, false);
    });
  });

  describe("checkMatchReferentielUaiUniqueSiretDifferent", async () => {
    it("Vérifie l'ajout d'une entrée de fiabilisation A_FIABILISER et un retour TRUE pour un couple du TDB pour lequel on trouve un organisme unique dans le Référentiel avec l'UAI du TDB mais que le SIRET du TDB est vide et que l'UAI est unique dans tous les couples du TDB", async () => {
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: null };
      const allTdbCouples = [coupleTdb];
      const allReferentielOrganismes = [organismeReferentiel];
      const isCoupleAFiabiliser = await checkMatchReferentielUaiUniqueSiretDifferent(
        coupleTdb,
        allReferentielOrganismes,
        allTdbCouples
      );

      // Vérification de la création du couple en tant que A_FIABILISER
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_REFERENTIEL,
        siret: null,
        uai_fiable: UAI_REFERENTIEL,
        siret_fiable: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
      });

      assert.deepEqual(nbCoupleFiabilisationValid, 1);
      assert.deepEqual(isCoupleAFiabiliser, true);
    });

    it("Vérifie l'ajout d'une entrée de fiabilisation A_FIABILISER et un retour TRUE pour un couple du TDB pour lequel on trouve un organisme unique dans le Référentiel avec l'UAI du TDB mais que le SIRET du TDB n'est pas le même dans le Référentiel et que l'UAI est unique dans tous les couples du TDB", async () => {
      const SIRET_TDB = "11110584101111";
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: SIRET_TDB };
      const allTdbCouples = [coupleTdb];
      const allReferentielOrganismes = [organismeReferentiel];
      const isCoupleAFiabiliser = await checkMatchReferentielUaiUniqueSiretDifferent(
        coupleTdb,
        allReferentielOrganismes,
        allTdbCouples
      );

      // Vérification de la création du couple en tant que A_FIABILISER
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_REFERENTIEL,
        siret: SIRET_TDB,
        uai_fiable: UAI_REFERENTIEL,
        siret_fiable: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
      });

      assert.deepEqual(nbCoupleFiabilisationValid, 1);
      assert.deepEqual(isCoupleAFiabiliser, true);
    });

    it("Vérifie un retour FALSE pour un couple du TDB pour lequel on trouve un organisme unique dans le Référentiel avec l'UAI du TDB mais que le SIRET du TDB est le même que celui du REFERENTIEL", async () => {
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: SIRET_REFERENTIEL };
      const allTdbCouples = [coupleTdb];
      const allReferentielOrganismes = [organismeReferentiel];
      const isCoupleAFiabiliser = await checkMatchReferentielUaiUniqueSiretDifferent(
        coupleTdb,
        allReferentielOrganismes,
        allTdbCouples
      );

      // Vérification que l'on ajoute aucun couple dans la collection
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({});

      assert.deepEqual(nbCoupleFiabilisationValid, 0);
      assert.deepEqual(isCoupleAFiabiliser, false);
    });

    it("Vérifie un retour FALSE pour un couple du TDB pour lequel on ne trouve aucun organisme dans le Référentiel avec l'UAI du TDB", async () => {
      const coupleTdb = { uai: "7722672Z", siret: SIRET_REFERENTIEL };
      const allTdbCouples = [coupleTdb];
      const allReferentielOrganismes = [organismeReferentiel];
      const isCoupleAFiabiliser = await checkMatchReferentielUaiUniqueSiretDifferent(
        coupleTdb,
        allReferentielOrganismes,
        allTdbCouples
      );

      // Vérification que l'on ajoute aucun couple dans la collection
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({});

      assert.deepEqual(nbCoupleFiabilisationValid, 0);
      assert.deepEqual(isCoupleAFiabiliser, false);
    });

    it("Vérifie un retour FALSE pour un couple du TDB pour lequel on trouve un organisme unique dans le Référentiel avec l'UAI du TDB mais que le SIRET du TDB est vide et que l'UAI n'est pas unique dans tous les couples du TDB", async () => {
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: null };
      const coupleTdb2 = { uai: UAI_REFERENTIEL, siret: "77370584100099" };
      const coupleTdb3 = { uai: UAI_REFERENTIEL, siret: "88370584100099" };
      const allTdbCouples = [coupleTdb, coupleTdb2, coupleTdb3];
      const allReferentielOrganismes = [organismeReferentiel];
      const isCoupleAFiabiliser = await checkMatchReferentielUaiUniqueSiretDifferent(
        coupleTdb,
        allReferentielOrganismes,
        allTdbCouples
      );

      // Vérification que l'on ajoute aucun couple dans la collection
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({});

      assert.deepEqual(nbCoupleFiabilisationValid, 0);
      assert.deepEqual(isCoupleAFiabiliser, false);
    });

    it("Vérifie un retour FALSE pour un couple du TDB pour lequel on trouve un organisme unique dans le Référentiel avec l'UAI du TDB mais que le SIRET du TDB n'est pas le même dans le Référentiel et que l'UAI n'est pas unique dans tous les couples du TDB", async () => {
      const SIRET_TDB = "11110584101111";

      const coupleTdb = { uai: UAI_REFERENTIEL, siret: SIRET_TDB };
      const coupleTdb2 = { uai: UAI_REFERENTIEL, siret: "22110584101111" };
      const coupleTdb3 = { uai: UAI_REFERENTIEL, siret: "33110584101111" };
      const allTdbCouples = [coupleTdb, coupleTdb2, coupleTdb3];
      const allReferentielOrganismes = [organismeReferentiel];
      const isCoupleAFiabiliser = await checkMatchReferentielUaiUniqueSiretDifferent(
        coupleTdb,
        allReferentielOrganismes,
        allTdbCouples
      );

      // Vérification que l'on ajoute aucun couple dans la collection
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({});

      assert.deepEqual(nbCoupleFiabilisationValid, 0);
      assert.deepEqual(isCoupleAFiabiliser, false);
    });
  });

  describe("checkMatchReferentielSiretUaiDifferent", async () => {
    it("Vérifie l'ajout d'une entrée de fiabilisation A_FIABILISER et un retour TRUE pour un couple du TDB pour lequel on trouve un organisme unique dans le référentiel avec le SIRET du TDB mais que l'UAI du Référentiel est différent de celui du TDB et que le SIRET est unique dans tous les couples du TDB", async () => {
      const UAI_TDB = "9933672E";

      const coupleTdb = { uai: UAI_TDB, siret: SIRET_REFERENTIEL };
      const allTdbCouples = [coupleTdb];
      const allReferentielOrganismes = [organismeReferentiel];
      const isCoupleAFiabiliser = await checkMatchReferentielSiretUaiDifferent(
        coupleTdb,
        allReferentielOrganismes,
        allTdbCouples
      );

      // Vérification de la création du couple en tant que A_FIABILISER avec l'UAI du REFERENTIEL
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        uai_fiable: UAI_REFERENTIEL,
        siret_fiable: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER,
      });

      assert.deepEqual(nbCoupleFiabilisationValid, 1);
      assert.deepEqual(isCoupleAFiabiliser, true);
    });

    it("Vérifie un retour FALSE pour un couple du TDB pour lequel on trouve un organisme unique dans le référentiel avec le SIRET du TDB mais que l'UAI du Référentiel est vide", async () => {
      // Création d'un organisme dans le référentiel avec un UAI vide
      const { value } = await organismesReferentielDb().findOneAndUpdate(
        { siret: SIRET_REFERENTIEL, nature: "formateur" },
        { $set: { lieux_de_formation: [], relations: [] } },
        { upsert: true, returnDocument: "after" }
      );
      organismeReferentiel = value;

      const UAI_TDB = "9933672E";

      const coupleTdb = { uai: UAI_TDB, siret: SIRET_REFERENTIEL };
      const coupleTdb2 = { uai: "1133672E", siret: SIRET_REFERENTIEL };
      const coupleTdb3 = { uai: "2233672E", siret: SIRET_REFERENTIEL };
      const allTdbCouples = [coupleTdb, coupleTdb2, coupleTdb3];
      const allReferentielOrganismes = [organismeReferentiel];
      const isCoupleAFiabiliser = await checkMatchReferentielSiretUaiDifferent(
        coupleTdb,
        allTdbCouples,
        allReferentielOrganismes
      );

      // Vérification que l'on ajoute aucun couple dans la collection
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({});

      assert.deepEqual(nbCoupleFiabilisationValid, 0);
      assert.deepEqual(isCoupleAFiabiliser, false);
    });

    it("Vérifie un retour FALSE pour un couple du TDB pour lequel on trouve un organisme unique dans le référentiel avec le SIRET du TDB mais que l'UAI du Référentiel est le meme que celui du TDB", async () => {
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: SIRET_REFERENTIEL };
      const coupleTdb2 = { uai: "1133672E", siret: SIRET_REFERENTIEL };
      const coupleTdb3 = { uai: "2233672E", siret: SIRET_REFERENTIEL };
      const allTdbCouples = [coupleTdb, coupleTdb2, coupleTdb3];
      const allReferentielOrganismes = [organismeReferentiel];
      const isCoupleAFiabiliser = await checkMatchReferentielSiretUaiDifferent(
        coupleTdb,
        allTdbCouples,
        allReferentielOrganismes
      );

      // Vérification que l'on ajoute aucun couple dans la collection
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({});

      assert.deepEqual(nbCoupleFiabilisationValid, 0);
      assert.deepEqual(isCoupleAFiabiliser, false);
    });

    it("Vérifie un retour FALSE pour un couple du TDB pour lequel on trouve un organisme unique dans le référentiel avec le SIRET du TDB mais que l'UAI du Référentiel est différent de celui du TDB et que le SIRET n'est pas unique dans tous les couples du TDB", async () => {
      const UAI_TDB = "9933672E";

      const coupleTdb = { uai: UAI_TDB, siret: SIRET_REFERENTIEL };
      const coupleTdb2 = { uai: "1133672E", siret: SIRET_REFERENTIEL };
      const coupleTdb3 = { uai: "2233672E", siret: SIRET_REFERENTIEL };
      const allTdbCouples = [coupleTdb, coupleTdb2, coupleTdb3];
      const allReferentielOrganismes = [organismeReferentiel];
      const isCoupleAFiabiliser = await checkMatchReferentielSiretUaiDifferent(
        coupleTdb,
        allTdbCouples,
        allReferentielOrganismes
      );

      // Vérification que l'on ajoute aucun couple dans la collection
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({});

      assert.deepEqual(nbCoupleFiabilisationValid, 0);
      assert.deepEqual(isCoupleAFiabiliser, false);
    });
  });

  // TODO describe("checkUaiMultiplesRelationsAndLieux")
  // TODO describe("checkSiretMultiplesRelationsAndLieux")

  describe("checkUaiAucunLieuReferentiel", async () => {
    it("Vérifie l'ajout d'une entrée de fiabilisation NON_FIABILISABLE_PB_COLLECTE et un retour TRUE pour un couple du TDB pour lequel l'UAI n'est dans aucun lieu du Référentiel", async () => {
      const UAI_TDB = "9933672E";

      const coupleTdb = { uai: UAI_TDB, siret: SIRET_REFERENTIEL };

      // Ajout d'un organisme pour le couple
      await organismesDb().insertOne({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        nature: "responsable",
        relatedFormations: [],
      });

      const isCouplePbCollecte = await checkUaiAucunLieuReferentiel(coupleTdb);

      // Vérification de la création du couple en tant que NON_FIABILISABLE_PB_COLLECTE
      const nbCoupleFiabilisationPbCollecte = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_PB_COLLECTE,
      });

      const nbOrganismePbCollecte = await organismesDb().countDocuments({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_PB_COLLECTE,
      });

      assert.deepEqual(nbCoupleFiabilisationPbCollecte, 1);
      assert.deepEqual(nbOrganismePbCollecte, 1);
      assert.deepEqual(isCouplePbCollecte, true);
    });

    it("Vérifie un retour FALSE pour un couple du TDB pour lequel l'UAI est présente dans un lieu du Référentiel", async () => {
      const UAI_TDB = "9933672E";

      // Ajout d'un organisme dans le référentiel ayant l'UAI TDB en lieu de formation
      await organismesReferentielDb().findOneAndUpdate(
        { uai: "7733672E", siret: "77370584100099", nature: "formateur" },
        { $set: { lieux_de_formation: [{ uai: UAI_TDB }], relations: [] } },
        { upsert: true }
      );

      const coupleTdb = { uai: UAI_TDB, siret: SIRET_REFERENTIEL };

      // Ajout d'un organisme pour le couple
      await organismesDb().insertOne({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        nature: "responsable",
        relatedFormations: [],
      });

      const isCouplePbCollecte = await checkUaiAucunLieuReferentiel(coupleTdb);

      // Vérification de la non création de couple de fiabilisation
      const nbCoupleFiabilisation = await fiabilisationUaiSiretDb().countDocuments({});

      const nbOrganismePbCollecte = await organismesDb().countDocuments({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_PB_COLLECTE,
      });

      assert.deepEqual(nbCoupleFiabilisation, 0);
      assert.deepEqual(nbOrganismePbCollecte, 0);
      assert.deepEqual(isCouplePbCollecte, false);
    });
  });

  describe("checkCoupleNonFiabilisable", async () => {
    it("Vérifie un retour FALSE pour un couple du TDB pour lequel il existe déja une entrée dans la table de fiabilisation", async () => {
      const UAI_TDB = "9933672E";

      // Ajout du couple à la collection fiabilisationUaiSiret
      await fiabilisationUaiSiretDb().insertOne({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
      });

      // Ajout d'un organisme pour le couple
      await organismesDb().insertOne({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        nature: "responsable",
        relatedFormations: [],
      });

      const coupleTdb = { uai: UAI_TDB, siret: SIRET_REFERENTIEL };
      const isCoupleNonFiabilisable = await checkCoupleNonFiabilisable(coupleTdb);

      const nbCoupleFiabilisation = await fiabilisationUaiSiretDb().countDocuments({});
      const nbOrganismeNonFiabilisable = await organismesDb().countDocuments({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        fiabilisation_statut:
          STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_UAI_VALIDEE ||
          STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_UAI_NON_VALIDEE,
      });

      assert.deepEqual(nbCoupleFiabilisation, 1);
      assert.deepEqual(nbOrganismeNonFiabilisable, 0);
      assert.deepEqual(isCoupleNonFiabilisable, false);
    });

    it("Vérifie l'ajout d'une entrée de fiabilisation NON_FIABILISABLE_UAI_VALIDEE et un retour TRUE pour un couple du TDB pour lequel il existe dans le Référentiel un organisme avec cette UAI", async () => {
      const UAI_TDB = "9933672E";

      // Ajout d'un organisme au référentiel ayant cet UAI
      await organismesReferentielDb().insertOne({
        uai: UAI_TDB,
        siret: "12370584100099",
        nature: "formateur",
        lieux_de_formation: [],
        relations: [],
      });

      // Ajout d'un organisme pour le couple
      await organismesDb().insertOne({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        nature: "responsable",
        relatedFormations: [],
      });

      const coupleTdb = { uai: UAI_TDB, siret: SIRET_REFERENTIEL };
      const isCoupleNonFiabilisable = await checkCoupleNonFiabilisable(coupleTdb);

      const nbCoupleNonFiabilisableMapping = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_VALIDEE,
      });

      const nbOrganismeNonFiabilisableMapping = await organismesDb().countDocuments({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_UAI_VALIDEE,
      });

      assert.deepEqual(nbCoupleNonFiabilisableMapping, 1);
      assert.deepEqual(nbOrganismeNonFiabilisableMapping, 1);
      assert.deepEqual(isCoupleNonFiabilisable, true);
    });

    it("Vérifie l'ajout d'une entrée de fiabilisation NON_FIABILISABLE_UAI_NON_VALIDEE et un retour TRUE pour un couple du TDB pour lequel il existe dans le Référentiel un organisme avec cette UAI", async () => {
      const UAI_TDB = "9933672E";

      // Ajout d'un organisme pour le couple
      await organismesDb().insertOne({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        nature: "responsable",
        relatedFormations: [],
      });

      const coupleTdb = { uai: UAI_TDB, siret: SIRET_REFERENTIEL };
      const isCoupleNonFiabilisable = await checkCoupleNonFiabilisable(coupleTdb);

      const nbCoupleNonFiabilisableUaiNonValidee = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_NON_VALIDEE,
      });

      const nbOrganismeNonFiabilisableUaiNonValidee = await organismesDb().countDocuments({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_UAI_NON_VALIDEE,
      });

      assert.deepEqual(nbCoupleNonFiabilisableUaiNonValidee, 1);
      assert.deepEqual(nbOrganismeNonFiabilisableUaiNonValidee, 1);
      assert.deepEqual(isCoupleNonFiabilisable, true);
    });
  });

  describe("buildFiabilisationCoupleForTdbCouple", async () => {
    it("Vérifie l'ajout d'une entrée de fiabilisation FIABLE pour un couple du TDB dont le SIRET et l'UAI sont trouvés dans le Référentiel", async () => {
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

    it("Vérifie l'ajout d'une entrée de fiabilisation A_FIABILISER pour un couple du TDB pour lequel on trouve un organisme unique dans le Référentiel avec l'UAI du TDB mais que le SIRET du TDB est vide et que l'UAI est unique dans tous les couples du TDB", async () => {
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

    it("Vérifie l'ajout d'une entrée de fiabilisation NON_FIABILISABLE_UAI_VALIDEE pour un couple du TDB pour lequel on trouve un organisme unique dans le Référentiel avec l'UAI du TDB mais que le SIRET du TDB est vide et que l'UAI n'est pas unique dans tous les couples du TDB", async () => {
      // Construction de la collection de fiabilisation pour un couple avec cet UAI mais sans siret
      // avec une liste de couples du TDB contenant des doublons d'UAI et une liste d'organismes du référentiel simple
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: null };
      const coupleTdb2 = { uai: UAI_REFERENTIEL, siret: "77370584100099" };
      const coupleTdb3 = { uai: UAI_REFERENTIEL, siret: "88370584100099" };
      const allTdbCouples = [coupleTdb, coupleTdb2, coupleTdb3];
      const allReferentielOrganismes = [organismeReferentiel];
      await buildFiabilisationCoupleForTdbCouple(coupleTdb, allTdbCouples, allReferentielOrganismes);

      // Vérification de la création du couple en tant que NON_FIABILISABLE_UAI_VALIDEE car l'UAI existe bien dans le référentiel
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_REFERENTIEL,
        siret: null,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_VALIDEE,
      });
      assert.deepEqual(nbCoupleFiabilisationValid, 1);
    });

    it("Vérifie l'ajout d'une entrée de fiabilisation A_FIABILISER pour un couple du TDB pour lequel on trouve un organisme unique dans le Référentiel avec l'UAI du TDB mais que le SIRET du TDB n'est pas le même dans le Référentiel et que l'UAI est unique dans tous les couples du TDB", async () => {
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

    it("Vérifie l'ajout d'une entrée de fiabilisation NON_FIABILISABLE_UAI_VALIDEE pour un couple du TDB pour lequel on trouve un organisme unique dans le Référentiel avec l'UAI du TDB mais que le SIRET du TDB n'est pas le même dans le Référentiel et que l'UAI n'est pas unique dans tous les couples du TDB", async () => {
      const SIRET_TDB = "11110584101111";

      // Construction de la collection de fiabilisation pour un couple avec cet UAI mais un siret différent
      // avec une liste de couples du TDB contenant des doublons de cet UAI et une liste d'organismes du référentiel simple
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: SIRET_TDB };
      const coupleTdb2 = { uai: UAI_REFERENTIEL, siret: "22110584101111" };
      const coupleTdb3 = { uai: UAI_REFERENTIEL, siret: "33110584101111" };
      const allTdbCouples = [coupleTdb, coupleTdb2, coupleTdb3];
      const allReferentielOrganismes = [organismeReferentiel];
      await buildFiabilisationCoupleForTdbCouple(coupleTdb, allTdbCouples, allReferentielOrganismes);

      // Vérification de la création du couple en tant que NON_FIABILISABLE_UAI_VALIDEE car l'UAI existe bien dans le référentiel
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_REFERENTIEL,
        siret: SIRET_TDB,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_VALIDEE,
      });
      assert.deepEqual(nbCoupleFiabilisationValid, 1);
    });

    it("Vérifie l'ajout d'une entrée de fiabilisation A_FIABILISER pour un couple du TDB pour lequel on trouve un organisme unique dans le référentiel avec le SIRET du TDB mais que l'UAI du Référentiel est différent de celui du TDB et que le SIRET est unique dans tous les couples du TDB", async () => {
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

    it("Vérifie l'ajout d'une entrée de fiabilisation NON_FIABILISABLE_UAI_NON_VALIDEE pour un couple du TDB pour lequel on trouve un organisme unique dans le référentiel avec le SIRET du TDB mais que l'UAI du Référentiel est différent de celui du TDB et que le SIRET n'est pas unique dans tous les couples du TDB", async () => {
      const UAI_TDB = "9933672E";

      // Ajout d'un organisme dans le référentiel ayant l'UAI TDB en lieu de formation
      await organismesReferentielDb().findOneAndUpdate(
        { uai: "7733672E", siret: "77370584100099", nature: "formateur" },
        { $set: { lieux_de_formation: [{ uai: UAI_TDB }], relations: [] } },
        { upsert: true }
      );

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

    it("Vérifie l'ajout d'une entrée de fiabilisation NON_FIABILISABLE_UAI_VALIDEE pour un couple du TDB pour lequel on trouve un organisme unique dans le référentiel avec le SIRET du TDB mais que l'UAI du Référentiel est différent de celui du TDB et que le SIRET n'est pas unique dans tous les couples du TDB mais que l'UAI est présente dans le référentiel", async () => {
      const UAI_TDB = "9933672E";
      const SIRET_REFERENTIEL2 = "12000000000000";

      // Création d'un autre organisme dans le Référentiel avec le couple contenant l'UAI du TDB
      await organismesReferentielDb().insertOne({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL2,
        nature: "formateur",
        lieux_de_formation: [{ uai: UAI_TDB }],
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

      // Vérification de la création du couple en tant que NON_FIABILISABLE_UAI_VALIDEE car l'UAI est dans le Référentiel
      const nbCoupleFiabilisationValid = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_VALIDEE,
      });
      assert.deepEqual(nbCoupleFiabilisationValid, 1);
    });

    it("Vérifie l'ajout d'une entrée de fiabilisation NON_FIABILISABLE_UAI_NON_VALIDEE pour un couple du TDB pour lequel on trouve un organisme unique dans le référentiel avec le SIRET du TDB mais que dans le Référentiel il n'y a aucune UAI", async () => {
      const SIRET_REFERENTIEL = "123450584100099";
      const UAI_TDB = "3355672E";

      // Création d'un organisme dans le référentiel avec un couple
      const { value: organismeReferentielSansUai } = await organismesReferentielDb().findOneAndUpdate(
        { siret: SIRET_REFERENTIEL, nature: "formateur" },
        { $set: { lieux_de_formation: [{ uai: UAI_TDB }] } },
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

    it("Vérifie l'ajout d'une entrée de fiabilisation FIABLE pour un couple du TDB pour lequel on trouve un organisme unique dans le référentiel avec le SIRET du TDB et que dans le Référentiel l'UAI est le même que dans le TDB", async () => {
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
