import { afterEach, describe, expect, it } from "vitest";

import { getDatabase } from "@/common/mongodb";
import { REDUNDANT_INDEXES, up } from "@/db/migrations/20261117120300-drop-redundant-indexes";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const indexNames = async (collectionName: string) =>
  (await getDatabase().collection(collectionName).listIndexes().toArray()).map(({ name }) => name);

describe("migration drop-redundant-indexes", () => {
  afterEach(async () => {
    for (const collectionName of ["effectifs", "effectifsDECA", "missionLocaleStats"]) {
      await getDatabase().collection(collectionName).dropIndexes();
    }
  });

  it("supprime les index redondants et garde les index qu'ils doublaient", async () => {
    const db = getDatabase();
    await db
      .collection("effectifs")
      .createIndex(
        { organisme_id: 1, annee_scolaire: 1, id_erp_apprenant: 1, "formation.cfd": 1, "formation.rncp": 1 },
        { unique: true }
      );
    await db
      .collection("effectifs")
      .createIndex({ organisme_id: 1, annee_scolaire: 1, id_erp_apprenant: 1 }, { unique: true });
    await db.collection("effectifs").createIndex({ organisme_id: 1 }, { name: "organisme_id" });
    await db.collection("effectifs").createIndex({ organisme_id: 1, created_at: 1 });
    await db.collection("effectifsDECA").createIndex({ annee_scolaire: 1 }, { name: "annee_scolaire" });
    await db
      .collection("effectifsDECA")
      .createIndex({ annee_scolaire: 1, "formation.cfd": 1, id_erp_apprenant: 1, organisme_id: 1 });
    await db.collection("missionLocaleStats").createIndex({ computed_day: 1 }, { name: "computed_day_asc" });
    await db
      .collection("missionLocaleStats")
      .createIndex({ computed_day: -1, mission_locale_id: 1 }, { name: "computed_day_ml_id_desc" });

    await up(db);

    const effectifs = await indexNames("effectifs");
    expect(effectifs).not.toContain(REDUNDANT_INDEXES.effectifs[0]);
    expect(effectifs).not.toContain("organisme_id");
    expect(effectifs).toContain("organisme_id_1_annee_scolaire_1_id_erp_apprenant_1");
    expect(effectifs).toContain("organisme_id_1_created_at_1");

    const deca = await indexNames("effectifsDECA");
    expect(deca).not.toContain("annee_scolaire");
    expect(deca).toContain("annee_scolaire_1_formation.cfd_1_id_erp_apprenant_1_organisme_id_1");

    const stats = await indexNames("missionLocaleStats");
    expect(stats).not.toContain("computed_day_asc");
    expect(stats).toContain("computed_day_ml_id_desc");
  });

  it("passe sans erreur quand les index sont déjà absents", async () => {
    await expect(up(getDatabase())).resolves.toBeUndefined();
    await expect(up(getDatabase())).resolves.toBeUndefined();
  });
});
