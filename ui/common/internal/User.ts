export interface UsersPaginated {
  pagination: Pagination;
  data: User[];
}

export interface User {
  _id: string;
  account_status: string;
  password_updated_at: Date;
  created_at: Date;
  email: string;
  civility: string;
  nom: string;
  prenom: string;
  fonction: string;
  telephone: string;
  has_accept_cgu_version: string;
  organisation_id: string;
  organisation: UserOrganisation;
  last_connection: string;
}

export interface UserOrganisation {
  _id: string;
  created_at: Date;
  type: string;
  uai: string;
  siret: string;
  code_departement: string;
  code_region: string;
  organisme: UserOrganisme;
  label: string;
}

export interface UserOrganisme {
  _id: string;
  nom: string;
  reseaux: any[];
  nature: string;
  raison_sociale: string;
  adresse?: {
    departement?: string;
    region?: string;
  };
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}
