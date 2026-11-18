import http from "node:http";
import type { AddressInfo } from "node:net";

import { describe, expect, it } from "vitest";

import { createHttpTerminator } from "./terminator";

async function startServer(responseDelayMs: number) {
  let requestReceived!: () => void;
  const received = new Promise<void>((resolve) => {
    requestReceived = resolve;
  });

  const server = http.createServer((_req, res) => {
    requestReceived();
    const timer = setTimeout(() => res.end("ok"), responseDelayMs);
    res.on("close", () => clearTimeout(timer));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  return { server, received, port: (server.address() as AddressInfo).port };
}

const get = (port: number) =>
  new Promise<{ status: number; body: string }>((resolve, reject) => {
    http
      .get({ host: "127.0.0.1", port, agent: false }, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
      })
      .on("error", reject);
  });

describe("createHttpTerminator", () => {
  it("laisse finir une requête plus longue que l'attente par défaut de la bibliothèque (1 s)", async () => {
    const { server, received, port } = await startServer(1_300);
    const terminator = createHttpTerminator(server);
    const response = get(port);
    await received;

    const debut = Date.now();
    const result = await terminator.terminate();

    expect(result.success).toBe(true);
    expect(Date.now() - debut).toBeGreaterThanOrEqual(1_000);
    await expect(response).resolves.toEqual({ status: 200, body: "ok" });
  });

  it("coupe la requête quand elle dépasse l'attente accordée", async () => {
    const { server, received, port } = await startServer(1_000);
    const terminator = createHttpTerminator(server, 100);
    const response = expect(get(port)).rejects.toThrow();
    await received;

    await terminator.terminate();

    await response;
  });
});
