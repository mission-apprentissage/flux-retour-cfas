import { ObjectId } from "mongodb";
import { Organisation } from "../organisations.model";

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
