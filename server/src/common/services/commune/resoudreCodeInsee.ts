import type { ICommunesVoies } from "shared/models/data/communesVoies.model";

import { communesVoiesDb } from "@/common/model/collections";
import { tryCachedExecution } from "@/common/utils/cacheUtils";

import { normaliserVoie } from "./normaliserVoie";

const CACHE_EXPIRATION = 24 * 3600_000;

type CodePostalIndexe = {
  communes: Array<ICommunesVoies["communes"][number] & { nomNormalise: string }>;
  voiesParLongueur: ICommunesVoies["voies"];
};

export type ResolutionCodeInsee = {
  code_insee: string;
  methode: "voie" | "commune" | "population";
};

async function chargerCodePostal(codePostal: string): Promise<CodePostalIndexe | null> {
  return tryCachedExecution(`communesVoies-${codePostal}`, CACHE_EXPIRATION, async () => {
    const doc = await communesVoiesDb().findOne({ _id: codePostal });
    if (!doc || doc.communes.length === 0) return null;

    return {
      communes: doc.communes.map((c) => ({ ...c, nomNormalise: normaliserVoie(c.nom) })),
      voiesParLongueur: [...doc.voies].sort((a, b) => b.nom.length - a.nom.length),
    };
  });
}

export async function resoudreCodeInsee({
  codePostal,
  adresse,
}: {
  codePostal: string;
  adresse?: string | null;
}): Promise<ResolutionCodeInsee | null> {
  const index = await chargerCodePostal(codePostal);
  if (!index) return null;

  const texte = ` ${normaliserVoie(adresse)} `;

  if (texte.trim()) {
    const voie = index.voiesParLongueur.find(({ nom }) => texte.includes(` ${nom} `));
    if (voie?.code_insee.length === 1) {
      return { code_insee: voie.code_insee[0], methode: "voie" };
    }

    const communesNommees = index.communes.filter(({ nomNormalise }) => texte.includes(` ${nomNormalise} `));
    if (communesNommees.length === 1) {
      return { code_insee: communesNommees[0].code_insee, methode: "commune" };
    }
  }

  const plusPeuplee = index.communes.reduce((max, c) => (c.population > max.population ? c : max));
  return { code_insee: plusPeuplee.code_insee, methode: "population" };
}
