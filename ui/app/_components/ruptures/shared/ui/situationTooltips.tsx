import { ML_SITUATION_DOSSIER } from "shared/constants";

/** Infobulles de la colonne « Situation » (wording produit des maquettes). */
export const ML_SITUATION_TOOLTIPS: Record<ML_SITUATION_DOSSIER, React.ReactNode> = {
  [ML_SITUATION_DOSSIER.BESOIN_AIDE_HORS_RUPTURE]:
    "Le CFA a indiqué que ce jeune ne présente pas de signaux de rupture potentielle mais a toutefois besoin d’aide ou d’un accompagnement extra professionnel.",
  [ML_SITUATION_DOSSIER.PREVENTION_RUPTURE]:
    "Le CFA a indiqué que ce jeune présente des signaux de rupture potentielle.",
  [ML_SITUATION_DOSSIER.INSCRIT_SANS_CONTRAT]: (
    <span>
      Le CFA a indiqué que ce jeune s’est inscrit à la formation et l’a peut-être déjà commencé mais il n’a pas encore
      trouvé de contrat dans une entreprise pour son apprentissage. <br />
      <b>
        Le cadre de l’apprentissage laisse 3 mois au jeune pour trouver un contrat en entreprise à partir du début de sa
        formation au CFA.
      </b>
    </span>
  ),
  [ML_SITUATION_DOSSIER.RUPTURE]:
    "Le CFA a indiqué que ce jeune est en rupture de contrat actuellement, mais il est maintenu en formation au CFA.",
  [ML_SITUATION_DOSSIER.ABANDON]: (
    <span>
      Le CFA a indiqué que le jeune n’est plus en formation dans le CFA. <br />
      <b>Le jeune a quitté le CFA.</b>
    </span>
  ),
};
