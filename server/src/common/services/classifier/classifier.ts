import type { AxiosCacheInstance } from "axios-cache-interceptor";
import { IEffectif } from "shared/models/data/effectifs.model";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";

import config from "../../../config";
import getApiClient from "../../apis/client";

export interface EffectifScoreInput {
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

let _client: AxiosCacheInstance | null = null;

function getClient(): AxiosCacheInstance {
  if (!_client) {
    _client = getApiClient({
      baseURL: config.classifier.endpoint,
      timeout: 30_000,
      headers: config.classifier.apiKey ? { "X-API-Key": config.classifier.apiKey } : {},
    });
  }
  return _client;
}

export async function scoreEffectifs(data: EffectifScoreInput[]): Promise<ScoreResult> {
  const response = await getClient().post("/model/score", { data }, { cache: false });
  return response.data;
}

export function extractScoreInput(effectif: IEffectif | IEffectifDECA): EffectifScoreInput | null {
  const lastContrat = effectif.contrats?.slice(-1)[0];
  if (!effectif.apprenant?.date_de_naissance || !lastContrat?.date_rupture) return null;

  return {
    "apprenant.date_de_naissance": effectif.apprenant.date_de_naissance.toISOString(),
    "formation.date_inscription": effectif.formation?.date_inscription?.toISOString() ?? "",
    "formation.date_fin": effectif.formation?.date_fin?.toISOString() ?? "",
    "formation.date_entree": effectif.formation?.date_entree?.toISOString() ?? "",
    "contrat.date_debut": lastContrat.date_debut?.toISOString() ?? "",
    "contrat.date_fin": lastContrat.date_fin?.toISOString() ?? "",
    "contrat.date_rupture": lastContrat.date_rupture.toISOString(),
  };
}
