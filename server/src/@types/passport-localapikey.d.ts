declare module "passport-localapikey" {
  import type { Request } from "express";

  interface StrategyOptions {
    apiKeyField?: string;
    apiKeyHeader?: string;
  }

  type VerifyCallback = (error: unknown, user?: unknown, info?: unknown) => void;

  export class Strategy {
    constructor(options: StrategyOptions, verify: (apiKey: string, done: VerifyCallback) => void);
    constructor(verify: (apiKey: string, done: VerifyCallback) => void);
    name: string;
    authenticate(req: Request, options?: unknown): void;
  }
}
