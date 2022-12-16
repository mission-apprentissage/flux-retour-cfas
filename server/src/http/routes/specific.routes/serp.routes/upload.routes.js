import express from "express";
import tryCatch from "../../../middlewares/tryCatchMiddleware.js";
import Joi from "joi";
import { createWriteStream } from "fs";
import { getFromStorage, uploadToStorage, deleteFromStorage } from "../../../../common/utils/ovhUtils.js";
import { oleoduc } from "oleoduc";
import multiparty from "multiparty";
import { EventEmitter } from "events";
import { PassThrough } from "stream";
import logger from "../../../../common/logger.js";
import * as crypto from "../../../../common/utils/cryptoUtils.js";
import {
  addDocument,
  getDocument,
  getUploadEntryByOrgaId,
  removeDocument,
} from "../../../../common/actions/uploads.actions.js";
// import permissionsDossierMiddleware = require("../../middlewares/permissionsDossierMiddleware");

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
      const { documents } = await getUploadEntryByOrgaId(organisme_id);
      return res.json({ documents });
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
    // permissionsDossierMiddleware(components, ["dossier/page_documents/ajouter_un_document"]),
    tryCatch(async (req, res) => {
      let { organisme_id } = await Joi.object({
        organisme_id: Joi.string().required(),
      })
        .unknown()
        .validateAsync(req.query, { abortEarly: false });

      handleMultipartForm(req, res, organisme_id, async (part) => {
        let { test, organisme_id, type_document } = await Joi.object({
          test: Joi.boolean(),
          organisme_id: Joi.string().required(),
          type_document: Joi.string().required(),
        }).validateAsync(req.query, { abortEarly: false });

        let path = `uploads/${organisme_id}/${part.filename}`;
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
          type_document,
          hash_fichier,
          nom_fichier: part.filename,
          chemin_fichier: path,
          taille_fichier: test ? 0 : part.byteCount,
          userEmail: req.user.email,
        });
      });
    })
  );

  router.get(
    "/get",
    // permissionsDossierMiddleware(components, ["dossier/page_documents"]),
    tryCatch(async (req, res) => {
      let { organisme_id } = await Joi.object({
        organisme_id: Joi.string().required(),
      })
        .unknown()
        .validateAsync(req.query, { abortEarly: false });

      const result = await getUploadEntryByOrgaId(organisme_id);
      return res.json(result);
    })
  );

  router.get(
    "/",
    // permissionsDossierMiddleware(components, ["dossier/page_documents"]),
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
    // permissionsDossierMiddleware(components, ["dossier/page_documents/supprimer_un_document"]),
    tryCatch(async (req, res) => {
      let { organisme_id, type_document, nom_fichier, chemin_fichier, taille_fichier } = await Joi.object({
        organisme_id: Joi.string().required(),
        taille_fichier: Joi.number().required(),
        chemin_fichier: Joi.string().required(),
        nom_fichier: Joi.string().required(),
        type_document: Joi.string(),
      })
        .unknown()
        .validateAsync(req.query, { abortEarly: false });

      const { documents } = await removeDocument(organisme_id, {
        type_document,
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
