interface Contrat {
  alternant: Alternant;
  formation: Formation;
  etablissementFormation: EtablissementFormation;
  organismeFormationResponsable: OrganismeFormationResponsable;
  detailsContrat: DetailsContrat;
  rupture: Rupture?;
  employeur: Employeur;
}

interface Alternant {
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

interface Adresse {
  numero: number?;
  voie: string?;
  codePostal: string?;
}

interface DetailsContrat {
  noContrat: string;
  dateDebutContrat: string; // TODO Check DGEFP
  statut: string; // TODO Check DGEFP
  dateFinContrat: string;
  dateEffetAvenant: string;
  noAvenant: string?;
}

interface Employeur {
  codeIdcc: string;
}

interface EtablissementFormation {
  siret: string?; // Organisme responsable
}

interface Formation {
  dateDebutFormation: string;
  dateFinFormation: string;
  codeDiplome: string;
  rncp: string?;
  intituleOuQualification: string;
}

interface OrganismeFormationResponsable {
  uaiCfa: string?;
  siret: string?;
}

interface Rupture {
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
