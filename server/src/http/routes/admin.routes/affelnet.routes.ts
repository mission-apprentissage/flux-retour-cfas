import { PromisePool } from "@supercharge/promise-pool";
import express from "express";
import { ObjectId } from "mongodb";
import { IVoeuAffelnetRaw, zVoeuAffelnet } from "shared/models/data/voeuxAffelnet.model";
import { z } from "zod";

import parentLogger from "@/common/logger";
import { formationsCatalogueDb, organismesDb, voeuxAffelnetDb } from "@/common/model/collections";
import { returnResult } from "@/http/middlewares/helpers";
import validateRequestMiddleware from "@/http/middlewares/validateRequestMiddleware";

const logger = parentLogger.child({
  module: "affelnet-route-admin",
});

export default () => {
  const router = express.Router();

  router.post(
    "/create",
    validateRequestMiddleware({ body: z.array(zVoeuAffelnet.shape.raw) }),
    returnResult(createVoeux)
  );

  return router;
};
const findDeletedVoeux = async (date: Date) => {
  const currentDate = new Date();
  const aggregation = [
    {
      $group: {
        _id: "$voeu_id",
        data: {
          $top: {
            output: ["$_id", "$created_at", "$revision"],
            sortBy: {
              revision: -1,
            },
          },
        },
      },
    },
    {
      $project: {
        _id: {
          $arrayElemAt: ["$data", 0],
        },
        voeu_id: "$_id",
        created_at: {
          $arrayElemAt: ["$data", 1],
        },
        revision: {
          $arrayElemAt: ["$data", 2],
        },
      },
    },
    {
      $match: {
        created_at: {
          $lt: date,
        },
      },
    },
  ];

  const cursor = voeuxAffelnetDb().aggregate(aggregation);
  while (await cursor.hasNext()) {
    const voeu = await cursor.next();
    if (voeu) {
      await voeuxAffelnetDb().updateOne({ _id: voeu._id }, { $set: { deleted_at: currentDate } });
    }
  }
};

const createVoeux = async (req) => {
  const currentDate = new Date();
  const voeuxArray = req.body as Array<IVoeuAffelnetRaw>;

  await PromisePool.withConcurrency(10)
    .for(voeuxArray)
    .process(async (voeuRaw: IVoeuAffelnetRaw) => {
      try {
        const voeu: any = {
          _id: new ObjectId(),
          voeu_id: null,
          revision: null,
          organisme_formateur_id: null,
          organisme_responsable_id: null,
          formation_catalogue_id: null,
          created_at: currentDate,
          is_contacted: false,
          raw: voeuRaw,
          _computed: {
            formation: {},
          },
        };

        if (!voeuRaw.cle_ministere_educatif) {
          voeu.voeu_id = new ObjectId(); // Risque de créer des doublons pour les voeux sans cle entre 2 imports
          await voeuxAffelnetDb().insertOne(voeu);
        }

        const formationsCatalogue = await formationsCatalogueDb().findOne(
          {
            cle_ministere_educatif: voeuRaw.cle_ministere_educatif,
          },
          {
            projection: {
              etablissement_gestionnaire_siret: 1,
              etablissement_gestionnaire_uai: 1,
              etablissement_formateur_siret: 1,
              etablissement_formateur_uai: 1,
              onisep_intitule: 1,
              rncp_code: 1,
              cfd: 1,
            },
          }
        );

        if (
          !formationsCatalogue ||
          !formationsCatalogue.etablissement_gestionnaire_uai ||
          !formationsCatalogue.etablissement_gestionnaire_siret ||
          !formationsCatalogue.etablissement_formateur_uai ||
          !formationsCatalogue.etablissement_formateur_siret
        ) {
          logger.error(`${voeuRaw.cle_ministere_educatif} not found`);
          return;
        }
        voeu.formation_catalogue_id = formationsCatalogue._id;
        voeu._computed.formation.libelle = formationsCatalogue.onisep_intitule;
        voeu._computed.formation.rncp = formationsCatalogue.rncp_code;
        voeu._computed.formation.cfd = formationsCatalogue.cfd;

        const orgaResponsable = await organismesDb().findOne({
          uai: formationsCatalogue.etablissement_gestionnaire_uai,
          siret: formationsCatalogue.etablissement_gestionnaire_siret,
        });

        const orgaFormateur = await organismesDb().findOne({
          uai: formationsCatalogue.etablissement_formateur_uai,
          siret: formationsCatalogue.etablissement_formateur_siret,
        });

        if (!orgaFormateur || !orgaResponsable) {
          logger.error(
            `${formationsCatalogue.etablissement_gestionnaire_uai}/${formationsCatalogue.etablissement_gestionnaire_siret} or ${formationsCatalogue.etablissement_formateur_uai}/${formationsCatalogue.etablissement_formateur_siret} not found`
          );
          return;
        }

        voeu.organisme_formateur_id = orgaFormateur._id;
        voeu.organisme_responsable_id = orgaResponsable._id;

        const previous = await voeuxAffelnetDb().findOne(
          {
            "raw.ine": voeuRaw.ine,
            "raw.cle_ministere_educatif": voeuRaw.cle_ministere_educatif,
          },
          {
            sort: { revision: -1 },
          }
        );

        voeu.voeu_id = previous ? previous.voeu_id : new ObjectId();
        voeu.revision = previous ? previous.revision + 1 : 1;

        await voeuxAffelnetDb().insertOne(voeu);
      } catch (e) {
        logger.error(e);
      }
    });

  await findDeletedVoeux(currentDate);
  return;
};
