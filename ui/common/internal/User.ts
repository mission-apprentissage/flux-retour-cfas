// récupéré de l'API et adapté pour ne pas avoir certains champs optionnels

export interface User {
  _id: string;
  /**
   * Email utilisateur
   */
  email: string;
  /**
   * civilité
   */
  civility: "Madame" | "Monsieur";
  /**
   * Le nom de l'utilisateur
   */
  nom: string;
  /**
   * Le prénom de l'utilisateur
   */
  prenom: string;
  /**
   * Le téléphone de l'utilisateur
   */
  telephone: string;
  /**
   * La fonction de l'utilisateur
   */
  fonction: string;
  /**
   * Date de création du compte
   */
  created_at: string;
}
