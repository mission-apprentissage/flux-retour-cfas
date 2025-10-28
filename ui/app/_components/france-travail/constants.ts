import { FranceTravailSituation } from "./types";

export const SITUATION_OPTIONS = [
  {
    value: FranceTravailSituation.REORIENTATION,
    label: "Le jeune se **réoriente**",
    hintText: "Ex : le jeune choisit une autre formation et un autre CFA",
  },
  {
    value: FranceTravailSituation.ENTREPRISE,
    label: "Le jeune a trouvé **une entreprise**",
    hintText: "",
  },
  {
    value: FranceTravailSituation.PAS_DE_RECONTACT,
    label: "Le jeune ne souhaite **pas être recontacté**",
    hintText: "",
  },
  {
    value: FranceTravailSituation.EVENEMENT,
    label: "J'ai invité le jeune à un **événement / atelier**",
    hintText: "",
  },
  {
    value: FranceTravailSituation.MISSION_LOCALE,
    label: "J'ai redirigé le jeune vers la **Mission locale**",
    hintText: "",
  },
  {
    value: FranceTravailSituation.ERROR,
    label: "Il y a une erreur sur ce dossier ?",
    hintText: "Ex : Dossier en doublon ? Jeune qui n'est pas en statut inscrit sans contrat ?",
  },
];

export function parseLabelWithBold(label: string): { prefix: string; bold: string; suffix: string } {
  const match = label.match(/^(.*?)\*\*(.*?)\*\*(.*)$/);
  if (match) {
    return {
      prefix: match[1],
      bold: match[2],
      suffix: match[3],
    };
  }
  return { prefix: label, bold: "", suffix: "" };
}
