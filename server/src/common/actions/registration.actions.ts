import { mailerActions } from "../../services.js";
import Boom from "boom";
import { z } from "zod";

import { organisationsDb } from "../model/collections.js";
import registrationSchema from "../validation/registrationSchema.js";
import { createOrganisation } from "./organisations.actions.js";
import { createUser, getUserByEmail } from "./users.actions.js";

export async function register(registration: z.infer<ReturnType<typeof registrationSchema>>): Promise<void> {
  const alreadyExists = await getUserByEmail(registration.user.email);
  if (alreadyExists) {
    throw Boom.conflict("email already in use", { message: "email already in use" });
  }

  const organisation = await organisationsDb().findOne(registration.organisation);
  const organisationId = organisation ? organisation._id : await createOrganisation(registration.organisation);

  await createUser(registration.user, organisationId);

  // FIXME send simple email
  await mailerActions.sendEmail({ to: registration.user.email, payload: registration.user }, "activation_user");
}
