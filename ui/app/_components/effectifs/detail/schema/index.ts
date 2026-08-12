import { apprenantSchema } from "./apprenantSchema";
import { contratsSchema } from "./contratsSchema";
import { formationSchema } from "./formationSchema";
import { lieuDeFormationSchema } from "./lieuDeFormationSchema";
import { statutsSchema } from "./statutSchema";

export const effectifFieldsSchema: Record<string, any> = {
  ...statutsSchema,
  ...contratsSchema,
  ...formationSchema,
  ...apprenantSchema,
  ...lieuDeFormationSchema,
};
