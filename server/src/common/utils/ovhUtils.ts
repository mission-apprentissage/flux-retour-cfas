import axios from "axios";

import config from "@/config";

import { createRequestStream } from "./httpUtils";

async function authenticate(uri) {
  let regExp = new RegExp(/^(https:\/\/)(.+):(.+):(.+)@(.*)$/);

  if (!regExp.test(uri)) {
    throw new Error("Invalid OVH URI");
  }

  let [, protocol, user, password, tenantId, authUrl] = uri.match(regExp);
  let response = await axios.post(`${protocol}${authUrl}`, {
    auth: {
      identity: {
        tenantId,
        methods: ["password"],
        password: {
          user: {
            name: user,
            password: password,
            domain: {
              name: "Default",
            },
          },
        },
      },
    },
  });

  let token = response.headers["x-subject-token"];
  let { endpoints } = response.data.token.catalog.find((c) => c.type === "object-store");
  let { url: baseUrl } = endpoints.find((s) => s.region === "GRA");

  return { baseUrl, token };
}

async function requestObjectAccess(path, options: any = {}) {
  let storage = options.storage || config.ovh.storage.storageName;
  let { baseUrl, token } = await authenticate(config.ovh.storage.uri);

  return {
    url: encodeURI(`${baseUrl}/${storage}${path === "/" ? "" : `/${path}`}`),
    token,
  };
}

export const getFromStorage = async (path, options: any = {}) => {
  let { url, token } = await requestObjectAccess(path, options);
  return createRequestStream(url, {
    method: "GET",
    headers: {
      "X-Auth-Token": token,
      Accept: "application/json",
    },
  });
};
