import { format } from "date-fns";
import { addJob } from "job-processor";
import { ObjectId } from "mongodb";
import type { IDemandeActivationCfa } from "shared/models/data/demandesActivationCfa.model";
import type { IUsersMigration } from "shared/models/data/usersMigration.model";

import { envoyerEmailBrevo, nomOrganisme } from "@/common/actions/admin/demandes-activation.actions";
import { resendConfirmationEmail } from "@/common/actions/users.actions";
import parentLogger from "@/common/logger";
import {
  demandesActivationCfaDb,
  invitationsArchiveDb,
  invitationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import config from "@/config";

const logger = parentLogger.child({ module: "demandes-activation:relances" });

const HEURE = 3600 * 1000;
const JOUR = 24 * HEURE;
const DELAI_INVITEZ_MS = 5 * 60 * 1000;

const DEMANDES_ACTIVEES = {
  statut: "envoyee",
  branche_envoyee: { $in: ["activation", "compte_existant"] },
} as const;

const lienInviter = () => `${config.publicUrl}/cfa/roles-habilitations`;

async function nomCfa(demande: Pick<IDemandeActivationCfa, "organisme_id">) {
  const organisme = demande.organisme_id
    ? await organismesDb().findOne(
        { _id: demande.organisme_id },
        { projection: { nom: 1, raison_sociale: 1, enseigne: 1 } }
      )
    : null;
  return nomOrganisme(organisme);
}

async function envoyer(
  templateId: number,
  destinataire: string,
  params: Record<string, unknown>,
  demande: Pick<IDemandeActivationCfa, "_id" | "envoye_par_email">
) {
  try {
    await envoyerEmailBrevo(templateId, destinataire, params, demande.envoye_par_email);
  } catch (err) {
    logger.warn({ err, demandeId: demande._id, templateId }, "Relance d'une demande d'activation non envoyée");
  }
}

async function poserVerrou(demande: IDemandeActivationCfa, champ: keyof IDemandeActivationCfa) {
  const { modifiedCount } = await demandesActivationCfaDb().updateOne(
    { _id: demande._id, [champ]: null },
    { $set: { [champ]: new Date(), updated_at: new Date() } }
  );
  return modifiedCount === 1;
}

export async function mettreEnFileInvitezCollaborateurs(
  utilisateur: Pick<IUsersMigration, "_id" | "email" | "organisation_id">
) {
  const demande = await demandesActivationCfaDb().findOneAndUpdate(
    {
      ...DEMANDES_ACTIVEES,
      invitez_queued_at: null,
      invitez_sent_at: null,
      $or: [
        { user_id: utilisateur._id },
        { email: utilisateur.email.toLowerCase(), organisation_id: utilisateur.organisation_id },
      ],
    },
    { $set: { user_id: utilisateur._id, invitez_queued_at: new Date(), updated_at: new Date() } }
  );
  if (demande) {
    await addJob({
      name: "demandes-activation:inviter-collaborateurs",
      payload: { demandeId: demande._id.toString() },
      queued: true,
      scheduled_for: new Date(Date.now() + DELAI_INVITEZ_MS),
    });
  }
}

export async function envoyerInvitezCollaborateurs(demandeId: ObjectId) {
  const demande = await demandesActivationCfaDb().findOneAndUpdate(
    { _id: demandeId, ...DEMANDES_ACTIVEES, invitez_sent_at: null },
    { $set: { invitez_sent_at: new Date(), updated_at: new Date() } }
  );
  if (!demande) return;
  const admin = demande.user_id ? await usersMigrationDb().findOne({ _id: demande.user_id }) : null;
  await envoyer(
    config.brevo.templatesDemandesActivation.invitezCollaborateurs,
    demande.email,
    { NOM_CFA: await nomCfa(demande), PRENOM: admin?.prenom ?? "", LIEN_INVITER: lienInviter() },
    demande
  );
}

async function debloquerEnvois(maintenant: Date) {
  await demandesActivationCfaDb().updateMany(
    { statut: "envoi_en_cours", envoi_en_cours_at: { $lte: new Date(maintenant.getTime() - JOUR) } },
    { $set: { statut: "echec", motif_echec: "Envoi interrompu : à renvoyer", updated_at: maintenant } }
  );
}

async function marquerInvitationsExpirees(maintenant: Date) {
  const demandes = await demandesActivationCfaDb()
    .find({ statut: "envoyee", branche_envoyee: "activation", invitation_id: { $ne: null } })
    .toArray();
  for (const demande of demandes) {
    const invitation = await invitationsDb().findOne({ _id: demande.invitation_id ?? undefined });
    if (!invitation?.expires_at || invitation.expires_at > maintenant) continue;
    if (await usersMigrationDb().findOne({ email: demande.email }, { projection: { _id: 1 } })) continue;
    await demandesActivationCfaDb().updateOne(
      { _id: demande._id, statut: "envoyee" },
      { $set: { statut: "invitation_expiree", updated_at: maintenant } }
    );
  }
}

async function relancerAdminsSansCompte(maintenant: Date) {
  const demandes = await demandesActivationCfaDb()
    .find({
      statut: "envoyee",
      branche_envoyee: "activation",
      envoyee_at: { $lte: new Date(maintenant.getTime() - 7 * JOUR) },
      relance_sans_compte_at: null,
    })
    .toArray();
  for (const demande of demandes) {
    if (await usersMigrationDb().findOne({ email: demande.email }, { projection: { _id: 1 } })) continue;
    const invitation = demande.invitation_id ? await invitationsDb().findOne({ _id: demande.invitation_id }) : null;
    if (!invitation?.expires_at || invitation.expires_at <= maintenant) continue;
    if (!(await poserVerrou(demande, "relance_sans_compte_at"))) continue;
    await envoyer(
      config.brevo.templatesDemandesActivation.relanceSansCompte,
      demande.email,
      {
        NOM_CFA: await nomCfa(demande),
        LIEN_INSCRIPTION: `${config.publicUrl}/auth/inscription-cfa?invitationToken=${invitation.token}`,
        DATE_EXPIRATION: format(invitation.expires_at, "dd/MM/yyyy"),
      },
      demande
    );
  }
}

async function renvoyerValidationEmail(maintenant: Date) {
  const demandes = await demandesActivationCfaDb()
    .find({ statut: "envoyee", branche_envoyee: "activation", relance_validation_email_at: null })
    .toArray();
  for (const demande of demandes) {
    const compte = await usersMigrationDb().findOne({
      email: demande.email,
      account_status: "PENDING_EMAIL_VALIDATION",
      created_at: { $lte: new Date(maintenant.getTime() - 2 * JOUR) },
    });
    if (!compte || !(await poserVerrou(demande, "relance_validation_email_at"))) continue;
    try {
      await resendConfirmationEmail(compte._id);
    } catch (err) {
      logger.warn({ err, demandeId: demande._id }, "Renvoi de la validation d'email en échec");
    }
  }
}

const connecteDepuis = (compte: Pick<IUsersMigration, "connection_history" | "last_connection">, depuis: Date) =>
  [...(compte.connection_history ?? []), ...(compte.last_connection ? [compte.last_connection] : [])].some(
    (date) => date > depuis
  );

async function relancerAdminsAvecCompte(maintenant: Date) {
  const demandes = await demandesActivationCfaDb()
    .find({
      statut: "envoyee",
      branche_envoyee: "compte_existant",
      envoyee_at: { $lte: new Date(maintenant.getTime() - 7 * JOUR) },
      relance_avec_compte_at: null,
    })
    .toArray();
  for (const demande of demandes) {
    const compte = await usersMigrationDb().findOne({ email: demande.email });
    if (!compte || !demande.envoyee_at || connecteDepuis(compte, demande.envoyee_at)) continue;
    if (!(await poserVerrou(demande, "relance_avec_compte_at"))) continue;
    await envoyer(
      config.brevo.templatesDemandesActivation.relanceAvecCompte,
      demande.email,
      {
        NOM_CFA: await nomCfa(demande),
        PRENOM: compte.prenom ?? "",
        LIEN_CONNEXION: `${config.publicUrl}/auth/connexion`,
      },
      demande
    );
  }
}

async function relancerAdminsSansInvitation(maintenant: Date) {
  const demandes = await demandesActivationCfaDb()
    .find({
      ...DEMANDES_ACTIVEES,
      user_id: { $ne: null },
      invitez_sent_at: { $lte: new Date(maintenant.getTime() - 7 * JOUR) },
      relance_sans_invitation_at: null,
    })
    .toArray();
  for (const demande of demandes) {
    const depuis = {
      author_id: demande.user_id ?? undefined,
      created_at: { $gte: demande.invitez_sent_at ?? maintenant },
    };
    const invitations =
      (await invitationsDb().countDocuments(depuis)) + (await invitationsArchiveDb().countDocuments(depuis));
    if (invitations > 0 || !(await poserVerrou(demande, "relance_sans_invitation_at"))) continue;
    const admin = await usersMigrationDb().findOne({ _id: demande.user_id ?? undefined });
    await envoyer(
      config.brevo.templatesDemandesActivation.relanceSansInvitation,
      demande.email,
      { NOM_CFA: await nomCfa(demande), PRENOM: admin?.prenom ?? "", LIEN_INVITER: lienInviter() },
      demande
    );
  }
}

async function demandesParAdmin() {
  const demandes = await demandesActivationCfaDb()
    .find({ ...DEMANDES_ACTIVEES, user_id: { $ne: null } })
    .toArray();
  return new Map(demandes.map((demande) => [demande.user_id?.toString() ?? "", demande]));
}

async function relancerInvitationsEnAttente(maintenant: Date, parAdmin: Map<string, IDemandeActivationCfa>) {
  const invitations = await invitationsDb()
    .find({
      author_id: { $in: [...parAdmin.keys()].map((id) => new ObjectId(id)) },
      created_at: { $lte: new Date(maintenant.getTime() - 48 * HEURE) },
      relance_admin_at: { $exists: false },
    })
    .toArray();
  for (const invitation of invitations) {
    const demande = parAdmin.get(invitation.author_id.toString());
    if (!demande) continue;
    const { modifiedCount } = await invitationsDb().updateOne(
      { _id: invitation._id, relance_admin_at: { $exists: false } },
      { $set: { relance_admin_at: maintenant } }
    );
    if (modifiedCount === 0) continue;
    const admin = await usersMigrationDb().findOne({ _id: invitation.author_id });
    await envoyer(
      config.brevo.templatesDemandesActivation.relanceInvitationEnAttente,
      demande.email,
      { NOM_CFA: await nomCfa(demande), PRENOM: admin?.prenom ?? "", EMAIL_INVITE: invitation.email },
      demande
    );
  }
}

async function accueillirCollaborateurs(maintenant: Date, parAdmin: Map<string, IDemandeActivationCfa>) {
  const archives = await invitationsArchiveDb()
    .find({ author_id: { $in: [...parAdmin.keys()].map((id) => new ObjectId(id)) } })
    .toArray();
  for (const archive of archives) {
    const demande = parAdmin.get(archive.author_id.toString());
    const collaborateur = await usersMigrationDb().findOne({
      email: archive.email,
      organisation_id: archive.organisation_id,
      onboarding_collaborateur_at: { $exists: false },
    });
    const premiereConnexion = collaborateur?.connection_history?.[0] ?? collaborateur?.last_connection;
    if (!demande || !collaborateur || !premiereConnexion) continue;
    if (premiereConnexion > new Date(maintenant.getTime() - JOUR)) continue;
    const { modifiedCount } = await usersMigrationDb().updateOne(
      { _id: collaborateur._id, onboarding_collaborateur_at: { $exists: false } },
      { $set: { onboarding_collaborateur_at: maintenant } }
    );
    if (modifiedCount === 0) continue;
    await envoyer(
      config.brevo.templatesDemandesActivation.onboardingCollaborateur,
      collaborateur.email,
      { NOM_CFA: await nomCfa(demande), PRENOM: collaborateur.prenom ?? "" },
      demande
    );
  }
}

export async function relancerDemandesActivation(maintenant = new Date()) {
  await debloquerEnvois(maintenant);
  await marquerInvitationsExpirees(maintenant);
  await relancerAdminsSansCompte(maintenant);
  await renvoyerValidationEmail(maintenant);
  await relancerAdminsAvecCompte(maintenant);
  await relancerAdminsSansInvitation(maintenant);
  const parAdmin = await demandesParAdmin();
  await relancerInvitationsEnAttente(maintenant, parAdmin);
  await accueillirCollaborateurs(maintenant, parAdmin);
}
