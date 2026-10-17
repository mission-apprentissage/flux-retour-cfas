import Boom from "boom";
import { ObjectId } from "bson";
import type { ICfaFiche, ICfaFicheContactReferent, ICfaMembre } from "shared/models/data/nationalStats.model";

import { batchInviteUsersToOrganisation, createOrganisation } from "@/common/actions/organisations.actions";
import {
  invitationsDb,
  missionLocaleCfaInvitationsDb,
  missionLocaleEffectifsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import type { AuthContext } from "@/common/model/internal/AuthContext";

/** L'organisation d'un CFA est rattachée tantôt par `organisme_id`, tantôt par SIRET + UAI : le rattachement direct prime. */
export async function findCfaOrganisation(organisme: { _id: ObjectId; siret: string; uai?: string | null }) {
  return (
    (await organisationsDb().findOne({ type: "ORGANISME_FORMATION", organisme_id: organisme._id.toString() })) ??
    organisationsDb().findOne({ type: "ORGANISME_FORMATION", siret: organisme.siret, uai: organisme.uai ?? null })
  );
}

async function getComptes(organisationId: ObjectId | undefined) {
  if (!organisationId) return { derniereConnexion: null, referent: null };
  const [connexion, referent] = await Promise.all([
    usersMigrationDb()
      .find(
        { organisation_id: organisationId, account_status: "CONFIRMED", last_connection: { $exists: true } },
        { projection: { last_connection: 1 }, sort: { last_connection: -1 }, limit: 1 }
      )
      .next(),
    usersMigrationDb().findOne(
      { organisation_id: organisationId, account_status: "CONFIRMED" },
      {
        sort: { created_at: 1 },
        projection: { civility: 1, nom: 1, prenom: 1, fonction: 1, telephone: 1, email: 1 },
      }
    ),
  ]);
  const contact: ICfaFicheContactReferent | null = referent
    ? {
        civility: referent.civility ?? null,
        nom: referent.nom ?? null,
        prenom: referent.prenom ?? null,
        fonction: referent.fonction ?? null,
        telephone: referent.telephone ?? null,
        email: referent.email ?? null,
      }
    : null;
  return { derniereConnexion: connexion?.last_connection ?? null, referent: contact };
}

export async function getCfaFiche(
  organismeId: ObjectId,
  { nominatif }: { nominatif: boolean },
  now: Date = new Date()
): Promise<ICfaFiche> {
  const organisme = await organismesDb().findOne({ _id: organismeId });
  if (!organisme) throw Boom.notFound("Organisme introuvable");

  const organisation = await findCfaOrganisation(organisme);
  const [comptes, invitations, collaborations] = await Promise.all([
    getComptes(organisation?._id),
    missionLocaleCfaInvitationsDb().countDocuments({ organisme_id: organismeId }),
    missionLocaleEffectifsDb().countDocuments(
      {
        "effectif_snapshot.organisme_id": organismeId,
        "organisme_data.acc_conjoint": true,
        "organisme_data.acc_conjoint_at": { $lte: now },
        soft_deleted: { $ne: true },
      },
      { limit: 1 }
    ),
  ]);

  const hasAccount = organisme.has_account === true;
  const erps = (organisme.erps ?? []).filter((erp): erp is string => Boolean(erp));

  return {
    id: organismeId.toString(),
    nom: (organisme.enseigne || organisme.raison_sociale || organisme.nom)?.trim() || null,
    raison_sociale: organisme.raison_sociale?.trim() || null,
    uai: organisme.uai ?? null,
    siret: organisme.siret,
    nature: organisme.nature ?? null,
    qualiopi: organisme.qualiopi === true,
    ferme: organisme.ferme === true,
    adresse: {
      complete: organisme.adresse?.complete ?? null,
      code_postal: organisme.adresse?.code_postal ?? null,
      commune: organisme.adresse?.commune ?? null,
    },
    // Les courriels du référentiel sont parfois personnels : traités comme des données nominatives.
    courriels_referentiel: nominatif
      ? ([
          ...new Set((organisme.contacts_from_referentiel ?? []).map((contact) => contact.email).filter(Boolean)),
        ] as string[])
      : [],
    source_donnees: {
      deca: Boolean(organisme.last_effectifs_deca_update) || organisme.is_transmission_target === false,
      erps: organisme.mode_de_transmission === "MANUEL" ? [] : erps,
      fichier: organisme.mode_de_transmission === "MANUEL",
      erreurs_transmission: organisme.has_transmission_errors === true,
    },
    has_account: hasAccount,
    collabore: collaborations > 0,
    derniere_connexion_at: comptes.derniereConnexion,
    alertes: !hasAccount && invitations > 0 ? [{ type: "invitations_sans_compte", valeur: invitations }] : [],
    peut_voir_nominatif: nominatif,
    contact_referent: nominatif ? comptes.referent : null,
  };
}

export async function getCfaMembres(organismeId: ObjectId, now: Date = new Date()): Promise<ICfaMembre[]> {
  const organisme = await organismesDb().findOne({ _id: organismeId }, { projection: { siret: 1, uai: 1 } });
  if (!organisme) throw Boom.notFound("Organisme introuvable");
  const organisation = await findCfaOrganisation(organisme);
  if (!organisation) return [];

  const [utilisateurs, invitations] = await Promise.all([
    usersMigrationDb()
      .find({ organisation_id: organisation._id, account_status: "CONFIRMED" }, { sort: { created_at: 1 } })
      .toArray(),
    invitationsDb()
      .find({ organisation_id: organisation._id }, { projection: { token: 0 }, sort: { created_at: 1 } })
      .toArray(),
  ]);

  return [
    ...utilisateurs.map(
      (user): ICfaMembre => ({
        type: "utilisateur",
        id: user._id.toString(),
        civility: user.civility ?? null,
        nom: user.nom ?? null,
        prenom: user.prenom ?? null,
        telephone: user.telephone ?? null,
        email: user.email,
        fonction: user.fonction ?? null,
        role: user.organisation_role ?? null,
        derniere_activite_at: user.last_connection ?? null,
        activation_at: user.confirmed_at ?? user.created_at ?? null,
        invitation_statut: null,
      })
    ),
    ...invitations.map(
      (invitation): ICfaMembre => ({
        type: "invitation",
        id: invitation._id.toString(),
        civility: null,
        nom: invitation.nom ?? null,
        prenom: invitation.prenom ?? null,
        telephone: null,
        email: invitation.email,
        fonction: null,
        role: invitation.role ?? null,
        derniere_activite_at: null,
        activation_at: null,
        invitation_statut: invitation.expires_at && invitation.expires_at < now ? "expiree" : "envoyee",
      })
    ),
  ];
}

export async function inviteCfaMembres(
  ctx: AuthContext,
  organismeId: ObjectId,
  emails: string[],
  roles?: Array<"admin" | "member">
) {
  const organisme = await organismesDb().findOne({ _id: organismeId }, { projection: { siret: 1, uai: 1 } });
  if (!organisme) throw Boom.notFound("Organisme introuvable");

  const existante = await findCfaOrganisation(organisme);
  const organisationId =
    existante?._id ??
    (await createOrganisation({
      type: "ORGANISME_FORMATION",
      siret: organisme.siret,
      uai: organisme.uai ?? null,
      organisme_id: organismeId.toString(),
    }));

  return batchInviteUsersToOrganisation(ctx, emails, organisationId, roles);
}
