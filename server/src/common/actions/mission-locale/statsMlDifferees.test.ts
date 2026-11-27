import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { recalculerStatsMl, withStatsMlDifferees } from "./statsMlDifferees";

const { createOrUpdateMissionLocaleStats } = vi.hoisted(() => ({
  createOrUpdateMissionLocaleStats: vi.fn(),
}));

vi.mock("./mission-locale-stats.actions", () => ({ createOrUpdateMissionLocaleStats }));

const idsRecalcules = () => createOrUpdateMissionLocaleStats.mock.calls.map((appel) => String(appel[0])).sort();

describe("statistiques ML différées", () => {
  beforeEach(() => {
    createOrUpdateMissionLocaleStats.mockReset();
    createOrUpdateMissionLocaleStats.mockResolvedValue(undefined);
  });

  it("recalcule tout de suite hors du contexte", async () => {
    const id = new ObjectId();

    await recalculerStatsMl(id);

    expect(idsRecalcules()).toEqual([id.toString()]);
  });

  it("recalcule une fois par ML en fin de contexte, même avec deux instances du même identifiant", async () => {
    const ml1 = new ObjectId();
    const ml2 = new ObjectId();
    let appelsPendant = -1;

    await withStatsMlDifferees(async () => {
      await recalculerStatsMl(ml1);
      await recalculerStatsMl(new ObjectId(ml1.toHexString()));
      await recalculerStatsMl(ml2);
      appelsPendant = createOrUpdateMissionLocaleStats.mock.calls.length;
    });

    expect(appelsPendant).toBe(0);
    expect(idsRecalcules()).toEqual([ml1.toString(), ml2.toString()].sort());
  });

  it("continue après une ML en échec sans lever", async () => {
    const ml1 = new ObjectId();
    const ml2 = new ObjectId();
    createOrUpdateMissionLocaleStats.mockRejectedValueOnce(new Error("ML disparue"));

    await expect(
      withStatsMlDifferees(async () => {
        await recalculerStatsMl(ml1);
        await recalculerStatsMl(ml2);
      })
    ).resolves.toBeUndefined();

    expect(createOrUpdateMissionLocaleStats).toHaveBeenCalledTimes(2);
  });

  it("recalcule les ML touchées puis relève l'erreur du traitement", async () => {
    const ml = new ObjectId();

    await expect(
      withStatsMlDifferees(async () => {
        await recalculerStatsMl(ml);
        throw new Error("lecture interrompue");
      })
    ).rejects.toThrow("lecture interrompue");

    expect(idsRecalcules()).toEqual([ml.toString()]);
  });
});
