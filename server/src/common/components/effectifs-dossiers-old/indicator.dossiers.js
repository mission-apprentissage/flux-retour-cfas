import { dossiersApprenantsDb } from "../../model/collections.js";

export class IndicatorFromDossiersOld {
  /**
   * Constructeur avec définition d'une projection d'export par défaut
   */
  constructor() {
    this.exportProjection = {
      uai_etablissement: 1,
      siret_etablissement: 1,
      etablissement_nom_departement: 1,
      etablissement_nom_region: 1,
      etablissement_reseaux: 1,
      nom_etablissement: 1,
      nom_apprenant: 1,
      prenom_apprenant: 1,
      date_de_naissance_apprenant: 1,
      formation_cfd: 1,
      formation_rncp: 1,
      libelle_long_formation: 1,
      annee_formation: 1,
      periode_formation: 1,
      annee_scolaire: 1,
      contrat_date_debut: 1,
      contrat_date_fin: 1,
      contrat_date_rupture: 1,
      historique_statut_apprenant: 1,
      statut_apprenant_at_date: 1,
    };
  }

  /**
   * Décompte du nombre de jeunes correspondant à cet indicateur à la date donnée
   * @param {*} searchDate Date de recherche
   * @param {*} filters Filtres optionnels
   * @param {*} options Options de regroupement / projection optionnelles
   * @returns
   */
  async getCountAtDate(searchDate, filters = {}, options = {}) {
    const groupedBy = options.groupedBy ?? { _id: null, count: { $sum: 1 } };
    const aggregationPipeline = this.getAtDateAggregationPipeline(searchDate, filters, options);
    const groupedAggregationPipeline = [...aggregationPipeline, { $group: groupedBy }];
    const result = await dossiersApprenantsDb().aggregate(groupedAggregationPipeline).toArray();

    if (!options.groupedBy) {
      return result.length === 1 ? result[0].count : 0;
    }
    return result;
  }

  /**
   * Liste tous les DossierApprenant correspondants à cet indicateur à la date donnée
   * @param {*} searchDate Date de recherche
   * @param {*} filters Filtres optionnels
   * @param {*} options Options de regroupement / projection optionnelles
   * @returns
   */
  async getListAtDate(searchDate, filters = {}, options = {}) {
    const aggregationPipeline = await this.getAtDateAggregationPipeline(searchDate, filters, options);
    const result = await dossiersApprenantsDb().aggregate(aggregationPipeline).toArray();
    return result ?? [];
  }

  /**
   * Pipeline de récupération des effectifs avec un statut donné à une date donnée - Principe :
   * 1. On filtre dans l'historique sur les éléments ayant une date <= date recherchée
   * 2. On construit dans l'historique des statuts un champ diff_date_search = différence entre la date du statut de l'historique et la date recherchée
   * 3. On crée un champ statut_apprenant_at_date = statut dans l'historique avec le plus petit diff_date_search
   */
  getEffectifsWithStatutAtDateAggregationPipeline(date, projection = {}) {
    return [
      // Filtrage sur les élements avec date antérieure à la date recherchée
      {
        $project: {
          ...projection,
          historique_statut_apprenant: {
            $filter: {
              input: "$historique_statut_apprenant",
              as: "result",
              // Filtre dans l'historique sur les valeurs ayant une date antérieure à la date de recherche
              cond: {
                $lte: ["$$result.date_statut", date],
              },
            },
          },
        },
      },
      // on élimine les historique vides (un dossier sur lequel on aurait un seul élément à une date ultérieure à celle donnée)
      {
        $match: { historique_statut_apprenant: { $not: { $size: 0 } } },
      },
      // on trie les historique par date_statut puis par date_reception si date_statut identiques (cas régulier)
      {
        $project: {
          ...projection,
          historique_statut_apprenant: {
            $sortArray: {
              input: "$historique_statut_apprenant",
              sortBy: { date_statut: 1, date_reception: 1 },
            },
          },
        },
      },
      // on récupère le dernier élément, considéré comme le statut à la date donnée
      {
        $addFields: {
          statut_apprenant_at_date: {
            $last: "$historique_statut_apprenant",
          },
        },
      },
    ];
  }

  /**
   * Fonction de récupération de la liste des apprentis anonymisée et formatée pour un export à une date donnée
   * @param {*} searchDate
   * @param {*} filters
   * @returns
   */
  async getFullExportFormattedListAtDate(searchDate, filters = {}, indicateur, namedDataMode = false) {
    return (await this.getExportFormattedListAtDate(searchDate, filters, indicateur)).map((item) => ({
      ...item,
      indicateur,
      nom_apprenant: namedDataMode === true ? item.nom_apprenant : undefined,
      prenom_apprenant: namedDataMode === true ? item.prenom_apprenant : undefined,
      date_de_naissance_apprenant: namedDataMode === true ? item.date_de_naissance_apprenant : undefined,
      date_debut_formation: item.periode_formation ? item.periode_formation[0] : null,
      date_fin_formation: item.periode_formation ? item.periode_formation[1] : null,
    }));
  }
}
