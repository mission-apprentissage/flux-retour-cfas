import { ObjectId, WithId } from "mongodb";
import { IEffectifQueue } from "shared/models/data/effectifsQueue.model";

import { insertEffectifV2 } from "@/common/actions/v2/effectif.v2.actions";
import { insertFormationV2 } from "@/common/actions/v2/formation.v2.actions";
import { getPersonV2, insertPersonV2 } from "@/common/actions/v2/person.v2.actions";
import { insertTransmissionV2 } from "@/common/actions/v2/transmission.v2.actions";
import { effectifV2Db, formationV2Db, organismeV2Db } from "@/common/model/collections";

export const getOrCreateOrganisme = async (uai: string, siret: string) => {
  const organisme = await organismeV2Db().findOne({
    uai: uai,
    siret: siret,
  });

  if (!organisme) {
    const { insertedId } = await organismeV2Db().insertOne({
      _id: new ObjectId(),
      draft: true,
      created_at: new Date(),
      updated_at: new Date(),
      uai: uai,
      siret: siret,
    });

    return insertedId;
  }

  return organisme._id;
};

export const getOrCreateFormation = async (
  cfd: string,
  rncp: string,
  organisme_responsable_id: ObjectId,
  organisme_formateur_id: ObjectId
) => {
  const formation = await formationV2Db().findOne({
    cfd: cfd,
    rncp: rncp,
    organisme_responsable_id,
    organisme_formateur_id,
  });

  if (!formation) {
    const { insertedId } = await insertFormationV2(cfd, rncp, organisme_responsable_id, organisme_formateur_id);
    return insertedId;
  }

  return formation._id;
};

export const getOrCreatePerson = async (nom: string, prenom: string, date_de_naissance: Date) => {
  const person = await getPersonV2(nom, prenom, date_de_naissance);

  if (!person) {
    const { insertedId } = await insertPersonV2(nom, prenom, date_de_naissance);

    return insertedId;
  }
  return person._id;
};

export const getOrCreateEffectif = async (
  formation_id: ObjectId,
  nom: string,
  prenom: string,
  date_de_naissance: Date /*or string to not become crazy with timezones ? */
) => {
  const effectif = await effectifV2Db().findOne({
    formation_id: formation_id,
    "_computed.nom": nom,
    "_computed.prenom": prenom,
    "_computed.date_de_naissance": date_de_naissance,
  });

  if (!effectif) {
    const personId = await getOrCreatePerson(nom, prenom, date_de_naissance);
    const { insertedId } = await insertEffectifV2(formation_id, personId);

    return insertedId;
  }

  return effectif._id;
};

export const handleEffectifTransmission = async (effectifQueue: WithId<IEffectifQueue>) => {
  // 1. Récupération de l'organisme
  try {
    const { etablissement_formateur_siret, etablissement_formateur_uai } = effectifQueue;
    const { etablissement_responsable_siret, etablissement_responsable_uai } = effectifQueue;

    const organismeFormateurId = await getOrCreateOrganisme(etablissement_formateur_uai, etablissement_formateur_siret);
    const organismeResponsableId = await getOrCreateOrganisme(
      etablissement_responsable_uai,
      etablissement_responsable_siret
    );

    // 2. Récupération de la formation
    const { formation_cfd, formation_rncp } = effectifQueue;
    const formationId = await getOrCreateFormation(
      formation_cfd,
      formation_rncp,
      organismeResponsableId,
      organismeFormateurId
    );

    // 3. Insertion de l'effectif

    await getOrCreateEffectif(
      formationId,
      effectifQueue.nom_apprenant,
      effectifQueue.prenom_apprenant,
      effectifQueue.date_de_naissance_apprenant
    );

    await insertTransmissionV2(effectifQueue.source_organisme_id, formationId);
  } catch (e) {
    console.log(e);
  }
};
