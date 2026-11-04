import { useState } from "react";

/** Page courante, ramenée à 1 dès le rendu où les paramètres changent (évite une requête sur une page périmée). */
export function usePageForParams(params: unknown): [number, (page: number) => void] {
  const key = JSON.stringify(params);
  const [state, setState] = useState({ key, page: 1 });
  return [state.key === key ? state.page : 1, (page: number) => setState({ key, page })];
}
