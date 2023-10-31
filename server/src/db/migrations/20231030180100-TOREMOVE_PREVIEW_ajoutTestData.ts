import { Db } from "mongodb";

// FIXME Migration à supprimer car sert à seed la preview
export const up = async (db: Db) => {
  // TODO Aucun effectif : ras
  // TODO Effectifs sur le non fiable : on transfère tous les effectifs du non fiable vers le fiable, et on supprime le non fiable avec ses effectifs.
  // TODO Effectifs sur l’organisme fiable : ras aussi on les garde.
  // TODO Effectifs sur le non fiable en doublon avec des effectifs du fiable : on prends les effectifs les plus récents qu on lie à l’organisme fiable et on supprime le non fiable et ses effectifs.
};
