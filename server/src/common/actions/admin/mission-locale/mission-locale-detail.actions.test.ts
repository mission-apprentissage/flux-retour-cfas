import { ObjectId } from "bson";
import type { IOrganisation } from "shared/models/data/organisations.model";
import { describe, expect, it } from "vitest";

import { organisationsDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { getMissionLocaleDetail } from "./mission-locale.admin.actions";

useMongo();

const insertMl = async (activatedAt: Date | null) => {
  const _id = new ObjectId();
  await organisationsDb().insertOne(
    {
      _id,
      type: "MISSION_LOCALE",
      ml_id: 900 + Math.floor(Math.random() * 1000),
      nom: "ML Détail",
      created_at: new Date(),
      ...(activatedAt ? { activated_at: activatedAt } : {}),
    } as IOrganisation,
    { bypassDocumentValidation: true }
  );
  return _id;
};

describe("getMissionLocaleDetail", () => {
  it("expose is_active dérivé de la date d'activation", async () => {
    const active = await insertMl(new Date("2025-07-01"));
    const inactive = await insertMl(null);

    const activeDetail = await getMissionLocaleDetail(active);
    expect(activeDetail).toMatchObject({ is_active: true, traites_count: 0, has_cfa_collaboration: false });
    expect(activeDetail.activated_at).toEqual(new Date("2025-07-01"));

    const inactiveDetail = await getMissionLocaleDetail(inactive);
    expect(inactiveDetail).toMatchObject({ is_active: false, activated_at: null });
  });
});
