"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import type { MlCritere } from "./MlCriteresFilter";

/** Villes et critères sont portés par l'URL pour survivre au retour depuis une fiche ; la recherche reste locale. */
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

  const synchroniserUrl = useCallback(
    (cle: "cp" | "criteres", valeurs: string[]) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (valeurs.length > 0) {
        params.set(cle, valeurs.join(","));
      } else {
        params.delete(cle);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : (pathname ?? ""), { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const changerCodesPostaux = useCallback(
    (valeurs: string[]) => {
      setCodesPostaux(valeurs);
      synchroniserUrl("cp", valeurs);
    },
    [synchroniserUrl]
  );

  const changerCriteres = useCallback(
    (valeurs: MlCritere[]) => {
      setCriteres(valeurs);
      synchroniserUrl("criteres", valeurs);
    },
    [synchroniserUrl]
  );

  // suffixe des liens vers une fiche, pour retrouver la liste filtrée au retour
  const filtresQuery = [
    codesPostaux.length > 0 ? `&cp=${codesPostaux.join(",")}` : "",
    criteres.length > 0 ? `&criteres=${criteres.join(",")}` : "",
  ].join("");

  return {
    recherche,
    setRecherche,
    codesPostaux,
    changerCodesPostaux,
    criteres,
    changerCriteres,
    filtresQuery,
    filtresActifs: !!recherche || codesPostaux.length > 0 || criteres.length > 0,
  };
}
