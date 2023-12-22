export interface DuplicateOrganismeDetail {
  id: string;
  uai: string;
  siret: string;
  nom: string;
  raison_sociale: string;
  enseigne: string;
  nature: string;
  ferme: boolean;
  last_transmission_date: Date;
  created_at: string;
  updated_at: string;
  effectifs_count: number;
  nbUsers: number;
}
