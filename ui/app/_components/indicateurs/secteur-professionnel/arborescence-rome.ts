// ROME = Répertoire Opérationnel des Métiers et des Emplois

import { normalize } from "shared";

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

export type RomeNode = {
  id: string;
  name: string;
  normalizedName: string;
  children?: RomeNode[];
} & NormalizedName;

export function normalizeRomeNodeInPlace(node: RomeNode): RomeNode {
  node.normalizedName = normalize(node.name);
  node.children?.forEach((node) => normalizeRomeNodeInPlace(node));
  return node;
}

/**
 * Filtre les noeuds pour une recherche et conserve les ancètres pour garder la hiérarchie de l'arbre.
 */
export function filterRomeNodesByTerm(nodes: RomeNode[], searchTerm: string): RomeNode[] {
  return nodes
    .map((node) => {
      const children = node.children ? filterRomeNodesByTerm(node.children, searchTerm) : [];
      return children.length > 0 || node.normalizedName.includes(searchTerm)
        ? {
            ...node,
            children,
          }
        : null;
    })
    .filter((node) => node !== null) as RomeNode[];
}
