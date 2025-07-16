import { captureException } from "@sentry/node";
import { PromisePool } from "@supercharge/promise-pool";
import { parse } from "csv-parse/sync";
import express from "express";
import { ObjectId } from "mongodb";
import multer from "multer";
import { getAcademieById } from "shared/constants";
import { IVoeuAffelnetRaw } from "shared/models/data/voeuxAffelnet.model";

import { generateOrganismeComputed } from "@/common/actions/organismes/organismes.actions";
import parentLogger from "@/common/logger";
import { formationsCatalogueDb, organismesDb, voeuxAffelnetDb } from "@/common/model/collections";
import { returnResult } from "@/http/middlewares/helpers";

const AFFELNET_HEADER = [
  "academie",
  "ine",
  "nom",
  "prenom_1",
  "prenom_2",
  "prenom_3",
  "adresse_1",
  "adresse_2",
  "adresse_3",
  "adresse_4",
  "code_postal",
  "ville",
  "pays",
  "telephone",
  "telephone_pro",
  "telephone_portable",
  "telephone_responsable_1",
  "telephone_responsable_2",
  "mail_responsable_1",
  "mail_responsable_2",
  "mnemonique_mef_origine",
  "code_mef_origine",
  "libelle_formation_origine",
  "code_origine_1",
  "libelle_option_1",
  "code_origine_2",
  "libelle_option_2",
  "code_lv1",
  "libelle_lv1",
  "code_lv2",
  "libelle_lv2",
  "code_uai_etab_origine",
  "type_etab_origine",
  "libelle_etab_origine",
  "ville_etab_origine",
  "code_uai_cio_origine",
  "libelle_cio_origine",
  "rang",
  "code_offre_formation",
  "code_mef",
  "bareme",
  "mnemonique_mef_offre_formation",
  "code_specialite_offre_formation",
  "libelle_formation",
  "code_enseignement",
  "libelle_enseignement",
  "candidature_internat",
  "demande_code_lv1",
  "demande_libelle_lv1",
  "demande_code_lv2",
  "demande_libelle_lv2",
  "code_uai_etab_accueil",
  "type_etab_accueil",
  "libelle_etab_accueil",
  "ville_etab_accueil",
  "siret_uai_gestionnaire",
  "cle_ministere_educatif",
  "uai_cio_etab_accueil",
  "uai_etatblissement_formateur",
  "uai_etablissement_responsable",
  "libelle_public_etablissement",
  "annee_scolaire_rentree",
];

const logger = parentLogger.child({
  module: "affelnet-route-admin",
});

// Check right directory in docker
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export default () => {
  const router = express.Router();

  router.post("/create", upload.single("csvfile"), returnResult(createVoeux));

  return router;
};

const findDeletedVoeux = async (date: Date) => {
  const currentDate = new Date();

  const cursor = voeuxAffelnetDb().find({ updated_at: { $lt: date } });
  while (await cursor.hasNext()) {
    const voeu = await cursor.next();
    if (voeu) {
      await voeuxAffelnetDb().updateOne({ _id: voeu._id }, { $set: { deleted_at: currentDate } });
    }
  }
};

const parseCsvFile = async (buffer: Buffer) => {
  const records = parse(buffer, {
    columns: AFFELNET_HEADER,
    skip_empty_lines: true,
    delimiter: ";",
  });
  return records;
};

const createVoeux = async (req, res) => {
  const file = req.file;
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const parsedCSV: Array<IVoeuAffelnetRaw> = await parseCsvFile(file.buffer);
  const currentDate = new Date();

  await PromisePool.withConcurrency(100)
    .for(parsedCSV)
    .process(async (voeuRaw: IVoeuAffelnetRaw) => {
      const voeu: any = {
        _id: new ObjectId(),
        organisme_formateur_id: null,
        organisme_responsable_id: null,
        formation_catalogue_id: null,
        created_at: currentDate,
        updated_at: currentDate,
        is_contacted: false,
        history: [],
        annee_scolaire_rentree: voeuRaw.annee_scolaire_rentree,
        raw: voeuRaw,
        _computed: {
          formation: {},
          organisme: {},
        },
      };

      if (!voeuRaw.cle_ministere_educatif) {
        logger.error(`Pas de cle_ministere_educatif`);
        return;
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

      voeu._computed.organisme = generateOrganismeComputed(orgaFormateur);

      voeu.organisme_formateur_id = orgaFormateur._id;
      voeu.organisme_responsable_id = orgaResponsable._id;
      voeu.academie_code = getAcademieById(voeuRaw.academie)?.code;

      const previous = await voeuxAffelnetDb().findOne({
        "raw.ine": voeuRaw.ine,
        "raw.cle_ministere_educatif": voeuRaw.cle_ministere_educatif,
      });
      try {
        if (!previous) {
          await voeuxAffelnetDb().insertOne(voeu);
        } else {
          await voeuxAffelnetDb().updateOne(
            { _id: previous._id },
            {
              $set: {
                organisme_formateur_id: voeu.organisme_formateur_id,
                organisme_responsable_id: voeu.organisme_responsable_id,
                formation_catalogue_id: voeu.formation_catalogue_id,
                is_contacted: false,
                _computed: voeu._computed,
                updated_at: currentDate,
              },
              $push: {
                history: {
                  created_at: currentDate,
                  raw: voeu.raw,
                },
              },
            }
          );
        }
      } catch (e) {
        captureException(e);
        logger.error(e);
      }
    });

  logger.info("Voeux mis à jour");
  logger.info("Lancement de la recherche des voeux supprimés");
  await findDeletedVoeux(currentDate);
  logger.info("Fin de la recherche des voeux supprimés");
  return;
};
