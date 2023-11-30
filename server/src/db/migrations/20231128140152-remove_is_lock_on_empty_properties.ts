import { Db } from "mongodb";

export const up = async (db: Db) => {
  // Suppression de tous les is_lock sur les champs vides.
  // A vérifier sur une base un peu grosse : est-ce que ça ne va pas tout faire crash ?
  const fields = [
    "apprenant.ine",
    "apprenant.nom",
    "apprenant.prenom",
    "apprenant.sexe",
    "apprenant.date_de_naissance",
    "apprenant.code_postal_de_naissance",
    "apprenant.nationalite",
    "apprenant.regime_scolaire",
    "apprenant.rqth",
    "apprenant.date_rqth",
    "apprenant.affelnet",
    "apprenant.parcoursup",
    "apprenant.inscription_sportif_haut_niveau",
    "apprenant.courriel",
    "apprenant.telephone",
    "apprenant.situation_avant_contrat",
    "apprenant.derniere_situation",
    "apprenant.dernier_organisme_uai",
    "apprenant.type_cfa",
    "apprenant.dernier_diplome",
    "apprenant.mineur",
    "apprenant.mineur_emancipe",
    "apprenant.nir",
    "apprenant.responsable_mail1",
    "apprenant.responsable_mail2",

    "formation.formation_id",
    "formation.cfd",
    "formation.rncp",
    "formation.libelle_long",
    "formation.niveau",
    "formation.niveau_libelle",
    "formation.annee",
    "formation.date_obtention_diplome",
    "formation.duree_formation_relle",
    "formation.periode",
    "formation.date_inscription",
    "formation.obtention_diplome",
    "formation.date_exclusion",
    "formation.cause_exclusion",
    "formation.referent_handicap",
    "formation.formation_presentielle",
    "formation.duree_theorique",
    "formation.date_fin",
    "formation.date_entree",
  ];
  for (const field of fields) {
    console.log(`Removing is_lock on ${field}…`);
    await db.collection("effectifs").updateMany(
      { $or: [{ [field]: { $exists: false } }, { [field]: "" }] },
      { $unset: { [`is_lock.${field}`]: "" } },
      {
        bypassDocumentValidation: true,
      }
    );
  }
};
