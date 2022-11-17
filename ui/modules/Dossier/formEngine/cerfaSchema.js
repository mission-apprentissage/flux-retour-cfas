import { employerSchema } from "../cerfaForm/blocks/employer/employerSchema";
import { maitreSchema } from "../cerfaForm/blocks/maitre/maitreSchema";
import { apprentiSchema } from "../cerfaForm/blocks/apprenti/apprentiSchema";
import { controls } from "./controls";
import { contratSchema } from "../cerfaForm/blocks/contrat/contratSchema";
import { formationSchema } from "../cerfaForm/blocks/formation/formationSchema";
import { signatureSchema } from "../Signatures/signatureSchema";
import { piecesJustificativesSchema } from "../PiecesJustificatives/piecesJustificativesSchema";

export const cerfaSchema = {
  fields: {
    ...employerSchema,
    ...maitreSchema,
    ...apprentiSchema,
    ...contratSchema,
    ...formationSchema,
    ...signatureSchema,
    ...piecesJustificativesSchema,
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
  Object.entries(indexedDependencies).map(([name, dependences]) => {
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
