import { strict as assert } from "assert";

import { STATUT_FIABILISATION_COUPLES_UAI_SIRET, STATUT_FIABILISATION_ORGANISME } from "shared";

import { OrganismesReferentiel } from "@/common/model/@types";
import { organismesReferentielDb, fiabilisationUaiSiretDb, organismesDb } from "@/common/model/collections";
import { buildFiabilisationCoupleForTdbCouple } from "@/jobs/fiabilisation/uai-siret/build";
import {
  checkCoupleFiable,
  checkCoupleNonFiabilisable,
  checkMatchReferentielSiretUaiDifferent,
  checkMatchReferentielUaiUniqueSiretDifferent,
  checkUaiAucunLieuReferentiel,
  checkUaiLieuReferentiel,
} from "@/jobs/fiabilisation/uai-siret/build.rules";
import { useMongo } from "@tests/jest/setupMongo";

describe("Job Build Fiabilisation UAI SIRET", () => {
  const UAI_REFERENTIEL = "7722672E";
  const SIRET_REFERENTIEL = "99370584100099";
  let organismeReferentiel;

  useMongo();
  beforeEach(async () => {
    // Création d'un organisme dans le référentiel avec un couple
    const { value } = await organismesReferentielDb().findOneAndUpdate(
      { uai: UAI_REFERENTIEL, siret: SIRET_REFERENTIEL, nature: "formateur" },
      { $set: { lieux_de_formation: [{ uai: UAI_REFERENTIEL }], relations: [] } },
      { upsert: true, returnDocument: "after" }
    );
    organismeReferentiel = value;
  });

  describe("checkCoupleFiable", () => {
    it("Vérifie l'ajout d'une entrée de fiabilisation FIABLE et un retour TRUE pour un couple du TDB dont le SIRET et l'UAI sont trouvés dans le Référentiel", async () => {
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: SIRET_REFERENTIEL };

      // Ajout d'un organisme pour le couple
      await organismesDb().insertOne({
        uai: UAI_REFERENTIEL,
        siret: SIRET_REFERENTIEL,
        nature: "responsable",
        relatedFormations: [],
      });

      const allReferentielOrganismes: OrganismesReferentiel[] = [organismeReferentiel];
      const isCoupleFiable = await checkCoupleFiable(coupleTdb, allReferentielOrganismes);
      assert.deepEqual(isCoupleFiable, true);

      // Vérification de la création du couple en tant que FIABLE
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb().countDocuments({
        uai: UAI_REFERENTIEL,
        siret: SIRET_REFERENTIEL,
        type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.FIABLE,
      });

      const nbOrganismeFiable = await organismesDb().countDocuments({
        uai: UAI_REFERENTIEL,
        siret: SIRET_REFERENTIEL,
        fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.FIABLE,
      });

      assert.deepEqual(fiabilisationUaiSiret, 1);
      assert.deepEqual(nbOrganismeFiable, 1);
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

      const allReferentielOrganismes: OrganismesReferentiel[] = [organismeReferentiel];
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

  describe("checkMatchReferentielUaiUniqueSiretDifferent", () => {
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
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb()
        .find({
          uai: UAI_REFERENTIEL,
          siret: null,
          uai_fiable: UAI_REFERENTIEL,
          siret_fiable: SIRET_REFERENTIEL,
        })
        .toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER);

      expect(isCoupleAFiabiliser).toBe(true);
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
      expect(isCoupleAFiabiliser).toBe(true);

      // Vérification de la création du couple en tant que A_FIABILISER
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb()
        .find({
          uai: UAI_REFERENTIEL,
          siret: SIRET_TDB,
          uai_fiable: UAI_REFERENTIEL,
          siret_fiable: SIRET_REFERENTIEL,
        })
        .toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER);
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
      expect(isCoupleAFiabiliser).toBe(false);

      // Vérification que l'on ajoute aucun couple dans la collection
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb().find({}).toArray();
      expect(fiabilisationUaiSiret).toHaveLength(0);
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
      expect(isCoupleAFiabiliser).toBe(false);

      // Vérification que l'on ajoute aucun couple dans la collection
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb().find({}).toArray();
      expect(fiabilisationUaiSiret).toHaveLength(0);
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
      expect(isCoupleAFiabiliser).toBe(false);

      // Vérification que l'on ajoute aucun couple dans la collection
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb().find({}).toArray();
      expect(fiabilisationUaiSiret).toHaveLength(0);
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
      expect(isCoupleAFiabiliser).toBe(false);

      // Vérification que l'on ajoute aucun couple dans la collection
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb().find({}).toArray();
      expect(fiabilisationUaiSiret).toHaveLength(0);
    });
  });

  describe("checkMatchReferentielSiretUaiDifferent", () => {
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
      expect(isCoupleAFiabiliser).toBe(true);

      // Vérification de la création du couple en tant que A_FIABILISER avec l'UAI du REFERENTIEL
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb()
        .find({
          uai: UAI_TDB,
          siret: SIRET_REFERENTIEL,
          uai_fiable: UAI_REFERENTIEL,
          siret_fiable: SIRET_REFERENTIEL,
        })
        .toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER);
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
      expect(isCoupleAFiabiliser).toBe(false);

      // Vérification que l'on ajoute aucun couple dans la collection
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb().find({}).toArray();
      expect(fiabilisationUaiSiret).toHaveLength(0);
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
      expect(isCoupleAFiabiliser).toBe(false);

      // Vérification que l'on ajoute aucun couple dans la collection
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb().find({}).toArray();
      expect(fiabilisationUaiSiret).toHaveLength(0);
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
      expect(isCoupleAFiabiliser).toBe(false);

      // Vérification que l'on ajoute aucun couple dans la collection
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb().find({}).toArray();
      expect(fiabilisationUaiSiret).toHaveLength(0);
    });
  });

  // TODO describe("checkUaiMultiplesRelationsAndLieux")
  // TODO describe("checkSiretMultiplesRelationsAndLieux")

  describe("checkUaiAucunLieuReferentiel", () => {
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
      assert.deepEqual(isCouplePbCollecte, true);

      // Vérification de la création du couple en tant que NON_FIABILISABLE_PB_COLLECTE
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb()
        .find({
          uai: UAI_TDB,
          siret: SIRET_REFERENTIEL,
          type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_PB_COLLECTE,
        })
        .toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_PB_COLLECTE);

      const org = await organismesDb()
        .find({
          uai: UAI_TDB,
          siret: SIRET_REFERENTIEL,
          fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_PB_COLLECTE,
        })
        .toArray();
      expect(org).toHaveLength(1);
      expect(org[0].fiabilisation_statut).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_PB_COLLECTE);
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
      assert.deepEqual(isCouplePbCollecte, false);

      // Vérification de la non création de couple de fiabilisation
      const nbCoupleFiabilisation = await fiabilisationUaiSiretDb().countDocuments({});

      const nbOrganismePbCollecte = await organismesDb().countDocuments({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.NON_FIABILISABLE_PB_COLLECTE,
      });

      assert.deepEqual(nbCoupleFiabilisation, 0);
      assert.deepEqual(nbOrganismePbCollecte, 0);
    });
  });

  describe("checkUaiLieuReferentiel", () => {
    it("Vérifie l'ajout d'une entrée de fiabilisation A_FIABILISER et un retour TRUE pour un couple du TDB pour lequel l'UAI est dans un lieu du Référentiel", async () => {
      const UAI_TDB = "9933672E";

      // Ajout d'un organisme dans le référentiel ayant l'UAI TDB en lieu de formation
      await organismesReferentielDb().findOneAndUpdate(
        { uai: "7733672E", siret: "77370584100099", nature: "formateur" },
        { $set: { lieux_de_formation: [{ uai: UAI_TDB }], relations: [] } },
        { upsert: true }
      );

      const coupleTdb = { uai: UAI_TDB, siret: SIRET_REFERENTIEL };
      const isUAIInLieux = await checkUaiLieuReferentiel(coupleTdb);
      assert.deepEqual(isUAIInLieux, true);

      // Vérification de la création du couple en tant que NON_FIABILISABLE_PB_COLLECTE
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb()
        .find({
          uai: UAI_TDB,
          siret: SIRET_REFERENTIEL,
          uai_fiable: UAI_TDB,
          siret_fiable: "77370584100099",
        })
        .toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER);
    });

    it("Vérifie un retour FALSE pour un couple du TDB pour lequel l'UAI n'est pas présente dans un lieu du Référentiel", async () => {
      const UAI_TDB = "9933672E";

      const coupleTdb = { uai: UAI_TDB, siret: SIRET_REFERENTIEL };

      // Ajout d'un organisme pour le couple
      await organismesDb().insertOne({
        uai: UAI_TDB,
        siret: SIRET_REFERENTIEL,
        nature: "responsable",
        relatedFormations: [],
      });

      const isUAIInLieux = await checkUaiLieuReferentiel(coupleTdb);

      // Vérification de la non création de couple de fiabilisation
      const nbCoupleFiabilisation = await fiabilisationUaiSiretDb().countDocuments({});

      assert.deepEqual(nbCoupleFiabilisation, 0);
      assert.deepEqual(isUAIInLieux, false);
    });
  });

  describe("checkCoupleNonFiabilisable", () => {
    it("Vérifie un retour FALSE pour un couple du TDB pour lequel il existe déjà une entrée dans la table de fiabilisation", async () => {
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
      assert.deepEqual(isCoupleNonFiabilisable, false);

      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb().find({}).toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(undefined);

      const org = await organismesDb()
        .find({
          uai: UAI_TDB,
          siret: SIRET_REFERENTIEL,
        })
        .toArray();
      expect(org).toHaveLength(1);
      expect(org[0].fiabilisation_statut).toBe(undefined);
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
      assert.deepEqual(isCoupleNonFiabilisable, true);

      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb()
        .find({
          uai: UAI_TDB,
          siret: SIRET_REFERENTIEL,
          type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_VALIDEE,
        })
        .toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_VALIDEE);

      const org = await organismesDb()
        .find({
          uai: UAI_TDB,
          siret: SIRET_REFERENTIEL,
        })
        .toArray();
      expect(org).toHaveLength(1);
      expect(org[0].fiabilisation_statut).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_VALIDEE);
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
      assert.deepEqual(isCoupleNonFiabilisable, true);

      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb()
        .find({
          uai: UAI_TDB,
          siret: SIRET_REFERENTIEL,
          type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_NON_VALIDEE,
        })
        .toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(
        STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_NON_VALIDEE
      );

      const org = await organismesDb()
        .find({
          uai: UAI_TDB,
          siret: SIRET_REFERENTIEL,
        })
        .toArray();
      expect(org).toHaveLength(1);
      expect(org[0].fiabilisation_statut).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.NON_FIABILISABLE_UAI_NON_VALIDEE);
    });
  });

  describe("buildFiabilisationCoupleForTdbCouple", () => {
    it("Vérifie l'ajout d'une entrée de fiabilisation FIABLE pour un couple du TDB dont le SIRET et l'UAI sont trouvés dans le Référentiel", async () => {
      // Construction de la collection de fiabilisation pour ce couple,
      // avec une liste de couples du TDB simple et une liste d'organismes du référentiel simple
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: SIRET_REFERENTIEL };
      const allTdbCouples = [coupleTdb];
      const allReferentielOrganismes = [organismeReferentiel];
      await buildFiabilisationCoupleForTdbCouple(coupleTdb, allTdbCouples, allReferentielOrganismes);

      // Vérification de la création du couple en tant que FIABLE
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb()
        .find({
          uai: UAI_REFERENTIEL,
          siret: SIRET_REFERENTIEL,
          type: STATUT_FIABILISATION_COUPLES_UAI_SIRET.FIABLE,
        })
        .toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.FIABLE);
    });

    it("Vérifie l'ajout d'une entrée de fiabilisation A_FIABILISER pour un couple du TDB pour lequel on trouve un organisme unique dans le Référentiel avec l'UAI du TDB mais que le SIRET du TDB est vide et que l'UAI est unique dans tous les couples du TDB", async () => {
      // Construction de la collection de fiabilisation pour un couple avec cet UAI mais sans siret
      // avec une liste de couples du TDB simple et une liste d'organismes du référentiel simple
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: null };
      const allTdbCouples = [coupleTdb];
      const allReferentielOrganismes = [organismeReferentiel];
      await buildFiabilisationCoupleForTdbCouple(coupleTdb, allTdbCouples, allReferentielOrganismes);

      // Vérification de la création du couple en tant que A_FIABILISER
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb()
        .find({
          uai: UAI_REFERENTIEL,
          siret: null,
          uai_fiable: UAI_REFERENTIEL,
          siret_fiable: SIRET_REFERENTIEL,
        })
        .toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER);
    });

    it("Vérifie l'ajout d'une entrée de fiabilisation A_FIABILISER pour un couple du TDB pour lequel on trouve un organisme unique dans le Référentiel avec l'UAI du TDB mais que le SIRET du TDB est vide et que l'UAI n'est pas unique dans tous les couples du TDB", async () => {
      // Construction de la collection de fiabilisation pour un couple avec cet UAI mais sans siret
      // avec une liste de couples du TDB contenant des doublons d'UAI et une liste d'organismes du référentiel simple
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: null };
      const coupleTdb2 = { uai: UAI_REFERENTIEL, siret: "77370584100099" };
      const coupleTdb3 = { uai: UAI_REFERENTIEL, siret: "88370584100099" };
      const allTdbCouples = [coupleTdb, coupleTdb2, coupleTdb3];
      const allReferentielOrganismes = [organismeReferentiel];
      await buildFiabilisationCoupleForTdbCouple(coupleTdb, allTdbCouples, allReferentielOrganismes);

      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb()
        .find({
          uai: UAI_REFERENTIEL,
          siret: null,
        })
        .toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER);
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
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb()
        .find({
          uai: UAI_REFERENTIEL,
          siret: SIRET_TDB,
          uai_fiable: UAI_REFERENTIEL,
          siret_fiable: SIRET_REFERENTIEL,
        })
        .toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER);
    });

    it("Vérifie l'ajout d'une entrée de fiabilisation A_FIABILISER pour un couple du TDB pour lequel on trouve un organisme unique dans le Référentiel avec l'UAI du TDB mais que le SIRET du TDB n'est pas le même dans le Référentiel et que l'UAI n'est pas unique dans tous les couples du TDB", async () => {
      const SIRET_TDB = "11110584101111";

      // Construction de la collection de fiabilisation pour un couple avec cet UAI mais un siret différent
      // avec une liste de couples du TDB contenant des doublons de cet UAI et une liste d'organismes du référentiel simple
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: SIRET_TDB };
      const coupleTdb2 = { uai: UAI_REFERENTIEL, siret: "22110584101111" };
      const coupleTdb3 = { uai: UAI_REFERENTIEL, siret: "33110584101111" };
      const allTdbCouples = [coupleTdb, coupleTdb2, coupleTdb3];
      const allReferentielOrganismes = [organismeReferentiel];
      await buildFiabilisationCoupleForTdbCouple(coupleTdb, allTdbCouples, allReferentielOrganismes);

      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb()
        .find({
          uai: UAI_REFERENTIEL,
          siret: SIRET_TDB,
        })
        .toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER);
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
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb()
        .find({
          uai: UAI_TDB,
          siret: SIRET_REFERENTIEL,
          uai_fiable: UAI_REFERENTIEL,
          siret_fiable: SIRET_REFERENTIEL,
        })
        .toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER);
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
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb()
        .find({
          uai: UAI_TDB,
          siret: SIRET_REFERENTIEL,
        })
        .toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER);
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
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb()
        .find({
          uai: UAI_TDB,
          siret: SIRET_REFERENTIEL,
        })
        .toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER);
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

      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb()
        .find({
          uai: UAI_TDB,
          siret: SIRET_REFERENTIEL,
        })
        .toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.A_FIABILISER);
    });

    it("Vérifie l'ajout d'une entrée de fiabilisation FIABLE pour un couple du TDB pour lequel on trouve un organisme unique dans le référentiel avec le SIRET du TDB et que dans le Référentiel l'UAI est le même que dans le TDB", async () => {
      // Construction de la collection de fiabilisation pour un couple avec le SIRET du référentiel et un UAI différent du référentiel
      // avec une liste de couples du TDB simple et une liste d'organismes du référentiel simple
      const coupleTdb = { uai: UAI_REFERENTIEL, siret: SIRET_REFERENTIEL };
      const allTdbCouples = [coupleTdb];
      const allReferentielOrganismes = [organismeReferentiel];
      await buildFiabilisationCoupleForTdbCouple(coupleTdb, allTdbCouples, allReferentielOrganismes);

      // Vérification de la création du couple en tant que NON_FIABILISABLE_UAI_NON_VALIDEE car l'UAI n'est pas dans le référentiel
      const fiabilisationUaiSiret = await fiabilisationUaiSiretDb()
        .find({
          uai: UAI_REFERENTIEL,
          siret: SIRET_REFERENTIEL,
        })
        .toArray();
      expect(fiabilisationUaiSiret).toHaveLength(1);
      expect(fiabilisationUaiSiret[0].type).toBe(STATUT_FIABILISATION_COUPLES_UAI_SIRET.FIABLE);
    });
  });
});
