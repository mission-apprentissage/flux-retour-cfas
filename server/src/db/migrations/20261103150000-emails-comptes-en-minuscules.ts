import logger from "@/common/logger";
import { usersMigrationDb } from "@/common/model/collections";

export const up = async () => {
  const comptes = await usersMigrationDb()
    .find(
      { $expr: { $ne: ["$email", { $toLower: { $trim: { input: "$email" } } }] } },
      { projection: { _id: 1, email: 1 } }
    )
    .toArray();

  let corriges = 0;
  const laisses: string[] = [];
  for (const compte of comptes) {
    const email = compte.email.trim().toLowerCase();
    if (await usersMigrationDb().findOne({ email }, { projection: { _id: 1 } })) {
      laisses.push(compte._id.toString());
      continue;
    }
    await usersMigrationDb().updateOne({ _id: compte._id }, { $set: { email } });
    corriges++;
  }

  logger.info({ corriges, laisses }, "[Migration] E-mails des comptes passés en minuscules");
};
