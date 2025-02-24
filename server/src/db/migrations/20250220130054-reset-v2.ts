import { effectifV2Db, formationV2Db, organismeV2Db, personV2Db, transmissionV2Db } from "@/common/model/collections";

export const up = async () => {
  await organismeV2Db().deleteMany({});
  await formationV2Db().deleteMany({});
  await effectifV2Db().deleteMany({});
  await transmissionV2Db().deleteMany({});
  await personV2Db().deleteMany({});
};
