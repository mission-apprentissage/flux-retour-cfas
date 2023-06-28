import * as apiCfaDock from "@/common/apis/ApiCfaDock";
import * as apiEntreprise from "@/common/apis/ApiEntreprise";
import { SIRET_REGEX } from "@/common/constants/validations";
import { getDepartementCodeFromCodeInsee, buildAdresse, findDataByDepartementNum } from "@/common/utils/adresseUtils";

import ApiEntEtablissement from "../apis/@types/ApiEntEtablissement";

import { InfoSiret } from "./infoSiret.actions-struct";

/**
 * Récupération des informations dun etablissement depuis son SIRET
 * @param {string} providedSiret
 * @param {boolean} getConventionCollective
 * @returns
 */
export const findDataFromSiret = async (providedSiret, getConventionCollective = true): Promise<InfoSiret> => {
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
  const siren = siret.substring(0, 9);

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
          siren: siret.substring(0, 9),
          secretSiret: true,
        },
        messages: {
          api_entreprise_info: `Le Siret ${siret} existe`,
        },
      };
    } else if (/^5[0-9]{2}/.test(`${e.reason}`)) {
      return {
        result: {
          siret: siret,
          siren: siret.substring(0, 9),
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

  // Récupération des infos de convention collective
  let conventionCollective = {
    idcc: undefined,
    opco_nom: undefined,
    opco_siren: undefined,
    status: "ERROR",
  };
  if (getConventionCollective) {
    try {
      conventionCollective = await apiCfaDock.getOpcoData(siret);
    } catch (e: any) {
      console.error(e);
    }
  }

  if (getConventionCollective && conventionCollective.status === "ERROR") {
    try {
      conventionCollective = await apiCfaDock.getOpcoData(siren);
    } catch (e: any) {
      console.error(e);
      conventionCollective = {
        idcc: undefined,
        opco_nom: undefined,
        opco_siren: undefined,
        status: "ERROR",
      };
    }
  }

  // Récupération des informations de localisation
  let code_dept = getDepartementCodeFromCodeInsee(etablissementApiInfo.adresse.code_commune);
  const { nom_dept, nom_region, code_region, nom_academie, num_academie } = findDataByDepartementNum(code_dept);

  return {
    result: {
      siege_social: etablissementApiInfo.siege_social,
      etablissement_siege_siret: etablissementApiInfo?.unite_legale.siret_siege_social,
      siret: etablissementApiInfo.siret,
      siren,
      naf_code: etablissementApiInfo.activite_principale.code,
      naf_libelle: etablissementApiInfo.activite_principale.libelle,
      date_creation: new Date(etablissementApiInfo.date_creation * 1000),
      diffusable_commercialement: etablissementApiInfo.diffusable_commercialement,
      enseigne: etablissementApiInfo.enseigne?.trim(),
      adresse: buildAdresse(etablissementApiInfo.adresse),
      numero_voie: etablissementApiInfo.adresse.numero_voie
        ? parseInt(etablissementApiInfo.adresse.numero_voie, 10)
        : undefined,
      type_voie: etablissementApiInfo.adresse.type_voie,
      nom_voie: etablissementApiInfo.adresse.libelle_voie,
      voie_complete: (etablissementApiInfo.adresse.type_voie ?? "") + (etablissementApiInfo.adresse.libelle_voie ?? ""),
      complement_adresse: etablissementApiInfo.adresse.complement_adresse,
      code_postal: etablissementApiInfo.adresse.code_postal,
      num_departement: code_dept,
      nom_departement: nom_dept,
      nom_academie: nom_academie,
      num_academie: num_academie,
      localite: etablissementApiInfo.adresse.libelle_commune,
      code_insee_localite: etablissementApiInfo.adresse.code_commune,
      cedex: etablissementApiInfo.adresse.code_cedex,
      date_fermeture: new Date(etablissementApiInfo.date_fermeture * 1000),
      ferme: etablissementApiInfo.etat_administratif !== "A",
      region: nom_region,
      num_region: code_region,
      conventionCollective,
      api_entreprise_reference: true,
    },
    messages: {
      api_entreprise_status: "OK",
    },
  };
};
