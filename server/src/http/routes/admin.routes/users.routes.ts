import Boom from "boom";
import { format } from "date-fns";
import express from "express";
import { ObjectId } from "mongodb";
import { getWarningOnEmail } from "shared/models/data/organisations.model";
import { UAI_INCONNUE } from "shared/models/data/organismes.model";
import {
  zPostAdminAddMembreToFranceTravail,
  zPostAdminAddMembreToMissionLocale,
} from "shared/models/routes/admin/users.api";
import { z } from "zod";

import { activateMissionLocaleAtAdminValidation } from "@/common/actions/admin/mission-locale/mission-locale.admin.actions";
import { getFranceTravailOrganisationByCodeRegion } from "@/common/actions/franceTravail/franceTravailEffectif.actions";
import { getOrCreateMissionLocaleById } from "@/common/actions/mission-locale/mission-locale.actions";
import {
  getOrganisationOrganismeByOrganismeId,
  INVITATION_EXPIRATION_MS,
  inviteUserToOrganisation,
  rejectMembre,
  validateMembre,
} from "@/common/actions/organisations.actions";
import {
  adminUpdateUserRole,
  getAllUsers,
  getAllUsersForExport,
  getDetailedUserById,
  removeUser,
  resendConfirmationEmail,
  updateUser,
} from "@/common/actions/users.actions";
import { invitationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { sendEmail } from "@/common/services/mailer/mailer";
import { generateKey } from "@/common/utils/cryptoUtils";
import { getCurrentTime } from "@/common/utils/timeUtils";
import { buildFiltersFromQuery } from "@/common/utils/usersFiltersUtils";
import { validateFullZodObjectSchema } from "@/common/utils/validationUtils";
import objectIdSchema from "@/common/validation/objectIdSchema";
import userSchema from "@/common/validation/userSchema";
import usersFiltersSchema, { UsersFiltersParams } from "@/common/validation/usersFiltersSchema";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

export default () => {
  const router = express.Router();

  router.get(
    "/",
    validateRequestMiddleware({
      query: usersFiltersSchema(),
    }),
    async (req, res) => {
      const { page, limit, sort } = req.query as UsersFiltersParams;
      const query = buildFiltersFromQuery(req.query as UsersFiltersParams);
      const result = await getAllUsers(query, { page, limit, sort });
      return res.json(result);
    }
  );

  router.get(
    "/export",
    validateRequestMiddleware({
      query: usersFiltersSchema(),
    }),
    async (req, res) => {
      const { sort } = req.query as unknown as UsersFiltersParams;
      const query = buildFiltersFromQuery(req.query as unknown as UsersFiltersParams);
      const users = await getAllUsersForExport(query, { sort });
      return res.json(users);
    }
  );

  router.put(
    "/:id/validate",
    returnResult(async (req) => {
      await validateMembre(req.user, req.params.id);
    })
  );

  router.put(
    "/:id/reject",
    returnResult(async (req) => {
      await rejectMembre(req.user, req.params.id);
    })
  );

  router.put(
    "/:id",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
      body: userSchema().strict(),
    }),
    async ({ body, params }, res) => {
      const { id } = params;

      await updateUser(id as string, body);
      const user = await getDetailedUserById(id as string);
      if (!user) {
        throw Boom.notFound(`User with id ${id} not found`);
      }

      res.json({ ok: true });
    }
  );

  router.get(
    "/:id",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
    }),
    async ({ params }, res) => {
      const { id } = params;
      const user = await getDetailedUserById(id as string);
      if (!user) {
        throw Boom.notFound(`User with id ${id} not found`);
      }

      let warning = getWarningOnEmail(user.email, user.organisation);

      res.json({ user, warning });
    }
  );

  router.delete(
    "/:id",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
    }),
    async ({ params }, res) => {
      const { id } = params;

      await removeUser(id);

      res.json({ ok: true, message: `User ${id} deleted !` });
    }
  );

  router.post(
    "/:id/resend-confirmation-email",
    validateRequestMiddleware({
      params: objectIdSchema("id"),
    }),
    returnResult(async (req) => {
      await resendConfirmationEmail(req.params.id as string, { bypassCooldown: true });
    })
  );

  router.post(
    "/mission-locale/membre",
    returnResult(async (req) => {
      const body = await validateFullZodObjectSchema(req.body, zPostAdminAddMembreToMissionLocale);
      const { email, mission_locale_id } = body;
      const organisation = await getOrCreateMissionLocaleById(mission_locale_id);
      if (!organisation) {
        throw Boom.notFound("Mission locale not found");
      }
      await inviteUserToOrganisation(req.user, email, organisation._id);
      await activateMissionLocaleAtAdminValidation(organisation._id, new Date());
    })
  );

  router.post(
    "/france-travail/membre",
    returnResult(async (req) => {
      const body = await validateFullZodObjectSchema(req.body, zPostAdminAddMembreToFranceTravail);
      const { email, code_region } = body;

      if (!code_region) {
        throw Boom.badRequest("code_region is required");
      }

      const organisation = await getFranceTravailOrganisationByCodeRegion(code_region as string);
      if (!organisation) {
        throw Boom.notFound("France Travail organisation not found");
      }
      await inviteUserToOrganisation(req.user, email, organisation._id);
    })
  );

  const zCfaAdminInvite = {
    email: z.string().email().toLowerCase().trim(),
    siret: z.string().regex(/^\d{14}$/, "SIRET invalide (14 chiffres attendus)"),
    uai: z
      .string()
      .trim()
      .refine((v) => v.toLowerCase() !== UAI_INCONNUE.toLowerCase(), "UAI non déterminée, ne peut pas être utilisé")
      .optional(),
    prenom: z.string().trim().min(1, "Prénom requis").max(100),
    nom: z.string().trim().min(1, "Nom requis").max(100),
  };

  router.post(
    "/cfa/admin-invite",
    returnResult(async (req) => {
      const body = await validateFullZodObjectSchema(req.body, zCfaAdminInvite);
      const { email, siret, uai, prenom, nom } = body;

      const organisme = await organismesDb().findOne({
        siret,
        ...(uai ? { uai } : {}),
      });
      if (!organisme) {
        throw Boom.notFound("Organisme de formation introuvable pour ce SIRET/UAI");
      }

      const organisation = await getOrganisationOrganismeByOrganismeId(organisme._id);
      if (!organisation) {
        throw Boom.internal("Impossible de créer l'organisation pour cet organisme");
      }

      const emailEsc = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const existingUser = await usersMigrationDb().findOne(
        { email: { $regex: `^${emailEsc}$`, $options: "i" } },
        { projection: { _id: 1, email: 1, organisation_id: 1 } }
      );
      if (existingUser) {
        throw Boom.conflict(
          "Cet email est déjà rattaché à un compte. Utilisez la fiche utilisateur pour modifier ses droits."
        );
      }

      const existingInvitation = await invitationsDb().findOne({ email, organisation_id: organisation._id });
      if (existingInvitation) {
        throw Boom.conflict(
          "Une invitation est déjà en cours pour cette adresse email sur cet établissement. Utilisez le bouton 'Renvoyer' pour relancer."
        );
      }

      const [adminCount, memberCount] = await Promise.all([
        usersMigrationDb().countDocuments({
          organisation_id: organisation._id,
          organisation_role: "admin",
          account_status: "CONFIRMED",
        }),
        usersMigrationDb().countDocuments({
          organisation_id: organisation._id,
          account_status: "CONFIRMED",
        }),
      ]);
      let warning: string | undefined;
      if (adminCount >= 1) {
        warning = `Cet établissement a déjà ${adminCount} administrateur${
          adminCount > 1 ? "s" : ""
        } actif${adminCount > 1 ? "s" : ""}. L'invitation sera envoyée tout de même.`;
      } else if (memberCount >= 1) {
        warning = `Cet établissement a ${memberCount} membre${
          memberCount > 1 ? "s" : ""
        } actif${memberCount > 1 ? "s" : ""} mais aucun administrateur.`;
      }

      const invitationToken = generateKey(50, "hex");
      const expiresAt = new Date(Date.now() + INVITATION_EXPIRATION_MS);
      await invitationsDb().insertOne({
        _id: new ObjectId(),
        organisation_id: organisation._id,
        email,
        token: invitationToken,
        author_id: req.user._id,
        role: "admin",
        prenom,
        nom,
        created_at: getCurrentTime(),
        expires_at: expiresAt,
      });

      const cfaName = organisme.nom || organisme.enseigne || organisme.raison_sociale || "Organisme";
      const cfaCity = organisme.adresse?.commune || "";
      const cfaPostalCode = organisme.adresse?.code_postal || "";

      await sendEmail(email, "invitation_cfa_admin", {
        recipient: { prenom, nom },
        cfaName,
        cfaCity,
        cfaPostalCode,
        requestDate: format(getCurrentTime(), "dd/MM/yyyy"),
        invitationToken,
      });

      return { email, organismeNom: cfaName, expiresAt, warning };
    })
  );

  router.post(
    "/cfa/admin-invite/resend",
    returnResult(async (req) => {
      const body = await validateFullZodObjectSchema(req.body, {
        email: z.string().email().toLowerCase().trim(),
        siret: z.string().regex(/^\d{14}$/, "SIRET invalide (14 chiffres attendus)"),
        uai: z.string().trim().optional(),
      });
      const { email, siret, uai } = body;

      const organisme = await organismesDb().findOne({
        siret,
        ...(uai && uai.toLowerCase() !== UAI_INCONNUE.toLowerCase() ? { uai } : {}),
      });
      if (!organisme) {
        throw Boom.notFound("Organisme de formation introuvable pour ce SIRET/UAI");
      }

      const organisation = await getOrganisationOrganismeByOrganismeId(organisme._id);
      if (!organisation) {
        throw Boom.notFound("Organisation introuvable");
      }

      const invitation = await invitationsDb().findOne({
        email,
        organisation_id: organisation._id,
        role: "admin",
      });
      if (!invitation) {
        throw Boom.notFound("Aucune invitation en cours pour cet email sur cet établissement");
      }

      const newExpiresAt = new Date(Date.now() + INVITATION_EXPIRATION_MS);
      await invitationsDb().updateOne({ _id: invitation._id }, { $set: { expires_at: newExpiresAt } });

      const cfaName = organisme.nom || organisme.enseigne || organisme.raison_sociale || "Organisme";
      const cfaCity = organisme.adresse?.commune || "";
      const cfaPostalCode = organisme.adresse?.code_postal || "";

      await sendEmail(email, "invitation_cfa_admin", {
        recipient: { prenom: invitation.prenom || "", nom: invitation.nom || "" },
        cfaName,
        cfaCity,
        cfaPostalCode,
        requestDate: format(getCurrentTime(), "dd/MM/yyyy"),
        invitationToken: invitation.token,
      });

      return { email, organismeNom: cfaName, expiresAt: newExpiresAt };
    })
  );

  router.put(
    "/:id/role",
    returnResult(async (req) => {
      const { role } = await validateFullZodObjectSchema(req.body, { role: z.enum(["admin", "member"]) });
      await adminUpdateUserRole(req.params.id as string, role);
      return { ok: true };
    })
  );

  return router;
};
