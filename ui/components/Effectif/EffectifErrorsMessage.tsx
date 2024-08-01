import { Link } from "@chakra-ui/react";
import React from "react";
import { ORGANISME_LIEU_NOT_FOUND, ORGANISME_FORMATEUR_NOT_FOUND, ORGANISME_RESPONSABLE_NOT_FOUND } from "shared";

const organismeNotFound = (type: string) => (
  <>
    Couple UAI/SIRET du {type} non trouvé dans le{" "}
    <Link href="https://referentiel.apprentissage.onisep.fr/" isExternal textDecoration="underline" display="inline">
      Référentiel
    </Link>{" "}
    de l’apprentissage (ONISEP) et dans le{" "}
    <Link
      href="https://catalogue-apprentissage.intercariforef.org/"
      isExternal
      textDecoration="underline"
      display="inline"
    >
      Catalogue
    </Link>{" "}
    de l’apprentissage. Veuillez faire référencer votre{" "}
    <Link
      href="https://www.intercariforef.org/referencer-son-offre-de-formation"
      isExternal
      textDecoration="underline"
      display="inline"
    >
      offre de formation
    </Link>{" "}
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
