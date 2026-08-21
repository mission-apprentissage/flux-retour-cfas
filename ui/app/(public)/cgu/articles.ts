export const CGU_ARTICLES = [
  { id: "champ-preambule", number: "Article 1", name: "Préambule" },
  { id: "champ-definition", number: "Article 2", name: "Définitions" },
  { id: "champ-objet", number: "Article 3", name: "Objet" },
  { id: "champ-acceptation", number: "Article 4", name: "Acceptation" },
  { id: "champ-maj", number: "Article 5", name: "Mise à jour des CGU" },
  { id: "champ-vigueur", number: "Article 6", name: "Entrée en vigueur" },
  { id: "champ-creation", number: "Article 7", name: "Création du compte" },
  { id: "champ-presentation", number: "Article 8", name: "Présentation de la Plateforme" },
  { id: "champ-plateform", number: "Article 9", name: "Accès à la « Plateforme »" },
  { id: "champ-confidentialite", number: "Article 10", name: "Confidentialité/sécurité" },
  { id: "champ-responsabilite", number: "Article 11", name: "Responsabilité du Ministère" },
  { id: "champ-utilisateur", number: "Article 12", name: "Responsabilité des Utilisateurs" },
  { id: "champ-propriete", number: "Article 13", name: "Propriété intellectuelle" },
  { id: "champ-protection", number: "Article 14", name: "Protection des données à caractère personnel" },
  { id: "champ-droit", number: "Article 15", name: "Droit applicable et attribution de compétence" },
] as const;

export type CguArticleId = (typeof CGU_ARTICLES)[number]["id"];
