import { buildRemuneration } from "../../cerfaForm/domain/buildRemuneration";

const getTauxFromRemunerationsAnnuelles = (remunerationsAnnuelles) => {
  return Object.fromEntries(remunerationsAnnuelles.map((annee) => [annee.ordre, annee.taux]));
};

export const RemunerationsControl = [
  {
    deps: [
      "employeur.adresse.departement",
      "apprenti.dateNaissance",
      "contrat.dateDebutContrat",
      "contrat.dateFinContrat",
      "apprenti.age",
    ],
    process: ({ values }) => {
      const employeurAdresseDepartement = values.employeur.adresse.departement;
      const apprentiDateNaissance = values.apprenti.dateNaissance;
      const apprentiAge = values.apprenti.age;
      const dateDebutContrat = values.contrat.dateDebutContrat;
      const dateFinContrat = values.contrat.dateFinContrat;

      if (
        !apprentiDateNaissance ||
        !apprentiAge ||
        !dateDebutContrat ||
        !dateFinContrat ||
        !employeurAdresseDepartement
      ) {
        return;
      }

      const oldRemus = values.contrat.remunerationsAnnuelles ?? [];
      const { remunerationsAnnuelles, smicObj } = buildRemuneration({
        apprentiDateNaissance,
        apprentiAge,
        dateDebutContrat,
        dateFinContrat,
        employeurAdresseDepartement,
        selectedTaux: getTauxFromRemunerationsAnnuelles(oldRemus),
      });

      const oldRemusCascade = Object.fromEntries(
        oldRemus?.flatMap((remu, i) => [
          [`contrat.remunerationsAnnuelles[${i}].dateDebut`, undefined],
          [`contrat.remunerationsAnnuelles[${i}].dateFin`, undefined],
          [`contrat.remunerationsAnnuelles[${i}].taux`, undefined],
          [`contrat.remunerationsAnnuelles[${i}].tauxMinimal`, undefined],
          [`contrat.remunerationsAnnuelles[${i}].typeSalaire`, undefined],
          [`contrat.remunerationsAnnuelles[${i}].salaireBrut`, undefined],
          [`contrat.remunerationsAnnuelles[${i}].ordre`, undefined],
        ])
      );

      const newRemus = Object.fromEntries(
        remunerationsAnnuelles?.flatMap((remu, i) => {
          return [
            [`contrat.remunerationsAnnuelles[${i}].dateDebut`, { value: remu.dateDebut }],
            [`contrat.remunerationsAnnuelles[${i}].dateFin`, { value: remu.dateFin }],
            [`contrat.remunerationsAnnuelles[${i}].taux`, { value: remu.taux, min: remu.tauxMinimal }],
            [`contrat.remunerationsAnnuelles[${i}].tauxMinimal`, { value: remu.tauxMinimal }],
            [`contrat.remunerationsAnnuelles[${i}].typeSalaire`, { value: remu.typeSalaire }],
            [`contrat.remunerationsAnnuelles[${i}].salaireBrut`, { value: remu.salaireBrut }],
            [`contrat.remunerationsAnnuelles[${i}].ordre`, { value: remu.ordre }],
          ];
        })
      );

      return { cascade: { ...oldRemusCascade, ...newRemus, "contrat.smic": { value: smicObj } } };
    },
  },
  ...new Array(16).fill(0).map((item, i) => {
    const remuAnneePath = `contrat.remunerationsAnnuelles[${i}]`;
    return {
      deps: [`${remuAnneePath}.taux`],
      process: ({ values }) => {
        const remunerationsAnnee = values.contrat.remunerationsAnnuelles[i];
        const employeurAdresseDepartement = values.employeur.adresse.departement;
        const apprentiDateNaissance = values.apprenti.dateNaissance;
        const apprentiAge = values.apprenti.age;
        const dateDebutContrat = values.contrat.dateDebutContrat;
        const dateFinContrat = values.contrat.dateFinContrat;

        const { remunerationsAnnuelles } = buildRemuneration({
          apprentiDateNaissance,
          apprentiAge,
          dateDebutContrat,
          dateFinContrat,
          employeurAdresseDepartement,
          selectedTaux: { [remunerationsAnnee.ordre + ""]: remunerationsAnnee.taux },
        });

        return {
          cascade: {
            [`${remuAnneePath}.dateDebut`]: { value: remunerationsAnnuelles[i].dateDebut },
            [`${remuAnneePath}.dateFin`]: { value: remunerationsAnnuelles[i].dateFin },
            [`${remuAnneePath}.taux`]: {
              value: remunerationsAnnuelles[i].taux,
              min: remunerationsAnnuelles[i].tauxMinimal,
            },
            [`${remuAnneePath}.tauxMinimal`]: { value: remunerationsAnnuelles[i].tauxMinimal },
            [`${remuAnneePath}.typeSalaire`]: { value: remunerationsAnnuelles[i].typeSalaire },
            [`${remuAnneePath}.salaireBrut`]: { value: remunerationsAnnuelles[i].salaireBrut },
            [`${remuAnneePath}.ordre`]: { value: remunerationsAnnuelles[i].ordre },
          },
        };
      },
    };
  }),
  {
    deps: ["contrat.remunerationsAnnuelles[0].salaireBrut"],
    process: ({ values }) => {
      return {
        cascade: {
          "contrat.salaireEmbauche": { value: values.contrat.remunerationsAnnuelles[0].salaireBrut },
        },
      };
    },
  },
];
