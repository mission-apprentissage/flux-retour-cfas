import { describe, expect, it } from "vitest";

import { buildSegmentStatsRequest, buildTraitementRequest } from "./statsRoutes";

describe("buildTraitementRequest", () => {
  it("va sur la route publique sans région, même connecté", () => {
    expect(buildTraitementRequest({ period: "30days", segment: "rupture", national: true })).toEqual({
      url: "/api/v1/mission-locale/stats/traitement",
      params: { period: "30days", segment: "rupture" },
    });
  });

  it("va sur la route territoriale avec une région", () => {
    expect(buildTraitementRequest({ period: "all", segment: "collab", region: "11" })).toEqual({
      url: "/api/v1/organisation/indicateurs-ml/traitement",
      params: { period: "all", region: "11", segment: "collab" },
    });
  });
});

describe("buildSegmentStatsRequest", () => {
  it("ignore le périmètre en public", () => {
    expect(
      buildSegmentStatsRequest("rupturants", { period: "3months", segment: "rupture", region: "11", isPublic: true })
    ).toEqual({
      url: "/api/v1/mission-locale/stats/rupturants",
      params: { period: "3months", segment: "rupture" },
    });
  });

  it("transmet région, ML et national sur la route territoriale", () => {
    expect(
      buildSegmentStatsRequest("dossiers-traites", {
        period: "30days",
        segment: "collab",
        mlId: "abc",
        national: true,
      })
    ).toEqual({
      url: "/api/v1/organisation/indicateurs-ml/stats/dossiers-traites",
      params: { period: "30days", segment: "collab", ml_id: "abc", national: true },
    });
  });
});
