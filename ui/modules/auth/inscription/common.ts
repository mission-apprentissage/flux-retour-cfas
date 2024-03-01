import { IOrganisationCreate } from "shared";

export type SetterOrganisation = (o: IOrganisationCreate | null) => void;

export type SetterHideBackNextButton = (o: boolean) => void;

// TODO plutôt supprimer ce système de formulaire un peu commun pour avoir des formulaires d'inscription séparés
// plutôt que des propriétés facultatives juste pour le type OF
export type InscriptionOrganistionChildProps = {
  organisation?: IOrganisationCreate | null;
  setOrganisation: SetterOrganisation;
  setHideBackNextButtons?: SetterHideBackNextButton;
};
