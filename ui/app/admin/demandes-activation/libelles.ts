import { IDemandeActivationLigne } from "shared/models/routes/admin/demandes-activation.api";

export const nomCfa = (demande: IDemandeActivationLigne) =>
  demande.organisme?.nom ?? (demande.organisme ? "CFA sans nom" : "Organisme non trouvé");
