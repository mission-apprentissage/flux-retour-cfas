// auto-generated by bson-schema-to-typescript

export interface MaintenanceMessage {
  /**
   * Message de maintenance
   */
  msg: string;
  /**
   * email du créateur du message
   */
  name: string;
  type: "alert" | "info";
  context: "manuel" | "automatique" | "maintenance";
  /**
   * Date de mise en place du message
   */
  time?: Date;
  /**
   * Message actif ou non
   */
  enabled?: boolean;
}