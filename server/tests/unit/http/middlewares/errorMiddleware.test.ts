import { captureException } from "@sentry/node";
import Boom from "boom";
import type { Request, Response } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { z, ZodError } from "zod";

import { InputValidationError } from "@/common/utils/inputValidationError";
import errorMiddleware, {
  errorKindOf,
  normalizeToBoom,
  routeGroupOf,
  shouldReportError,
} from "@/http/middlewares/errorMiddleware";

const scope = { setTag: vi.fn() };

vi.mock("@sentry/node", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn((cb: (s: typeof scope) => void) => cb(scope)),
}));

function mockReq(overrides: Partial<Request> = {}): Request {
  return { originalUrl: "/api/v1/organismes", method: "GET", ...overrides } as Request;
}

function mockRes() {
  const res = {
    status: vi.fn(() => res),
    send: vi.fn(() => res),
  };
  return res as unknown as Response & { status: ReturnType<typeof vi.fn>; send: ReturnType<typeof vi.fn> };
}

function run(rawError: unknown, req: Request = mockReq()) {
  const res = mockRes();
  errorMiddleware()(rawError, req, res, vi.fn());
  return { status: res.status.mock.calls[0][0], body: res.send.mock.calls[0][0] };
}

function zodErrorOn(value: unknown): ZodError {
  const parsed = z.object({ nom: z.string() }).safeParse(value);
  if (parsed.success) throw new Error("le schéma aurait dû échouer");
  return parsed.error;
}

beforeEach(() => {
  vi.mocked(captureException).mockClear();
});

describe("normalizeToBoom", () => {
  it("laisse un Boom intact", () => {
    const boom = Boom.notFound("introuvable");
    expect(normalizeToBoom(boom)).toBe(boom);
  });

  it("transforme une ZodError nue en 400 portant issues et details", () => {
    const boom = normalizeToBoom(zodErrorOn({}));
    const payload = boom.output.payload as { issues?: unknown[]; details?: unknown };
    expect(boom.output.statusCode).toBe(400);
    expect(payload.issues).toHaveLength(1);
    expect(payload.details).toBe("Required");
  });

  it("transforme une InputValidationError en 400 portant details", () => {
    const boom = normalizeToBoom(new InputValidationError([{ message: "trop long", path: [], type: "array.max" }]));
    expect(boom.output.statusCode).toBe(400);
    expect((boom.output.payload as { details?: unknown }).details).toEqual([
      { message: "trop long", path: [], type: "array.max" },
    ]);
  });

  it("transforme une erreur nue en 500", () => {
    expect(normalizeToBoom(new Error("boom")).output.statusCode).toBe(500);
  });

  it("respecte un champ status porté par l'erreur", () => {
    expect(normalizeToBoom(Object.assign(new Error("nope"), { status: 418 })).output.statusCode).toBe(418);
  });

  it("accepte une valeur qui n'est pas une Error", () => {
    expect(normalizeToBoom("cassé").output.statusCode).toBe(500);
  });
});

describe("shouldReportError", () => {
  it("rapporte les 5xx", () => {
    expect(shouldReportError(Boom.internal())).toBe(true);
  });

  it.each([
    ["unauthorized", Boom.unauthorized()],
    ["forbidden", Boom.forbidden()],
    ["badRequest", Boom.badRequest()],
    ["notFound", Boom.notFound()],
  ])("ne rapporte pas un %s", (_label, boom) => {
    expect(shouldReportError(boom)).toBe(false);
  });
});

describe("routeGroupOf", () => {
  it.each([
    ["/api/v3/dossiers-apprenants", "ingestion-v3"],
    ["/api/v1/admin/impersonate", "admin"],
    ["/api/v1/auth/login", "auth"],
    ["/api/v1/password/reset-password", "auth"],
    ["/api/webhooks/brevo/whatsapp", "webhook"],
    ["/api/v1/organismes/search-by-uai", "organismes"],
    ["/api/inconnu", "other"],
  ])("classe %s en %s", (url, expected) => {
    expect(routeGroupOf(mockReq({ originalUrl: url } as Partial<Request>))).toBe(expected);
  });

  it("ne fabrique pas un groupe par identifiant", () => {
    const a = routeGroupOf(mockReq({ originalUrl: "/api/organismes/64f0a1b2c3d4e5f6a7b8c9d0" } as Partial<Request>));
    const b = routeGroupOf(mockReq({ originalUrl: "/api/organismes/74f0a1b2c3d4e5f6a7b8c9d1" } as Partial<Request>));
    expect(a).toBe(b);
  });
});

describe("errorKindOf", () => {
  it.each([
    [Boom.unauthorized(), "auth"],
    [Boom.forbidden(), "auth"],
    [Boom.tooManyRequests(), "rate-limit"],
    [Boom.badRequest(), "validation"],
    [Boom.internal(), "bug"],
  ])("classe %#", (boom, expected) => {
    expect(errorKindOf(boom)).toBe(expected);
  });
});

describe("errorMiddleware", () => {
  it("répond 400 sans capturer pour une ZodError nue", () => {
    const { status, body } = run(zodErrorOn({}));
    expect(status).toBe(400);
    expect(body.issues).toHaveLength(1);
    expect(captureException).not.toHaveBeenCalled();
  });

  it("répond 401 sans capturer", () => {
    expect(run(Boom.unauthorized()).status).toBe(401);
    expect(captureException).not.toHaveBeenCalled();
  });

  it("ne capture pas un 400 sur la route ERP", () => {
    const req = mockReq({ originalUrl: "/api/v3/dossiers-apprenants", method: "POST" } as Partial<Request>);
    expect(run(Boom.badRequest("invalide"), req).status).toBe(400);
    expect(captureException).not.toHaveBeenCalled();
  });

  it("capture une seule fois pour une erreur nue, et répond 500", () => {
    const err = new Error("boom");
    expect(run(err).status).toBe(500);
    expect(captureException).toHaveBeenCalledOnce();
    expect(captureException).toHaveBeenCalledWith(err, { mechanism: { type: "middleware", handled: false } });
  });

  it("capture une 5xx sur la route ERP", () => {
    const req = mockReq({ originalUrl: "/api/v3/dossiers-apprenants", method: "POST" } as Partial<Request>);
    run(Boom.internal("mongo down"), req);
    expect(captureException).toHaveBeenCalledOnce();
  });

  it("renseigne req.err pour logMiddleware", () => {
    const req = mockReq();
    const err = new Error("boom");
    errorMiddleware()(err, req, mockRes(), vi.fn());
    expect(req.err).toBe(err);
  });
});

describe("niveau d'alerte", () => {
  it("classe une erreur serveur en « jour »", () => {
    run(new Error("boom"));

    expect(scope.setTag).toHaveBeenCalledWith("alert_tier", "jour");
    expect(scope.setTag).toHaveBeenCalledWith("http_status_class", "5xx");
  });

  it("ne pose aucun tag quand l'erreur n'est pas rapportée", () => {
    run(Boom.unauthorized("nope"));

    expect(scope.setTag).not.toHaveBeenCalled();
  });
});
