export const categoriesCompteInscription = [
  {
    text: "Un CFA ou organisme de formation",
    hint: "CFA, UFA, centre de formation, organisme responsable ou formateur.",
    value: "organisme_formation",
  },
  {
    text: "Un opérateur public (D(R)(I)EETS, DDETS, DGEFP, Académie…)",
    hint: "Services déconcentrés de l’État, académies et collectivités.",
    value: "operateur_public",
  },
  {
    text: "Une structure des Missions Locales",
    hint: "Mission locale ou association régionale des missions locales (ARML).",
    value: "missions_locales",
  },
  {
    text: "Un réseau d'organismes de formation",
    hint: "Réseau fédérant plusieurs organismes : CMA, GRETA, MFR, UIMM…",
    value: "tete_de_reseau",
  },
  {
    text: "Une structure régionale de France Travail",
    hint: "Direction régionale ou territoriale de France Travail.",
    value: "france_travail",
  },
  {
    text: "Autre organisation",
    hint: "Aucune des catégories ci-dessus ne correspond à votre structure.",
    value: "autre",
  },
] as const;

export type CategorieCompteInscription = (typeof categoriesCompteInscription)[number]["value"];
