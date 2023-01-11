export const statutsSchema = {
  "apprenant.nouveau_statut": {
    autosave: false,
  },
  "apprenant.historique_statut[].date_statut": {
    label: "Date de changement de statut",
    fieldType: "date",
    locked: true,
  },
  "apprenant.historique_statut[].valeur_statut": {
    fieldType: "select",
    label: "Statut :",
    locked: true,
    options: [
      {
        label: "Inscrit en formation",
        value: 2,
      },
      {
        label: "En contrat, apprenti",
        value: 3,
      },
      {
        label: "Abandon",
        value: 0,
      },
    ],
  },
  "apprenant.historique_statut[].date_reception": {
    label: "Date de reception du statut",
    fieldType: "date",
    locked: true,
  },
};
