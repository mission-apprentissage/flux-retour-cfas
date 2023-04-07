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
    text: "Un réseau d'organismes de formation",
    value: "tete_de_reseau",
  },
  {
    text: "Autre organisation",
    value: "autre",
  },
] as const;

export type CategorieCompteInscription = (typeof categoriesCompteInscription)[number]["value"];
