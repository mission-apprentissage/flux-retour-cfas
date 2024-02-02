import { date, object, objectId } from "shared";

import { contratsDecaApprenantSchema } from "./contratsDeca/contratsDeca.apprenant.part";
import { contratsDecaDetailsContratSchema } from "./contratsDeca/contratsDeca.detailsContrat.part";
import { contratsDecaEmployeurSchema } from "./contratsDeca/contratsDeca.employeur.part";
import { contratsDecaEtablissementFormationSchema } from "./contratsDeca/contratsDeca.etablissementFormation.part";
import { contratsDecaFormationSchema } from "./contratsDeca/contratsDeca.formation.part";
import { contratsDecaOrganismeFormationResponsableSchema } from "./contratsDeca/contratsDeca.organismeFormationResponsable.part";
import { contratsDecaRuptureSchema } from "./contratsDeca/contratsDeca.rupture.part";

const collectionName = "contratsDeca";

const schema = object(
  {
    _id: objectId(),
    alternant: contratsDecaApprenantSchema,
    formation: contratsDecaFormationSchema,
    etablissementFormation: contratsDecaEtablissementFormationSchema,
    organismeFormationResponsable: contratsDecaOrganismeFormationResponsableSchema,
    detailsContrat: contratsDecaDetailsContratSchema,
    rupture: contratsDecaRuptureSchema,
    employeur: contratsDecaEmployeurSchema,

    created_at: date({ description: "Date d'ajout en base de données" }),
  },
  {
    required: [
      "alternant",
      "formation",
      "etablissementFormation",
      "organismeFormationResponsable",
      "detailsContrat",
      "employeur",
      "created_at",
    ],
  }
);

export default { schema, collectionName, indexes: [] };
