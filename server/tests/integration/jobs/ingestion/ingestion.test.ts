describe("Ingestion de données valides", () => {
  beforeEach(async () => {
    // TODO init du référentiel avec un organisme fiable
    // TODO création d'un organisme fiable en db
  });

  describe("Ingestion de nouvelles données valides", () => {
    it.skip("Vérifie la création d'organisme ainsi que l'ingestion valide d'un nouveau dossier valide pour un nouvel organisme fiable avec une formation connue", async () => {
      // TODO création d'un dossier valide avec l'organisme id et une formation connue
      // TODO vérifier que l'ingestion ajoute bien un organisme et un effectif valide lié avec la formation connue
    });

    it.skip("Vérifie l'ingestion valide d'un nouveau dossier valide pour un organisme fiable existant avec une formation connue", async () => {
      // TODO création d'un dossier valide avec l'organisme id déja existant et une formation connue
      // TODO vérifier que l'ingestion ajoute bien un effectif valide lié à l'organisme avec la formation connue
    });

    it.skip("Vérifie l'ingestion valide d'un nouveau dossier valide pour un organisme fiable avec une formation inconnue", async () => {
      // TODO création d'un dossier valide avec l'organisme id déja existant et une formation inconnue
      // TODO vérifier que l'ingestion ajoute bien un effectif valide lié à l'organisme avec la formation inconnue});
    });

    describe("Ingestion de mises à jour de données valides", () => {
      beforeEach(async () => {
        // TODO création d'un dossier valide pour un jeune en db
      });
      it.skip("Vérifie l'ingestion et la mise à jour valide d'un dossier valide déja existant pour un organisme fiable avec une formation connue", async () => {
        // TODO création d'un dossier avec un nouveau statut pour ce jeune
        // TODO vérifier la MAJ de l'effectif en db
      });
    });
  });

  describe("Ingestion de données invalides", () => {
    describe("Ingestion de nouvelles données invalides", () => {
      it.skip("Vérifie la mise à l'écart d'un nouveau dossier valide pour un organisme non fiable avec une formation connue", async () => {
        // TODO ajout d'un dossier avec un couple UAI SIRET invalide
        // TODO Vérifier l'ajout à la "corbeille" du dossier non valide et la non création d'effectif
      });
      it.skip("Vérifie la mise à l'écart d'un nouveau dossier valide pour un organisme non fiable car fermé avec une formation connue", async () => {
        // TODO ajout d'un dossier avec un couple UAI SIRET fermé
        // TODO Vérifier l'ajout à la "corbeille" du dossier non valide et la non création d'effectif
      });
      it.skip("Vérifie la mise à l'écart d'un nouveau dossier invalide pour un organisme fiable avec une formation connue", async () => {
        // TODO ajout d'un dossier avec une erreur sur l'un des champs du dossier du jeune
        // TODO Vérifier l'ajout à la "corbeille" du dossier non valide et la non création d'effectif
      });
    });

    describe("Ingestion de mises à jour de données invalides", () => {
      beforeEach(async () => {
        // TODO création d'un dossier valide pour un jeune en db
      });
      it.skip("Vérifie la mise à l'écart d'un dossier invalide déja existant pour un organisme fiable avec une formation connue", async () => {
        // TODO création d'un dossier invalide sur l'un des champs avec un nouveau statut pour ce jeune
        // TODO Vérifier l'ajout à la "corbeille" du dossier non valide et la non création d'effectif
      });
    });
  });
});
