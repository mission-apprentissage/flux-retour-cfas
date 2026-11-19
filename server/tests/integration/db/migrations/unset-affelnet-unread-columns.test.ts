import { ObjectId } from "mongodb";
import { COLONNES_AFFELNET_CONSERVEES } from "shared/models/data/voeuxAffelnet.model";
import { describe, expect, it } from "vitest";

import { getDatabase } from "@/common/mongodb";
import { unsetAffelnetUnreadColumns, up } from "@/db/migrations/20261119120000-unset-affelnet-unread-columns";
import { AFFELNET_HEADER } from "@/http/routes/admin.routes/affelnet.routes";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const voeu = (raw: Record<string, string>) => ({
  _id: new ObjectId(),
  created_at: new Date("2025-05-01T00:00:00Z"),
  updated_at: new Date("2025-05-01T00:00:00Z"),
  is_contacted: false,
  annee_scolaire_rentree: "2025",
  raw,
  _computed: { formation: {} },
});

const rawComplet = Object.fromEntries(AFFELNET_HEADER.map((colonne) => [colonne, `valeur-${colonne}`]));
const rawReduit = Object.fromEntries(COLONNES_AFFELNET_CONSERVEES.map((colonne) => [colonne, `valeur-${colonne}`]));

describe("migration unset-affelnet-unread-columns", () => {
  it("retire les colonnes non lues et garde les colonnes lues, sur plusieurs lots", async () => {
    const complets = [voeu(rawComplet), voeu(rawComplet), voeu(rawComplet)];
    const reduit = voeu(rawReduit);
    await getDatabase()
      .collection("voeuxAffelnet")
      .insertMany([...complets, reduit], { bypassDocumentValidation: true });

    await unsetAffelnetUnreadColumns(getDatabase(), 2);
    await up(getDatabase());

    const voeux = await getDatabase().collection("voeuxAffelnet").find({}).toArray();
    expect(voeux).toHaveLength(4);
    for (const { raw } of voeux) {
      expect(raw).toStrictEqual(rawReduit);
    }
    expect(await getDatabase().collection("voeuxAffelnet").findOne({ _id: reduit._id })).toStrictEqual(reduit);
  });

  it("retire 35 colonnes sur les 62 du fichier", () => {
    expect(AFFELNET_HEADER).toHaveLength(62);
    expect(COLONNES_AFFELNET_CONSERVEES).toHaveLength(27);
    expect(COLONNES_AFFELNET_CONSERVEES.every((colonne) => AFFELNET_HEADER.includes(colonne))).toBe(true);
  });
});
