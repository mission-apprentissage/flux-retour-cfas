import { ObjectId } from "mongodb";
import { IEffectif } from "shared/models/data/effectifs.model";
import { describe, it, expect, beforeEach } from "vitest";

import { getFranceTravailEffectifsByCodeRome } from "@/common/actions/franceTravail/franceTravailEffectif.actions";
import { franceTravailEffectifsDb } from "@/common/model/collections";
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
      ft_data: { A1234: null },
    },
    {
      _id: new ObjectId(),
      created_at: new Date(),
      effectif_id: new ObjectId(),
      effectif_snapshot: baseEffectif as IEffectif,
      code_region: "84",
      current_status: { value: "INSCRIT" as const, date: new Date() },
      ft_data: { A1234: null },
    },
    {
      _id: new ObjectId(),
      created_at: new Date(),
      effectif_id: new ObjectId(),
      effectif_snapshot: baseEffectif as IEffectif,
      code_region: "84",
      current_status: { value: "INSCRIT" as const, date: new Date() },
      ft_data: { A1234: null },
    },
    {
      _id: new ObjectId(),
      created_at: new Date(),
      effectif_id: new ObjectId(),
      effectif_snapshot: baseEffectif as IEffectif,
      code_region: "11",
      current_status: { value: "INSCRIT" as const, date: new Date() },
      ft_data: { A1234: null },
    },
    {
      _id: new ObjectId(),
      created_at: new Date(),
      effectif_id: new ObjectId(),
      effectif_snapshot: baseEffectif as IEffectif,
      code_region: "84",
      current_status: { value: "INSCRIT" as const, date: new Date() },
      ft_data: { B5678: null },
    },
  ];

  // @ts-expect-error
  await franceTravailEffectifsDb().insertMany(effectifs, { bypassDocumentValidation: true });
};

describe("Tests des actions France Travail Effectif", () => {
  describe("getFranceTravailEffectifsByCodeRome", () => {
    describe("Validation du code ROME", () => {
      it("devrait rejeter un code ROME invalide (trop court)", async () => {
        await expect(getFranceTravailEffectifsByCodeRome("A123", undefined, { page: 1, limit: 20 })).rejects.toThrow(
          /Invalid ROME code format: A123/
        );
      });

      it("devrait rejeter un code ROME invalide (format incorrect)", async () => {
        await expect(getFranceTravailEffectifsByCodeRome("1234A", undefined, { page: 1, limit: 20 })).rejects.toThrow(
          /Invalid ROME code format: 1234A/
        );
      });

      it("devrait rejeter un code ROME invalide (lettres minuscules)", async () => {
        await expect(getFranceTravailEffectifsByCodeRome("a1234", undefined, { page: 1, limit: 20 })).rejects.toThrow(
          /Invalid ROME code format: a1234/
        );
      });

      it("devrait rejeter un code ROME invalide (caractères spéciaux)", async () => {
        await expect(getFranceTravailEffectifsByCodeRome("A-234", undefined, { page: 1, limit: 20 })).rejects.toThrow(
          /Invalid ROME code format: A-234/
        );
      });

      it("devrait accepter un code ROME valide", async () => {
        await insertTestData();
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, { page: 1, limit: 20 });
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
        const result = await getFranceTravailEffectifsByCodeRome("A1234");

        expect(result?.effectifs).toHaveLength(4);
        expect(result?.pagination).toEqual({
          page: 1,
          limit: 20,
          total: 4,
          totalPages: 1,
        });
      });

      it("devrait paginer correctement avec une limite custom", async () => {
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, { page: 1, limit: 2 });

        expect(result?.effectifs).toHaveLength(2);
        expect(result?.pagination).toEqual({
          page: 1,
          limit: 2,
          total: 4,
          totalPages: 2,
        });
      });

      it("devrait retourner la deuxième page correctement", async () => {
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, { page: 2, limit: 2 });

        expect(result?.effectifs).toHaveLength(2);
        expect(result?.pagination).toEqual({
          page: 2,
          limit: 2,
          total: 4,
          totalPages: 2,
        });
      });

      it("devrait calculer correctement totalPages avec un reste", async () => {
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, { page: 1, limit: 3 });

        expect(result?.effectifs).toHaveLength(3);
        expect(result?.pagination).toEqual({
          page: 1,
          limit: 3,
          total: 4,
          totalPages: 2,
        });
      });

      it("devrait retourner une page vide si la page dépasse le total", async () => {
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, { page: 10, limit: 20 });

        expect(result?.effectifs).toHaveLength(0);
        expect(result?.pagination).toEqual({
          page: 10,
          limit: 20,
          total: 4,
          totalPages: 1,
        });
      });
    });

    describe("Filtrage par région", () => {
      beforeEach(async () => {
        await insertTestData();
      });

      it("devrait filtrer par code région", async () => {
        const result = await getFranceTravailEffectifsByCodeRome("A1234", "84", { page: 1, limit: 20 });

        expect(result?.effectifs).toHaveLength(3);
        expect(result?.pagination.total).toBe(3);

        result?.effectifs.forEach((effectif) => {
          expect(effectif.code_region).toBe("84");
        });
      });

      it("devrait retourner tous les résultats si aucune région spécifiée", async () => {
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, { page: 1, limit: 20 });

        expect(result?.effectifs).toHaveLength(4);
        expect(result?.pagination.total).toBe(4);
      });

      it("devrait retourner un résultat vide pour une région sans effectifs", async () => {
        const result = await getFranceTravailEffectifsByCodeRome("A1234", "99", { page: 1, limit: 20 });

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
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, { page: 1, limit: 20 });

        expect(result?.effectifs).toHaveLength(4);
        expect(result?.pagination.total).toBe(4);

        result?.effectifs.forEach((effectif) => {
          expect(effectif.ft_data).toHaveProperty("A1234");
        });
      });

      it("devrait retourner des résultats vides pour un code ROME inexistant", async () => {
        const result = await getFranceTravailEffectifsByCodeRome("Z9999", undefined, { page: 1, limit: 20 });

        expect(result?.effectifs).toHaveLength(0);
        expect(result?.pagination).toEqual({
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        });
      });

      it("devrait distinguer les différents codes ROME", async () => {
        const resultA = await getFranceTravailEffectifsByCodeRome("A1234", undefined, { page: 1, limit: 20 });
        const resultB = await getFranceTravailEffectifsByCodeRome("B5678", undefined, { page: 1, limit: 20 });

        expect(resultA?.pagination.total).toBe(4);
        expect(resultB?.pagination.total).toBe(1);
        expect(resultA?.effectifs[0].ft_data).toHaveProperty("A1234");
        expect(resultB?.effectifs[0].ft_data).toHaveProperty("B5678");
      });
    });

    describe("Combinaison des filtres", () => {
      beforeEach(async () => {
        await insertTestData();
      });

      it("devrait combiner filtrage par code ROME et région avec pagination", async () => {
        const result = await getFranceTravailEffectifsByCodeRome("A1234", "84", { page: 1, limit: 2 });

        expect(result?.effectifs).toHaveLength(2);
        expect(result?.pagination).toEqual({
          page: 1,
          limit: 2,
          total: 3,
          totalPages: 2,
        });

        result?.effectifs.forEach((effectif) => {
          expect(effectif.code_region).toBe("84");
          expect(effectif.ft_data).toHaveProperty("A1234");
        });
      });

      it("devrait retourner la deuxième page avec les bons filtres", async () => {
        const result = await getFranceTravailEffectifsByCodeRome("A1234", "84", { page: 2, limit: 2 });

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
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, { page: 1, limit: 1 });

        expect(result).toHaveProperty("effectifs");
        expect(result).toHaveProperty("pagination");
        expect(Array.isArray(result?.effectifs)).toBe(true);
      });

      it("devrait retourner les effectifs avec toutes les propriétés", async () => {
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, { page: 1, limit: 1 });

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
            ft_data: { A1234: null },
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
            ft_data: { A1234: null },
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
            ft_data: { A1234: null },
          },
        ];

        await franceTravailEffectifsDb().insertMany(effectifs, { bypassDocumentValidation: true });
      });

      it("devrait filtrer par nom", async () => {
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, {
          page: 1,
          limit: 20,
          search: "Dupont",
        });

        expect(result?.effectifs).toHaveLength(1);
        expect(result?.effectifs[0].effectif_snapshot.apprenant.nom).toBe("Dupont");
      });

      it("devrait filtrer par prénom", async () => {
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, {
          page: 1,
          limit: 20,
          search: "Marie",
        });

        expect(result?.effectifs).toHaveLength(1);
        expect(result?.effectifs[0].effectif_snapshot.apprenant.prenom).toBe("Marie");
      });

      it("devrait être insensible à la casse", async () => {
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, {
          page: 1,
          limit: 20,
          search: "dupont",
        });

        expect(result?.effectifs).toHaveLength(1);
        expect(result?.effectifs[0].effectif_snapshot.apprenant.nom).toBe("Dupont");
      });

      it("devrait rechercher par partie du nom", async () => {
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, {
          page: 1,
          limit: 20,
          search: "Du",
        });

        expect(result?.effectifs).toHaveLength(2);
      });

      it("devrait retourner tous les résultats sans search", async () => {
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, { page: 1, limit: 20 });

        expect(result?.effectifs).toHaveLength(3);
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
            ft_data: { A1234: null },
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
            ft_data: { A1234: null },
          },
        ];

        await franceTravailEffectifsDb().insertMany(effectifs, { bypassDocumentValidation: true });
      });

      it("devrait trier par jours sans contrat (défaut desc, plus haut en premier)", async () => {
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, {
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
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, {
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
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, {
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
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, {
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
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, {
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
        const result = await getFranceTravailEffectifsByCodeRome("A1234", undefined, {
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
});
