import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it } from "vitest";

import { getDatabase } from "@/common/mongodb";
import { promoteAffelnetHistory, up } from "@/db/migrations/20261117120600-promote-affelnet-history";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const ids = {
  memeCampagne: new ObjectId(),
  autreCampagne: new ObjectId(),
  historiqueVide: new ObjectId(),
  sansHistorique: new ObjectId(),
};

const raw = (nom: string, annee_scolaire_rentree: string | null = "2026") => ({
  nom,
  prenom_1: "Jean",
  uai_etatblissement_formateur: `${nom}-UAI`,
  annee_scolaire_rentree,
});

const voeu = (_id: ObjectId) => getDatabase().collection("voeuxAffelnet").findOne({ _id });

describe("migration promote-affelnet-history", () => {
  beforeEach(async () => {
    await getDatabase()
      .collection("voeuxAffelnet")
      .insertMany(
        [
          {
            _id: ids.memeCampagne,
            annee_scolaire_rentree: "2026",
            raw: raw("PREMIER"),
            history: [
              { created_at: new Date(), raw: raw("DEUXIEME") },
              { created_at: new Date(), raw: raw("TROISIEME", null) },
              { created_at: new Date(), raw: raw("AUTRE", "2025") },
            ],
          },
          {
            _id: ids.autreCampagne,
            annee_scolaire_rentree: "2026",
            raw: raw("PREMIER"),
            history: [{ created_at: new Date(), raw: raw("AUTRE", "2025") }],
          },
          { _id: ids.historiqueVide, annee_scolaire_rentree: "2026", raw: raw("PREMIER"), history: [] },
          { _id: ids.sansHistorique, annee_scolaire_rentree: "2026", raw: raw("PREMIER") },
        ],
        { bypassDocumentValidation: true }
      );
  });

  it("promeut le dernier raw de la même campagne et retire history", async () => {
    await up(getDatabase());
    await up(getDatabase());

    expect(await voeu(ids.memeCampagne)).toEqual({
      _id: ids.memeCampagne,
      annee_scolaire_rentree: "2026",
      raw: raw("TROISIEME", null),
    });
  });

  it("garde raw quand l'historique est vide ou d'une autre campagne", async () => {
    await up(getDatabase());

    for (const _id of [ids.autreCampagne, ids.historiqueVide, ids.sansHistorique]) {
      expect(await voeu(_id)).toEqual({ _id, annee_scolaire_rentree: "2026", raw: raw("PREMIER") });
    }
  });

  it("traite toutes les pages", async () => {
    await promoteAffelnetHistory(getDatabase(), 1);

    expect(
      await getDatabase()
        .collection("voeuxAffelnet")
        .countDocuments({ history: { $exists: true } })
    ).toBe(0);
    expect((await voeu(ids.memeCampagne))?.raw.nom).toBe("TROISIEME");
  });
});
