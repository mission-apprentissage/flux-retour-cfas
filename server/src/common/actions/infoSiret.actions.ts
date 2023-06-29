import * as apiEntreprise from "@/common/apis/ApiEntreprise";
import { SIRET_REGEX } from "@/common/constants/validations";
import { getDepartementCodeFromCodeInsee, buildAdresse, findDataByDepartementNum } from "@/common/utils/adresseUtils";

import ApiEntEtablissement from "../apis/@types/ApiEntEtablissement";

import { InfoSiret } from "./infoSiret.actions-struct";

/**
 * Récupération des informations dun etablissement depuis son SIRET
 * @param {string} providedSiret
 * @returns
 */
export const findDataFromSiret = async (providedSiret): Promise<InfoSiret> => {
  // Vérification du format
  if (!providedSiret || !SIRET_REGEX.test(providedSiret.trim())) {
    return {
      result: {},
      messages: {
        api_entreprise_info: `Le Siret ${providedSiret} n'est pas valide, un Siret doit être défini et au format 14 caractères`,
      },
    };
  }

  let siret = `${providedSiret}`.trim();

  // Récupération des infos via API Entreprise
  let etablissementApiInfo: ApiEntEtablissement;
  try {
    etablissementApiInfo = await apiEntreprise.getEtablissement(siret);
  } catch (e: any) {
    console.error(e);
    if (e.reason === 451) {
      return {
        result: {
          siret: siret,
          secretSiret: true,
        },
        messages: {
          api_entreprise_info: `Le Siret ${siret} existe mais est indisponible pour raisons légales`,
        },
      };
    } else if (/^5[0-9]{2}/.test(`${e.reason}`)) {
      return {
        result: {
          siret: siret,
        },
        messages: {
          api_entreprise_info: "Le service de récupération des informations Siret est momentanément indisponible",
          api_entreprise_status: "KO",
        },
      };
    }
    return {
      result: {},
      messages: {
        api_entreprise_info: `Le Siret ${siret} n'existe pas ou n'a été retrouvé`,
      },
    };
  }

  // Récupération des informations de localisation
  let code_dept = getDepartementCodeFromCodeInsee(etablissementApiInfo.adresse.code_commune);
  const { code_region, num_academie } = findDataByDepartementNum(code_dept);

  return {
    result: {
      siret: etablissementApiInfo.siret,
      naf_code: etablissementApiInfo.activite_principale.code,
      enseigne: etablissementApiInfo.enseigne?.trim(),
      raison_sociale: etablissementApiInfo.unite_legale?.personne_morale_attributs?.raison_sociale,
      adresse: buildAdresse(etablissementApiInfo.adresse?.acheminement_postal),
      numero_voie: etablissementApiInfo.adresse.numero_voie
        ? parseInt(etablissementApiInfo.adresse.numero_voie, 10)
        : undefined,
      type_voie: etablissementApiInfo.adresse.type_voie,
      nom_voie: etablissementApiInfo.adresse.libelle_voie,
      voie_complete: (etablissementApiInfo.adresse.type_voie ?? "") + (etablissementApiInfo.adresse.libelle_voie ?? ""),
      complement_adresse: etablissementApiInfo.adresse.complement_adresse,
      code_postal: etablissementApiInfo.adresse.code_postal,
      num_departement: code_dept,
      num_academie: num_academie,
      localite: etablissementApiInfo.adresse.libelle_commune,
      code_insee_localite: etablissementApiInfo.adresse.code_commune,
      ferme: etablissementApiInfo.etat_administratif !== "A",
      num_region: code_region,
    },
    messages: {
      api_entreprise_status: "OK",
    },
  };
};
