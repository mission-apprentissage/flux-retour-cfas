import { captureException } from "@sentry/node";
import { WithId } from "mongodb";
import type { IEffectif, IEffectifV2, IOrganisme } from "shared/models";
import { IEffectifQueue } from "shared/models/data/effectifsQueue.model";
import dossierApprenantSchemaV3, { type IDossierApprenantSchemaV3 } from "shared/models/parts/dossierApprenantSchemaV3";

import { createMissionLocaleSnapshotV2 } from "@/common/actions/mission-locale/mission-locale.actions.v2";
import parentLogger from "@/common/logger";
import { effectifsDb, organismesDb } from "@/common/model/collections";

import { buildAdresse, type IIngestAdresseUsedFields } from "./adresse/adresse.builder";
import { ingestEffectifV2, type IIngestEffectifUsedFields } from "./effectif/effectif.ingestion";
import { ingestFormationV2, type IIngestFormationUsedFields } from "./formationV2/formationV2.ingestion";
import { ingestPersonV2, updateParcoursPersonV2, type IIngestPersonUsedFields } from "./person/person.ingestion";

const logger = parentLogger.child({
  module: "process-ingestion.v2",
});

async function ingestDossier(
  dossier: Pick<
    IDossierApprenantSchemaV3,
    IIngestFormationUsedFields | IIngestEffectifUsedFields | IIngestPersonUsedFields | IIngestAdresseUsedFields
  >,
  adresse: IEffectifV2["adresse"],
  date_transmission: Date
) {
  const [formation, person] = await Promise.all([ingestFormationV2(dossier), ingestPersonV2(dossier)]);

  const effectifV2 = await ingestEffectifV2({
    dossier,
    adresse,
    person_id: person._id,
    formation: formation,
    date_transmission,
  });
  await updateParcoursPersonV2(person._id, effectifV2);
  await createMissionLocaleSnapshotV2(effectifV2, person, formation);
  return effectifV2;
}

export async function handleEffectifTransmission(
  effectifQueue: WithId<IEffectifQueue>,
  date_transmission: Date
): Promise<IEffectifV2 | undefined> {
  try {
    const dossier = dossierApprenantSchemaV3.parse(effectifQueue);
    const adresse = await buildAdresse(dossier);
    const effectif = await ingestDossier(dossier, adresse, date_transmission);
    return effectif;
  } catch (e) {
    logger.error("Error while processing effectif transmission v2", e);
    captureException(e);
  }
}

function nullishToOptional<T>(v: T | null | undefined): T | undefined {
  return v ?? undefined;
}

async function migrateEffectif(effectif: IEffectif, organismeLookup: Map<string | null | undefined, IOrganisme>) {
  const reponsable = organismeLookup.get(effectif.organisme_responsable_id?.toHexString()) ?? null;
  const formateur = organismeLookup.get(effectif.organisme_id?.toHexString()) ?? null;

  // TODO: ==> 21 effectifs
  if (!formateur) {
    return;
  }

  // TODO ==> 916,623 effectifs
  if (!reponsable) {
    return;
  }

  // TODO ==> 916,491 effectifs
  if (
    !effectif.formation ||
    !effectif.formation?.date_inscription ||
    !effectif.formation?.date_entree ||
    !effectif.formation?.date_fin
  ) {
    return;
  }

  // TODO: ==> 557 effectifs
  if (!effectif.apprenant.date_de_naissance) {
    return;
  }

  const dossier: Pick<
    IDossierApprenantSchemaV3,
    IIngestFormationUsedFields | IIngestEffectifUsedFields | IIngestPersonUsedFields | IIngestAdresseUsedFields
  > = {
    formation_cfd: effectif._raw?.formation?.cfd ?? effectif.formation?.cfd ?? null,
    formation_rncp: nullishToOptional(effectif._raw?.formation?.rncp ?? effectif.formation?.rncp),
    etablissement_responsable_siret: reponsable.siret ?? null,
    etablissement_responsable_uai: reponsable.uai!,
    etablissement_formateur_siret: formateur.siret,
    etablissement_formateur_uai: formateur.uai!,

    annee_scolaire: effectif.annee_scolaire,
    id_erp_apprenant: effectif.id_erp_apprenant,
    date_inscription_formation: effectif.formation.date_inscription,
    date_entree_formation: effectif.formation.date_entree,
    date_fin_formation: effectif.formation.date_fin,
    date_exclusion_formation: nullishToOptional(effectif.formation.date_exclusion),
    cause_exclusion_formation: nullishToOptional(effectif.formation.cause_exclusion),
    date_obtention_diplome_formation: nullishToOptional(effectif.formation.date_obtention_diplome),
    obtention_diplome_formation: nullishToOptional(effectif.formation.obtention_diplome),
    contrat_date_debut: nullishToOptional(effectif.contrats?.[0]?.date_debut),
    contrat_date_fin: nullishToOptional(effectif.contrats?.[0]?.date_fin),
    contrat_date_rupture: nullishToOptional(effectif.contrats?.[0]?.date_rupture),
    cause_rupture_contrat: nullishToOptional(effectif.contrats?.[0]?.cause_rupture),
    siret_employeur: nullishToOptional(effectif.contrats?.[0]?.siret),
    contrat_date_debut_2: nullishToOptional(effectif.contrats?.[1]?.date_debut),
    contrat_date_fin_2: nullishToOptional(effectif.contrats?.[1]?.date_fin),
    contrat_date_rupture_2: nullishToOptional(effectif.contrats?.[1]?.date_rupture),
    cause_rupture_contrat_2: nullishToOptional(effectif.contrats?.[1]?.cause_rupture),
    siret_employeur_2: nullishToOptional(effectif.contrats?.[1]?.siret),
    contrat_date_debut_3: nullishToOptional(effectif.contrats?.[2]?.date_debut),
    contrat_date_fin_3: nullishToOptional(effectif.contrats?.[2]?.date_fin),
    contrat_date_rupture_3: nullishToOptional(effectif.contrats?.[2]?.date_rupture),
    cause_rupture_contrat_3: nullishToOptional(effectif.contrats?.[2]?.cause_rupture),
    siret_employeur_3: nullishToOptional(effectif.contrats?.[2]?.siret),
    contrat_date_debut_4: nullishToOptional(effectif.contrats?.[3]?.date_debut),
    contrat_date_fin_4: nullishToOptional(effectif.contrats?.[3]?.date_fin),
    contrat_date_rupture_4: nullishToOptional(effectif.contrats?.[3]?.date_rupture),
    cause_rupture_contrat_4: nullishToOptional(effectif.contrats?.[3]?.cause_rupture),
    siret_employeur_4: nullishToOptional(effectif.contrats?.[3]?.siret),
    rqth_apprenant: effectif.apprenant.rqth ?? false,

    nom_apprenant: effectif.apprenant.nom,
    prenom_apprenant: effectif.apprenant.prenom,
    date_de_naissance_apprenant: effectif.apprenant.date_de_naissance,

    adresse_apprenant: nullishToOptional(effectif.apprenant.adresse?.complete),
    code_postal_apprenant: nullishToOptional(effectif.apprenant.adresse?.code_postal),
    code_commune_insee_apprenant: nullishToOptional(effectif.apprenant.adresse?.code_insee),
  };

  const adresse: IEffectifV2["adresse"] =
    dossier.code_postal_apprenant &&
    dossier.code_commune_insee_apprenant &&
    effectif.apprenant?.adresse?.region &&
    effectif.apprenant.adresse.departement &&
    effectif.apprenant.adresse.departement &&
    effectif.apprenant.adresse.academie &&
    effectif.apprenant.adresse.commune
      ? {
          label: dossier.adresse_apprenant ?? null,
          code_postal: dossier.code_postal_apprenant,
          code_commune_insee: dossier.code_commune_insee_apprenant,
          commune: effectif.apprenant.adresse.commune,
          code_region: effectif.apprenant.adresse.region,
          code_departement: effectif.apprenant.adresse.departement,
          code_academie: effectif.apprenant.adresse.academie,
          mission_locale_id: effectif.apprenant.adresse.mission_locale_id ?? null,
        }
      : await buildAdresse(dossier);

  return ingestDossier(dossier, adresse, effectif.transmitted_at ?? effectif.updated_at!);
}

export async function migrateEffectifs() {
  const organismes = await organismesDb().find({}).toArray();
  const organismeLookup = new Map(organismes.map((o) => [o._id.toHexString(), o]));

  const cursor = effectifsDb().find({}, { sort: { transmitted_at: 1, updated_at: 1 }, timeout: false });

  let counter = 0;
  for await (const effectif of cursor) {
    await migrateEffectif(effectif, organismeLookup);
    counter++;
    if (counter % 1_000 === 0) {
      console.log(`${new Date().toJSON()}: Migrated ${counter} effectifs`);
    }
  }
}
