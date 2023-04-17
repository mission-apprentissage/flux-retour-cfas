import { strict as assert } from "assert";
import axiosist from "axiosist";
import sinon from "sinon";

import { AxiosResponse } from "axios";
import { createUserLegacy } from "../../src/common/actions/legacy/users.legacy.actions.js";
import { createOrganisation } from "../../src/common/actions/organisations.actions.js";
import { createSession } from "../../src/common/actions/sessions.actions.js";
import { COOKIE_NAME } from "../../src/common/constants/cookieName.js";
import { usersMigrationDb } from "../../src/common/model/collections.js";
import { NewOrganisation, getOrganisationLabel } from "../../src/common/model/organisations.model.js";
import server from "../../src/http/server.js";
import { resetTime } from "../../src/common/utils/timeUtils.js";
import { hash } from "../../src/common/utils/passwordUtils.js";

export const startServer = async () => {
  const mailer = { sendEmail: sinon.spy() };

  // FIXME revoir l'initialisation de l'application (1 point d'entrée, avec config pour savoir si démarrer services ou pas)
  // const services = { cache: redisFakeClient, mailer, clamav: { scan: () => {} } };
  const app = await server();

  const httpClient = axiosist(app);

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
        password: testPasswordHash,
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
 * Hash de mot de passe précalculé et injecté dans la collection usersMigration
 * pour économiser le coût de calcul du hash (~100ms)
 */
export const testPasswordHash = hash("MDP-azerty123");

/**
 * Convertit un nombre au format ObjectID pour les tests
 */
export function id(i: number): string {
  return `${i}`.padStart(24, "0");
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
  return JSON.parse(JSON.stringify(object));
}

export function generate<T>(amount: number, callback: () => T): T[] {
  return Array(amount)
    .fill(1)
    .map(() => callback());
}
