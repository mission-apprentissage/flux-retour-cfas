import { z } from "zod";

export const zPostAdminAddMembreToMissionLocale = {
  email: z.string().email(),
  mission_locale_id: z.coerce.number(),
};
