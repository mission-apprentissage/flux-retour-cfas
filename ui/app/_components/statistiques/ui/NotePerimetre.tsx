"use client";

import { useAuth } from "@/app/_context/UserContext";
import { isAdminUser } from "@/app/suivi-des-indicateurs/access";

import { TERRITOIRE_FRANCE, useStatsFilters } from "../hooks/useStatsFilters";
import styles from "../sections/SuiviTraitementMLCard.module.css";

/**
 * En vue France, les listes restent limitées au territoire de l'utilisateur (hors admin) : la note le rappelle.
 * Un `territoire` explicite (département d'une DDETS) l'affiche quelle que soit la région choisie.
 */
export function NotePerimetre({ territoire }: { territoire?: string }) {
  const { region, territoireOptions } = useStatsFilters();
  const { user } = useAuth();
  if (isAdminUser(user ?? null) || (region && !territoire)) return null;

  const limitee =
    territoire ??
    territoireOptions
      .filter((option) => option.value !== TERRITOIRE_FRANCE)
      .map((option) => option.label)
      .join(", ");
  return limitee ? <p className={styles.scopeNote}>Liste limitée à votre territoire : {limitee}.</p> : null;
}
