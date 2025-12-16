import { format, startOfWeek, endOfWeek } from "date-fns";
import fr from "date-fns/locale/fr/index.js";
import { IOrganisationMissionLocale } from "shared/models";

import { getMissionLocaleEffectifsStats } from "@/common/actions/mission-locale/mission-locale-weekly-recap.actions";
import parentLogger from "@/common/logger";
import { organisationsDb, usersMigrationDb } from "@/common/model/collections";
import { sendEmail } from "@/common/services/mailer/mailer";

const logger = parentLogger.child({
  module: "job:send-mission-locale-weekly-recap",
});

export async function sendMissionLocaleWeeklyRecap() {
  logger.info("Starting mission locale weekly recap email job");

  const missionsLocales = (await organisationsDb()
    .find(
      {
        type: "MISSION_LOCALE",
        activated_at: { $exists: true },
      },
      {
        projection: {
          _id: 1,
          ml_id: 1,
          nom: 1,
        },
      }
    )
    .toArray()) as IOrganisationMissionLocale[];

  logger.info({ count: missionsLocales.length }, "Found active missions locales");

  let emailsSent = 0;
  let missionsSkipped = 0;

  for (const ml of missionsLocales) {
    try {
      const stats = await getMissionLocaleEffectifsStats(ml.ml_id);

      if (stats.total > 0) {
        logger.info(
          {
            ml_id: ml.ml_id,
            nom: ml.nom,
            stats,
          },
          "Calculated stats for mission locale"
        );
      }

      if (stats.total === 0) {
        missionsSkipped++;
        continue;
      }

      const users = await usersMigrationDb()
        .find(
          {
            organisation_id: ml._id,
            account_status: "CONFIRMED",
          },
          {
            projection: {
              email: 1,
              nom: 1,
              prenom: 1,
            },
          }
        )
        .toArray();

      if (users.length === 0) {
        logger.warn({ ml_id: ml.ml_id }, "No confirmed users found for mission locale");
        missionsSkipped++;
        continue;
      }

      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      const dateDebut = format(weekStart, "dd/MM/yyyy", { locale: fr });
      const dateFin = format(weekEnd, "dd/MM/yyyy", { locale: fr });

      for (const user of users) {
        await sendEmail(
          user.email,
          "mission_locale_weekly_recap",
          {
            recipient: {
              nom: user.nom,
              prenom: user.prenom,
            },
            effectifs_prioritaire: stats.effectifs_prioritaire,
            effectifs_a_traiter: stats.effectifs_a_traiter,
            effectifs_a_recontacter: stats.effectifs_a_recontacter,
            total: stats.total,
            date_debut: dateDebut,
            date_fin: dateFin,
            mission_locale: {
              id: ml.ml_id,
              nom: ml.nom,
            },
          },
          { noreply: true }
        );

        logger.info(
          {
            email: user.email,
            ml_id: ml.ml_id,
            total_effectifs: stats.total,
          },
          "Weekly recap email sent"
        );

        emailsSent++;
      }
    } catch (error) {
      logger.error(
        {
          ml_id: ml.ml_id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Error processing mission locale weekly recap"
      );
    }
  }

  logger.info(
    {
      totalMissionsLocales: missionsLocales.length,
      emailsSent,
      missionsSkipped,
    },
    "Mission locale weekly recap job completed"
  );

  return 0;
}
