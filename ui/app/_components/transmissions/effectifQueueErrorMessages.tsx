import { ORGANISME_FORMATEUR_NOT_FOUND, ORGANISME_LIEU_NOT_FOUND, ORGANISME_RESPONSABLE_NOT_FOUND } from "shared";

const organismeNotFound = (type: string) => (
  <>
    Couple UAI/SIRET du {type} non trouvé dans le{" "}
    <a
      href="https://referentiel.apprentissage.onisep.fr/"
      target="_blank"
      rel="noopener noreferrer"
      className="fr-link"
    >
      Référentiel
    </a>{" "}
    de l’apprentissage (ONISEP) et dans le{" "}
    <a
      href="https://catalogue-apprentissage.intercariforef.org/"
      target="_blank"
      rel="noopener noreferrer"
      className="fr-link"
    >
      Catalogue
    </a>{" "}
    de l’apprentissage. Veuillez faire référencer votre{" "}
    <a
      href="https://www.intercariforef.org/referencer-son-offre-de-formation"
      target="_blank"
      rel="noopener noreferrer"
      className="fr-link"
    >
      offre de formation
    </a>{" "}
    auprès de votre Carif-Oref Régional.
  </>
);

export const ErrorMessages = {
  [`${ORGANISME_LIEU_NOT_FOUND}:etablissement_lieu_de_formation_siret`]: organismeNotFound("lieu de formation"),
  [`${ORGANISME_LIEU_NOT_FOUND}:etablissement_lieu_de_formation_uai`]: organismeNotFound("lieu de formation"),
  [`${ORGANISME_FORMATEUR_NOT_FOUND}:etablissement_formateur_siret`]: organismeNotFound("formateur"),
  [`${ORGANISME_FORMATEUR_NOT_FOUND}:etablissement_formateur_uai`]: organismeNotFound("formateur"),
  [`${ORGANISME_RESPONSABLE_NOT_FOUND}:etablissement_responsable_uai`]: organismeNotFound("responsable"),
  [`${ORGANISME_RESPONSABLE_NOT_FOUND}:etablissement_responsable_siret`]: organismeNotFound("responsable"),
};
