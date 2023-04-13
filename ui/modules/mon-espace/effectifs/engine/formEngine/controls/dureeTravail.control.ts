export const dureeTravailControl = [
  {
    deps: ["contrat.dureeTravailHebdoHeures", "contrat.dureeTravailHebdoMinutes"],
    process: ({ values }) => {
      if (values.contrat.dureeTravailHebdoHeures >= 40 && values.contrat.dureeTravailHebdoMinutes) {
        return { error: "la durée de travail hebdomadaire en heures ne peut excéder 40h" };
      }
    },
  },
];
