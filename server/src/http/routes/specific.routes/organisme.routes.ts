import express from "express";
import { compact, get } from "lodash-es";

import {
  findOrganismeByUai,
  getSousEtablissementsForUai,
} from "../../../common/actions/organismes/organismes.actions.js";
import { findEffectifs } from "../../../common/actions/effectifs.actions.js";
import { generateSifa, isEligibleSIFA } from "../../../common/actions/sifa.actions/sifa.actions.js";
import { uaiSchema, validateFullObjectSchema } from "../../../common/utils/validationUtils.js";

export default () => {
  const router = express.Router();

  router.get(
    "/effectifs",
    // permissionsOrganismeMiddleware(["organisme/page_effectifs"]),
    async ({ query: { organisme_id, sifa } }, res) => {
      const effectifsDb = await findEffectifs(organisme_id);

      const effectifs: any[] = [];

      const requiredFieldsSifa = [
        "apprenant.nom",
        "apprenant.prenom",
        "apprenant.date_de_naissance",
        "apprenant.code_postal_de_naissance",
        "apprenant.sexe",
        "apprenant.derniere_situation",
        "apprenant.dernier_organisme_uai",
        "apprenant.organisme_gestionnaire",
        "formation.duree_formation_relle",
      ];

      const requiredApprenantAdresseFieldsSifa = [
        "apprenant.adresse.voie",
        "apprenant.adresse.code_postal",
        "apprenant.adresse.commune",
      ];

      for (const effectifDb of effectifsDb) {
        const { _id, id_erp_apprenant, source, annee_scolaire, validation_errors, apprenant, formation } = effectifDb;

        let historique_statut = apprenant.historique_statut;
        const effectif = {
          id: _id.toString(),
          id_erp_apprenant,
          organisme_id,
          annee_scolaire,
          source,
          validation_errors,
          formation,
          nom: apprenant.nom,
          prenom: apprenant.prenom,
          historique_statut,
          ...(sifa
            ? {
                requiredSifa: compact(
                  [
                    ...(!apprenant.adresse?.complete
                      ? [...requiredFieldsSifa, ...requiredApprenantAdresseFieldsSifa]
                      : requiredFieldsSifa),
                  ].map((fieldName) =>
                    !get(effectifDb, fieldName) || get(effectifDb, fieldName) === "" ? fieldName : undefined
                  )
                ),
              }
            : {}),
        };

        if (sifa) {
          if (isEligibleSIFA({ historique_statut })) {
            effectifs.push(effectif);
          }
        } else {
          effectifs.push(effectif);
        }
      }

      return res.json(effectifs);
    }
  );

  router.get(
    "/sifa/export-csv-list",
    // permissionsOrganismeMiddleware(["organisme/page_sifa/telecharger"]),
    async ({ query: { organisme_id } }, res) => {
      const sifaCsv = await generateSifa(organisme_id);

      return res.attachment(`tdb-données-sifa-${organisme_id}.csv`).send(sifaCsv);
    }
  );

  const getByUaiSchema = {
    uai: uaiSchema(),
  };
  /**
   * Gets the dashboard data for cfa
   */
  router.get("/:uai", async (req, res) => {
    const { uai } = await validateFullObjectSchema(req.params, getByUaiSchema);
    const organisme = await findOrganismeByUai(uai);
    if (!organisme) {
      return res.status(404).json({ message: `No cfa found for UAI ${uai}` });
    }

    const sousEtablissements = await getSousEtablissementsForUai(uai);
    return res.json({
      libelleLong: organisme.nom,
      reseaux: organisme.reseaux,
      domainesMetiers: organisme.metiers,
      uai: organisme.uai,
      nature: organisme.nature,
      nature_validity_warning: organisme.nature_validity_warning,
      adresse: organisme.adresse,
      sousEtablissements,
    });
  });

  return router;
};
