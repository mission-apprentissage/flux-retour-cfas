import { MongoServerError, ObjectId } from "mongodb";
import type { IMissionLocaleEffectif } from "shared/models";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { getActiveAnneesScolaires, getAnneesScolaireListFromDate } from "shared/utils/anneeScolaire";

import { computedOrganismeMl, matchFromJointOrganisme } from "@/common/actions/mission-locale/mission-locale.actions";
import { nomOrganisme } from "@/common/actions/organisations.actions";
import { generateOrganismeComputed } from "@/common/actions/organismes/organismes.actions";
import parentLogger from "@/common/logger";
import {
  effectifsDb,
  effectifsDECADb,
  formationsCatalogueDb,
  formationV2Db,
  missionLocaleEffectifsDb,
  organismesDb,
} from "@/common/model/collections";
import { dateMetier } from "@/common/utils/dateUtils";
import { dedupNom } from "@/common/utils/mongoUtils";

const logger = parentLogger.child({ module: "deca:flechage" });

export const FILTRE_CHEZ_CIBLE = { fleche: { $exists: true }, "fleche.annule_le": { $exists: false } } as const;

type Regle = NonNullable<IEffectifDECA["fleche"]>["regle"];
type Fleche = NonNullable<IEffectifDECA["fleche"]>;
type ComputedOrganismeMl = NonNullable<NonNullable<IMissionLocaleEffectif["computed"]>["organisme"]>;

type OrganismeCible = Pick<IOrganisme, "_id" | "is_transmission_target"> &
  Parameters<typeof generateOrganismeComputed>[0];

const PROJECTION_ORGANISME = {
  siret: 1,
  uai: 1,
  nom: 1,
  enseigne: 1,
  raison_sociale: 1,
  nature: 1,
  ferme: 1,
  is_allowed_deca: 1,
  is_transmission_target: 1,
  adresse: 1,
  reseaux: 1,
  fiabilisation_statut: 1,
  "organismesFormateurs.siret": 1,
  "organismesResponsables.siret": 1,
} as const;

type OrganismeFlechage = OrganismeCible &
  Pick<
    IOrganisme,
    | "nom"
    | "enseigne"
    | "raison_sociale"
    | "nature"
    | "is_allowed_deca"
    | "organismesFormateurs"
    | "organismesResponsables"
  >;

const PROJECTION_DOCUMENT = {
  organisme_id: 1,
  organisme_responsable_id: 1,
  deca_raw_id: 1,
  id_erp_apprenant: 1,
  annee_scolaire: 1,
  etablissement_formation_siret: 1,
  "apprenant.nom": 1,
  "apprenant.prenom": 1,
  "apprenant.date_de_naissance": 1,
  "formation.cfd": 1,
  "formation.rncp": 1,
  fleche: 1,
  is_deca_compatible: 1,
} as const;

interface Formation {
  cfd?: string | null;
  rncp?: string | null;
}

type DocumentFlechage = Pick<
  IEffectifDECA,
  | "_id"
  | "organisme_id"
  | "organisme_responsable_id"
  | "deca_raw_id"
  | "id_erp_apprenant"
  | "annee_scolaire"
  | "etablissement_formation_siret"
  | "fleche"
  | "is_deca_compatible"
> & {
  apprenant: Pick<IEffectifDECA["apprenant"], "nom" | "prenom" | "date_de_naissance">;
  formation?: Formation | null;
};

const PROJECTION_DOSSIER = {
  effectif_id: 1,
  mission_locale_id: 1,
  soft_deleted: 1,
  organisme_data: 1,
  cfa_rupture_declaration: 1,
  "computed.organisme": 1,
  "effectif_snapshot.organisme_id": 1,
} as const;

type DossierFlechage = Pick<
  IMissionLocaleEffectif,
  | "_id"
  | "effectif_id"
  | "mission_locale_id"
  | "soft_deleted"
  | "organisme_data"
  | "cfa_rupture_declaration"
  | "computed"
> & { effectif_snapshot: { organisme_id: ObjectId } };

interface Groupe {
  responsableId: string;
  documents: DocumentFlechage[];
}

interface IdentiteErp extends Formation {
  organismeId: string;
  siren: string;
}

interface Contexte {
  organismes: Map<string, OrganismeFlechage>;
  ouvertsParSiret: Map<string, OrganismeFlechage[]>;
  flagges: Set<string>;
  liesParSiret: Map<string, Set<string>>;
  siretsParSiren: Map<string, Set<string>>;
  catalogue: Set<string>;
  erp: Map<string, IdentiteErp[]>;
  liesParResponsable: Map<string, Set<string>>;
}

type Evaluation =
  | { type: "deplacer" | "cible_sans_flag"; cible: OrganismeFlechage; regle: Regle }
  | { type: "erp_responsable" | "cible_sans_uai" | "sans_cible" };

interface Deplacement {
  responsable: OrganismeFlechage;
  cible: OrganismeFlechage;
  regle: Regle;
  documents: DocumentFlechage[];
  affiches: number;
}

interface BilanCfa {
  perdus: number;
  gagnes: number;
  gagnesDejaErp: number;
  dossiersMlPerdus: number;
  dossiersMlGagnes: number;
}

interface BilanFlechage {
  groupes: number;
  fleches: Record<Regle, number>;
  erpResponsable: number;
  ciblesSansUai: number;
  retenus: number;
  exclusParAnnulation: number;
  gels: number;
  conflits: number;
  passagesDecaCompatible: number;
  dossiersMl: number;
  dossiersMlCollabPerdue: number;
  dossiersMlInvisibles: { dossierId: ObjectId; missionLocaleId: ObjectId; cibleId: ObjectId }[];
  dossiersMlRepares: number;
  groupesCoupes: string[];
  parCfa: Map<string, BilanCfa>;
  retenusParSite: Map<string, number>;
  responsablesSansEffectifs: string[];
}

interface BilanRetour {
  groupes: number;
  contrats: number;
  dossiersMl: number;
  gels: number;
  conflits: string[];
}

function champsCible(organisme: OrganismeCible) {
  return {
    organisme_id: organisme._id,
    organisme_formateur_id: organisme._id,
    is_deca_compatible: !organisme.is_transmission_target,
    "_computed.organisme": generateOrganismeComputed(organisme),
  };
}

function champsSnapshot(organisme: OrganismeCible) {
  return {
    "effectif_snapshot.organisme_id": organisme._id,
    "effectif_snapshot.organisme_formateur_id": organisme._id,
    "effectif_snapshot.is_deca_compatible": !organisme.is_transmission_target,
    "effectif_snapshot._computed.organisme": generateOrganismeComputed(organisme),
  };
}

export function appliquerCible<
  T extends Pick<IEffectifDECA, "organisme_id" | "organisme_formateur_id" | "is_deca_compatible" | "_computed">,
>(document: T, organisme: OrganismeCible): T {
  const { "_computed.organisme": organismeComputed, ...champs } = champsCible(organisme);
  return { ...document, ...champs, _computed: { ...document._computed, organisme: organismeComputed } };
}

export async function calculerContratsFlechables(organismeIds: ObjectId[]) {
  const candidats = await organismesDb()
    .find({ _id: { $in: organismeIds }, is_allowed_deca: { $ne: true } }, { projection: { _id: 1 } })
    .toArray();
  if (candidats.length === 0) return;
  const ids = candidats.map((organisme) => organisme._id);
  const bilan = await flecherContratsDeca({ dryRun: true, perimetre: ids, flagsSimules: ids });
  const maintenant = new Date();
  await organismesDb().bulkWrite(
    ids.map((id) => ({
      updateOne: {
        filter: { _id: id },
        update: {
          $set: {
            deca_contrats_flechables: bilan.parCfa.get(id.toString())?.gagnes ?? 0,
            deca_contrats_flechables_at: maintenant,
          },
        },
      },
    }))
  );
}

export async function compterContratsFlechesVers(organismeId: ObjectId): Promise<number> {
  return effectifsDECADb().countDocuments({ organisme_id: organismeId, ...FILTRE_CHEZ_CIBLE });
}

export async function chargerResponsablesFleches(): Promise<Set<string>> {
  const responsables = await effectifsDECADb().distinct("organisme_responsable_id", {
    organisme_responsable_id: { $exists: true },
    ...FILTRE_CHEZ_CIBLE,
  });
  return new Set(responsables.filter((id): id is ObjectId => !!id).map((id) => id.toString()));
}

const cleApprenant = (apprenant: { nom?: string | null; prenom?: string | null; date_de_naissance?: Date | null }) =>
  `${dedupNom(apprenant.nom)}|${dedupNom(apprenant.prenom)}|${dateMetier(apprenant.date_de_naissance) ?? ""}`;

const memeFormation = (a: Formation, b: Formation) => (!!a.cfd && a.cfd === b.cfd) || (!!a.rncp && a.rncp === b.rncp);

const libelleOrganisme = (organisme: OrganismeFlechage | undefined) =>
  organisme ? `${organisme.siret} ${nomOrganisme(organisme) ?? ""}`.trim() : "organisme inconnu";

function ajouter<K, V>(map: Map<K, Set<V>>, cle: K, valeur: V) {
  const valeurs = map.get(cle) ?? new Set<V>();
  valeurs.add(valeur);
  map.set(cle, valeurs);
}

function incrementer<K>(map: Map<K, number>, cle: K, valeur = 1) {
  map.set(cle, (map.get(cle) ?? 0) + valeur);
}

function bilanCfa(bilan: BilanFlechage, organismeId: string): BilanCfa {
  const existant = bilan.parCfa.get(organismeId);
  if (existant) return existant;
  const nouveau = { perdus: 0, gagnes: 0, gagnesDejaErp: 0, dossiersMlPerdus: 0, dossiersMlGagnes: 0 };
  bilan.parCfa.set(organismeId, nouveau);
  return nouveau;
}

function ajouterFormation(
  ctx: Contexte,
  responsableSiret: string | null | undefined,
  formateurSiret: string | null | undefined,
  cfd: string | null | undefined,
  rncp: string | null | undefined
) {
  if (!formateurSiret) return;
  if (responsableSiret) ajouter(ctx.liesParSiret, responsableSiret, formateurSiret);
  if (cfd) ctx.catalogue.add(`${formateurSiret}|cfd|${cfd}`);
  if (rncp) ctx.catalogue.add(`${formateurSiret}|rncp|${rncp}`);
}

async function chargerContexte(annees: string[], flagsSimules: ObjectId[]): Promise<Contexte> {
  const ctx: Contexte = {
    organismes: new Map(),
    ouvertsParSiret: new Map(),
    flagges: new Set(flagsSimules.map((id) => id.toString())),
    liesParSiret: new Map(),
    siretsParSiren: new Map(),
    catalogue: new Set(),
    erp: new Map(),
    liesParResponsable: new Map(),
  };

  for await (const organisme of organismesDb().find({}, { projection: PROJECTION_ORGANISME })) {
    const id = organisme._id.toString();
    ctx.organismes.set(id, organisme);
    if (organisme.is_allowed_deca) ctx.flagges.add(id);
    if (!organisme.siret) continue;
    if (!organisme.ferme)
      ctx.ouvertsParSiret.set(organisme.siret, [...(ctx.ouvertsParSiret.get(organisme.siret) ?? []), organisme]);
    ajouter(ctx.siretsParSiren, organisme.siret.slice(0, 9), organisme.siret);
    for (const responsable of organisme.organismesResponsables ?? []) {
      if (responsable.siret) ajouter(ctx.liesParSiret, responsable.siret, organisme.siret);
    }
  }

  for await (const formation of formationsCatalogueDb().find(
    { published: true },
    { projection: { etablissement_gestionnaire_siret: 1, etablissement_formateur_siret: 1, cfd: 1, rncp_code: 1 } }
  )) {
    ajouterFormation(
      ctx,
      formation.etablissement_gestionnaire_siret,
      formation.etablissement_formateur_siret,
      formation.cfd,
      formation.rncp_code
    );
  }

  for await (const formation of formationV2Db().find(
    { draft: { $ne: true } },
    {
      projection: {
        "identifiant.responsable_siret": 1,
        "identifiant.formateur_siret": 1,
        "identifiant.cfd": 1,
        "identifiant.rncp": 1,
      },
    }
  )) {
    const { responsable_siret, formateur_siret, cfd, rncp } = formation.identifiant;
    ajouterFormation(ctx, responsable_siret, formateur_siret, cfd, rncp);
  }

  for await (const effectif of effectifsDb().find(
    { annee_scolaire: { $in: annees } },
    {
      projection: {
        organisme_id: 1,
        "apprenant.nom": 1,
        "apprenant.prenom": 1,
        "apprenant.date_de_naissance": 1,
        "formation.cfd": 1,
        "formation.rncp": 1,
      },
    }
  )) {
    const organismeId = effectif.organisme_id.toString();
    const cle = cleApprenant(effectif.apprenant);
    const identites = ctx.erp.get(cle) ?? [];
    identites.push({
      organismeId,
      siren: ctx.organismes.get(organismeId)?.siret?.slice(0, 9) ?? "",
      cfd: effectif.formation?.cfd,
      rncp: effectif.formation?.rncp,
    });
    ctx.erp.set(cle, identites);
  }

  return ctx;
}

function formateursLies(ctx: Contexte, responsable: OrganismeFlechage): Set<string> {
  const id = responsable._id.toString();
  const existants = ctx.liesParResponsable.get(id);
  if (existants) return existants;

  const lies = new Set<string>();
  for (const formateur of responsable.organismesFormateurs ?? []) {
    if (formateur.siret) lies.add(formateur.siret);
  }
  if (responsable.siret) {
    for (const siret of ctx.liesParSiret.get(responsable.siret) ?? []) lies.add(siret);
    for (const siret of ctx.siretsParSiren.get(responsable.siret.slice(0, 9)) ?? []) lies.add(siret);
    lies.delete(responsable.siret);
  }
  ctx.liesParResponsable.set(id, lies);
  return lies;
}

function ouvertUnique(ctx: Contexte, siret: string): OrganismeFlechage | null {
  const ouverts = ctx.ouvertsParSiret.get(siret) ?? [];
  return ouverts.length === 1 ? ouverts[0] : null;
}

const dansErp = (ctx: Contexte, cle: string, organismeId: string, formation: Formation) =>
  (ctx.erp.get(cle) ?? []).some(
    (identite) => identite.organismeId === organismeId && memeFormation(identite, formation)
  );

const auCatalogue = (ctx: Contexte, siret: string, formation: Formation) =>
  (!!formation.cfd && ctx.catalogue.has(`${siret}|cfd|${formation.cfd}`)) ||
  (!!formation.rncp && ctx.catalogue.has(`${siret}|rncp|${formation.rncp}`));

function contradictionErp(
  ctx: Contexte,
  cle: string,
  formation: Formation,
  cible: OrganismeFlechage,
  responsableId: string
) {
  const cibleId = cible._id.toString();
  const sirenCible = cible.siret?.slice(0, 9);
  return (ctx.erp.get(cle) ?? []).some(
    (identite) =>
      identite.organismeId !== cibleId &&
      identite.organismeId !== responsableId &&
      identite.siren !== sirenCible &&
      memeFormation(identite, formation)
  );
}

const avecFlag = (ctx: Contexte, cible: OrganismeFlechage, regle: Regle): Evaluation => ({
  type: ctx.flagges.has(cible._id.toString()) ? "deplacer" : "cible_sans_flag",
  cible,
  regle,
});

function evaluerGroupe(ctx: Contexte, responsable: OrganismeFlechage, recent: DocumentFlechage): Evaluation {
  const cle = cleApprenant(recent.apprenant);
  const formation = recent.formation ?? {};
  const responsableId = responsable._id.toString();

  if (dansErp(ctx, cle, responsableId, formation)) {
    return { type: "erp_responsable" };
  }

  let cibleSansUai = false;
  const lieu = recent.etablissement_formation_siret;
  if (lieu && lieu !== responsable.siret) {
    const cible = ouvertUnique(ctx, lieu);
    if (cible && cible.nature !== "responsable") {
      if (!cible.uai) {
        cibleSansUai = true;
      } else if (
        formateursLies(ctx, responsable).has(lieu) &&
        auCatalogue(ctx, lieu, formation) &&
        !contradictionErp(ctx, cle, formation, cible, responsableId)
      ) {
        return avecFlag(ctx, cible, "lieu_declare");
      }
    }
  }

  const candidats: OrganismeFlechage[] = [];
  for (const siret of formateursLies(ctx, responsable)) {
    const formateur = ouvertUnique(ctx, siret);
    if (!formateur || formateur.nature === "responsable") continue;
    if (!dansErp(ctx, cle, formateur._id.toString(), formation)) continue;
    if (formateur.uai) candidats.push(formateur);
    else cibleSansUai = true;
  }
  if (candidats.length === 1) {
    return avecFlag(ctx, candidats[0], "erp_formateur");
  }

  return { type: cibleSansUai ? "cible_sans_uai" : "sans_cible" };
}

function grouper(documents: Iterable<DocumentFlechage>): Groupe[] {
  const groupes = new Map<string, Groupe>();
  for (const document of documents) {
    const responsableId = (document.organisme_responsable_id ?? document.organisme_id).toString();
    const cle = `${responsableId}|${document.deca_raw_id.toString()}`;
    const groupe = groupes.get(cle) ?? { responsableId, documents: [] };
    groupe.documents.push(document);
    groupes.set(cle, groupe);
  }
  return [...groupes.values()];
}

async function chargerGroupes(ctx: Contexte, perimetre: ObjectId[]): Promise<Groupe[]> {
  const sirets = [
    ...new Set(perimetre.map((id) => ctx.organismes.get(id.toString())?.siret).filter((s): s is string => !!s)),
  ];
  const documents = await effectifsDECADb()
    .find(
      { $or: [{ organisme_id: { $in: perimetre } }, { etablissement_formation_siret: { $in: sirets } }] },
      { projection: PROJECTION_DOCUMENT }
    )
    .toArray();
  return grouper(documents);
}

async function chargerDossiersMl(effectifIds: ObjectId[]): Promise<Map<string, DossierFlechage[]>> {
  const dossiers = new Map<string, DossierFlechage[]>();
  for (let i = 0; i < effectifIds.length; i += 1000) {
    const lot = effectifIds.slice(i, i + 1000);
    for await (const dossier of missionLocaleEffectifsDb().find(
      { effectif_id: { $in: lot } },
      { projection: PROJECTION_DOSSIER }
    )) {
      const cle = dossier.effectif_id.toString();
      dossiers.set(cle, [...(dossiers.get(cle) ?? []), dossier as DossierFlechage]);
    }
  }
  return dossiers;
}

async function conflitChez(organismeId: ObjectId, documents: DocumentFlechage[]): Promise<boolean> {
  for (const document of documents) {
    const occupe = await effectifsDECADb().findOne(
      {
        organisme_id: organismeId,
        annee_scolaire: document.annee_scolaire,
        id_erp_apprenant: document.id_erp_apprenant,
      },
      { projection: { _id: 1 } }
    );
    if (occupe && !occupe._id.equals(document._id)) return true;
  }
  return false;
}

export const estConflit = (err: unknown) => err instanceof MongoServerError && err.code === 11000;

async function dossiersRendusInvisibles(
  dossierIds: ObjectId[],
  computedCible: ComputedOrganismeMl
): Promise<Set<string>> {
  if (dossierIds.length === 0) return new Set();
  const visibles = async (stages: Record<string, unknown>[]) =>
    new Set(
      (
        await missionLocaleEffectifsDb()
          .aggregate([
            { $match: { _id: { $in: dossierIds } } },
            ...stages,
            ...matchFromJointOrganisme("MISSION_LOCALE"),
            { $project: { _id: 1 } },
          ])
          .toArray()
      ).map((dossier) => dossier._id.toString())
    );
  const avant = await visibles([]);
  const apres = await visibles([{ $set: { "computed.organisme": { $literal: computedCible } } }]);
  return new Set([...avant].filter((id) => !apres.has(id)));
}

async function ecrireToutOuRien(
  documents: DocumentFlechage[],
  ecrire: (document: DocumentFlechage) => Promise<boolean>,
  defaire: (faits: DocumentFlechage[]) => Promise<void>
): Promise<boolean> {
  const faits: DocumentFlechage[] = [];
  const annuler = async () => {
    if (faits.length > 0) await defaire(faits);
  };
  try {
    for (const document of documents) {
      if (!(await ecrire(document))) break;
      faits.push(document);
    }
  } catch (err) {
    await annuler();
    if (estConflit(err)) return false;
    throw err;
  }
  if (faits.length === documents.length) return true;
  await annuler();
  return false;
}

async function deplacerGroupe(deplacement: Deplacement, fleche: Fleche): Promise<boolean> {
  const { responsable, cible, documents } = deplacement;
  return ecrireToutOuRien(
    documents,
    async (document) => {
      const { modifiedCount } = await effectifsDECADb().updateOne(
        { _id: document._id, organisme_id: responsable._id, fleche: { $exists: false } },
        { $set: { ...champsCible(cible), fleche } }
      );
      return modifiedCount > 0;
    },
    async (faits) => {
      await effectifsDECADb().updateMany(
        { _id: { $in: faits.map((document) => document._id) } },
        { $set: champsCible(responsable), $unset: { fleche: "" } }
      );
    }
  );
}

const estGele = (dossiers: DossierFlechage[]) =>
  dossiers.some((dossier) => !dossier.soft_deleted && (dossier.organisme_data || dossier.cfa_rupture_declaration));

const filtreDossiers = (dossiers: DossierFlechage[]) => ({
  _id: { $in: dossiers.map((dossier) => dossier._id) },
  effectif_id: { $in: dossiers.map((dossier) => dossier.effectif_id) },
});

const dossiersDe = (dossiers: Map<string, DossierFlechage[]>, documents: DocumentFlechage[]) =>
  documents.flatMap((document) => dossiers.get(document._id.toString()) ?? []);

const relireDossiers = async (documents: DocumentFlechage[]) =>
  dossiersDe(await chargerDossiersMl(documents.map((document) => document._id)), documents);

async function reecrireDossiers(
  dossiers: DossierFlechage[],
  organisme: OrganismeCible,
  computed: ComputedOrganismeMl,
  fleche: Fleche
) {
  if (dossiers.length === 0) return;
  await missionLocaleEffectifsDb().updateMany(filtreDossiers(dossiers), {
    $set: { ...champsSnapshot(organisme), "effectif_snapshot.fleche": fleche, "computed.organisme": computed },
  });
}

function memoriser<T>(charger: (id: ObjectId) => Promise<T>) {
  const cache = new Map<string, T>();
  return async (id: ObjectId) => {
    const cle = id.toString();
    if (!cache.has(cle)) cache.set(cle, await charger(id));
    return cache.get(cle) as T;
  };
}

async function deplacer(
  ctx: Contexte,
  deplacements: Deplacement[],
  bilan: BilanFlechage,
  { dryRun, maintenant }: { dryRun: boolean; maintenant: Date }
) {
  const dossiers = await chargerDossiersMl(deplacements.flatMap((d) => d.documents.map((document) => document._id)));
  const computedCible = memoriser((id) => computedOrganismeMl(id, { lectureSeule: dryRun }));

  for (const deplacement of deplacements) {
    const { responsable, cible, regle, documents, affiches } = deplacement;
    const dossiersGroupe = dossiersDe(dossiers, documents);
    const actifs = dossiersGroupe.filter((dossier) => !dossier.soft_deleted);

    if (estGele(dossiersGroupe)) {
      bilan.gels++;
      continue;
    }
    if (await conflitChez(cible._id, documents)) {
      bilan.conflits++;
      continue;
    }

    const computed = await computedCible(cible._id);
    const invisibles = await dossiersRendusInvisibles(
      actifs.map((dossier) => dossier._id),
      computed
    );
    const fleche = { regle, le: maintenant };

    if (!dryRun) {
      const dossiersAEcrire = await relireDossiers(documents);
      if (estGele(dossiersAEcrire)) {
        bilan.gels++;
        continue;
      }
      if (!(await deplacerGroupe(deplacement, fleche))) {
        bilan.conflits++;
        continue;
      }
      await reecrireDossiers(dossiersAEcrire, cible, computed, fleche);
    }

    bilan.fleches[regle]++;
    bilan.dossiersMl += actifs.length;
    for (const dossier of actifs.filter(({ _id }) => invisibles.has(_id.toString()))) {
      bilan.dossiersMlInvisibles.push({
        dossierId: dossier._id,
        missionLocaleId: dossier.mission_locale_id,
        cibleId: cible._id,
      });
    }
    bilan.dossiersMlCollabPerdue += actifs.filter(
      (dossier) => dossier.computed?.organisme?.is_allowed_collab === true && !computed.is_allowed_collab
    ).length;
    if (!cible.is_transmission_target) {
      bilan.passagesDecaCompatible += documents.filter((document) => document.is_deca_compatible === false).length;
    }

    const perdant = bilanCfa(bilan, responsable._id.toString());
    perdant.perdus += affiches;
    perdant.dossiersMlPerdus += actifs.length;
    const gagnant = bilanCfa(bilan, cible._id.toString());
    gagnant.gagnes += affiches;
    gagnant.dossiersMlGagnes += actifs.length;
    const cle = cleApprenant(documents[0].apprenant);
    if ((ctx.erp.get(cle) ?? []).some((identite) => identite.organismeId === cible._id.toString())) {
      gagnant.gagnesDejaErp += affiches;
    }
  }
}

async function reparerDossiersMl(ctx: Contexte, documents: DocumentFlechage[], bilan: BilanFlechage) {
  const dossiers = await chargerDossiersMl(documents.map((document) => document._id));
  const computedCible = memoriser((id) => computedOrganismeMl(id));
  for (const document of documents) {
    const cible = ctx.organismes.get(document.organisme_id.toString());
    const aReparer = (dossiers.get(document._id.toString()) ?? []).filter(
      (dossier) => !dossier.effectif_snapshot.organisme_id.equals(document.organisme_id)
    );
    if (!cible || !document.fleche || aReparer.length === 0) continue;
    await reecrireDossiers(aReparer, cible, await computedCible(cible._id), document.fleche);
    bilan.dossiersMlRepares += aReparer.length;
  }
}

async function responsablesSansEffectifs(
  bilan: BilanFlechage,
  deplacements: Deplacement[],
  { dryRun, maintenant }: { dryRun: boolean; maintenant: Date }
) {
  const anneesActives = getActiveAnneesScolaires(maintenant);
  const restants = new Map<string, number>();
  for (const [organismeId, cfa] of bilan.parCfa) {
    if (cfa.perdus === 0) continue;
    const id = new ObjectId(organismeId);
    const [erp, deca] = await Promise.all([
      effectifsDb().countDocuments({ organisme_id: id, annee_scolaire: { $in: anneesActives } }),
      effectifsDECADb().countDocuments({ organisme_id: id, annee_scolaire: { $in: anneesActives } }),
    ]);
    restants.set(organismeId, erp + deca);
  }
  if (dryRun) {
    for (const { responsable, documents } of deplacements) {
      const id = responsable._id.toString();
      if (!restants.has(id)) continue;
      const partants = documents.filter((document) => anneesActives.includes(document.annee_scolaire)).length;
      restants.set(id, (restants.get(id) ?? 0) - partants);
    }
  }
  return [...restants].filter(([, nombre]) => nombre <= 0).map(([id]) => id);
}

function journaliserBilan(ctx: Contexte, bilan: BilanFlechage, dryRun: boolean) {
  const perdants = [...bilan.parCfa].filter(([id, cfa]) => cfa.perdus > 0 && ctx.flagges.has(id));
  const gagnants = [...bilan.parCfa].filter(([id, cfa]) => cfa.gagnes > 0 && ctx.flagges.has(id));
  logger.info(
    {
      dryRun,
      groupes: bilan.groupes,
      fleches: bilan.fleches,
      erpResponsable: bilan.erpResponsable,
      ciblesSansUai: bilan.ciblesSansUai,
      retenusFauteDeFlag: bilan.retenus,
      exclusParAnnulation: bilan.exclusParAnnulation,
      gels: bilan.gels,
      conflits: bilan.conflits,
      passagesDecaCompatible: bilan.passagesDecaCompatible,
      dossiersMl: bilan.dossiersMl,
      dossiersMlCollabPerdue: bilan.dossiersMlCollabPerdue,
      dossiersMlInvisibles: bilan.dossiersMlInvisibles.length,
      dossiersMlRepares: bilan.dossiersMlRepares,
      groupesCoupes: bilan.groupesCoupes.length,
      perdants: perdants.length,
      contratsPerdus: perdants.reduce((total, [, cfa]) => total + cfa.perdus, 0),
      gagnants: gagnants.length,
      contratsGagnes: gagnants.reduce((total, [, cfa]) => total + cfa.gagnes, 0),
    },
    "DECA fléchage : bilan"
  );
  for (const [id, cfa] of bilan.parCfa) {
    logger.info(
      { cfa: libelleOrganisme(ctx.organismes.get(id)), flagge: ctx.flagges.has(id), ...cfa },
      "DECA fléchage : CFA"
    );
  }
  for (const [cle, contrats] of [...bilan.retenusParSite].sort((a, b) => b[1] - a[1])) {
    const [responsableId, cibleId] = cle.split(">");
    logger.info(
      {
        responsable: libelleOrganisme(ctx.organismes.get(responsableId)),
        site: libelleOrganisme(ctx.organismes.get(cibleId)),
        contrats,
      },
      "DECA fléchage : retenus faute de flag"
    );
  }
  for (const { dossierId, missionLocaleId, cibleId } of bilan.dossiersMlInvisibles) {
    logger.info(
      { dossierId, missionLocaleId, cible: libelleOrganisme(ctx.organismes.get(cibleId.toString())) },
      "DECA fléchage : dossier ML rendu invisible de la Mission Locale"
    );
  }
  for (const groupe of bilan.groupesCoupes) {
    logger.info({ groupe }, "DECA fléchage : groupe coupé entre son responsable et sa cible");
  }
  for (const id of bilan.responsablesSansEffectifs) {
    logger.info(
      { cfa: libelleOrganisme(ctx.organismes.get(id)) },
      "DECA fléchage : responsable sans effectifs après fléchage"
    );
  }
}

const libelleGroupe = (
  responsable: Pick<IOrganisme, "siret"> | null | undefined,
  responsableId: string,
  documents: DocumentFlechage[]
) => `${responsable?.siret ?? responsableId} ${documents[0].id_erp_apprenant} ${documents[0].deca_raw_id.toString()}`;

function completerGroupe(
  ctx: Contexte,
  responsableId: string,
  documents: DocumentFlechage[],
  annees: string[]
): Deplacement | null {
  const fleches = documents.filter((document) => document.fleche);
  const cibleId = fleches[0].organisme_id.toString();
  const responsable = ctx.organismes.get(responsableId);
  const cible = ctx.organismes.get(cibleId);
  const regle = fleches[0].fleche?.regle;
  if (
    !responsable ||
    !cible ||
    !regle ||
    !ctx.flagges.has(cibleId) ||
    cible.ferme ||
    !cible.uai ||
    fleches.some((document) => document.organisme_id.toString() !== cibleId)
  ) {
    return null;
  }
  const restants = documents.filter((document) => !document.fleche);
  return {
    responsable,
    cible,
    regle,
    documents: restants,
    affiches: restants.filter((document) => annees.includes(document.annee_scolaire)).length,
  };
}

interface OptionsFlechage {
  dryRun?: boolean;
  perimetre?: ObjectId[];
  flagsSimules?: ObjectId[];
}

export async function flecherContratsDeca({
  dryRun = false,
  perimetre,
  flagsSimules = [],
}: OptionsFlechage = {}): Promise<BilanFlechage> {
  const maintenant = new Date();
  const annees = getAnneesScolaireListFromDate(maintenant);
  const ctx = await chargerContexte(annees, flagsSimules);
  const idsPerimetre = (perimetre ?? [...ctx.flagges].map((id) => new ObjectId(id))).filter((id) =>
    ctx.flagges.has(id.toString())
  );
  const groupes = await chargerGroupes(ctx, idsPerimetre);

  const bilan: BilanFlechage = {
    groupes: 0,
    fleches: { lieu_declare: 0, erp_formateur: 0 },
    erpResponsable: 0,
    ciblesSansUai: 0,
    retenus: 0,
    exclusParAnnulation: 0,
    gels: 0,
    conflits: 0,
    passagesDecaCompatible: 0,
    dossiersMl: 0,
    dossiersMlCollabPerdue: 0,
    dossiersMlInvisibles: [],
    dossiersMlRepares: 0,
    groupesCoupes: [],
    parCfa: new Map(),
    retenusParSite: new Map(),
    responsablesSansEffectifs: [],
  };
  const deplacements: Deplacement[] = [];
  const dejaFleches: DocumentFlechage[] = [];

  for (const { responsableId, documents } of groupes) {
    if (documents.some((document) => document.fleche?.annule_le)) {
      bilan.exclusParAnnulation++;
      continue;
    }
    if (documents.some((document) => document.fleche)) {
      const fleches = documents.filter((document) => document.fleche);
      dejaFleches.push(...fleches);
      if (fleches.length < documents.length) {
        bilan.groupesCoupes.push(libelleGroupe(ctx.organismes.get(responsableId), responsableId, documents));
        const completion = completerGroupe(ctx, responsableId, documents, annees);
        if (completion) deplacements.push(completion);
      }
      continue;
    }
    const affiches = documents.filter((document) => annees.includes(document.annee_scolaire)).length;
    const responsable = ctx.organismes.get(responsableId);
    if (affiches === 0 || !responsable) continue;

    bilan.groupes++;
    const recent = documents.reduce((a, b) => (b.annee_scolaire > a.annee_scolaire ? b : a));
    const evaluation = evaluerGroupe(ctx, responsable, recent);
    switch (evaluation.type) {
      case "deplacer":
        deplacements.push({ responsable, cible: evaluation.cible, regle: evaluation.regle, documents, affiches });
        break;
      case "cible_sans_flag":
        bilan.retenus += affiches;
        incrementer(bilan.retenusParSite, `${responsableId}>${evaluation.cible._id.toString()}`, affiches);
        break;
      case "erp_responsable":
        bilan.erpResponsable++;
        break;
      case "cible_sans_uai":
        bilan.ciblesSansUai++;
        break;
    }
  }

  await deplacer(ctx, deplacements, bilan, { dryRun, maintenant });
  if (!dryRun) {
    await reparerDossiersMl(ctx, dejaFleches, bilan);
  }
  bilan.responsablesSansEffectifs = await responsablesSansEffectifs(bilan, deplacements, { dryRun, maintenant });
  journaliserBilan(ctx, bilan, dryRun);
  return bilan;
}

const activiteCfaDepuis = (dossier: DossierFlechage, depuis: Date) =>
  [
    dossier.organisme_data?.reponse_at,
    dossier.organisme_data?.acc_conjoint_at,
    dossier.cfa_rupture_declaration?.declared_at,
  ].some((date) => !!date && date >= depuis);

const geleDepuis = (dossiers: DossierFlechage[], depuis: Date) =>
  dossiers.some((dossier) => !dossier.soft_deleted && activiteCfaDepuis(dossier, depuis));

interface OptionsRetour {
  mode: "annuler" | "refaire";
  responsables?: ObjectId[];
  cibles?: ObjectId[];
  dryRun?: boolean;
}

export async function rendreContratsDeca({ mode, responsables, cibles, dryRun = false }: OptionsRetour) {
  const maintenant = new Date();
  const filtre =
    mode === "annuler"
      ? { organisme_responsable_id: { $in: responsables ?? [] }, ...FILTRE_CHEZ_CIBLE }
      : responsables
        ? { organisme_responsable_id: { $in: responsables }, fleche: { $exists: true } }
        : cibles
          ? { organisme_id: { $in: cibles }, ...FILTRE_CHEZ_CIBLE }
          : { fleche: { $exists: true } };
  const documents = await effectifsDECADb().find(filtre, { projection: PROJECTION_DOCUMENT }).toArray();
  const dossiers = await chargerDossiersMl(documents.map((document) => document._id));
  const chargerOrganisme = memoriser((id) => organismesDb().findOne({ _id: id }));
  const computedResponsable = memoriser((id) => computedOrganismeMl(id, { lectureSeule: dryRun }));
  const bilan: BilanRetour = { groupes: 0, contrats: 0, dossiersMl: 0, gels: 0, conflits: [] };

  for (const groupe of grouper(documents)) {
    const responsable = await chargerOrganisme(new ObjectId(groupe.responsableId));
    const fleche = groupe.documents.find((document) => document.fleche)?.fleche;
    const libelle = libelleGroupe(responsable, groupe.responsableId, groupe.documents);
    if (!responsable || !fleche) {
      bilan.conflits.push(libelle);
      continue;
    }

    const dossiersGroupe = dossiersDe(dossiers, groupe.documents);
    if (mode === "annuler" && geleDepuis(dossiersGroupe, fleche.le)) {
      bilan.gels++;
      continue;
    }
    const chezCible = groupe.documents.filter((document) => !document.organisme_id.equals(responsable._id));
    if (await conflitChez(responsable._id, chezCible)) {
      bilan.conflits.push(libelle);
      continue;
    }

    if (!dryRun) {
      const dossiersAEcrire = await relireDossiers(groupe.documents);
      if (mode === "annuler" && geleDepuis(dossiersAEcrire, fleche.le)) {
        bilan.gels++;
        continue;
      }
      const flecheAnnulee = { ...fleche, annule_le: maintenant };
      const computed = await computedResponsable(responsable._id);
      if (dossiersAEcrire.length > 0) {
        await missionLocaleEffectifsDb().updateMany(
          filtreDossiers(dossiersAEcrire),
          mode === "annuler"
            ? {
                $set: {
                  ...champsSnapshot(responsable),
                  "effectif_snapshot.fleche": flecheAnnulee,
                  "computed.organisme": computed,
                },
              }
            : {
                $set: { ...champsSnapshot(responsable), "computed.organisme": computed },
                $unset: { "effectif_snapshot.fleche": "" },
              }
        );
      }
      const remettreDossiersChezCible = async () => {
        const cible = chezCible[0] && (await chargerOrganisme(chezCible[0].organisme_id));
        if (cible && chezCible[0].fleche) {
          await reecrireDossiers(dossiersAEcrire, cible, await computedOrganismeMl(cible._id), chezCible[0].fleche);
        }
      };
      let rendu = false;
      try {
        rendu = await ecrireToutOuRien(
          groupe.documents,
          async (document) => {
            await effectifsDECADb().updateOne(
              { _id: document._id, fleche: { $exists: true } },
              mode === "annuler"
                ? { $set: { ...champsCible(responsable), fleche: flecheAnnulee } }
                : { $set: champsCible(responsable), $unset: { fleche: "" } }
            );
            return true;
          },
          async (faits) => {
            for (const document of faits) {
              const cible = await chargerOrganisme(document.organisme_id);
              if (cible) {
                await effectifsDECADb().updateOne(
                  { _id: document._id },
                  { $set: { ...champsCible(cible), fleche: document.fleche } }
                );
              }
            }
          }
        );
      } finally {
        if (!rendu) await remettreDossiersChezCible();
      }
      if (!rendu) {
        bilan.conflits.push(libelle);
        continue;
      }
    }

    bilan.groupes++;
    bilan.contrats += groupe.documents.length;
    bilan.dossiersMl += dossiersGroupe.filter((dossier) => !dossier.soft_deleted).length;
  }

  logger.info(
    { mode, dryRun, groupes: bilan.groupes, contrats: bilan.contrats, dossiersMl: bilan.dossiersMl, gels: bilan.gels },
    "DECA fléchage : retour au responsable"
  );
  for (const conflit of bilan.conflits) {
    logger.info({ groupe: conflit }, "DECA fléchage : groupe resté chez sa cible");
  }
  return bilan;
}

export async function idsDesSirets(sirets: string[]): Promise<ObjectId[]> {
  if (sirets.length === 0) return [];
  const organismes = await organismesDb()
    .find({ siret: { $in: sirets } }, { projection: { _id: 1 } })
    .toArray();
  return organismes.map((organisme) => organisme._id);
}
