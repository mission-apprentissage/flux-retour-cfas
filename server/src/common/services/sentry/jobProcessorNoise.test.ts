import { describe, it, expect } from "vitest";

import { dropJobProcessorNoise, type SentryEventLike } from "./jobProcessorNoise";

const exception = (value: string, extra?: Record<string, unknown>): SentryEventLike => ({
  exception: { values: [{ type: "Error", value }] },
  ...(extra ? { extra } : {}),
});

describe("dropJobProcessorNoise", () => {
  it("supprime « Job aborted »", () => {
    expect(dropJobProcessorNoise(exception("[job-processor] Job aborted"))).toBeNull();
  });

  it("supprime « Job aborted » porté par un message", () => {
    expect(dropJobProcessorNoise({ message: "[job-processor] Job aborted" })).toBeNull();
  });

  it("supprime un heartbeat non terminal", () => {
    expect(dropJobProcessorNoise(exception("connection refused", { successiveErrorsCount: 1 }))).toBeNull();
    expect(dropJobProcessorNoise(exception("connection refused", { successiveErrorsCount: 2 }))).toBeNull();
  });

  it("conserve l'échec terminal du heartbeat", () => {
    const event = exception("connection refused", { successiveErrorsCount: 3 });
    expect(dropJobProcessorNoise(event)).toBe(event);
  });

  it("conserve une erreur de job ordinaire", () => {
    const event = exception("effectif invalide", { job: "hydrate:daily" });
    expect(dropJobProcessorNoise(event)).toBe(event);
  });

  it("conserve un événement sans exception ni message", () => {
    const event: SentryEventLike = {};
    expect(dropJobProcessorNoise(event)).toBe(event);
  });

  it("ignore un successiveErrorsCount qui n'est pas un nombre", () => {
    const event = exception("boom", { successiveErrorsCount: "1" });
    expect(dropJobProcessorNoise(event)).toBe(event);
  });
});
