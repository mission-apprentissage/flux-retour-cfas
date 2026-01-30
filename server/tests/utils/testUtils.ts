import { strict as assert } from "assert";

import { AxiosResponse } from "axios";
import axiosist from "axiosist";
import { ObjectId } from "mongodb";
import { IOrganisationCreate, getOrganisationLabel } from "shared/models/data/organisations.model";

import { createOrganisation } from "@/common/actions/organisations.actions";
import { createSession } from "@/common/actions/sessions.actions";
import { COOKIE_NAME } from "@/common/constants/cookieName";
import { organisationsDb, usersMigrationDb } from "@/common/model/collections";
import { hash } from "@/common/utils/passwordUtils";
import { resetTime } from "@/common/utils/timeUtils";
import server from "@/http/server";

export type RequestAsOrganisationFunc = <T>(
  organisation: IOrganisationCreate,
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
      organisation: IOrganisationCreate,
      method: Method,
      url: string,
      body?: T
    ): Promise<AxiosResponse> {
      const existingOrganisation = await organisationsDb().findOne(organisation);
      const organisationId = existingOrganisation ? existingOrganisation._id : await createOrganisation(organisation);
      const userEmail = `${getOrganisationLabel(organisation)}@tdb.local`; // généré selon l'organisation
      await usersMigrationDb().insertOne({
        _id: new ObjectId(),
        account_status: "CONFIRMED",
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
        auth_method: "password",
      });

      const sessionToken = await createSession(userEmail);
      return await httpClient.request({
        method,
        url,
        data: body,
        headers: { cookie: `${COOKIE_NAME}=${sessionToken}` },
      });
    },

    /**
     * Permet de faire une requête authentifiée pour un utilisateur existant.
     */
    async requestAsUser<T>(userEmail: string, method: Method, url: string, body?: T): Promise<AxiosResponse> {
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

export function expectUnauthorizedError(response: any) {
  assert.strictEqual(response.status, 401);
  assert.deepStrictEqual(response.data, {
    error: "Unauthorized",
    message: "Unauthorized",
  });
}

export function expectForbiddenError(response: any) {
  assert.strictEqual(response.status, 403);
  assert.deepStrictEqual(response.data, {
    error: "Forbidden",
    message: "Permissions invalides",
  });
}

export async function generate<T>(amount: number, callback: () => Promise<T>): Promise<T[]> {
  return Promise.all(
    Array(amount)
      .fill(1)
      .map(async () => await callback())
  );
}
