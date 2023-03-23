import { AuthContext } from "./common/model/internal/AuthContext";

export {};

declare global {
  namespace Express {
    interface Request {
      // used for server events
      id: string;

      // authentication context
      user: AuthContext;
    }
  }
}
