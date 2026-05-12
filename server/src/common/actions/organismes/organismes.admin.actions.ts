import { ObjectId } from "bson";
import escapeStringRegexp from "escape-string-regexp";
import { STATUT_PRESENCE_REFERENTIEL } from "shared/constants";
import { OrganismeSupportInfo } from "shared/models";
import { OffreFormation } from "shared/models/data/@types/OffreFormation";
import { IFormationCatalogue } from "shared/models/data/formationsCatalogue.model";
import { IOrganisationOrganismeFormation } from "shared/models/data/organisations.model";
import { IUsersMigration } from "shared/models/data/usersMigration.model";
import { zArchivableOrganismesResponse } from "shared/models/routes/admin/organismes.api";
import type { IArchivableOrganismesResponse } from "shared/models/routes/admin/organismes.api";

import {
  activateOrganisme,
  updateMissionLocaleEffectifComputedOrganisme,
} from "@/common/actions/admin/mission-locale/mission-locale.admin.actions";
import { getCfdInfo } from "@/common/apis/apiAlternance/apiAlternance";
import { getEtablissement } from "@/common/apis/ApiEntreprise";
import { fetchOrganismeReferentielBySiret } from "@/common/apis/apiReferentielMna";
import logger from "@/common/logger";
import {
  effectifsDb,
  formationsCatalogueDb,
  missionLocaleEffectifsDb,
  organisationsDb,
  organismesDb,
} from "@/common/model/collections";

import { getTransmissionRelatedToOrganismeByDate } from "../indicateurs/transmissions/transmission.action";

import { checkEligibilityForLoaded, EligibilityResult } from "./deca-cfa-eligibility";

function getFormationEtablissment(formation: OffreFormation, siret: string) {
  if (formation.formateur.siret === siret) return formation.formateur;
  if (formation.gestionnaire.siret === siret) return formation.gestionnaire;
  return null;
}

function getOnisep(formationCatalogue: IFormationCatalogue): OffreFormation["onisep"] {
  if (
    !formationCatalogue.onisep_url ||
    !formationCatalogue.onisep_intitule ||
    !formationCatalogue.onisep_lien_site_onisepfr ||
    !formationCatalogue.onisep_discipline ||
    !formationCatalogue.onisep_domaine_sousdomaine
  ) {
    return null;
  }

  return {
    url: formationCatalogue.onisep_url,
    intitule: formationCatalogue.onisep_intitule,
    libelle_poursuite: formationCatalogue.onisep_intitule,
    lien_site_onisepfr: formationCatalogue.onisep_lien_site_onisepfr,
    discipline: formationCatalogue.onisep_discipline,
    domaine_sousdomaine: formationCatalogue.onisep_domaine_sousdomaine,
  };
}

function getSessions(formationCatalogue: IFormationCatalogue): OffreFormation["sessions"] {
  const sessions: OffreFormation["sessions"] = [];

  if (!formationCatalogue.date_debut || !formationCatalogue.date_fin) {
    return sessions;
  }

  for (let i = 0; i < formationCatalogue.date_debut.length; i++) {
    sessions.push({
      debut: formationCatalogue.date_debut[i],
      fin: formationCatalogue.date_fin[i],
    });
  }

  return sessions;
}

async function getRncps(formationCatalogue: IFormationCatalogue): Promise<OffreFormation["rncps"]> {
  const tco = await getCfdInfo(formationCatalogue.cfd);

  if (!tco) {
    if (!formationCatalogue.rncp_code) {
      return [];
    }

    return [
      {
        code: formationCatalogue.rncp_code,
        // Toujours présent lorsque le code est présent
        intitule: formationCatalogue.rncp_intitule ?? "",
        eligible_apprentissage: formationCatalogue.rncp_eligible_apprentissage ?? null,
        eligible_professionnalisation: null,
        date_fin_validite_enregistrement: formationCatalogue.rncp_details?.date_fin_validite_enregistrement ?? "",
        active_inactive: formationCatalogue.rncp_details?.active_inactive ?? "",
      },
    ];
  }

  return tco.rncps.map((r) => {
    return {
      code: r.code_rncp,
      intitule: r.intitule_diplome,
      eligible_apprentissage: r.eligible_apprentissage ?? null,
      eligible_professionnalisation: r.eligible_professionnalisation ?? null,
      date_fin_validite_enregistrement: r?.date_fin_validite_enregistrement?.toJSON() ?? "",
      active_inactive: r?.active_inactive ?? "",
    };
  });
}

async function buildOffreDeFormation(formationCatalogue: IFormationCatalogue): Promise<OffreFormation> {
  return {
    id_catalogue: formationCatalogue.id_formation,
    cle_ministere_educatif: formationCatalogue.cle_ministere_educatif,

    cfd: {
      code: formationCatalogue.cfd,
      outdated: formationCatalogue.cfd_outdated,
      date_fermeture: formationCatalogue.cfd_date_fermeture ?? null,
    },

    niveau: {
      libelle: formationCatalogue.niveau,
      entree_obligatoire: formationCatalogue.niveau_entree_obligatoire,
    },

    duree: {
      theorique: formationCatalogue.duree,
      incoherente: formationCatalogue.duree_incoherente,
    },

    annee: {
      num: formationCatalogue.annee,
      incoherente: formationCatalogue.annee_incoherente,
    },

    intitule_long: formationCatalogue.intitule_long,
    intitule_court: formationCatalogue.intitule_court,

    nature: {
      libelle: formationCatalogue.diplome,
      code: formationCatalogue.niveau_formation_diplome,
    },

    onisep: getOnisep(formationCatalogue),

    rncps: await getRncps(formationCatalogue),

    lieu_formation: {
      adresse: {
        code_postal: formationCatalogue.code_postal,
        code_commune_insee: formationCatalogue.code_commune_insee,
        num_departement: formationCatalogue.num_departement,
        region: formationCatalogue.region,
        localite: formationCatalogue.localite,
        adresse: formationCatalogue.lieu_formation_adresse,
        nom_academie: formationCatalogue.nom_academie,
        num_academie: formationCatalogue.num_academie,
      },
      siret: formationCatalogue.lieu_formation_siret ?? null,
    },

    entierement_a_distance: formationCatalogue.entierement_a_distance,

    sessions: getSessions(formationCatalogue),

    gestionnaire: {
      siret: formationCatalogue.etablissement_gestionnaire_siret,
      uai: formationCatalogue.etablissement_gestionnaire_uai,
      enseigne: formationCatalogue.etablissement_gestionnaire_enseigne || null,
      habilite_rncp: formationCatalogue.etablissement_gestionnaire_habilite_rncp ?? null,
      certifie_qualite: formationCatalogue.etablissement_gestionnaire_certifie_qualite ?? null,
      adresse: {
        code_postal: formationCatalogue.etablissement_gestionnaire_code_postal ?? null,
        code_commune_insee: formationCatalogue.etablissement_gestionnaire_code_commune_insee ?? null,
        num_departement: formationCatalogue.etablissement_gestionnaire_num_departement ?? null,
        region: formationCatalogue.etablissement_gestionnaire_region ?? null,
        localite: formationCatalogue.etablissement_gestionnaire_localite ?? null,
        adresse: formationCatalogue.etablissement_gestionnaire_adresse ?? null,
        nom_academie: formationCatalogue.etablissement_gestionnaire_nom_academie ?? null,
        num_academie: formationCatalogue.etablissement_gestionnaire_num_academie ?? null,
      },
      raison_sociale: formationCatalogue.etablissement_gestionnaire_entreprise_raison_sociale ?? null,
      date_creation: formationCatalogue.etablissement_gestionnaire_date_creation ?? null,
    },
    formateur: {
      siret: formationCatalogue.etablissement_formateur_siret,
      uai: formationCatalogue.etablissement_formateur_uai,
      enseigne: formationCatalogue.etablissement_formateur_enseigne || null,
      habilite_rncp: formationCatalogue.etablissement_formateur_habilite_rncp ?? null,
      certifie_qualite: formationCatalogue.etablissement_formateur_certifie_qualite ?? null,
      adresse: {
        code_postal: formationCatalogue.etablissement_gestionnaire_code_postal ?? null,
        code_commune_insee: formationCatalogue.etablissement_gestionnaire_code_commune_insee ?? null,
        num_departement: formationCatalogue.etablissement_gestionnaire_num_departement ?? null,
        region: formationCatalogue.etablissement_gestionnaire_region ?? null,
        localite: formationCatalogue.etablissement_gestionnaire_localite ?? null,
        adresse: formationCatalogue.etablissement_gestionnaire_adresse ?? null,
        nom_academie: formationCatalogue.etablissement_gestionnaire_nom_academie ?? null,
        num_academie: formationCatalogue.etablissement_gestionnaire_num_academie ?? null,
      },
      raison_sociale: formationCatalogue.etablissement_gestionnaire_entreprise_raison_sociale ?? null,
      date_creation: formationCatalogue.etablissement_gestionnaire_date_creation ?? null,
    },
  };
}

async function getOffreFormations(siret: string): Promise<OffreFormation[]> {
  const formationsCatalogue = await formationsCatalogueDb()
    .find({
      $or: [
        { etablissement_formateur_siret: siret },
        { etablissement_gestionnaire_siret: siret },
        { lieu_formation_siret: siret },
      ],
    })
    .toArray();
  return Promise.all(formationsCatalogue.map(buildOffreDeFormation));
}

async function findOrganismesSupportInfoBySiret(siret: string): Promise<OrganismeSupportInfo[]> {
  const [apiEntreprise, tdb, referentiel, formations, organisations] = await Promise.all([
    // Silent Error: c'est du support
    getEtablissement(siret).catch((err) => {
      logger.error(err);
      return null;
    }),
    organismesDb().find({ siret }).toArray(),
    fetchOrganismeReferentielBySiret(siret),
    getOffreFormations(siret),
    organisationsDb()
      .aggregate<IOrganisationOrganismeFormation & { users: IUsersMigration[] }>([
        { $match: { type: "ORGANISME_FORMATION", siret } },
        {
          $lookup: {
            from: "usersMigration",
            localField: "_id",
            foreignField: "organisation_id",
            as: "users",
          },
        },
        {
          $match: {
            "users.0": { $exists: true },
          },
        },
      ])
      .toArray(),
  ]);

  const tdbByUai = new Map(tdb.map((o) => [o.uai ?? null, o]));
  const organisationByUai = new Map(organisations.map((o) => [o.uai ?? null, o]));

  const formationsByUai = new Map();

  for (const formation of formations) {
    const etablissement = getFormationEtablissment(formation, siret);
    if (etablissement) {
      const list = formationsByUai.get(etablissement.uai) ?? [];
      list.push(formation);
      formationsByUai.set(etablissement.uai, list);
    }
  }

  const uais = new Set([...tdbByUai.keys(), ...formationsByUai.keys()]);

  if (referentiel) {
    uais.add(referentiel.uai);
  }

  if (apiEntreprise && uais.size === 0) {
    uais.add(null);
  }

  const organismes: OrganismeSupportInfo[] = [];
  for (const uai of uais) {
    const tdbOrganisme = tdbByUai.get(uai);
    const referentielOrganisme = referentiel?.uai === uai ? referentiel : null;

    const etat = new Set<"fermé" | "actif" | "inconnu">();
    if (tdbOrganisme) {
      etat.add(tdbOrganisme.ferme ? "fermé" : "actif");
    }
    if (referentielOrganisme) {
      etat.add(referentielOrganisme.etat_administratif ?? "inconnu");
    }
    if (apiEntreprise) {
      etat.add(apiEntreprise.etat_administratif === "A" ? "actif" : "fermé");
    }
    if (etat.size === 0) {
      etat.add("inconnu");
    }

    const formations = formationsByUai.get(uai) ?? [];

    const effectifs =
      tdbOrganisme == null
        ? []
        : await effectifsDb()
            .find({
              organisme_id: {
                $in: [tdbOrganisme._id, ...(tdbOrganisme.organismesFormateurs?.map((f) => f._id as ObjectId) ?? [])],
              },
            })
            .toArray();

    const transmissions = tdbOrganisme == null ? [] : await getTransmissionRelatedToOrganismeByDate(tdbOrganisme._id);

    organismes.push({
      uai,
      siret,
      nom:
        tdbOrganisme?.nom ??
        apiEntreprise?.enseigne ??
        apiEntreprise?.unite_legale?.personne_morale_attributs?.raison_sociale ??
        "Organisme inconnu",
      tdb: tdbByUai.get(uai) ?? null,
      referentiel: referentiel?.uai === uai ? referentiel : null,
      formations,
      apiEntreprise: apiEntreprise,
      organisation: organisationByUai.get(uai) ?? null,
      etat: Array.from(etat),
      effectifs: effectifs.length,
      transmissions,
    });
  }

  return organismes;
}

export async function searchOrganismesSupportInfoBySiret(search: string): Promise<OrganismeSupportInfo[]> {
  if (/^[0-9]{14}$/.test(search)) {
    return findOrganismesSupportInfoBySiret(search);
  }

  const sirets = await organismesDb()
    .find(
      {
        $or: [
          { uai: { $regex: escapeStringRegexp(search), $options: "i" } },
          { siret: { $regex: escapeStringRegexp(search), $options: "i" } },
          { nom: { $regex: escapeStringRegexp(search), $options: "i" } },
          { enseigne: { $regex: escapeStringRegexp(search), $options: "i" } },
          { raison_sociale: { $regex: escapeStringRegexp(search), $options: "i" } },
        ],
      },
      {
        projection: { siret: 1 },
      }
    )
    .toArray();

  const uniqueSirets = Array.from(new Set(sirets.map((s) => s.siret)));

  const results = await Promise.all(uniqueSirets.map(findOrganismesSupportInfoBySiret));

  return results.flat();
}

export async function getArchivableOrganismes(): Promise<IArchivableOrganismesResponse> {
  const data = await organismesDb()
    .aggregate([
      { $match: { est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.ABSENT } },
      { $sort: { siret: 1, uai: 1 } },
      {
        $lookup: {
          from: "organisations",
          as: "organisation",
          let: { organisme_id: { $toString: "$_id" } },
          pipeline: [{ $match: { $expr: { $eq: ["$organisme_id", "$$organisme_id"] } } }],
        },
      },
      {
        $unwind: {
          path: "$organisation",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "usersMigration",
          localField: "organisation._id",
          foreignField: "organisation_id",
          as: "users",
        },
      },
      {
        $lookup: {
          from: "organismes",
          as: "organismes_transmis",
          let: { organisme_id: { $toString: "$_id" }, organisme_id_raw: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$organisme_transmetteur_id", "$$organisme_id"] },
                    { $ne: ["$_id", "$$organisme_id_raw"] },
                  ],
                },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "organismes",
          as: "organismes_duplicats",
          let: { id: "$_id", siret: "$siret" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$siret", "$$siret"],
                    },

                    {
                      $ne: ["$_id", "$$id"],
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    ])
    .toArray();

  return zArchivableOrganismesResponse.parse(data);
}

export type DecaCfaPilotBatchItem = { siret: string; uai: string };

export type DecaCfaPilotActivateStatus =
  | "activated"
  | "already_active"
  | "not_eligible"
  | "not_found"
  | "partial_failure";

export type DecaCfaPilotDeactivateStatus = "deactivated" | "not_active" | "not_found" | "partial_failure";

export type DecaCfaPilotBatchItemResult<S extends string> = {
  input: DecaCfaPilotBatchItem;
  status: S;
  organismeId?: string;
  eligibility?: EligibilityResult;
  mlBetaActivatedAt?: Date;
  error?: string;
};

export type DecaCfaPilotBatchResult<S extends string> = {
  total: number;
  counts: Record<string, number>;
  items: DecaCfaPilotBatchItemResult<S>[];
};

function dedupeBatchItems(items: DecaCfaPilotBatchItem[]): DecaCfaPilotBatchItem[] {
  const seen = new Set<string>();
  const out: DecaCfaPilotBatchItem[] = [];
  for (const item of items) {
    const key = `${item.siret}|${item.uai}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function aggregateCounts<S extends string>(results: DecaCfaPilotBatchItemResult<S>[]): Record<string, number> {
  return results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
}

export async function activateDecaCfaPilotBatch(
  items: DecaCfaPilotBatchItem[],
  adminUserId: string
): Promise<DecaCfaPilotBatchResult<DecaCfaPilotActivateStatus>> {
  const now = new Date();
  const deduped = dedupeBatchItems(items);
  const results: DecaCfaPilotBatchItemResult<DecaCfaPilotActivateStatus>[] = [];

  for (const input of deduped) {
    const { siret, uai } = input;
    const organisme = await organismesDb().findOne(
      { siret, uai },
      { projection: { _id: 1, siret: 1, uai: 1, nature: 1, is_allowed_deca: 1 } }
    );

    if (!organisme) {
      results.push({ input, status: "not_found" });
      continue;
    }

    const organismeId = (organisme._id as ObjectId).toHexString();
    const eligibility = await checkEligibilityForLoaded(organisme);

    if (eligibility.alreadyActive) {
      try {
        const existingOrg = (await organisationsDb().findOne(
          { type: "ORGANISME_FORMATION", organisme_id: organismeId },
          { projection: { ml_beta_activated_at: 1 } }
        )) as Pick<IOrganisationOrganismeFormation, "ml_beta_activated_at"> | null;
        const mlBetaActivatedAt = existingOrg?.ml_beta_activated_at ?? undefined;
        // Idempotent re-set of the flags + propagation of computed if stale
        await organismesDb().updateOne(
          { _id: organisme._id as ObjectId },
          { $set: { is_allowed_deca: true, is_allowed_collab: true } }
        );
        if (mlBetaActivatedAt) {
          await updateMissionLocaleEffectifComputedOrganisme(mlBetaActivatedAt, organisme._id as ObjectId);
        }
        results.push({ input, status: "already_active", organismeId, eligibility, mlBetaActivatedAt });
      } catch (err) {
        logger.error({ err, siret, uai, organismeId }, "deca-cfa-pilot activate (already_active replay) failed");
        results.push({
          input,
          status: "partial_failure",
          organismeId,
          eligibility,
          error: (err as Error).message,
        });
      }
      continue;
    }

    if (!eligibility.eligible) {
      results.push({ input, status: "not_eligible", organismeId, eligibility });
      continue;
    }

    try {
      await organismesDb().updateOne(
        { _id: organisme._id as ObjectId },
        { $set: { is_allowed_deca: true, is_allowed_collab: true } }
      );

      const existingOrg = (await organisationsDb().findOne(
        { type: "ORGANISME_FORMATION", organisme_id: organismeId },
        { projection: { ml_beta_activated_at: 1 } }
      )) as Pick<IOrganisationOrganismeFormation, "ml_beta_activated_at"> | null;

      if (!existingOrg?.ml_beta_activated_at) {
        await activateOrganisme(now, organisme._id as ObjectId);
        results.push({
          input,
          status: "activated",
          organismeId,
          eligibility,
          mlBetaActivatedAt: now,
        });
      } else {
        await updateMissionLocaleEffectifComputedOrganisme(existingOrg.ml_beta_activated_at, organisme._id as ObjectId);
        results.push({
          input,
          status: "already_active",
          organismeId,
          eligibility,
          mlBetaActivatedAt: existingOrg.ml_beta_activated_at,
        });
      }
    } catch (err) {
      logger.error({ err, siret, uai, organismeId }, "deca-cfa-pilot activate failed");
      results.push({
        input,
        status: "partial_failure",
        organismeId,
        eligibility,
        error: (err as Error).message,
      });
    }
  }

  const counts = aggregateCounts(results);
  logger.info({ adminUserId, total: items.length, counts }, "deca-cfa-pilot batch activate");

  return { total: items.length, counts, items: results };
}

export async function deactivateDecaCfaPilotBatch(
  items: DecaCfaPilotBatchItem[],
  adminUserId: string
): Promise<DecaCfaPilotBatchResult<DecaCfaPilotDeactivateStatus>> {
  const deduped = dedupeBatchItems(items);
  const results: DecaCfaPilotBatchItemResult<DecaCfaPilotDeactivateStatus>[] = [];

  for (const input of deduped) {
    const { siret, uai } = input;
    const organisme = await organismesDb().findOne({ siret, uai }, { projection: { _id: 1, is_allowed_deca: 1 } });

    if (!organisme) {
      results.push({ input, status: "not_found" });
      continue;
    }

    const organismeId = (organisme._id as ObjectId).toHexString();
    const isActive = organisme.is_allowed_deca === true;

    if (!isActive) {
      results.push({ input, status: "not_active", organismeId });
      continue;
    }

    try {
      await organismesDb().updateOne(
        { _id: organisme._id as ObjectId },
        { $unset: { is_allowed_deca: "", is_allowed_collab: "" } }
      );
      await organisationsDb().updateMany(
        { type: "ORGANISME_FORMATION", organisme_id: organismeId },
        { $unset: { ml_beta_activated_at: "" } }
      );
      await missionLocaleEffectifsDb().updateMany(
        { "effectif_snapshot.organisme_id": organisme._id as ObjectId },
        { $unset: { "computed.organisme.ml_beta_activated_at": "" } }
      );
      results.push({ input, status: "deactivated", organismeId });
    } catch (err) {
      logger.error({ err, siret, uai, organismeId }, "deca-cfa-pilot deactivate failed");
      results.push({
        input,
        status: "partial_failure",
        organismeId,
        error: (err as Error).message,
      });
    }
  }

  const counts = aggregateCounts(results);
  logger.info({ adminUserId, total: items.length, counts }, "deca-cfa-pilot batch deactivate");

  return { total: items.length, counts, items: results };
}
