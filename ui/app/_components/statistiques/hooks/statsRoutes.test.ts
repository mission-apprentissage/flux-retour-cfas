import { describe, expect, it } from "vitest";

import {
  buildCollaborationsRequest,
  buildSegmentStatsRequest,
  buildSyntheseRequest,
  buildTraitementRequest,
} from "./statsRoutes";

describe("buildTraitementRequest", () => {
  it("va sur la route publique sans région, même connecté", () => {
    expect(buildTraitementRequest({ period: "30days", segment: "rupture", national: true })).toEqual({
      url: "/api/v1/mission-locale/stats/traitement",
      params: { period: "30days", segment: "rupture" },
    });
  });

  it("lit sur la route territoriale nationale une période que la route publique ne sert pas", () => {
    for (const period of ["6months", "since-2026"] as const) {
      expect(buildTraitementRequest({ period, segment: "rupture" })).toEqual({
        url: "/api/v1/organisation/indicateurs-ml/traitement",
        params: { period, segment: "rupture", national: true },
      });
    }
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

describe("buildSyntheseRequest", () => {
  it("va sur la route publique nationale sans région", () => {
    expect(buildSyntheseRequest("deployment", "30days")).toEqual({
      url: "/api/v1/mission-locale/stats/synthese/deployment",
      params: { period: "30days" },
    });
  });

  it("lit sur la route territoriale nationale une période que la route publique ne sert pas", () => {
    expect(buildSyntheseRequest("deployment", "6months")).toEqual({
      url: "/api/v1/organisation/indicateurs-ml/synthese/deployment",
      params: { period: "6months", national: true },
    });
  });

  it("va sur la route territoriale avec une région", () => {
    expect(buildSyntheseRequest("regions", "3months", "75")).toEqual({
      url: "/api/v1/organisation/indicateurs-ml/synthese/regions",
      params: { period: "3months", region: "75" },
    });
  });
});

describe("vue département", () => {
  const scope = { region: "75", departement: "33" };

  it("transmet le département aux routes territoriales", () => {
    expect(buildTraitementRequest({ period: "30days", segment: "rupture", ...scope }).params).toMatchObject(scope);
    expect(
      buildSegmentStatsRequest("rupturants", { period: "30days", segment: "rupture", ...scope }).params
    ).toMatchObject(scope);
    expect(buildCollaborationsRequest({ period: "30days", ...scope }).params).toMatchObject(scope);
    expect(buildSyntheseRequest("deployment", "30days", "75", "33")).toEqual({
      url: "/api/v1/organisation/indicateurs-ml/synthese/deployment",
      params: { period: "30days", ...scope },
    });
  });
});
