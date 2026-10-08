import Boom from "boom";
import { ObjectId } from "bson";
import type { ICfaFiche, ICfaFicheContactReferent } from "shared/models/data/nationalStats.model";

import {
  missionLocaleCfaInvitationsDb,
  missionLocaleEffectifsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";

/** L'organisation d'un CFA est rattachée tantôt par `organisme_id`, tantôt par SIRET + UAI selon les parcours. */
export async function findCfaOrganisation(organisme: { _id: ObjectId; siret: string; uai?: string | null }) {
  return organisationsDb().findOne({
    type: "ORGANISME_FORMATION",
    $or: [{ organisme_id: organisme._id.toString() }, { siret: organisme.siret, uai: organisme.uai ?? null }],
  });
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
      derniere_transmission_at: organisme.last_erp_transmission_date ?? organisme.last_transmission_date ?? null,
      derniere_maj_deca_at: organisme.last_effectifs_deca_update ?? null,
    },
    has_account: hasAccount,
    collabore: collaborations > 0,
    derniere_connexion_at: comptes.derniereConnexion,
    alertes: !hasAccount && invitations > 0 ? [{ type: "invitations_sans_compte", valeur: invitations }] : [],
    peut_voir_nominatif: nominatif,
    contact_referent: nominatif ? comptes.referent : null,
  };
}
