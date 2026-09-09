import { apprenantSchema } from "./apprenantSchema";
import { contratsSchema } from "./contratsSchema";
import { formationSchema } from "./formationSchema";
import { lieuDeFormationSchema } from "./lieuDeFormationSchema";
import { statutsSchema } from "./statutSchema";

export const effectifFieldsSchema: Record<string, Record<string, unknown>> = {
  ...statutsSchema,
  ...contratsSchema,
  ...formationSchema,
  ...apprenantSchema,
  ...lieuDeFormationSchema,
};
