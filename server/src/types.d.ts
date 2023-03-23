import { ObjectId } from "mongodb";
import { Organisation } from "./common/model/organisations.model";

export {};

export interface AuthContext<IOrganisation = Organisation> {
  _id: ObjectId;
  email: string;
  organisation_id: ObjectId;

  // populated via $lookup
  organisation: IOrganisation;

  // fields that should be removed
  tmpPwd: string;

  // legacy field used for ERPs
  username: string;
}

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
