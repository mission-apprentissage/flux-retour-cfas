export const maitreSchema = {
  "maitre1.nom": {
    required: true,
    label: "Nom de naissance:",
    requiredMessage: "le nom du maître d'apprentissage est obligatoire",
  },
  "maitre1.prenom": {
    required: true,
    label: "Prénom:",
    requiredMessage: "le prénom du maître d'apprentissage est obligatoire",
  },
  "maitre1.dateNaissance": {
    required: true,
    fieldType: "date",
    showInfo: true,
    label: "Date de naissance :",
    requiredMessage: "la date de naissance du maître d'apprentissage est obligatoire",
  },
  "maitre2.nom": {
    label: "Nom de naissance:",
    requiredMessage: "le nom du maître d'apprentissage est obligatoire",
  },
  "maitre2.prenom": {
    label: "Prénom:",
    requiredMessage: "le prénom du maître d'apprentissage est obligatoire",
  },
  "maitre2.dateNaissance": {
    fieldType: "date",
    showInfo: true,
    label: "Date de naissance :",
    requiredMessage: "la date de naissance du maître d'apprentissage est obligatoire",
  },
  "employeur.attestationEligibilite": {
    fieldType: "consent",
    label:
      "L'employeur atteste sur l'honneur que le(s) maître(s) d'apprentissage répond à l'ensemble des critères d'éligibilité à cette fonction.",
    required: true,
    showInfo: true,
    requiredMessage:
      "Il est obligatoire d'attester que le(s) maître(s) d'apprentissage répond à l'ensemble des critères d'éligibilité à cette fonction ",
  },
};
