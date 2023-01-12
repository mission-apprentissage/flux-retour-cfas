export const idccControl = [
  {
    deps: ["employeur.codeIdcc"],
    process: ({ values, fields }) => {
      const codeIdcc = values.employeur.codeIdcc;
      const index = fields["employeur.codeIdcc"].enum.indexOf(codeIdcc);
      if (index < 0) {
        return { error: "Le code IDCC n'est pas valide" };
      }

      return {
        cascade: {
          "employeur.codeIdcc_special": { value: codeIdcc },
          "employeur.libelleIdcc": { value: fields["employeur.libelleIdcc"].enum[index].trim() },
        },
      };
    },
  },
  {
    deps: ["employeur.codeIdcc_special"],
    process: ({ values, fields }) => {
      const codeIdcc = values.employeur.codeIdcc_special;

      const index = fields["employeur.codeIdcc"].enum.indexOf(codeIdcc);
      if (index === -1) return;

      const libelleIdcc = fields["employeur.libelleIdcc"].enum[index];

      return {
        cascade: {
          "employeur.codeIdcc": { value: codeIdcc },
          "employeur.libelleIdcc": { value: libelleIdcc.trim() },
        },
      };
    },
  },
];
