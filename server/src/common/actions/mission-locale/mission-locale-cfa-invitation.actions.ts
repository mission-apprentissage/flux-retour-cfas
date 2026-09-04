import Boom from "boom";
import { ObjectId } from "mongodb";
import { IOrganisationMissionLocale } from "shared/models";
import { CFA_INVITATION_STATUT, ICfaToInvite } from "shared/models/routes/mission-locale/missionLocale.api";

import {
  invitationsDb,
  missionLocaleCfaInvitationsDb,
  missionLocaleEffectifsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { sendTransactionalEmail } from "@/common/services/brevo/brevo";
import { generateKey } from "@/common/utils/cryptoUtils";
import { getPublicUrl } from "@/common/utils/emailsUtils";
import { getCurrentTime } from "@/common/utils/timeUtils";
import config from "@/config";

import {
  getActiveMissionLocalesByRegions,
  getMlBetaActivationDatesByOrganismeIds,
  getOrganisationOrganismeByOrganismeId,
  INVITATION_EXPIRATION_MS,
} from "../organisations.actions";
import { checkActivationEligibility, findEligibleOrganismes } from "../organismes/deca-cfa-eligibility";

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
    contacts_from_referentiel?: Array<{ email?: string | null; confirmation_referentiel?: boolean | null }> | null;
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

/** Email de contact retenu pour un CFA : un email confirmé dans le référentiel en priorité, sinon le premier. */
function pickContactEmail(
  contacts?: Array<{ email?: string | null; confirmation_referentiel?: boolean | null }> | null
): string | null {
  const list = contacts ?? [];
  return list.find((c) => c?.confirmation_referentiel && c.email)?.email ?? list.find((c) => c?.email)?.email ?? null;
}

/**
 * Nom complet (« Prénom Nom ») des contacts CFA déjà présents dans usersMigration, indexés par email.
 * Permet de personnaliser la salutation de l'email quand le directeur a déjà un compte (ex. inscription en cours).
 */
async function getDestinataireNomsByEmail(emails: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const valides = [...new Set(emails.filter(Boolean))];
  if (valides.length === 0) {
    return map;
  }
  const users = (await usersMigrationDb()
    .find({ email: { $in: valides } }, { projection: { email: 1, prenom: 1, nom: 1 } })
    .toArray()) as Array<{ email: string; prenom?: string; nom?: string }>;

  for (const u of users) {
    const nomComplet = [u.prenom, u.nom].filter(Boolean).join(" ");
    if (nomComplet) {
      map.set(u.email, nomComplet);
    }
  }
  return map;
}

/**
 * Détermine le statut d'invitation d'un CFA pour le conseiller connecté.
 * Priorité : CFA actif > déjà invité par ce conseiller > invitable > bientôt disponible.
 */
export function computeCfaInvitationStatut(params: {
  mlBetaActivatedAt?: Date | null;
  invitedByMe: boolean;
  hasContactEmail: boolean;
  isEligible: boolean;
}): CFA_INVITATION_STATUT {
  if (params.mlBetaActivatedAt) {
    return CFA_INVITATION_STATUT.CFA_ACTIF;
  }
  if (params.invitedByMe) {
    return CFA_INVITATION_STATUT.INVITATION_ENVOYEE;
  }
  return params.hasContactEmail && params.isEligible
    ? CFA_INVITATION_STATUT.INVITER
    : CFA_INVITATION_STATUT.BIENTOT_DISPONIBLE;
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
            contacts_from_referentiel: "$organisme.contacts_from_referentiel",
          },
          invited_by_me: { $gt: [{ $size: "$_my_invitation" }, 0] },
        },
      },
    ])
    .toArray()) as CfaAggRow[];

  // CFA déjà invités par ce conseiller (journal durable) : on les affiche en permanence s'ils sont
  // désormais actifs, même s'ils ont quitté la liste-rupture (PRD : « CFA activé grâce à vous »).
  const myInvitedDocs = await missionLocaleCfaInvitationsDb()
    .find({ mission_locale_id: missionLocaleId, author_id: userId }, { projection: { organisme_id: 1 } })
    .toArray();
  const myInvitedOrganismeIds = new Set(myInvitedDocs.map((doc) => doc.organisme_id.toString()));

  // Activation « ml_beta » lue en direct sur les organisations (source vivante, et non le snapshot retardé)
  // pour tous les organismes concernés : liste-rupture ∪ invités par ce conseiller.
  const ruptureIds = new Set(ruptureRows.map((row) => row.organisme_id.toString()));
  const activatedAtByOrganismeId = await getMlBetaActivationDatesByOrganismeIds([
    ...ruptureIds,
    ...myInvitedOrganismeIds,
  ]);

  // CFA invités par ce conseiller, désormais actifs mais absents de la liste-rupture → rajoutés en CFA_ACTIF.
  const extraActiveInvitedIds = [...myInvitedOrganismeIds].filter(
    (id) => activatedAtByOrganismeId.has(id) && !ruptureIds.has(id)
  );
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
              contacts_from_referentiel: 1,
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

  const rows = [...ruptureRows, ...extraRows];

  // Ensemble des organismes éligibles techniquement à la collaboration. On restreint le calcul
  // aux organismes concernés (déjà connus via `rows`) au lieu de scanner toute la base.
  const eligibleIds = new Set(
    (await findEligibleOrganismes(rows.map((row) => row.organisme_id))).map((o) => o._id.toString())
  );

  // Missions Locales actives du territoire (par région du CFA) affichées dans l'email d'invitation.
  const mlNomsByRegion = await getMlNomsByRegion(rows.map((row) => row.organisme.adresse?.region ?? ""));

  // Nom des contacts CFA déjà présents dans usersMigration (via l'email de contact du référentiel).
  const destinataireNomsByEmail = await getDestinataireNomsByEmail(
    rows.map((row) => pickContactEmail(row.organisme.contacts_from_referentiel) ?? "")
  );

  return rows
    .map((row) => {
      const noms = mlNomsByRegion.get(row.organisme.adresse?.region ?? "") ?? [];
      const contactEmail = pickContactEmail(row.organisme.contacts_from_referentiel);
      return {
        organisme_id: row.organisme_id.toString(),
        siret: row.organisme.siret ?? null,
        uai: row.organisme.uai ?? null,
        nom: row.organisme.nom ?? row.organisme.raison_sociale ?? row.organisme.enseigne ?? null,
        adresse: formatAdresse(row.organisme.adresse),
        nb_jeunes_rupture: row.nb_jeunes_rupture,
        statut: computeCfaInvitationStatut({
          mlBetaActivatedAt: activatedAtByOrganismeId.get(row.organisme_id.toString()) ?? null,
          invitedByMe: row.invited_by_me,
          hasContactEmail: (row.organisme.contacts_from_referentiel ?? []).some((c) => Boolean(c?.email)),
          isEligible: eligibleIds.has(row.organisme_id.toString()),
        }),
        destinataire_nom: contactEmail ? (destinataireNomsByEmail.get(contactEmail) ?? null) : null,
        ml_partenaires: { count: noms.length, noms },
      };
    })
    .sort((a, b) => b.nb_jeunes_rupture - a.nb_jeunes_rupture || (a.nom ?? "").localeCompare(b.nom ?? ""));
}

/**
 * Envoie une invitation à un CFA au nom de la Mission Locale :
 * - crée une invitation `invitations` (token du parcours d'inscription CFA existant) ;
 * - journalise l'envoi dans `missionLocaleCfaInvitations` (trace durable, badge relatif au conseiller) ;
 * - envoie l'email transactionnel Brevo (variables peuplées par le code) avec le conseiller en copie.
 *
 * Aucune déduplication : plusieurs conseillers d'une même ML peuvent inviter le même CFA (PRD).
 */
export async function sendCfaInvitationFromMissionLocale(
  missionLocale: IOrganisationMissionLocale,
  user: AuthContext,
  organismeId: string,
  note?: string
): Promise<{ email_destinataire: string; organisme_nom: string }> {
  const organisme = await organismesDb().findOne({ _id: new ObjectId(organismeId) });
  if (!organisme) {
    throw Boom.notFound("CFA introuvable");
  }

  // Cohérence avec la liste : on vérifie les critères techniques d'éligibilité (hors "déjà actif",
  // qui correspond au statut CFA_ACTIF côté liste).
  const eligibility = await checkActivationEligibility(organismeId);
  const technicallyEligible =
    eligibility.checks.exists_with_siret_uai.passed &&
    eligibility.checks.nature.passed &&
    eligibility.checks.no_formateurs_tiers.passed &&
    eligibility.checks.has_effectifs.passed;
  if (!technicallyEligible) {
    throw Boom.badRequest("Ce CFA n'est pas encore éligible à l'invitation.");
  }

  // Email de contact du directeur : on privilégie un email confirmé dans le référentiel.
  const email_destinataire = pickContactEmail(organisme.contacts_from_referentiel);
  if (!email_destinataire) {
    throw Boom.badRequest("Aucun email de contact connu pour ce CFA.");
  }

  // Organisation ORGANISME_FORMATION (créée si elle n'existe pas encore).
  const organisation = await getOrganisationOrganismeByOrganismeId(organisme._id);
  if (!organisation) {
    throw Boom.internal("Impossible de créer l'organisation pour ce CFA");
  }

  const organismeNom = organisme.nom || organisme.enseigne || organisme.raison_sociale || "Organisme";

  // Missions Locales actives du territoire (même région que le CFA) listées dans l'email.
  const mlNoms = organisme.adresse?.region
    ? ((await getMlNomsByRegion([organisme.adresse.region])).get(organisme.adresse.region) ?? [])
    : [];

  // Nom du contact s'il a déjà un compte (usersMigration), pour personnaliser la salutation de l'email.
  const destinataireNom = (await getDestinataireNomsByEmail([email_destinataire])).get(email_destinataire) ?? "";

  // ID du template Brevo (variable d'environnement, varie selon l'environnement). Vérifié avant toute
  // écriture, pour échouer proprement si la configuration manque.
  const templateId = config.brevo.templateInvitationCfaId;
  if (!templateId) {
    throw Boom.internal("Template Brevo d'invitation CFA non configuré (MNA_TDB_BREVO_TEMPLATE_INVITATION_CFA_ID)");
  }

  // Token du parcours d'inscription CFA existant (réutilisé tel quel) : généré ici pour construire le
  // lien d'invitation, mais persisté seulement après confirmation de l'envoi (cf. plus bas).
  const invitationToken = generateKey(50, "hex");

  // Email transactionnel Brevo (template géré par l'UX, on ne fait que fournir les variables).
  // `sendTransactionalEmail` capture les erreurs Brevo et renvoie `undefined` en cas d'échec : on teste
  // donc la valeur de retour pour ne PAS journaliser (badge « Invitation envoyée ») un email jamais parti.
  const sent = await sendTransactionalEmail(
    email_destinataire,
    templateId,
    {
      NOM_CFA: organismeNom,
      NOM_MISSION_LOCALE: missionLocale.nom,
      PRENOM_CONSEILLER: user.prenom ?? "",
      NOM_CONSEILLER: user.nom ?? "",
      NOTE_RECOMMANDATION: note ?? "",
      LIEN_INVITATION: getPublicUrl(`/auth/inscription-cfa?invitationToken=${invitationToken}`),
      NB_ML_PARTENAIRES: mlNoms.length,
      NOMS_ML: mlNoms.join(", "),
      NOM_DESTINATAIRE: destinataireNom,
    },
    // Hors production, l'email part au conseiller/admin connecté (même en impersonation) plutôt qu'au CFA.
    { cc: user.email ? [user.email] : undefined, redirectRecipientInNonProdTo: user.email }
  );
  if (!sent) {
    throw Boom.badGateway("L'envoi de l'email d'invitation au CFA a échoué. Aucune invitation n'a été enregistrée.");
  }

  // L'email est parti : on persiste le token d'inscription (réutilisé par le parcours CFA existant)...
  await invitationsDb().insertOne({
    _id: new ObjectId(),
    organisation_id: organisation._id,
    email: email_destinataire,
    token: invitationToken,
    author_id: user._id,
    role: "admin",
    created_at: getCurrentTime(),
    expires_at: new Date(Date.now() + INVITATION_EXPIRATION_MS),
  });

  // ...puis la trace durable de la recommandation (pilote les badges, jamais supprimée).
  await missionLocaleCfaInvitationsDb().insertOne({
    _id: new ObjectId(),
    mission_locale_id: new ObjectId(missionLocale._id),
    author_id: user._id,
    organisme_id: organisme._id,
    organisation_id: organisation._id,
    siret: organisme.siret,
    uai: organisme.uai ?? null,
    email_destinataire,
    note: note ?? null,
    invitation_token: invitationToken,
    cc_email: user.email ?? null,
    created_at: getCurrentTime(),
  });

  return { email_destinataire, organisme_nom: organismeNom };
}
