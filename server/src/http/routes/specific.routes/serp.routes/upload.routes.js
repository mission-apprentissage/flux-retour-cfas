import express from "express";
import tryCatch from "../../../middlewares/tryCatchMiddleware.js";
import Joi from "joi";
import { createWriteStream } from "fs";
import { ObjectId } from "mongodb";
import { DateTime } from "luxon";
import csvToJson from "convert-csv-to-json";
import { accumulateData, oleoduc, writeData } from "oleoduc";
import multiparty from "multiparty";
import { EventEmitter } from "events";
import { PassThrough } from "stream";
import { cloneDeep, find, get, set, uniqBy } from "lodash-es";
import { getFromStorage, uploadToStorage, deleteFromStorage } from "../../../../common/utils/ovhUtils.js";
import logger from "../../../../common/logger.js";
import * as crypto from "../../../../common/utils/cryptoUtils.js";
import {
  addDocument,
  createUpload,
  getDocument,
  getUploadEntryByOrgaId,
  removeDocument,
  updateDocument,
} from "../../../../common/actions/uploads.actions.js";
import { getJsonFromXlsxData } from "../../../../common/utils/xlsxUtils.js";
import { hydrateEffectif } from "../../../../common/actions/engine/engine.actions.js";
import { uploadsDb } from "../../../../common/model/collections.js";
import { createEffectif, findEffectifs, updateEffectif } from "../../../../common/actions/effectifs.actions.js";
import permissionsOrganismeMiddleware from "../../../middlewares/permissionsOrganismeMiddleware.js";
import { findOrganismeFormationByCfd } from "../../../../common/actions/organismes/organismes.formations.actions.js";
import {
  getFormationWithCfd,
  getFormationWithRNCP,
  findFormationById,
} from "../../../../common/actions/formations.actions.js";
import { setOrganismeTransmissionDates } from "../../../../common/actions/organismes/organismes.actions.js";
import { sendServerEventsForUser } from "../server-events.routes.js";

const mappingModel = {
  annee_scolaire: "annee_scolaire",
  CFD: "formation.cfd",
  RNCP: "formation.rncp",
  nom: "apprenant.nom",
  prenom: "apprenant.prenom",
  identifiant_unique_apprenant: "identifiant_unique_apprenant",
  annee_formation: "formation.annee",
  INE: "apprenant.ine",
  sexe: "apprenant.sexe",
  date_de_naissance: "apprenant.date_de_naissance",
  code_postal_de_naissance: "apprenant.code_postal_de_naissance",
  nationalite: "apprenant.nationalite",
  regime_scolaire: "apprenant.regime_scolaire",
  handicap: "apprenant.handicap",
  inscription_sportif_haut_niveau: "apprenant.inscription_sportif_haut_niveau",
  courriel: "apprenant.courriel",
  telephone: "apprenant.telephone",
  adresse_complete: "apprenant.adresse.complete",
  adresse_numero: "apprenant.adresse.numero",
  adresse_repetition_voie: "apprenant.adresse.repetition_voie",
  adresse_voie: "apprenant.adresse.voie",
  adresse_complement: "apprenant.adresse.complement",
  adresse_code_postal: "apprenant.adresse.code_postal",
  adresse_code_commune_insee: "apprenant.adresse.code_insee",
  adresse_commune: "apprenant.adresse.commune",
  situation_avant_contrat: "apprenant.situation_avant_contrat",
  derniere_situation: "apprenant.derniere_situation",
  dernier_organisme_uai: "apprenant.dernier_organisme_uai",
  dernier_diplome: "apprenant.dernier_diplome",
  mineur_emancipe: "apprenant.mineur_emancipe",
  representant_legal_nom: "apprenant.representant_legal.nom",
  representant_legal_prenom: "apprenant.representant_legal.prenom",
  representant_legal_courriel: "apprenant.representant_legal.courriel",
  representant_legal_telephone: "apprenant.representant_legal.telephone",
  representant_legal_pcs: "apprenant.representant_legal.pcs",
  representant_legal_adresse_complete: "apprenant.representant_legal.adresse.complete",
  representant_legal_adresse_numero: "apprenant.representant_legal.adresse.numero",
  representant_legal_adresse_repetition_voie: "apprenant.representant_legal.adresse.repetition_voie",
  representant_legal_adresse_voie: "apprenant.representant_legal.adresse.voie",
  representant_legal_adresse_complement: "apprenant.representant_legal.adresse.complement",
  representant_legal_adresse_code_postal: "apprenant.representant_legal.adresse.code_postal",
  representant_legal_adresse_code_commune_insee: "apprenant.representant_legal.adresse.code_insee",
  representant_legal_adresse_commune: "apprenant.representant_legal.adresse.commune",
  dernier_statut: "apprenant.historique_statut.valeur_statut",
  date_dernier_statut: "apprenant.historique_statut.date_statut",
  dernier_contrat_siret: "apprenant.contrats.siret",
  dernier_contrat_type_employeur: "apprenant.contrats.type_employeur",
  dernier_contrat_nombre_de_salaries: "apprenant.contrats.nombre_de_salaries",
  dernier_contrat_adresse_complete: "apprenant.contrats.adresse.complete",
  dernier_contrat_adresse_numero: "apprenant.contrats.adresse.numero",
  dernier_contrat_adresse_repetition_voie: "apprenant.contrats.adresse.repetition_voie",
  dernier_contrat_adresse_voie: "apprenant.contrats.adresse.voie",
  dernier_contrat_adresse_complement: "apprenant.contrats.adresse.complement",
  dernier_contrat_adresse_code_postal: "apprenant.contrats.adresse.code_postal",
  dernier_contrat_adresse_code_commune_insee: "apprenant.contrats.adresse.code_insee",
  dernier_contrat_adresse_commune: "apprenant.contrats.adresse.commune",
  dernier_contrat_date_debut: "apprenant.contrats.date_debut",
  dernier_contrat_date_fin: "apprenant.contrats.date_fin",
  dernier_contrat_date_rupture: "apprenant.contrats.date_rupture",
};

function discard() {
  return createWriteStream("/dev/null");
}

function noop() {
  return new PassThrough();
}

export default ({ clamav }) => {
  const router = express.Router();

  function handleMultipartForm(req, res, organisme_id, callback) {
    let form = new multiparty.Form();
    const formEvents = new EventEmitter();
    // 'close' event is fired just after the form has been read but before file is scanned and uploaded to storage.
    // So instead of using form.on('close',...) we use a custom event to end response when everything is finished
    formEvents.on("terminated", async (e) => {
      if (e) {
        logger.error(e);
        return res.status(400).json({
          error:
            e.message === "Le fichier est trop volumineux"
              ? "Le fichier est trop volumineux"
              : "Le contenu du fichier est invalide",
        });
      }
      const { documents, models } = await getUploadEntryByOrgaId(organisme_id);
      return res.json({
        documents,
        models,
      });
    });

    form.on("error", () => {
      return res.status(400).json({ error: "Le contenu du fichier est invalide" });
    });
    form.on("part", async (part) => {
      if (
        part.headers["content-type"] !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
        part.headers["content-type"] !== "application/vnd.ms-excel" &&
        part.headers["content-type"] !== "text/csv"
      ) {
        form.emit("error", new Error("Le fichier n'est pas au bon format"));
        return part.pipe(discard());
      }

      if (!part.filename.endsWith(".xlsx") && !part.filename.endsWith(".xls") && !part.filename.endsWith(".csv")) {
        form.emit("error", new Error("Le fichier n'est pas au bon format"));
        return part.pipe(discard());
      }

      callback(part)
        .then(() => {
          if (!form.bytesExpected || form.bytesReceived === form.bytesExpected) {
            formEvents.emit("terminated");
          }
          part.resume();
        })
        .catch((e) => {
          formEvents.emit("terminated", e);
        });
    });

    form.parse(req);
  }

  router.post(
    "/",
    permissionsOrganismeMiddleware(["organisme/page_effectifs/televersement_document"]),
    tryCatch(async (req, res) => {
      sendServerEventsForUser(req.user._id, "Fichier en cours de téléversement...");

      let { organisme_id } = await Joi.object({
        organisme_id: Joi.string().required(),
      })
        .unknown()
        .validateAsync(req.query, { abortEarly: false });

      handleMultipartForm(req, res, organisme_id, async (part) => {
        let { test, organisme_id } = await Joi.object({
          test: Joi.boolean(),
          organisme_id: Joi.string().required(),
        }).validateAsync(req.query, { abortEarly: false });

        const fileName = `${DateTime.now().toFormat("dd-MM-yyyy-hh:mm")}_${part.filename}`;
        let path = `uploads/${organisme_id}/${fileName}`;
        let { scanStream, getScanResults } = await clamav.getScanner();
        let { hashStream, getHash } = crypto.checksum();

        await oleoduc(
          part,
          scanStream,
          hashStream,
          crypto.isCipherAvailable() ? crypto.cipher(organisme_id) : noop(),
          test ? noop() : await uploadToStorage(path, { contentType: part.headers["content-type"] })
        );

        if (part.byteCount > 10485760) {
          sendServerEventsForUser(req.user._id, "Fichier trop volumineux");

          throw new Error("Le fichier est trop volumineux");
        }

        let hash_fichier = await getHash();
        let { isInfected, viruses } = await getScanResults();
        if (isInfected) {
          if (!test) {
            logger.error(`Uploaded file ${path} is infected by ${viruses.join(",")}. Deleting file from storage...`);

            await deleteFromStorage(path);
          }
          throw new Error("Le contenu du fichier est invalide");
        }

        await addDocument(organisme_id, {
          ext_fichier: part.filename.split(".").pop(),
          hash_fichier,
          nom_fichier: fileName,
          chemin_fichier: path,
          taille_fichier: test ? 0 : part.byteCount,
          userEmail: req.user.email,
        });
        sendServerEventsForUser(req.user._id, "Fichier téléversé avec succès");
      });
    })
  );

  router.get(
    "/get",
    permissionsOrganismeMiddleware(["organisme/page_effectifs/televersement_document"]),
    tryCatch(async (req, res) => {
      let { organisme_id } = await Joi.object({
        organisme_id: Joi.string().required(),
      })
        .unknown()
        .validateAsync(req.query, { abortEarly: false });
      let upload = null;
      try {
        upload = await getUploadEntryByOrgaId(organisme_id, { last_snapshot_effectifs: 0 });
      } catch (/** @type {any}*/ error) {
        if (error.message.includes("Unable to find uploadEntry")) {
          upload = await createUpload({ organisme_id });
        }
      }
      return res.json(upload);
    })
  );

  router.post(
    "/setDocumentType",
    permissionsOrganismeMiddleware(["organisme/page_effectifs/televersement_document"]),
    tryCatch(async (req, res) => {
      let { organisme_id, type_document, nom_fichier, taille_fichier } = await Joi.object({
        organisme_id: Joi.string().required(),
        type_document: Joi.string().required(),
        nom_fichier: Joi.string().required(),
        taille_fichier: Joi.number().required(),
      })
        .unknown()
        .validateAsync(req.body, { abortEarly: false });

      const upload = await updateDocument(organisme_id, {
        nom_fichier,
        taille_fichier,
        type_document,
      });

      return res.json(upload);
    })
  );

  const getUnconfirmedDocumentContent = async (organisme_id) => {
    const uploads = await getUploadEntryByOrgaId(organisme_id);
    const unconfirmed = uploads.documents.filter((d) => !d.confirm);
    const stream = await getFromStorage(unconfirmed[0].chemin_fichier);
    let headers = [];
    let rawFileJson = [];
    await oleoduc(
      stream,
      crypto.isCipherAvailable() ? crypto.decipher(organisme_id) : noop(),
      accumulateData(
        (acc, value) => {
          return Buffer.concat([acc, Buffer.from(value)]);
        },
        { accumulator: Buffer.from(new Uint8Array()) }
      ),
      writeData(async (data) => {
        if (unconfirmed[0].ext_fichier === "csv") {
          const content = csvToJson.latin1Encoding().csvStringToJson(data.toString());
          headers = Object.keys(content[0]);
          rawFileJson = content;
        } else {
          let tmp = getJsonFromXlsxData(data, { raw: false, header: 1 }) || [];
          headers = tmp[0];
          rawFileJson = getJsonFromXlsxData(data, { raw: false, dateNF: "dd/MM/yyyy" }) || [];
        }
      })
    );
    return { headers, rawFileJson, unconfirmedDocument: unconfirmed[0] };
  };

  router.get(
    "/analyse",
    permissionsOrganismeMiddleware(["organisme/page_effectifs/televersement_document"]),
    tryCatch(async (req, res) => {
      let { organisme_id } = await Joi.object({
        organisme_id: Joi.string().required(),
      })
        .unknown()
        .validateAsync(req.query, { abortEarly: false });

      let mapping = {
        requireKeys: {},
        inputKeys: {},
        outputKeys: {},
        numberOfNotRequiredFieldsToMap: 0,
        whichOneIsTheSmallest: "out",
      };

      sendServerEventsForUser(req.user._id, "Fichier en cours d'analyse...");

      // eslint-disable-next-line no-unused-vars
      const { headers: rawHeaders, rawFileJson } = await getUnconfirmedDocumentContent(organisme_id);
      // const dataJson = [];
      // for (const rawData of rawFileJson) {
      //   dataJson.push({ ...headers, ...rawData });
      // }
      // TODO dataJson DO SEARCH VALIDATION
      let headers = {};
      for (const header of rawHeaders) {
        headers[header] = {
          label: header,
          value: header,
        };
      }

      mapping.inputKeys = headers;
      mapping.requireKeys = {
        annee_scolaire: {
          label: "Année scolaire",
          value: "annee_scolaire",
        },
        CFD: {
          label: "Code Formation Diplôme",
          value: "CFD",
        },
        RNCP: {
          label: "Code RNCP de la formation",
          value: "RNCP",
        },
        nom: {
          label: "Nom de l'apprenant",
          value: "nom",
        },
        prenom: {
          label: "Prénom de l'apprenant",
          value: "prenom",
        },
      };
      mapping.outputKeys = {
        identifiant_unique_apprenant: {
          label: "Identifiant unique de l'apprenant(e)",
          value: "identifiant_unique_apprenant",
        },
        annee_formation: {
          label: "L'année de formation",
          value: "annee_formation",
        },
        INE: {
          label: "Identifiant National Élève (INE)",
          value: "INE",
        },
        sexe: {
          label: "Sexe de l'apprenant(e)",
          value: "sexe",
        },
        date_de_naissance: {
          label: "Date de naissance de l'apprenant(e)",
          value: "date_de_naissance",
        },
        code_postal_de_naissance: {
          label: "Code postal de naissance de l'apprenant(e)",
          value: "code_postal_de_naissance",
        },
        nationalite: {
          label: "Nationalité de l'apprenant(e)",
          value: "nationalite",
        },
        regime_scolaire: {
          label: "Régime scolaire de l'apprenant(e)",
          value: "regime_scolaire",
        },
        handicap: {
          label: "Situation de handicap",
          value: "handicap",
        },
        inscription_sportif_haut_niveau: {
          label: "Sportif de haut niveau",
          value: "inscription_sportif_haut_niveau",
        },
        courriel: {
          label: "Courriel de l'apprenant(e)",
          value: "courriel",
        },
        telephone: {
          label: "Téléphone de l'apprenant(e)",
          value: "telephone",
        },
        adresse_complete: {
          label: "Adresse compléte de l'apprenant(e)",
          value: "adresse_complete",
        },
        adresse_numero: {
          label: "Adresse numéro",
          value: "adresse_numero",
        },
        adresse_repetition_voie: {
          label: "Adresse répétition de voie",
          value: "adresse_repetition_voie",
        },
        adresse_voie: {
          label: "Adresse nom de la voie",
          value: "adresse_voie",
        },
        adresse_complement: {
          label: "Complément d'adresse",
          value: "adresse_complement",
        },
        adresse_code_postal: {
          label: "Adresse code postal",
          value: "adresse_code_postal",
        },
        adresse_code_commune_insee: {
          label: "Adresse code commune INSEE",
          value: "adresse_code_commune_insee",
        },
        adresse_commune: {
          label: "Adresse nom de la commune",
          value: "adresse_commune",
        },
        situation_avant_contrat: {
          label: "Situation avant contrat",
          value: "situation_avant_contrat",
        },
        derniere_situation: {
          label: "Situation apprenant(e) Année N-1",
          value: "derniere_situation",
        },
        dernier_organisme_uai: {
          label: "UAI établissement Année N-1",
          value: "dernier_organisme_uai",
        },
        dernier_diplome: {
          label: "Dernier diplôme obtenu",
          value: "dernier_diplome",
        },
        mineur_emancipe: {
          label: "Mineur émancipé",
          value: "mineur_emancipe",
        },
        representant_legal_nom: {
          label: "Nom du représentant légal",
          value: "representant_legal_nom",
        },
        representant_legal_prenom: {
          label: "Prénom du représentant légal",
          value: "representant_legal_prenom",
        },
        representant_legal_courriel: {
          label: "Courriel du représentant légal",
          value: "representant_legal_courriel",
        },
        representant_legal_telephone: {
          label: "Téléphone du représentant légal",
          value: "representant_legal_telephone",
        },
        representant_legal_pcs: {
          label: "Professions et catégories socioprofessionnelles du représentant légal",
          value: "representant_legal_pcs",
        },
        representant_legal_adresse_complete: {
          label: "Adresse compléte du représentant légal",
          value: "representant_legal_adresse_complete",
        },
        representant_legal_adresse_numero: {
          label: "Adresse numéro du représentant légal",
          value: "representant_legal_adresse_numero",
        },
        representant_legal_adresse_repetition_voie: {
          label: "Adresse répétition de voie du représentant légal",
          value: "representant_legal_adresse_repetition_voie",
        },
        representant_legal_adresse_voie: {
          label: "Adresse nom de la voie du représentant légal",
          value: "representant_legal_adresse_voie",
        },
        representant_legal_adresse_complement: {
          label: "Complément d'adresse du représentant légal",
          value: "representant_legal_adresse_complement",
        },
        representant_legal_adresse_code_postal: {
          label: "Adresse code postal du représentant légal",
          value: "representant_legal_adresse_code_postal",
        },
        representant_legal_adresse_code_commune_insee: {
          label: "Adresse code commune INSEE du représentant légal",
          value: "representant_legal_adresse_code_commune_insee",
        },
        representant_legal_adresse_commune: {
          label: "Adresse nom de la commune du représentant légal",
          value: "representant_legal_adresse_commune",
        },
        dernier_statut: {
          label: "Statut courant de l'apprenant(e)",
          value: "dernier_statut",
        },
        date_dernier_statut: {
          label: "Date du statut courant de l'apprenant(e)",
          value: "date_dernier_statut",
        },
        dernier_contrat_siret: {
          label: "Dernier contrat ou courant Siret employeur",
          value: "dernier_contrat_siret",
        },
        dernier_contrat_type_employeur: {
          label: "Dernier contrat ou courant type de l'employeur",
          value: "dernier_contrat_type_employeur",
        },
        dernier_contrat_nombre_de_salaries: {
          label: "Dernier contrat ou courant nombre de salariés de l'employeur",
          value: "dernier_contrat_nombre_de_salaries",
        },
        dernier_contrat_adresse_complete: {
          label: "Adresse compléte de l'employeur",
          value: "dernier_contrat_adresse_complete",
        },
        dernier_contrat_adresse_numero: {
          label: "Adresse numéro de l'employeur",
          value: "dernier_contrat_adresse_numero",
        },
        dernier_contrat_adresse_repetition_voie: {
          label: "Adresse répétition de voie de l'employeur",
          value: "dernier_contrat_adresse_repetition_voie",
        },
        dernier_contrat_adresse_voie: {
          label: "Adresse nom de la voie de l'employeur",
          value: "dernier_contrat_adresse_voie",
        },
        dernier_contrat_adresse_complement: {
          label: "Complément d'adresse de l'employeur",
          value: "dernier_contrat_adresse_complement",
        },
        dernier_contrat_adresse_code_postal: {
          label: "Adresse code postal de l'employeur",
          value: "dernier_contrat_adresse_code_postal",
        },
        dernier_contrat_adresse_code_commune_insee: {
          label: "Adresse code commune INSEE de l'employeur",
          value: "dernier_contrat_adresse_code_commune_insee",
        },
        dernier_contrat_adresse_commune: {
          label: "Adresse nom de la commune de l'employeur",
          value: "dernier_contrat_adresse_commune",
        },
        dernier_contrat_date_debut: {
          label: "Dernier contrat ou courant date de debut",
          value: "dernier_contrat_date_debut",
        },
        dernier_contrat_date_fin: {
          label: "Dernier contrat ou courant date de fin",
          value: "dernier_contrat_date_fin",
        },
        dernier_contrat_date_rupture: {
          label: "Dernier contrat ou courant date de rupture",
          value: "dernier_contrat_date_rupture",
        },
      };

      const numberOfNotRequiredInputKeys =
        Object.keys(mapping.inputKeys).length - Object.keys(mapping.requireKeys).length;
      mapping.numberOfNotRequiredFieldsToMap =
        numberOfNotRequiredInputKeys <= Object.keys(mapping.outputKeys).length
          ? numberOfNotRequiredInputKeys
          : Object.keys(mapping.outputKeys).length;
      mapping.whichOneIsTheSmallest =
        numberOfNotRequiredInputKeys <= Object.keys(mapping.outputKeys).length ? "in" : "out";

      return res.json(mapping);
    })
  );

  router.post(
    "/setModel",
    permissionsOrganismeMiddleware(["organisme/page_effectifs/televersement_document"]),
    tryCatch(async (req, res) => {
      let {
        organisme_id,
        type_document,
        mapping: userMapping,
      } = await Joi.object({
        organisme_id: Joi.string().required(),
        type_document: Joi.string().required(),
        mapping: Joi.object().required(),
      })
        .unknown()
        .validateAsync(req.body, { abortEarly: false });

      const upload = await getUploadEntryByOrgaId(organisme_id);
      const model = find(upload.models, { type_document });
      model.mapping_column = userMapping;

      await uploadsDb().findOneAndUpdate(
        { _id: upload._id },
        {
          $set: { models: uniqBy([model, ...upload.models], "type_document"), updated_at: new Date() },
        },
        { returnDocument: "after" }
      );

      return res.json(upload);
    })
  );

  router.post(
    "/pre-import",
    permissionsOrganismeMiddleware(["organisme/page_effectifs/televersement_document"]),
    tryCatch(async (req, res) => {
      let { organisme_id, mapping: userMapping } = await Joi.object({
        organisme_id: Joi.string().required(),
        mapping: Joi.object().required(),
      })
        .unknown()
        .validateAsync(req.body, { abortEarly: false });

      const { rawFileJson, unconfirmedDocument: document } = await getUnconfirmedDocumentContent(organisme_id);

      // eslint-disable-next-line no-unused-vars
      const { annee_scolaire, typeCodeDiplome, ...mapping } = userMapping;

      await updateDocument(organisme_id, {
        nom_fichier: document.nom_fichier,
        taille_fichier: document.taille_fichier,
        mapping_column: userMapping,
      });
      const applyMapping = (arr, mapping) =>
        arr.map((obj) =>
          Object.entries(obj).reduce((acc, [key, value]) => {
            if (!mapping[key]) return acc;
            return { ...acc, [mapping[key]]: value };
          }, {})
        );

      const convertedDataToUserMapping = applyMapping(rawFileJson, mapping);
      const convertedDataToModelMapping = applyMapping(convertedDataToUserMapping, mappingModel);
      const convertedData = convertedDataToModelMapping.map((obj) =>
        Object.entries(obj).reduce((acc, [key, value]) => set(acc, key, value), {})
      );

      const canNotBeImportEffectifs = [];
      const canBeImportEffectifs = [];
      const canBeImportEffectifsIds = [];
      for (let [index, data] of convertedData.entries()) {
        sendServerEventsForUser(
          req.user._id,
          `Vérification en cours: ${index + 1} sur ${convertedData.length} effectifs`
        );
        if (typeCodeDiplome === "RNCP" && data.formation?.rncp) {
          const { cfd } = (await getFormationWithRNCP(data.formation?.rncp, { cfd: 1 })) || {};
          data.formation.cfd = cfd ?? "Erreur";
        } else {
          const { rncps } = (await getFormationWithCfd(data.formation.cfd, { rncps: 1 })) || { rncps: [] };
          data.formation.rncp = rncps[0] ?? data.formation?.rncp;
        }

        const { effectif: canNotBeImportEffectif } = await hydrateEffectif({
          organisme_id,
          source: document.document_id.toString(),
          id_erp_apprenant: new ObjectId().toString(),
          annee_scolaire,
          apprenant: { nom: data.apprenant?.nom ?? "", prenom: data.apprenant?.prenom ?? "" },
          formation: { cfd: data.formation?.cfd ?? "", rncp: data.formation?.rncp ?? "" },
        });
        if (canNotBeImportEffectif.validation_errors.length) {
          canNotBeImportEffectifs.push({
            annee_scolaire: canNotBeImportEffectif.annee_scolaire,
            validation_errors: canNotBeImportEffectif.validation_errors,
            cfd: canNotBeImportEffectif.formation.cfd,
            rncp: canNotBeImportEffectif.formation.rncp,
            nom: canNotBeImportEffectif.apprenant.nom,
            prenom: canNotBeImportEffectif.apprenant.prenom,
            error: "requiredMissing",
          });
        } else {
          const organismeFormation = await findOrganismeFormationByCfd(organisme_id, data.formation.cfd);
          if (!organismeFormation) {
            canNotBeImportEffectifs.push({
              annee_scolaire: canNotBeImportEffectif.annee_scolaire,
              validation_errors: canNotBeImportEffectif.validation_errors,
              cfd: data.formation.cfd,
              rncp: data.formation.rncp,
              nom: data.apprenant.nom,
              prenom: data.apprenant.prenom,
              error: "formationNotFound",
            });
          } else {
            data.apprenant.historique_statut = data.apprenant.historique_statut
              ? [data.apprenant.historique_statut]
              : [];
            data.apprenant.contrats = data.apprenant.contrats ? [data.apprenant.contrats] : [];

            const formationDb = await findFormationById(organismeFormation.formation_id);
            data.formation.formation_id = organismeFormation.formation_id;
            data.formation.annee = formationDb.annee;
            data.formation.libelle_long = formationDb.libelle;
            const { effectif: canBeImportEffectif, found: foundInDb } = await hydrateEffectif(
              {
                organisme_id,
                source: document.document_id.toString(),
                id_erp_apprenant: `${index}`,
                annee_scolaire,
                ...data,
              },
              { checkIfExist: true }
            );

            let effectifToSave = canBeImportEffectif;
            if (foundInDb) {
              const fieldsToImportTmp = Object.values(mapping)
                .filter((fieldName) => !["CFD", "nom", "prenom"].includes(fieldName))
                .map((fN) => mappingModel[fN]);
              effectifToSave = cloneDeep(foundInDb);
              let tmpContrat = {};
              let tmpHistoryStatut = {};

              const fieldsToImport = [];
              for (const fieldToImport of fieldsToImportTmp) {
                const isLocked = get(effectifToSave.is_lock, fieldToImport);
                if (!isLocked && fieldToImport) {
                  fieldsToImport.push(fieldToImport);
                }
              }

              ["annee_scolaire", "validation_errors", "source", ...fieldsToImport].map((fieldName) => {
                const newValue = get(canBeImportEffectif, fieldName);
                let value = newValue;
                if (fieldName === "validation_errors") {
                  const buildDiffValidationErrors = (validationErrorsOnFieldsToImport, found) => {
                    let cleanedUpErrors = [];
                    for (const currentError of validationErrorsOnFieldsToImport) {
                      const prevValue = get(found, currentError.fieldName);
                      if (
                        (prevValue || prevValue === false) &&
                        !find(found.validation_errors, { fieldName: currentError.fieldName })
                      ) {
                        // we don't want errors on previously ok field
                        cleanedUpErrors.push({ ...currentError, willNotBeModify: true });
                      } else {
                        cleanedUpErrors.push(currentError);
                      }
                    }
                    return cleanedUpErrors;
                  };
                  value = buildDiffValidationErrors(value, foundInDb);
                }
                if (fieldName.includes("apprenant.contrats.")) {
                  const contratKey = fieldName.replace("apprenant.contrats.", "");
                  value = get(canBeImportEffectif.apprenant.contrats[0], contratKey);
                  if (value) set(tmpContrat, contratKey, value);
                } else if (fieldName.includes("apprenant.historique_statut.")) {
                  const historyKey = fieldName.replace("apprenant.historique_statut.", "");
                  value = get(canBeImportEffectif.apprenant.historique_statut[0], historyKey);
                  if (value) set(tmpHistoryStatut, historyKey, value);
                } else if (value) set(effectifToSave, fieldName, value);
              });
              if (Object.keys(tmpContrat).length) {
                if (tmpContrat.date_debut && tmpContrat.date_fin) {
                  effectifToSave.apprenant.contrats.push(tmpContrat);
                }
              }
              if (Object.keys(tmpHistoryStatut).length) {
                if (tmpHistoryStatut.valeur_statut && tmpHistoryStatut.date_statut) {
                  effectifToSave.apprenant.historique_statut.push({ ...tmpHistoryStatut, date_reception: new Date() });
                }
              }
            }

            for (const validation_error of effectifToSave.validation_errors) {
              const { fieldName } = validation_error;
              if (fieldName === "formation.rncp" || fieldName === "formation.annee") {
                validation_error.willNotBeModify = true;
              } else if (
                fieldName === "apprenant.contrats[0].date_debut" ||
                fieldName === "apprenant.contrats[0].date_fin"
              ) {
                validation_error.willNotBeModify = true;
                validation_error.isRequired = true;
              } else if (fieldName.includes("apprenant.historique_statut")) {
                validation_error.willNotBeModify = true;
                validation_error.isRequired = true;
              }
            }

            const buildIdFrom = (effectifs, effectif) => {
              const foundInCollection = find(effectifs, {
                apprenant: { nom: effectif.apprenant.nom, prenom: effectif.apprenant.prenom },
                formation: { cfd: effectif.formation.cfd },
              });
              return foundInCollection?._id ?? new ObjectId();
            };

            const _id = foundInDb ? foundInDb._id : buildIdFrom(canBeImportEffectifs, effectifToSave);

            if (!canBeImportEffectifsIds.includes(_id.toString())) {
              canBeImportEffectifsIds.push(_id.toString());
              canBeImportEffectifs.push({
                _id,
                toUpdate: !!foundInDb,
                ...effectifToSave,
              });
            } else {
              canNotBeImportEffectifs.push({
                annee_scolaire: effectifToSave.annee_scolaire,
                validation_errors: effectifToSave.validation_errors,
                cfd: effectifToSave.formation.cfd,
                rncp: effectifToSave.formation.rncp,
                nom: effectifToSave.apprenant.nom,
                prenom: effectifToSave.apprenant.prenom,
                error: "duplicate",
              });
            }
          }
        }
      }

      const upload = await getUploadEntryByOrgaId(organisme_id);

      let models = upload.models;
      const model = find(upload.models, { type_document: document.type_document });
      if (!model) {
        models = [
          ...models,
          {
            type_document: document.type_document,
            mapping_column: userMapping,
            lock: false,
          },
        ];
      }

      await uploadsDb().findOneAndUpdate(
        { _id: upload._id },
        {
          $set: { last_snapshot_effectifs: canBeImportEffectifs, models, updated_at: new Date() },
        },
        { returnDocument: "after" }
      );

      const effectifsTable = [];

      for (const {
        _id,
        toUpdate,
        id_erp_apprenant,
        source,
        annee_scolaire,
        validation_errors,
        apprenant,
        formation,
      } of canBeImportEffectifs) {
        effectifsTable.push({
          id: _id.toString(),
          toUpdate,
          id_erp_apprenant,
          organisme_id,
          annee_scolaire,
          source,
          validation_errors,
          formation,
          cfd: formation.cfd,
          rncp: formation.rncp,
          nom: apprenant.nom,
          prenom: apprenant.prenom,
          historique_statut: apprenant.historique_statut,
        });
      }

      return res.json({
        canBeImportEffectifs: effectifsTable,
        canNotBeImportEffectifs,
      });
    })
  );

  router.post(
    "/import",
    permissionsOrganismeMiddleware(["organisme/page_effectifs/televersement_document"]),
    tryCatch(async (req, res) => {
      let { organisme_id } = await Joi.object({
        organisme_id: Joi.string().required(),
      })
        .unknown()
        .validateAsync(req.body, { abortEarly: false });

      const uploads = await getUploadEntryByOrgaId(organisme_id);
      const [unconfirmedDocument] = uploads.documents.filter((d) => !d.confirm);
      const effectifsDb = await findEffectifs(organisme_id);

      for (let index = 0; index < uploads.last_snapshot_effectifs.length; index++) {
        const { toUpdate, validation_errors, ...effectif } = uploads.last_snapshot_effectifs[index];

        sendServerEventsForUser(
          req.user._id,
          `Import en cours: ${index + 1} sur ${uploads.last_snapshot_effectifs.length} effectifs`
        );

        let errorsToKeep = validation_errors.filter(({ willNotBeModify }) => !willNotBeModify);

        for (const [key, validation_error] of errorsToKeep.entries()) {
          let { fieldName } = validation_error;
          if (fieldName.includes("apprenant.contrats[0]")) {
            errorsToKeep[key].fieldName = fieldName.replace("contrats[0]", "contrats[1]");
            errorsToKeep[key].message = fieldName.replace("contrats[0]", "contrats[1]");
          }
        }

        if (toUpdate) {
          await updateEffectif(
            effectif._id,
            { ...effectif, validation_errors: errorsToKeep },
            { keepPreviousErrors: true }
          );
        } else {
          await createEffectif({ ...effectif, validation_errors: errorsToKeep });
        }
      }

      await uploadsDb().findOneAndUpdate(
        { _id: uploads._id },
        {
          $set: { last_snapshot_effectifs: effectifsDb, updated_at: new Date() },
        },
        { returnDocument: "after" }
      );

      await updateDocument(organisme_id, {
        nom_fichier: unconfirmedDocument.nom_fichier,
        taille_fichier: unconfirmedDocument.taille_fichier,
        confirm: true,
      });

      if (uploads.last_snapshot_effectifs.length > 0) await setOrganismeTransmissionDates(organisme_id);

      return res.json({});
    })
  );

  router.get(
    "/",
    permissionsOrganismeMiddleware(["organisme/page_effectifs/televersement_document"]),
    tryCatch(async (req, res) => {
      let { organisme_id, path, name } = await Joi.object({
        organisme_id: Joi.string().required(),
        path: Joi.string().required(),
        name: Joi.string().required(),
      }).validateAsync(req.query, { abortEarly: false });

      const document = await getDocument(organisme_id, name, path);

      const stream = await getFromStorage(document.chemin_fichier);

      const contentType = {
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        xls: "application/vnd.ms-excel",
        csv: "text/csv",
      };
      res.header("Content-Type", contentType[document.ext_fichier]);

      res.header("Content-Disposition", `attachment; filename=${document.nom_fichier}`);
      res.header("Content-Length", document.taille_fichier);
      res.status(200);
      res.type(document.ext_fichier);

      await oleoduc(stream, crypto.isCipherAvailable() ? crypto.decipher(organisme_id) : noop(), res);
    })
  );

  router.delete(
    "/",
    permissionsOrganismeMiddleware(["organisme/page_effectifs/televersement_document"]),
    tryCatch(async (req, res) => {
      let { organisme_id, nom_fichier, chemin_fichier, taille_fichier } = await Joi.object({
        organisme_id: Joi.string().required(),
        taille_fichier: Joi.number().required(),
        chemin_fichier: Joi.string().required(),
        nom_fichier: Joi.string().required(),
      })
        .unknown()
        .validateAsync(req.query, { abortEarly: false });

      const { documents } = await removeDocument(organisme_id, {
        nom_fichier,
        chemin_fichier,
        taille_fichier,
      });

      await deleteFromStorage(chemin_fichier);

      return res.json({ documents });
    })
  );

  return router;
};
