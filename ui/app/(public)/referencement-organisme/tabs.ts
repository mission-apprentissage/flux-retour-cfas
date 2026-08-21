import type { PlausibleGoalType } from "shared/constants/plausible-goals";

export const AIDE_TABS = [
  { slug: "siret", label: "Siret", goal: "referencement_clic_onglet_siret" },
  { slug: "uai", label: "UAI", goal: "referencement_clic_onglet_uai" },
  { slug: "nature", label: "Nature", goal: "referencement_clic_onglet_nature" },
  {
    slug: "relations-entre-organismes",
    label: "Relations entre organismes",
    goal: "referencement_clic_onglet_relations_entre_organismes",
  },
  { slug: "qualiopi", label: "Qualiopi", goal: "referencement_clic_onglet_qualiopi" },
  { slug: "code-rncp", label: "Code RNCP", goal: "referencement_clic_onglet_code_rncp" },
] as const satisfies readonly { slug: string; label: string; goal: PlausibleGoalType }[];

export type AideTabSlug = (typeof AIDE_TABS)[number]["slug"];

const DEFAULT_TAB_SLUG: AideTabSlug = "siret";

export function resolveTabSlug(section: string | null | undefined): AideTabSlug {
  if (!section) return DEFAULT_TAB_SLUG;

  const normalized = section.trim().toLowerCase().replace(/\s+/g, "-");
  const match = AIDE_TABS.find((tab) => tab.slug === normalized);

  return match ? match.slug : DEFAULT_TAB_SLUG;
}
