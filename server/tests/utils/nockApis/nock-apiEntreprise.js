import nock from "nock";

import { API_ENDPOINT } from "../../../src/common/apis/ApiEntreprise.js";

export const nockGetEtablissement = (siret, responseData) => {
  nock(API_ENDPOINT)
    .persist()
    .get(new RegExp(`\\/etablissements\\/${siret}.*`))
    .reply(200, responseData);
};

export const nockGetEntreprise = (siren, responseData) => {
  nock(API_ENDPOINT)
    .persist()
    .get(new RegExp(`\\/entreprises\\/${siren}.*`))
    .reply(200, responseData);
};
