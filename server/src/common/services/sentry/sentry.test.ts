import { describe, expect, it } from "vitest";

import { detectRuntime } from "./sentry";

const argv = (...args: string[]) => ["/usr/bin/node", "/app/dist/index.js", ...args];

describe("detectRuntime", () => {
  it.each([
    ["job_processor:start", "job-processor"],
    ["queue_processor:start", "queue-processor"],
    ["start", "api"],
    ["hydrate:daily", "cli"],
    ["migrations:up", "cli"],
  ])("classe « %s » en %s", (command, expected) => {
    expect(detectRuntime(argv(command))).toBe(expected);
  });

  it("ignore les options placées avant la commande", () => {
    expect(detectRuntime(argv("--verbose", "job_processor:start"))).toBe("job-processor");
  });

  it("classe le serveur avec processor intégré comme api", () => {
    expect(detectRuntime(argv("start", "--withProcessor"))).toBe("api");
  });

  it("retombe sur cli sans commande", () => {
    expect(detectRuntime(argv())).toBe("cli");
  });
});
