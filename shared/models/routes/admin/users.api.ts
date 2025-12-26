import { z } from "zod";

import { zAdresse } from "../../parts/adresseSchema";

export const zPostAdminAddMembreToMissionLocale = {
  email: z.string().email(),
  mission_locale_id: z.coerce.number(),
};

export const zPostAdminAddMembreToFranceTravail = {
  email: z.string().email(),
  code_region: zAdresse.shape.region,
};
