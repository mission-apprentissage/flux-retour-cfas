import { IEffectif } from "shared/models/data/effectifs.model";

import { formationsDb } from "@/common/model/collections";

export async function getFormationCfd(effectif: IEffectif): Promise<string | null> {
  if (effectif.formation?.cfd) {
    const formation = await formationsDb().findOne({ cfd: effectif.formation.cfd });
    if (formation) {
      return formation.cfd;
    }
  }

  if (effectif.formation?.rncp) {
    const normalizedRncp = effectif.formation.rncp.toUpperCase().startsWith("RNCP")
      ? effectif.formation.rncp.toUpperCase()
      : `RNCP${effectif.formation.rncp}`;
    const formation = await formationsDb().findOne({ rncps: { $in: [normalizedRncp] } });
    if (formation) {
      return formation.cfd;
    }
  }

  return effectif.formation?.cfd ?? null;
}

/**
 * Méthode d'extraction du niveau depuis le libelle de la formation
 */
export const getNiveauFormationFromLibelle = (niveauFormationLibelle?: string | null) => {
  if (niveauFormationLibelle == null || niveauFormationLibelle === "") return null;

  const niveau = niveauFormationLibelle.split(" ")[0];
  return isNaN(parseInt(niveau, 10)) ? null : niveau;
};

// Rétrocompatibilité https://github.com/mission-apprentissage/tables-correspondances/blob/5cb4497165c9ed3e0433ef2f9fd52c38e98d606c/server/src/logic/controllers/bcn/Constants.js#L47-L54
export const getNiveauFormationLibelle = (niveauFormation?: string | null) => {
  switch (niveauFormation) {
    case "3":
      return "3 (CAP...)";
    case "4":
      return "4 (BAC...)";
    case "5":
      return "5 (BTS, DEUST...)";
    case "6":
      return "6 (Licence, BUT...)";
    case "7":
      return "7 (Master, titre ingénieur...)";
    case "8":
      return "8 (Doctorat...)";
    default:
      return null;
  }
};
