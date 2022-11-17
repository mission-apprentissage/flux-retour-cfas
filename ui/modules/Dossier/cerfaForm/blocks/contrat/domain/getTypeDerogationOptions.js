const TYPE_DEROGATIONS_OPTIONS = [
  {
    label: "11 Age de l'apprenti inférieur à 16 ans",
    value: 11,
    locked: true,
  },
  {
    label: "12 Age supérieur à 29 ans : cas spécifiques prévus dans le code du travail",
    value: 12,
    locked: true,
  },
  {
    label: "21 Réduction de la durée du contrat ou de la période d'apprentissage",
    value: 21,
    locked: true,
  },
  {
    label: "22 Allongement de la durée du contrat ou de la période d'apprentissage",
    value: 22,
    locked: true,
  },
  {
    label: "50 Cumul de dérogations",
    value: 50,
    locked: true,
  },
  {
    label: "60 Autre dérogation",
    value: 60,
    locked: true,
  },
];

export const getTypeDerogationOptions = ({ values }) => {
  const age = values.apprenti.age;

  if (!age) return TYPE_DEROGATIONS_OPTIONS;
  // 11 not allowed if age >= 16 à la date d'execution
  // if age  à la date d'execution < 16   type 11 ||  50
  // 12 not allowed age < 30  à la date d'execution
  // if age  à la date d'execution >= 30  type 12 ||  50
  return TYPE_DEROGATIONS_OPTIONS.map((option) => {
    let locked = false;

    if (age >= 30) {
      locked = ![12, 50].includes(option.value);
    } else if (age < 16) {
      locked = ![11, 50].includes(option.value);
    } else {
      if (age >= 16) {
        locked = [11].includes(option.value);
      }
      if (age < 30) {
        locked = [12].includes(option.value);
      }
    }
    return { ...option, locked };
  });
};
