import { ObjectId } from "mongodb";
import { Acl, SourceApprenant } from "shared";
import { IOrganisation } from "shared/models/data/organisations.model";

export interface AuthContext<I = IOrganisation> {
  _id: ObjectId;
  civility: string;
  nom: string;
  prenom: string;
  email: string;
  organisation_id: ObjectId;
  account_status: "PENDING_EMAIL_VALIDATION" | "PENDING_ADMIN_VALIDATION" | "CONFIRMED";
  has_accept_cgu_version: string;

  // populated via $lookup
  organisation: I;

  // field used for ERPs
  source?: SourceApprenant;
  // source organisme id for V3 API
  source_organisme_id?: string;
  // legacy field used for ERPs
  username?: string;
  last_connection?: Date;
  created_at?: Date;
  fonction?: string;
  password_updated_at?: Date;
  telephone?: string;

  // only admins can impersonate organisations
  impersonating?: boolean;

  acl: Acl;
}
