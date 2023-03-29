import React from "react";
import { Organisation } from "./Organisation";

export interface AuthContext<IOrganisation = Organisation> {
  _id: string;
  civility: string;
  nom: string;
  prenom: string;
  email: string;
  organisation_id: string;
  // account_status: "NOT_CONFIRMED" | "PENDING_EMAIL_VALIDATION" | "PENDING_ADMIN_VALIDATION";
  account_status: string; // FIXME, mettre les bons types une fois l'UI revisitée avec les nouvelles permissions
  has_accept_cgu_version: string;

  organisation: IOrganisation;

  // legacy field used for ERPs
  username: string;
}

// contexte côté UI
export interface IAuthenticationContext {
  auth: AuthContext;
  setAuth: React.Dispatch<AuthContext>;
}
