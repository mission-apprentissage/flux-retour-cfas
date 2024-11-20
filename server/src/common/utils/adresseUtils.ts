import { find } from "lodash-es";
import { DEPARTEMENTS, IDepartmentCode } from "shared";

export const getDepartementCodeFromCodeInsee = (codeInsee) => {
  let code_dept = codeInsee.substring(0, 2);
  return ["97", "98"].includes(code_dept) ? codeInsee.substring(0, 3) : code_dept;
};

export const findDataByDepartementNum = (code_dept: IDepartmentCode) => {
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
