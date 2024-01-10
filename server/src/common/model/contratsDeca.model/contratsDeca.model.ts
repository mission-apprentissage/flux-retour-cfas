import { date, object, objectId } from "shared";

import { contratsDecaApprenantSchema } from "./parts/contratsDeca.apprenant.part";
import { contratsDecaDetailsContratSchema } from "./parts/contratsDeca.detailsContrat.part";
import { contratsDecaEmployeurSchema } from "./parts/contratsDeca.employeur.part";
import { contratsDecaEtablissementFormationSchema } from "./parts/contratsDeca.etablissementFormation.part";
import { contratsDecaFormationSchema } from "./parts/contratsDeca.formation.part";
import { contratsDecaOrganismeFormationResponsableSchema } from "./parts/contratsDeca.organismeFormationResponsable.part";
import { contratsDecaRuptureSchema } from "./parts/contratsDeca.rupture.part";

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
