import { find } from "lodash-es";

import * as apiEntreprise from "@/common/apis/apiEntreprise";
import { ACADEMIES, DEPARTEMENTS } from "@/common/constants/territoires";
import { defaultValuesAdresse } from "@/common/model/json-schema/adresseSchema";

import ApiEntEtablissement from "../apis/@types/ApiEntEtablissement";

export const getDepartementCodeFromCodeInsee = (codeInsee) => {
  let code_dept = codeInsee.substring(0, 2);
  return ["97", "98"].includes(code_dept) ? codeInsee.substring(0, 3) : code_dept;
};

export const buildAdresseFromApiEntreprise = async (siret) => {
  const etablissementApiInfo: ApiEntEtablissement = await apiEntreprise.getEtablissement(siret);
  if (!etablissementApiInfo) return defaultValuesAdresse();

  // Handle departement
  let code_dept = getDepartementCodeFromCodeInsee(etablissementApiInfo.adresse.code_commune);

  // Handle academie
  const { nom_academie } = findDataByDepartementNum(code_dept);
  const academieKeyMatching = ACADEMIES.find((academie) => academie.nom === nom_academie);
  if (!academieKeyMatching) throw new Error(`Academie not found for code ${code_dept}`);
  const academie = `${academieKeyMatching.code}`;

  return {
    adresse: {
      ...(parseInt(etablissementApiInfo.adresse.numero_voie)
        ? { numero: parseInt(etablissementApiInfo.adresse.numero_voie) }
        : {}),
      ...(etablissementApiInfo.adresse.libelle_voie ? { voie: etablissementApiInfo.adresse.libelle_voie } : {}),
      ...(etablissementApiInfo.adresse.complement_adresse
        ? { complement: etablissementApiInfo.adresse.complement_adresse }
        : {}),
      ...(etablissementApiInfo.adresse.code_postal ? { code_postal: etablissementApiInfo.adresse.code_postal } : {}),
      ...(etablissementApiInfo.adresse.code_commune ? { code_insee: etablissementApiInfo.adresse.code_commune } : {}),
      ...(etablissementApiInfo.adresse.libelle_commune
        ? { commune: etablissementApiInfo.adresse.libelle_commune }
        : {}),
      ...(code_dept ? { departement: code_dept } : {}),
      ...(academie ? { academie: academie } : {}),
      ...(buildAdresse(etablissementApiInfo.adresse)
        ? { complete: buildAdresse(etablissementApiInfo.adresse.acheminement_postal) }
        : {}),
    },
  };
};

export const findDataByDepartementNum = (code_dept) => {
  const data = find(DEPARTEMENTS, (departement) => departement.code === code_dept);
  if (!data) {
    return { nom_dept: null, nom_region: null, code_region: null, nom_academie: null, num_academie: null };
  }

  const { nom, region, academie } = data;
  return {
    nom_dept: nom,
    nom_region: region.nom,
    code_region: region.code,
    nom_academie: academie.nom,
    num_academie: academie.code,
  };
};

export const buildAdresse = (adresse) => {
  const l1 = adresse.l1 && adresse.l1 !== "" ? `${adresse.l1}\r\n` : "";
  const l2 = adresse.l2 && adresse.l2 !== "" ? `${adresse.l2}\r\n` : "";
  const l3 = adresse.l3 && adresse.l3 !== "" ? `${adresse.l3}\r\n` : "";
  const l4 = adresse.l4 && adresse.l4 !== "" ? `${adresse.l4}\r\n` : "";
  const l5 = adresse.l5 && adresse.l5 !== "" ? `${adresse.l5}\r\n` : "";
  const l6 = adresse.l6 && adresse.l6 !== "" ? `${adresse.l6}\r\n` : "";
  const l7 = adresse.l7 && adresse.l7 !== "" ? `${adresse.l7}` : "";
  return `${l1}${l2}${l3}${l4}${l5}${l6}${l7}`;
};
