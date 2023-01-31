/* eslint-disable node/no-unpublished-require */
import nock from "nock";

import { API_ENDPOINT } from "../../../src/common/apis/apiCatalogueMna.js";

export const nockGetFormations = (responseData) => {
  nock(API_ENDPOINT).persist().get(new RegExp("\\/entity\\/formations.*")).reply(200, responseData);
};
