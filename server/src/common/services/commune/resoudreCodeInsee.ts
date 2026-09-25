import type { ICommunesVoies } from "shared/models/data/communesVoies.model";

import { communesVoiesDb } from "@/common/model/collections";

import { normaliserVoie } from "./normaliserVoie";

const TAILLE_MAX_CACHE = 500;
const EXPIRATION_CACHE = 24 * 3600_000;
const EXPIRATION_CACHE_ABSENT = 3600_000;

type CommuneIndexee = ICommunesVoies["communes"][number] & { nomNormalise: string };

type CodePostalIndexe = {
  communes: CommuneIndexee[];
  voiesParLongueur: ICommunesVoies["voies"];
};

export type ResolutionCodeInsee = {
  code_insee: string;
  methode: "voie" | "commune" | "population";
};

const cache = new Map<string, { valeur: Promise<CodePostalIndexe | null>; expireA: number }>();

export function viderCacheCommunesVoies() {
  cache.clear();
}

async function indexerCodePostal(codePostal: string): Promise<CodePostalIndexe | null> {
  const doc = await communesVoiesDb().findOne({ _id: codePostal });
  if (!doc || doc.communes.length === 0) return null;

  return {
    communes: doc.communes.map((c) => ({ ...c, nomNormalise: normaliserVoie(c.nom) })),
    voiesParLongueur: [...doc.voies].sort((a, b) => b.nom.length - a.nom.length),
  };
}

function chargerCodePostal(codePostal: string): Promise<CodePostalIndexe | null> {
  const entree = cache.get(codePostal);
  if (entree && entree.expireA > Date.now()) {
    cache.delete(codePostal);
    cache.set(codePostal, entree);
    return entree.valeur;
  }

  const valeur = indexerCodePostal(codePostal);
  const nouvelleEntree = { valeur, expireA: Date.now() + EXPIRATION_CACHE };
  cache.delete(codePostal);
  cache.set(codePostal, nouvelleEntree);
  if (cache.size > TAILLE_MAX_CACHE) {
    cache.delete(cache.keys().next().value as string);
  }

  valeur.then(
    (index) => {
      if (!index) nouvelleEntree.expireA = Date.now() + EXPIRATION_CACHE_ABSENT;
    },
    () => {
      if (cache.get(codePostal) === nouvelleEntree) cache.delete(codePostal);
    }
  );
  return valeur;
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
  let candidates = index.communes;

  if (texte.trim()) {
    const voie = index.voiesParLongueur.find(({ nom }) => texte.includes(` ${nom} `));
    if (voie?.code_insee.length === 1) {
      return { code_insee: voie.code_insee[0], methode: "voie" };
    }
    if (voie) {
      const communesDeLaVoie = index.communes.filter((c) => voie.code_insee.includes(c.code_insee));
      if (communesDeLaVoie.length > 0) candidates = communesDeLaVoie;
    }

    const communesNommees = candidates.filter(({ nomNormalise }) => texte.includes(` ${nomNormalise} `));
    if (communesNommees.length === 1) {
      return { code_insee: communesNommees[0].code_insee, methode: "commune" };
    }
  }

  const plusPeuplee = candidates.reduce((max, c) => (c.population > max.population ? c : max));
  return { code_insee: plusPeuplee.code_insee, methode: "population" };
}
