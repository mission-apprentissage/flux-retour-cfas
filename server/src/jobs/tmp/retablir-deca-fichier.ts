import { ObjectId } from "mongodb";
import { SOURCE_APPRENANT, STATUT_APPRENANT } from "shared/constants";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { getAnneesScolaireListFromDate } from "shared/utils";

import { findOrganismeFormateursIds, findOrganismeResponsablesIds } from "@/common/actions/helpers/permissions";
import parentLogger from "@/common/logger";
import {
  effectifsDb,
  effectifsDECADb,
  effectifsQueueDb,
  missionLocaleEffectifsDb,
  organismesDb,
} from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";

const logger = parentLogger.child({ module: "job:tmp:retablir-deca-fichier" });

type OrganismeHierarchie = Pick<
  IOrganisme,
  "_id" | "erps" | "is_transmission_target" | "organismesFormateurs" | "organismesResponsables"
>;

export interface BilanRetablissementDeca {
  appliquer: boolean;
  organismesCibles: number;
  organismesRetablis: number;
  contratsDecaParAnnee: Record<string, number>;
  contratsDecaEnRupture: number;
  dossiersMl: number;
  creationDossiersMl: string;
  fichierSansErps: { organisme_id: string; traite: boolean }[];
  sauvegarde: string | null;
}

const hierarchie = (organisme: OrganismeHierarchie) => [
  organisme._id,
  ...findOrganismeFormateursIds(organisme as IOrganisme, true),
  ...findOrganismeResponsablesIds(organisme as IOrganisme),
];

const projectionHierarchie = {
  erps: 1,
  is_transmission_target: 1,
  organismesFormateurs: 1,
  organismesResponsables: 1,
} as const;

async function chargerOrganismes(ids: ObjectId[]) {
  const organismes = await organismesDb()
    .find({ _id: { $in: ids } }, { projection: projectionHierarchie })
    .toArray();
  return new Map(organismes.map((organisme) => [organisme._id.toString(), organisme as OrganismeHierarchie]));
}

async function organismesAvecEffectifsHorsFichier(ids: ObjectId[]): Promise<Set<string>> {
  const resultats = await effectifsDb()
    .aggregate<{ _id: ObjectId }>([
      {
        $match: {
          organisme_id: { $in: ids },
          source: { $ne: SOURCE_APPRENANT.FICHIER },
          annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) },
        },
      },
      { $group: { _id: "$organisme_id" } },
    ])
    .toArray();
  return new Set(resultats.map(({ _id }) => _id.toString()));
}

async function organismesFichierSansErps(): Promise<ObjectId[]> {
  const depuis = new Date();
  depuis.setMonth(depuis.getMonth() - 16);
  const sources = await effectifsQueueDb().distinct("source_organisme_id", {
    source: SOURCE_APPRENANT.FICHIER,
    created_at: { $gte: depuis },
  });
  const ids = sources.filter((id): id is string => !!id && ObjectId.isValid(id)).map((id) => new ObjectId(id));
  const organismes = await organismesDb()
    .find(
      { _id: { $in: ids }, is_transmission_target: true, $or: [{ erps: { $exists: false } }, { erps: { $size: 0 } }] },
      { projection: { _id: 1 } }
    )
    .toArray();
  return organismes.map(({ _id }) => _id);
}

export async function retablirDecaFichier({ appliquer = false }: { appliquer?: boolean } = {}) {
  const cibles = await organismesDb()
    .find({ is_transmission_target: true, erps: [SOURCE_APPRENANT.FICHIER] }, { projection: projectionHierarchie })
    .toArray();

  const idsHierarchie = [...new Map(cibles.flatMap(hierarchie).map((id) => [id.toString(), id])).values()];
  const organismes = await chargerOrganismes(idsHierarchie);
  const idsVoisins = [...organismes.values()].flatMap(hierarchie).filter((id) => !organismes.has(id.toString()));
  for (const [id, organisme] of await chargerOrganismes(idsVoisins)) {
    organismes.set(id, organisme);
  }
  const avecEffectifsHorsFichier = await organismesAvecEffectifsHorsFichier(
    [...organismes.values()].map(({ _id }) => _id)
  );

  const transmetHorsFichier = (id: ObjectId) => {
    const organisme = organismes.get(id.toString());
    return (
      !!organisme?.erps?.some((erp) => erp !== SOURCE_APPRENANT.FICHIER) || avecEffectifsHorsFichier.has(id.toString())
    );
  };

  const aRetablir = idsHierarchie.filter((id) => {
    const organisme = organismes.get(id.toString());
    return organisme?.is_transmission_target === true && !hierarchie(organisme).some(transmetHorsFichier);
  });

  const contratsDeca = await effectifsDECADb()
    .find(
      { organisme_id: { $in: aRetablir }, is_deca_compatible: { $ne: true } },
      { projection: { _id: 1, annee_scolaire: 1, "_computed.statut.en_cours": 1 } }
    )
    .toArray();
  const idsContrats = contratsDeca.map(({ _id }) => _id);
  const contratsDecaParAnnee = contratsDeca.reduce<Record<string, number>>((acc, { annee_scolaire }) => {
    acc[annee_scolaire] = (acc[annee_scolaire] ?? 0) + 1;
    return acc;
  }, {});
  const contratsDecaEnRupture = contratsDeca.filter(
    (contrat) => contrat._computed?.statut?.en_cours === STATUT_APPRENANT.RUPTURANT
  ).length;
  const dossiersMl = await missionLocaleEffectifsDb()
    .find<{ _id: ObjectId; effectif_snapshot?: { is_deca_compatible?: boolean } }>(
      { effectif_id: { $in: idsContrats } },
      { projection: { _id: 1, "effectif_snapshot.is_deca_compatible": 1 } }
    )
    .toArray();

  const idsRetablis = new Set(aRetablir.map((id) => id.toString()));
  const fichierSansErps = (await organismesFichierSansErps()).map((id) => ({
    organisme_id: id.toString(),
    traite: idsRetablis.has(id.toString()),
  }));

  const bilan: BilanRetablissementDeca = {
    appliquer,
    organismesCibles: cibles.length,
    organismesRetablis: aRetablir.length,
    contratsDecaParAnnee,
    contratsDecaEnRupture,
    dossiersMl: dossiersMl.length,
    creationDossiersMl:
      "Aucun job à lancer : les dossiers ML des contrats DECA sont créés à l'hydratation DECA, sans condition sur is_deca_compatible.",
    fichierSansErps,
    sauvegarde: null,
  };

  if (!appliquer) {
    logger.info(bilan, "simulation du rétablissement DECA des organismes en mode fichier");
    return bilan;
  }

  const nomSauvegarde = `sauvegarde_retablir_deca_fichier_${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`;
  const sauvegarde = getDatabase().collection(nomSauvegarde);
  const organismesSauvegardes = aRetablir.map((id) => ({
    collection: "organismes",
    document_id: id,
    is_transmission_target: organismes.get(id.toString())?.is_transmission_target ?? null,
  }));
  const contratsSauvegardes = idsContrats.map((id) => ({
    collection: "effectifsDECA",
    document_id: id,
    is_deca_compatible: false,
  }));
  const dossiersSauvegardes = dossiersMl.map((dossier) => ({
    collection: "missionLocaleEffectif",
    document_id: dossier._id,
    is_deca_compatible: dossier.effectif_snapshot?.is_deca_compatible ?? null,
  }));
  const aSauvegarder = [...organismesSauvegardes, ...contratsSauvegardes, ...dossiersSauvegardes];
  if (aSauvegarder.length > 0) {
    await sauvegarde.insertMany(aSauvegarder);
  }

  await organismesDb().updateMany(
    { _id: { $in: aRetablir } },
    { $set: { is_transmission_target: false } },
    { bypassDocumentValidation: true }
  );
  await effectifsDECADb().updateMany(
    { _id: { $in: idsContrats } },
    { $set: { is_deca_compatible: true } },
    { bypassDocumentValidation: true }
  );
  await missionLocaleEffectifsDb().updateMany(
    { effectif_id: { $in: idsContrats } },
    { $set: { "effectif_snapshot.is_deca_compatible": true } },
    { bypassDocumentValidation: true }
  );

  const bilanApplique = { ...bilan, sauvegarde: nomSauvegarde };
  logger.info(bilanApplique, "rétablissement DECA des organismes en mode fichier appliqué");
  return bilanApplique;
}
