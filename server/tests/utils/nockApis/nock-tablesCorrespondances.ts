import nock from "nock";
import { DEPARTEMENTS } from "shared";

import { API_ENDPOINT } from "@/common/apis/apiTablesCorrespondances";
import { dataForGetCfdInfo, dataForGetSiretInfo } from "@tests/data/apiTablesDeCorrespondances";

export const nockGetCfdInfo = (callback?: any) => {
  nock(API_ENDPOINT)
    .persist()
    .post("/cfd")
    .reply(200, (_uri, requestBody) => ({
      // @ts-expect-error
      result: callback ? callback(requestBody.cfd) : dataForGetCfdInfo.withIntituleLong,
    }));
};

export const nockGetSiretInfo = (data = dataForGetSiretInfo) => {
  nock(API_ENDPOINT).persist().post("/siret").reply(200, {
    result: data,
  });
};

export const nockGetCodePostalInfo = () => {
  nock(API_ENDPOINT)
    .persist()
    .post("/code-postal")
    .reply(200, (_uri, requestBody) => {
      // @ts-expect-error
      const { codePostal } = requestBody;
      const departementId = codePostal.substring(0, 2);
      const departement = DEPARTEMENTS.find((o) => o.code === departementId) || {
        code: departementId,
        nom: "[NOM_DU_DEPARTEMENT]",
        region: { code: "[CODE_REGION]", nom: "[NOM_REGION]" },
        academie: { code: "[CODE_ACADEMIE]", nom: "[NOM_ACADEMIE]" },
      };
      return {
        messages: { cp: "Ok" },
        result: {
          code_postal: codePostal,
          code_commune_insee: codePostal,
          commune: "[NOM_DE_LA_COMMUNE]",
          num_departement: departement?.code,
          nom_departement: departement?.nom,
          region: departement?.region.nom,
          num_region: departement?.region.code,
          nom_academie: departement?.academie.nom,
          num_academie: departement?.academie.code,
        },
      };
    });
};
