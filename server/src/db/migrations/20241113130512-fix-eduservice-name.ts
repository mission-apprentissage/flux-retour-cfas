import { organisationsDb } from "@/common/model/collections";

export const up = async () => {
  await organisationsDb().updateMany(
    {
      reseau: "EDUSERVICE",
    },
    {
      $set: {
        reseau: "EDUSERVICES",
      },
    }
  );
};
