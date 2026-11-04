import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { restrictReadOnlyImpersonation } from "./readOnlyImpersonation";

const run = (method: string, path: string, user: Record<string, unknown> | undefined) => {
  const next = vi.fn() as unknown as NextFunction;
  const call = () => restrictReadOnlyImpersonation({ method, path, user } as unknown as Request, {} as Response, next);
  return { call, next };
};

describe("restrictReadOnlyImpersonation", () => {
  it("laisse passer une session normale, y compris en écriture", () => {
    const { call, next } = run("POST", "/api/v1/organismes/123/effectifs", { impersonating: true });
    call();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("laisse passer les requêtes anonymes à la couche d'authentification", () => {
    const { call, next } = run("POST", "/api/v1/anything", undefined);
    call();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("autorise la lecture de la session et la sortie d'imposture en lecture seule", () => {
    const session = run("GET", "/api/v1/session", { impersonating: true, readOnly: true });
    session.call();
    expect(session.next).toHaveBeenCalledTimes(1);

    const sortie = run("DELETE", "/api/v1/admin/impersonate", { impersonating: true, readOnly: true });
    sortie.call();
    expect(sortie.next).toHaveBeenCalledTimes(1);
  });

  it("autorise la lecture des espaces CFA et Mission Locale, sans les exports", () => {
    const id = "69e81fa9a7cd2cbd2d495a66";
    const lectures = [
      "/api/v1/erps",
      "/api/v1/organisation/organisme",
      `/api/v1/organismes/${id}/cfa/effectifs`,
      `/api/v1/organismes/${id}/cfa/unread-notifications-count`,
      `/api/v1/organismes/${id}/cfa/effectif/${id}`,
      `/api/v1/organismes/${id}/mission-locale/effectifs-per-month`,
      "/api/v1/organisation/mission-locale/effectifs",
      `/api/v1/organisation/mission-locale/effectif/${id}`,
    ];
    for (const path of lectures) {
      const { call, next } = run("GET", path, { impersonating: true, readOnly: true });
      call();
      expect(next, path).toHaveBeenCalledTimes(1);
    }

    const exports = [
      `/api/v1/organismes/${id}/cfa/suivi-mission-locale/export`,
      "/api/v1/organisation/mission-locale/export/effectifs",
      "/api/v1/organisation/mission-locale/effectif/pas-un-id",
    ];
    for (const path of exports) {
      const { call } = run("GET", path, { impersonating: true, readOnly: true });
      expect(call, path).toThrow("Cette imposture est en lecture seule");
    }
  });

  it("refuse toute écriture en lecture seule", () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      const { call, next } = run(method, "/api/v1/session", { impersonating: true, readOnly: true });
      expect(call).toThrow("Cette imposture est en lecture seule");
      expect(next).not.toHaveBeenCalled();
    }
  });

  it("refuse une lecture qui n'est pas dans la liste autorisée", () => {
    const { call, next } = run("GET", "/api/v1/admin/users", { impersonating: true, readOnly: true });
    expect(call).toThrow("Cette imposture est en lecture seule");
    expect(next).not.toHaveBeenCalled();
  });
});
