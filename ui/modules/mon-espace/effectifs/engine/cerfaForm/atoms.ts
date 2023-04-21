import { selector } from "recoil";

import { getFormStatus } from "./completion";

// import { dossierAtom } from "@/modules/mon-espace/effectifs/engine/atoms";
import { cerfaAtom, valuesSelector } from "@/modules/mon-espace/effectifs/engine/formEngine/atoms";

export const atoms = selector({
  key: "cerfaFormCompletionSelector",
  get: ({ get }) => {
    const fields = get(cerfaAtom);
    const values = get(valuesSelector);
    // const dossier = get(dossierAtom);
    if (!(fields && values)) return;
    return getFormStatus({ fields, values });
  },
});
