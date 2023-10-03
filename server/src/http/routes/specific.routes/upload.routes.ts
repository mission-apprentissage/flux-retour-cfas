import { EventEmitter } from "events";
import { createWriteStream } from "fs";
import { PassThrough } from "stream";

import csvToJson from "convert-csv-to-json";
import Joi from "joi";
import { cloneDeep, find, get, set, uniqBy } from "lodash-es";
import { DateTime } from "luxon";
import { ObjectId, WithId } from "mongodb";
import multiparty from "multiparty";
import { accumulateData, oleoduc, writeData } from "oleoduc";

import {
  createEffectif,
  findEffectifs,
  mergeEffectifWithDefaults,
  updateEffectif,
} from "@/common/actions/effectifs.actions";
import { checkIfEffectifExists } from "@/common/actions/engine/engine.actions";
import { getFormationWithCfd, getFormationWithRNCP } from "@/common/actions/formations.actions";
import { findOrganismeById, updateOrganismeTransmission } from "@/common/actions/organismes/organismes.actions";
import {
  addDocument,
  getDocument,
  getOrCreateUploadByOrgId,
  getUploadByOrgId,
  removeDocument,
  updateDocument,
} from "@/common/actions/uploads.actions";
import { getMapping } from "@/common/constants/upload";
import logger from "@/common/logger";
import { Formation } from "@/common/model/@types/Formation";
import { uploadsDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import * as crypto from "@/common/utils/cryptoUtils";
import { getFromStorage, uploadToStorage, deleteFromStorage } from "@/common/utils/ovhUtils";
import { getJsonFromXlsxData } from "@/common/utils/xlsxUtils";
import { clamav } from "@/services";

import { sendServerEventsForUser } from "./server-events.routes";

const MAX_FILE_SIZE = 10_485_760; // 10MB

const contentType = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  csv: "text/csv",
};

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
  dernier_contrat_siret: "contrats.siret",
  dernier_contrat_type_employeur: "contrats.type_employeur",
  dernier_contrat_nombre_de_salaries: "contrats.nombre_de_salaries",
  dernier_contrat_adresse_complete: "contrats.adresse.complete",
  dernier_contrat_adresse_numero: "contrats.adresse.numero",
  dernier_contrat_adresse_repetition_voie: "contrats.adresse.repetition_voie",
  dernier_contrat_adresse_voie: "contrats.adresse.voie",
  dernier_contrat_adresse_complement: "contrats.adresse.complement",
  dernier_contrat_adresse_code_postal: "contrats.adresse.code_postal",
  dernier_contrat_adresse_code_commune_insee: "contrats.adresse.code_insee",
  dernier_contrat_adresse_commune: "contrats.adresse.commune",
  dernier_contrat_date_debut: "contrats.date_debut",
  dernier_contrat_date_fin: "contrats.date_fin",
  dernier_contrat_date_rupture: "contrats.date_rupture",
};

function discard() {
  return createWriteStream("/dev/null");
}

function noop() {
  return new PassThrough();
}

const getUnconfirmedDocumentContent = async (organisme_id: ObjectId) => {
  const uploads = await getUploadByOrgId(organisme_id);
  const unconfirmed = uploads.documents?.filter((d) => !d.confirm);
  const stream = await getFromStorage(unconfirmed?.[0].chemin_fichier);
  let headers: any[] = [];
  let rawFileJson: any[] = [];
  await oleoduc(
    stream,
    crypto.isCipherAvailable() ? crypto.decipher(organisme_id.toString()) : noop(),
    accumulateData(
      (acc, value) => {
        return Buffer.concat([acc, Buffer.from(value)]);
      },
      { accumulator: Buffer.from(new Uint8Array()) }
    ),
    writeData(async (data) => {
      if (unconfirmed?.[0].ext_fichier === "csv") {
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
  return { headers, rawFileJson, unconfirmedDocument: unconfirmed?.[0] };
};

function handleMultipartForm(req, res, organisme_id: ObjectId, callback) {
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
    const { documents, models } = await getUploadByOrgId(organisme_id);
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

export default {
  createUpload: async (organisme_id: ObjectId, req, res) => {
    sendServerEventsForUser(req.user._id, "Fichier en cours de téléversement...");

    handleMultipartForm(req, res, organisme_id, async (part) => {
      const fileName = `${DateTime.now().toFormat("dd-MM-yyyy-hh:mm")}_${part.filename}`;
      let path = `uploads/${organisme_id}/${fileName}`;
      let { scanStream, getScanResults } = await clamav.getScanner();
      let { hashStream, getHash } = crypto.checksum();

      await oleoduc(
        part,
        scanStream,
        hashStream,
        crypto.isCipherAvailable() ? crypto.cipher(organisme_id.toString()) : noop(),
        await uploadToStorage(path, { contentType: part.headers["content-type"] })
      );

      if (part.byteCount > MAX_FILE_SIZE) {
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
        taille_fichier: part.byteCount,
        userEmail: req.user.email,
      });
      sendServerEventsForUser(req.user._id, "Fichier téléversé avec succès");
    });
  },

  getUpload: async (organisme_id) => {
    const upload = await getOrCreateUploadByOrgId(organisme_id, { last_snapshot_effectifs: 0 });
    return upload;
  },

  setDocumentType: async (organisme_id: ObjectId, document_id: ObjectId, type_document: string) => {
    const upload = await updateDocument(organisme_id, document_id, { type_document });

    return upload;
  },

  analyse: async (organisme_id: ObjectId, user: AuthContext) => {
    sendServerEventsForUser(user._id, "Fichier en cours d'analyse...");

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { headers: rawHeaders, rawFileJson } = await getUnconfirmedDocumentContent(organisme_id);

    const headers = rawHeaders.reduce(
      (acc, header) => ({
        ...acc,
        [header]: {
          label: header,
          value: header,
        },
      }),
      {}
    );

    const mapping = getMapping(headers);

    const numberOfNotRequiredInputKeys =
      Object.keys(mapping.inputKeys).length - Object.keys(mapping.requireKeys).length;
    mapping.numberOfNotRequiredFieldsToMap =
      numberOfNotRequiredInputKeys <= Object.keys(mapping.outputKeys).length
        ? numberOfNotRequiredInputKeys
        : Object.keys(mapping.outputKeys).length;
    mapping.whichOneIsTheSmallest =
      numberOfNotRequiredInputKeys <= Object.keys(mapping.outputKeys).length ? "in" : "out";

    return mapping;
  },

  setModel: async (organisme_id, req, res) => {
    let { type_document, mapping: userMapping } = await Joi.object({
      type_document: Joi.string().required(),
      mapping: Joi.object().required(),
    })
      .unknown()
      .validateAsync(req.body, { abortEarly: false });

    const upload = await getUploadByOrgId(organisme_id);
    const model = find(upload.models, { type_document });
    model.mapping_column = userMapping;

    await uploadsDb().findOneAndUpdate(
      { _id: upload._id },
      {
        $set: { models: uniqBy([model, ...(upload?.models || [])], "type_document"), updated_at: new Date() },
      },
      { returnDocument: "after" }
    );

    return res.json(upload);
  },

  preImport: async (organisme_id: ObjectId, user: AuthContext, userMapping: any) => {
    const organisme = await findOrganismeById(organisme_id);
    if (!organisme) {
      throw new Error("organisme not found");
    }

    const { rawFileJson, unconfirmedDocument: document } = await getUnconfirmedDocumentContent(organisme_id);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { annee_scolaire, typeCodeDiplome, ...mapping } = userMapping;

    await updateDocument(organisme_id, document.document_id, { mapping_column: userMapping });
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

    const canNotBeImportEffectifs: any[] = [];
    const canBeImportEffectifs: any[] = [];
    const canBeImportEffectifsIds: any[] = [];
    for (let [index, data] of convertedData.entries()) {
      sendServerEventsForUser(user._id, `Vérification en cours: ${index + 1} sur ${convertedData.length} effectifs`);
      let formationFound: WithId<Formation> | null = null;
      if (typeCodeDiplome === "RNCP" && data.formation?.rncp) {
        formationFound = await getFormationWithRNCP(data.formation?.rncp, { cfd: 1 });
        data.formation.cfd = formationFound?.cfd ?? "Erreur";
      } else if (data.formation?.cfd) {
        formationFound = await getFormationWithCfd(data.formation.cfd, { rncps: 1 });
        data.formation.rncp = formationFound?.rncps?.[0] ?? data.formation?.rncp;
      }

      const canNotBeImportEffectif = mergeEffectifWithDefaults({
        organisme_id,
        source: document?.document_id.toString(),
        id_erp_apprenant: new ObjectId().toString(),
        annee_scolaire,
        apprenant: { nom: data.apprenant?.nom ?? "", prenom: data.apprenant?.prenom ?? "", historique_statut: [] },
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
        if (!formationFound) {
          // une assertion pour fixer les erreurs typescript, mais normalement on ne devrait jamais arriver ici
          throw new Error("formation not found");
        }

        const isItAFormationGivenByOrganisme = organisme.relatedFormations?.find(
          (f) => f.formation_id?.toString() === (formationFound as any)._id.toString()
        );

        if (!isItAFormationGivenByOrganisme) {
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
          data.apprenant.historique_statut = data.apprenant.historique_statut ? [data.apprenant.historique_statut] : [];
          data.contrats = data.contrats ? [data.contrats] : [];

          data.formation.formation_id = formationFound._id;
          data.formation.annee = formationFound?.annee;
          data.formation.libelle_long = formationFound?.libelle;
          const canBeImportEffectif = mergeEffectifWithDefaults({
            organisme_id,
            source: document?.document_id.toString(),
            id_erp_apprenant: `${index}`,
            annee_scolaire,
            ...data,
          });
          const foundInDb = await checkIfEffectifExists(canBeImportEffectif);

          let effectifToSave = canBeImportEffectif;
          if (foundInDb) {
            const fieldsToImportTmp = Object.values(mapping)
              .filter((fieldName: any) => !["CFD", "nom", "prenom"].includes(fieldName))
              .map((fN: any) => mappingModel[fN]);
            effectifToSave = cloneDeep(foundInDb);
            let tmpContrat: any = {};
            let tmpHistoryStatut: any = {};

            const fieldsToImport: any[] = [];
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
                  let cleanedUpErrors: any[] = [];
                  for (const currentError of validationErrorsOnFieldsToImport) {
                    const prevValue = get(found, currentError.fieldName);
                    if (
                      (prevValue || prevValue === false) &&
                      !find(found.validation_errors, { fieldName: currentError.fieldName })
                    ) {
                      // we don't want errors on previously ok field
                      cleanedUpErrors.push({ ...currentError, willNotBeModified: true });
                    } else {
                      cleanedUpErrors.push(currentError);
                    }
                  }
                  return cleanedUpErrors;
                };
                value = buildDiffValidationErrors(value, foundInDb);
              }
              if (fieldName.includes("contrats.")) {
                const contratKey = fieldName.replace("contrats.", "");
                value = get(canBeImportEffectif.contrats[0], contratKey);
                if (value) set(tmpContrat, contratKey, value);
              } else if (fieldName.includes("apprenant.historique_statut.")) {
                const historyKey = fieldName.replace("apprenant.historique_statut.", "");
                value = get(canBeImportEffectif.apprenant.historique_statut[0], historyKey);
                if (value) set(tmpHistoryStatut, historyKey, value);
              } else if (value) set(effectifToSave, fieldName, value);
            });
            if (Object.keys(tmpContrat).length) {
              if (tmpContrat.date_debut && tmpContrat.date_fin) {
                effectifToSave.contrats.push(tmpContrat);
              }
            }
            if (Object.keys(tmpHistoryStatut).length) {
              if (tmpHistoryStatut.valeur_statut && tmpHistoryStatut.date_statut) {
                effectifToSave.apprenant.historique_statut.push({ ...tmpHistoryStatut, date_reception: new Date() });
              }
            }
          }

          // TO_DISCUSS A quoi cela sert ?
          for (const validation_error of effectifToSave.validation_errors) {
            const { fieldName } = validation_error;
            if (fieldName === "formation.rncp" || fieldName === "formation.annee") {
              validation_error.willNotBeModified = true;
            } else if (fieldName === "contrats[0].date_debut" || fieldName === "contrats[0].date_fin") {
              validation_error.willNotBeModified = true;
              validation_error.isRequired = true;
            } else if ((fieldName as any)?.includes("apprenant.historique_statut")) {
              validation_error.willNotBeModified = true;
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

    const upload = await getUploadByOrgId(organisme_id);

    let models = upload.models;
    const model = find(upload.models, { type_document: document?.type_document });
    if (!model) {
      models = [
        ...(models || []),
        {
          type_document: document?.type_document,
          mapping_column: userMapping,
          lock: false,
        },
      ] as any;
    }

    await uploadsDb().findOneAndUpdate(
      { _id: upload._id },
      {
        $set: {
          last_snapshot_effectifs: canBeImportEffectifs,
          models,
          updated_at: new Date(),
        } as any,
      },
      { returnDocument: "after" }
    );

    const effectifsTable: any[] = [];

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

    return {
      canBeImportEffectifs: effectifsTable,
      canNotBeImportEffectifs,
    };
  },

  import: async (organisme_id: ObjectId, user: AuthContext) => {
    const organisme = await findOrganismeById(organisme_id);
    if (!organisme) {
      throw new Error("organisme not found");
    }

    const uploads = await getUploadByOrgId(organisme_id);
    const unconfirmedDocument = uploads?.documents?.filter((d) => !d.confirm)?.[0];
    const effectifsDb = await findEffectifs(organisme_id);

    for (let index = 0; index < uploads.last_snapshot_effectifs.length; index++) {
      const { toUpdate, validation_errors, ...effectif } = uploads.last_snapshot_effectifs[index];

      sendServerEventsForUser(
        user._id,
        `Import en cours: ${index + 1} sur ${uploads.last_snapshot_effectifs.length} effectifs`
      );

      let errorsToKeep = validation_errors.filter(({ willNotBeModified }) => !willNotBeModified);

      for (const [key, validation_error] of errorsToKeep.entries()) {
        let { fieldName } = validation_error;
        if (fieldName.includes("contrats[0]")) {
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
        await createEffectif({ ...effectif, validation_errors: errorsToKeep }, organisme);
      }
    }

    await uploadsDb().findOneAndUpdate(
      { _id: uploads._id },
      {
        $set: { last_snapshot_effectifs: effectifsDb, updated_at: new Date() },
      },
      { returnDocument: "after" }
    );

    if (unconfirmedDocument) {
      await updateDocument(organisme_id, unconfirmedDocument.document_id, { confirm: true });
    }

    if (uploads.last_snapshot_effectifs.length > 0) {
      await updateOrganismeTransmission(organisme);
    }

    return {};
  },

  getDocument: async (organisme_id: ObjectId, { name, path }: { name: string; path: string }, res) => {
    const document = await getDocument(organisme_id, name, path);

    const stream = await getFromStorage(document.chemin_fichier);
    res.header("Content-Type", contentType[document.ext_fichier]);

    res.header("Content-Disposition", `attachment; filename=${document.nom_fichier}`);
    res.header("Content-Length", document.taille_fichier);
    res.status(200);
    res.type(document.ext_fichier);

    await oleoduc(stream, crypto.isCipherAvailable() ? crypto.decipher(organisme_id.toString()) : noop(), res);
  },

  deleteUploadedDocument: async (organismeId: ObjectId, documentId: ObjectId) => {
    const removedDocument = await removeDocument(organismeId, documentId);
    await deleteFromStorage(removedDocument.chemin_fichier);
    const updatedUpload = await getUploadByOrgId(organismeId);
    return updatedUpload;
  },
};
