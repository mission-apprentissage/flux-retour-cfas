import { describe, expect, it } from "vitest";

import { getTimeSeriesDates } from "./mission-locale-stats.actions";

const jour = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const isoJours = (dates: Date[]) => dates.map((date) => date.toISOString().slice(0, 10));

describe("getTimeSeriesDates", () => {
  const reference = jour("2026-10-19");

  it("répartit 6 points sur les 30 derniers jours", async () => {
    const dates = await getTimeSeriesDates("30days", reference);

    expect(dates).toHaveLength(6);
    expect(isoJours([dates[0], dates[5]])).toEqual(["2026-09-19", "2026-10-19"]);
  });

  it("place un point par mois au-delà : début de période, chaque 1er du mois, puis le jour même", async () => {
    expect(isoJours(await getTimeSeriesDates("3months", reference))).toEqual([
      "2026-07-19",
      "2026-08-01",
      "2026-09-01",
      "2026-10-01",
      "2026-10-19",
    ]);
  });

  it("ne double pas le point quand la période commence un 1er du mois", async () => {
    const dates = isoJours(await getTimeSeriesDates("since-2026", reference));

    expect(dates[0]).toBe("2026-01-01");
    expect(dates[1]).toBe("2026-02-01");
    expect(dates).toHaveLength(11);
    expect(dates.at(-1)).toBe("2026-10-19");
  });
});
