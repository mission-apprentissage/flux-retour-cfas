import Boom from "boom";
import { ObjectId } from "bson";
import type { Document } from "mongodb";
import { API_EFFECTIF_LISTE, IEffectif } from "shared/models";
import { FRANCE_TRAVAIL_SITUATION_ENUM } from "shared/models/data/franceTravailEffectif.model";

import logger from "@/common/logger";
import { franceTravailEffectifsDb, organisationsDb } from "@/common/model/collections";

import { getRomeByRncp, getSecteurActivitesByCodeRome } from "../rome/rome.actions";

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildEffectifsPipeline = (
  query: Record<string, any>,
  codeSecteur?: number,
  options?: {
    search?: string;
    sort?: "jours_sans_contrat" | "nom" | "organisme";
    order?: "asc" | "desc";
    now?: Date;
  }
) => {
  const { search, sort = "jours_sans_contrat", order = "desc", now = new Date() } = options ?? {};

  const pipeline: Document[] = [
    { $match: query },
    {
      $lookup: {
        from: "organismes",
        localField: "effectif_snapshot.organisme_id",
        foreignField: "_id",
        as: "organisme",
      },
    },
    {
      $unwind: {
        path: "$organisme",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        jours_sans_contrat: {
          $dateDiff: {
            startDate: "$current_status.date",
            endDate: now,
            unit: "day",
          },
        },
      },
    },
    addATraiterFieldByCodeSecteur(codeSecteur),
    addATraiterField(),
  ];

  if (search) {
    const escapedSearch = escapeRegex(search);
    pipeline.push({
      $match: {
        $or: [
          { "effectif_snapshot.apprenant.nom": { $regex: escapedSearch, $options: "i" } },
          { "effectif_snapshot.apprenant.prenom": { $regex: escapedSearch, $options: "i" } },
        ],
      },
    });
  }

  const sortDirection = order === "asc" ? 1 : -1;
  const sortStage: Record<string, 1 | -1> = {};
  switch (sort) {
    case "jours_sans_contrat":
      sortStage.jours_sans_contrat = sortDirection;
      break;
    case "nom":
      sortStage["effectif_snapshot.apprenant.nom"] = sortDirection;
      sortStage["effectif_snapshot.apprenant.prenom"] = sortDirection;
      break;
    case "organisme":
      sortStage["organisme.nom"] = sortDirection;
      break;
  }

  pipeline.push({ $sort: sortStage });

  return pipeline;
};

export const addATraiterFieldByCodeSecteur = (code_secteur?: number) => {
  if (!code_secteur) {
    return {
      $addFields: {
        a_traiter: true,
      },
    };
  }

  return {
    $addFields: {
      [`a_traiter_${code_secteur}`]: {
        $cond: {
          if: { $eq: [`$ft_data.${code_secteur}`, null] },
          then: true,
          else: false,
        },
      },
    },
  };
};

export const matchATraiterByCodeSecteur = (code_secteur: number, a_traiter: boolean) => {
  return {
    $match: {
      [`a_traiter_${code_secteur}`]: a_traiter,
    },
  };
};

export const addATraiterField = () => {
  return {
    $addFields: {
      a_traiter: {
        $gt: [
          {
            $size: {
              $filter: {
                input: { $objectToArray: "$ft_data" },
                as: "entry",
                cond: { $eq: ["$$entry.v", null] },
              },
            },
          },
          0,
        ],
      },
    },
  };
};

export const matchATraiter = (a_traiter: boolean) => {
  return {
    $match: {
      a_traiter: a_traiter,
    },
  };
};

export const getEffectifSecteurActivitesArboresence = async () => {
  const basePipeline = buildEffectifsPipeline({});

  basePipeline.push(matchATraiter(true));
  const pipelineTotal = [...basePipeline];
  const pipelineSecteurs = [...basePipeline];

  pipelineTotal.push({
    $count: "total",
  });

  pipelineSecteurs.push(
    {
      $unwind: "$romes.secteur_activites",
    },
    {
      $group: {
        _id: "$romes.secteur_activites.code_secteur",
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "romeSecteurActivites",
        localField: "_id",
        foreignField: "code_secteur",
        as: "secteur_activite",
      },
    },
    {
      $unwind: "$secteur_activite",
    },
    {
      $project: {
        _id: 0,
        count: 1,
        code_secteur: "$secteur_activite.code_secteur",
        libelle_secteur: "$secteur_activite.libelle_secteur",
      },
    },
    {
      $sort: { libelle_secteur: 1 },
    }
  );

  const secteurResult = await franceTravailEffectifsDb().aggregate(pipelineSecteurs).toArray();
  const totalResult = await franceTravailEffectifsDb().aggregate(pipelineTotal).next();

  return {
    a_traiter: {
      total: totalResult?.total || 0,
      secteurs: secteurResult,
    },
    traite: await getTraitesCount(),
  };
};

export const getTraitesCount = () => {
  const pipeline = buildEffectifsPipeline({});

  pipeline.push(matchATraiter(false));
  pipeline.push({
    $count: "total",
  });

  return franceTravailEffectifsDb()
    .aggregate(pipeline)
    .next()
    .then((res) => res?.total || 0);
};

export const getFranceTravailOrganisationByCodeRegion = async (codeRegion: string) => {
  const orga = await organisationsDb().findOne({ type: "FRANCE_TRAVAIL", code_region: codeRegion });
  return orga;
};

export const getFranceTravailEffectifsByCodeSecteur = async (
  codeRegion: string,
  type: API_EFFECTIF_LISTE,
  codeSecteur?: number,
  options?: {
    page: number;
    limit: number;
    search?: string;
    sort?: "jours_sans_contrat" | "nom" | "organisme";
    order?: "asc" | "desc";
  }
) => {
  try {
    const query: Record<string, any> = {
      code_region: codeRegion,
    };

    let aTraiterPipelineStage: Record<string, any>;

    switch (type) {
      case API_EFFECTIF_LISTE.A_TRAITER:
        query["romes.secteur_activites.code_secteur"] = codeSecteur;
        aTraiterPipelineStage = codeSecteur ? matchATraiterByCodeSecteur(codeSecteur, true) : matchATraiter(true);
        break;
      case API_EFFECTIF_LISTE.TRAITE:
        aTraiterPipelineStage = matchATraiter(false);
        break;
      default:
        throw Boom.badRequest(`Nom de liste inconnu : ${type}`);
    }

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const pipeline = buildEffectifsPipeline(query, codeSecteur, {
      search: options?.search,
      sort: options?.sort,
      order: options?.order,
    });

    pipeline.push(aTraiterPipelineStage);

    pipeline.push({
      $facet: {
        results: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              created_at: 1,
              effectif_id: 1,
              effectif_snapshot: 1,
              code_region: 1,
              current_status: 1,
              ft_data: 1,
              jours_sans_contrat: 1,
              organisme: {
                _id: "$organisme._id",
                nom: "$organisme.nom",
                raison_sociale: "$organisme.raison_sociale",
                enseigne: "$organisme.enseigne",
              },
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    });

    pipeline.push({
      $project: {
        results: "$results",
        total: { $arrayElemAt: ["$totalCount.count", 0] },
      },
    });

    const [data] = await franceTravailEffectifsDb().aggregate(pipeline).toArray();

    const total = data?.total || 0;

    return {
      effectifs: data?.results || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error in getFranceTravailEffectifsByCodeSecteur", { codeSecteur, codeRegion, options, error });
    throw error;
  }
};

const getEffectifNavigation = async (
  codeRegion: string,
  codeSecteur: number,
  effectifId: ObjectId,
  nom_liste: API_EFFECTIF_LISTE,
  options?: { search?: string; sort?: "jours_sans_contrat" | "nom" | "organisme"; order?: "asc" | "desc" }
) => {
  const query: Record<string, any> = {
    code_region: codeRegion,
  };

  let aTraiter: boolean;

  switch (nom_liste) {
    case API_EFFECTIF_LISTE.A_TRAITER:
      query["romes.secteur_activites.code_secteur"] = codeSecteur;
      aTraiter = true;
      break;
    case API_EFFECTIF_LISTE.TRAITE:
      aTraiter = false;
      break;
    default:
      throw Boom.badRequest(`Nom de liste inconnu : ${nom_liste}`);
  }

  const now = new Date();

  const pipeline = buildEffectifsPipeline(query, codeSecteur, {
    search: options?.search,
    sort: options?.sort,
    order: options?.order,
    now,
  });

  pipeline.push(matchATraiterByCodeSecteur(codeSecteur, aTraiter));

  pipeline.push({
    $group: {
      _id: null,
      ids: {
        $push: {
          id: "$effectif_snapshot._id",
          nom: "$effectif_snapshot.apprenant.nom",
          prenom: "$effectif_snapshot.apprenant.prenom",
        },
      },
    },
  });

  pipeline.push({
    $project: {
      _id: 0,
      total: { $size: "$ids" },
      currentIndex: { $indexOfArray: ["$ids.id", effectifId] },
      ids: 1,
    },
  });

  const [result] = await franceTravailEffectifsDb().aggregate(pipeline).toArray();

  if (!result || result.currentIndex === -1) {
    return {
      total: 0,
      next: null,
      previous: null,
      currentIndex: null,
      nomListe: nom_liste,
    };
  }

  const { total, currentIndex, ids } = result;

  if (total <= 1) {
    return {
      total,
      next: null,
      previous: null,
      currentIndex: null,
      nomListe: nom_liste,
    };
  }

  const modulo = (a: number, b: number) => ((a % b) + b) % b;
  const nextIndex = modulo(currentIndex + 1, total);
  const previousIndex = modulo(currentIndex - 1, total);

  return {
    total,
    next: ids[nextIndex],
    previous: ids[previousIndex],
    currentIndex,
    nomListe: nom_liste,
  };
};

export const getEffectifFromFranceTravailId = async (
  codeRegion: string,
  codeSecteur: number,
  effectifId: string,
  nom_liste: API_EFFECTIF_LISTE,
  options?: { search?: string; sort?: "jours_sans_contrat" | "nom" | "organisme"; order?: "asc" | "desc" }
) => {
  try {
    const aggregation = [
      {
        $match: {
          "effectif_snapshot._id": new ObjectId(effectifId),
          code_region: codeRegion,
        },
      },
      {
        $lookup: {
          from: "organismes",
          localField: "effectif_snapshot.organisme_id",
          foreignField: "_id",
          as: "organisme",
        },
      },
      {
        $unwind: {
          path: "$organisme",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          id: "$effectif_snapshot._id",
          nom: "$effectif_snapshot.apprenant.nom",
          prenom: "$effectif_snapshot.apprenant.prenom",
          date_de_naissance: "$effectif_snapshot.apprenant.date_de_naissance",
          adresse: "$effectif_snapshot.apprenant.adresse",
          formation: "$effectif_snapshot.formation",
          courriel: "$effectif_snapshot.apprenant.courriel",
          telephone: "$effectif_snapshot.apprenant.telephone",
          responsable_mail: "$effectif_snapshot.apprenant.responsable_mail1",
          rqth: "$effectif_snapshot.apprenant.rqth",
          transmitted_at: "$effectif_snapshot.transmitted_at",
          source: "$effectif_snapshot.source",
          contrats: "$effectif_snapshot.contrats",
          current_status: "$current_status",
          ft_data: "$ft_data",
          organisme: {
            _id: "$organisme._id",
            nom: "$organisme.nom",
            raison_sociale: "$organisme.raison_sociale",
            enseigne: "$organisme.enseigne",
            adresse: "$organisme.adresse",
            telephone: "$organisme.contacts.telephone",
            email: "$organisme.contacts.email",
          },
        },
      },
    ];

    const effectif = await franceTravailEffectifsDb().aggregate(aggregation).next();

    if (!effectif) {
      throw Boom.notFound();
    }

    const next = await getEffectifNavigation(codeRegion, codeSecteur, new ObjectId(effectifId), nom_liste, options);
    return { effectif, ...next };
  } catch (error) {
    logger.error("Error in getEffectifFromFranceTravailId", {
      codeRegion,
      codeSecteur,
      effectifId,
      nom_liste,
      options,
      error,
    });
    throw error;
  }
};

export const createFranceTravailEffectifSnapshot = async (effectif: IEffectif) => {
  const currentStatus =
    effectif._computed?.statut?.parcours.filter((statut) => statut.date <= new Date()).slice(-1)[0] ||
    effectif._computed?.statut?.parcours.slice(-1)[0];
  const effectifCodeRegion = effectif?.apprenant?.adresse?.region;

  if (!effectifCodeRegion) {
    return;
  }

  const inscritFilter = currentStatus?.valeur === "INSCRIT";
  const romes = await getRomeByRncp(effectif.formation?.rncp);
  const secteurActivites = await getSecteurActivitesByCodeRome(romes);
  const ftData = secteurActivites.reduce((acc, curr) => ({ ...acc, [curr.code_secteur]: null }), {});
  try {
    await franceTravailEffectifsDb().findOneAndUpdate(
      {
        _id: effectif._id,
      },
      {
        $set: {
          current_status: {
            value: currentStatus?.valeur || null,
            date: currentStatus?.date || null,
          },
        },
        $setOnInsert: {
          created_at: new Date(),
          effectif_id: effectif._id,
          effectif_snapshot: effectif,
          effectif_snapshot_date: new Date(),
          code_region: effectif?.apprenant?.adresse?.region,
          ft_data: ftData,
          romes: {
            code: romes,
            secteur_activites: secteurActivites,
          },
        },
      },
      { upsert: !!inscritFilter }
    );
  } catch (e) {
    logger.error(e);
    console.error("Error while creating France Travail effectif snapshot", e);
  }
};

export const updateFranceTravailData = (
  effectif_id: string,
  commentaire: string | null,
  situation: FRANCE_TRAVAIL_SITUATION_ENUM,
  code_secteur: number,
  user_id: ObjectId
) => {
  return franceTravailEffectifsDb().updateOne(
    { effectif_id: new ObjectId(effectif_id) },
    {
      $set: {
        [`ft_data.${code_secteur}`]: {
          situation,
          commentaire,
          created_at: new Date(),
          created_by: user_id,
        },
      },
    }
  );
};
