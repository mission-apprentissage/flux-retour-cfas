import type { CronDef } from "job-processor";

import { brevoCrons } from "./brevo";
import { dailyCrons } from "./daily";
import { decaCrons } from "./deca";
import { diversCrons } from "./divers";
import { effectifsCrons } from "./effectifs";
import { emailsCrons } from "./emails";
import { formationsCrons } from "./formations";
import { missionLocaleCrons } from "./mission-locale";
import { organismesCrons } from "./organismes";
import { whatsappCrons } from "./whatsapp";

/**
 * Planning des crons — horaires en Europe/Paris.
 *
 * ATTENTION : les cron_string sont interprétés en Europe/Paris, PAS en UTC.
 * Ne jamais décaler un horaire pour "compenser" un fuseau.
 *
 * | Horaire (Paris)      | Cron                                                    | Domaine        |
 * |----------------------|---------------------------------------------------------|----------------|
 * | 02h30 tous les jours | Run daily jobs each day at 02h30                        | daily          |
 * | 03h00 tous les jours | Cleanup organismes                                      | organismes     |
 * | 03h00 tous les jours | Import formations                                       | formations     |
 * | 04h00 tous les jours | Révoque les clés API des organismes inactifs +12 mois   | organismes     |
 * | 04h05 le 1er du mois | Validation des constantes de territoires                | divers         |
 * | 04h30 tous les jours | Nettoie et met à jour les statistiques des ML           | mission-locale |
 * | 05h00 tous les jours | Synchro Brevo de tous les contacts TBA                  | brevo          |
 * | 05h00 le samedi      | Mettre à jour les statuts d'effectifs                   | effectifs      |
 * | 07h00 tous les jours | Send reminder emails                                    | emails         |
 * | 10h30 tous les jours | Send CFA daily recap                                    | emails         |
 * | 10h30 le dimanche    | hydrate:contrats-deca-raw                               | deca           |
 * | 13h30 tous les jours | Send ML daily recap                                     | emails         |
 * | 14h30 le lundi       | Send ML weekly recap                                    | emails         |
 * | 18h30 tous les jours | Envoi WhatsApp préqualif quotidien                      | whatsapp       |
 */
export const crons = {
  ...dailyCrons,
  ...formationsCrons,
  ...organismesCrons,
  ...effectifsCrons,
  ...missionLocaleCrons,
  ...decaCrons,
  ...emailsCrons,
  ...whatsappCrons,
  ...brevoCrons,
  ...diversCrons,

  // TODO : Checker si coté métier l'archivage est toujours prévu ?
  // "Run archive dossiers apprenants & effectifs job each first day of month at 12h45": {
  //   cron_string: "45 12 1 * *",
  //   handler: async () => {
  //     // run-archive-job.sh yarn cli archive:dossiersApprenantsEffectifs
  //     return 0;
  //   },
  // },
} satisfies Record<string, CronDef>;
