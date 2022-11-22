import { DateTime } from "luxon";

export const ContratDatesControl = [
  {
    deps: ["contrat.dateDebutContrat", "contrat.dateEffetAvenant"],
    process: ({ values }) => {
      if (!values.contrat.dateDebutContrat || !values.contrat.dateEffetAvenant) return;
      const dateDebutContrat = DateTime.fromISO(values.contrat.dateDebutContrat).setLocale("fr-FR");
      const dateEffetAvenant = DateTime.fromISO(values.contrat.dateEffetAvenant).setLocale("fr-FR");
      if (dateDebutContrat > dateEffetAvenant) {
        return {
          error: "La date de début de contrat ne peut pas être après la date d'effet de l'avenant",
        };
      }
    },
  },
  {
    deps: ["contrat.dateFinContrat", "contrat.dateEffetAvenant"],
    process: ({ values }) => {
      if (!values.contrat.dateFinContrat || !values.contrat.dateEffetAvenant) return;
      const dateFinContrat = DateTime.fromISO(values.contrat.dateFinContrat).setLocale("fr-FR");
      const dateEffetAvenant = DateTime.fromISO(values.contrat.dateEffetAvenant).setLocale("fr-FR");
      if (dateEffetAvenant > dateFinContrat) {
        return {
          error: "La date de fin de contrat ne peut pas être avant la date d'effet de l'avenant",
        };
      }
    },
  },
  {
    deps: ["contrat.dateDebutContrat", "formation.dateDebutFormation"],
    process: ({ values }) => {
      if (!values.contrat.dateDebutContrat || !values.formation.dateDebutFormation) return;
      const dateDebutContrat = DateTime.fromISO(values.contrat.dateDebutContrat).setLocale("fr-FR");
      const dateDebutFormation = DateTime.fromISO(values.formation.dateDebutFormation).setLocale("fr-FR");

      if (dateDebutContrat < dateDebutFormation.minus({ months: 3 })) {
        return {
          error: "Le contrat peut commencer au maximum 3 mois avant le début de la formation",
        };
      }
    },
  },
  {
    deps: ["contrat.dateDebutContrat", "formation.dateDebutFormation"],
    process: ({ values }) => {
      if (!values.contrat.dateDebutContrat || !values.formation.dateDebutFormation) return;
      const dateDebutContrat = DateTime.fromISO(values.contrat.dateDebutContrat).setLocale("fr-FR");
      const dateDebutFormation = DateTime.fromISO(values.formation.dateDebutFormation).setLocale("fr-FR");

      if (dateDebutContrat < dateDebutFormation.minus({ months: 3 })) {
        return {
          error: "Le contrat peut commencer au maximum 3 mois avant le début de la formation",
        };
      }
    },
  },
  {
    deps: ["contrat.dateFinContrat", "formation.dateFinFormation"],
    process: ({ values }) => {
      if (!values.contrat.dateFinContrat || !values.formation.dateFinFormation) return;
      const dateFinContrat = DateTime.fromISO(values.contrat.dateFinContrat).setLocale("fr-FR");
      const dateFinFormation = DateTime.fromISO(values.formation.dateFinFormation).setLocale("fr-FR");

      if (dateFinContrat > dateFinFormation.plus({ months: 3 })) {
        return {
          error: "Le contrat peut se terminer au maximum 3 mois après la fin de la formation",
        };
      }
    },
  },
  {
    deps: ["contrat.dateDebutContrat", "contrat.dateFinContrat"],
    process: ({ values }) => {
      if (!values.contrat.dateDebutContrat || !values.contrat.dateFinContrat) return;
      const dateDebutContrat = DateTime.fromISO(values.contrat.dateDebutContrat).setLocale("fr-FR");
      const dateFinContrat = DateTime.fromISO(values.contrat.dateFinContrat).setLocale("fr-FR");
      const dureeContrat = dateFinContrat.diff(dateDebutContrat, "months").months;
      if (dureeContrat < 0) {
        return {
          error: "La date de début de contrat ne peut pas être après la date de fin de contrat",
        };
      }
    },
  },
  {
    deps: ["contrat.dateDebutContrat", "contrat.dateFinContrat"],
    process: ({ values }) => {
      if (!values.contrat.dateDebutContrat || !values.contrat.dateFinContrat) return;
      const dateDebutContrat = DateTime.fromISO(values.contrat.dateDebutContrat).setLocale("fr-FR");
      const dateFinContrat = DateTime.fromISO(values.contrat.dateFinContrat).setLocale("fr-FR");
      const dureeContrat = dateFinContrat.diff(dateDebutContrat, "months").months;
      if (dureeContrat < 6) {
        return { error: "La durée du contrat ne peut pas être inférieure à 6 mois" };
      }

      if (dureeContrat > 54) {
        return {
          error: "La durée du contrat ne peut pas être supérieure à 4 ans et 6 mois",
        };
      }

      return {
        cascade: {
          "contrat.dureeContrat": { value: dureeContrat },
        },
      };
    },
  },
  {
    deps: ["contrat.dateDebutContrat", "contrat.dateFinContrat"],
    process: ({ values }) => {
      if (!values.contrat.dateDebutContrat || !values.contrat.dateFinContrat) return;
      const dateDebutContrat = DateTime.fromISO(values.contrat.dateDebutContrat).setLocale("fr-FR");
      const dateFinContrat = DateTime.fromISO(values.contrat.dateFinContrat).setLocale("fr-FR");
      const dureeContrat = dateFinContrat.diff(dateDebutContrat, "months").months;
      if (dureeContrat > 54) {
        return {
          error: "La durée du contrat ne peut pas être supérieure à 4 ans et 6 mois",
        };
      }
    },
  },
];
