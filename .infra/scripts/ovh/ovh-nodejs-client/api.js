const env = require("env-var");
const { promisify } = require("util");
const open = require("open");

function newOvhClient(consumerKey) {
  let client = require("ovh")({
    endpoint: "ovh-eu",
    appKey: env.get("APP_KEY").default("bXfRhxGBMoKtl1Uv").asString(),
    appSecret: env.get("APP_SECRET").default("wZzmCUchaj4hflVWyqTCZZw6Ez5oTaik").asString(),
    ...(consumerKey ? { consumerKey } : {}),
  });
  client.request = promisify(client.request);
  return client;
}

async function getClient(key) {
  if (key) {
    return newOvhClient(key);
  }

  let client = newOvhClient();
  let { consumerKey, validationUrl } = await client.request("POST", "/auth/credential", {
    accessRules: [
      { method: "POST", path: "/auth/*" },
      { method: "GET", path: "/ip/*" },
      { method: "POST", path: "/ip/*" },
      { method: "DELETE", path: "/ip/*" },
      { method: "GET", path: "/dedicated/*" },
      { method: "POST", path: "/dedicated/*" },
    ],
  });

  console.info(`Waiting 20 sec for the key ${consumerKey} to be validated...`);
  await open(validationUrl);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(newOvhClient(consumerKey));
    }, 20000);
  });
}

module.exports = {
  getClient,
};
