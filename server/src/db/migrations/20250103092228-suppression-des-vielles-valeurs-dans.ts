import { effectifsDb } from "@/common/model/collections";

export const up = async () => {
  effectifsDb().updateMany(
    {
      "apprenant.derniere_situation": {
        $in: [1013, 1015],
      },
    },
    {
      $set: {
        "apprenant.derniere_situation": null,
      },
    }
  );
};
