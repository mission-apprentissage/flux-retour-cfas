import type { Server } from "node:http";

import HttpTerminator from "lil-http-terminator";

import logger from "@/common/logger";

// lil-http-terminator détruit les sockets encore actifs après ce délai (1 s par défaut). Docker Swarm envoie SIGKILL à 10 s.
export const HTTP_SHUTDOWN_GRACE_MS = 8_000;

export function createHttpTerminator(server: Server, graceMs: number = HTTP_SHUTDOWN_GRACE_MS) {
  return HttpTerminator({
    server,
    gracefulTerminationTimeout: graceMs,
    maxWaitTimeout: graceMs + 2_000,
    logger,
  });
}
