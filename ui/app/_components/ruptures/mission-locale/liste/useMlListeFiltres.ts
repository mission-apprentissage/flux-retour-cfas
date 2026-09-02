"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { ML_TRI_COLONNE } from "shared/constants";

import type { MlCritere } from "./MlCriteresFilter";
import { triEnQuery, triSuivant, type MlTriEtat } from "./tri";

/** Villes, critères et tri sont portés par l'URL pour survivre au retour depuis une fiche ; la recherche reste locale. */
export function useMlListeFiltres() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [recherche, setRecherche] = useState("");
  const [codesPostaux, setCodesPostaux] = useState<string[]>(() => {
    const cp = searchParams?.get("cp");
    return cp ? cp.split(",").filter(Boolean) : [];
  });
  const [criteres, setCriteres] = useState<MlCritere[]>(() => {
    const valeur = searchParams?.get("criteres");
    return valeur ? (valeur.split(",").filter(Boolean) as MlCritere[]) : [];
  });
  const [tri, setTri] = useState<MlTriEtat | null>(() => {
    const colonne = searchParams?.get("tri") as ML_TRI_COLONNE | null;
    if (!colonne) return null;
    return { colonne, ordre: searchParams?.get("ordre") === "desc" ? "desc" : "asc" };
  });

  // Une seule écriture par changement : deux appels successifs se baseraient sur les mêmes
  // searchParams et le second effacerait le premier (cas du tri, qui porte deux clés).
  const synchroniserUrl = useCallback(
    (majs: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      for (const [cle, valeur] of Object.entries(majs)) {
        if (valeur) {
          params.set(cle, valeur);
        } else {
          params.delete(cle);
        }
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : (pathname ?? ""), { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const changerCodesPostaux = useCallback(
    (valeurs: string[]) => {
      setCodesPostaux(valeurs);
      synchroniserUrl({ cp: valeurs.join(",") || undefined });
    },
    [synchroniserUrl]
  );

  const changerCriteres = useCallback(
    (valeurs: MlCritere[]) => {
      setCriteres(valeurs);
      synchroniserUrl({ criteres: valeurs.join(",") || undefined });
    },
    [synchroniserUrl]
  );

  const reinitialiserFiltres = useCallback(() => {
    setCodesPostaux([]);
    setCriteres([]);
    synchroniserUrl({ cp: undefined, criteres: undefined });
  }, [synchroniserUrl]);

  const changerTri = useCallback(
    (colonne: ML_TRI_COLONNE) => {
      const suivant = triSuivant(tri, colonne);
      setTri(suivant);
      synchroniserUrl({ tri: suivant?.colonne, ordre: suivant?.ordre });
    },
    [synchroniserUrl, tri]
  );

  // suffixe des liens vers une fiche, pour retrouver la liste filtrée au retour
  const filtresQuery = [
    codesPostaux.length > 0 ? `&cp=${codesPostaux.join(",")}` : "",
    criteres.length > 0 ? `&criteres=${criteres.join(",")}` : "",
    triEnQuery(tri),
  ].join("");

  return {
    recherche,
    setRecherche,
    codesPostaux,
    changerCodesPostaux,
    criteres,
    changerCriteres,
    reinitialiserFiltres,
    tri,
    changerTri,
    filtresQuery,
    // le tri n'est pas un filtre : il ne masque aucun dossier et ne déclenche pas l'état « aucun résultat »
    filtresActifs: !!recherche || codesPostaux.length > 0 || criteres.length > 0,
  };
}
