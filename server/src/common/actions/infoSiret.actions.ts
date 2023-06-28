import * as apiCfaDock from "@/common/apis/ApiCfaDock";
import * as apiEntreprise from "@/common/apis/ApiEntreprise";
import { SIRET_REGEX } from "@/common/constants/validations";
import { getDepartementCodeFromCodeInsee, buildAdresse, findDataByDepartementNum } from "@/common/utils/adresseUtils";

export const findDataFromSiret = async (providedSiret, getConventionCollective = true) => {
  if (!providedSiret || !SIRET_REGEX.test(providedSiret.trim())) {
    return {
      result: {},
      messages: {
        error: `Le Siret ${providedSiret} n'est pas valide, un Siret doit être défini et au format 14 caractères`,
      },
    };
  }

  let siret = `${providedSiret}`.trim();

  let etablissementApiInfo;
  try {
    etablissementApiInfo = await apiEntreprise.getEtablissement(siret);
  } catch (e: any) {
    console.error(e);
    if (e.reason === 451) {
      return {
        result: {
          siret: siret,
          siren: siret.substring(0, 9),
          enseigne: "",
          entreprise_raison_sociale: "",
          numero_voie: undefined,
          type_voie: "",
          nom_voie: "",
          code_postal: "",
          localite: "",
          commune_implantation_nom: "",
          naf_code: "",
          conventionCollective: { idcc: "", titre: "" },
          secretSiret: true,
        },
        messages: {
          api_entreprise: `Le Siret ${siret} existe`,
        },
      };
    } else if (/^5[0-9]{2}/.test(`${e.reason}`)) {
      return {
        result: {
          siret: siret,
          siren: siret.substring(0, 9),
          enseigne: "",
          entreprise_raison_sociale: "",
          numero_voie: undefined,
          type_voie: "",
          nom_voie: "",
          code_postal: "",
          localite: "",
          commune_implantation_nom: "",
          naf_code: "",
          conventionCollective: { idcc: "", titre: "" },
          api_entreprise: "KO",
        },
        messages: {
          api_entreprise: "Le service de récupération des informations Siret est momentanément indisponible",
        },
      };
    }
    return {
      result: {},
      messages: {
        error: `Le Siret ${siret} n'existe pas ou n'a été retrouvé`,
      },
    };
  }

  let conventionCollective = {
    idcc: null,
    opco_nom: null,
    opco_siren: null,
    status: "ERROR",
  };
  if (getConventionCollective) {
    try {
      conventionCollective = await apiCfaDock.getOpcoData(siret);
    } catch (e: any) {
      console.error(e);
    }
  }

  const siren = siret.substring(0, 9);

  if (getConventionCollective && conventionCollective.status === "ERROR") {
    try {
      conventionCollective = await apiCfaDock.getOpcoData(siren);
    } catch (e: any) {
      console.error(e);
      conventionCollective = {
        idcc: null,
        opco_nom: null,
        opco_siren: null,
        status: "ERROR",
      };
    }
  }

  let code_dept = getDepartementCodeFromCodeInsee(etablissementApiInfo.adresse.code_insee_localite);
  const { nom_dept, nom_region, code_region, nom_academie, num_academie } = findDataByDepartementNum(code_dept);

  return {
    result: {
      siege_social: etablissementApiInfo.siege_social,
      etablissement_siege_siret: entrepriseApiInfo?.siret_siege_social,
      siret: etablissementApiInfo.siret,
      siren,
      naf_code: etablissementApiInfo.naf,
      naf_libelle: etablissementApiInfo.libelle_naf,
      tranche_effectif_salarie: etablissementApiInfo.tranche_effectif_salarie_etablissement,
      date_creation: etablissementApiInfo.date_creation_etablissement,
      date_mise_a_jour: etablissementApiInfo.date_mise_a_jour,
      diffusable_commercialement: etablissementApiInfo.diffusable_commercialement,
      enseigne: etablissementApiInfo.enseigne
        ? etablissementApiInfo.enseigne?.trim()
        : entrepriseApiInfo?.enseigne?.trim(),
      adresse: buildAdresse(etablissementApiInfo.adresse),
      numero_voie: etablissementApiInfo.adresse.numero_voie
        ? parseInt(etablissementApiInfo.adresse.numero_voie, 10)
        : undefined,
      type_voie: etablissementApiInfo.adresse.type_voie,
      nom_voie: etablissementApiInfo.adresse.nom_voie,
      voie_complete: (etablissementApiInfo.adresse.type_voie ?? "") + (etablissementApiInfo.adresse.nom_voie ?? ""),
      complement_adresse: etablissementApiInfo.adresse.complement_adresse,
      code_postal: etablissementApiInfo.adresse.code_postal,
      num_departement: code_dept,
      nom_departement: nom_dept,
      nom_academie: nom_academie,
      num_academie: num_academie,
      localite: etablissementApiInfo.adresse.localite,
      code_insee_localite: etablissementApiInfo.adresse.code_insee_localite,
      cedex: etablissementApiInfo.adresse.cedex,

      date_fermeture: new Date(etablissementApiInfo.etat_administratif.date_fermeture * 1000),
      ferme: etablissementApiInfo.etat_administratif.value !== "A",

      region_implantation_code: etablissementApiInfo.region_implantation.code,
      region_implantation_nom: etablissementApiInfo.region_implantation.value,
      region: nom_region,
      num_region: code_region,
      commune_implantation_code: etablissementApiInfo.commune_implantation.code,
      commune_implantation_nom: etablissementApiInfo.commune_implantation.value,
      pays_implantation_code: etablissementApiInfo.pays_implantation.code,
      pays_implantation_nom: etablissementApiInfo.pays_implantation.value,

      entreprise_siren: entrepriseApiInfo?.siren,
      entreprise_procedure_collective: entrepriseApiInfo?.procedure_collective,
      entreprise_enseigne: entrepriseApiInfo?.enseigne,
      entreprise_numero_tva_intracommunautaire: entrepriseApiInfo?.numero_tva_intracommunautaire,
      entreprise_code_effectif_entreprise: entrepriseApiInfo?.code_effectif_entreprise,
      entreprise_forme_juridique_code: entrepriseApiInfo?.forme_juridique_code,
      entreprise_forme_juridique: entrepriseApiInfo?.forme_juridique,
      entreprise_raison_sociale: entrepriseApiInfo?.raison_sociale,
      entreprise_nom_commercial: entrepriseApiInfo?.nom_commercial,
      entreprise_capital_social: entrepriseApiInfo?.capital_social,
      entreprise_date_creation: entrepriseApiInfo?.date_creation,
      entreprise_date_radiation: entrepriseApiInfo?.date_radiation,
      entreprise_naf_code: entrepriseApiInfo?.naf_entreprise,
      entreprise_naf_libelle: entrepriseApiInfo?.libelle_naf_entreprise,
      entreprise_date_fermeture: entrepriseApiInfo?.etat_administratif.date_cessation,
      entreprise_ferme: entrepriseApiInfo?.etat_administratif.value === "C",
      entreprise_siret_siege_social: entrepriseApiInfo?.siret_siege_social,
      entreprise_nom: entrepriseApiInfo?.nom,
      entreprise_prenom: entrepriseApiInfo?.prenom,
      entreprise_categorie: entrepriseApiInfo?.categorie_entreprise,
      entreprise_tranche_effectif_salarie: entrepriseApiInfo?.tranche_effectif_salarie_entreprise,

      conventionCollective,
      api_entreprise_reference: true,
    },
    messages: {
      api_entreprise: "Ok",
    },
  };
};
