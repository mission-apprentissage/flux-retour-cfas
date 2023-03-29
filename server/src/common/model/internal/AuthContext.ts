import { ObjectId } from "mongodb";
import { Organisation } from "../organisations.model";

export interface AuthContext<IOrganisation = Organisation> {
  _id: ObjectId;
  civility: string;
  nom: string;
  prenom: string;
  email: string;
  organisation_id: ObjectId;
  account_status: string; // FIXME, mettre les bons types une fois l'UI revisitée avec les nouvelles permissions
  has_accept_cgu_version: string;

  // populated via $lookup
  organisation: IOrganisation;

  // fields that should be removed
  tmpPwd: string;

  // legacy field used for ERPs
  username: string;
}
