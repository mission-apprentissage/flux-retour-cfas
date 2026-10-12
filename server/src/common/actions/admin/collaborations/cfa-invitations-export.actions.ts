import type { ObjectId } from "bson";
import type { IOrganisationMissionLocale, IOrganisationOrganismeFormation } from "shared/models";
import type {
  ICfaInvitationExportRow,
  ICfaInvitationsExportResponse,
} from "shared/models/routes/admin/cfa-invitations-export.api";

import {
  missionLocaleCfaInvitationsDb,
  missionLocaleEffectifsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";

import { formatRegion } from "./collaboration-export.actions";

type Invitation = { created_at: Date; mission_locale_id: ObjectId; organisme_id: ObjectId; siret: string };
type MissionLocale = { nom: string | null; region: string };
type Organisme = { nom: string | null; region: string };
type Compte = { created_at: Date | null; last_connection: Date | null; connection_history: Date[] };
type Collaboration = { date: Date; email: string | null };

type Contexte = {
  missionsLocales: Map<string, MissionLocale>;
  organismes: Map<string, Organisme>;
  comptesByOrganisme: Map<string, Compte[]>;
  collaborationsByOrganisme: Map<string, Collaboration[]>;
};

function uniqueIds(ids: ObjectId[]): ObjectId[] {
  return [...new Map(ids.map((id) => [id.toString(), id])).values()];
}

function minDate(dates: Date[]): Date | null {
  return dates.reduce<Date | null>((min, date) => (min === null || date < min ? date : min), null);
}

function maxDate(dates: Date[]): Date | null {
  return dates.reduce<Date | null>((max, date) => (max === null || date > max ? date : max), null);
}

function pushTo<T>(map: Map<string, T[]>, key: string, value: T) {
  const values = map.get(key);
  if (values) values.push(value);
  else map.set(key, [value]);
}

async function fetchMissionsLocales(mlIds: ObjectId[]): Promise<Map<string, MissionLocale>> {
  const mls = await organisationsDb()
    .find<Pick<IOrganisationMissionLocale, "_id" | "nom" | "adresse">>(
      { _id: { $in: mlIds } },
      { projection: { nom: 1, "adresse.region": 1 } }
    )
    .toArray();
  return new Map(
    mls.map((ml) => [ml._id.toString(), { nom: ml.nom ?? null, region: formatRegion(ml.adresse?.region) }])
  );
}

async function fetchOrganismes(organismeIds: ObjectId[]): Promise<Map<string, Organisme>> {
  const organismes = await organismesDb()
    .find(
      { _id: { $in: organismeIds } },
      { projection: { nom: 1, raison_sociale: 1, enseigne: 1, "adresse.region": 1 } }
    )
    .toArray();
  return new Map(
    organismes.map((organisme) => [
      organisme._id.toString(),
      {
        nom: organisme.nom ?? organisme.raison_sociale ?? organisme.enseigne ?? null,
        region: formatRegion(organisme.adresse?.region),
      },
    ])
  );
}

async function fetchComptesByOrganisme(organismeIds: ObjectId[], depuis: Date): Promise<Map<string, Compte[]>> {
  const organisations = await organisationsDb()
    .find<Pick<IOrganisationOrganismeFormation, "_id" | "organisme_id">>(
      { type: "ORGANISME_FORMATION", organisme_id: { $in: organismeIds.map(String) } },
      { projection: { organisme_id: 1 } }
    )
    .toArray();
  const organismeIdByOrganisationId = new Map(
    organisations.flatMap((organisation) =>
      organisation.organisme_id ? [[organisation._id.toString(), organisation.organisme_id] as const] : []
    )
  );
  if (organismeIdByOrganisationId.size === 0) return new Map();

  const users = await usersMigrationDb()
    .aggregate<{ organisation_id: ObjectId; created_at?: Date; last_connection?: Date; connection_history: Date[] }>([
      { $match: { organisation_id: { $in: organisations.map((organisation) => organisation._id) } } },
      {
        $project: {
          organisation_id: 1,
          created_at: 1,
          last_connection: 1,
          connection_history: {
            $filter: { input: { $ifNull: ["$connection_history", []] }, as: "date", cond: { $gt: ["$$date", depuis] } },
          },
        },
      },
    ])
    .toArray();

  const comptesByOrganisme = new Map<string, Compte[]>();
  for (const user of users) {
    const organismeId = organismeIdByOrganisationId.get(user.organisation_id.toString());
    if (!organismeId) continue;
    pushTo(comptesByOrganisme, organismeId, {
      created_at: user.created_at ?? null,
      last_connection: user.last_connection ?? null,
      connection_history: user.connection_history,
    });
  }
  return comptesByOrganisme;
}

async function fetchCollaborationsByOrganisme(organismeIds: ObjectId[]): Promise<Map<string, Collaboration[]>> {
  const dossiers = await missionLocaleEffectifsDb()
    .find(
      {
        "effectif_snapshot.organisme_id": { $in: organismeIds },
        "organisme_data.acc_conjoint": true,
        soft_deleted: { $ne: true },
      },
      {
        projection: {
          created_at: 1,
          "effectif_snapshot.organisme_id": 1,
          "organisme_data.acc_conjoint_at": 1,
          "organisme_data.reponse_at": 1,
          "organisme_data.acc_conjoint_by": 1,
        },
      }
    )
    .toArray();

  const auteurIds = uniqueIds(dossiers.flatMap((dossier) => dossier.organisme_data?.acc_conjoint_by ?? []));
  const auteurs = auteurIds.length
    ? await usersMigrationDb()
        .find({ _id: { $in: auteurIds } }, { projection: { email: 1, organisation_id: 1 } })
        .toArray()
    : [];
  const organisationsAdmin = auteurs.length
    ? await organisationsDb()
        .find(
          {
            _id: { $in: uniqueIds(auteurs.map((auteur) => auteur.organisation_id)) },
            type: "ADMINISTRATEUR",
          },
          { projection: { _id: 1 } }
        )
        .toArray()
    : [];
  const organisationAdminIds = new Set(organisationsAdmin.map((organisation) => organisation._id.toString()));
  const auteurById = new Map(
    auteurs.map((auteur) => [
      auteur._id.toString(),
      { email: auteur.email, admin: organisationAdminIds.has(auteur.organisation_id.toString()) },
    ])
  );

  const collaborationsByOrganisme = new Map<string, Collaboration[]>();
  for (const dossier of dossiers) {
    const organismeId = dossier.effectif_snapshot?.organisme_id;
    if (!organismeId) continue;
    const auteurId = dossier.organisme_data?.acc_conjoint_by;
    const auteur = auteurId ? auteurById.get(auteurId.toString()) : undefined;
    if (auteur?.admin) continue;
    pushTo(collaborationsByOrganisme, organismeId.toString(), {
      date: dossier.organisme_data?.acc_conjoint_at ?? dossier.organisme_data?.reponse_at ?? dossier.created_at,
      email: auteur?.email ?? null,
    });
  }
  return collaborationsByOrganisme;
}

function buildRow(invitation: Invitation, ctx: Contexte): ICfaInvitationExportRow {
  const depuis = invitation.created_at;
  const organismeId = invitation.organisme_id.toString();
  const missionLocale = ctx.missionsLocales.get(invitation.mission_locale_id.toString());
  const organisme = ctx.organismes.get(organismeId);
  const comptes = ctx.comptesByOrganisme.get(organismeId) ?? [];
  const collaborations = ctx.collaborationsByOrganisme.get(organismeId) ?? [];

  const premiereConnexionApres = minDate(
    comptes.flatMap((compte) => compte.connection_history.filter((date) => date > depuis))
  );
  const collaborationsApres = collaborations.filter((collaboration) => collaboration.date > depuis);
  const contacts = [...new Set(collaborationsApres.flatMap((collaboration) => collaboration.email ?? []))].sort();

  return {
    date_invitation: depuis,
    ml_nom: missionLocale?.nom ?? null,
    region_ml: missionLocale?.region ?? formatRegion(null),
    siret_cfa: invitation.siret,
    raison_sociale_cfa: organisme?.nom ?? null,
    region_cfa: organisme?.region ?? formatRegion(null),
    nb_nouveaux_comptes_apres_cfa: comptes.filter((compte) => compte.created_at && compte.created_at > depuis).length,
    date_derniere_connexion_cfa: maxDate(comptes.flatMap((compte) => compte.last_connection ?? [])),
    collab_apres_invitation_cfa: collaborationsApres.length > 0 ? "Oui" : "Non",
    contacts_cfa_qui_ont_collabore: contacts.join("; "),
    nb_collab_apres_invitation_cfa: collaborationsApres.length,
    date_premiere_collab_apres_cfa: minDate(collaborationsApres.map((collaboration) => collaboration.date)),
    date_derniere_collab_cfa: maxDate(collaborations.map((collaboration) => collaboration.date)),
    connexion_apres_invitation_cfa: premiereConnexionApres ? "Oui" : "Non",
    date_premiere_connexion_apres_invitation_cfa: premiereConnexionApres,
  };
}

export async function getCfaInvitationsExportData(): Promise<ICfaInvitationsExportResponse> {
  const invitations = await missionLocaleCfaInvitationsDb()
    .find<Invitation>(
      {},
      {
        projection: { _id: 0, created_at: 1, mission_locale_id: 1, organisme_id: 1, siret: 1 },
        sort: { created_at: -1 },
      }
    )
    .toArray();
  if (invitations.length === 0) return { invitations: [] };

  const organismeIds = uniqueIds(invitations.map((invitation) => invitation.organisme_id));
  const depuis = invitations[invitations.length - 1].created_at;

  const [missionsLocales, organismes, comptesByOrganisme, collaborationsByOrganisme] = await Promise.all([
    fetchMissionsLocales(uniqueIds(invitations.map((invitation) => invitation.mission_locale_id))),
    fetchOrganismes(organismeIds),
    fetchComptesByOrganisme(organismeIds, depuis),
    fetchCollaborationsByOrganisme(organismeIds),
  ]);

  const ctx: Contexte = { missionsLocales, organismes, comptesByOrganisme, collaborationsByOrganisme };
  return { invitations: invitations.map((invitation) => buildRow(invitation, ctx)) };
}
