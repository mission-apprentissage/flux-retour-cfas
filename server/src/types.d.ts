import { ObjectId } from "mongodb";
import { Organisation } from "./common/model/organisations.model";

export {};

interface User {
  _id: ObjectId;
  email: string;
  organisation_id: ObjectId;

  // computed via $lookup
  organisation: Organisation;

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
      user: User;
    }
  }
}
