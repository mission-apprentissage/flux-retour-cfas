import { ObjectId } from "bson";
import type { IOrganisationOrganismeFormation } from "shared/models/data/organisations.model";

import {
  updateMissionLocaleEffectifComputedCollab,
  updateMissionLocaleEffectifComputedOrganisme,
} from "@/common/actions/admin/mission-locale/mission-locale.admin.actions";
import { missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";

const PARTHENAY_DOUBLON_ORGANISATION_ID = new ObjectId("68e69fc89c04f0a8e7505868");

export const up = async () => {
  const organisations = (await organisationsDb()
    .find(
      { type: "ORGANISME_FORMATION", ml_beta_activated_at: { $ne: null }, organisme_id: { $ne: null } },
      { projection: { _id: 1, organisme_id: 1, ml_beta_activated_at: 1 } }
    )
    .toArray()) as Array<Pick<IOrganisationOrganismeFormation, "_id" | "organisme_id" | "ml_beta_activated_at">>;

  let organismesCount = 0;
  let dossiersCount = 0;

  for (const organisation of organisations) {
    if (!organisation.organisme_id || !organisation.ml_beta_activated_at) continue;
    const organismeId = new ObjectId(organisation.organisme_id);

    const organisme = await organismesDb().findOne(
      { _id: organismeId, is_allowed_collab: { $ne: true } },
      { projection: { _id: 1 } }
    );
    if (!organisme) continue;

    const dossiers = await missionLocaleEffectifsDb().countDocuments({ "effectif_snapshot.organisme_id": organismeId });
    if (dossiers === 0) continue;

    await organismesDb().updateOne({ _id: organismeId }, { $set: { is_allowed_collab: true } });
    await updateMissionLocaleEffectifComputedCollab(organismeId, true);
    await updateMissionLocaleEffectifComputedOrganisme(organisation.ml_beta_activated_at, organismeId);

    organismesCount++;
    dossiersCount += dossiers;
  }

  const { modifiedCount } = await organisationsDb().updateOne(
    { _id: PARTHENAY_DOUBLON_ORGANISATION_ID, type: "ORGANISME_FORMATION" },
    { $unset: { ml_beta_activated_at: "" } }
  );

  console.log(
    `Collab ON rétro-posé sur ${organismesCount} organisme(s), ${dossiersCount} dossier(s) ML dénormalisé(s), doublon Parthenay ${modifiedCount ? "nettoyé" : "absent"}`
  );
};
