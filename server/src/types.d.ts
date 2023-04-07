// to make the file a module and avoid the TypeScript error
export {};

declare global {
  namespace Express {
    export interface Request {
      // used for server events
      id?: string;

      // authentication context
      user?: any;

      // populated by the errorMiddleware
      err?: Error;

      // populated by the server-events routes
      requestId?: number;
    }
  }
}
