import { normalize } from "path";

import { captureException } from "@sentry/node";
import * as Sentry from "@sentry/node";
import { addJob } from "job-processor";
import { MongoError, ObjectId, WithoutId } from "mongodb";
import { SOURCE_APPRENANT } from "shared/constants";
import { zApprenant } from "shared/models/data/effectifs/apprenant.part";
import { zContrat } from "shared/models/data/effectifs/contrat.part";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { IOrganisme } from "shared/models/data/organismes.model";
import { zodOpenApi } from "shared/models/zodOpenApi";
import { cyrb53Hash, getYearFromDate } from "shared/utils";

import { delierVoeuxEffectifsDecaOrphelins, updateVoeuxAffelnetEffectifDeca } from "@/common/actions/affelnet.actions";
import {
  appliquerCible,
  chargerResponsablesFleches,
  estConflit,
  FILTRE_CHEZ_CIBLE,
} from "@/common/actions/deca/deca-flechage.actions";
import { withComputedFields } from "@/common/actions/effectifs.actions";
import { checkIfEffectifExists, getAndFormatCommuneFromCode } from "@/common/actions/engine/engine.actions";
import { createMissionLocaleSnapshot } from "@/common/actions/mission-locale/mission-locale.actions";
import { withStatsMlDifferees } from "@/common/actions/mission-locale/statsMlDifferees";
import { getOrganismeByUAIAndSIRET } from "@/common/actions/organismes/organismes.actions";
import {
  creerClientDecaBalDepuisConfig,
  lireExpirationCle,
  lirePagesContratsDeca,
  type PageContratsDecaBal,
} from "@/common/apis/bal/bal-deca.api";
import type { IContratDecaBal } from "@/common/apis/bal/bal-deca.model";
import parentLogger from "@/common/logger";
import { effectifsDECADb, organismesDb } from "@/common/model/collections";
import { createErrorAggregator } from "@/common/utils/errorAggregator";
import { cachedInRun, getRunCacheStats, withRunCache } from "@/common/utils/runCache";
import { traiterEnParallele } from "@/common/utils/traiterEnParallele";
import config from "@/config";
import {
  fiabilisationEffectifFormation,
  getEffectifCertification,
} from "@/jobs/fiabilisation/certification/fiabilisation-certification";

import { construireBilanImport, type BilanImportDeca } from "./deca-bilan";

const logger = parentLogger.child({ module: "job:hydrate:contrats-deca-raw" });

const ALERTE_EXPIRATION_CLE_JOURS = 30;
const PAGES_ENTRE_DEUX_JOURNAUX = 100;

interface IProcessingStats {
  created: number;
  updated: number;
  organismesId: Set<string>;
}

function createEmptyStats(): IProcessingStats {
  return {
    created: 0,
    updated: 0,
    organismesId: new Set(),
  };
}

function mergeStats(target: IProcessingStats, source: IProcessingStats): void {
  target.created += source.created;
  target.updated += source.updated;
  for (const id of source.organismesId) {
    target.organismesId.add(id);
  }
}

interface IDryRunStats {
  contrats: number;
  responsableIntrouvable: number;
  etablissementAbsent: number;
  etablissementVide: number;
  etablissementIdentiqueAuResponsable: number;
  etablissementFormateurDuResponsable: number;
  etablissementMemeSiren: number;
  etablissementSansLien: number;
  etablissementSiretOrganismeUnique: number;
  etablissementSiretPartage: number;
  etablissementSiretFerme: number;
  etablissementSiretInconnu: number;
}

function createEmptyDryRunStats(): IDryRunStats {
  return {
    contrats: 0,
    responsableIntrouvable: 0,
    etablissementAbsent: 0,
    etablissementVide: 0,
    etablissementIdentiqueAuResponsable: 0,
    etablissementFormateurDuResponsable: 0,
    etablissementMemeSiren: 0,
    etablissementSansLien: 0,
    etablissementSiretOrganismeUnique: 0,
    etablissementSiretPartage: 0,
    etablissementSiretFerme: 0,
    etablissementSiretInconnu: 0,
  };
}

const organismeResumeProjection = {
  siret: 1,
  uai: 1,
  enseigne: 1,
  raison_sociale: 1,
  nom: 1,
  nature: 1,
  ferme: 1,
  "organismesFormateurs.siret": 1,
} as const;

type OrganismeResume = Pick<
  IOrganisme,
  "siret" | "uai" | "enseigne" | "raison_sociale" | "nom" | "nature" | "ferme" | "organismesFormateurs"
>;

function libelleOrganisme(organisme: OrganismeResume | null): string {
  if (!organisme) return "introuvable dans le TDB";
  const nom = organisme.enseigne ?? organisme.raison_sociale ?? organisme.nom ?? "?";
  return `${nom} (${organisme.nature ?? "nature inconnue"}${organisme.ferme ? ", fermé" : ""})`;
}

const jour = (date: Date | null | undefined) => (date ? date.toISOString().slice(0, 10) : "?");

async function inspectEffectifDeca(document: IContratDecaBal, stats: IDryRunStats): Promise<IProcessingStats> {
  const { no_contrat, organisme_formation, etablissement_formation, formation } = document;
  const siretResponsable = organisme_formation?.siret ?? null;
  const uaiResponsable = organisme_formation?.uai_cfa ?? null;
  stats.contrats++;

  const responsable =
    siretResponsable && uaiResponsable
      ? await organismesDb().findOne(
          { siret: siretResponsable, uai: uaiResponsable },
          { projection: organismeResumeProjection }
        )
      : null;
  if (!responsable) stats.responsableIntrouvable++;

  const siretEtablissement = etablissement_formation?.siret ?? null;
  let relation: string;
  let resolution = "";
  if (!etablissement_formation) {
    stats.etablissementAbsent++;
    relation = "champ absent";
  } else if (!siretEtablissement) {
    stats.etablissementVide++;
    relation = "siret vide";
  } else if (siretEtablissement === siretResponsable) {
    stats.etablissementIdentiqueAuResponsable++;
    relation = "identique au responsable";
  } else {
    const candidats = await organismesDb()
      .find({ siret: siretEtablissement }, { projection: organismeResumeProjection })
      .toArray();
    const ouverts = candidats.filter((candidat) => !candidat.ferme);
    if (ouverts.length === 1) {
      stats.etablissementSiretOrganismeUnique++;
      resolution = `→ ${ouverts[0].uai ?? "sans UAI"} ${libelleOrganisme(ouverts[0])}`;
    } else if (ouverts.length > 1) {
      stats.etablissementSiretPartage++;
      resolution = `→ ${ouverts.length} organismes ouverts (UAI ${ouverts.map((o) => o.uai).join(", ")})`;
    } else if (candidats.length > 0) {
      stats.etablissementSiretFerme++;
      resolution = `→ ${libelleOrganisme(candidats[0])}`;
    } else {
      stats.etablissementSiretInconnu++;
      resolution = "→ inconnu du TDB";
    }

    if (responsable?.organismesFormateurs?.some((formateur) => formateur.siret === siretEtablissement)) {
      stats.etablissementFormateurDuResponsable++;
      relation = "formateur du responsable au catalogue";
    } else if (siretResponsable && siretEtablissement.slice(0, 9) === siretResponsable.slice(0, 9)) {
      stats.etablissementMemeSiren++;
      relation = "même SIREN, autre établissement";
    } else {
      stats.etablissementSansLien++;
      relation = "sans lien connu";
    }
  }

  logger.info(
    {
      no_contrat,
      formation: `${formation?.code_diplome} / ${formation?.rncp} (${jour(formation?.date_debut_formation)} → ${jour(formation?.date_fin_formation)})`,
      responsable: `${siretResponsable}/${uaiResponsable} ${libelleOrganisme(responsable)}`,
      etablissement: `${siretEtablissement ?? "-"} ${relation} ${resolution}`.trim(),
    },
    "DECA dry-run contrat"
  );

  return createEmptyStats();
}

type OptionsImportDeca = { dryRun?: boolean; limit?: number; after?: string };

type SuiviPage = { curseur: string | undefined; restants: number };

function creerSuiviPages() {
  const ouvertes: SuiviPage[] = [];
  let pages = 0;
  let derniere: string | undefined;

  const elaguer = () => {
    while (ouvertes.length > 0 && ouvertes[0].restants <= 0) {
      ouvertes.shift();
    }
  };

  return {
    get pages() {
      return pages;
    },
    ouvrir(curseur: string | undefined, taille: number): SuiviPage {
      pages++;
      derniere = curseur;
      const page = { curseur, restants: taille };
      ouvertes.push(page);
      elaguer();
      return page;
    },
    terminer(page: SuiviPage) {
      page.restants--;
      elaguer();
    },
    reprise(): string | undefined {
      return ouvertes[0]?.curseur ?? derniere;
    },
  };
}

async function* contratsSuivis(
  pages: AsyncIterable<PageContratsDecaBal>,
  suivi: ReturnType<typeof creerSuiviPages>,
  surPage: (page: PageContratsDecaBal) => void
) {
  for await (const page of pages) {
    const suiviPage = suivi.ouvrir(page.curseur, page.contrats.length);
    surPage(page);
    for (const contrat of page.contrats) {
      yield { contrat, suiviPage };
    }
  }
}

function signalerExpirationCle() {
  const expiration = config.bal.deca_api_key ? lireExpirationCle(config.bal.deca_api_key) : null;
  if (!expiration || expiration.getTime() - Date.now() > ALERTE_EXPIRATION_CLE_JOURS * 86_400_000) {
    return;
  }
  const date = jour(expiration);
  logger.warn({ expiration: date }, "La clé de l'API DECA de la BAL expire bientôt");
  Sentry.captureMessage("La clé de l'API DECA de la BAL expire bientôt", {
    level: "warning",
    fingerprint: ["deca-bal-cle-expiration"],
    extra: { expiration: date },
  });
}

function signalerContratsEcartes(ecartes: number) {
  Sentry.captureMessage("Contrats DECA écartés par la BAL", {
    level: "warning",
    fingerprint: ["deca-bal-contrats-ecartes"],
    extra: { ecartes },
  });
}

export function hydrateDecaRaw(options: OptionsImportDeca = {}) {
  return withRunCache(() => withStatsMlDifferees(() => importerContratsDeca(options)));
}

async function importerContratsDeca({ dryRun = false, limit, after }: OptionsImportDeca) {
  const totalStats = createEmptyStats();
  const dryRunStats = createEmptyDryRunStats();
  const debutMs = Date.now();
  const echecs = createErrorAggregator("hydrate:contrats-deca-raw");
  const suivi = creerSuiviPages();
  const contratsEcartes: ClesContratEcarte[] = [];
  let totalCount = 0;
  let ecartes = 0;
  let nbContratsEcartes = 0;
  let effectifsAnnules = 0;
  let curseurDepart: string | undefined;
  let erreur: unknown = null;

  try {
    curseurDepart = after ? new ObjectId(after).toHexString() : undefined;
    signalerExpirationCle();
    const client = creerClientDecaBalDepuisConfig();
    const responsablesFleches = dryRun ? new Set<string>() : await chargerResponsablesFleches();

    const pages = lirePagesContratsDeca(client, { after: curseurDepart, limit });
    const contrats = contratsSuivis(pages, suivi, (page) => {
      ecartes += page.ecartes;
      if (suivi.pages % PAGES_ENTRE_DEUX_JOURNAUX === 0) {
        logger.info({ pages: suivi.pages, contrats: totalCount, reprise: suivi.reprise() }, "DECA lecture en cours");
      }
    });

    await traiterEnParallele(contrats, {
      concurrence: config.deca.concurrence,
      traiter: async ({ contrat, suiviPage }) => {
        totalCount++;
        try {
          if (!dryRun && estContratEcarte(contrat)) {
            nbContratsEcartes++;
            const cles = await clesContratDeca(contrat);
            if (cles) {
              contratsEcartes.push(cles);
            }
            echecs.ok();
            return;
          }
          const stats = dryRun
            ? await inspectEffectifDeca(contrat, dryRunStats)
            : await updateEffectifDeca(contrat, responsablesFleches);
          mergeStats(totalStats, stats);
          echecs.ok();
        } finally {
          suivi.terminer(suiviPage);
        }
      },
      surErreur: (erreurContrat) => echecs.record(erreurContrat),
    });

    if (contratsEcartes.length > 0) {
      effectifsAnnules = await supprimerEffectifsEcartes(contratsEcartes);
      const voeuxDelies = effectifsAnnules > 0 ? await delierVoeuxEffectifsDecaOrphelins() : 0;
      logger.info(
        { contrats: nbContratsEcartes, effectifs: effectifsAnnules, voeux: voeuxDelies },
        "DECA : contrats annulés ou supprimés écartés"
      );
    }

    if (dryRun) {
      logger.info({ ...dryRunStats, totalCount }, "DECA dry-run : aucune écriture");
    } else if (totalCount > 0) {
      await updateOrganismesLastEffectifUpdate(totalStats.organismesId);
      if (config.deca.flechageAuto && !limit) {
        await addJob({ name: "deca:flechage", payload: {}, queued: true });
      }
      if (!limit) {
        await addJob({ name: "demandes-activation:flechables", payload: {}, queued: true });
      }
    } else {
      logger.error("No documents found matching the criteria.");
    }
  } catch (err) {
    erreur = err;
    logger.error({ err, reprise: suivi.reprise() }, "DECA : import interrompu, reprendre avec --after");
  } finally {
    const nbEchecs = echecs.failed;
    if (!dryRun) {
      echecs.flush();
    }
    const bilan = construireBilanImport({
      debutMs,
      finMs: Date.now(),
      contrats: totalCount,
      effectifs: totalStats.created + totalStats.updated,
      echecs: nbEchecs,
      ecartes,
      annules: effectifsAnnules,
      cache: getRunCacheStats(),
    });
    logger.info(
      bilan,
      `DECA terminé: ${totalCount} traités, ${totalStats.created} créés, ${totalStats.updated} mis à jour`
    );
    if (!dryRun && ecartes > 0) {
      signalerContratsEcartes(ecartes);
    }
    if (!dryRun && !limit && !curseurDepart && !erreur) {
      publierMesures(bilan);
    }
  }

  if (erreur) {
    throw erreur;
  }
}

function publierMesures({
  contrats,
  contratsParSeconde,
  effectifs,
  effectifsParSeconde,
  echecs,
  ecartes,
  annules,
  tauxDefautCache,
}: BilanImportDeca) {
  Sentry.setMeasurement("deca.contrats", contrats, "none");
  Sentry.setMeasurement("deca.effectifs", effectifs, "none");
  Sentry.setMeasurement("deca.echecs", echecs, "none");
  Sentry.setMeasurement("deca.ecartes", ecartes, "none");
  Sentry.setMeasurement("deca.annules", annules, "none");
  Sentry.setMeasurement("deca.contrats_par_seconde", contratsParSeconde, "none");
  Sentry.setMeasurement("deca.effectifs_par_seconde", effectifsParSeconde, "none");
  if (tauxDefautCache !== null) {
    Sentry.setMeasurement("deca.cache_taux_defaut", tauxDefautCache, "ratio");
  }
}

export async function hydrateDecaFromExistingEffectifs() {
  let mlUpserted = 0;
  let totalProcessed = 0;

  const DECA_RUPTURE_DATE_DEBUT = new Date("2025-11-01");
  const DECA_RUPTURE_DATE_FIN = new Date("2026-02-28");

  logger.info(
    `DECA→ML one-shot: période ${DECA_RUPTURE_DATE_DEBUT.toISOString().split("T")[0]} - ${DECA_RUPTURE_DATE_FIN.toISOString().split("T")[0]}`
  );

  try {
    const cursor = effectifsDECADb().find({
      "contrats.date_rupture": { $gte: DECA_RUPTURE_DATE_DEBUT, $lte: DECA_RUPTURE_DATE_FIN },
    });

    for await (const effectif of cursor) {
      const mlResult = await createMissionLocaleSnapshot(effectif);
      if (mlResult?.upserted) mlUpserted++;
      totalProcessed++;

      if (totalProcessed % 1000 === 0) {
        logger.info(`DECA→ML: ${totalProcessed} traités, ${mlUpserted} ajoutés`);
      }
    }
  } catch (err) {
    logger.error(`Échec du traitement: ${err}`);
    captureException(err);
  } finally {
    logger.info(`DECA→ML terminé: ${totalProcessed} analysés, ${mlUpserted} ajoutés`);
  }
}

async function upsertEffectifDecaChezCible(
  effectif: WithoutId<IEffectifDECA>,
  retry: boolean
): Promise<{ created: boolean } | null> {
  const filtre = { organisme_responsable_id: effectif.organisme_responsable_id, ...FILTRE_CHEZ_CIBLE };
  const memeAnnee = await effectifsDECADb().findOne({
    ...filtre,
    id_erp_apprenant: effectif.id_erp_apprenant,
    annee_scolaire: effectif.annee_scolaire,
  });
  const documentFleche =
    memeAnnee ?? (await effectifsDECADb().findOne({ ...filtre, deca_raw_id: effectif.deca_raw_id }));
  if (!documentFleche || (!memeAnnee && (await checkIfEffectifExists<IEffectifDECA>(effectif, effectifsDECADb())))) {
    return null;
  }

  const cible = await organismesDb().findOne({ _id: documentFleche.organisme_id });
  if (!cible) {
    return null;
  }

  const document = appliquerCible(effectif, cible);

  if (memeAnnee) {
    const transmitted_at = new Date();
    await effectifsDECADb().updateOne({ _id: memeAnnee._id }, { $set: { ...document, transmitted_at } });
    const enBase = await effectifsDECADb().findOne({ _id: memeAnnee._id });
    if (enBase) {
      await createMissionLocaleSnapshot(enBase);
    }
    return { created: false };
  }

  const nouveau = { ...document, fleche: documentFleche.fleche, _id: new ObjectId() };
  try {
    await effectifsDECADb().insertOne(nouveau);
  } catch (err) {
    if (estConflit(err)) {
      return retry ? upsertEffectifDecaChezCible(effectif, false) : null;
    }
    throw err;
  }
  await updateVoeuxAffelnetEffectifDeca(nouveau._id, nouveau, cible._id.toString());
  await createMissionLocaleSnapshot(nouveau);
  return { created: true };
}

export async function upsertEffectifDeca(
  effectif: WithoutId<IEffectifDECA>,
  responsablesFleches: Set<string>,
  retry: boolean = true
): Promise<{ created: boolean }> {
  if (effectif.organisme_responsable_id && responsablesFleches.has(effectif.organisme_responsable_id.toString())) {
    const resultat = await upsertEffectifDecaChezCible(effectif, retry);
    if (resultat) {
      return resultat;
    }
  }

  const effectifFound = await checkIfEffectifExists<IEffectifDECA>(effectif, effectifsDECADb());

  if (!effectifFound) {
    try {
      const id = new ObjectId();
      await effectifsDECADb().insertOne({ ...effectif, _id: id });
      await updateVoeuxAffelnetEffectifDeca(id, effectif, effectif.organisme_formateur_id?.toString());
      await createMissionLocaleSnapshot({ ...effectif, _id: id });
      return { created: true };
    } catch (err) {
      // Le code d'erreur 11000 correspond à une duplication d'index unique
      // Ce cas arrive lors du traitement concurrentiel du meme effectif dans la queue
      if (retry && err instanceof MongoError && err.code === 11000) {
        return upsertEffectifDeca(effectif, responsablesFleches, false);
      }
      throw err;
    }
  }

  const transmitted_at = new Date();
  await effectifsDECADb().updateOne({ _id: effectifFound._id }, { $set: { ...effectif, transmitted_at } });
  await createMissionLocaleSnapshot({ ...effectif, _id: effectifFound._id, transmitted_at });
  return { created: false };
}

async function updateEffectifDeca(
  document: IContratDecaBal,
  responsablesFleches: Set<string>
): Promise<IProcessingStats> {
  return Sentry.startSpan(
    {
      name: "DECA Update Effectif",
      op: "deca.item",
      forceTransaction: true,
    },
    async () => {
      const stats = createEmptyStats();
      const newDocuments: WithoutId<IEffectifDECA>[] = await transformDocument(document);

      for (const newDocument of newDocuments) {
        const result = await upsertEffectifDeca(newDocument, responsablesFleches);

        if (result.created) {
          stats.created++;
        } else {
          stats.updated++;
        }

        stats.organismesId.add(newDocument.organisme_id.toString());
      }

      return stats;
    }
  );
}

async function updateOrganismesLastEffectifUpdate(organismeIds: Set<string>) {
  const currentTimestamp = new Date();

  try {
    const bulkOperations = Array.from(organismeIds).map((organismeId) => ({
      updateOne: {
        filter: { _id: new ObjectId(organismeId) },
        update: { $set: { last_effectifs_deca_update: currentTimestamp } },
      },
    }));

    if (bulkOperations.length > 0) {
      await organismesDb().bulkWrite(bulkOperations);
      logger.info(`Mise à jour réussie de ${bulkOperations.length} organismes avec last_effectifs_deca_update.`);
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Erreur lors de la mise à jour de last_effectifs_deca_update pour les organismes :", error.message);
    } else {
      logger.error("Erreur lors de la mise à jour de last_effectifs_deca_update pour les organismes :", error);
    }
  }
}

function anneesScolairesDuContrat(document: IContratDecaBal): string[] {
  const { formation } = document;

  const dateDebutFormation = formation?.date_debut_formation ? new Date(formation.date_debut_formation) : null;
  const dateFinFormation = formation?.date_fin_formation ? new Date(formation.date_fin_formation) : null;

  const startYear = dateDebutFormation ? getYearFromDate(dateDebutFormation) : null;
  const endYear = dateFinFormation ? getYearFromDate(dateFinFormation) : null;

  if (!startYear || !endYear || startYear > endYear || endYear - startYear > 5) {
    throw new Error(
      `Les dates de début et de fin de formation sont incorrectes. Document ID: ${document._id}, ` +
        `date de début de formation: ${dateDebutFormation}, date de fin de formation: ${dateFinFormation} `
    );
  }

  if (startYear === endYear) {
    return [`${startYear}-${startYear}`];
  }
  return Array.from({ length: endYear - startYear }, (_, index) => `${startYear + index}-${startYear + index + 1}`);
}

async function transformDocument(document: IContratDecaBal): Promise<WithoutId<IEffectifDECA>[]> {
  const effectifs: WithoutId<IEffectifDECA>[] = [];
  for (const anneeScolaire of anneesScolairesDuContrat(document)) {
    const effectif = await createEffectif(document, anneeScolaire);
    if (effectif) {
      effectifs.push(effectif);
    }
  }
  return effectifs;
}

const calculerIdErpApprenant = (
  prenom: string | null | undefined,
  nom: string | null | undefined,
  dateNaissance: Date | null
) => cyrb53Hash(normalize(prenom || "").trim() + normalize(nom || "").trim() + (dateNaissance || ""));

const STATUTS_ECARTES = new Set(["annule", "supprime"]);

const normaliserStatut = (statut: string | null | undefined) =>
  (statut ?? "")
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export const estContratEcarte = (contrat: Pick<IContratDecaBal, "statut">) =>
  STATUTS_ECARTES.has(normaliserStatut(contrat.statut));

type ClesContratEcarte = {
  organismeId: ObjectId;
  idErpApprenant: string;
  anneesScolaires: string[];
  decaRawId: ObjectId;
};

async function clesContratDeca(document: IContratDecaBal): Promise<ClesContratEcarte | null> {
  const uai = document.organisme_formation?.uai_cfa;
  const siret = document.organisme_formation?.siret;
  if (!uai || !siret) {
    return null;
  }

  const organisme = await cachedInRun(`organisme:${uai}|${siret}`, () => getOrganismeByUAIAndSIRET(uai, siret));
  if (!organisme) {
    return null;
  }

  let anneesScolaires: string[];
  try {
    anneesScolaires = anneesScolairesDuContrat(document);
  } catch {
    return null;
  }

  const dateNaissance = document.alternant?.date_naissance ? new Date(document.alternant.date_naissance) : null;
  return {
    organismeId: organisme._id,
    idErpApprenant: calculerIdErpApprenant(document.alternant?.prenom, document.alternant?.nom, dateNaissance),
    anneesScolaires,
    decaRawId: new ObjectId(document._id),
  };
}

async function supprimerEffectifsEcartes(contrats: ClesContratEcarte[]): Promise<number> {
  let supprimes = 0;
  for (const { organismeId, idErpApprenant, anneesScolaires, decaRawId } of contrats) {
    for (const anneeScolaire of anneesScolaires) {
      const { deletedCount } = await effectifsDECADb().deleteOne({
        organisme_id: organismeId,
        id_erp_apprenant: idErpApprenant,
        annee_scolaire: anneeScolaire,
        deca_raw_id: decaRawId,
      });
      supprimes += deletedCount;
    }
    const { deletedCount } = await effectifsDECADb().deleteMany({
      organisme_responsable_id: organismeId,
      deca_raw_id: decaRawId,
      fleche: { $exists: true },
    });
    supprimes += deletedCount;
  }
  return supprimes;
}

async function createEffectif(
  document: IContratDecaBal,
  anneeScolaire: string
): Promise<WithoutId<IEffectifDECA> | null> {
  const {
    alternant,
    formation,
    employeur,
    organisme_formation,
    etablissement_formation,
    date_debut_contrat,
    date_fin_contrat,
    date_effet_rupture,
    type_contrat,
  } = document;

  if (!alternant) {
    throw new Error("Contrat DECA incomplet : alternant absent");
  }
  if (!alternant.nom || !alternant.prenom) {
    throw new Error("Contrat DECA incomplet : nom ou prénom de l'alternant absent");
  }
  if (!alternant.adresse) {
    throw new Error("Contrat DECA incomplet : adresse de l'alternant absente");
  }
  if (!formation) {
    throw new Error("Contrat DECA incomplet : formation absente");
  }
  if (!employeur) {
    throw new Error("Contrat DECA incomplet : employeur absent");
  }
  if (!organisme_formation?.uai_cfa || !organisme_formation.siret) {
    throw new Error("Contrat DECA incomplet : organisme de formation absent");
  }

  const {
    nom,
    prenom,
    date_naissance,
    handicap,
    telephone,
    sexe,
    nationalite,
    courriel,
    adresse: adresseAlternant,
    derniere_classe,
  } = alternant;

  const { date_debut_formation, date_fin_formation, code_diplome, rncp, intitule_ou_qualification } = formation;
  const { siret, denomination, naf, adresse, nombre_de_salaries } = employeur;
  const { uai_cfa, siret: orgSiret } = organisme_formation;
  const nomAlternant = alternant.nom;
  const prenomAlternant = alternant.prenom;

  const organisme = await cachedInRun(`organisme:${uai_cfa}|${orgSiret}`, () =>
    getOrganismeByUAIAndSIRET(uai_cfa, orgSiret)
  );

  if (!organisme) {
    return null;
  }

  const dateDebutContrat = date_debut_contrat ? new Date(date_debut_contrat) : null;
  const dateFinContrat = date_fin_contrat ? new Date(date_fin_contrat) : null;
  const dateEffetRupture = date_effet_rupture ? new Date(date_effet_rupture) : null;

  const dateDebutFormation = date_debut_formation ? new Date(date_debut_formation) : null;
  const dateFinFormation = date_fin_formation ? new Date(date_fin_formation) : null;

  const dateNaissance = date_naissance ? new Date(date_naissance) : null;

  if (!dateDebutContrat || !dateFinContrat) {
    throw new Error("Les dates de début et de fin de contrat sont requises.");
  }

  const startYear = getYearFromDate(dateDebutFormation);
  const endYear = getYearFromDate(dateFinFormation);

  if (!startYear || !endYear) {
    throw new Error("L'année de début et l'année de fin doivent être définies");
  }

  if (adresseAlternant.code_postal?.length !== 5) {
    logger.warn(
      `Le code postal de l'alternant est invalide. Document ID: ${document._id}, code postal: ${adresseAlternant.code_postal}`
    );
    return null;
  }

  const commune = await getAndFormatCommuneFromCode(
    null,
    adresseAlternant.code_postal,
    [adresseAlternant.numero, adresseAlternant.voie].filter(Boolean).join(" ")
  );

  const effectif: WithoutId<IEffectifDECA> = {
    deca_raw_id: new ObjectId(document._id),
    apprenant: {
      nom: nomAlternant,
      prenom: prenomAlternant,
      date_de_naissance: dateNaissance,
      nationalite: nationalite as zodOpenApi.TypeOf<typeof zApprenant>["nationalite"],
      historique_statut: [],
      has_nir: false,
      rqth: handicap,
      sexe: sexe === "H" ? "M" : sexe === "F" ? "F" : null,
      telephone,
      courriel,
      adresse: {
        numero: adresseAlternant.numero ? parseInt(adresseAlternant.numero, 10) : undefined,
        voie: adresseAlternant.voie,
        code_postal: adresseAlternant.code_postal,
        ...commune,
      },
      situation_avant_contrat: derniere_classe as zodOpenApi.TypeOf<typeof zApprenant>["situation_avant_contrat"],
    },
    contrats: [
      {
        siret,
        denomination,
        type_employeur: parseInt(type_contrat ?? "", 10) as zodOpenApi.TypeOf<typeof zContrat>["type_employeur"],
        naf,
        adresse: { code_postal: adresse?.code_postal },
        date_debut: dateDebutContrat,
        date_fin: dateFinContrat,
        date_rupture: dateEffetRupture,
        nombre_de_salaries,
      },
    ],
    formation: {
      cfd: code_diplome,
      rncp,
      periode: [startYear, endYear],
      libelle_court: intitule_ou_qualification,
      libelle_long: intitule_ou_qualification,
      date_inscription: dateDebutFormation,
      date_entree: dateDebutFormation,
      date_fin: dateFinFormation,
    },
    organisme_id: organisme._id,
    organisme_responsable_id: organisme._id,
    organisme_formateur_id: organisme._id,
    etablissement_formation_siret: etablissement_formation?.siret ?? null,
    validation_errors: [],
    created_at: new Date(),
    updated_at: new Date(),
    transmitted_at: new Date(),
    id_erp_apprenant: calculerIdErpApprenant(prenom, nom, dateNaissance),
    source: SOURCE_APPRENANT.DECA,
    annee_scolaire: anneeScolaire,
  };

  const certification = await getEffectifCertification({
    cfd: effectif?.formation?.cfd,
    rncp: effectif?.formation?.rncp,
    date_entree: dateDebutFormation,
    date_fin: dateFinFormation,
  });

  const computedFormation = await fiabilisationEffectifFormation(effectif, certification);

  return withComputedFields(
    {
      ...effectif,
      formation: computedFormation,
      is_deca_compatible: !organisme.is_transmission_target,
    },
    { organisme, certification }
  );
}
