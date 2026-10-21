"use client";

import { ORGANISATION_TYPE } from "shared/constants";

import { useAuth } from "@/app/_context/UserContext";
import { isAdminUser } from "@/app/suivi-des-indicateurs/access";

import { useUserRegions } from "../hooks/useUserRegions";
import styles from "../sections/SuiviTraitementMLCard.module.css";
import { getRegionLabel } from "../utils";

/**
 * Périmètre des données nominatives (liste des collaborations) : régions de l'utilisateur, ou son département
 * pour une DDETS. `regions` vaut `null` pour l'admin, qui voit tout.
 */
export function usePerimetreNominatif() {
  const { user } = useAuth();
  const { regions } = useUserRegions();
  if (isAdminUser(user ?? null)) return { regions: null, label: null };

  const departement =
    user?.organisation?.type === ORGANISATION_TYPE.DDETS
      ? (user.organisation as { code_departement?: string }).code_departement
      : undefined;
  return { regions, label: departement ? `département ${departement}` : regions.map(getRegionLabel).join(", ") };
}

export function NotePerimetre() {
  const { label } = usePerimetreNominatif();
  return label ? <p className={styles.scopeNote}>Liste limitée à votre territoire : {label}.</p> : null;
}
