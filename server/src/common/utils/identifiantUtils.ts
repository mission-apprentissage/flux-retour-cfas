import { capitalize } from "lodash-es";
import type { IIdentifiantNormalise } from "shared/models/parts/identifiantNormalise";

import { jourMetier } from "@/common/utils/dateUtils";

export function normalisePersonIdentifiant(input: IIdentifiantNormalise): IIdentifiantNormalise {
  return {
    nom: input.nom.trim().normalize().toUpperCase(),
    prenom: capitalize(input.prenom.trim().normalize()),
    date_de_naissance: jourMetier(input.date_de_naissance),
  };
}
