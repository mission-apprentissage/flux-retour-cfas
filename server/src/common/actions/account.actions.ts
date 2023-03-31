import { mailerActions } from "../../services.js";
import Boom from "boom";

import { organisationsDb } from "../model/collections.js";
import { RegistrationSchema } from "../validation/registrationSchema.js";
import { createOrganisation } from "./organisations.actions.js";
import { authenticate, createUser, getUserByEmail, updateUserLastConnection } from "./users.actions.js";
import { createSession } from "./sessions.actions.js";
import { createOrganisme, getOrganismeByUAIAndSIRET } from "./organismes/organismes.actions.js";
import logger from "../logger.js";

export async function register(registration: RegistrationSchema): Promise<void> {
  const alreadyExists = await getUserByEmail(registration.user.email);
  if (alreadyExists) {
    throw Boom.conflict("email already in use", { message: "email already in use" });
  }

  // on s'assure que l'organisme existe pour un OF
  const type = registration.organisation.type;
  if (
    type === "ORGANISME_FORMATION_FORMATEUR" ||
    type === "ORGANISME_FORMATION_RESPONSABLE" ||
    type === "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR"
  ) {
    const { uai, siret } = registration.organisation;
    try {
      await getOrganismeByUAIAndSIRET(uai, siret);
    } catch (err) {
      // FIXME créer un organisme depuis API entreprise ?
      // paramètres par défaut = va chercher dans API entreprise
      logger.warn({ action: "register", uai, siret }, "organisme inconnu");
      throw new Error("création à partir de API entreprise à faire");
      // await createOrganisme({ uai, siret });
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
