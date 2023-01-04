export const createCopyRules = ({ mapping, copyIf }) => {
  return Object.entries(mapping).map(([from, target]) => ({
    deps: [from, target],
    process: ({ values, fields }) => {
      if (copyIf({ values })) {
        return {
          cascade: {
            [target]: {
              value: fields[from].value,
              cascade: false,
            },
          },
        };
      }
    },
  }));
};
