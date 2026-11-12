import logger from "@/common/logger";
import { organismesDb } from "@/common/model/collections";

import { updateComputedFieldForOrganisme } from "../../computed/update-computed";

import { getAdresseRechercheEntreprises, nouveauRepliAdresse } from "./hydrate-organismes";

export const rattraperAdressesOrganismes = async () => {
  const repli = nouveauRepliAdresse();
  const organismes = await organismesDb()
    .find({ uai: { $type: "string" }, "adresse.departement": { $exists: false } }, { projection: { _id: 1, siret: 1 } })
    .toArray();

  for (const { _id, siret } of organismes) {
    const adresse = await getAdresseRechercheEntreprises(siret, repli);
    if (!adresse) {
      repli.nbSansAdresse++;
      continue;
    }
    const organisme = await organismesDb().findOneAndUpdate(
      { _id },
      { $set: { adresse } },
      { returnDocument: "after" }
    );
    await updateComputedFieldForOrganisme(organisme);
    repli.nbCompletees++;
  }

  const resultat = {
    nbOrganismes: organismes.length,
    nbCompletes: repli.nbCompletees,
    nbSansAdresse: repli.nbSansAdresse,
    sourceDisponible: repli.sourceDisponible,
  };
  logger.info(resultat, "[Rattrapage] adresses des organismes complétées et répercutées sur les dossiers");
  return resultat;
};
