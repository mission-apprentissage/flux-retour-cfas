import config from "../../../config";
import getApiClient from "../../apis/client";
import logger from "../../logger";

interface EffectifScoreInput {
  "apprenant.date_de_naissance": string;
  "formation.date_inscription": string;
  "formation.date_fin": string;
  "formation.date_entree": string;
  "contrat.date_debut": string;
  "contrat.date_fin": string;
  "contrat.date_rupture": string;
}

interface ScoreResult {
  model: string;
  scores: number[];
}

const client = getApiClient({
  baseURL: config.classifier.endpoint,
  timeout: 30_000,
  headers: config.classifier.apiKey ? { "X-API-Key": config.classifier.apiKey } : {},
});

export async function scoreEffectifs(data: EffectifScoreInput[]): Promise<ScoreResult> {
  const response = await client.post("/model/score", { data }, { cache: false });
  return response.data;
}

export async function getClassifierVersion(): Promise<string | null> {
  try {
    const response = await client.get("/model/version", { cache: false });
    return response.data.model;
  } catch (error) {
    logger.error("Failed to get classifier version", error);
    return null;
  }
}

export async function checkClassifierHealth(): Promise<boolean> {
  try {
    const response = await client.get("/");
    return response.status === 200;
  } catch {
    return false;
  }
}
