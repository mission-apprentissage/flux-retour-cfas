import parentLogger from "@/common/logger";
import { usersMigrationDb } from "@/common/model/collections";
import { sendEmail } from "@/common/services/mailer/mailer";
// import { sendEmail } from "@/common/services/mailer/mailer";

const logger = parentLogger.child({
  module: "job:send-reminder-emails",
});

export async function sendReminderEmails() {
  // envoi séquentiel par précaution pour ne pas surcharger le SMTP

  // tous les

  // - pas de configuration, pas d'effectifs
  // - configuration, pas d'effectifs
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
                      mode_de_transmission: 1,
                      last_transmission_date: 1,
                      mode_de_transmission_configuration_date: 1,
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
    if (!organisme.mode_de_transmission && !organisme.last_transmission_date) {
      logger.info(
        {
          organisme_id: organisme._id,
          siret: organisme.siret,
          uai: organisme.uai,
        },
        "0 configuration, 0 effectif"
      );
      await sendEmail(user.email, "reminder_missing_configuration_and_data", {
        user: {
          civility: user.civility,
          nom: user.nom,
          prenom: user.prenom,
        },
      });
    } else if (organisme.mode_de_transmission && !organisme.last_transmission_date) {
      logger.info(
        {
          organisme_id: organisme._id,
          siret: organisme.siret,
          uai: organisme.uai,
          mode_de_transmission_configuration_date: organisme.mode_de_transmission_configuration_date,
        },
        "1 configuration, 0 effectif"
      );
      await sendEmail(user.email, "reminder_missing_data", {
        user: {
          civility: user.civility,
          nom: user.nom,
          prenom: user.prenom,
        },
        mode_de_transmission: organisme.mode_de_transmission,
      });
    }
    // logger.info({ email: user.email, userId: user._id }, "checking user");
  }
}
