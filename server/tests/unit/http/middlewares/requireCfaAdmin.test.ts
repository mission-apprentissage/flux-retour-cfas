import { ObjectId } from "mongodb";
import { describe, it, expect, vi } from "vitest";

import { requireCfaAdmin } from "@/http/middlewares/helpers";

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

describe("requireCfaAdmin", () => {
  it("laisse passer un admin CFA confirmé", () => {
    const next = vi.fn();
    requireCfaAdmin(mockReq(), mockRes, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("refuse un member CFA", () => {
    const next = vi.fn();
    expect(() => requireCfaAdmin(mockReq({ organisation_role: "member" }), mockRes, next)).toThrow(
      "Accès réservé aux administrateurs de l'établissement"
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("refuse un utilisateur sans organisation_role", () => {
    const next = vi.fn();
    expect(() => requireCfaAdmin(mockReq({ organisation_role: undefined }), mockRes, next)).toThrow(
      "Accès réservé aux administrateurs de l'établissement"
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("refuse un utilisateur d'une autre organisation (MISSION_LOCALE)", () => {
    const next = vi.fn();
    expect(() =>
      requireCfaAdmin(mockReq({ organisation: { type: "MISSION_LOCALE" }, organisation_role: "admin" }), mockRes, next)
    ).toThrow("Accès non autorisé");
    expect(next).not.toHaveBeenCalled();
  });

  it("laisse passer un admin plateforme qui impersonne un CFA", () => {
    const next = vi.fn();
    requireCfaAdmin(mockReq({ impersonating: true, organisation_role: undefined }), mockRes, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("refuse un compte non confirmé", () => {
    const next = vi.fn();
    expect(() => requireCfaAdmin(mockReq({ account_status: "PENDING_EMAIL_VALIDATION" }), mockRes, next)).toThrow(
      "Accès non autorisé"
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("refuse un admin plateforme sans impersonation sur un non-CFA", () => {
    const next = vi.fn();
    expect(() =>
      requireCfaAdmin(
        mockReq({ organisation: { type: "ADMINISTRATEUR" }, organisation_role: undefined }),
        mockRes,
        next
      )
    ).toThrow("Accès non autorisé");
    expect(next).not.toHaveBeenCalled();
  });

  it("refuse un admin plateforme qui impersonne un non-CFA", () => {
    const next = vi.fn();
    expect(() =>
      requireCfaAdmin(
        mockReq({ organisation: { type: "MISSION_LOCALE" }, impersonating: true, organisation_role: undefined }),
        mockRes,
        next
      )
    ).toThrow("Accès non autorisé");
    expect(next).not.toHaveBeenCalled();
  });
});
