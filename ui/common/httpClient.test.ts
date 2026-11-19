import { describe, expect, it } from "vitest";

import { HTTPError, isClientHttpError } from "./httpClient";

const erreurHttp = (status: number) =>
  new HTTPError(`Server returned ${status}`, { status, data: {}, headers: {} } as never, status);

describe("isClientHttpError", () => {
  it("reconnaît les refus 4xx de l'API", () => {
    expect(isClientHttpError(erreurHttp(400))).toBe(true);
    expect(isClientHttpError(erreurHttp(404))).toBe(true);
    expect(isClientHttpError(erreurHttp(429))).toBe(true);
  });

  it("laisse passer les erreurs serveur et les autres erreurs", () => {
    expect(isClientHttpError(erreurHttp(500))).toBe(false);
    expect(isClientHttpError(erreurHttp(503))).toBe(false);
    expect(isClientHttpError(new TypeError("Cannot read properties of undefined"))).toBe(false);
    expect(isClientHttpError("404")).toBe(false);
  });
});
