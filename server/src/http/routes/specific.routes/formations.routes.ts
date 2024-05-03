import Boom from "boom";
import express from "express";

import { organismesDb, formationsCatalogueDb } from "@/common/model/collections";
import { returnResult } from "@/http/middlewares/helpers";

export default () => {
  const router = express.Router();

  router.get("/", returnResult(getFormation));

  return router;
};

const getFormation = async (req, res) => {
  const organismeId = res.locals.organismeId;
  const organisme = await organismesDb().findOne({ _id: organismeId });

  if (!organisme) {
    throw Boom.notFound(`Unable to find organisme ${organismeId.toString()}`);
  }

  if (!organisme.relatedFormations || organisme.relatedFormations.length === 0) {
    return [];
  }

  const formations = await formationsCatalogueDb()
    .find({
      cle_ministere_educatif: {
        $in: organisme.relatedFormations
          .map(({ cle_ministere_educatif }) => cle_ministere_educatif)
          .filter((item): item is string => !!item),
      },
    })
    .project({
      cfd: 1,
      rncp_code: 1,
      intitule_long: 1,
      annee: 1,
      etablissement_formateur_siret: 1,
      etablissement_formateur_uai: 1,
      etablissement_gestionnaire_siret: 1,
      etablissement_gestionnaire_uai: 1,
    })
    .toArray();

  const allUaiSiretCouple: any = formations.reduce((acc: any, curr) => {
    return [
      ...acc,
      { uai: curr.etablissement_formateur_uai, siret: curr.etablissement_formateur_siret },
      { uai: curr.etablissement_gestionnaire_uai, siret: curr.etablissement_gestionnaire_siret },
    ];
  }, []);

  const orga = await organismesDb()
    .find({
      $or: allUaiSiretCouple,
    })
    .project({
      nom: 1,
      uai: 1,
      siret: 1,
    })
    .toArray();

  const orgaMap = orga.reduce((acc, curr) => {
    return {
      ...acc,
      [`${curr.uai}-${curr.siret}`]: curr,
    };
  }, {});

  const formationsWithOrganisme = formations.map(
    ({
      etablissement_formateur_uai,
      etablissement_formateur_siret,
      etablissement_gestionnaire_uai,
      etablissement_gestionnaire_siret,
      ...f
    }) => ({
      ...f,
      formateur: orgaMap[`${etablissement_formateur_uai}-${etablissement_formateur_siret}`],
      responsable: orgaMap[`${etablissement_gestionnaire_uai}-${etablissement_gestionnaire_siret}`],
    })
  );

  return formationsWithOrganisme;
};
