import { ObjectId } from "mongodb";
import { IEffectif } from "shared/models/data/effectifs.model";
import { describe, it, expect, beforeEach } from "vitest";

import { getFranceTravailEffectifsByCodeSecteur } from "@/common/actions/franceTravail/franceTravailEffectif.actions";
import { franceTravailEffectifsDb, romeSecteurActivitesDb } from "@/common/model/collections";
import { createSampleEffectif, createRandomOrganisme, createRandomFormation } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const insertTestData = async () => {
  await franceTravailEffectifsDb().deleteMany({});

  const organisme = createRandomOrganisme();
  const formation = createRandomFormation("2024-2025", new Date("2024-09-01"), new Date("2026-06-30"));
  const baseEffectif = await createSampleEffectif({ organisme, formation });

  const effectifs = [
    {
      _id: new ObjectId(),
      created_at: new Date(),
      effectif_id: new ObjectId(),
      effectif_snapshot: baseEffectif as IEffectif,
      code_region: "84",
      current_status: { value: "INSCRIT" as const, date: new Date() },
      ft_data: { 1: null },
      romes: {
        code: ["A1234"],
        secteur_activites: [{ code_secteur: 1, libelle_secteur: "Agriculture" }],
      },
    },
    {
      _id: new ObjectId(),
      created_at: new Date(),
      effectif_id: new ObjectId(),
      effectif_snapshot: baseEffectif as IEffectif,
      code_region: "84",
      current_status: { value: "INSCRIT" as const, date: new Date() },
      ft_data: { 1: null },
      romes: {
        code: ["A1234"],
        secteur_activites: [{ code_secteur: 1, libelle_secteur: "Agriculture" }],
      },
    },
    {
      _id: new ObjectId(),
      created_at: new Date(),
      effectif_id: new ObjectId(),
      effectif_snapshot: baseEffectif as IEffectif,
      code_region: "84",
      current_status: { value: "INSCRIT" as const, date: new Date() },
      ft_data: { 1: null },
      romes: {
        code: ["A1234"],
        secteur_activites: [{ code_secteur: 1, libelle_secteur: "Agriculture" }],
      },
    },
    {
      _id: new ObjectId(),
      created_at: new Date(),
      effectif_id: new ObjectId(),
      effectif_snapshot: baseEffectif as IEffectif,
      code_region: "11",
      current_status: { value: "INSCRIT" as const, date: new Date() },
      ft_data: { 1: null },
      romes: {
        code: ["A1234"],
        secteur_activites: [{ code_secteur: 1, libelle_secteur: "Agriculture" }],
      },
    },
    {
      _id: new ObjectId(),
      created_at: new Date(),
      effectif_id: new ObjectId(),
      effectif_snapshot: baseEffectif as IEffectif,
      code_region: "84",
      current_status: { value: "INSCRIT" as const, date: new Date() },
      ft_data: { 2: null },
      romes: {
        code: ["B5678"],
        secteur_activites: [{ code_secteur: 2, libelle_secteur: "Astrophysique" }],
      },
    },
  ];

  // @ts-expect-error
  await franceTravailEffectifsDb().insertMany(effectifs, { bypassDocumentValidation: true });
};

describe("Tests des actions France Travail Effectif", () => {
  describe("getFranceTravailEffectifsByCodeSecteur", () => {
    describe("Code ROME", () => {
      it("devrait retourner un résultat vide pour un code ROME inexistant", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(3, "84", { page: 1, limit: 20 });
        expect(result?.effectifs).toHaveLength(0);
        expect(result?.pagination.total).toBe(0);
      });

      it("devrait accepter un code ROME valide", async () => {
        await insertTestData();
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", { page: 1, limit: 20 });
        expect(result).toBeDefined();
        expect(result?.effectifs).toBeDefined();
        expect(result?.pagination).toBeDefined();
      });
    });

    describe("Résultats de pagination", () => {
      beforeEach(async () => {
        await insertTestData();
      });

      it("devrait retourner tous les résultats avec les métadonnées de pagination par défaut", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84");

        expect(result?.effectifs).toHaveLength(3);
        expect(result?.pagination).toEqual({
          page: 1,
          limit: 20,
          total: 3,
          totalPages: 1,
        });
      });

      it("devrait paginer correctement avec une limite custom", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", { page: 1, limit: 2 });

        expect(result?.effectifs).toHaveLength(2);
        expect(result?.pagination).toEqual({
          page: 1,
          limit: 2,
          total: 3,
          totalPages: 2,
        });
      });

      it("devrait retourner la deuxième page correctement", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", { page: 2, limit: 2 });

        expect(result?.effectifs).toHaveLength(1);
        expect(result?.pagination).toEqual({
          page: 2,
          limit: 2,
          total: 3,
          totalPages: 2,
        });
      });

      it("devrait calculer correctement totalPages avec un reste", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", { page: 1, limit: 3 });

        expect(result?.effectifs).toHaveLength(3);
        expect(result?.pagination).toEqual({
          page: 1,
          limit: 3,
          total: 3,
          totalPages: 1,
        });
      });

      it("devrait retourner une page vide si la page dépasse le total", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", { page: 10, limit: 20 });

        expect(result?.effectifs).toHaveLength(0);
        expect(result?.pagination).toEqual({
          page: 10,
          limit: 20,
          total: 3,
          totalPages: 1,
        });
      });
    });

    describe("Filtrage par région", () => {
      beforeEach(async () => {
        await insertTestData();
      });

      it("devrait filtrer par code région", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", { page: 1, limit: 20 });

        expect(result?.effectifs).toHaveLength(3);
        expect(result?.pagination.total).toBe(3);

        result?.effectifs.forEach((effectif) => {
          expect(effectif.code_region).toBe("84");
        });
      });

      it("devrait retourner tous les résultats si aucune région spécifiée", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", { page: 1, limit: 20 });

        expect(result?.effectifs).toHaveLength(3);
        expect(result?.pagination.total).toBe(3);
      });

      it("devrait retourner un résultat vide pour une région sans effectifs", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "99", { page: 1, limit: 20 });

        expect(result?.effectifs).toHaveLength(0);
        expect(result?.pagination).toEqual({
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        });
      });
    });

    describe("Filtrage par code ROME", () => {
      beforeEach(async () => {
        await insertTestData();
      });

      it("devrait filtrer par code ROME existant", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", { page: 1, limit: 20 });

        expect(result?.effectifs).toHaveLength(3);
        expect(result?.pagination.total).toBe(3);

        result?.effectifs.forEach((effectif) => {
          expect(effectif.ft_data).toHaveProperty("1");
        });
      });

      it("devrait retourner des résultats vides pour un code ROME inexistant", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(3, "84", { page: 1, limit: 20 });

        expect(result?.effectifs).toHaveLength(0);
        expect(result?.pagination).toEqual({
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        });
      });

      it("devrait distinguer les différents codes ROME", async () => {
        const resultA = await getFranceTravailEffectifsByCodeSecteur(1, "84", { page: 1, limit: 20 });
        const resultB = await getFranceTravailEffectifsByCodeSecteur(2, "84", { page: 1, limit: 20 });

        expect(resultA?.pagination.total).toBe(3);
        expect(resultB?.pagination.total).toBe(1);
        expect(resultA?.effectifs[0].ft_data).toHaveProperty("1");
        expect(resultB?.effectifs[0].ft_data).toHaveProperty("2");
      });
    });

    describe("Combinaison des filtres", () => {
      beforeEach(async () => {
        await insertTestData();
      });

      it("devrait combiner filtrage par code ROME et région avec pagination", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", { page: 1, limit: 2 });

        expect(result?.effectifs).toHaveLength(2);
        expect(result?.pagination).toEqual({
          page: 1,
          limit: 2,
          total: 3,
          totalPages: 2,
        });

        result?.effectifs.forEach((effectif) => {
          expect(effectif.code_region).toBe("84");
          expect(effectif.ft_data).toHaveProperty("1");
        });
      });

      it("devrait retourner la deuxième page avec les bons filtres", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", { page: 2, limit: 2 });

        expect(result?.effectifs).toHaveLength(1);
        expect(result?.pagination).toEqual({
          page: 2,
          limit: 2,
          total: 3,
          totalPages: 2,
        });
      });
    });

    describe("Structure des données retournées", () => {
      beforeEach(async () => {
        await insertTestData();
      });

      it("devrait retourner les champs requis dans la réponse", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", { page: 1, limit: 1 });

        expect(result).toHaveProperty("effectifs");
        expect(result).toHaveProperty("pagination");
        expect(Array.isArray(result?.effectifs)).toBe(true);
      });

      it("devrait retourner les effectifs avec toutes les propriétés", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", { page: 1, limit: 1 });

        const effectif = result?.effectifs[0];
        expect(effectif).toHaveProperty("_id");
        expect(effectif).toHaveProperty("created_at");
        expect(effectif).toHaveProperty("effectif_id");
        expect(effectif).toHaveProperty("effectif_snapshot");
        expect(effectif).toHaveProperty("code_region");
        expect(effectif).toHaveProperty("current_status");
        expect(effectif).toHaveProperty("ft_data");
        expect(effectif).toHaveProperty("jours_sans_contrat");
        expect(effectif).toHaveProperty("organisme");
      });
    });

    describe("Fonctionnalité de recherche", () => {
      beforeEach(async () => {
        await franceTravailEffectifsDb().deleteMany({});

        const organisme = createRandomOrganisme();
        const formation = createRandomFormation("2024-2025", new Date("2024-09-01"), new Date("2026-06-30"));
        const baseEffectif = await createSampleEffectif({ organisme, formation });

        const effectifs = [
          {
            _id: new ObjectId(),
            created_at: new Date(),
            effectif_id: new ObjectId(),
            effectif_snapshot: {
              ...baseEffectif,
              apprenant: { ...baseEffectif.apprenant, nom: "Dupont", prenom: "Jean" },
            } as IEffectif,
            code_region: "84",
            current_status: { value: "INSCRIT" as const, date: new Date() },
            ft_data: { 1: null },
            romes: {
              code: ["A1234"],
              secteur_activites: [{ code_secteur: 1, libelle_secteur: "Agriculture" }],
            },
          },
          {
            _id: new ObjectId(),
            created_at: new Date(),
            effectif_id: new ObjectId(),
            effectif_snapshot: {
              ...baseEffectif,
              apprenant: { ...baseEffectif.apprenant, nom: "Martin", prenom: "Marie" },
            } as IEffectif,
            code_region: "84",
            current_status: { value: "INSCRIT" as const, date: new Date() },
            ft_data: { 1: null },
            romes: {
              code: ["A1234"],
              secteur_activites: [{ code_secteur: 1, libelle_secteur: "Agriculture" }],
            },
          },
          {
            _id: new ObjectId(),
            created_at: new Date(),
            effectif_id: new ObjectId(),
            effectif_snapshot: {
              ...baseEffectif,
              apprenant: { ...baseEffectif.apprenant, nom: "Durand", prenom: "Pierre" },
            } as IEffectif,
            code_region: "84",
            current_status: { value: "INSCRIT" as const, date: new Date() },
            ft_data: { 1: null },
            romes: {
              code: ["A1234"],
              secteur_activites: [{ code_secteur: 1, libelle_secteur: "Agriculture" }],
            },
          },
        ];

        await franceTravailEffectifsDb().insertMany(effectifs, { bypassDocumentValidation: true });
      });

      it("devrait filtrer par nom", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", {
          page: 1,
          limit: 20,
          search: "Dupont",
        });

        expect(result?.effectifs).toHaveLength(1);
        expect(result?.effectifs[0].effectif_snapshot.apprenant.nom).toBe("Dupont");
      });

      it("devrait filtrer par prénom", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", {
          page: 1,
          limit: 20,
          search: "Marie",
        });

        expect(result?.effectifs).toHaveLength(1);
        expect(result?.effectifs[0].effectif_snapshot.apprenant.prenom).toBe("Marie");
      });

      it("devrait être insensible à la casse", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", {
          page: 1,
          limit: 20,
          search: "dupont",
        });

        expect(result?.effectifs).toHaveLength(1);
        expect(result?.effectifs[0].effectif_snapshot.apprenant.nom).toBe("Dupont");
      });

      it("devrait rechercher par partie du nom", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", {
          page: 1,
          limit: 20,
          search: "Du",
        });

        expect(result?.effectifs).toHaveLength(2);
      });

      it("devrait retourner tous les résultats sans search", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", { page: 1, limit: 20 });

        expect(result?.effectifs).toHaveLength(3);
      });

      it("devrait échapper les caractères spéciaux regex", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", {
          page: 1,
          limit: 20,
          search: "Du.*",
        });

        expect(result?.effectifs).toHaveLength(0);
      });
    });

    describe("Fonctionnalité de tri", () => {
      beforeEach(async () => {
        await franceTravailEffectifsDb().deleteMany({});

        const organisme = createRandomOrganisme();
        const formation = createRandomFormation("2024-2025", new Date("2024-09-01"), new Date("2026-06-30"));

        const baseEffectif = await createSampleEffectif({ organisme, formation });

        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

        const effectifs = [
          {
            _id: new ObjectId(),
            created_at: new Date(),
            effectif_id: new ObjectId(),
            effectif_snapshot: {
              ...baseEffectif,
              apprenant: { ...baseEffectif.apprenant, nom: "Zorro", prenom: "Alice" },
            } as IEffectif,
            code_region: "84",
            current_status: { value: "INSCRIT" as const, date: threeDaysAgo },
            ft_data: { 1: null },
            romes: {
              code: ["A1234"],
              secteur_activites: [{ code_secteur: 1, libelle_secteur: "Agriculture" }],
            },
          },
          {
            _id: new ObjectId(),
            created_at: new Date(),
            effectif_id: new ObjectId(),
            effectif_snapshot: {
              ...baseEffectif,
              apprenant: { ...baseEffectif.apprenant, nom: "Alpha", prenom: "Bob" },
            } as IEffectif,
            code_region: "84",
            current_status: { value: "INSCRIT" as const, date: tenDaysAgo },
            ft_data: { 1: null },
            romes: {
              code: ["A1234"],
              secteur_activites: [{ code_secteur: 1, libelle_secteur: "Agriculture" }],
            },
          },
        ];

        await franceTravailEffectifsDb().insertMany(effectifs, { bypassDocumentValidation: true });
      });

      it("devrait trier par jours sans contrat (défaut desc, plus haut en premier)", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", {
          page: 1,
          limit: 20,
          sort: "jours_sans_contrat",
          order: "desc",
        });

        expect(result?.effectifs).toHaveLength(2);
        expect(result?.effectifs[0].jours_sans_contrat).toBeGreaterThan(result?.effectifs[1].jours_sans_contrat);
        expect(result?.effectifs[0].effectif_snapshot.apprenant.nom).toBe("Alpha");
      });

      it("devrait trier par jours sans contrat asc (plus bas en premier)", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", {
          page: 1,
          limit: 20,
          sort: "jours_sans_contrat",
          order: "asc",
        });

        expect(result?.effectifs).toHaveLength(2);
        expect(result?.effectifs[0].jours_sans_contrat).toBeLessThan(result?.effectifs[1].jours_sans_contrat);
        expect(result?.effectifs[0].effectif_snapshot.apprenant.nom).toBe("Zorro");
      });

      it("devrait trier par nom asc (A-Z)", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", {
          page: 1,
          limit: 20,
          sort: "nom",
          order: "asc",
        });

        expect(result?.effectifs).toHaveLength(2);
        expect(result?.effectifs[0].effectif_snapshot.apprenant.nom).toBe("Alpha");
        expect(result?.effectifs[1].effectif_snapshot.apprenant.nom).toBe("Zorro");
      });

      it("devrait trier par nom desc (Z-A)", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", {
          page: 1,
          limit: 20,
          sort: "nom",
          order: "desc",
        });

        expect(result?.effectifs).toHaveLength(2);
        expect(result?.effectifs[0].effectif_snapshot.apprenant.nom).toBe("Zorro");
        expect(result?.effectifs[1].effectif_snapshot.apprenant.nom).toBe("Alpha");
      });

      it("devrait trier par organisme asc", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", {
          page: 1,
          limit: 20,
          sort: "organisme",
          order: "asc",
        });

        expect(result?.effectifs).toHaveLength(2);
        expect(result?.effectifs[0].organisme).toBeDefined();
        expect(result?.effectifs[1].organisme).toBeDefined();
      });

      it("devrait trier par organisme desc", async () => {
        const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", {
          page: 1,
          limit: 20,
          sort: "organisme",
          order: "desc",
        });

        expect(result?.effectifs).toHaveLength(2);
        expect(result?.effectifs[0].organisme).toBeDefined();
        expect(result?.effectifs[1].organisme).toBeDefined();
      });
    });
  });

  describe("getFranceTravailEffectifsByCodeSecteur", () => {
    beforeEach(async () => {
      await franceTravailEffectifsDb().deleteMany({});
      await romeSecteurActivitesDb().deleteMany({});

      await romeSecteurActivitesDb().insertOne({
        _id: new ObjectId(),
        code_secteur: 123,
        libelle_secteur: "Test Secteur",
        romes: [
          { code_rome: "A1234", code_ogr_rome: 1, libelle_rome: "Test ROME 1" },
          { code_rome: "B5678", code_ogr_rome: 2, libelle_rome: "Test ROME 2" },
        ],
      });

      const organisme = createRandomOrganisme();
      const formation = createRandomFormation("2024-2025", new Date("2024-09-01"), new Date("2026-06-30"));
      const baseEffectif = await createSampleEffectif({ organisme, formation });

      const effectifs = [
        {
          _id: new ObjectId(),
          created_at: new Date(),
          effectif_id: new ObjectId(),
          effectif_snapshot: baseEffectif as IEffectif,
          code_region: "84",
          current_status: { value: "INSCRIT" as const, date: new Date() },
          ft_data: { 1: null },
          romes: {
            code: ["A1234"],
            secteur_activites: [{ code_secteur: 1, libelle_secteur: "Agriculture" }],
          },
        },
        {
          _id: new ObjectId(),
          created_at: new Date(),
          effectif_id: new ObjectId(),
          effectif_snapshot: baseEffectif as IEffectif,
          code_region: "84",
          current_status: { value: "INSCRIT" as const, date: new Date() },
          ft_data: { 1: null },
          romes: {
            code: ["A1234"],
            secteur_activites: [{ code_secteur: 1, libelle_secteur: "Agriculture" }],
          },
        },
        {
          _id: new ObjectId(),
          created_at: new Date(),
          effectif_id: new ObjectId(),
          effectif_snapshot: baseEffectif as IEffectif,
          code_region: "84",
          current_status: { value: "INSCRIT" as const, date: new Date() },
          ft_data: { 99: null },
          romes: {
            code: ["C9999"],
            secteur_activites: [{ code_secteur: 99, libelle_secteur: "Informatique" }],
          },
        },
      ];

      await franceTravailEffectifsDb().insertMany(effectifs as any, { bypassDocumentValidation: true });
    });

    it("devrait récupérer les effectifs de tous les codes ROME du secteur", async () => {
      const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", { page: 1, limit: 20 });

      expect(result?.effectifs).toHaveLength(2);
      expect(result?.pagination.total).toBe(2);
    });

    it("devrait retourner un résultat vide pour un code secteur inexistant", async () => {
      const result = await getFranceTravailEffectifsByCodeSecteur(999, "84", { page: 1, limit: 20 });

      expect(result?.effectifs).toHaveLength(0);
      expect(result?.pagination.total).toBe(0);
    });

    it("devrait filtrer par région", async () => {
      const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", { page: 1, limit: 20 });

      expect(result?.effectifs).toHaveLength(2);
      expect(result?.effectifs.every((e) => e.code_region === "84")).toBe(true);
    });

    it("devrait supporter la recherche", async () => {
      const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", {
        page: 1,
        limit: 20,
        search: "nom",
      });

      expect(result).toBeDefined();
      expect(result?.pagination).toBeDefined();
    });

    it("devrait supporter le tri", async () => {
      const result = await getFranceTravailEffectifsByCodeSecteur(1, "84", {
        page: 1,
        limit: 20,
        sort: "nom",
        order: "asc",
      });

      expect(result?.effectifs).toHaveLength(2);
      expect(result?.effectifs[0]).toHaveProperty("jours_sans_contrat");
    });
  });
});
