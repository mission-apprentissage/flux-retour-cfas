import { ObjectId } from "mongodb";
import { describe, it, expect, vi } from "vitest";

import { requireCfaAdminIfCfa } from "@/http/middlewares/helpers";

function mockReq(overrides: Record<string, any> = {}) {
  return {
    user: {
      _id: new ObjectId(),
      account_status: "CONFIRMED",
      organisation: { type: "ORGANISME_FORMATION" },
      organisation_role: "admin",
      ...overrides,
    },
  } as any;
}

const mockRes = {} as any;

describe("requireCfaAdminIfCfa", () => {
  it("laisse passer un admin CFA", () => {
    const next = vi.fn();
    requireCfaAdminIfCfa(mockReq(), mockRes, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("refuse un member CFA", () => {
    const next = vi.fn();
    expect(() => requireCfaAdminIfCfa(mockReq({ organisation_role: "member" }), mockRes, next)).toThrow(
      "Accès réservé aux administrateurs de l'établissement"
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("laisse passer une Mission Locale (pas un CFA)", () => {
    const next = vi.fn();
    requireCfaAdminIfCfa(
      mockReq({ organisation: { type: "MISSION_LOCALE" }, organisation_role: undefined }),
      mockRes,
      next
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it("laisse passer un admin plateforme (pas un CFA)", () => {
    const next = vi.fn();
    requireCfaAdminIfCfa(
      mockReq({ organisation: { type: "ADMINISTRATEUR" }, organisation_role: undefined }),
      mockRes,
      next
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it("laisse passer un admin plateforme qui impersonne un CFA", () => {
    const next = vi.fn();
    requireCfaAdminIfCfa(mockReq({ impersonating: true, organisation_role: undefined }), mockRes, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("refuse un admin plateforme qui impersonne un non-CFA via CFA check", () => {
    const next = vi.fn();
    expect(() =>
      requireCfaAdminIfCfa(mockReq({ organisation_role: undefined, impersonating: false }), mockRes, next)
    ).toThrow("Accès réservé aux administrateurs de l'établissement");
    expect(next).not.toHaveBeenCalled();
  });
});
