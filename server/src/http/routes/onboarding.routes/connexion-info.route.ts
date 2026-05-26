import Boom from "boom";
import express from "express";
import { z } from "zod";

import { getConnexionInvitationInfoByEmail } from "@/common/actions/brevo-contact-lists/connexion-invitation-info.actions";
import { getConnexionInvitationByToken } from "@/common/actions/brevo-contact-lists/connexion-invitations.actions";
import { returnResult } from "@/http/middlewares/helpers";

const querySchema = z.object({
  token: z.string().min(10).max(200),
});

/**
 * `GET /api/v1/onboarding/connexion-info?token=<random-hex>` — appelée depuis
 * `/auth/connexion?invitationToken=...` quand un destinataire clique sur le
 * `lien_connexion_personnalise` reçu par email. Pas de check d'expiration : le
 * lien pré-remplit l'email mais n'authentifie pas.
 */
export default () => {
  const router = express.Router();

  router.get(
    "/",
    returnResult(async (req) => {
      const { token } = querySchema.parse(req.query);

      const invitation = await getConnexionInvitationByToken(token);
      if (!invitation) {
        throw Boom.notFound("Jeton de connexion non valide");
      }

      const info = await getConnexionInvitationInfoByEmail(invitation.email);
      if (!info) {
        throw Boom.notFound("Utilisateur introuvable");
      }

      return info;
    })
  );

  return router;
};
