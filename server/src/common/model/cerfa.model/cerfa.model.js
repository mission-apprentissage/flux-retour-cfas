import { object, boolean, objectId } from "../json-schema/jsonSchemaTypes.js";

import { employeurCerfaSchema, defaultValuesEmployeurCerfa } from "./parts/employeurCerfa.part.js";
// import apprentiSchema from "./parts/apprenti.part.js";
// import maitreApprentissageSchema from "./parts/maitreApprentissage.part.js";
// import formationSchema from "./parts/formation.part.js";
// import contratSchema from "./parts/contrat.part.js";
// import organismeFormationSchema from "./parts/organismeFormation.part.js";
// import etablissementFormationSchema from "./parts/etablissementFormation.part.js";
import { fieldLockedSchema, defaultValuesFieldLocked } from "./parts/fieldLocked.part.js";

export const collectionName = "cerfas";

export function schema() {
  return object(
    {
      _id: objectId(),
      employeur: employeurCerfaSchema,
      // apprenti: apprentiSchema,
      // maitre1: maitreApprentissageSchema,
      // maitre2: {
      //   nom: {
      //     ...maitreApprentissageSchema.nom,
      //     required: false,
      //   },
      //   prenom: {
      //     ...maitreApprentissageSchema.prenom,
      //     required: false,
      //   },
      //   dateNaissance: {
      //     ...maitreApprentissageSchema.dateNaissance,
      //     required: false,
      //   },
      // },
      // formation: formationSchema,
      // contrat: contratSchema,
      // organismeFormation: organismeFormationSchema,
      // etablissementFormation: etablissementFormationSchema,
      isLockedField: fieldLockedSchema,
      draft: boolean({
        description: "Statut interne brouillon",
      }),
    },
    { required: ["draft"], additionalProperties: false }
  );
}

// Default value
export function defaultValuesCerfa() {
  return {
    draft: true,
    employeur: defaultValuesEmployeurCerfa(),
    isLockedField: defaultValuesFieldLocked(),
  };
}
