import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { describe, it, expect, vi } from "vitest";

import { requireAdminSiOrganisationAvecAdministrateurs } from "@/http/middlewares/helpers";

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      _id: new ObjectId(),
      account_status: "CONFIRMED",
      organisation: { type: "ORGANISME_FORMATION" },
      organisation_role: "admin",
      ...overrides,
    },
  } as unknown as Request;
}

const mockRes = {} as Response;

describe("requireAdminSiOrganisationAvecAdministrateurs", () => {
  it("laisse passer un admin CFA", () => {
    const next = vi.fn();
    requireAdminSiOrganisationAvecAdministrateurs(mockReq(), mockRes, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("refuse un member CFA", () => {
    const next = vi.fn();
    expect(() =>
      requireAdminSiOrganisationAvecAdministrateurs(mockReq({ organisation_role: "member" }), mockRes, next)
    ).toThrow("Accès réservé aux administrateurs de l'établissement");
    expect(next).not.toHaveBeenCalled();
  });

  it("laisse passer une Mission Locale (pas un CFA)", () => {
    const next = vi.fn();
    requireAdminSiOrganisationAvecAdministrateurs(
      mockReq({ organisation: { type: "MISSION_LOCALE" }, organisation_role: undefined }),
      mockRes,
      next
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it("laisse passer un admin plateforme (pas un CFA)", () => {
    const next = vi.fn();
    requireAdminSiOrganisationAvecAdministrateurs(
      mockReq({ organisation: { type: "ADMINISTRATEUR" }, organisation_role: undefined }),
      mockRes,
      next
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it("laisse passer un admin plateforme qui impersonne un CFA", () => {
    const next = vi.fn();
    requireAdminSiOrganisationAvecAdministrateurs(
      mockReq({ impersonating: true, organisation_role: undefined }),
      mockRes,
      next
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it("refuse un admin plateforme qui impersonne un non-CFA via CFA check", () => {
    const next = vi.fn();
    expect(() =>
      requireAdminSiOrganisationAvecAdministrateurs(
        mockReq({ organisation_role: undefined, impersonating: false }),
        mockRes,
        next
      )
    ).toThrow("Accès réservé aux administrateurs de l'établissement");
    expect(next).not.toHaveBeenCalled();
  });

  it.each(["DREETS", "DDETS"])("laisse passer un admin %s", (type) => {
    const next = vi.fn();
    requireAdminSiOrganisationAvecAdministrateurs(mockReq({ organisation: { type } }), mockRes, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it.each([
    ["DREETS", "member"],
    ["DDETS", undefined],
  ])("refuse un compte %s sans rôle admin (%s)", (type, organisation_role) => {
    const next = vi.fn();
    expect(() =>
      requireAdminSiOrganisationAvecAdministrateurs(
        mockReq({ organisation: { type }, organisation_role }),
        mockRes,
        next
      )
    ).toThrow("Accès réservé aux administrateurs de l'organisation");
    expect(next).not.toHaveBeenCalled();
  });

  it("laisse passer un admin plateforme qui impersonne une DREETS", () => {
    const next = vi.fn();
    requireAdminSiOrganisationAvecAdministrateurs(
      mockReq({ organisation: { type: "DREETS" }, impersonating: true, organisation_role: undefined }),
      mockRes,
      next
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it("laisse passer une DRAAF sans rôle", () => {
    const next = vi.fn();
    requireAdminSiOrganisationAvecAdministrateurs(
      mockReq({ organisation: { type: "DRAAF" }, organisation_role: undefined }),
      mockRes,
      next
    );
    expect(next).toHaveBeenCalledOnce();
  });
});
