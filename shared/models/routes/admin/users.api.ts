import { z } from "zod";

export const zPostAdminAddMembreToMissionLocale = {
  email: z.string().email(),
  mission_locale_code: z.coerce.string(),
};
