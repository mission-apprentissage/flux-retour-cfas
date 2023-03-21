/* eslint-disable */

export interface Permissions {
  _id?: any;
  /**
   * Organisme id
   */
  organisme_id: any | null;
  /**
   * Email utilisateur
   */
  userEmail: string;
  /**
   * Roles id
   */
  role: any;
  /**
   * En attente d'acceptation
   */
  pending: boolean;
  /**
   * Date de mise à jour en base de données
   */
  updated_at?: Date;
  /**
   * Date d'ajout de la permission
   */
  created_at?: Date;
}
