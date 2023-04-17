import { strict as assert } from "assert";
import axiosist from "axiosist";
import sinon from "sinon";

import { AxiosResponse } from "axios";
import { createUserLegacy } from "../../src/common/actions/legacy/users.legacy.actions.js";
import { createOrganisation } from "../../src/common/actions/organisations.actions.js";
import { createSession } from "../../src/common/actions/sessions.actions.js";
import { COOKIE_NAME } from "../../src/common/constants/cookieName.js";
import { modelDescriptors, usersMigrationDb } from "../../src/common/model/collections.js";
import { NewOrganisation, getOrganisationLabel } from "../../src/common/model/organisations.model.js";
import { configureDbSchemaValidation } from "../../src/common/mongodb.js";
import server from "../../src/http/server.js";
import { ObjectId } from "mongodb";
import { resetTime } from "../../src/common/utils/timeUtils.js";

export const startServer = async () => {
  const mailer = { sendEmail: sinon.spy() };

  // FIXME revoir l'initialisation de l'application (1 point d'entrée, avec config pour savoir si démarrer services ou pas)
  // const services = { cache: redisFakeClient, mailer, clamav: { scan: () => {} } };
  const app = await server();

  const httpClient = axiosist(app);

  await configureDbSchemaValidation(modelDescriptors);

  return {
    httpClient,
    mailer,
    // Legacy auth jwt
    createAndLogUserLegacy: async (username, password, options) => {
      await createUserLegacy({ username, password, ...options });

      const response = await httpClient.post("/api/login", {
        username: username,
        password: password,
      });

      return {
        Authorization: `Bearer ${response.data.access_token}`,
      };
    },
    // New auth cookie log user method
    logUser: async (email, password) => {
      const response = await httpClient.post("/api/v1/auth/login", { email, password });
      return { cookie: response.headers["set-cookie"].join(";") };
    },
  };
};

export type RequestAsOrganisationFunc = <T>(
  organisation: NewOrganisation,
  method: Method,
  url: string,
  body?: T
) => Promise<AxiosResponse>;

export async function initTestApp() {
  resetTime();
  const app = await server();
  const httpClient = axiosist(app);
  await configureDbSchemaValidation(modelDescriptors);

  return {
    httpClient,

    /**
     * Permet de faire une requête authentifiée pour une organisation
     * L'utilisateur et l'organisation sont créés à la volée
     */
    async requestAsOrganisation<T>(
      organisation: NewOrganisation,
      method: Method,
      url: string,
      body?: T
    ): Promise<AxiosResponse> {
      const organisationId = await createOrganisation(organisation);
      const userEmail = `${getOrganisationLabel(organisation)}@test.local`; // généré selon l'organisation
      await usersMigrationDb().insertOne({
        account_status: "CONFIRMED",
        invalided_token: false,
        password_updated_at: new Date(),
        connection_history: [],
        emails: [],
        created_at: new Date(),
        civility: "Madame",
        nom: "Dupont",
        prenom: "Jean",
        fonction: "Responsable administratif",
        email: userEmail,
        telephone: "",
        password:
          "$6$rounds=10000$c41a72eab295ea9b$6cMipCc33XlnZh8/rdraqeFq5Y4WhqtshSSoZJIv/WS3mJ6VayZxdYQW0.Nm2J53oklb8HfFSxypLwMTOtWh//", // MDP-azerty123
        has_accept_cgu_version: "v0.1",
        organisation_id: organisationId,
      });

      const sessionToken = await createSession(userEmail);
      return await httpClient.request({
        method,
        url,
        data: body,
        headers: { cookie: `${COOKIE_NAME}=${sessionToken}` },
      });
    },
  };
}

/**
 * Convertit un nombre au format ObjectID pour les tests
 */
export function id(i: number): string {
  return `${"000000000000000000000000".substring(0, 24 - `${i}`.length)}${i}`;
}

export type Method = "get" | "post" | "put" | "patch" | "delete";
export type RequestAPIFunc = <T>(
  method: Method,
  url: string,
  body?: T,
  headers?: { [key: string]: string }
) => Promise<AxiosResponse>;

export function expectUnauthorizedError(response: any) {
  assert.strictEqual(response.status, 401);
  assert.deepStrictEqual(response.data, "Unauthorized");
  // ça serait bien d'avoir du JSON mais il faut voir avec passport...
  // assert.deepStrictEqual(response.data, {
  //   error: "Unauthorized",
  //   message: "Vous n'êtes pas connecté",
  // });
}

export function expectForbiddenError(response: any) {
  assert.strictEqual(response.status, 403);
  assert.deepStrictEqual(response.data, {
    error: "Forbidden",
    message: "Permissions invalides",
  });
}

export function stringifyMongoFields<T extends object>(object: T): T {
  return Object.entries(object).reduce((acc, [key, value]) => {
    if (value instanceof Date) {
      acc[key] = value.toISOString();
    } else if (value instanceof ObjectId) {
      acc[key] = value.toString();
    } else {
      acc[key] = value;
    }
    return acc;
  }, {}) as T;
}

export function generate<T>(amount: number, callback: () => T): T[] {
  return Array(amount)
    .fill(1)
    .map(() => callback());
}
