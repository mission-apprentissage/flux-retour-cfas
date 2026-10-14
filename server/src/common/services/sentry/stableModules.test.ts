import type { SentryEventLike } from "shared/observability/sentryPolicy";
import { describe, expect, it } from "vitest";

import { stabilizeChunkModules } from "./stableModules";

const withModules = (...modules: string[]): SentryEventLike => ({
  exception: { values: [{ stacktrace: { frames: modules.map((module) => ({ module })) } }] },
});

const modulesOf = (event: SentryEventLike) =>
  event.exception?.values?.[0].stacktrace?.frames?.map((frame) => frame.module);

describe("stabilizeChunkModules", () => {
  it("donne le même module à un chunk quel que soit son hash de build", () => {
    const before = stabilizeChunkModules(withModules("chunk-FVQR3PJZ"));
    const after = stabilizeChunkModules(withModules("chunk-ENHUMGII"));

    expect(modulesOf(before)).toEqual(modulesOf(after));
  });

  it("laisse intacts les autres modules", () => {
    const event = stabilizeChunkModules(withModules("index", "job-processor.dist:index", "task_queues"));

    expect(modulesOf(event)).toEqual(["index", "job-processor.dist:index", "task_queues"]);
  });

  it("tolère un événement sans pile", () => {
    expect(stabilizeChunkModules({ message: "x" })).toEqual({ message: "x" });
  });
});
