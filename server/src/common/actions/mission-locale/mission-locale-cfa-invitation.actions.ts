import Boom from "boom";
import { ObjectId } from "mongodb";
import { IOrganisationMissionLocale } from "shared/models";
import { CFA_INVITATION_STATUT, ICfaToInvite } from "shared/models/routes/mission-locale/missionLocale.api";

import logger from "@/common/logger";
import { missionLocaleCfaInvitationsDb, missionLocaleEffectifsDb, organismesDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { sendTransactionalEmail } from "@/common/services/brevo/brevo";
import { getPublicUrl } from "@/common/utils/emailsUtils";
import { formatListeTronquee } from "@/common/utils/listUtils";
import { getCurrentTime } from "@/common/utils/timeUtils";
import config from "@/config";

import { getOrCreateConnexionInvitationsByEmails } from "../brevo/contacts/connexion-invitations.actions";
import { formatEmail } from "../brevo/contacts/formatters";
import { fetchRupturantsStatsByOrgId } from "../brevo/contacts/tba-contacts";
import { getActiveMissionLocalesByRegions, getCfaAccountsByOrganismeIds, ICfaAccounts } from "../organisations.actions";

import { missionLocaleBaseAggregation } from "./mission-locale.actions";

/**
 * Une ligne brute issue de l'agrégation : un CFA chez qui la ML a des jeunes en rupture.
 */
interface CfaAggRow {
  organisme_id: ObjectId;
  nb_jeunes_rupture: number;
  organisme: {
    siret?: string | null;
    uai?: string | null;
    nom?: string | null;
    raison_sociale?: string | null;
    enseigne?: string | null;
    adresse?: {
      complete?: string | null;
      code_postal?: string | null;
      commune?: string | null;
      region?: string | null;
    } | null;
    first_transmission_date?: Date | null;
  };
  invited_by_me: boolean;
}

const formatAdresse = (adresse?: CfaAggRow["organisme"]["adresse"]): string | null => {
  if (!adresse) return null;
  if (adresse.complete) return adresse.complete;
  const parts = [adresse.code_postal, adresse.commune].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
};

/**
 * Noms des Missions Locales actives par région (territoire du CFA), affichées dans l'email d'invitation.
 * Seules les ML déjà activées sur le Tableau de bord (`activated_at`) sont retenues.
 */
async function getMlNomsByRegion(regions: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  const mls = await getActiveMissionLocalesByRegions(regions);

  for (const ml of mls) {
    const region = ml.adresse?.region;
    if (!region || !ml.nom) {
      continue;
    }
    map.set(region, [...(map.get(region) ?? []), ml.nom]);
  }
  return map;
}

/**
 * Un CFA est invitable s'il transmet ses effectifs au Tableau de bord et si au moins une personne
 * y dispose d'un compte actif
 */
export function isCfaInvitable(
  organisme: { first_transmission_date?: Date | null },
  accounts?: Pick<ICfaAccounts, "destinataires">
): boolean {
  return Boolean(organisme.first_transmission_date) && (accounts?.destinataires.length ?? 0) > 0;
}

/**
 * Destinataires effectivement servis parmi les comptes du CFA. Hors production tous les emails sont
 * redirigés vers le testeur : on n'en garde qu'un, sinon il reçoit autant de copies identiques que
 * le CFA a de comptes.
 */
export function selectInvitationDestinataires(
  destinataires: ICfaAccounts["destinataires"]
): ICfaAccounts["destinataires"] {
  return config.env === "production" ? destinataires : destinataires.slice(0, 1);
}

/**
 * Détermine le statut d'invitation d'un CFA pour le conseiller connecté.
 * Priorité : CFA actif > déjà invité par ce conseiller > invitable.
 *
 * Tous les CFA remontés sont invitables par construction (cf. `isCfaInvitable`)
 */
export function computeCfaInvitationStatut(params: {
  mlBetaActivatedAt?: Date | null;
  invitedByMe: boolean;
}): CFA_INVITATION_STATUT {
  if (params.mlBetaActivatedAt) {
    return CFA_INVITATION_STATUT.CFA_ACTIF;
  }
  if (params.invitedByMe) {
    return CFA_INVITATION_STATUT.INVITATION_ENVOYEE;
  }
  return CFA_INVITATION_STATUT.INVITER;
}

/**
 * Liste des CFA du territoire d'une Mission Locale (ceux où des jeunes rattachés à cette ML
 * sont en rupture), triés par volume de jeunes décroissant, avec un statut d'invitation
 * relatif au conseiller connecté.
 *
 * Réutilise `missionLocaleBaseAggregation` pour que le décompte de jeunes en rupture soit
 * cohérent avec ce que la ML voit dans son tableau de bord.
 */
export async function getCfaListToInviteForMissionLocale(
  missionLocale: IOrganisationMissionLocale,
  userId: ObjectId
): Promise<ICfaToInvite[]> {
  const missionLocaleId = new ObjectId(missionLocale._id);

  const baseAggregation = await missionLocaleBaseAggregation(missionLocale);

  const ruptureRows = (await missionLocaleEffectifsDb()
    .aggregate([
      ...baseAggregation,
      {
        $group: {
          _id: "$effectif_snapshot.organisme_id",
          nb_jeunes_rupture: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "organismes",
          localField: "_id",
          foreignField: "_id",
          as: "organisme",
        },
      },
      { $unwind: { path: "$organisme", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "missionLocaleCfaInvitations",
          let: { orgId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$mission_locale_id", missionLocaleId] },
                    { $eq: ["$author_id", userId] },
                    { $eq: ["$organisme_id", "$$orgId"] },
                  ],
                },
              },
            },
            { $limit: 1 },
            { $project: { _id: 1 } },
          ],
          as: "_my_invitation",
        },
      },
      {
        $project: {
          _id: 0,
          organisme_id: "$_id",
          nb_jeunes_rupture: 1,
          organisme: {
            siret: "$organisme.siret",
            uai: "$organisme.uai",
            nom: "$organisme.nom",
            raison_sociale: "$organisme.raison_sociale",
            enseigne: "$organisme.enseigne",
            adresse: "$organisme.adresse",
            first_transmission_date: "$organisme.first_transmission_date",
          },
          invited_by_me: { $gt: [{ $size: "$_my_invitation" }, 0] },
        },
      },
    ])
    .toArray()) as CfaAggRow[];

  // CFA déjà invités par ce conseiller
  const myInvitedDocs = await missionLocaleCfaInvitationsDb()
    .find({ mission_locale_id: missionLocaleId, author_id: userId }, { projection: { organisme_id: 1 } })
    .toArray();
  const myInvitedOrganismeIds = new Set(myInvitedDocs.map((doc) => doc.organisme_id.toString()));

  const ruptureIds = new Set(ruptureRows.map((row) => row.organisme_id.toString()));
  const accountsByOrganismeId = await getCfaAccountsByOrganismeIds([...ruptureIds, ...myInvitedOrganismeIds]);
  const mlBetaActivatedAt = (organismeId: string) =>
    accountsByOrganismeId.get(organismeId)?.ml_beta_activated_at ?? null;

  // CFA invités par ce conseiller, désormais actifs mais absents de la liste-rupture → rajoutés en CFA_ACTIF.
  const extraActiveInvitedIds = [...myInvitedOrganismeIds].filter((id) => mlBetaActivatedAt(id) && !ruptureIds.has(id));
  const extraOrganismes = extraActiveInvitedIds.length
    ? await organismesDb()
        .find(
          { _id: { $in: extraActiveInvitedIds.map((id) => new ObjectId(id)) } },
          {
            projection: {
              siret: 1,
              uai: 1,
              nom: 1,
              raison_sociale: 1,
              enseigne: 1,
              adresse: 1,
              first_transmission_date: 1,
            },
          }
        )
        .toArray()
    : [];
  const extraRows: CfaAggRow[] = extraOrganismes.map((organisme) => ({
    organisme_id: organisme._id,
    nb_jeunes_rupture: 0,
    invited_by_me: true,
    organisme: organisme as unknown as CfaAggRow["organisme"],
  }));

  // Un CFA n'est proposé que s'il est invitable, ou s'il a déjà activé la collaboration — on garde
  // alors sa carte pour que le conseiller voie le résultat de son invitation.
  const rows = [...ruptureRows, ...extraRows].filter(
    (row) =>
      isCfaInvitable(row.organisme, accountsByOrganismeId.get(row.organisme_id.toString())) ||
      mlBetaActivatedAt(row.organisme_id.toString())
  );

  // Missions Locales actives du territoire (par région du CFA) affichées dans l'email d'invitation.
  const mlNomsByRegion = await getMlNomsByRegion(rows.map((row) => row.organisme.adresse?.region ?? ""));

  return rows
    .map((row) => {
      const noms = mlNomsByRegion.get(row.organisme.adresse?.region ?? "") ?? [];
      return {
        organisme_id: row.organisme_id.toString(),
        siret: row.organisme.siret ?? null,
        uai: row.organisme.uai ?? null,
        nom: row.organisme.nom ?? row.organisme.raison_sociale ?? row.organisme.enseigne ?? null,
        adresse: formatAdresse(row.organisme.adresse),
        nb_jeunes_rupture: row.nb_jeunes_rupture,
        statut: computeCfaInvitationStatut({
          mlBetaActivatedAt: mlBetaActivatedAt(row.organisme_id.toString()),
          invitedByMe: row.invited_by_me,
        }),
        nb_destinataires: accountsByOrganismeId.get(row.organisme_id.toString())?.destinataires.length ?? 0,
        ml_partenaires: { count: noms.length, noms },
      };
    })
    .sort((a, b) => b.nb_jeunes_rupture - a.nb_jeunes_rupture || (a.nom ?? "").localeCompare(b.nom ?? ""));
}

/**
 * Envoie une invitation à tous les comptes TBA d'un CFA au nom de la Mission Locale, puis journalise
 * l'envoi dans `missionLocaleCfaInvitations` (trace durable, badge relatif au conseiller).
 *
 * Un email par destinataire : la salutation et le lien de connexion sont personnalisés, et les
 * adresses des collègues ne sont pas exposées entre elles.
 *
 * Aucune déduplication : plusieurs conseillers d'une même ML peuvent inviter le même CFA (PRD).
 */
export async function sendCfaInvitationFromMissionLocale(
  missionLocale: IOrganisationMissionLocale,
  user: AuthContext,
  organismeId: string,
  note?: string
): Promise<{ nb_destinataires: number; organisme_nom: string }> {
  const organisme = await organismesDb().findOne({ _id: new ObjectId(organismeId) });
  if (!organisme) {
    throw Boom.notFound("CFA introuvable");
  }

  // Cohérence avec la liste : mêmes critères d'invitabilité que ceux qui décident de son affichage.
  const accounts = (await getCfaAccountsByOrganismeIds([organismeId])).get(organismeId);
  if (!accounts || !isCfaInvitable(organisme, accounts)) {
    throw Boom.badRequest(
      "Ce CFA ne peut pas être invité : il ne transmet pas ses effectifs ou n'a aucun compte actif."
    );
  }

  const organismeNom = organisme.nom || organisme.enseigne || organisme.raison_sociale || "Organisme";

  // Missions Locales actives du territoire (même région que le CFA) listées dans l'email.
  const mlNoms = organisme.adresse?.region
    ? ((await getMlNomsByRegion([organisme.adresse.region])).get(organisme.adresse.region) ?? [])
    : [];

  // Jeunes en rupture de l'établissement (toutes ML confondues)
  const nbJeunesEnRupture =
    (await fetchRupturantsStatsByOrgId([organisme._id])).get(String(organisme._id))?.nb_jeunes_rupture ?? 0;

  const templateId = config.brevo.templateInvitationCfaId;
  if (!templateId) {
    throw Boom.internal("Template Brevo d'invitation CFA non configuré (MNA_TDB_BREVO_TEMPLATE_INVITATION_CFA_ID)");
  }

  const destinataires = selectInvitationDestinataires(accounts.destinataires);

  // Lien de connexion personnalisé (le token pré-remplit l'email, il n'authentifie pas).
  const tokenByEmail = await getOrCreateConnexionInvitationsByEmails(
    destinataires.map((d) => d.email),
    { source: "invitation-ml" }
  );

  logger.info(
    { missionLocaleId: String(missionLocale._id), organismeId, nbDestinataires: destinataires.length },
    "Invitation CFA : envoi aux comptes de l'établissement"
  );

  // Séquentiel : jusqu'à une trentaine de comptes pour un seul clic.
  const envoyes: Array<{ user_id: ObjectId; email: string }> = [];
  for (const destinataire of destinataires) {
    const token = tokenByEmail.get(formatEmail(destinataire.email));
    const sent = await sendTransactionalEmail(
      destinataire.email,
      templateId,
      {
        NOM_CFA: organismeNom,
        NOM_MISSION_LOCALE: missionLocale.nom,
        PRENOM_CONSEILLER: user.prenom ?? "",
        NOM_CONSEILLER: user.nom ?? "",
        NOTE_RECOMMANDATION: note ?? "",
        LIEN_INVITATION: token
          ? getPublicUrl(`/auth/connexion?invitationToken=${token}`)
          : getPublicUrl("/auth/connexion"),
        NB_ML_PARTENAIRES: mlNoms.length,
        NOMS_ML: formatListeTronquee(mlNoms),
        NOM_DESTINATAIRE: destinataire.nom ?? "",
        CFA_NB_JEUNES_EN_RUPTURE: nbJeunesEnRupture,
      },
      {
        // Une seule copie au conseiller, sinon il reçoit autant de doubles que de destinataires.
        cc: envoyes.length === 0 && user.email ? [user.email] : undefined,
        // Hors production, l'email part au conseiller/admin connecté (même en impersonation).
        redirectRecipientInNonProdTo: user.email,
      }
    );
    if (sent) {
      envoyes.push({ user_id: destinataire.user_id, email: destinataire.email });
    }
  }

  if (envoyes.length === 0) {
    throw Boom.badGateway("L'envoi de l'email d'invitation au CFA a échoué. Aucune invitation n'a été enregistrée.");
  }

  await missionLocaleCfaInvitationsDb().insertOne({
    _id: new ObjectId(),
    mission_locale_id: new ObjectId(missionLocale._id),
    author_id: user._id,
    organisme_id: organisme._id,
    organisation_id: accounts.organisation_id,
    siret: organisme.siret,
    uai: organisme.uai ?? null,
    destinataires: envoyes,
    note: note ?? null,
    cc_email: user.email ?? null,
    created_at: getCurrentTime(),
  });

  return { nb_destinataires: envoyes.length, organisme_nom: organismeNom };
}
