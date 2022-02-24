const express = require("express");
const stringify = require("json-stringify-deterministic");
const { parseAsync } = require("json2csv");
const { format } = require("date-fns");
const tryCatch = require("../middlewares/tryCatchMiddleware");
const Joi = require("joi");
const { getAnneeScolaireFromDate } = require("../../common/utils/anneeScolaireUtils");
const { tdbRoles } = require("../../common/roles");
const permissionsMiddleware = require("../middlewares/permissionsMiddleware");
const { effectifsIndicators, getStatutNameFromCode } = require("../../common/model/constants");
const omit = require("lodash.omit");
const { getDepartementCodeFromUai } = require("../../common/domain/uai");
const validateRequestQuery = require("../middlewares/validateRequestQuery");
const { toXlsxBuffer } = require("../../common/utils/exporterUtils");

const filterQueryForNetworkRole = (req) => {
  if (req.user?.permissions.includes(tdbRoles.network)) {
    req.query.etablissement_reseaux = req.user.network;
  }
};

const filterQueryForCfaRole = (req) => {
  if (req.user?.permissions.includes(tdbRoles.cfa)) {
    req.query.uai_etablissement = req.user?.username;
  }
};

const applyUserRoleFilter = (req, _res, next) => {
  // users with network role should not be able to see data for other reseau
  filterQueryForNetworkRole(req);

  // users with cfa role should not be able to see data for other cfas
  filterQueryForCfaRole(req);

  next();
};

const commonEffectifsFilters = {
  etablissement_num_region: Joi.string().allow(null, ""),
  etablissement_num_departement: Joi.string().allow(null, ""),
  formation_cfd: Joi.string().allow(null, ""),
  uai_etablissement: Joi.string().allow(null, ""),
  siret_etablissement: Joi.string().allow(null, ""),
  etablissement_reseaux: Joi.string().allow(null, ""),
};

const getCacheKeyForRoute = (route, filters) => {
  // we use json-stringify-deterministic to make sure that {a: 1, b: 2} stringified is the same as {b: 2, a: 1}
  return `${route}:${stringify(filters)}`;
};

module.exports = ({ stats, effectifs, cfas, formations, userEvents, cache }) => {
  const router = express.Router();

  /**
   * Gets nb organismes formation
   */
  router.get(
    "/total-organismes",
    applyUserRoleFilter,
    validateRequestQuery(Joi.object(commonEffectifsFilters)),
    tryCatch(async (req, res) => {
      const nbOrganismes = await stats.getNbDistinctCfasByUai(req.query);

      return res.json({
        nbOrganismes,
      });
    })
  );

  /**
   * Gets the effectifs count for input period & query
   */
  router.get(
    "/",
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      // Gets & format params:
      const { date: dateFromParams, ...filtersFromBody } = req.query;
      const date = new Date(dateFromParams);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: getAnneeScolaireFromDate(date),
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(req.path, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const response = {
          date,
          apprentis: await effectifs.apprentis.getCountAtDate(date, filters),
          rupturants: await effectifs.rupturants.getCountAtDate(date, filters),
          inscritsSansContrat: await effectifs.inscritsSansContrats.getCountAtDate(date, filters),
          abandons: await effectifs.abandons.getCountAtDate(date, filters),
        };
        // cache the result
        await cache.set(cacheKey, JSON.stringify(response));
        return res.json(response);
      }
    })
  );

  /**
   * Export xlsx of the effectifs data lists for input period & query
   */
  router.get(
    "/export-xlsx-data-lists",
    permissionsMiddleware([tdbRoles.cfa]),
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        effectif_indicateur: Joi.string().required(),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      // Gets & format params:
      // eslint-disable-next-line no-unused-vars
      const { date: dateFromParams, effectif_indicateur: effectifIndicateurFromParams, ...filtersFromBody } = req.query;
      const date = new Date(dateFromParams);
      const filters = { ...filtersFromBody, annee_scolaire: getAnneeScolaireFromDate(date) };

      // create event
      await userEvents.create({
        action: "export-xlsx-data-lists",
        username: req.user.username,
        data: req.query,
      });

      // Build effectifs data formatted for date
      const effectifsFormattedAtDate = await buildEffectifsFormattedAtDate(effectifIndicateurFromParams, date, filters);

      // Get cfas infos for headers
      const cfaInfos = await cfas.getFromUai(req.query.uai_etablissement);

      // Build headers
      const headers = [
        ["Liste nominative des effectifs"],
        [`${cfaInfos.nom} - UAI : ${cfaInfos.uai} - SIRET : ${cfaInfos.sirets.join(",")}`],
        [
          "Si vous constatez une ou plusieurs anomalie(s), merci d'envoyer un mail à tableau-de-bord@apprentissage.beta.gouv.fr",
        ],
      ];

      // Build & return xlsx stream
      const xlsxStream = await toXlsxBuffer(headers, effectifsFormattedAtDate, "Données Tdb");
      return res.attachment("export-xlsx-data-lists.xlsx").send(xlsxStream);
    })
  );

  /**
   * Build a list of effectif data well-formatted for specific indicator, date & filters
   * @param {*} effectifIndicateurFromParams
   * @param {*} date
   * @param {*} filters
   * @returns
   */
  const buildEffectifsFormattedAtDate = async (effectifIndicateurFromParams, date, filters) => {
    let effectifsFormattedAtDate;

    const projection = {
      uai_etablissement: 1,
      siret_etablissement: 1,
      nom_etablissement: 1,
      nom_apprenant: 1,
      prenom_apprenant: 1,
      date_de_naissance_apprenant: 1,
      formation_cfd: 1,
      formation_rncp: 1,
      libelle_long_formation: 1,
      annee_formation: 1,
      annee_scolaire: 1,
      contrat_date_debut: 1,
      contrat_date_rupture: 1,
      date_metier_mise_a_jour_statut: 1,
      historique_statut_apprenant: 1,
      statut_apprenant_at_date: 1,
    };

    // Build data list for indicator
    switch (effectifIndicateurFromParams) {
      case effectifsIndicators.apprentis:
        effectifsFormattedAtDate = (await effectifs.apprentis.getListAtDate(date, filters, { projection })).map(
          (item) => ({
            ...item,
            statut: getStatutNameFromCode(item.statut_apprenant_at_date.valeur_statut),
            historique_statut_apprenant: JSON.stringify(
              item.historique_statut_apprenant.map((item) => ({
                date: item.date_statut,
                statut: getStatutNameFromCode(item.valeur_statut),
              }))
            ),
          })
        );
        break;

      case effectifsIndicators.abandons:
        effectifsFormattedAtDate = (await effectifs.abandons.getListAtDate(date, filters, { projection })).map(
          (item) => ({
            ...item,
            statut: getStatutNameFromCode(item.statut_apprenant_at_date.valeur_statut),
            date_abandon: item.statut_apprenant_at_date.date_statut, // Specific for abandons indicateur
            historique_statut_apprenant: JSON.stringify(
              item.historique_statut_apprenant.map((item) => ({
                date: item.date_statut,
                statut: getStatutNameFromCode(item.valeur_statut),
              }))
            ),
          })
        );
        break;

      case effectifsIndicators.inscritsSansContrats:
        effectifsFormattedAtDate = (
          await effectifs.inscritsSansContrats.getListAtDate(date, filters, { projection })
        ).map((item) => ({
          ...item,
          statut: getStatutNameFromCode(item.statut_apprenant_at_date.valeur_statut),
          date_inscription: item.statut_apprenant_at_date.date_statut, // Specific for inscrits sans contrats indicateur
          historique_statut_apprenant: JSON.stringify(
            item.historique_statut_apprenant.map((item) => ({
              date: item.date_statut,
              statut: getStatutNameFromCode(item.valeur_statut),
            }))
          ),
        }));
        break;

      case effectifsIndicators.rupturants:
        effectifsFormattedAtDate = (await effectifs.rupturants.getListAtDate(date, filters, { projection })).map(
          (item) => ({
            ...item,
            statut: getStatutNameFromCode(item.statut_apprenant_at_date.valeur_statut),
            historique_statut_apprenant: JSON.stringify(
              item.historique_statut_apprenant.map((item) => ({
                date: item.date_statut,
                statut: getStatutNameFromCode(item.valeur_statut),
              }))
            ),
          })
        );
        break;

      default:
        break;
    }

    // Omit useless data
    return effectifsFormattedAtDate.map((item) => {
      return omit(item, ["_id", "statut_apprenant_at_date", "date_metier_mise_a_jour_statut"]);
    });
  };

  /**
   * Get effectifs details by niveau_formation
   */
  router.get(
    "/niveau-formation",
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      const { date: dateFromParams, ...filtersFromBody } = req.query;
      const date = new Date(dateFromParams);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: getAnneeScolaireFromDate(date),
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(req.path, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const effectifsParNiveauFormation = await effectifs.getEffectifsCountByNiveauFormationAtDate(date, filters);
        await cache.set(cacheKey, JSON.stringify(effectifsParNiveauFormation));
        return res.json(effectifsParNiveauFormation);
      }
    })
  );

  /**
   * Get effectifs details by formation_cfd
   */
  router.get(
    "/formation",
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        niveau_formation: Joi.string().allow(null, ""),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      const { date: dateFromParams, ...filtersFromBody } = req.query;
      const date = new Date(dateFromParams);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: getAnneeScolaireFromDate(date),
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(req.path, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const effectifsParFormation = await effectifs.getEffectifsCountByFormationAtDate(date, filters);
        await cache.set(cacheKey, JSON.stringify(effectifsParFormation));
        return res.json(effectifsParFormation);
      }
    })
  );

  /**
   * Get effectifs details by annee_formation
   */
  router.get(
    "/annee-formation",
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      const { date: dateFromParams, ...filtersFromBody } = req.query;
      const date = new Date(dateFromParams);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: getAnneeScolaireFromDate(date),
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(req.path, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const effectifsParAnneeFormation = await effectifs.getEffectifsCountByAnneeFormationAtDate(date, filters);
        await cache.set(cacheKey, JSON.stringify(effectifsParAnneeFormation));

        return res.json(effectifsParAnneeFormation);
      }
    })
  );

  /**
   * Get effectifs details by cfa
   */
  router.get(
    "/cfa",
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      const { date: dateFromQuery, ...filtersFromBody } = req.query;
      const date = new Date(dateFromQuery);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: getAnneeScolaireFromDate(date),
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(req.path, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const effectifsByCfaAtDate = await effectifs.getEffectifsCountByCfaAtDate(date, filters);
        await cache.set(cacheKey, JSON.stringify(effectifsByCfaAtDate));

        return res.json(effectifsByCfaAtDate);
      }
    })
  );

  /**
   * Get effectifs details by departement
   */
  router.get(
    "/departement",
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      const { date: dateFromQuery, ...filtersFromBody } = req.query;
      const date = new Date(dateFromQuery);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: getAnneeScolaireFromDate(date),
      };

      // try to retrieve from cache
      const cacheKey = getCacheKeyForRoute(req.path, {
        date: format(date, "yyyy-MM-dd"),
        filters,
      });
      const fromCache = await cache.get(cacheKey);

      if (fromCache) {
        return res.json(JSON.parse(fromCache));
      } else {
        const effectifsByDepartementAtDate = await effectifs.getEffectifsCountByDepartementAtDate(date, filters);
        await cache.set(cacheKey, JSON.stringify(effectifsByDepartementAtDate));
        return res.json(effectifsByDepartementAtDate);
      }
    })
  );

  router.get(
    "/export-csv-repartition-effectifs-par-organisme",
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      // build filters from req.query
      const { date: dateFromQuery, ...filtersFromBody } = req.query;
      const date = new Date(dateFromQuery);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: getAnneeScolaireFromDate(date),
      };

      // create event
      await userEvents.create({
        action: "export-csv-repartition-effectifs-par-organisme",
        username: req.user.username,
        data: req.query,
      });

      const effectifsByCfaAtDate = await effectifs.getEffectifsCountByCfaAtDate(date, filters);
      const formattedForCsv = await Promise.all(
        effectifsByCfaAtDate.map(async ({ uai_etablissement, nom_etablissement, effectifs }) => {
          const cfa = await cfas.getFromUai(uai_etablissement);
          return {
            DEPARTEMENT: getDepartementCodeFromUai(uai_etablissement),
            RESEAUX: cfa.reseaux?.length > 0 ? JSON.stringify(cfa.reseaux) : "",
            "NOM DE L'ÉTABLISSEMENT": nom_etablissement,
            UAI: uai_etablissement,
            SIRET: cfa.sirets?.length > 0 ? JSON.stringify(cfa.sirets) : "",
            APPRENTIS: effectifs.apprentis,
            "SANS CONTRAT": effectifs.inscritsSansContrat,
            RUPTURANTS: effectifs.rupturants,
            ABANDONS: effectifs.abandons,
          };
        })
      );

      const csv = await parseAsync(formattedForCsv);

      return res.attachment("export-csv-repartition-effectifs-par-organisme.csv").send(csv);
    })
  );

  router.get(
    "/export-csv-repartition-effectifs-par-formation",
    applyUserRoleFilter,
    validateRequestQuery(
      Joi.object({
        date: Joi.date().required(),
        ...commonEffectifsFilters,
      })
    ),
    tryCatch(async (req, res) => {
      // build filters from req.query
      const { date: dateFromQuery, ...filtersFromBody } = req.query;
      const date = new Date(dateFromQuery);
      const filters = {
        ...filtersFromBody,
        annee_scolaire: getAnneeScolaireFromDate(date),
      };

      // create event
      await userEvents.create({
        action: "export-csv-repartition-effectifs-par-formation",
        username: req.user.username,
        data: req.query,
      });

      const effectifsParFormation = await effectifs.getEffectifsCountByFormationAndDepartementAtDate(date, filters);
      const formattedForCsv = await Promise.all(
        effectifsParFormation.map(async ({ formation_cfd, departement, intitule, effectifs }) => {
          const formation = await formations.getFormationWithCfd(formation_cfd);
          return {
            DEPARTEMENT: departement,
            NIVEAU: formation?.niveau,
            "INTITULE NIVEAU": formation?.niveau_libelle,
            "INTITULE DE LA FORMATION": intitule,
            CFD: formation_cfd,
            APPRENTIS: effectifs.apprentis,
            "SANS CONTRAT": effectifs.inscritsSansContrat,
            RUPTURANTS: effectifs.rupturants,
            ABANDONS: effectifs.abandons,
          };
        })
      );

      const csv = await parseAsync(formattedForCsv);

      return res.attachment("export-csv-repartition-effectifs-par-formation.csv").send(csv);
    })
  );

  return router;
};
