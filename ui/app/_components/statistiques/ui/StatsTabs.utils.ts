import type { FrIconClassName, RiIconClassName } from "@codegouvfr/react-dsfr/fr/generatedFromCss/classNames";

export interface StatsTabDefinition {
  id: string;
  label: string;
  iconId?: FrIconClassName | RiIconClassName;
}

/** L'onglet demandé par `?tab=` s'il existe, sinon le premier onglet. */
export function resolveTabId(requested: string | null | undefined, tabs: ReadonlyArray<StatsTabDefinition>): string {
  const match = tabs.find((tab) => tab.id === requested);
  return match ? match.id : (tabs[0]?.id ?? "");
}
