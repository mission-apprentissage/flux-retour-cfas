// ROME = Répertoire Opérationnel des Métiers et des Emplois

export type FamilleMetier = {
  id: string;
  name: string;
  children: DomaineProfessionnel[];
} & NormalizedName;

type DomaineProfessionnel = {
  id: string;
  name: string;
  children: FicheMetier[];
} & NormalizedName;

type FicheMetier = {
  id: string;
  name: string;
} & NormalizedName;

interface NormalizedName {
  normalizedName: string;
}
