import { format } from "date-fns";
import { addJob } from "job-processor";
import { ObjectId } from "mongodb";
import type { IDemandeActivationCfa } from "shared/models/data/demandesActivationCfa.model";
import type { IUsersMigration } from "shared/models/data/usersMigration.model";

import { envoyerEmailBrevo, paramsActivationAvecCompte } from "@/common/actions/admin/demandes-activation.actions";
import { lienInscriptionCfa, nomCfaPourEmail } from "@/common/actions/organisations.actions";
import { getUserByEmailIgnoringCase, resendConfirmationEmail } from "@/common/actions/users.actions";
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
  return nomCfaPourEmail(organisme);
}

async function envoyer(
  templateId: number,
  destinataire: string,
  params: Record<string, unknown>,
  demande: Pick<IDemandeActivationCfa, "_id" | "envoye_par_email">
): Promise<boolean> {
  try {
    await envoyerEmailBrevo(templateId, destinataire, params, demande.envoye_par_email);
    return true;
  } catch (err) {
    logger.warn({ err, demandeId: demande._id, templateId }, "Relance d'une demande d'activation non envoyée");
    return false;
  }
}

type Verrou = { poser: () => Promise<boolean>; lever: () => Promise<unknown> };

const verrouDemande = (
  demande: IDemandeActivationCfa,
  champ:
    | "relance_sans_compte_at"
    | "relance_validation_email_at"
    | "relance_avec_compte_at"
    | "relance_sans_invitation_at"
): Verrou => ({
  poser: async () => {
    const { modifiedCount } = await demandesActivationCfaDb().updateOne(
      { _id: demande._id, [champ]: null },
      { $set: { [champ]: new Date(), updated_at: new Date() } }
    );
    return modifiedCount === 1;
  },
  lever: () =>
    demandesActivationCfaDb().updateOne({ _id: demande._id }, { $set: { [champ]: null, updated_at: new Date() } }),
});

async function sousVerrou(verrou: Verrou, envoi: () => Promise<boolean>) {
  if (!(await verrou.poser())) return;
  if (!(await envoi())) await verrou.lever();
}

async function relancer(
  templateId: number,
  verrou: Verrou,
  destinataire: string,
  params: () => Promise<Record<string, unknown>>,
  demande: IDemandeActivationCfa
) {
  if (!templateId) return;
  await sousVerrou(verrou, async () => envoyer(templateId, destinataire, await params(), demande));
}

async function renvoyerValidation(compte: IUsersMigration, demande: IDemandeActivationCfa): Promise<boolean> {
  try {
    return (await resendConfirmationEmail(compte._id)).sent;
  } catch (err) {
    logger.warn({ err, demandeId: demande._id }, "Renvoi de la validation d'email en échec");
    return false;
  }
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
  if (!demande) return;
  try {
    await addJob({
      name: "demandes-activation:inviter-collaborateurs",
      payload: { demandeId: demande._id.toString() },
      queued: true,
      scheduled_for: new Date(Date.now() + DELAI_INVITEZ_MS),
    });
  } catch (err) {
    await demandesActivationCfaDb().updateOne(
      { _id: demande._id },
      { $set: { invitez_queued_at: null, updated_at: new Date() } }
    );
    throw err;
  }
}

export async function envoyerInvitezCollaborateurs(demandeId: ObjectId) {
  const demande = await demandesActivationCfaDb().findOneAndUpdate(
    { _id: demandeId, ...DEMANDES_ACTIVEES, invitez_sent_at: null },
    { $set: { invitez_sent_at: new Date(), updated_at: new Date() } }
  );
  if (!demande) return;
  const admin = demande.user_id ? await usersMigrationDb().findOne({ _id: demande.user_id }) : null;
  const envoye = await envoyer(
    config.brevo.templatesDemandesActivation.invitezCollaborateurs,
    demande.email,
    { NOM_CFA: await nomCfa(demande), PRENOM: admin?.prenom ?? "", NOM: admin?.nom ?? "", LIEN_INVITER: lienInviter() },
    demande
  );
  if (!envoye) {
    await demandesActivationCfaDb().updateOne(
      { _id: demande._id },
      { $set: { invitez_queued_at: null, invitez_sent_at: null, updated_at: new Date() } }
    );
  }
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
    if (invitation && (!invitation.expires_at || invitation.expires_at > maintenant)) continue;
    if (await getUserByEmailIgnoringCase(demande.email)) continue;
    await demandesActivationCfaDb().updateOne(
      { _id: demande._id, statut: "envoyee" },
      {
        $set: invitation
          ? { statut: "invitation_expiree", updated_at: maintenant }
          : { statut: "echec", motif_echec: "Invitation annulée : à renvoyer", updated_at: maintenant },
      }
    );
  }
}

async function relancerAdminsSansCompte(maintenant: Date) {
  const templateId = config.brevo.templatesDemandesActivation.relanceSansCompte;
  const demandes = await demandesActivationCfaDb()
    .find({
      statut: "envoyee",
      branche_envoyee: "activation",
      envoyee_at: { $lte: new Date(maintenant.getTime() - 7 * JOUR) },
      relance_sans_compte_at: null,
    })
    .toArray();
  for (const demande of demandes) {
    if (await getUserByEmailIgnoringCase(demande.email)) continue;
    const invitation = demande.invitation_id ? await invitationsDb().findOne({ _id: demande.invitation_id }) : null;
    const expiresAt = invitation?.expires_at;
    if (!invitation || !expiresAt || expiresAt <= maintenant) continue;
    await relancer(
      templateId,
      verrouDemande(demande, "relance_sans_compte_at"),
      demande.email,
      async () => ({
        NOM_CFA: await nomCfa(demande),
        LIEN_INSCRIPTION: lienInscriptionCfa(invitation.token),
        DATE_EXPIRATION: format(expiresAt, "dd/MM/yyyy"),
      }),
      demande
    );
  }
}

async function renvoyerValidationEmail(maintenant: Date) {
  const demandes = await demandesActivationCfaDb()
    .find({ statut: "envoyee", branche_envoyee: "activation", relance_validation_email_at: null })
    .toArray();
  for (const demande of demandes) {
    const compte = await getUserByEmailIgnoringCase(demande.email);
    if (
      compte?.account_status !== "PENDING_EMAIL_VALIDATION" ||
      !demande.organisation_id ||
      !compte.organisation_id.equals(demande.organisation_id) ||
      !compte.created_at ||
      compte.created_at > new Date(maintenant.getTime() - 2 * JOUR)
    ) {
      continue;
    }
    await sousVerrou(verrouDemande(demande, "relance_validation_email_at"), () => renvoyerValidation(compte, demande));
  }
}

const connecteDepuis = (compte: Pick<IUsersMigration, "connection_history" | "last_connection">, depuis: Date) =>
  [...(compte.connection_history ?? []), ...(compte.last_connection ? [compte.last_connection] : [])].some(
    (date) => date > depuis
  );

async function relancerAdminsAvecCompte(maintenant: Date) {
  const templateId = config.brevo.templatesDemandesActivation.relanceAvecCompte;
  const demandes = await demandesActivationCfaDb()
    .find({
      statut: "envoyee",
      branche_envoyee: "compte_existant",
      envoyee_at: { $lte: new Date(maintenant.getTime() - 7 * JOUR) },
      relance_avec_compte_at: null,
    })
    .toArray();
  for (const demande of demandes) {
    const compte = await getUserByEmailIgnoringCase(demande.email);
    if (!compte || !demande.envoyee_at || connecteDepuis(compte, demande.envoyee_at)) continue;
    await relancer(
      templateId,
      verrouDemande(demande, "relance_avec_compte_at"),
      demande.email,
      async () => paramsActivationAvecCompte(await nomCfa(demande), compte),
      demande
    );
  }
}

async function relancerAdminsSansInvitation(maintenant: Date) {
  const templateId = config.brevo.templatesDemandesActivation.relanceSansInvitation;
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
    if (invitations > 0) continue;
    await relancer(
      templateId,
      verrouDemande(demande, "relance_sans_invitation_at"),
      demande.email,
      async () => {
        const admin = await usersMigrationDb().findOne({ _id: demande.user_id ?? undefined });
        return {
          NOM_CFA: await nomCfa(demande),
          PRENOM: admin?.prenom ?? "",
          NOM: admin?.nom ?? "",
          LIEN_INVITER: lienInviter(),
        };
      },
      demande
    );
  }
}

async function demandesDesAdmins() {
  return demandesActivationCfaDb()
    .find({ ...DEMANDES_ACTIVEES, user_id: { $ne: null }, envoyee_at: { $ne: null } })
    .toArray();
}

async function relancerInvitationsEnAttente(maintenant: Date, demandes: IDemandeActivationCfa[]) {
  const templateId = config.brevo.templatesDemandesActivation.relanceInvitationEnAttente;
  for (const demande of demandes) {
    const invitations = await invitationsDb()
      .find({
        author_id: demande.user_id ?? undefined,
        created_at: { $gte: demande.envoyee_at ?? maintenant, $lte: new Date(maintenant.getTime() - 48 * HEURE) },
        $or: [{ expires_at: { $exists: false } }, { expires_at: { $gt: maintenant } }],
        relance_admin_at: { $exists: false },
      })
      .toArray();
    for (const invitation of invitations) {
      const verrou: Verrou = {
        poser: async () =>
          (
            await invitationsDb().updateOne(
              { _id: invitation._id, relance_admin_at: { $exists: false } },
              { $set: { relance_admin_at: maintenant } }
            )
          ).modifiedCount === 1,
        lever: () => invitationsDb().updateOne({ _id: invitation._id }, { $unset: { relance_admin_at: "" } }),
      };
      await relancer(
        templateId,
        verrou,
        demande.email,
        async () => {
          const admin = await usersMigrationDb().findOne({ _id: invitation.author_id });
          return { NOM_CFA: await nomCfa(demande), PRENOM: admin?.prenom ?? "", EMAIL_INVITE: invitation.email };
        },
        demande
      );
    }
  }
}

async function accueillirCollaborateurs(maintenant: Date, demandes: IDemandeActivationCfa[]) {
  const templateId = config.brevo.templatesDemandesActivation.onboardingCollaborateur;
  for (const demande of demandes) {
    const archives = await invitationsArchiveDb()
      .find({ author_id: demande.user_id ?? undefined, created_at: { $gte: demande.envoyee_at ?? maintenant } })
      .toArray();
    for (const archive of archives) {
      const collaborateur = await usersMigrationDb().findOne({
        email: archive.email,
        organisation_id: archive.organisation_id,
        onboarding_collaborateur_at: { $exists: false },
      });
      const premiereConnexion = collaborateur?.connection_history?.[0] ?? collaborateur?.last_connection;
      if (!collaborateur || !premiereConnexion) continue;
      if (premiereConnexion > new Date(maintenant.getTime() - JOUR)) continue;
      if (premiereConnexion < new Date(maintenant.getTime() - 3 * JOUR)) continue;
      const verrou: Verrou = {
        poser: async () =>
          (
            await usersMigrationDb().updateOne(
              { _id: collaborateur._id, onboarding_collaborateur_at: { $exists: false } },
              { $set: { onboarding_collaborateur_at: maintenant } }
            )
          ).modifiedCount === 1,
        lever: () =>
          usersMigrationDb().updateOne({ _id: collaborateur._id }, { $unset: { onboarding_collaborateur_at: "" } }),
      };
      await relancer(
        templateId,
        verrou,
        collaborateur.email,
        async () => ({ NOM_CFA: await nomCfa(demande), PRENOM: collaborateur.prenom ?? "" }),
        demande
      );
    }
  }
}

export async function relancerDemandesActivation(maintenant = new Date()) {
  await debloquerEnvois(maintenant);
  await marquerInvitationsExpirees(maintenant);
  await relancerAdminsSansCompte(maintenant);
  await renvoyerValidationEmail(maintenant);
  await relancerAdminsAvecCompte(maintenant);
  await relancerAdminsSansInvitation(maintenant);
  const demandes = await demandesDesAdmins();
  await relancerInvitationsEnAttente(maintenant, demandes);
  await accueillirCollaborateurs(maintenant, demandes);
}
