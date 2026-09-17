declare module "passport" {
  import type { Request, RequestHandler } from "express";

  export interface Strategy {
    name?: string;
    authenticate(req: Request, options?: unknown): void;
  }

  export interface AuthenticateOptions {
    session?: boolean;
    failWithError?: boolean;
  }

  interface Passport {
    use(strategy: Strategy): this;
    use(name: string, strategy: Strategy): this;
    initialize(): RequestHandler;
    authenticate(strategy: string | string[], options?: AuthenticateOptions): RequestHandler;
  }

  const passport: Passport;
  export default passport;
}
