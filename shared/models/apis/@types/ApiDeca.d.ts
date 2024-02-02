export interface Contrat {
  alternant: Alternant;
  formation: Formation;
  etablissementFormation: EtablissementFormation;
  organismeFormationResponsable: OrganismeFormationResponsable;
  detailsContrat: DetailsContrat;
  rupture?: Rupture;
  employeur: Employeur;
}

export interface Alternant {
  nom: string;
  prenom: string;
  sexe: string;
  dateNaissance: string;
  departementNaissance: string;
  nationalite: number?;
  handicap: boolean?;
  courriel: string?;
  telephone: string?;
  adresse: Adresse?;
  derniereClasse: string?;
}

export interface Adresse {
  numero: number?;
  voie: string?;
  codePostal: string?;
}

export interface DetailsContrat {
  noContrat: string;
  dateDebutContrat: string;
  statut: Statut;
  dateFinContrat: string;
  dateEffetAvenant: string;
  noAvenant: string?;
}

enum Statut {
  Annule = "Annulé",
  Corrige = "Corrigé",
  Empty = "",
  Rompu = "Rompu",
  Supprime = "Supprimé",
}

export interface Employeur {
  codeIdcc: string;
}

export interface EtablissementFormation {
  siret: string?; // Organisme responsable
}

export interface Formation {
  dateDebutFormation: string;
  dateFinFormation: string;
  codeDiplome: string;
  rncp: string?;
  intituleOuQualification: string;
}

export interface OrganismeFormationResponsable {
  uaiCfa: string?;
  siret: string?;
}

export interface Rupture {
  dateEffetRupture: string;
}

interface Metadonnees {
  page: number;
  totalPages: number;
  totalElements: number;
}

type ApiDeca = {
  metadonnees: Metadonnees;
  contrats: Contrat[];
};

export default ApiDeca;
