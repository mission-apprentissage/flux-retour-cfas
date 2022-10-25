const express = require("express");
const { USER_EVENTS_TYPES, USER_EVENTS_ACTIONS } = require("../../../common/constants/userEventsConstants.js");
const tryCatch = require("../../middlewares/tryCatchMiddleware");
const multer = require("multer");
const path = require("path");
const { toDonneesApprenantsFromXlsx } = require("../../../common/model/mappers/donneesApprenantsMapper.js");
const { getFormattedErrors, getValidationResultFromList } = require("../../../common/domain/donneesApprenants.js");

module.exports = ({ userEvents, donneesApprenantsPartageSimplifie }) => {
  const router = express.Router();
  const ALLOWED_FILE_EXTENSION = ".xlsx";

  // Initialisation de multer et filtre sur l'extension
  const upload = multer({
    fileFilter: function (req, file, callback) {
      if (path.extname(file.originalname) !== ALLOWED_FILE_EXTENSION) {
        return callback(new Error("Only XLSX files are allowed"));
      }
      callback(null, true);
    },
  });

  router.post(
    "/upload",
    upload.single("donneesApprenantsFile"),
    tryCatch(async (req, res) => {
      const { user, file } = req;
      const { comment } = req.body;
      const userFields = {
        user_email: user?.email,
        user_uai: user?.uai,
        user_siret: user?.siret,
        user_nom_etablissement: user?.nom_etablissement,
      };

      let uploadStatus = USER_EVENTS_ACTIONS.UPLOAD.INIT;
      let originalUploadLength = 0;
      let errors = [];

      try {
        // Lecture & mapping des données du XLSX
        const donneesApprenantsXlsx = donneesApprenantsPartageSimplifie.readDonneesApprenantsFromXlsxBuffer(
          file?.buffer
        );

        const donneesApprenants = donneesApprenantsXlsx.map((item) => ({
          ...toDonneesApprenantsFromXlsx(item),
          ...userFields,
        }));

        originalUploadLength = donneesApprenants.length;

        // Validation des données
        const validationResult = getValidationResultFromList(donneesApprenants);

        if (validationResult.error) {
          errors = getFormattedErrors(validationResult.error);
          uploadStatus = USER_EVENTS_ACTIONS.UPLOAD.ERROR;
        } else {
          // Si les données sont valides on écrase les données du user par celles ci
          await donneesApprenantsPartageSimplifie.clearDonneesApprenantsForUserEmail(user?.email);
          await donneesApprenantsPartageSimplifie.importDonneesApprenants(donneesApprenants);

          // On trace l'import et la liste des donneesApprenants importés
          await userEvents.create({
            username: user.email,
            type: USER_EVENTS_TYPES.POST,
            action: USER_EVENTS_ACTIONS.UPLOAD.IMPORT,
            data: { donneesApprenants },
          });

          uploadStatus = USER_EVENTS_ACTIONS.UPLOAD.SUCCESS;
        }

        return res.json({ message: uploadStatus, originalUploadLength: originalUploadLength?.toString(), errors });
      } catch (err) {
        uploadStatus = USER_EVENTS_ACTIONS.UPLOAD.ERROR;
        return res.status(500).json({ message: "Could not upload file !", errors });
      } finally {
        await userEvents.create({
          username: user.email,
          type: USER_EVENTS_TYPES.POST,
          action: uploadStatus,
          data: { ...file, comment, buffer: file?.buffer?.toString(), errors }, // ajout de toString au buffer pour stockage du fichier dans la base
        });
      }
    })
  );

  return router;
};
