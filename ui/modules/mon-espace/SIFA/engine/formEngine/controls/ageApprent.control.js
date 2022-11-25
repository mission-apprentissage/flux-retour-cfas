import { DateTime } from "luxon";
import { caclAgeAtDate } from "../../../../common/utils/formUtils";

export const ageApprentControl = [
  {
    deps: ["apprenti.dateNaissance"],
    process: ({ values }) => {
      const dateNaissance = DateTime.fromISO(values.apprenti.dateNaissance).setLocale("fr-FR");
      const today = DateTime.now().setLocale("fr-FR");

      if (dateNaissance > today) {
        return { error: "La date de naissance de peut pas être dans le futur" };
      }
    },
  },
  {
    deps: ["apprenti.dateNaissance", "contrat.dateDebutContrat"],
    process: ({ values }) => {
      if (!values.contrat.dateDebutContrat) return;
      const { exactAge: ageDebutContrat } = caclAgeAtDate(
        values.apprenti.dateNaissance,
        values.contrat.dateDebutContrat
      );
      if (ageDebutContrat <= 15) {
        return { error: "L'apprenti(e) doit avoir au moins 15 ans à la date de début d'exécution du contrat" };
      }
      return {
        cascade: {
          "apprenti.age": { value: ageDebutContrat },
        },
      };
    },
  },
];
