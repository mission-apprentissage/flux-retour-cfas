import React from "react";

import { Organisation } from "./Organisation";

export interface AuthContext<IOrganisation = Organisation> {
  _id: string;
  civility: "Madame" | "Monsieur";
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  organisation_id: string;
  account_status: "PENDING_EMAIL_VALIDATION" | "PENDING_ADMIN_VALIDATION" | "CONFIRMED";
  has_accept_cgu_version: string;
  organisation: IOrganisation;

  // legacy field used for ERPs
  username: string;

  // only admins can impersonate organisations
  impersonating?: boolean;
}

// contexte côté UI
export interface IAuthenticationContext {
  auth: AuthContext;
  setAuth: React.Dispatch<AuthContext>;
}
