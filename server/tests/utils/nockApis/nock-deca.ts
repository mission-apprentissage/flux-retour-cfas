import nock from "nock";

import config from "@/config";

export const nockDecaExtractTba = (data) =>
  nock(`${config.decaApi.endpoint}/contrats`).persist().post("/extractTBA").reply(200, data);
