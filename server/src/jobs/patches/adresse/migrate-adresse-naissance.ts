import { effectifsDb } from "@/common/model/collections";

export const tmpMigrateAdresseNaissance = async () => {
  await effectifsDb().updateMany(
    {
      adresse_naissance: { $exists: false },
    },
    {
      $rename: {
        "apprenant.code_postal_de_naissance": "apprenant.adresse_naissance.code_postal",
        "is_lock.apprenant.code_postal_de_naissance": "is_lock.apprenant.adresse_naissance.code_postal",
      },
    }
  );
};
