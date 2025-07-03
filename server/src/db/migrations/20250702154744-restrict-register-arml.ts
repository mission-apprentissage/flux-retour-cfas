import { organisationsDb } from "@/common/model/collections";

export const up = async () => {
  organisationsDb().updateMany(
    {
      type: "ARML",
      nom: {
        $in: [
          "AREFIE - HAUTS DE France",
          "DES MISSIONS LOCALES NOUVELLE AQUITAINE",
          "DES MISSIONS LOCALES D'ILE DE France",
          "SUD PROVENCE - ALPES COTE D'AZUR",
          "DES MISSIONS LOCALES OCEAN INDIEN",
        ],
      },
    },
    {
      $set: {
        can_register: true,
      },
    }
  );
};
