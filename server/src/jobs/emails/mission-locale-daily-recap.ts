import { IOrganisationMissionLocale } from "shared/models";

import { getMissionLocaleEffectifsAccConjointLast24h } from "@/common/actions/mission-locale/mission-locale-daily-recap.actions";
import parentLogger from "@/common/logger";
import { organisationsDb, usersMigrationDb } from "@/common/model/collections";
import { sendEmail } from "@/common/services/mailer/mailer";

const logger = parentLogger.child({
  module: "job:send-mission-locale-daily-recap",
});

export async function sendMissionLocaleDailyRecap() {
  logger.info("Starting mission locale daily recap email job");

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
  let totalCfas = 0;

  for (const ml of missionsLocales) {
    try {
      const stats = await getMissionLocaleEffectifsAccConjointLast24h(ml.ml_id);

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

      for (const cfaData of stats.effectifs_acc_conjoint) {
        for (const user of users) {
          await sendEmail(user.email, "mission_locale_daily_recap", {
            recipient: {
              nom: user.nom,
              prenom: user.prenom,
            },
            cfa: cfaData.cfa,
            effectifs_count: cfaData.effectifs_count,
            mission_locale: {
              id: ml.ml_id,
              nom: ml.nom,
            },
          });

          logger.info(
            {
              email: user.email,
              ml_id: ml.ml_id,
              cfa_nom: cfaData.cfa.nom,
              effectifs_count: cfaData.effectifs_count,
            },
            "Daily recap email sent for CFA"
          );

          emailsSent++;
        }
      }

      totalCfas += stats.effectifs_acc_conjoint.length;
    } catch (error) {
      logger.error(
        {
          ml_id: ml.ml_id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Error processing mission locale daily recap"
      );
    }
  }

  logger.info(
    {
      totalMissionsLocales: missionsLocales.length,
      emailsSent,
      missionsSkipped,
      totalCfas,
    },
    "Mission locale daily recap job completed"
  );

  return 0;
}
