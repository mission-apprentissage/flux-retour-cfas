import { ObjectId } from "mongodb";

import { Organisation } from "@/common/model/organisations.model";

export interface AuthContext<IOrganisation = Organisation> {
  _id: ObjectId;
  civility: string;
  nom: string;
  prenom: string;
  email: string;
  organisation_id: ObjectId;
  account_status: "PENDING_EMAIL_VALIDATION" | "PENDING_ADMIN_VALIDATION" | "CONFIRMED";
  has_accept_cgu_version: string;

  // populated via $lookup
  organisation: IOrganisation;

  // field used for ERPs
  source?: string;
  // legacy field used for ERPs
  username: string;

  // only admins can impersonate organisations
  impersonating?: boolean;
}
