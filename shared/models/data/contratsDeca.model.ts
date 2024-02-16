import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { zContratsDecaApprenantSchema } from "./contratsDeca/contratsDeca.apprenant.part";
import { zContratsDecaDetailsContratSchema } from "./contratsDeca/contratsDeca.detailsContrat.part";
import { zContratsDecaEmployeurSchema } from "./contratsDeca/contratsDeca.employeur.part";
import { zContratsDecaEtablissementFormationSchema } from "./contratsDeca/contratsDeca.etablissementFormation.part";
import { zContratsDecaFormationSchema } from "./contratsDeca/contratsDeca.formation.part";
import { zContratsDecaOrganismeFormationResponsableSchema } from "./contratsDeca/contratsDeca.organismeFormationResponsable.part";
import { zContratsDecaRuptureSchema } from "./contratsDeca/contratsDeca.rupture.part";

const collectionName = "contratsDeca";

const zContratsDeca = z
  .object({
    _id: zObjectId,
    alternant: zContratsDecaApprenantSchema,
    formation: zContratsDecaFormationSchema,
    etablissementFormation: zContratsDecaEtablissementFormationSchema,
    organismeFormationResponsable: zContratsDecaOrganismeFormationResponsableSchema,
    detailsContrat: zContratsDecaDetailsContratSchema,
    rupture: zContratsDecaRuptureSchema.nullish(),
    employeur: zContratsDecaEmployeurSchema,

    created_at: z.date().describe("Date d'ajout en base de données"),
  })
  .strict();

export type IContratDeca = z.output<typeof zContratsDeca>;

export default { zod: zContratsDeca, collectionName, indexes: [] };
