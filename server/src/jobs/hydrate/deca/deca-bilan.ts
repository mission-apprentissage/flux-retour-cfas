import type { RunCacheStats } from "@/common/utils/runCache";

export type BilanImportDeca = {
  dureeMin: number;
  contrats: number;
  contratsParSeconde: number;
  echecs: number;
  cache: RunCacheStats | null;
  tauxDefautCache: number | null;
};

export function construireBilanImport({
  debutMs,
  finMs,
  contrats,
  echecs,
  cache,
}: {
  debutMs: number;
  finMs: number;
  contrats: number;
  echecs: number;
  cache: RunCacheStats | null;
}): BilanImportDeca {
  const secondes = Math.max((finMs - debutMs) / 1000, 1);
  const totaux = Object.values(cache ?? {}).reduce(
    (somme, { acces, defauts }) => ({ acces: somme.acces + acces, defauts: somme.defauts + defauts }),
    { acces: 0, defauts: 0 }
  );

  return {
    dureeMin: Math.round(secondes / 60),
    contrats,
    contratsParSeconde: Math.round((contrats / secondes) * 10) / 10,
    echecs,
    cache,
    tauxDefautCache: totaux.acces > 0 ? Math.round((totaux.defauts / totaux.acces) * 10_000) / 10_000 : null,
  };
}
