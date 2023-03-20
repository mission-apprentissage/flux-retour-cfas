import { AuthContext } from "./common/model/internal/AuthContext";

// to make the file a module and avoid the TypeScript error
export {};

declare global {
  namespace Express {
    interface Request {
      // used for server events
      id: string;

      // authentication context
      user: AuthContext;

      // populated by the errorMiddleware
      err?: Error;

      // populated by the server-events routes
      requestId?: number;
    }
  }
}
