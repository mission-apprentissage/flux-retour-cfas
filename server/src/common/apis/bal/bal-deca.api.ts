import axios, { type AxiosError, type AxiosInstance } from "axios";
import axiosRetry from "axios-retry";

import config from "@/config";

import { type IContratDecaBal, type IPageContratsDecaBal, zPageContratsDecaBal } from "./bal-deca.model";

const TAILLE_PAGE_MAX = 1000;
const CODES_SANS_NOUVELLE_TENTATIVE = ["ERR_CANCELED", "ERR_INVALID_URL"];

export type OptionsClientDecaBal = {
  baseURL: string;
  cle: string;
  delaiRequeteMs?: number;
  delaiNouvelleTentativeMs?: number;
  delaiNouvelleTentativeMaxMs?: number;
  tentatives?: number;
};

export type PageContratsDecaBal = {
  curseur: string | undefined;
  contrats: IContratDecaBal[];
  ecartes: number;
};

export function estErreurPassagere(erreur: AxiosError): boolean {
  if (!erreur.response) {
    return !CODES_SANS_NOUVELLE_TENTATIVE.includes(erreur.code ?? "");
  }
  const { status } = erreur.response;
  return status === 403 || status === 429 || status >= 500;
}

export function creerClientDecaBal({
  baseURL,
  cle,
  delaiRequeteMs = 60_000,
  delaiNouvelleTentativeMs = 2_000,
  delaiNouvelleTentativeMaxMs = 60_000,
  tentatives = 8,
}: OptionsClientDecaBal): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: delaiRequeteMs,
    headers: { Authorization: `Bearer ${cle}`, "Accept-Encoding": "gzip" },
  });
  axiosRetry(client, {
    retries: tentatives,
    shouldResetTimeout: true,
    retryCondition: estErreurPassagere,
    retryDelay: (tentative) => Math.min(delaiNouvelleTentativeMs * 2 ** (tentative - 1), delaiNouvelleTentativeMaxMs),
  });
  return client;
}

export function creerClientDecaBalDepuisConfig(): AxiosInstance {
  if (!config.bal.endpoint || !config.bal.deca_api_key) {
    throw new Error(
      "API DECA de la BAL non configurée : MNA_TDB_BAL_API_URL et MNA_TDB_BAL_DECA_API_KEY sont requises"
    );
  }
  return creerClientDecaBal({ baseURL: config.bal.endpoint, cle: config.bal.deca_api_key });
}

export function lireExpirationCle(cle: string): Date | null {
  const charge = cle.split(".")[1];
  if (!charge) {
    return null;
  }
  try {
    const { exp } = JSON.parse(Buffer.from(charge, "base64url").toString("utf8")) as { exp?: unknown };
    return typeof exp === "number" ? new Date(exp * 1000) : null;
  } catch {
    return null;
  }
}

async function lirePageContratsDeca(
  client: AxiosInstance,
  { after, limit }: { after: string | undefined; limit: number | undefined }
): Promise<IPageContratsDecaBal> {
  const { data } = await client.get("v1/deca/contrats", {
    params: { ...(after ? { after } : {}), ...(limit !== undefined ? { limit } : {}) },
  });
  return zPageContratsDecaBal.parse(data);
}

export async function* lirePagesContratsDeca(
  client: AxiosInstance,
  { after, limit }: { after?: string; limit?: number } = {}
): AsyncGenerator<PageContratsDecaBal> {
  let reste = limit;
  const demander = (curseur: string | undefined) => {
    const page = lirePageContratsDeca(client, {
      after: curseur,
      limit: reste === undefined ? undefined : Math.min(reste, TAILLE_PAGE_MAX),
    });
    page.catch(() => {});
    return page;
  };

  let curseur = after;
  let enAttente = demander(curseur);

  while (true) {
    const page = await enAttente;
    const contrats = reste === undefined ? page.contrats : page.contrats.slice(0, reste);
    if (reste !== undefined) {
      reste -= contrats.length;
    }

    const suivant = page.pagination.next;
    const termine = suivant === null || (reste !== undefined && reste <= 0);
    if (!termine) {
      enAttente = demander(suivant);
    }

    yield { curseur, contrats, ecartes: page.pagination.ecartes };

    if (termine) {
      return;
    }
    curseur = suivant;
  }
}
