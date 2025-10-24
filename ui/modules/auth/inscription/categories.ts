export const categoriesCompteInscription = [
  {
    text: "Un CFA ou organisme de formation",
    value: "organisme_formation",
  },
  {
    text: "Un opérateur public (D(R)(I)EETS, DDETS, DRAAF, DGEFP, Académie, Conseil régional…)",
    value: "operateur_public",
  },
  {
    text: "Une structure des Missions locales",
    value: "missions_locales",
  },
  {
    text: "Un réseau d'organismes de formation",
    value: "tete_de_reseau",
  },
  {
    text: "Un membre du Réseau des CARIF OREF",
    value: "carif_oref",
  },
  {
    text: "Une structure régionale de France Travail",
    value: "france_travail",
  },
  {
    text: "Autre organisation",
    value: "autre",
  },
] as const;

export type CategorieCompteInscription = (typeof categoriesCompteInscription)[number]["value"];
