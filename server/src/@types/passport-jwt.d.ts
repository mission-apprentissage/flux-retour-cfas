declare module "passport-jwt" {
  import type { Request } from "express";

  export type JwtFromRequestFunction = (req: Request) => string | null;

  export interface StrategyOptions {
    jwtFromRequest: JwtFromRequestFunction;
    secretOrKey?: string;
  }

  export type VerifiedCallback = (error: unknown, user?: unknown, info?: unknown) => void;

  export class Strategy<TPayload = Record<string, unknown>> {
    constructor(options: StrategyOptions, verify: (payload: TPayload, done: VerifiedCallback) => void);
    name: string;
    authenticate(req: Request, options?: unknown): void;
  }

  export const ExtractJwt: {
    fromBodyField(fieldName: string): JwtFromRequestFunction;
    fromAuthHeaderAsBearerToken(): JwtFromRequestFunction;
    fromHeader(headerName: string): JwtFromRequestFunction;
    fromUrlQueryParameter(paramName: string): JwtFromRequestFunction;
    fromExtractors(extractors: JwtFromRequestFunction[]): JwtFromRequestFunction;
  };
}
