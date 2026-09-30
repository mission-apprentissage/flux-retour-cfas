import { ObjectId } from "mongodb";

import {
  getCfaEffectifsWithMlActionsLast24h,
  getCfaUsers,
  getJeunesForCfaMl,
} from "@/common/actions/cfa/cfa-daily-recap.actions";
import parentLogger from "@/common/logger";
import { sendEmail } from "@/common/services/mailer/mailer";

const logger = parentLogger.child({
  module: "job:send-cfa-daily-recap",
});

export async function sendCfaDailyRecap() {
  logger.info("Starting CFA daily recap email job");

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const cfaStats = await getCfaEffectifsWithMlActionsLast24h();

  logger.info({ count: cfaStats.length }, "Found CFAs with ML actions in last 24h");

  let emailsSent = 0;
  let cfasSkipped = 0;

  for (const cfaStat of cfaStats) {
    try {
      if (cfaStat.total === 0) {
        cfasSkipped++;
        continue;
      }

      logger.info(
        {
          cfa_nom: cfaStat.cfa.nom,
          cfa_siret: cfaStat.cfa.siret,
          total_effectifs: cfaStat.total,
          missions_locales_count: cfaStat.missions_locales.length,
        },
        "Processing CFA with ML actions"
      );

      for (const mlData of cfaStat.missions_locales) {
        const userId = new ObjectId(mlData.acc_conjoint_by.toString());
        const { organisation, users } = await getCfaUsers(cfaStat.cfa._id, userId);

        if (!organisation) {
          logger.warn({ cfa_id: cfaStat.cfa._id }, "No organisation found for CFA");
          continue;
        }

        if (users.length === 0) {
          logger.warn(
            {
              cfa_nom: cfaStat.cfa.nom,
              ml_nom: mlData.mission_locale.nom,
              user_id: userId.toString(),
            },
            "Collab user not found or not confirmed for CFA"
          );
          continue;
        }

        const jeunes = await getJeunesForCfaMl(
          cfaStat.cfa._id,
          new ObjectId(mlData.mission_locale.id),
          yesterday,
          userId
        );

        for (const user of users) {
          try {
            if (!user.email) {
              logger.warn({ user_id: user._id }, "User has no email address, skipping");
              continue;
            }

            await sendEmail(
              user.email,
              "cfa_daily_recap",
              {
                cfa: {
                  nom: user.nom,
                  prenom: user.prenom,
                },
                mission_locale: {
                  nom: mlData.mission_locale.nom,
                },
                effectifs_count: mlData.effectifs_count,
                jeunes,
              },
              { noreply: true }
            );

            logger.info(
              {
                email: user.email,
                cfa_nom: cfaStat.cfa.nom,
                ml_nom: mlData.mission_locale.nom,
                effectifs_count: mlData.effectifs_count,
              },
              "CFA daily recap email sent for specific ML"
            );

            emailsSent++;
          } catch (emailError) {
            logger.error(
              {
                email: user.email,
                user_id: user._id,
                error: emailError instanceof Error ? emailError.message : String(emailError),
              },
              "Failed to send email to user"
            );
          }
        }
      }
    } catch (error) {
      logger.error(
        {
          cfa_nom: cfaStat.cfa.nom,
          error: error instanceof Error ? error.message : String(error),
        },
        "Error processing CFA daily recap"
      );
    }
  }

  logger.info(
    {
      totalCfas: cfaStats.length,
      emailsSent,
      cfasSkipped,
    },
    "CFA daily recap job completed (1 email per ML)"
  );

  return 0;
}
