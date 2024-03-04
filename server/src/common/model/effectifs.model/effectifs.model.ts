import { IFormationEffectif } from "shared/models/data/effectifs/formation.part";
import { IEffectif } from "shared/models/data/effectifs.model";

export type IEffectifDefault = {
  apprenant: Pick<IEffectif["apprenant"], "historique_statut">;
  contrats: IEffectif["contrats"];
  formation: Pick<IFormationEffectif, "periode">;
  is_lock: IEffectif["is_lock"];
  validation_errors: IEffectif["validation_errors"];
  _computed: Partial<IEffectif["_computed"]>;
  updated_at: IEffectif["updated_at"];
  created_at: IEffectif["created_at"];
};

export function defaultValuesEffectif(): IEffectifDefault {
  return {
    apprenant: {
      historique_statut: [],
    },
    contrats: [],
    formation: {
      periode: [],
    },
    is_lock: {
      apprenant: {
        nom: true,
        prenom: true,
      },
      formation: {
        cfd: true,
      },
    },
    validation_errors: [],
    _computed: {},
    updated_at: new Date(),
    created_at: new Date(),
  };
}
