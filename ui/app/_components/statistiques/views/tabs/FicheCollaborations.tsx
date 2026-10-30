"use client";

import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import styles from "./FicheCollaborations.module.css";

export function Carte({ titre, children }: { titre: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.carte}>
      <h3 className={styles.titreCarte}>{titre}</h3>
      {children}
    </section>
  );
}

export function Kpi({ label, tooltip, valeur }: { label: string; tooltip?: string; valeur: ReactNode }) {
  return (
    <div className={styles.kpi}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValeur}>
        {valeur}
        {tooltip && <Tooltip kind="hover" title={tooltip} />}
      </strong>
    </div>
  );
}

export const formatJours = (jours: number | null) =>
  jours === null ? "—" : `${jours.toLocaleString("fr-FR")} ${jours > 1 ? "jours" : "jour"}`;

const VUE_PARAM = "collab_vue";
type Vue = "chiffres" | "liste";

export function useVueCollaborations(listeAutorisee: boolean) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const vue: Vue = listeAutorisee && searchParams?.get(VUE_PARAM) === "liste" ? "liste" : "chiffres";
  const setVue = (nouvelle: Vue) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (nouvelle === "liste") params.set(VUE_PARAM, "liste");
    else params.delete(VUE_PARAM);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  return [vue, setVue] as const;
}

export function BasculeCollaborations({ vue, onChange }: { vue: Vue; onChange: (vue: Vue) => void }) {
  return (
    <SegmentedControl
      hideLegend
      legend="Affichage des collaborations"
      className={styles.bascule}
      segments={[
        {
          label: "Vue chiffrée",
          iconId: "fr-icon-bar-chart-box-line",
          nativeInputProps: { checked: vue === "chiffres", onChange: () => onChange("chiffres") },
        },
        {
          label: "Détails des collaborations",
          iconId: "fr-icon-list-unordered",
          nativeInputProps: { checked: vue === "liste", onChange: () => onChange("liste") },
        },
      ]}
    />
  );
}
