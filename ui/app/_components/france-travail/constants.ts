import { FranceTravailSituation } from "./types";

export const SITUATION_OPTIONS = [
  {
    value: FranceTravailSituation.REORIENTATION,
    label: "Le jeune se réoriente",
    hintText: "Ex : le jeune choisit une autre formation et un autre CFA",
  },
  {
    value: FranceTravailSituation.ENTREPRISE,
    label: "Le jeune a trouvé une entreprise",
    hintText: "",
  },
  {
    value: FranceTravailSituation.PAS_DE_RECONTACT,
    label: "Le jeune ne souhaite pas être recontacté",
    hintText: "",
  },
  {
    value: FranceTravailSituation.EVENEMENT,
    label: "J'ai invité le jeune à un événement / atelier",
    hintText: "",
  },
  {
    value: FranceTravailSituation.MISSION_LOCALE,
    label: "J'ai redirigé le jeune vers la Mission locale",
    hintText: "",
  },
];
