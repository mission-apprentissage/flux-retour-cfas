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
