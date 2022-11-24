import { DateTime } from "luxon";

export const dateFormationControl = [
  {
    deps: ["formation.dateDebutFormation", "formation.dateFinFormation"],
    process: ({ values }) => {
      if (!values.formation.dateDebutFormation || !values.formation.dateFinFormation) return;
      const dateDebutFormation = DateTime.fromISO(values.formation.dateDebutContrat).setLocale("fr-FR");
      const dateFinFormation = DateTime.fromISO(values.formation.dateDebutContrat).setLocale("fr-FR");

      const diffInMonths = dateFinFormation.diff(dateDebutFormation, "months");
      const dureeFormationCalc = diffInMonths.months;

      if (dateDebutFormation >= dateFinFormation) {
        return {
          error: "Date de début du cycle de formation ne peut pas être après la date de fin du cycle",
        };
      }

      if (dureeFormationCalc < 6) {
        return {
          error: "La durée de la formation de peut pas être inférieure à 6 mois",
        };
      }

      if (dureeFormationCalc > 48) {
        return {
          error: "La durée de la formation de peut pas être supérieure à 4 ans",
        };
      }
    },
  },
  {
    deps: ["formation.dureeFormation"],
    process: ({ values }) => {
      const dureeFormation = values.formation.dureeFormation;

      if (dureeFormation > 9999) {
        return {
          error: "la durée de la formation ne peut excéder 9999",
        };
      }
    },
  },
];
