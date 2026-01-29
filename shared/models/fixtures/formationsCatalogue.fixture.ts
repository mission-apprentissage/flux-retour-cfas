import { ObjectId } from "mongodb";

import type { IFormationCatalogue } from "../data";

export function generateFormationCatalogueFixture(data?: Partial<IFormationCatalogue>): IFormationCatalogue {
  return {
    _id: new ObjectId(),
    cle_ministere_educatif: "087937P01218778455370001987784553700019-13004#L01",
    cfd: "32020113",
    cfd_outdated: false,
    code_postal: "13200",
    code_commune_insee: "13004",
    rncp_code: "RNCP38216",
    duree: "2",
    annee: "1",
    published: true,
    lieu_formation_adresse: "23 chemin des Moines ZI Nord",
    id_formation: "24_207396",
    niveau_entree_obligatoire: 0,
    entierement_a_distance: false,
    etablissement_gestionnaire_siret: "87784553700019",
    etablissement_gestionnaire_uai: "0134349G",
    etablissement_formateur_siret: "87784553700019",
    etablissement_formateur_uai: "0134349G",
    ...data,
  };
}
