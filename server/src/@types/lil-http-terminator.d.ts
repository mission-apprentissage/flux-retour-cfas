declare module "lil-http-terminator" {
  import type { Server } from "node:http";

  interface HttpTerminatorOptions {
    server: Server;
    gracefulTerminationTimeout?: number;
    maxWaitTimeout?: number;
    logger?: { warn: (...args: unknown[]) => void };
  }

  interface TerminationResult {
    success: boolean;
    code: "TERMINATED" | "TIMED_OUT" | "SERVER_ERROR" | "INTERNAL_ERROR";
    message: string;
    error?: Error;
  }

  export default function HttpTerminator(options: HttpTerminatorOptions): { terminate(): Promise<TerminationResult> };
}
