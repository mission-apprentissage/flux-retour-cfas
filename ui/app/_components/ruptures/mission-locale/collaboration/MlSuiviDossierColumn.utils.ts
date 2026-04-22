import { CONNAISSANCE_ML_ENUM, IUpdateMissionLocaleEffectif, SITUATION_ENUM } from "shared";

export interface FormValues {
  contactReussi: boolean | null;
  rdvPris: boolean | null;
  situationNon: string | null;
  situationNonContact: "tentative_relancer" | "mauvaises_coordonnees" | null;
  problemeRecontact: "mauvaises_coordonnees" | "ne_souhaite_pas" | "autre" | null;
  actionRecontact: "garder_liste" | "marquer_traite" | null;
  situationJeune: string | null;
  commentaire: string;
}

export function mapFormToPayload(
  values: FormValues,
  isRecontacterFlow: boolean,
  isNouveauContrat: boolean
): IUpdateMissionLocaleEffectif {
  const payload: IUpdateMissionLocaleEffectif = {};

  if (values.contactReussi === true) {
    if (values.rdvPris === true) {
      payload.situation = SITUATION_ENUM.RDV_PRIS;
    } else {
      switch (values.situationNon) {
        case "contrat_apprentissage":
          payload.situation = SITUATION_ENUM.NOUVEAU_CONTRAT;
          break;
        case "cdi_cdd":
          payload.situation = SITUATION_ENUM.NOUVEAU_PROJET;
          break;
        case "cherche_contrat":
          payload.situation = SITUATION_ENUM.CHERCHE_CONTRAT;
          break;
        case "reorientation":
          payload.situation = SITUATION_ENUM.REORIENTATION;
          break;
        case "ne_veut_pas":
          payload.situation = SITUATION_ENUM.NE_VEUT_PAS_ACCOMPAGNEMENT;
          break;
        case "autre":
          payload.situation = SITUATION_ENUM.AUTRE;
          break;
      }
    }
  } else if (values.contactReussi === false) {
    if (isRecontacterFlow) {
      if (values.actionRecontact === "garder_liste") {
        payload.situation = SITUATION_ENUM.CONTACTE_SANS_RETOUR;
      } else if (values.actionRecontact === "marquer_traite") {
        switch (values.problemeRecontact) {
          case "mauvaises_coordonnees":
            payload.situation = SITUATION_ENUM.COORDONNEES_INCORRECT;
            break;
          case "ne_souhaite_pas":
            payload.situation = SITUATION_ENUM.NE_VEUT_PAS_ACCOMPAGNEMENT;
            break;
          case "autre":
            payload.situation = SITUATION_ENUM.AUTRE;
            break;
        }
      }
    } else if (isNouveauContrat) {
      if (values.actionRecontact === "garder_liste") {
        payload.situation = SITUATION_ENUM.CONTACTE_SANS_RETOUR;
      } else if (values.actionRecontact === "marquer_traite") {
        payload.situation = SITUATION_ENUM.NOUVEAU_CONTRAT;
      }
    } else {
      if (values.situationNonContact === "tentative_relancer") {
        payload.situation = SITUATION_ENUM.CONTACTE_SANS_RETOUR;
      } else if (values.situationNonContact === "mauvaises_coordonnees") {
        payload.situation = SITUATION_ENUM.COORDONNEES_INCORRECT;
      }
    }
  }

  if (!isRecontacterFlow || values.contactReussi === true) {
    if (values.situationJeune === "accompagne") {
      payload.connaissance_ml = CONNAISSANCE_ML_ENUM.DEJA_ACCOMPAGNE_ACTIVEMENT;
      payload.deja_connu = true;
    } else if (values.situationJeune === "connu") {
      payload.connaissance_ml = CONNAISSANCE_ML_ENUM.CONNU_NON_ACCOMPAGNE;
      payload.deja_connu = true;
    } else if (values.situationJeune === "inconnu") {
      payload.connaissance_ml = CONNAISSANCE_ML_ENUM.NON_CONNU;
      payload.deja_connu = false;
    }
  }

  if (values.commentaire) {
    payload.commentaires = values.commentaire;
  }

  return payload;
}
