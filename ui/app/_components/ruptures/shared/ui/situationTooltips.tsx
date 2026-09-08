import { ML_SITUATION_DOSSIER } from "shared/constants";

/** Infobulles de la colonne « Situation » (wording produit des maquettes). */
export const ML_SITUATION_TOOLTIPS: Record<ML_SITUATION_DOSSIER, React.ReactNode> = {
  [ML_SITUATION_DOSSIER.BESOIN_AIDE_HORS_RUPTURE]:
    "Le CFA a indiqué que ce jeune ne présente pas de signaux de rupture potentielle mais a toutefois besoin d’aide ou d’un accompagnement extra professionnel.",
  [ML_SITUATION_DOSSIER.PREVENTION_RUPTURE]:
    "Le CFA a indiqué que ce jeune présente des signaux de rupture potentielle.",
  [ML_SITUATION_DOSSIER.RUPTURE]:
    "Le CFA a indiqué que ce jeune est en rupture de contrat actuellement, mais il est maintenu en formation au CFA.",
  [ML_SITUATION_DOSSIER.ABANDON]: (
    <span>
      Le CFA a indiqué que le jeune n’est plus en formation dans le CFA. <br />
      <b>Le jeune a quitté le CFA.</b>
    </span>
  ),
};
