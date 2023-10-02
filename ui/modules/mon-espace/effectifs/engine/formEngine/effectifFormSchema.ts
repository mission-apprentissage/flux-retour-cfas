import { apprenantSchema } from "@/modules/mon-espace/effectifs/engine/effectifForm/blocks/apprenant/apprenantSchema";
import { contratsSchema } from "@/modules/mon-espace/effectifs/engine/effectifForm/blocks/contrats/contratsSchema";
import { formationSchema } from "@/modules/mon-espace/effectifs/engine/effectifForm/blocks/formation/formationSchema";
import { statutsSchema } from "@/modules/mon-espace/effectifs/engine/effectifForm/blocks/statuts/statutSchema";

import { controls } from "./controls";

export const effectifFormSchema = {
  fields: {
    ...statutsSchema,
    ...contratsSchema,
    ...formationSchema,
    ...apprenantSchema,
  },
  logics: controls,
};

export const indexedDependencies = (() => {
  const names = {};
  controls.forEach((rule) => {
    rule.deps.forEach((dep) => {
      rule.deps.forEach((depI) => {
        names[dep] = names[dep] ?? {};
        names[dep][depI] = true;
      });
      delete names[dep][dep];
    });
  });
  return Object.fromEntries(Object.keys(names).reduce((acc, name) => [...acc, [name, Object.keys(names[name])]], []));
})();

export const indexedRules = Object.fromEntries(
  Object.keys(indexedDependencies).map((name) => [name, controls.filter((logic) => logic.deps.includes(name))])
);

export const indexedDependencesRevalidationRules = Object.fromEntries(
  Object.entries(indexedDependencies).map(([name, dependences]: any) => {
    return [
      name,
      Object.fromEntries(
        dependences.map((dependence) => {
          return [dependence, indexedRules[dependence].filter((logic) => !logic.deps.includes(name))];
        })
      ),
    ];
  })
);
