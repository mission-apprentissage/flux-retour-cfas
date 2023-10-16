import { differenceInDays } from "date-fns";
import { ERPS_BY_ID } from "shared";

import parentLogger from "@/common/logger";
import { usersMigrationDb } from "@/common/model/collections";
import { sendEmail } from "@/common/services/mailer/mailer";

const logger = parentLogger.child({
  module: "job:send-reminder-emails",
});

export async function sendReminderEmails() {
  // envoi séquentiel par précaution pour ne pas surcharger le SMTP

  const users = await usersMigrationDb()
    .aggregate([
      {
        $project: {
          _id: 1,
          email: 1,
          civility: 1,
          prenom: 1,
          nom: 1,
          organisation_id: 1,
          created_at: 1,
          reminder_missing_data_sent_date: 1,
          reminder_missing_configuration_and_data_sent_date: 1,
        },
      },
      {
        $lookup: {
          from: "organisations",
          localField: "organisation_id",
          foreignField: "_id",
          as: "organisation",
          pipeline: [
            {
              $match: {
                type: "ORGANISME_FORMATION",
              },
            },
            {
              $lookup: {
                from: "organismes",
                as: "organisme",
                let: {
                  uai: "$uai",
                  siret: "$siret",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [{ $eq: ["$siret", "$$siret"] }, { $eq: ["$uai", "$$uai"] }],
                      },
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      siret: 1,
                      uai: 1,
                      last_transmission_date: 1,
                      mode_de_transmission: 1,
                      mode_de_transmission_configuration_date: 1,
                      erps: 1,
                      erp_unsupported: 1,
                    },
                  },
                ],
              },
            },
            { $unwind: { path: "$organisme" } },
          ],
        },
      },
      { $unwind: { path: "$organisation" } },
    ])
    .toArray();

  logger.info({ count: users.length }, "checking users");
  for (const user of users) {
    const organisme = user.organisation.organisme;

    // relance après 7 jours si pas de configuration ni de données
    if (
      !organisme.mode_de_transmission &&
      !organisme.last_transmission_date &&
      !user.reminder_missing_configuration_and_data_sent_date &&
      differenceInDays(new Date(), user.created_at) >= 7
    ) {
      logger.info(
        {
          user_id: user._id,
          organisme_id: organisme._id,
          siret: organisme.siret,
          uai: organisme.uai,
        },
        "send email reminder_missing_configuration_and_data"
      );
      await sendEmail(user.email, "reminder_missing_configuration_and_data", {
        recipient: {
          civility: user.civility,
          nom: user.nom,
          prenom: user.prenom,
        },
      });
      await usersMigrationDb().updateOne(
        {
          _id: user._id,
        },
        {
          $set: {
            reminder_missing_configuration_and_data_sent_date: new Date(),
          },
        }
      );
    }

    // relance après 7 jours si organisme configuré mais pas de données
    else if (
      organisme.mode_de_transmission &&
      !organisme.last_transmission_date &&
      !user.reminder_missing_data_sent_date &&
      differenceInDays(new Date(), organisme.mode_de_transmission_configuration_date) >= 7
    ) {
      logger.info(
        {
          user_id: user._id,
          organisme_id: organisme._id,
          siret: organisme.siret,
          uai: organisme.uai,
          mode_de_transmission: organisme.mode_de_transmission,
          mode_de_transmission_configuration_date: organisme.mode_de_transmission_configuration_date,
          erp: organisme.erps?.[0],
          erp_unsupported: organisme.erp_unsupported,
        },
        "send email reminder_missing_data"
      );
      await sendEmail(user.email, "reminder_missing_data", {
        recipient: {
          civility: user.civility,
          nom: user.nom,
          prenom: user.prenom,
        },
        mode_de_transmission: organisme.mode_de_transmission,
        erp: ERPS_BY_ID[organisme.erps?.[0]]?.name ?? "",
        erp_unsupported: organisme.erp_unsupported,
      });
      await usersMigrationDb().updateOne(
        {
          _id: user._id,
        },
        {
          $set: {
            reminder_missing_data_sent_date: new Date(),
          },
        }
      );
    }
  }
}
