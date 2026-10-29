import type { IOrganisation } from "shared/models/data/organisations.model";

import logger from "@/common/logger";
import { auditLogsDb } from "@/common/model/collections";
import type { AuthContext } from "@/common/model/internal/AuthContext";

type OrganisationImitation = Pick<IOrganisation, "_id" | "type">;

/**
 * Trace l'ouverture d'une imposture dans les logs d'audit, à appeler avant la création de la session :
 * si l'écriture échoue, l'imposture n'est pas ouverte.
 */
export async function journaliserImposture({
  user,
  origine,
  cible,
  readOnly,
}: {
  user: AuthContext;
  origine: OrganisationImitation;
  cible: OrganisationImitation;
  readOnly: boolean;
}) {
  const action = readOnly ? "imposture_lecture_seule" : "imposture_admin";
  const depuisImpostureAdmin = user.impersonating === true;

  await auditLogsDb().insertOne({
    action,
    date: new Date(),
    data: {
      utilisateur_id: user._id,
      depuis_imposture_admin: depuisImpostureAdmin,
      organisation_origine: { id: origine._id, type: origine.type },
      cible: { id: cible._id, type: cible.type },
    },
  });
  logger.info(
    {
      event: action,
      utilisateur_id: user._id.toString(),
      depuis_imposture_admin: depuisImpostureAdmin,
      organisation_origine: { id: origine._id.toString(), type: origine.type },
      cible: { id: cible._id.toString(), type: cible.type },
    },
    readOnly ? "Imposture en lecture seule" : "Imposture administrateur"
  );
}
