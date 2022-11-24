import { DateTime } from "luxon";
import { caclAgeAtDate } from "../../../../common/utils/formUtils";

export const maitresControl = [
  {
    deps: ["maitre1.dateNaissance"],
    process: ({ values }) => {
      if (!values.maitre1.dateNaissance || !values.contrat.dateDebutContrat) {
        return;
      }
      const maitreDateNaissance = DateTime.fromISO(values.maitre1.dateNaissance).setLocale("fr-FR");
      const today = DateTime.now().setLocale("fr-FR");
      if (maitreDateNaissance > today) {
        return { error: "La date de naissance ne peut pas être dans le futur" };
      }
    },
  },
  {
    deps: ["maitre1.dateNaissance", "contrat.dateDebutContrat"],
    process: ({ values }) => {
      if (!values.maitre1.dateNaissance || !values.contrat.dateDebutContrat) {
        return;
      }
      const { age: ageDebutContrat } = caclAgeAtDate(values.maitre1.dateNaissance, values.contrat.dateDebutContrat);

      if (ageDebutContrat < 18) {
        return {
          error: "Le maître d'apprentissage doit avoir au moins 18 ans à la date de début d'exécution du contrat",
        };
      }
    },
  },
  {
    deps: ["maitre2.dateNaissance"],
    process: ({ values }) => {
      if (!values.maitre2.dateNaissance || !values.contrat.dateDebutContrat) {
        return;
      }
      const maitreDateNaissance = DateTime.fromISO(values.maitre2.dateNaissance).setLocale("fr-FR");
      const today = DateTime.now().setLocale("fr-FR");
      if (maitreDateNaissance > today) {
        return { error: "La date de naissance ne peut pas être dans le futur" };
      }
    },
  },
  {
    deps: ["maitre2.dateNaissance", "contrat.dateDebutContrat"],
    process: ({ values }) => {
      if (!values.maitre2.dateNaissance || !values.contrat.dateDebutContrat) {
        return;
      }
      const { age: ageDebutContrat } = caclAgeAtDate(values.maitre2.dateNaissance, values.contrat.dateDebutContrat);
      if (ageDebutContrat < 18) {
        return {
          error: "Le maître d'apprentissage doit avoir au moins 18 ans à la date de début d'exécution du contrat",
        };
      }
    },
  },
];
