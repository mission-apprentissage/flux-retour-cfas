const axios = require("axios");

const getHttpClient = (baseURL) =>
  axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    validateStatus: function () {
      return true;
    },
  });

const getAuthorizationHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

const getJwtForUser = async ({ httpClient, username, password }) => {
  const { data } = await httpClient.post("/api/login", {
    username,
    password,
  });
  return data.access_token;
};

const postDossiersApprenantsTest = async ({ httpClient, token }) => {
  const { status, data } = await httpClient.post("/api/dossiers-apprenants/test", {}, getAuthorizationHeader(token));
  return { status, data };
};

const postDossiersApprenants = async ({ httpClient, token, data: dossierApprenants }) => {
  const { status, data } = await httpClient.post(
    "/api/dossiers-apprenants",
    dossierApprenants,
    getAuthorizationHeader(token)
  );
  return { status, data };
};

module.exports = {
  getHttpClient,
  getJwtForUser,
  postDossiersApprenantsTest,
  postDossiersApprenants,
};
