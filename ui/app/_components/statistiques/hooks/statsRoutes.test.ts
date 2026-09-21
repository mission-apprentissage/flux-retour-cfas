import { describe, expect, it } from "vitest";

import { buildCollaborationsRequest, buildSegmentStatsRequest, buildTraitementRequest } from "./statsRoutes";

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

  it("va sur la route territoriale avec une ML", () => {
    expect(buildTraitementRequest({ period: "30days", segment: "rupture", mlId: "abc" })).toEqual({
      url: "/api/v1/organisation/indicateurs-ml/traitement",
      params: { period: "30days", segment: "rupture", ml_id: "abc" },
    });
  });

  it("reste sur la route publique en public, même avec une région", () => {
    expect(buildTraitementRequest({ period: "30days", segment: "rupture", region: "11", isPublic: true })).toEqual({
      url: "/api/v1/mission-locale/stats/traitement",
      params: { period: "30days", segment: "rupture" },
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

describe("buildCollaborationsRequest", () => {
  it("va sur la route publique nationale en public", () => {
    expect(buildCollaborationsRequest({ period: "all", region: "11", isPublic: true })).toEqual({
      url: "/api/v1/mission-locale/stats/collaborations",
      params: { period: "all" },
    });
  });

  it("scope la route territoriale par ML", () => {
    expect(buildCollaborationsRequest({ period: "30days", mlId: "abc" })).toEqual({
      url: "/api/v1/organisation/indicateurs-ml/stats/collaborations",
      params: { period: "30days", ml_id: "abc" },
    });
  });
});
