export type StepId =
  | "situation"
  | "risqueRupture"
  | "maintienFormation"
  | "datesRupture"
  | "rentreeSansContrat"
  | "objectifs"
  | "contact"
  | "recap";

export const STEP_NUMBER: Record<StepId, 1 | 2 | 3> = {
  situation: 1,
  risqueRupture: 1,
  maintienFormation: 1,
  datesRupture: 1,
  rentreeSansContrat: 1,
  objectifs: 2,
  contact: 3,
  recap: 3,
};

export const STEP_TITLES: Record<StepId, string> = {
  situation: "La situation de {nom}",
  risqueRupture: "La situation de {nom}",
  maintienFormation: "La situation de {nom}",
  datesRupture: "La situation de {nom}",
  rentreeSansContrat: "La situation de {nom}",
  objectifs: "Objectif de l'accompagnement de la Mission Locale",
  contact: "Informations de contact du jeune et du CFA",
  recap: "",
};

export const NEXT_STEP_LABELS: Partial<Record<StepId, string>> = {
  situation: "Objectif de l'accompagnement de la Mission Locale",
  risqueRupture: "Objectif de l'accompagnement de la Mission Locale",
  maintienFormation: "Objectif de l'accompagnement de la Mission Locale",
  datesRupture: "Objectif de l'accompagnement de la Mission Locale",
  rentreeSansContrat: "Objectif de l'accompagnement de la Mission Locale",
  objectifs: "Informations de contact du jeune",
};

export const STEP_TIPS: Record<StepId, string[]> = {
  situation: [
    "Précisez la situation actuelle du jeune. Cela permet à la Mission Locale de comprendre directement où le jeune en est dans son parcours.",
  ],
  risqueRupture: [
    "Cette question permet à la Mission Locale le degré d'urgence de la situation si il s'agit d'une collaboration pour de la prévention de rupture.",
    "Cependant, vous pouvez tout à fait demander une collaboration pour un jeune qui ne présente pas de signaux de rupture mais dont vous savez qu'il a besoin d'un accompagnement complémentaire à celui que vous dispensez au CFA.",
  ],
  maintienFormation: [
    "En fonction de la situation administrative si le jeune est encore maintenu en formation ou non, certaines Missions Locales ont des accompagnements ou des dispositifs spécifiques mobilisables.",
  ],
  datesRupture: [
    "Quelques mots sur la rupture suffisent à la Mission Locale pour mieux appréhender la situation du jeune au moment où elle prend contact avec lui ou elle pour lui proposer un accompagnement.",
  ],
  rentreeSansContrat: [
    "La date de début de formation permet à la Mission Locale de savoir combien de temps il reste au jeune dans le délai de 90 jours prévu par le dispositif de l'apprentissage pour trouver une entreprise après la rentrée en CFA.",
  ],
  objectifs: [
    "Ici, sélectionnez le ou les objectifs d'accompagnement qui vous paraissent les plus pertinents en fonction de la situation et des besoins du jeune dans son parcours.",
  ],
  contact: [
    "Dernière étape ! Merci de vérifier et compléter les informations de contact du jeune.",
    "Aussi, précisez qui sera le référent ou la référente à contacter dans votre CFA si la Mission Locale a besoin de plus d'informations.\n\nSi vous êtes l'interlocuteur principal, merci de sélectionner \"Me contacter uniquement\"",
  ],
  recap: [
    "Dossier complet ! Vous pouvez toujours modifier votre saisie en revenant en arrière.\n\nSinon, pensez à laisser un message à destination de la personne qui recevra le dossier du jeune à la Mission Locale.",
  ],
};
