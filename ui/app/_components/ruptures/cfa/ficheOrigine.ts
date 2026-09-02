import { CFA_SUIVI_CATEGORY } from "shared/models/routes/organismes/cfa";

/** Liste d'où provient une fiche jeune : deux listes y mènent, avec des racines de fil d'Ariane distinctes. */
export const CFA_FICHE_ORIGINE = {
  EFFECTIFS: "effectifs",
  COLLABORATIONS: "collaborations",
} as const;

export type CfaFicheOrigine = (typeof CFA_FICHE_ORIGINE)[keyof typeof CFA_FICHE_ORIGINE];

/** Lien vers la fiche d'un effectif, en conservant la liste d'où l'on vient. */
export function cfaFicheHref(effectifId: string, origine: CfaFicheOrigine, category?: string): string {
  const params = new URLSearchParams({ origine });
  if (category) {
    params.set("category", category);
  }
  return `/cfa/${effectifId}?${params.toString()}`;
}

/**
 * Racine du fil d'Ariane de la fiche.
 * Sans provenance — lien direct, favori — on retombe sur la liste principale des effectifs.
 */
export function getCfaListeInfo(origine?: string | null, category?: string | null): { label: string; href: string } {
  if (origine !== CFA_FICHE_ORIGINE.COLLABORATIONS) {
    return { label: "Effectifs de l'établissement", href: "/cfa/effectifs" };
  }

  // Une catégorie inattendue produirait un retour sur un onglet inexistant.
  const onglet = (Object.values(CFA_SUIVI_CATEGORY) as string[]).includes(category ?? "") ? category : null;
  return {
    label: "Collaborations avec les Missions Locales",
    href: onglet ? `/cfa/collaborations?category=${onglet}` : "/cfa/collaborations",
  };
}
