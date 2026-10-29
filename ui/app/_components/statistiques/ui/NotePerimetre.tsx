"use client";

import { Notice } from "@codegouvfr/react-dsfr/Notice";
import { ORGANISATION_TYPE } from "shared/constants";

import { useAuth } from "@/app/_context/UserContext";
import { isAdminUser } from "@/app/suivi-des-indicateurs/access";

import { useUserRegions } from "../hooks/useUserRegions";
import { getRegionLabel } from "../utils";

import styles from "./NotePerimetre.module.css";

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
  const territoireRegions = regions.length
    ? `${regions.length > 1 ? "régions" : "région"} ${regions.map(getRegionLabel).join(", ")}`
    : "";
  return { regions, label: departement ? `département ${departement}` : territoireRegions };
}

export function NotePerimetre() {
  const { user } = useAuth();
  const { label } = usePerimetreNominatif();
  if (!label) return null;

  const emetteurs = user?.organisation?.type === ORGANISATION_TYPE.ARML ? "aux Missions Locales" : "par des CFA";
  return (
    <Notice
      classes={{ root: styles.root, title: styles.title, description: styles.description }}
      title="Information"
      description={
        <>
          Les informations de collaboration affichées concernent uniquement les dossiers de jeunes transmis {emetteurs}{" "}
          de votre territoire : <strong>{label}</strong>
        </>
      }
    />
  );
}
