import { ObjectId } from "mongodb";
import { Acl } from "shared/constants/permissions";

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
  invalided_token?: boolean;

  // populated via $lookup
  organisation: IOrganisation;

  // field used for ERPs
  source?: string;
  // source organisme id for V3 API
  source_organisme_id?: string;
  // legacy field used for ERPs
  username: string;

  // only admins can impersonate organisations
  impersonating?: boolean;

  acl: Acl;
}
