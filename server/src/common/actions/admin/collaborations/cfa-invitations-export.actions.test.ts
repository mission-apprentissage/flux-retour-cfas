import { ObjectId } from "bson";
import type { IMissionLocaleEffectif, IOrganisation, IUsersMigration } from "shared/models";
import type { IMissionLocaleCfaInvitation } from "shared/models/data/missionLocaleCfaInvitations.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { describe, expect, it } from "vitest";

import {
  missionLocaleCfaInvitationsDb,
  missionLocaleEffectifsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { getCfaInvitationsExportData } from "./cfa-invitations-export.actions";

useMongo();

let siretCounter = 10000000000000;

const insertOrganisme = async (overrides: Partial<IOrganisme> = {}) => {
  const _id = new ObjectId();
  await organismesDb().insertOne(
    {
      _id,
      siret: `${++siretCounter}`,
      nom: "CFA Test",
      adresse: { region: "53" },
      ...overrides,
    } as IOrganisme,
    { bypassDocumentValidation: true }
  );
  return _id;
};

const insertOrganisation = async (fields: Record<string, unknown>) => {
  const _id = new ObjectId();
  await organisationsDb().insertOne({ _id, created_at: new Date(), ...fields } as unknown as IOrganisation, {
    bypassDocumentValidation: true,
  });
  return _id;
};

const insertMissionLocale = (nom: string, region: string) =>
  insertOrganisation({ type: "MISSION_LOCALE", nom, adresse: { region } });

const insertOrganisationCfa = (organismeId: ObjectId) =>
  insertOrganisation({ type: "ORGANISME_FORMATION", organisme_id: organismeId.toString() });

const insertUser = async (
  organisationId: ObjectId,
  fields: {
    email?: string;
    created_at?: Date;
    connections?: Date[];
    account_status?: IUsersMigration["account_status"];
  } = {}
) => {
  const _id = new ObjectId();
  const connections = fields.connections ?? [];
  await usersMigrationDb().insertOne(
    {
      _id,
      email: fields.email ?? `${_id.toString()}@cfa.local`,
      organisation_id: organisationId,
      account_status: fields.account_status ?? "CONFIRMED",
      created_at: fields.created_at ?? new Date("2025-01-01"),
      connection_history: connections,
      ...(connections.length ? { last_connection: connections[connections.length - 1] } : {}),
    } as IUsersMigration,
    { bypassDocumentValidation: true }
  );
  return _id;
};

const insertInvitation = async (
  organismeId: ObjectId,
  missionLocaleId: ObjectId,
  createdAt: Date,
  siret = "00000000000001"
) => {
  await missionLocaleCfaInvitationsDb().insertOne({
    _id: new ObjectId(),
    mission_locale_id: missionLocaleId,
    author_id: new ObjectId(),
    organisme_id: organismeId,
    organisation_id: new ObjectId(),
    siret,
    uai: "0751234A",
    destinataires: [],
    created_at: createdAt,
  } as IMissionLocaleCfaInvitation);
};

const insertCollab = async (
  organismeId: ObjectId,
  fields: {
    acc_conjoint_at?: Date;
    reponse_at?: Date;
    acc_conjoint_by?: ObjectId;
    acc_conjoint?: boolean;
    soft_deleted?: boolean;
  }
) => {
  await missionLocaleEffectifsDb().insertOne(
    {
      _id: new ObjectId(),
      mission_locale_id: new ObjectId(),
      effectif_id: new ObjectId(),
      created_at: new Date("2025-01-01"),
      effectif_snapshot: { organisme_id: organismeId },
      organisme_data: {
        acc_conjoint: fields.acc_conjoint ?? true,
        acc_conjoint_at: fields.acc_conjoint_at,
        reponse_at: fields.reponse_at,
        acc_conjoint_by: fields.acc_conjoint_by,
        has_unread_notification: false,
      },
      ...(fields.soft_deleted ? { soft_deleted: true } : {}),
    } as unknown as IMissionLocaleEffectif,
    { bypassDocumentValidation: true }
  );
};

const INVITATION = new Date("2026-09-15T10:00:00Z");
const AVANT = new Date("2026-09-10T10:00:00Z");
const MEME_JOUR_AVANT = new Date("2026-09-15T08:00:00Z");

describe("getCfaInvitationsExportData", () => {
  it("renvoie une liste vide sans invitation", async () => {
    expect(await getCfaInvitationsExportData()).toEqual({ invitations: [] });
  });

  it("mesure comptes, connexions et collaborations après l'invitation", async () => {
    const ml = await insertMissionLocale("Mission Locale Nord", "32");
    const cfa = await insertOrganisme({ nom: "CFA Industrie", adresse: { region: "53" } as never });
    const organisation = await insertOrganisationCfa(cfa);
    const alice = await insertUser(organisation, {
      email: "alice@cfa.fr",
      connections: [AVANT, new Date("2026-09-20"), new Date("2026-09-28")],
    });
    const bob = await insertUser(organisation, {
      email: "bob@cfa.fr",
      created_at: new Date("2026-09-16"),
      account_status: "PENDING_ADMIN_VALIDATION",
      connections: [new Date("2026-09-18")],
    });
    await insertUser(organisation, { created_at: MEME_JOUR_AVANT });
    await insertInvitation(cfa, ml, INVITATION, "00000000000042");
    await insertCollab(cfa, { acc_conjoint_at: AVANT, acc_conjoint_by: alice });
    await insertCollab(cfa, { acc_conjoint_at: new Date("2026-09-30"), acc_conjoint_by: bob });
    await insertCollab(cfa, { acc_conjoint_at: new Date("2026-09-22"), acc_conjoint_by: alice });
    await insertCollab(cfa, { acc_conjoint_at: new Date("2026-09-25"), acc_conjoint_by: bob });

    const { invitations } = await getCfaInvitationsExportData();

    expect(invitations).toEqual([
      {
        date_invitation: INVITATION,
        ml_nom: "Mission Locale Nord",
        region_ml: "Hauts-de-France",
        siret_cfa: "00000000000042",
        raison_sociale_cfa: "CFA Industrie",
        region_cfa: "Bretagne",
        nb_nouveaux_comptes_apres_cfa: 1,
        date_derniere_connexion_cfa: new Date("2026-09-28"),
        collab_apres_invitation_cfa: "Oui",
        contacts_cfa_qui_ont_collabore: "alice@cfa.fr; bob@cfa.fr",
        nb_collab_apres_invitation_cfa: 3,
        date_premiere_collab_apres_cfa: new Date("2026-09-22"),
        date_derniere_collab_cfa: new Date("2026-09-30"),
        connexion_apres_invitation_cfa: "Oui",
        date_premiere_connexion_apres_invitation_cfa: new Date("2026-09-18"),
      },
    ]);
  });

  it("répond Non quand rien ne suit l'invitation, en gardant l'historique antérieur", async () => {
    const ml = await insertMissionLocale("Mission Locale Ouest", "52");
    const cfa = await insertOrganisme();
    const organisation = await insertOrganisationCfa(cfa);
    const alice = await insertUser(organisation, { connections: [AVANT, MEME_JOUR_AVANT] });
    await insertInvitation(cfa, ml, INVITATION);
    await insertCollab(cfa, { acc_conjoint_at: AVANT, acc_conjoint_by: alice });

    const [row] = (await getCfaInvitationsExportData()).invitations;

    expect(row).toMatchObject({
      nb_nouveaux_comptes_apres_cfa: 0,
      date_derniere_connexion_cfa: MEME_JOUR_AVANT,
      collab_apres_invitation_cfa: "Non",
      contacts_cfa_qui_ont_collabore: "",
      nb_collab_apres_invitation_cfa: 0,
      date_premiere_collab_apres_cfa: null,
      date_derniere_collab_cfa: AVANT,
      connexion_apres_invitation_cfa: "Non",
      date_premiere_connexion_apres_invitation_cfa: null,
    });
  });

  it("ignore les collaborations supprimées ou annulées et date par reponse_at à défaut d'acc_conjoint_at", async () => {
    const ml = await insertMissionLocale("Mission Locale Ouest", "52");
    const cfa = await insertOrganisme();
    await insertInvitation(cfa, ml, INVITATION);
    await insertCollab(cfa, { acc_conjoint_at: new Date("2026-09-20"), soft_deleted: true });
    await insertCollab(cfa, { acc_conjoint_at: new Date("2026-09-21"), acc_conjoint: false });
    await insertCollab(cfa, { reponse_at: new Date("2026-09-23") });

    const [row] = (await getCfaInvitationsExportData()).invitations;

    expect(row).toMatchObject({
      nb_collab_apres_invitation_cfa: 1,
      date_premiere_collab_apres_cfa: new Date("2026-09-23"),
      date_derniere_collab_cfa: new Date("2026-09-23"),
    });
  });

  it("exclut les collaborations envoyées par un admin et garde celles dont l'auteur a été supprimé", async () => {
    const ml = await insertMissionLocale("Mission Locale Ouest", "52");
    const cfa = await insertOrganisme();
    const admin = await insertUser(await insertOrganisation({ type: "ADMINISTRATEUR" }), { email: "admin@tba.fr" });
    await insertInvitation(cfa, ml, INVITATION);
    await insertCollab(cfa, { acc_conjoint_at: new Date("2026-09-30"), acc_conjoint_by: admin });
    await insertCollab(cfa, { acc_conjoint_at: new Date("2026-09-20"), acc_conjoint_by: new ObjectId() });

    const [row] = (await getCfaInvitationsExportData()).invitations;

    expect(row).toMatchObject({
      collab_apres_invitation_cfa: "Oui",
      contacts_cfa_qui_ont_collabore: "",
      nb_collab_apres_invitation_cfa: 1,
      date_premiere_collab_apres_cfa: new Date("2026-09-20"),
      date_derniere_collab_cfa: new Date("2026-09-20"),
    });
  });

  it("mesure chaque invitation d'un même CFA depuis sa propre date, la plus récente en premier", async () => {
    const mlNord = await insertMissionLocale("Mission Locale Nord", "32");
    const mlOuest = await insertMissionLocale("Mission Locale Ouest", "52");
    const cfa = await insertOrganisme();
    const organisation = await insertOrganisationCfa(cfa);
    await insertUser(organisation, { connections: [new Date("2026-09-20")] });
    await insertInvitation(cfa, mlNord, INVITATION);
    await insertInvitation(cfa, mlOuest, new Date("2026-09-25"));

    const { invitations } = await getCfaInvitationsExportData();

    expect(
      invitations.map(({ ml_nom, connexion_apres_invitation_cfa }) => ({ ml_nom, connexion_apres_invitation_cfa }))
    ).toEqual([
      { ml_nom: "Mission Locale Ouest", connexion_apres_invitation_cfa: "Non" },
      { ml_nom: "Mission Locale Nord", connexion_apres_invitation_cfa: "Oui" },
    ]);
  });

  it("fusionne les comptes des organisations portant le même organisme", async () => {
    const ml = await insertMissionLocale("Mission Locale Ouest", "52");
    const cfa = await insertOrganisme();
    await insertUser(await insertOrganisationCfa(cfa), { created_at: new Date("2026-09-16") });
    await insertUser(await insertOrganisationCfa(cfa), {
      created_at: new Date("2026-09-17"),
      connections: [new Date("2026-09-19")],
    });
    await insertInvitation(cfa, ml, INVITATION);

    const [row] = (await getCfaInvitationsExportData()).invitations;

    expect(row).toMatchObject({
      nb_nouveaux_comptes_apres_cfa: 2,
      connexion_apres_invitation_cfa: "Oui",
      date_premiere_connexion_apres_invitation_cfa: new Date("2026-09-19"),
    });
  });

  it("garde la ligne d'un organisme ou d'une ML disparus avec le SIRET de l'invitation", async () => {
    await insertInvitation(new ObjectId(), new ObjectId(), INVITATION, "00000000000099");

    const [row] = (await getCfaInvitationsExportData()).invitations;

    expect(row).toMatchObject({
      ml_nom: null,
      region_ml: "Non renseigné",
      siret_cfa: "00000000000099",
      raison_sociale_cfa: null,
      region_cfa: "Non renseigné",
      nb_nouveaux_comptes_apres_cfa: 0,
      date_derniere_connexion_cfa: null,
    });
  });
});
