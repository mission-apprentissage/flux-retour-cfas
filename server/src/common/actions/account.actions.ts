import { mailerActions } from "../../services.js";
import Boom from "boom";
import { z } from "zod";

import { organisationsDb } from "../model/collections.js";
import registrationSchema from "../validation/registrationSchema.js";
import { createOrganisation } from "./organisations.actions.js";
import { authenticate, createUser, getUserByEmail, updateUserLastConnection } from "./users.actions.js";
import { createSession } from "./sessions.actions.js";
import { isOrganisationOF } from "./helpers/permissions.js";
import { createOrganisme, getOrganismeByUAIAndSIRET } from "./organismes/organismes.actions.js";
import { OrganisationOrganismeFormation } from "../model/organisations.model.js";

export async function register(registration: z.infer<ReturnType<typeof registrationSchema>>): Promise<void> {
  const alreadyExists = await getUserByEmail(registration.user.email);
  if (alreadyExists) {
    throw Boom.conflict("email already in use", { message: "email already in use" });
  }

  // on s'assure que l'organisme existe pour un OF
  if (isOrganisationOF(registration.organisation.type)) {
    const registrationOrganisation = registration.organisation as OrganisationOrganismeFormation; // typage zod à revoir
    try {
      await getOrganismeByUAIAndSIRET(registrationOrganisation.uai, registrationOrganisation.siret);
    } catch (err) {
      // FIXME créer un organisme depuis API entreprise ?
      // paramètres par défaut = va chercher dans API entreprise
      await createOrganisme({ uai: registrationOrganisation.uai, siret: registrationOrganisation.siret });
    }
  }

  const organisation = await organisationsDb().findOne(registration.organisation);
  const organisationId = organisation ? organisation._id : await createOrganisation(registration.organisation);

  await createUser(registration.user, organisationId);

  // FIXME send simple email
  await mailerActions.sendEmail({ to: registration.user.email, payload: registration.user }, "activation_user");
}

export async function login(email: string, password: string): Promise<string> {
  const user = await getUserByEmail(email.toLowerCase());
  if (!user) {
    throw Boom.unauthorized("Accès non autorisé");
  }

  const auth = await authenticate(user.email, password);
  if (!auth) {
    throw Boom.unauthorized("Accès non autorisé");
  }

  await updateUserLastConnection(auth.email);

  const sessionToken = createSession(auth.email);
  return sessionToken;
}
