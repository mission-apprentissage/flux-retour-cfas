import type { ReactNode } from "react";
import { ML_ALERTE_SEUILS, type IMlAlerte } from "shared/models/data/nationalStats.model";

import { AlertesActivite } from "./AlertesActivite";

const formatJours = (valeur: number | null) =>
  valeur === null ? "" : ` (${valeur.toLocaleString("fr-FR")} jours en moyenne)`;

const ALERTE_LIBELLES: Record<IMlAlerte["type"], (valeur: number | null) => ReactNode> = {
  delai_collab: (valeur) => (
    <>
      Cette ML a un <strong>délai de traitement</strong> des collabs supérieur à {ML_ALERTE_SEUILS.delai_collab_jours}{" "}
      jours{formatJours(valeur)}
    </>
  ),
  a_recontacter: (valeur) => (
    <>
      Cette ML a <strong>plus de {ML_ALERTE_SEUILS.a_recontacter} jeunes à recontacter</strong>
      {valeur === null ? "" : ` (${valeur.toLocaleString("fr-FR")})`}
    </>
  ),
  collab_sans_compte: () => (
    <>
      Cette ML a <strong>reçu des demandes de collab mais n&apos;utilise pas encore le TBA</strong>
    </>
  ),
  non_engagee: () => (
    <>
      Cette ML <strong>n&apos;est pas encore une ML engagée</strong>
    </>
  ),
  inactive: () => (
    <>
      Cette ML{" "}
      <strong>n&apos;a pas utilisé le Tableau de bord depuis {ML_ALERTE_SEUILS.inactivite_jours / 7} semaines</strong>
    </>
  ),
};

export function MlAlertesActivite({ alertes }: { alertes: IMlAlerte[] }) {
  return (
    <AlertesActivite
      alertes={alertes.map((alerte) => ({ cle: alerte.type, contenu: ALERTE_LIBELLES[alerte.type](alerte.valeur) }))}
    />
  );
}
